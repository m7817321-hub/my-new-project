const assert = require('node:assert/strict');

// Keep this test hermetic: db.js honours this before it opens SQLite.
process.env.WOOJUNG_DB_PATH = ':memory:';
const db = require('./db');

function report(id) {
  return db.saveMarketReport({
    id,
    keyword: 'identity-test',
    search_volume_status: 'UNKNOWN',
    monthly_search_total: null,
    monthly_search_pc: null,
    monthly_search_mobile: null,
    total_products: null,
    competition_ratio: null,
    avg_price: null,
    median_price: null,
    min_price: null,
    max_price: null,
    price_distribution: [],
    top_products: [],
    avg_review_count: null,
    median_review_count: null,
    trend_status: 'UNKNOWN',
    trend_data: [],
    related_keywords: [],
    opportunity_score: null,
    recommendation: 'HOLD',
    recommendation_reasons: [],
    field_sources: {},
    data_source: 'test',
    collected_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  });
}

function candidate(id, reportId, overrides = {}) {
  return {
    id,
    report_id: reportId,
    keyword: 'identity-test',
    rank: 1,
    title: '동일한 표시 상품명',
    price: 20000,
    price_tier: 'SWEET_SPOT',
    mall_name: '테스트몰',
    brand_type: 'SOHO',
    review_count: 1,
    rating: 5,
    is_ad: false,
    image_url: '',
    product_url: '',
    is_catalog: 'UNKNOWN',
    catalog_id: null,
    cat_id: null,
    nv_mid: null,
    seller_count: null,
    catalog_min_price: null,
    catalog_detection_source: 'UNKNOWN',
    status: 'PENDING',
    reasons: [],
    created_at: new Date().toISOString(),
    ...overrides
  };
}

const firstReport = report('report-1');
const secondReport = report('report-2');

// 1. Same nv_mid wins even when URLs differ.
db.saveProductCandidates([candidate('mid-a', firstReport.id, {
  nv_mid: '1234567890', product_url: 'https://shop.example.com/a',
  is_catalog: 'YES', cat_id: 'catalog-1', seller_count: 4, catalog_min_price: 19000
})]);
db.saveProductCandidates([candidate('mid-b', secondReport.id, {
  nv_mid: '1234567890', product_url: 'https://other.example.com/a?utm_source=test', is_ad: true
})]);
assert.equal(db.db.prepare("SELECT COUNT(*) count FROM product_candidates WHERE canonical_identity = 'nv_mid:1234567890'").get().count, 1);
const preservedCatalog = db.db.prepare("SELECT is_catalog, cat_id, seller_count, catalog_min_price FROM product_candidates WHERE canonical_identity = 'nv_mid:1234567890'").get();
assert.deepEqual(preservedCatalog, { is_catalog: 'YES', cat_id: 'catalog-1', seller_count: 4, catalog_min_price: 19000 });

// 2. Tracking queries do not create a second URL identity.
db.saveProductCandidates([candidate('url-a', firstReport.id, {
  product_url: 'https://shop.example.com/products/cap-01?utm_source=naver'
})]);
db.saveProductCandidates([candidate('url-b', secondReport.id, {
  product_url: 'https://shop.example.com/products/cap-01?ref=ad&campaign=spring', is_ad: true
})]);
assert.equal(db.db.prepare("SELECT COUNT(*) count FROM product_candidates WHERE canonical_identity = 'url:https://shop.example.com/products/cap-01'").get().count, 1);

// 3. The same advertised product collected repeatedly remains one candidate.
db.saveProductCandidates([candidate('ad-a', firstReport.id, { nv_mid: '7777777777', is_ad: true })]);
db.saveProductCandidates([candidate('ad-b', secondReport.id, { nv_mid: '7777777777', is_ad: true })]);
assert.equal(db.db.prepare("SELECT COUNT(*) count FROM product_candidates WHERE canonical_identity = 'nv_mid:7777777777'").get().count, 1);

// 4. No MID and no usable URL is genuinely UNKNOWN; it is not guessed from title.
db.saveProductCandidates([candidate('unknown-a', firstReport.id, { title: '식별 불가 상품' })]);
db.saveProductCandidates([candidate('unknown-b', secondReport.id, { title: '식별 불가 상품' })]);
assert.equal(db.db.prepare("SELECT COUNT(*) count FROM product_candidates WHERE identity_type = 'UNKNOWN'").get().count, 2);

// 5. Matching display names do not collapse distinct products.
db.saveProductCandidates([candidate('same-title-a', firstReport.id, {
  title: '같은 상품명', product_url: 'https://shop.example.com/product-a'
})]);
db.saveProductCandidates([candidate('same-title-b', firstReport.id, {
  title: '같은 상품명', product_url: 'https://shop.example.com/product-b'
})]);
assert.equal(db.db.prepare("SELECT COUNT(*) count FROM product_candidates WHERE title = '같은 상품명'").get().count, 2);

const top5 = db.getDailyTopCandidates(5);
const identities = top5.filter(item => item.canonical_identity).map(item => item.canonical_identity);
assert.equal(new Set(identities).size, identities.length, 'Daily TOP 5 must not repeat a known canonical identity');

console.log('Identity/deduplication tests passed.');
