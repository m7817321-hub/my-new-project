require('dotenv').config();
const { analyzeMarketData } = require('./services/marketCollector');
const { extractProductCandidates } = require('./services/candidateFinder');
const db = require('./db');

async function runVerification() {
  console.log('===========================================================');
  console.log('🧪 VERIFYING FIXES FOR CRITICAL BUGS 1 & 2');
  console.log('===========================================================\n');

  // Step 1: Live Market Collection for '캠프캡'
  console.log('▶ [Step 1] Running live analyzeMarketData("캠프캡")...');
  const report = await analyzeMarketData('캠프캡');
  const savedReport = db.saveMarketReport(report);
  console.log(`✓ Report created: ${savedReport.id} (top_products: ${savedReport.top_products.length})`);

  // Step 2: Extract & Deduplicate Candidates
  console.log('\n▶ [Step 2] Extracting Candidates with Candidate Finder...');
  const candidates = extractProductCandidates(savedReport);
  const savedCandidates = db.saveProductCandidates(candidates);
  console.log(`✓ Extracted and saved ${savedCandidates.length} candidate products`);

  // Inspect each candidate
  console.log('\n▶ Candidate Products Inspection:');
  savedCandidates.forEach((c, idx) => {
    console.log(`  [#${idx+1}] ${c.title.slice(0, 35)}`);
    console.log(`      mall: ${c.mall_name} | status: ${c.status} | rank: #${c.rank}`);
    console.log(`      is_catalog: ${c.is_catalog} | seller_count: ${c.seller_count} | cat_id: ${c.cat_id} | nv_mid: ${c.nv_mid}`);
    console.log(`      catalog_min_price: ${c.catalog_min_price} | source: ${c.catalog_detection_source}`);
  });

  // Step 3: Test Daily Top 5 Candidates (BUG 1 check)
  console.log('\n▶ [Step 3] Fetching Daily TOP 5 Candidates (getDailyTopCandidates)...');
  const top5 = db.getDailyTopCandidates(5);
  console.log(`✓ Retrieved ${top5.length} top candidates`);

  const seenTitles = new Set();
  const seenMids = new Set();
  let hasDuplicates = false;

  top5.forEach((c, idx) => {
    const isDup = seenTitles.has(c.title) || (c.nv_mid && seenMids.has(c.nv_mid));
    if (isDup) hasDuplicates = true;
    seenTitles.add(c.title);
    if (c.nv_mid) seenMids.add(c.nv_mid);

    console.log(`  [TOP #${idx+1}] ${c.title.slice(0, 35)}`);
    console.log(`      Mall: ${c.mall_name} | Keyword: ${c.keyword} | Status: ${c.status}`);
    console.log(`      is_catalog: ${c.is_catalog} | seller_count: ${c.seller_count} | nv_mid: ${c.nv_mid} | cat_id: ${c.cat_id}`);
  });

  if (hasDuplicates) {
    console.error('❌ BUG 1 FAILED: Found duplicate items in Top 5!');
  } else {
    console.log('✅ BUG 1 PASSED: All 5 candidates are distinct, unique products!');
  }

  // Step 4: Verify Catalog Metadata (BUG 2 check)
  console.log('\n▶ [Step 4] Checking Catalog Metadata Fidelity...');
  const catalogItem = savedCandidates.find(c => c.is_catalog === 'YES');
  const singleItem = savedCandidates.find(c => c.is_catalog === 'NO');
  const unknownItem = savedCandidates.find(c => c.is_catalog === 'UNKNOWN');

  if (catalogItem) {
    console.log(`✅ Catalog Item Found: "${catalogItem.title.slice(0, 30)}"`);
    console.log(`   - seller_count: ${catalogItem.seller_count} (Expected: Number > 1)`);
    console.log(`   - cat_id: ${catalogItem.cat_id} (Expected: Valid ID)`);
    console.log(`   - nv_mid: ${catalogItem.nv_mid} (Expected: Valid ID)`);
    console.log(`   - catalog_min_price: ${catalogItem.catalog_min_price} (Expected: Price)`);
    if (!catalogItem.seller_count || !catalogItem.cat_id || !catalogItem.nv_mid) {
      console.error('❌ BUG 2 Catalog fields missing!');
    }
  } else {
    console.log('ℹ️ No catalog item found in this specific search query');
  }

  if (singleItem) {
    console.log(`✅ Single Store Item Found: "${singleItem.title.slice(0, 30)}"`);
    console.log(`   - seller_count: ${singleItem.seller_count} (Expected: 1)`);
    console.log(`   - cat_id: ${singleItem.cat_id} (Expected: Valid ID)`);
    console.log(`   - nv_mid: ${singleItem.nv_mid} (Expected: Valid ID)`);
  }

  if (unknownItem) {
    console.log(`✅ Unknown/Ad Item Found: "${unknownItem.title.slice(0, 30)}"`);
    console.log(`   - is_catalog: ${unknownItem.is_catalog} (Expected: UNKNOWN)`);
    console.log(`   - seller_count: ${unknownItem.seller_count} (Expected: null)`);
  }
}

runVerification().catch(e => console.error('Verification error:', e));
