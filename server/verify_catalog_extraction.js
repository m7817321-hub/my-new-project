require('dotenv').config();
const { fetchSerpApiNaverShopping } = require('./services/serpApiCollector');

async function verifyExtraction() {
  console.log('=====================================================');
  console.log('🔍 SerpApi Naver Shopping Catalog Detection Verification');
  console.log('=====================================================\n');

  const testKeywords = ['캠프캡', '볼캡', '나일론 크로스백', '버킷햇'];
  let totalCount = 0;
  let catalogCount = 0;
  let singleCount = 0;
  let unknownCount = 0;

  for (const kw of testKeywords) {
    console.log(`\n▶ [키워드: ${kw}] SerpApi 실데이터 수집 및 검증...`);
    const res = await fetchSerpApiNaverShopping(kw);
    
    if (!res.top_products || res.top_products.length === 0) {
      console.log(`  ❌ 상품 수집 실패 (${res.status}): ${res.reason || res.error}`);
      continue;
    }

    console.log(`  총 수집된 상품: ${res.top_products.length}개\n`);
    
    res.top_products.forEach((p, idx) => {
      totalCount++;
      if (p.is_catalog === 'YES' || p.is_catalog === true || p.is_catalog === 'CATALOG') catalogCount++;
      else if (p.is_catalog === 'NO' || p.is_catalog === false || p.is_catalog === 'SINGLE') singleCount++;
      else unknownCount++;

      console.log(`  [#${idx + 1}] ${p.title.slice(0, 35)}...`);
      console.log(`      • 판매처/몰: ${p.mallName}`);
      console.log(`      • 가격: ₩${p.price?.toLocaleString()}원`);
      console.log(`      • is_catalog: ${p.is_catalog} (${p.catalog_detection_source})`);
      console.log(`      • seller_count: ${p.seller_count !== null ? p.seller_count + '개' : 'UNKNOWN'}`);
      console.log(`      • cat_id: ${p.cat_id || 'UNKNOWN'}`);
      console.log(`      • nv_mid: ${p.nv_mid || 'UNKNOWN'}`);
      console.log(`      • catalog_min_price: ${p.catalog_min_price !== null ? '₩' + p.catalog_min_price?.toLocaleString() + '원' : 'UNKNOWN'}`);
      console.log(`      • 광고여부: ${p.isAd ? '쇼핑광고(AD)' : '자연노출'}`);
      console.log('');
    });
  }

  console.log('=====================================================');
  console.log('📊 검증 통계 요약:');
  console.log(`  • 총 검증 상품 수: ${totalCount}개`);
  console.log(`  • 카탈로그(동일상품) 판정: ${catalogCount}개`);
  console.log(`  • 단독상품(단일판매처) 판정: ${singleCount}개`);
  console.log(`  • UNKNOWN(광고/미식별) 판정: ${unknownCount}개`);
  console.log('=====================================================');
}

verifyExtraction();
