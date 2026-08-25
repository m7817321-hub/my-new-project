const assert = require('node:assert/strict');

process.env.WOOJUNG_DB_PATH = ':memory:';
const db = require('./db');
const { extractProductCandidates } = require('./services/candidateFinder');

const now = new Date().toISOString();
const report = db.saveMarketReport({
  id: 'market-model-report',
  keyword: '캠프캡',
  search_volume_status: 'LIVE_COLLECTED',
  monthly_search_total: 1000,
  monthly_search_pc: 400,
  monthly_search_mobile: 600,
  total_products: null,
  competition_ratio: null,
  avg_price: 20000,
  median_price: 20000,
  min_price: 18000,
  max_price: 22000,
  price_distribution: [],
  // This is an immutable collector snapshot, not a UI source of truth.
  top_products: [{
    rank: 1, title: '원본 스냅샷 상품', price: 20000, mallName: '테스트몰',
    reviewCount: 3, rating: 5, isAd: false, productUrl: 'https://shop.example.com/camp-cap?utm=test',
    is_catalog: 'YES', cat_id: 'cat-100', nv_mid: '1010101010', seller_count: 3,
    catalog_min_price: 18000, catalog_detection_source: 'TEST'
  }],
  avg_review_count: 3,
  median_review_count: 3,
  trend_status: 'STABLE',
  trend_data: [],
  related_keywords: [],
  opportunity_score: null,
  recommendation: 'HOLD',
  recommendation_reasons: [],
  field_sources: {},
  data_source: 'test',
  collected_at: now,
  created_at: now
});

db.saveProductCandidates(extractProductCandidates(report));
const candidates = db.getProductCandidatesByReportId(report.id);

assert.equal(candidates.length, 1);
assert.equal(candidates[0].canonical_identity, 'nv_mid:1010101010');
assert.equal(candidates[0].cat_id, 'cat-100');
assert.equal(candidates[0].seller_count, 3);
assert.equal(candidates[0].catalog_min_price, 18000);

// Simulate More Products returning the same actual product with a tracking URL.
db.saveProductCandidates(extractProductCandidates({
  ...report,
  top_products: [{
    ...report.top_products[0], productUrl: 'https://other.example.com/cap?ad=1', isAd: true
  }]
}));

const afterMore = db.getProductCandidatesByReportId(report.id);
assert.equal(afterMore.length, 1, 'More Products must merge into the canonical candidate record');
assert.equal(afterMore[0].cat_id, 'cat-100');

console.log('Market Research canonical candidate model tests passed.');
