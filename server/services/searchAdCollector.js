const https = require('https');
const crypto = require('crypto');

/**
 * 네이버 검색광고 RelKwdStat API 커넥터
 * 
 * - API 엔드포인트: https://api.searchad.naver.com/keywordstool
 * - HTTP Method: GET
 * - 필수 헤더:
 *    * X-Timestamp: Unix timestamp in ms (e.g. Date.now().toString())
 *    * X-API-KEY: NAVER_SEARCHAD_API_KEY
 *    * X-Customer: NAVER_SEARCHAD_CUSTOMER_ID
 *    * X-Signature: Base64(HMAC-SHA256(timestamp + "." + method + "." + path, secretKey))
 * - 쿼리 파라미터:
 *    * hintKeywords: 검색 키워드 (공백 제거)
 *    * showDetail: '1'
 */
function fetchNaverSearchAdVolume(rawKeyword) {
  const apiKey = process.env.NAVER_SEARCHAD_API_KEY;
  const secretKey = process.env.NAVER_SEARCHAD_SECRET_KEY;
  const customerId = process.env.NAVER_SEARCHAD_CUSTOMER_ID;

  // 인증 정보 부재 시 UNKNOWN 처리 (임의 생성 금지)
  if (!apiKey || !secretKey || !customerId) {
    return Promise.resolve({
      status: 'UNKNOWN',
      source: 'Naver SearchAd RelKwdStat API (https://api.searchad.naver.com/keywordstool)',
      reason: 'NAVER_SEARCHAD_API_KEY, NAVER_SEARCHAD_SECRET_KEY, or NAVER_SEARCHAD_CUSTOMER_ID is not configured in .env',
      monthly_search_pc: null,
      monthly_search_mobile: null,
      monthly_search_total: null,
      raw_item: null
    });
  }

  const keyword = rawKeyword.replace(/\s+/g, '');
  const timestamp = Date.now().toString();
  const method = 'GET';
  const apiPath = '/keywordstool';
  const query = `hintKeywords=${encodeURIComponent(keyword)}&showDetail=1`;
  const fullPath = `${apiPath}?${query}`;

  // HMAC-SHA256 서명 생성
  const hmacMessage = `${timestamp}.${method}.${apiPath}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(hmacMessage)
    .digest('base64');

  const options = {
    hostname: 'api.searchad.naver.com',
    port: 443,
    path: fullPath,
    method: method,
    headers: {
      'X-Timestamp': timestamp,
      'X-API-KEY': apiKey,
      'X-Customer': customerId,
      'X-Signature': signature,
      'Content-Type': 'application/json'
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
            const keywordList = json.keywordList || [];
            // 정확히 일치하는 메인 키워드 항목 찾기
            const target = keywordList.find(item => item.relKeyword === keyword) || keywordList[0];

            if (target) {
              // '< 10' 표기 등의 문자열 처리 (네이버는 10회 미만을 '< 10'으로 반환)
              const parseVolume = (val) => {
                if (typeof val === 'number') return val;
                if (typeof val === 'string') {
                  if (val.includes('<')) return 5; // 10회 미만 표기
                  const num = Number(val.replace(/[^0-9]/g, ''));
                  return isNaN(num) ? 0 : num;
                }
                return 0;
              };

              const pcCount = parseVolume(target.monthlyPcQcCnt);
              const mobileCount = parseVolume(target.monthlyMobileQcCnt);
              const totalCount = pcCount + mobileCount;

              resolve({
                status: 'LIVE_COLLECTED',
                source: `https://api.searchad.naver.com${fullPath}`,
                statusCode: res.statusCode,
                monthly_search_pc: pcCount,
                monthly_search_mobile: mobileCount,
                monthly_search_total: totalCount,
                raw_item: target
              });
            } else {
              resolve({
                status: 'NO_DATA',
                source: `https://api.searchad.naver.com${fullPath}`,
                statusCode: res.statusCode,
                monthly_search_pc: null,
                monthly_search_mobile: null,
                monthly_search_total: null,
                raw_item: null
              });
            }
          } else {
            resolve({
              status: `API_ERROR_${res.statusCode}`,
              source: `https://api.searchad.naver.com${fullPath}`,
              statusCode: res.statusCode,
              error: json.title || json.message || data,
              monthly_search_pc: null,
              monthly_search_mobile: null,
              monthly_search_total: null,
              raw_item: null
            });
          }
        } catch (e) {
          resolve({
            status: 'PARSE_ERROR',
            source: `https://api.searchad.naver.com${fullPath}`,
            statusCode: res.statusCode,
            error: e.message,
            monthly_search_pc: null,
            monthly_search_mobile: null,
            monthly_search_total: null,
            raw_item: null
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 'NETWORK_ERROR',
        source: `https://api.searchad.naver.com${fullPath}`,
        statusCode: null,
        error: err.message,
        monthly_search_pc: null,
        monthly_search_mobile: null,
        monthly_search_total: null,
        raw_item: null
      });
    });

    req.end();
  });
}

module.exports = {
  fetchNaverSearchAdVolume
};
