const https = require('https');
const { recordCollectorStatus } = require('./integrationHealth');

/**
 * 네이버 쇼핑 검색 오픈 API 수집기 (Naver Developers Search API)
 * 
 * - API 엔드포인트: https://openapi.naver.com/v1/search/shop.json
 * - 환경변수:
 *    * NAVER_CLIENT_ID: 네이버 개발자센터 Client ID
 *    * NAVER_CLIENT_SECRET: 네이버 개발자센터 Client Secret
 * 
 * - 수집 데이터:
 *    * totalProducts: 네이버 쇼핑 전체 등록 상품 수 (json.total)
 *    * topProducts: 상위 10개 상품 (상품명, 최저가, 판매처, 리뷰수, 이미지, 상품 URL)
 */
function fetchNaverShoppingOpenApi(keyword) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    recordCollectorStatus('naver_shopping', 'UNKNOWN');
    return Promise.resolve({
      status: 'UNKNOWN',
      source: 'Naver Shopping Open API (https://openapi.naver.com/v1/search/shop.json)',
      reason: 'NAVER_CLIENT_ID or NAVER_CLIENT_SECRET is not configured in .env (Naver Developers API Key Required)',
      totalProducts: null,
      topProducts: [],
      prices: []
    });
  }

  const enc = encodeURIComponent(keyword);
  const path = `/v1/search/shop.json?query=${enc}&display=10&start=1&sort=sim`;

  const options = {
    hostname: 'openapi.naver.com',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            const items = json.items || [];
            const topProducts = items.map((item, idx) => ({
              rank: idx + 1,
              title: (item.title || '').replace(/<[^>]*>?/gm, '').trim(),
              price: Number(item.lprice || 0),
              mallName: item.mallName || item.brand || '스마트스토어',
              reviewCount: null, // 네이버 오픈API는 reviewCount를 기본 필드로 제공하지 않으므로 UNKNOWN(null)
              imageUrl: item.image || '',
              productUrl: item.link || ''
            }));

            recordCollectorStatus('naver_shopping', 'LIVE_COLLECTED');
            resolve({
              status: 'LIVE_COLLECTED',
              source: `https://openapi.naver.com${path}`,
              statusCode: res.statusCode,
              totalProducts: Number(json.total) || 0,
              topProducts: topProducts
            });
          } else {
            const errStatus = `API_ERROR_${res.statusCode}`;
            recordCollectorStatus('naver_shopping', errStatus);
            resolve({
              status: errStatus,
              source: `https://openapi.naver.com${path}`,
              statusCode: res.statusCode,
              error: json.errorMessage || json.message || data,
              totalProducts: null,
              topProducts: []
            });
          }
        } catch (e) {
          recordCollectorStatus('naver_shopping', 'PARSE_ERROR');
          resolve({
            status: 'PARSE_ERROR',
            source: `https://openapi.naver.com${path}`,
            statusCode: res.statusCode,
            error: e.message,
            totalProducts: null,
            topProducts: []
          });
        }
      });
    });

    req.on('error', (err) => {
      recordCollectorStatus('naver_shopping', 'NETWORK_ERROR');
      resolve({
        status: 'NETWORK_ERROR',
        source: `https://openapi.naver.com${path}`,
        statusCode: null,
        error: err.message,
        totalProducts: null,
        topProducts: []
      });
    });

    req.end();
  });
}

module.exports = {
  fetchNaverShoppingOpenApi
};
