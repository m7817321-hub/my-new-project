require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { calculateMargin } = require('./services/marginCalculator');
const { generateProductTransformation } = require('./services/aiTransformer');
const { analyzeMarketData, fetchMoreMarketProducts } = require('./services/marketCollector');
const { extractProductCandidates } = require('./services/candidateFinder');
const { extractProductFeatures } = require('./services/supplierKeywordExtractor');
const { trackTargetRank, trackAllActiveTargets, initDailyRankScheduler } = require('./services/rankTracker');
const { getIntegrationHealth } = require('./services/integrationHealth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Preset sample products for Listing Studio
const SAMPLE_PRESETS = [
  {
    id: 'sample-camp-cap',
    original_name: '2026 어반 고프코어 나일론 스트랩 5패널 캠프캡 생활방수 모자',
    cost_price: 6800,
    selling_price: 19800,
    supplier: '도매꾹 (우정트레이딩)',
    product_url: 'https://domeggook.com/sample-item-12345',
    image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80',
    supply_shipping: 3000,
    customer_shipping: 3000,
    market_fee_rate: 10.8,
    packaging_cost: 500
  },
  {
    id: 'sample-ball-cap',
    original_name: '데일리 딥 워싱 코튼 소두핏 무지 볼캡 깊은 대두 야구모자 남녀공용',
    cost_price: 5200,
    selling_price: 16900,
    supplier: '온채널 (스타일마켓)',
    product_url: 'https://onchannel.com/sample-item-67890',
    image_url: 'https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?w=600&auto=format&fit=crop&q=80',
    supply_shipping: 3000,
    customer_shipping: 3000,
    market_fee_rate: 5.8,
    packaging_cost: 400
  }
];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'WOOJUNG SELLER Daily Sourcing Engine V4', timestamp: new Date().toISOString() });
});

// Integration & Environment Diagnostics Check
app.get('/api/health/integrations', (req, res) => {
  try {
    const health = getIntegrationHealth();
    res.json(health);
  } catch (error) {
    console.error('Integration health check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 🌟 V4 Daily Sourcing Dashboard APIs
// ==========================================

// 1. Get Daily Dashboard Top Candidates & Stats
app.get('/api/daily/dashboard', async (req, res) => {
  try {
    let topCandidates = db.getDailyTopCandidates(5);
    const stats = db.getDailyDashboardStats();

    // 만약 DB에 저장된 후보가 없다면, 기본 벤치마크 키워드(캠프캡)로 자동 1회 수집 실행
    if (topCandidates.length === 0) {
      try {
        const report = await analyzeMarketData('캠프캡');
        const savedReport = db.saveMarketReport(report);
        const candidates = extractProductCandidates(savedReport);
        db.saveProductCandidates(candidates);
        topCandidates = db.getDailyTopCandidates(5);
      } catch (autoErr) {
        console.error('Initial auto-collect error:', autoErr);
      }
    }

    res.json({
      success: true,
      today: new Date().toISOString().split('T')[0],
      stats: db.getDailyDashboardStats(),
      candidates: topCandidates
    });
  } catch (error) {
    console.error('Daily dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Update Candidate Status (INTERESTED / WATCH / EXCLUDED / PENDING)
app.patch('/api/daily/candidate/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'INTERESTED', 'INTEREST', 'WATCH', 'EXCLUDED', 'EXCLUDE'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: '유효한 상태값이 아닙니다.' });
    }

    const updated = db.updateCandidateStatus(id, status);
    res.json({ success: true, candidate: updated });
  } catch (error) {
    console.error('Update candidate status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 🔍 Market Research Engine V2.0 & Candidate Finder V1
// ==========================================

// 3. Get Live Test Benchmark Keywords
app.get('/api/market/samples', (req, res) => {
  const sampleKeywords = [
    { keyword: '캠프캡', badge: 'SearchAd & SerpApi Live', type: 'LIVE' },
    { keyword: '볼캡', badge: 'SearchAd & SerpApi Live', type: 'LIVE' },
    { keyword: '바라클라바', badge: 'SearchAd & SerpApi Live', type: 'LIVE' },
    { keyword: '나일론 크로스백', badge: 'SearchAd & SerpApi Live', type: 'LIVE' }
  ];
  res.json({ success: true, samples: sampleKeywords });
});

// 4. Analyze Keyword (Live Data Collection)
app.post('/api/market/analyze', async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) {
      return res.status(400).json({ success: false, error: '분석할 키워드를 입력해주세요.' });
    }

    // Run live data collection
    const report = await analyzeMarketData(keyword);

    // The report owns analysis metadata and a raw collection snapshot. The
    // canonical, user-actionable product list is saved to product_candidates.
    const saved = db.saveMarketReport(report);
    const candidates = extractProductCandidates(saved);
    const savedCandidates = db.saveProductCandidates(candidates);

    res.json({ success: true, data: saved, candidates: savedCandidates });
  } catch (error) {
    console.error('Market analyze error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4-1. Load More Products for Market Report (Pagination)
app.post('/api/market/more-products', async (req, res) => {
  try {
    const { reportId, keyword, batchIndex } = req.body;
    let report = reportId ? db.getMarketReportById(reportId) : null;
    const kw = keyword || report?.keyword;

    if (!kw) {
      return res.status(400).json({ success: false, error: '키워드가 필요합니다.' });
    }

    // top_products remains a raw collector snapshot for backward-compatible
    // report responses. It is never the UI/catalog source of truth.
    const existingProducts = report?.top_products || [];
    const moreResult = await fetchMoreMarketProducts(kw, existingProducts, batchIndex || 1);

    if (report) {
      report.top_products = moreResult.allProducts;
      db.saveMarketReport(report);

      // Persist only the newly collected raw listings. saveProductCandidates
      // applies the shared identity rule and merges known products safely.
      const newCandidates = extractProductCandidates({
        ...report,
        top_products: moreResult.newProducts
      });
      db.saveProductCandidates(newCandidates);
    }

    const canonicalCandidates = report ? db.getProductCandidatesByReportId(report.id) : [];

    res.json({
      success: true,
      data: {
        newProducts: moreResult.newProducts,
        allProducts: moreResult.allProducts,
        totalCount: canonicalCandidates.length || moreResult.totalCount,
        candidates: canonicalCandidates
      }
    });
  } catch (error) {
    console.error('Market more-products error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Extract Candidates from Market Report (Candidate Finder V1)
app.post('/api/market/candidates', async (req, res) => {
  try {
    const { reportId, keyword } = req.body;
    let report = null;

    if (reportId) {
      report = db.getMarketReportById(reportId);
    } else if (keyword) {
      report = await analyzeMarketData(keyword);
      report = db.saveMarketReport(report);
    }

    if (!report) {
      return res.status(400).json({ success: false, error: '유효한 분석 리포트 또는 키워드가 필요합니다.' });
    }

    // Compatibility endpoint: raw report snapshot -> canonical candidates.
    // Repeating this call is idempotent for identified products.
    const candidates = extractProductCandidates(report);

    // Save candidates to DB
    const savedCandidates = db.saveProductCandidates(candidates);

    res.json({
      success: true,
      report_id: report.id,
      keyword: report.keyword,
      candidates: savedCandidates,
      summary: {
        total_extracted: savedCandidates.length,
        interest_count: savedCandidates.filter(c => c.status === 'INTEREST' || c.status === 'INTERESTED').length,
        watch_count: savedCandidates.filter(c => c.status === 'WATCH').length,
        exclude_count: savedCandidates.filter(c => c.status === 'EXCLUDE' || c.status === 'EXCLUDED').length,
        unknown_count: savedCandidates.filter(c => c.status === 'UNKNOWN').length
      }
    });
  } catch (error) {
    console.error('Extract candidates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Get Candidates for a Report
app.get('/api/market/candidates/:reportId', (req, res) => {
  try {
    const candidates = db.getProductCandidatesByReportId(req.params.reportId);
    res.json({ success: true, candidates, count: candidates.length });
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 🏭 Supplier Scout V3 APIs (공급처 검색 URL & 비교 & 마진)
// ==========================================

// 7. Generate Supplier Search Keywords for a Candidate
app.post('/api/supplier/keywords', (req, res) => {
  try {
    const { title, keyword } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: '상품명이 필요합니다.' });
    }

    const featureResult = extractProductFeatures(title, keyword);
    res.json({ success: true, data: featureResult });
  } catch (error) {
    console.error('Extract supplier keywords error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 8. Get Candidate Details along with linked Supplier Items
app.get('/api/supplier/candidate/:candidateId', (req, res) => {
  try {
    const candidate = db.getCandidateById(req.params.candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, error: '후보 상품을 찾을 수 없습니다.' });
    }

    const supplierItems = db.getSupplierItemsByCandidateId(req.params.candidateId);
    const featureResult = extractProductFeatures(candidate.title, candidate.keyword);

    res.json({
      success: true,
      candidate,
      features: featureResult,
      suppliers: supplierItems
    });
  } catch (error) {
    console.error('Get candidate supplier info error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 9. Save / Update Supplier Item & Auto-Calculate Margin
app.post('/api/supplier/item', (req, res) => {
  try {
    const itemData = req.body;
    if (!itemData.candidate_id) {
      return res.status(400).json({ success: false, error: 'candidate_id가 필요합니다.' });
    }
    if (!db.getCandidateById(itemData.candidate_id)) {
      return res.status(404).json({ success: false, error: '연결할 candidate를 찾을 수 없습니다.' });
    }

    if (!itemData.id) {
      itemData.id = uuidv4();
    }

    const rawUnitCost = itemData.unit_cost;
    const hasValidUnitCost = rawUnitCost !== null && rawUnitCost !== undefined && rawUnitCost !== '' && !isNaN(Number(rawUnitCost));
    const unitCost = hasValidUnitCost ? Number(rawUnitCost) : null;
    const sellingPrice = Number(itemData.selling_price) || 0;

    let marginSim = {};
    if (unitCost !== null && unitCost >= 0 && sellingPrice > 0) {
      const supplyShipping = Number(itemData.supply_shipping) !== undefined && itemData.supply_shipping !== ''
        ? Number(itemData.supply_shipping)
        : (itemData.platform === '1688' ? 6000 : 3000);
      const customerShipping = Number(itemData.customer_shipping) || 3000;
      const packagingCost = Number(itemData.packaging_cost) || 500;
      const marketFeeRate = Number(itemData.market_fee_rate) || 10.8;

      marginSim = calculateMargin({
        ...itemData,
        cost_price: unitCost,
        selling_price: sellingPrice,
        supply_shipping: supplyShipping,
        customer_shipping: customerShipping,
        packaging_cost: packagingCost,
        market_fee_rate: marketFeeRate
      });
    } else {
      marginSim = calculateMargin({
        ...itemData,
        cost_price: unitCost,
        selling_price: sellingPrice,
        unknown_handling: 'strict'
      });
    }

    itemData.unit_cost = unitCost;
    itemData.margin_simulation = marginSim;
    const saved = db.saveSupplierItem(itemData);

    res.json({ success: true, data: saved });
  } catch (error) {
    console.error('Save supplier item error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Standalone Margin Calculation Endpoint
app.post('/api/margin/calculate', (req, res) => {
  try {
    const result = calculateMargin(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Margin calculation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Select/reject a supplier without changing sourcing or margin behavior.
app.patch('/api/supplier/item/:id/workflow-status', (req, res) => {
  try {
    const { status } = req.body;
    if (!['RESEARCHING', 'CANDIDATE', 'SELECTED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, error: '유효한 Supplier 상태값이 아닙니다.' });
    }
    const item = db.updateSupplierWorkflowStatus(req.params.id, status);
    if (!item) return res.status(404).json({ success: false, error: '공급처를 찾을 수 없습니다.' });
    res.json({ success: true, data: item });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Resolve Listing Studio inputs by canonical workflow id, not a copied UI object.
app.get('/api/workflow/candidates/:candidateId/listing-seed', (req, res) => {
  const candidate = db.getCandidateById(req.params.candidateId);
  if (!candidate) return res.status(404).json({ success: false, error: 'candidate를 찾을 수 없습니다.' });
  const supplier = db.getSupplierItemsByCandidateId(candidate.id).find(item => item.workflow_status === 'SELECTED');
  if (!supplier) return res.status(409).json({ success: false, error: 'Listing으로 진행하려면 SELECTED 공급처가 필요합니다.' });
  res.json({ success: true, data: {
    candidate_id: candidate.id, supplier_item_id: supplier.id,
    original_name: candidate.title, cost_price: supplier.unit_cost !== null ? supplier.unit_cost : 0,
    selling_price: candidate.price || 25000, supplier: supplier.supplier_name || supplier.platform,
    product_url: candidate.product_url, image_url: candidate.image_url,
    supply_shipping: supplier.supply_shipping !== undefined ? supplier.supply_shipping : 0, customer_shipping: 3000,
    market_fee_rate: 10.8, packaging_cost: 500,
    moq: supplier.moq || 1, currency: supplier.currency || 'KRW',
    exchange_rate: supplier.exchange_rate || (supplier.currency === 'CNY' ? 195 : supplier.currency === 'USD' ? 1350 : 1),
    margin_simulation: supplier.margin_simulation || {}
  }});
});

// Workflow Lineage: full canonical lineage for a candidate
app.get('/api/workflow/candidates/:candidateId/lineage', (req, res) => {
  try {
    const lineage = db.getWorkflowLineage(req.params.candidateId);
    if (!lineage) return res.status(404).json({ success: false, error: 'candidate를 찾을 수 없습니다.' });
    res.json({ success: true, data: lineage });
  } catch (error) {
    console.error('Workflow lineage error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 10. Delete Supplier Item
app.delete('/api/supplier/item/:id', (req, res) => {
  try {
    db.deleteSupplierItem(req.params.id);
    res.json({ success: true, message: '공급처 후보가 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete supplier item error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 11. Get All Market Reports
app.get('/api/market/reports', (req, res) => {
  try {
    const reports = db.getAllMarketReports();
    res.json({ success: true, data: reports, count: reports.length });
  } catch (error) {
    console.error('Get market reports error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 12. Get Single Market Report
app.get('/api/market/reports/:id', (req, res) => {
  try {
    const report = db.getMarketReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: '보고서를 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Get market report error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ⚡ Listing Studio (Product Transformation) APIs
// ==========================================

// Get Sample Presets
app.get('/api/samples', (req, res) => {
  res.json({ success: true, samples: SAMPLE_PRESETS });
});

// AI Transformation Pipeline API
app.post('/api/transform', (req, res) => {
  try {
    const productData = req.body;
    
    if (!productData.original_name) {
      return res.status(400).json({ success: false, error: '원본 상품명을 입력해주세요.' });
    }

    const marginResult = calculateMargin(productData);
    const aiResult = generateProductTransformation(productData);

    const result = {
      id: productData.id || uuidv4(),
      candidate_id: productData.candidate_id || null,
      supplier_item_id: productData.supplier_item_id || null,
      original_name: productData.original_name,
      cost_price: marginResult.cost_price,
      selling_price: marginResult.selling_price,
      supplier: productData.supplier || '',
      product_url: productData.product_url || '',
      image_url: productData.image_url || '',
      supply_shipping: marginResult.supply_shipping,
      customer_shipping: marginResult.customer_shipping,
      market_fee_rate: marginResult.market_fee_rate,
      margin_amount: marginResult.margin_amount,
      margin_rate: marginResult.margin_rate,
      packaging_cost: marginResult.packaging_cost,
      generated_title: aiResult.generated_title,
      keywords: aiResult.keywords,
      key_benefits: aiResult.key_benefits,
      detail_structure: aiResult.detail_structure,
      detail_copy: aiResult.detail_copy,
      status: 'CONVERTED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Transform error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save / Update Product in DB
app.post('/api/products', (req, res) => {
  try {
    const product = req.body;
    if (product.candidate_id) {
      const candidate = db.getCandidateById(product.candidate_id);
      const supplier = product.supplier_item_id && db.getSupplierItemById(product.supplier_item_id);
      if (!candidate || !supplier || supplier.candidate_id !== candidate.id || supplier.workflow_status !== 'SELECTED') {
        return res.status(400).json({ success: false, error: 'Listing 저장에는 동일 candidate의 SELECTED 공급처가 필요합니다.' });
      }
    }
    if (!product.id) {
      product.id = uuidv4();
    }
    if (!product.created_at) {
      product.created_at = new Date().toISOString();
    }
    product.status = product.status === 'SAVED' ? 'DRAFT' : (product.status || 'DRAFT');
    if (!['DRAFT', 'READY', 'PUBLISHED', 'PAUSED'].includes(product.status)) {
      return res.status(400).json({ success: false, error: '유효한 Listing 상태값이 아닙니다.' });
    }

    const saved = db.saveProduct(product);
    res.json({ success: true, data: saved, lineage: { candidate_id: saved.candidate_id || null, supplier_item_id: saved.supplier_item_id || null } });
  } catch (error) {
    console.error('Save product error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/products/:id/status', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    const next = req.body.status;
    const allowed = { DRAFT: ['READY'], READY: ['PUBLISHED', 'PAUSED'], PUBLISHED: ['PAUSED'], PAUSED: ['READY'] };
    if (!product) return res.status(404).json({ success: false, error: '상품을 찾을 수 없습니다.' });
    if (!['DRAFT', 'READY', 'PUBLISHED', 'PAUSED'].includes(next) || !(allowed[product.status] || []).includes(next)) {
      return res.status(400).json({ success: false, error: `Listing 상태 전이 불가: ${product.status} → ${next}` });
    }
    res.json({ success: true, data: db.saveProduct({ ...product, status: next }) });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

// Get all products
app.get('/api/products', (req, res) => {
  try {
    const products = db.getAllProducts();
    res.json({ success: true, data: products, count: products.length });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get product by id
app.get('/api/products/:id', (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: '상품을 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  try {
    db.deleteProduct(req.params.id);
    res.json({ success: true, message: '상품이 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 📈 SmartStore Keyword Rank Tracker V1 APIs
// ==========================================

// 1. Get All Rank Targets with Latest Rank, Yesterday Rank & Delta
app.get('/api/rank-tracker/targets', (req, res) => {
  try {
    const targets = db.getRankTargetsWithLatestRank();
    res.json({
      success: true,
      data: targets,
      count: targets.length
    });
  } catch (error) {
    console.error('Get rank targets error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Create / Register Rank Targets (Supports batch keyword registration)
app.post('/api/rank-tracker/targets', async (req, res) => {
  try {
    const { product_id, product_name, product_url, nv_mid, mall_name, keywords, target_rank } = req.body;

    const product = product_id ? db.getProductById(product_id) : null;
    if (product_id && (!product || !['READY', 'PUBLISHED'].includes(product.status))) {
      return res.status(400).json({ success: false, error: 'Rank 연결에는 READY 또는 PUBLISHED Listing이 필요합니다.' });
    }

    if (!product_name || !mall_name) {
      return res.status(400).json({ success: false, error: '상품명과 스마트스토어 판매처명(mall_name)은 필수입니다.' });
    }

    let keywordList = [];
    if (Array.isArray(keywords)) {
      keywordList = keywords.map(k => String(k).trim()).filter(Boolean);
    } else if (typeof keywords === 'string') {
      keywordList = keywords.split(/[,\n]/).map(k => k.trim()).filter(Boolean);
    }

    if (keywordList.length === 0) {
      return res.status(400).json({ success: false, error: '최소 1개 이상의 추적 키워드가 필요합니다.' });
    }

    // Limit to 10 keywords per request
    const cappedKeywords = keywordList.slice(0, 10);
    const newTargets = [];

    for (const kw of cappedKeywords) {
      const targetId = uuidv4();
      const targetObj = {
        id: targetId,
        product_id: product_id || null,
        candidate_id: product?.candidate_id || null,
        product_name: (product?.generated_title || product?.original_name || product_name).trim(),
        product_url: (product?.product_url || product_url || '').trim(),
        nv_mid: (nv_mid || '').trim(),
        mall_name: mall_name.trim(),
        keyword: kw,
        target_rank: Number(target_rank) || 10,
        active: 1, workflow_status: 'ACTIVE',
        created_at: new Date().toISOString()
      };
      newTargets.push(targetObj);
    }

    const saved = db.saveRankTargetsBatch(newTargets);
    res.json({
      success: true,
      data: saved,
      count: saved.length,
      message: `${saved.length}개 키워드 추적 대상이 성공적으로 등록되었습니다.`
    });
  } catch (error) {
    console.error('Create rank targets error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Update Rank Target (e.g. toggle active)
app.patch('/api/rank-tracker/targets/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = db.updateRankTarget(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: '추적 대상을 찾을 수 없습니다.' });
    }
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update rank target error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Delete Rank Target
app.delete('/api/rank-tracker/targets/:id', (req, res) => {
  try {
    db.deleteRankTarget(req.params.id);
    res.json({ success: true, message: '추적 대상 및 순위 이력이 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete rank target error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Track Rank Instantly for a Single Target
app.post('/api/rank-tracker/targets/:id/check', async (req, res) => {
  try {
    const target = db.getRankTargetById(req.params.id);
    if (!target) {
      return res.status(404).json({ success: false, error: '추적 대상을 찾을 수 없습니다.' });
    }

    const result = await trackTargetRank(target);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Instant check rank target error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Track Rank Instantly for All Active Targets
app.post('/api/rank-tracker/check-all', async (req, res) => {
  try {
    const results = await trackAllActiveTargets();
    res.json({
      success: true,
      data: results,
      total_checked: results.length
    });
  } catch (error) {
    console.error('Check all targets error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 7. Get History for a Target
app.get('/api/rank-tracker/history/:targetId', (req, res) => {
  try {
    const history = db.getRankHistoryByTargetId(req.params.targetId, 30);
    res.json({ success: true, data: history, count: history.length });
  } catch (error) {
    console.error('Get rank history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// 🚀 Production Static File Serving & SPA Fallback
// ==========================================
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // SPA fallback for all GET requests that are not /api/...
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(clientDistPath, 'index.html'));
    }
    next();
  });
}

// 404 handler for unmatched API requests
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WOOJUNG SELLER running on port ${PORT} (0.0.0.0)`);
  // Initialize daily automated scheduler
  initDailyRankScheduler();
});
