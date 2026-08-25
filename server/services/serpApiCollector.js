const https = require('https');

/**
 * SerpApi Naver Shopping Search Connector (with Catalog Detection V2)
 * 
 * - 엔드포인트: https://serpapi.com/search.json?engine=naver&query=...
 * - 환경변수: SERPAPI_KEY (SerpApi 계정 키)
 * 
 * - 카탈로그 판정 규칙:
 *    1. stores 필드에 '판매처 N' 형태로 제공되는 경우 -> is_catalog: 'YES' (true)
 *    2. stores 필드가 단일 상호명이고 frm=NVSCVUI인 경우 -> is_catalog: 'NO' (단독상품)
 *    3. 광고(AD)이거나 URL/판매자 정보가 불충분한 경우 -> is_catalog: 'UNKNOWN'
 *    4. nv_mid, cat_id는 자연노출 bridge URL 파라미터에서 안전하게 추출
 */
function fetchSerpApiNaverShopping(keyword) {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return Promise.resolve({
      status: 'UNKNOWN',
      source: 'SerpApi Naver Search (https://serpapi.com/search.json?engine=naver)',
      reason: 'SERPAPI_KEY is not configured in .env',
      top_products: [],
      prices: []
    });
  }

  const enc = encodeURIComponent(keyword);
  const path = `/search.json?engine=naver&query=${enc}&api_key=${apiKey}`;

  const options = {
    hostname: 'serpapi.com',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            const shoppingResults = json.shopping_results || [];
            
            const topProducts = shoppingResults.slice(0, 10).map((item, idx) => {
              const rawPrice = item.price ? Number(String(item.price).replace(/[^0-9]/g, '')) : null;
              const rawReviews = item.reviews !== undefined ? Number(String(item.reviews).replace(/[^0-9]/g, '')) : null;
              
              const link = item.link || '';
              const isAd = link.includes('ader.naver.com') || link.includes('npla') || !!item.is_ad;
              const storesStr = String(item.stores || item.source || '').trim();

              // URL 파라미터 파싱 (nv_mid, cat_id) 및 썸네일 경로 추출
              const nvMidMatch = link.match(/[?&]nv_mid=([0-9]+)/) || link.match(/\/catalog\/([0-9]+)/);
              const catIdMatch = link.match(/[?&]cat_id=([0-9]+)/);
              const thumbMidMatch = item.thumbnail ? item.thumbnail.match(/main_[0-9]+\/([0-9]+)/) : null;
              const thumbMidFallback = item.thumbnail ? item.thumbnail.match(/main_([0-9]+)/) : null;

              const nv_mid = nvMidMatch ? nvMidMatch[1] : (thumbMidMatch ? thumbMidMatch[1] : (thumbMidFallback ? thumbMidFallback[1] : null));
              const cat_id = catIdMatch ? catIdMatch[1] : null;

              // 카탈로그 판정 (is_catalog: 'YES' | 'NO' | 'UNKNOWN')
              let is_catalog = 'UNKNOWN';
              let seller_count = null;
              let catalog_min_price = null;
              let catalog_detection_source = 'UNKNOWN';

              const sellerMatch = storesStr.match(/판매처\s*([0-9,]+)/);
              if (sellerMatch) {
                is_catalog = 'YES';
                seller_count = Number(sellerMatch[1].replace(/,/g, ''));
                catalog_min_price = rawPrice;
                catalog_detection_source = 'NAVER_SHOPPING_CATALOG_STORES';
              } else if (!isAd && storesStr && !storesStr.includes('네이버')) {
                // 단독 소호 상품
                is_catalog = 'NO';
                seller_count = 1;
                catalog_min_price = rawPrice;
                catalog_detection_source = 'NAVER_SHOPPING_SINGLE_STORE';
              } else {
                is_catalog = 'UNKNOWN';
                seller_count = null;
                catalog_min_price = null;
                catalog_detection_source = isAd ? 'NAVER_SEARCHAD_ENC_URL' : 'UNKNOWN';
              }

              return {
                rank: item.position || idx + 1,
                title: (item.title || '').trim(),
                price: rawPrice,
                mallName: storesStr || '네이버 쇼핑',
                reviewCount: rawReviews,
                rating: item.rating !== undefined ? Number(item.rating) : null,
                imageUrl: item.thumbnail || '',
                productUrl: link,
                isAd: isAd,
                // 카탈로그 식별 필드
                is_catalog: is_catalog, // 'YES' | 'NO' | 'UNKNOWN'
                catalog_id: cat_id,
                cat_id: cat_id,
                nv_mid: nv_mid,
                seller_count: seller_count,
                catalog_min_price: catalog_min_price,
                catalog_detection_source: catalog_detection_source
              };
            });

            resolve({
              status: 'LIVE_COLLECTED',
              source: `https://serpapi.com/search.json?engine=naver&query=${enc}`,
              statusCode: res.statusCode,
              top_products: topProducts
            });
          } else {
            resolve({
              status: 'API_ERROR_' + res.statusCode,
              source: `https://serpapi.com/search.json?engine=naver&query=${enc}`,
              statusCode: res.statusCode,
              error: json.error || data,
              top_products: []
            });
          }
        } catch (e) {
          resolve({
            status: 'PARSE_ERROR',
            source: `https://serpapi.com/search.json?engine=naver&query=${enc}`,
            statusCode: res.statusCode,
            error: e.message,
            top_products: []
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 'NETWORK_ERROR',
        source: `https://serpapi.com/search.json?engine=naver&query=${enc}`,
        statusCode: null,
        error: err.message,
        top_products: []
      });
    });

    req.end();
  });
}

module.exports = {
  fetchSerpApiNaverShopping
};
