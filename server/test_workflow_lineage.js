const assert = require('node:assert/strict');
process.env.WOOJUNG_DB_PATH = ':memory:';
const db = require('./db');
const now = new Date().toISOString();

db.saveMarketReport({ id:'r', keyword:'k', search_volume_status:'UNKNOWN', monthly_search_total:null, monthly_search_pc:null, monthly_search_mobile:null, total_products:null, competition_ratio:null, avg_price:null, median_price:null, min_price:null, max_price:null, price_distribution:[], top_products:[], avg_review_count:null, median_review_count:null, trend_status:'UNKNOWN', trend_data:[], related_keywords:[], opportunity_score:null, recommendation:'HOLD', recommendation_reasons:[], field_sources:{}, data_source:'test', collected_at:now, created_at:now });
db.saveProductCandidates([{ id:'candidate-1', report_id:'r', keyword:'k', rank:1, title:'상품', price:20000, price_tier:'SWEET_SPOT', mall_name:'몰', brand_type:'SOHO', review_count:0, rating:null, is_ad:false, image_url:'', product_url:'https://shop.example.com/p', is_catalog:'UNKNOWN', status:'PENDING', reasons:[], created_at:now }]);
const candidate = db.getProductCandidatesByReportId('r')[0];
db.updateCandidateStatus(candidate.id, 'INTERESTED');

const supplier1 = db.saveSupplierItem({ id:'supplier-1', candidate_id:candidate.id, platform:'1688', workflow_status:'CANDIDATE' });
const supplier2 = db.saveSupplierItem({ id:'supplier-2', candidate_id:candidate.id, platform:'도매꾹', workflow_status:'CANDIDATE' });
db.updateSupplierWorkflowStatus(supplier1.id, 'SELECTED');
assert.equal(db.getSupplierItemsByCandidateId(candidate.id).filter(x => x.workflow_status === 'SELECTED').length, 1);

const product = db.saveProduct({ id:'product-1', candidate_id:candidate.id, supplier_item_id:supplier1.id, original_name:'상품', cost_price:10000, selling_price:20000, supplier:'1688', product_url:'https://shop.example.com/p', image_url:'', supply_shipping:0, customer_shipping:0, market_fee_rate:10.8, margin_amount:0, margin_rate:0, generated_title:'상품', keywords:[], key_benefits:[], detail_structure:[], detail_copy:'', status:'READY', created_at:now, updated_at:now });
const target = db.saveRankTarget({ id:'rank-1', product_id:product.id, product_name:product.original_name, product_url:product.product_url, nv_mid:'', mall_name:'몰', keyword:'k', target_rank:10, active:1, workflow_status:'ACTIVE', created_at:now });
assert.equal(product.candidate_id, candidate.id);
assert.equal(db.getSupplierItemById(supplier1.id).candidate_id, candidate.id);
assert.equal(target.product_id, product.id);
console.log('Workflow lineage tests passed.');
