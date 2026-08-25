const https = require('https');

/**
 * 네이버 검색(쇼핑) 웹 결과 파서 테스트
 * 엔드포인트: https://search.shopping.naver.com/api/search/all?query=...
 */
function testNaverShoppingQuery(keyword) {
  const enc = encodeURIComponent(keyword);
  
  // Test 1: JSON search API endpoint used by client-side
  const url = `https://search.shopping.naver.com/api/search/all?sort=rel&pagingIndex=1&pagingSize=10&viewType=list&productSet=total&deliveryFee=&deliveryArea=&frm=NVSHATC&query=${enc}`;

  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Referer': `https://search.shopping.naver.com/search/all?query=${enc}`,
      'Accept-Language': 'ko-KR,ko;q=0.9',
      'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    }
  }, (res) => {
    console.log('HTTP Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Length:', data.length);
      try {
        const json = JSON.parse(data);
        console.log('Total:', json.total);
        console.log('Items count:', json.products?.length || json.list?.length);
      } catch (e) {
        console.log('Not JSON, snippet:', data.slice(0, 200));
      }
    });
  }).on('error', err => console.error(err));
}

testNaverShoppingQuery('캠프캡');
