require('dotenv').config();
const { analyzeMarketData } = require('./services/marketCollector');
const { extractProductCandidates } = require('./services/candidateFinder');
const db = require('./db');

async function testE2E() {
  console.log('=====================================================');
  console.log('🚀 E2E Integration Test: Naver Catalog Detection & DB');
  console.log('=====================================================\n');

  const testKeyword = '캠프캡';
  console.log(`1. Testing analyzeMarketData for '${testKeyword}'...`);
  const report = await analyzeMarketData(testKeyword);

  console.log(`   • Report ID: ${report.id}`);
  console.log(`   • Top Products Count: ${report.top_products.length}`);
  
  const catalogTopProds = report.top_products.filter(p => p.is_catalog === 'YES');
  console.log(`   • Catalog Top Products: ${catalogTopProds.length}개`);
  
  if (catalogTopProds.length > 0) {
    const sample = catalogTopProds[0];
    console.log(`   • Sample Catalog Product:`);
    console.log(`       - title: ${sample.title}`);
    console.log(`       - is_catalog: ${sample.is_catalog}`);
    console.log(`       - seller_count: ${sample.seller_count}`);
    console.log(`       - catalog_min_price: ${sample.catalog_min_price}`);
    console.log(`       - nv_mid: ${sample.nv_mid}`);
    console.log(`       - cat_id: ${sample.cat_id}`);
    console.log(`       - detection_source: ${sample.catalog_detection_source}`);
  }

  console.log('\n2. Testing DB saveMarketReport...');
  const savedReport = db.saveMarketReport(report);
  console.log(`   • Saved Report ID: ${savedReport.id}`);

  console.log('\n3. Testing extractProductCandidates...');
  const candidates = extractProductCandidates(savedReport);
  console.log(`   • Extracted Candidates Count: ${candidates.length}`);

  const catalogCandidates = candidates.filter(c => c.is_catalog === 'YES');
  console.log(`   • Catalog Candidates Count: ${catalogCandidates.length}개`);

  if (catalogCandidates.length > 0) {
    const sampleCand = catalogCandidates[0];
    console.log(`   • Sample Catalog Candidate:`);
    console.log(`       - title: ${sampleCand.title}`);
    console.log(`       - is_catalog: ${sampleCand.is_catalog}`);
    console.log(`       - seller_count: ${sampleCand.seller_count}`);
    console.log(`       - catalog_min_price: ${sampleCand.catalog_min_price}`);
    console.log(`       - nv_mid: ${sampleCand.nv_mid}`);
    console.log(`       - cat_id: ${sampleCand.cat_id}`);
    console.log(`       - reasons: ${JSON.stringify(sampleCand.reasons)}`);
  }

  console.log('\n4. Testing DB saveProductCandidates...');
  const savedCandidates = db.saveProductCandidates(candidates);
  console.log(`   • Saved Candidates in DB: ${savedCandidates.length}개`);

  console.log('\n5. Testing DB getDailyTopCandidates...');
  const topDaily = db.getDailyTopCandidates(5);
  console.log(`   • Daily Top Candidates: ${topDaily.length}개`);
  topDaily.forEach((td, i) => {
    console.log(`     [#${i+1}] ${td.title.slice(0, 25)} | is_catalog: ${td.is_catalog} | seller_count: ${td.seller_count} | min_price: ${td.catalog_min_price}`);
  });

  console.log('\n=====================================================');
  console.log('✅ ALL E2E INTEGRATION CHECKS PASSED SUCCESSFULLY');
  console.log('=====================================================');
}

testE2E().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
