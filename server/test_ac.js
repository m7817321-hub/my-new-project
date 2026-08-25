const https = require('https');

/**
 * Naver Public Autocomplete & Related Keyword Query Service
 * - 실제 네이버 검색 자동완성 및 연관 키워드 공식 엔드포인트
 * - URL: https://ac.search.naver.com/nx/ac?q_enc=UTF-8&st=100&r_format=json&q=...
 */
function fetchLiveNaverKeywords(keyword) {
  return new Promise((resolve) => {
    const enc = encodeURIComponent(keyword);
    const url = `https://ac.search.naver.com/nx/ac?q_enc=UTF-8&st=100&r_format=json&q=${enc}`;

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // json.items[0] contains array of [keyword, ...]
          const rawItems = json?.items?.[0] || [];
          const keywords = rawItems.map(item => item[0]).filter(Boolean);
          resolve({
            success: true,
            source: 'https://ac.search.naver.com/nx/ac',
            keywords: keywords
          });
        } catch (e) {
          resolve({ success: false, source: 'https://ac.search.naver.com/nx/ac', keywords: [] });
        }
      });
    }).on('error', () => {
      resolve({ success: false, source: 'https://ac.search.naver.com/nx/ac', keywords: [] });
    });
  });
}

// Test live query
async function test() {
  console.log('Testing Naver Autocomplete Public API...');
  const res = await fetchLiveNaverKeywords('캠프캡');
  console.log('Live Related Keywords for 캠프캡:', res);
}

test();
