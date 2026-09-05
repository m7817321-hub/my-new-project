const assert = require('node:assert/strict');
process.env.WOOJUNG_DB_PATH = ':memory:';
const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function runE2E() {
  console.log('--- Starting Workflow E2E Test ---');
  const now = new Date().toISOString();

  // 1. Market Research (Save Report & Candidate)
  db.saveMarketReport({
    id: 'report-e2e', keyword: 'test', search_volume_status: 'UNKNOWN',
    monthly_search_total: null, monthly_search_pc: null, monthly_search_mobile: null,
    total_products: null, competition_ratio: null, avg_price: null, median_price: null,
    min_price: null, max_price: null, price_distribution: [], top_products: [],
    avg_review_count: null, median_review_count: null, trend_status: 'UNKNOWN',
    trend_data: [], related_keywords: [], opportunity_score: null,
    recommendation: 'HOLD', recommendation_reasons: [], field_sources: {},
    data_source: 'test', collected_at: now, created_at: now
  });

  const candidateId = `cand-${uuidv4()}`;
  db.saveProductCandidates([{
    id: candidateId, report_id: 'report-e2e', keyword: 'test', rank: 1, title: 'E2E Product',
    price: 30000, price_tier: 'SWEET_SPOT', mall_name: 'TestMall', brand_type: 'SOHO',
    review_count: 100, rating: 4.5, is_ad: false, image_url: '', product_url: '',
    is_catalog: 'UNKNOWN', status: 'PENDING', reasons: [], created_at: now
  }]);

  // 2. Candidate -> INTERESTED
  db.updateCandidateStatus(candidateId, 'INTERESTED');

  // 3. Supplier -> CANDIDATE
  const supplierId = `sup-${uuidv4()}`;
  db.saveSupplierItem({
    id: supplierId, candidate_id: candidateId, platform: '1688', supplier_name: 'Test Supplier',
    product_title: '1688 E2E Product', supplier_url: '', unit_cost: 15000, currency: 'KRW',
    moq: 2, supply_shipping: 3000, workflow_status: 'CANDIDATE', verification_status: 'PENDING'
  });

  // 4. Supplier -> SELECTED
  db.updateSupplierWorkflowStatus(supplierId, 'SELECTED');

  // 5. listing-seed (simulate API behavior)
  const candidate = db.getCandidateById(candidateId);
  const supplier = db.getSupplierItemById(supplierId);
  assert.equal(candidate.status, 'INTERESTED');
  assert.equal(supplier.workflow_status, 'SELECTED');
  
  // 6. Product -> DRAFT -> READY
  const productId = `prod-${uuidv4()}`;
  db.saveProduct({
    id: productId, candidate_id: candidateId, supplier_item_id: supplierId,
    original_name: candidate.title, cost_price: supplier.unit_cost, selling_price: 30000,
    supplier: supplier.platform, product_url: '', image_url: '', supply_shipping: supplier.supply_shipping,
    customer_shipping: 3000, market_fee_rate: 10.8, margin_amount: 5000, margin_rate: 15,
    generated_title: 'E2E Awesome Product', keywords: JSON.stringify(['test', 'awesome']),
    key_benefits: JSON.stringify([]), detail_structure: JSON.stringify([]),
    detail_copy: 'Test copy', status: 'READY', created_at: now, updated_at: now
  });

  // 7. Rank Target -> ACTIVE
  // We simulate what the POST /api/rank-tracker/targets does (extract candidate_id from product)
  const product = db.getProductsByCandidateId(candidateId)[0];
  const targetId = `rank-${uuidv4()}`;
  db.saveRankTarget({
    id: targetId, product_id: product.id, candidate_id: product.candidate_id,
    product_name: product.generated_title, product_url: '', nv_mid: '', mall_name: 'TestMall',
    keyword: 'test', target_rank: 10, active: 1, workflow_status: 'ACTIVE', created_at: now
  });

  // 8. getWorkflowLineage (The ultimate check)
  const lineage = db.getWorkflowLineage(candidateId);
  
  assert.ok(lineage, 'Lineage must be returned');
  assert.equal(lineage.candidate.id, candidateId, 'Candidate ID mismatch');
  assert.equal(lineage.suppliers.length, 1, 'Should have 1 supplier');
  assert.equal(lineage.selected_supplier.id, supplierId, 'Selected supplier ID mismatch');
  assert.equal(lineage.products.length, 1, 'Should have 1 product');
  assert.equal(lineage.products[0].id, productId, 'Product ID mismatch');
  assert.equal(lineage.active_product.id, productId, 'Active product ID mismatch');
  assert.equal(lineage.rank_targets.length, 1, 'Should have 1 rank target');
  assert.equal(lineage.rank_targets[0].id, targetId, 'Rank target ID mismatch');
  
  assert.equal(lineage.workflow_summary.candidate_status, 'INTERESTED', 'Summary candidate status mismatch');
  assert.equal(lineage.workflow_summary.selected_supplier_id, supplierId, 'Summary selected supplier mismatch');
  assert.equal(lineage.workflow_summary.active_product_status, 'READY', 'Summary active product status mismatch');

  console.log('--- Workflow E2E Test Passed Successfully ---');
}

runE2E().catch(error => { console.error(error); process.exitCode = 1; });
