const https = require('https');
const { v4: uuidv4 } = require('uuid');
const { fetchNaverSearchAdVolume } = require('./searchAdCollector');
const { fetchNaverDatalabShopping } = require('./datalabCollector');
const { fetchSerpApiNaverShopping } = require('./serpApiCollector');
const { getCanonicalProductIdentity } = require('./productIdentity');

/**
 * 1) 실시간 네이버 연관 키워드 수집기 (Live Connected)
 */
function fetchLiveNaverKeywords(keyword) {
  return new Promise((resolve) => {
    const enc = encodeURIComponent(keyword);
    const url = `https://ac.search.naver.com/nx/ac?q_enc=UTF-8&st=100&r_format=json&q=${enc}`;

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const rawList = json?.items?.[0] || [];
          const keywords = rawList.map(item => item[0]).filter(Boolean);
          resolve({
            status: 'LIVE_COLLECTED',
            source: url,
            statusCode: res.statusCode,
            keywords: keywords
          });
        } catch (e) {
          resolve({
            status: 'PARSE_ERROR',
            source: url,
            statusCode: res.statusCode,
            keywords: []
          });
        }
      });
    }).on('error', (err) => {
      resolve({
        status: 'NETWORK_ERROR',
        source: url,
        statusCode: null,
        error: err.message,
        keywords: []
      });
    });
  });
}

/**
 * Deduplicate only positively identified products. UNKNOWN products are retained.
 */
function deduplicateProducts(products) {
  const uniqueMap = new Map();

  for (const prod of products) {
    const key = getCanonicalProductIdentity(prod).identity;

    if (!key) {
      uniqueMap.set(`unknown_${uniqueMap.size}`, { ...prod });
      continue;
    }

    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, { ...prod });
    } else {
      const existing = uniqueMap.get(key);
      const existingIsRich = existing.is_catalog && existing.is_catalog !== 'UNKNOWN';
      const newIsRich = prod.is_catalog && prod.is_catalog !== 'UNKNOWN';

      if (!existingIsRich && newIsRich) {
        uniqueMap.set(key, {
          ...prod,
          rank: Math.min(existing.rank || 99, prod.rank || 99)
        });
      } else if (newIsRich) {
        uniqueMap.set(key, {
          ...existing,
          is_catalog: existing.is_catalog || prod.is_catalog,
          cat_id: existing.cat_id || prod.cat_id,
          catalog_id: existing.catalog_id || prod.catalog_id,
          nv_mid: existing.nv_mid || prod.nv_mid,
          seller_count: existing.seller_count !== null ? existing.seller_count : prod.seller_count,
          catalog_min_price: existing.catalog_min_price !== null ? existing.catalog_min_price : prod.catalog_min_price,
          catalog_detection_source: existing.catalog_detection_source !== 'UNKNOWN' ? existing.catalog_detection_source : prod.catalog_detection_source
        });
      }
    }
  }

  const dedupedList = Array.from(uniqueMap.values());
  return dedupedList.map((p, idx) => ({
    ...p,
    rank: idx + 1
  }));
}

/**
 * Fetch 20 real products by combining primary keyword and real AC related keywords from SerpApi
 */
async function fetchExpandedSerpApiProducts(keyword, relatedKeywords = [], targetCount = 20) {
  const primaryResult = await fetchSerpApiNaverShopping(keyword);
  let allProducts = primaryResult.top_products ? [...primaryResult.top_products] : [];

  const subQueries = (relatedKeywords || [])
    .filter(kw => kw && kw.trim() !== keyword.trim())
    .slice(0, 4);

  for (const subKw of subQueries) {
    if (allProducts.length >= targetCount + 5) break;
    try {
      const subResult = await fetchSerpApiNaverShopping(subKw);
      if (subResult.top_products && subResult.top_products.length > 0) {
        allProducts.push(...subResult.top_products);
      }
    } catch (e) {
      console.warn(`[marketCollector] Failed subquery for ${subKw}:`, e.message);
    }
  }

  const deduped = deduplicateProducts(allProducts);
  return {
    status: primaryResult.status,
    source: primaryResult.source,
    top_products: deduped.slice(0, Math.max(targetCount, deduped.length))
  };
}

/**
 * 2) Market Research Engine V2.0 - 4대 소스 통합 파이프라인 (20개 실제 상품 기본 로드)
 */
async function analyzeMarketData(rawKeyword) {
  const keyword = (rawKeyword || '').trim();
  if (!keyword) {
    throw new Error('키워드를 입력해주세요.');
  }

  const collectedAt = new Date().toISOString();

  // 1. [공식] 네이버 SearchAd API 실시간 검색량 수집
  const searchAdResult = await fetchNaverSearchAdVolume(keyword);

  // 2. [공식] 네이버 실시간 연관 키워드 수집 (AC)
  const keywordResult = await fetchLiveNaverKeywords(keyword);

  // 3. [공식] 네이버 DataLab 쇼핑인사이트 트렌드 수집
  const datalabResult = await fetchNaverDatalabShopping(keyword);

  // 4. [상용] SerpApi 네이버 쇼핑 상품 20개 수집 (기본 20개 실상품)
  const serpResult = await fetchExpandedSerpApiProducts(keyword, keywordResult.keywords, 20);

  // 연관 키워드 포맷팅
  const relatedKeywords = keywordResult.keywords.map(kw => ({
    keyword: kw,
    search_volume: null,
    products: null,
    competition: null
  }));

  // 가격 통계 산출 (SerpApi 실시간 상품이 있는 경우)
  let avgPrice = null;
  let medianPrice = null;
  let minPrice = null;
  let maxPrice = null;
  let avgReviews = null;
  let medianReviews = null;
  let priceDistribution = [];

  if (serpResult.top_products && serpResult.top_products.length > 0) {
    const prices = serpResult.top_products.map(p => p.price).filter(p => p > 0).sort((a, b) => a - b);
    if (prices.length > 0) {
      minPrice = prices[0];
      maxPrice = prices[prices.length - 1];
      const sum = prices.reduce((acc, cur) => acc + cur, 0);
      avgPrice = Math.round(sum / prices.length);
      const mid = Math.floor(prices.length / 2);
      medianPrice = prices.length % 2 !== 0 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);
    }

    const reviews = serpResult.top_products.map(p => p.reviewCount).filter(r => typeof r === 'number' && r >= 0).sort((a, b) => a - b);
    if (reviews.length > 0) {
      avgReviews = Math.round(reviews.reduce((a, b) => a + b, 0) / reviews.length);
      const midR = Math.floor(reviews.length / 2);
      medianReviews = reviews.length % 2 !== 0 ? reviews[midR] : Math.round((reviews[midR - 1] + reviews[midR]) / 2);
    }
  }

  const diagnosticNotes = [];

  // SearchAd 진단
  if (searchAdResult.status === 'LIVE_COLLECTED') {
    diagnosticNotes.push(
      `[네이버 검색광고]: 월간 총 검색량 ${searchAdResult.monthly_search_total?.toLocaleString()}회 (PC ${searchAdResult.monthly_search_pc?.toLocaleString()} / 모바일 ${searchAdResult.monthly_search_mobile?.toLocaleString()}) 실시간 조회 완료`
    );
  } else {
    diagnosticNotes.push(`[네이버 검색광고]: ${searchAdResult.reason || searchAdResult.status}`);
  }

  // DataLab 진단
  if (datalabResult.status === 'LIVE_COLLECTED') {
    diagnosticNotes.push(
      `[네이버 데이터랩]: 최근 30일 쇼핑 클릭 트렌드 ${datalabResult.trend_status === 'RISING' ? '📈 급상승' : datalabResult.trend_status === 'DECLINING' ? '📉 하강' : '➡️ 안정/유지'} 분석 완료`
    );
  } else {
    diagnosticNotes.push(`[네이버 데이터랩]: ${datalabResult.reason || datalabResult.status}`);
  }

  // SerpApi 진단
  if (serpResult.status === 'LIVE_COLLECTED') {
    diagnosticNotes.push(
      `[네이버 쇼핑 상품]: SerpApi로부터 상위 ${serpResult.top_products.length}개 실상품, 실제 판매가, 리뷰 수, 카탈로그 식별 완료`
    );
  } else {
    diagnosticNotes.push(`[네이버 쇼핑 상품]: ${serpResult.reason || serpResult.status}`);
  }

  // AC 연관어 진단
  diagnosticNotes.push(
    `[네이버 실시간 연관어]: 네이버 공식 AC 엔드포인트에서 ${keywordResult.keywords.length}개 연관 검색어 수집 완료`
  );

  return {
    id: uuidv4(),
    keyword: keyword,
    search_volume_status: searchAdResult.status,
    monthly_search_total: searchAdResult.monthly_search_total,
    monthly_search_pc: searchAdResult.monthly_search_pc,
    monthly_search_mobile: searchAdResult.monthly_search_mobile,
    total_products: null,
    competition_ratio: null,
    avg_price: avgPrice,
    median_price: medianPrice,
    min_price: minPrice,
    max_price: maxPrice,
    price_distribution: priceDistribution,
    top_products: serpResult.top_products || [],
    avg_review_count: avgReviews,
    median_review_count: medianReviews,
    trend_status: datalabResult.trend_status || 'UNKNOWN',
    trend_data: datalabResult.trend_data || [],
    related_keywords: relatedKeywords,
    opportunity_score: null,
    recommendation: 'HOLD',
    recommendation_reasons: diagnosticNotes,
    field_sources: {
      search_volume_total: searchAdResult.source + ' [' + searchAdResult.status + ']',
      search_volume_pc: searchAdResult.source + ' [' + searchAdResult.status + ']',
      search_volume_mobile: searchAdResult.source + ' [' + searchAdResult.status + ']',
      shopping_trend: datalabResult.source + ' [' + datalabResult.status + ']',
      top_products: serpResult.source + ' [' + serpResult.status + ']',
      related_keywords: keywordResult.source + ' [LIVE_COLLECTED]'
    },
    data_source: 'Market Research Engine V2.0 (SearchAd + DataLab + SerpApi + AC Live)',
    collected_at: collectedAt,
    created_at: collectedAt
  };
}

/**
 * Fetch more products for an existing market report (Load More / Pagination)
 */
async function fetchMoreMarketProducts(keyword, existingProducts = [], batchIndex = 1) {
  const keywordResult = await fetchLiveNaverKeywords(keyword);
  const acKeywords = keywordResult.keywords || [];

  // Pick the next slice of related keywords based on batchIndex
  const startIdx = 3 + (batchIndex - 1) * 3;
  const subQueries = acKeywords.slice(startIdx, startIdx + 3);

  // If we run out of AC keywords, fallback to common modifier extensions
  if (subQueries.length === 0) {
    const modifiers = ['남성', '여성', '방수', '고프코어', '가벼운', '데일리', '여름', '아웃도어', '스트릿'];
    for (const mod of modifiers) {
      if (subQueries.length >= 3) break;
      const candidate = `${mod} ${keyword}`;
      if (!subQueries.includes(candidate)) {
        subQueries.push(candidate);
      }
    }
  }

  let newCollected = [];
  for (const subKw of subQueries) {
    try {
      const subResult = await fetchSerpApiNaverShopping(subKw);
      if (subResult.top_products && subResult.top_products.length > 0) {
        newCollected.push(...subResult.top_products);
      }
    } catch (e) {
      console.warn(`[fetchMoreMarketProducts] Subquery failed for ${subKw}:`, e.message);
    }
  }

  // Combine and deduplicate
  const allCombined = [...existingProducts, ...newCollected];
  const dedupedAll = deduplicateProducts(allCombined);
  
  // Calculate newly added items
  const existingCount = existingProducts.length;
  const newProducts = dedupedAll.slice(existingCount);

  return {
    success: true,
    newProducts,
    allProducts: dedupedAll,
    totalCount: dedupedAll.length
  };
}

module.exports = {
  analyzeMarketData,
  fetchMoreMarketProducts,
  fetchLiveNaverKeywords,
  fetchNaverSearchAdVolume,
  fetchNaverDatalabShopping,
  fetchSerpApiNaverShopping
};
