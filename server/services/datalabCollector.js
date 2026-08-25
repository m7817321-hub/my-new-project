const https = require('https');

/**
 * NAVER API HUB 쇼핑인사이트 키워드 트렌드 수집기 (공식 신규 규격)
 * 
 * - Host: naverapihub.apigw.ntruss.com
 * - Endpoint: POST /shopping/v1/category/keywords
 * - Headers:
 *    * X-NCP-APIGW-API-KEY-ID: NAVER_CLIENT_ID
 *    * X-NCP-APIGW-API-KEY: NAVER_CLIENT_SECRET
 *    * Content-Type: application/json
 */
function fetchNaverDatalabShopping(keyword, categoryCode = '50000000') {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return Promise.resolve({
      status: 'UNKNOWN',
      source: 'NAVER API HUB (https://naverapihub.apigw.ntruss.com/shopping/v1/category/keywords)',
      reason: 'NAVER_CLIENT_ID or NAVER_CLIENT_SECRET not configured in .env',
      trend_status: 'UNKNOWN',
      trend_data: []
    });
  }

  // 최근 30일 기간 계산 (YYYY-MM-DD)
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startDate = pastDate.toISOString().slice(0, 10);

  const payload = JSON.stringify({
    startDate: startDate,
    endDate: endDate,
    timeUnit: 'date',
    category: categoryCode, // 패션의류/잡화 기본 카테고리: 50000000
    keyword: [{ name: keyword, param: [keyword] }]
  });

  const path = '/shopping/v1/category/keywords';
  const options = {
    hostname: 'naverapihub.apigw.ntruss.com',
    port: 443,
    path: path,
    method: 'POST',
    headers: {
      'X-NCP-APIGW-API-KEY-ID': clientId,
      'X-NCP-APIGW-API-KEY': clientSecret,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
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
            const results = json.results?.[0]?.data || [];
            
            // 트렌드 방향 계산 (전반부 15일 vs 후반부 15일 상대 클릭 비율 비교)
            let trendStatus = 'STABLE';
            if (results.length >= 10) {
              const firstHalf = results.slice(0, Math.floor(results.length / 2));
              const secondHalf = results.slice(Math.floor(results.length / 2));
              const avg1 = firstHalf.reduce((a, b) => a + Number(b.ratio), 0) / firstHalf.length;
              const avg2 = secondHalf.reduce((a, b) => a + Number(b.ratio), 0) / secondHalf.length;
              
              if (avg2 > avg1 * 1.15) trendStatus = 'RISING';
              else if (avg2 < avg1 * 0.85) trendStatus = 'DECLINING';
            }

            resolve({
              status: 'LIVE_COLLECTED',
              source: `https://naverapihub.apigw.ntruss.com${path}`,
              statusCode: res.statusCode,
              startDate: json.startDate,
              endDate: json.endDate,
              timeUnit: json.timeUnit,
              trend_status: trendStatus,
              trend_data: results.map(r => ({
                period: r.period,
                ratio: Number(r.ratio)
              }))
            });
          } else {
            resolve({
              status: 'API_ERROR_' + res.statusCode,
              source: `https://naverapihub.apigw.ntruss.com${path}`,
              statusCode: res.statusCode,
              error: json.error?.message || json.errorMessage || json.message || data,
              raw_error: data,
              trend_status: 'UNKNOWN',
              trend_data: []
            });
          }
        } catch (e) {
          resolve({
            status: 'PARSE_ERROR',
            source: `https://naverapihub.apigw.ntruss.com${path}`,
            statusCode: res.statusCode,
            error: e.message,
            raw_error: data,
            trend_status: 'UNKNOWN',
            trend_data: []
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 'NETWORK_ERROR',
        source: `https://naverapihub.apigw.ntruss.com${path}`,
        statusCode: null,
        error: err.message,
        trend_status: 'UNKNOWN',
        trend_data: []
      });
    });

    req.write(payload);
    req.end();
  });
}

module.exports = {
  fetchNaverDatalabShopping
};
