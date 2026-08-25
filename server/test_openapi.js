const https = require('https');

function testNaverOpenApi(keyword) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.log('NAVER_CLIENT_ID or NAVER_CLIENT_SECRET not set in environment.');
    return;
  }

  const enc = encodeURIComponent(keyword);
  const url = `https://openapi.naver.com/v1/search/shop.json?query=${enc}&display=10&start=1&sort=sim`;

  const req = https.get(url, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('OpenAPI HTTP Status:', res.statusCode);
      try {
        const json = JSON.parse(data);
        console.log('OpenAPI Response Total:', json.total);
        console.log('OpenAPI Items Count:', json.items?.length);
        if (json.items?.length > 0) {
          console.log('Item #1:', json.items[0]);
        }
      } catch (e) {
        console.log('Parse error:', e.message);
      }
    });
  });

  req.on('error', err => console.error('OpenAPI req error:', err.message));
}

testNaverOpenApi('캠프캡');
