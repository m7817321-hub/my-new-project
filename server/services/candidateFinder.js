const { v4: uuidv4 } = require('uuid');
const { getCanonicalProductIdentity } = require('./productIdentity');

/**
 * 대형 브랜드 공식몰 / 플랫폼 식별 키워드
 */
const BRAND_IDENTIFIERS = [
  '공식', 'official', '나이키', 'nike', '아디다스', 'adidas', '뉴에라', 'new era',
  '랄프로렌', 'ralph lauren', 'rrl', '노스페이스', 'the north face', '스노우피크',
  'snow peak', '룰루레몬', 'lululemon', '29cm', '무신사', 'musinsa', 'ssf샵', 'w컨셉'
];

/**
 * 문자열 정규화 (중복 판별용)
 */
/** 상품 고유 식별 키 생성 (nv_mid -> normalized URL -> explicit existing id). */
function getProductDedupeKey(prod) {
  return getCanonicalProductIdentity(prod).identity;
}

/**
 * Candidate Finder V1 - 실데이터 기반 상품 후보 압축기
 * 
 * @param {Object} report - analyzeMarketData 결과 리포트
 * @returns {Array} compressedCandidates - 압축 분류된 상품 후보 배열
 */
function extractProductCandidates(report) {
  if (!report || !report.top_products || report.top_products.length === 0) {
    return [];
  }

  const rawProducts = report.top_products;
  const uniqueMap = new Map();

  // 1. 중복 제거 및 카탈로그 메타데이터 보존 병합 (nv_mid -> productUrl -> mallName_title)
  for (const prod of rawProducts) {
    const dedupKey = getProductDedupeKey(prod);

    // UNKNOWN means there is no safe basis for asserting two listings are the
    // same product. Keep both; titles are deliberately never used as a guess.
    if (!dedupKey) {
      uniqueMap.set(`unknown_${uniqueMap.size}`, { ...prod });
      continue;
    }

    if (!uniqueMap.has(dedupKey)) {
      uniqueMap.set(dedupKey, { ...prod });
    } else {
      const existing = uniqueMap.get(dedupKey);
      const existingIsRich = existing.is_catalog && existing.is_catalog !== 'UNKNOWN';
      const newIsRich = prod.is_catalog && prod.is_catalog !== 'UNKNOWN';

      if (!existingIsRich && newIsRich) {
        // 광고 등 정보 누락 아이템을 카탈로그 메타데이터가 풍부한 자연노출 아이템으로 업그레이드
        uniqueMap.set(dedupKey, {
          ...prod,
          rank: Math.min(existing.rank || 99, prod.rank || 99)
        });
      } else if (newIsRich) {
        // 기존 풍부 데이터에 추가 누락 필드 보강
        uniqueMap.set(dedupKey, {
          ...existing,
          is_catalog: (existing.is_catalog && existing.is_catalog !== 'UNKNOWN') ? existing.is_catalog : prod.is_catalog,
          cat_id: existing.cat_id || prod.cat_id,
          catalog_id: existing.catalog_id || prod.catalog_id,
          nv_mid: existing.nv_mid || prod.nv_mid,
          seller_count: existing.seller_count !== null ? existing.seller_count : prod.seller_count,
          catalog_min_price: existing.catalog_min_price !== null ? existing.catalog_min_price : prod.catalog_min_price,
          catalog_detection_source: (existing.catalog_detection_source && existing.catalog_detection_source !== 'UNKNOWN') ? existing.catalog_detection_source : prod.catalog_detection_source
        });
      }
    }
  }

  const dedupedProducts = Array.from(uniqueMap.values());
  const candidates = [];

  // 2. 개별 상품 평가 및 상태 분류
  for (const prod of dedupedProducts) {
    const reasons = [];
    let brandType = 'SOHO';
    let status = 'WATCH';

    const price = prod.price;
    const mallName = prod.mallName || '';
    const title = prod.title || '';
    const reviewCount = prod.reviewCount;
    const isAd = !!prod.isAd;

    // A. 브랜드 유형 판별
    const isBrandOfficial = BRAND_IDENTIFIERS.some(b => 
      mallName.toLowerCase().includes(b) || title.toLowerCase().includes(b)
    );

    if (isBrandOfficial) {
      brandType = 'BRAND_OFFICIAL';
      reasons.push(`대형 브랜드/공식몰 (${mallName}): 브랜드 파워 기반 제품`);
    } else {
      brandType = 'SOHO';
      reasons.push(`소호몰/스마트스토어 (${mallName}): 소호 셀러 벤치마킹 우호적`);
    }

    // B. 광고 여부
    if (isAd) {
      reasons.push('네이버 쇼핑광고(AD) 노출 상품: 적극적 마케팅 집행 중');
    } else {
      reasons.push('오가닉(자연노출) 상위 상품: SEO 및 제품력 우수');
    }

    // C. 가격 여력 판별
    let priceTier = 'UNKNOWN';
    if (price !== null && price !== undefined) {
      if (price < 12000) {
        priceTier = 'LOW_MARGIN';
        reasons.push(`판매가 ₩${price.toLocaleString()}원: 출혈 저가 구간 (사입 마진 파괴 위험)`);
      } else if (price >= 18000 && price <= 45000) {
        priceTier = 'SWEET_SPOT';
        reasons.push(`판매가 ₩${price.toLocaleString()}원: 마진 스위트스팟 (35%~50% 마진 확보 적합)`);
      } else if (price > 45000 && price <= 70000) {
        priceTier = 'ACCEPTABLE';
        reasons.push(`판매가 ₩${price.toLocaleString()}원: 중고가 구간 (디자인/원단 차별화 필요)`);
      } else if (price > 70000) {
        priceTier = 'PREMIUM';
        reasons.push(`판매가 ₩${price.toLocaleString()}원: 고가 프리미엄 구간`);
      } else {
        priceTier = 'MODERATE';
        reasons.push(`판매가 ₩${price.toLocaleString()}원: 1.2만 ~ 1.8만 실속 구간`);
      }
    } else {
      reasons.push('판매가 데이터 누락 (UNKNOWN)');
    }

    // D. 리뷰 장벽 판별
    let reviewBarrier = 'UNKNOWN';
    if (reviewCount !== null && reviewCount !== undefined) {
      if (reviewCount > 2000) {
        reviewBarrier = 'HIGH_BARRIER';
        reasons.push(`리뷰 ${reviewCount.toLocaleString()}개: 시장 선점 고착화 장벽`);
      } else if (reviewCount <= 500) {
        reviewBarrier = 'LOW_BARRIER';
        reasons.push(`리뷰 ${reviewCount.toLocaleString()}개: 초기 20~30개 리뷰로 추격 가능`);
      } else {
        reviewBarrier = 'MODERATE';
        reasons.push(`리뷰 ${reviewCount.toLocaleString()}개: 중간 수준 장벽`);
      }
    } else {
      reasons.push('리뷰 수 미제공 (UNKNOWN - 감점하지 않음)');
    }

    // E. 카탈로그 속성 정보 전달 & 사유 추가
    const isCatalog = prod.is_catalog || 'UNKNOWN';
    const sellerCount = prod.seller_count !== undefined ? prod.seller_count : null;
    const catalogMinPrice = prod.catalog_min_price !== undefined ? prod.catalog_min_price : null;
    const catId = prod.cat_id || prod.catalog_id || null;
    const nvMid = prod.nv_mid || null;
    const catalogDetectionSource = prod.catalog_detection_source || 'UNKNOWN';

    if (isCatalog === 'YES' || isCatalog === true) {
      reasons.push(`동일상품 카탈로그: 네이버 등록 판매처 ${sellerCount || '여러'}개 가격 경쟁 (대표 최저가 ₩${(catalogMinPrice || price)?.toLocaleString()}원)`);
    } else if (isCatalog === 'NO' || isCatalog === false) {
      reasons.push(`단독 판매 상품: 단일 판매처 (${mallName}) 개별 상세페이지`);
    }

    // F. 최종 상태 결정 (INTEREST / WATCH / EXCLUDE / UNKNOWN) - 기존 규칙 100% 보존
    if (price === null) {
      status = 'UNKNOWN';
    } else if (priceTier === 'LOW_MARGIN' || (priceTier === 'PREMIUM' && brandType === 'BRAND_OFFICIAL') || (reviewBarrier === 'HIGH_BARRIER' && brandType === 'BRAND_OFFICIAL')) {
      status = 'EXCLUDE';
    } else if (brandType === 'SOHO' && (priceTier === 'SWEET_SPOT' || priceTier === 'ACCEPTABLE' || priceTier === 'MODERATE') && reviewBarrier !== 'HIGH_BARRIER') {
      status = 'INTEREST';
    } else {
      status = 'WATCH';
    }

    candidates.push({
      id: uuidv4(),
      report_id: report.id,
      keyword: report.keyword,
      rank: prod.rank,
      title: title,
      price: price,
      price_tier: priceTier,
      mall_name: mallName,
      brand_type: brandType,
      review_count: reviewCount,
      rating: prod.rating,
      is_ad: isAd,
      image_url: prod.imageUrl || '',
      product_url: prod.productUrl || '',
      // 카탈로그 식별 필드
      is_catalog: isCatalog,
      catalog_id: catId,
      cat_id: catId,
      nv_mid: nvMid,
      seller_count: sellerCount,
      catalog_min_price: catalogMinPrice,
      catalog_detection_source: catalogDetectionSource,
      status: status,
      reasons: reasons,
      created_at: new Date().toISOString()
    });
  }

  // INTEREST 우선, 그 다음 WATCH, EXCLUDE 순으로 정렬
  const statusOrder = { 'INTEREST': 1, 'WATCH': 2, 'UNKNOWN': 3, 'EXCLUDE': 4 };
  candidates.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));

  return candidates;
}

module.exports = {
  extractProductCandidates
};
