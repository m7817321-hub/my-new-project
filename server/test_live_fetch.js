const https = require('https');

function fetchLiveNaverShopping(keyword) {
  return new Promise((resolve, reject) => {
    const enc = encodeURIComponent(keyword);
    const url = 'https://search.shopping.naver.com/search/all?query=' + enc;

    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    }, (res) => {
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => {
        try {
          const marker = '<script id="__NEXT_DATA__" type="application/json">';
          const startIdx = html.indexOf(marker);
          if (startIdx === -1) {
            return resolve({ success: false, reason: 'NEXT_DATA_NOT_FOUND', total: null, items: [] });
          }

          const endIdx = html.indexOf('</script>', startIdx);
          const jsonStr = html.substring(startIdx + marker.length, endIdx);
          const json = JSON.parse(jsonStr);

          const productsState = json?.props?.pageProps?.initialState?.products;
          const totalProducts = Number(productsState?.total) || 0;
          const rawList = productsState?.list || [];

          const topProducts = rawList.slice(0, 10).map((wrapper, idx) => {
            const item = wrapper.item || wrapper;
            const price = Number(item.price || item.lowPrice || 0);
            const reviewCount = Number(item.reviewCount || 0);
            return {
              rank: idx + 1,
              title: (item.productTitle || item.productName || '').replace(/<[^>]*>?/gm, '').trim(),
              price: price,
              mallName: item.mallName || '스마트스토어',
              reviewCount: reviewCount,
              imageUrl: item.imageUrl || '',
              productUrl: item.crUrl || item.adcrUrl || ('https://search.shopping.naver.com/catalog/' + (item.id || ''))
            };
          });

          resolve({
            success: true,
            totalProducts,
            topProducts,
            source: 'https://search.shopping.naver.com/search/all?query=' + enc
          });
        } catch (err) {
          resolve({ success: false, reason: err.message, total: null, items: [] });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ success: false, reason: err.message, total: null, items: [] });
    });
  });
}

// Test live query
async function test() {
  console.log('Testing Live Naver Shopping Connector...');
  const result = await fetchLiveNaverShopping('캠프캡');
  console.log('Result Success:', result.success);
  console.log('Live Total Products:', result.totalProducts);
  console.log('Live Top Products Count:', result.topProducts?.length);
  if (result.topProducts?.length > 0) {
    console.log('First Live Item:', result.topProducts[0]);
  }
}

test();
