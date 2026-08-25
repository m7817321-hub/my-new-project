const https = require('https');

function debugFetch(keyword) {
  const enc = encodeURIComponent(keyword);
  const url = 'https://search.shopping.naver.com/search/all?query=' + enc;

  https.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9',
      'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    }
  }, (res) => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Headers:', res.headers);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('HTML Length:', data.length);
      console.log('HTML Snippet:', data.slice(0, 500));
    });
  });
}

debugFetch('캠프캡');
