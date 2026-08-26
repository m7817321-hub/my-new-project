const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = process.env.WOOJUNG_DB_PATH || path.join(dataDir, 'woojung.db');
const db = new Database(dbPath);
const { getCanonicalProductIdentity } = require('./services/productIdentity');

db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    candidate_id TEXT,
    supplier_item_id TEXT,
    original_name TEXT NOT NULL,
    cost_price INTEGER NOT NULL DEFAULT 0,
    selling_price INTEGER NOT NULL DEFAULT 0,
    supplier TEXT DEFAULT '',
    product_url TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    supply_shipping INTEGER DEFAULT 0,
    customer_shipping INTEGER DEFAULT 0,
    market_fee_rate REAL DEFAULT 10.8,
    margin_amount INTEGER DEFAULT 0,
    margin_rate REAL DEFAULT 0,
    generated_title TEXT DEFAULT '',
    keywords TEXT DEFAULT '[]',
    key_benefits TEXT DEFAULT '[]',
    detail_structure TEXT DEFAULT '[]',
    detail_copy TEXT DEFAULT '',
    status TEXT DEFAULT 'DRAFT',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS market_research_reports (
    id TEXT PRIMARY KEY,
    keyword TEXT NOT NULL,
    search_volume_status TEXT DEFAULT 'UNKNOWN',
    monthly_search_total INTEGER,
    monthly_search_pc INTEGER,
    monthly_search_mobile INTEGER,
    total_products INTEGER,
    competition_ratio REAL,
    avg_price INTEGER,
    median_price INTEGER,
    min_price INTEGER,
    max_price INTEGER,
    price_distribution TEXT DEFAULT '[]',
    top_products TEXT DEFAULT '[]',
    avg_review_count INTEGER,
    median_review_count INTEGER,
    trend_status TEXT DEFAULT 'UNKNOWN',
    trend_data TEXT DEFAULT '[]',
    related_keywords TEXT DEFAULT '[]',
    opportunity_score INTEGER,
    recommendation TEXT NOT NULL DEFAULT 'HOLD',
    recommendation_reasons TEXT DEFAULT '[]',
    field_sources TEXT DEFAULT '{}',
    data_source TEXT NOT NULL,
    collected_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS product_candidates (
    id TEXT PRIMARY KEY,
    report_id TEXT NOT NULL,
    keyword TEXT NOT NULL,
    rank INTEGER,
    title TEXT NOT NULL,
    price INTEGER,
    price_tier TEXT DEFAULT 'UNKNOWN',
    mall_name TEXT DEFAULT '',
    brand_type TEXT DEFAULT 'SOHO',
    review_count INTEGER,
    rating REAL,
    is_ad INTEGER DEFAULT 0,
    image_url TEXT DEFAULT '',
    product_url TEXT DEFAULT '',
    is_catalog TEXT DEFAULT 'UNKNOWN',
    catalog_id TEXT,
    cat_id TEXT,
    nv_mid TEXT,
    seller_count INTEGER,
    catalog_min_price INTEGER,
    catalog_detection_source TEXT DEFAULT 'UNKNOWN',
    canonical_identity TEXT,
    identity_type TEXT NOT NULL DEFAULT 'UNKNOWN',
    status TEXT NOT NULL DEFAULT 'PENDING',
    reasons TEXT DEFAULT '[]',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS supplier_items (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    product_title TEXT DEFAULT '',
    supplier_name TEXT DEFAULT '',
    supplier_url TEXT DEFAULT '',
    unit_cost INTEGER,
    currency TEXT DEFAULT 'KRW',
    moq INTEGER DEFAULT 1,
    supply_shipping INTEGER DEFAULT 0,
    notes TEXT DEFAULT '',
    verification_status TEXT DEFAULT 'UNVERIFIED',
    workflow_status TEXT NOT NULL DEFAULT 'RESEARCHING',
    margin_simulation TEXT DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS keyword_rank_targets (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    candidate_id TEXT,
    product_name TEXT NOT NULL,
    product_url TEXT DEFAULT '',
    nv_mid TEXT DEFAULT '',
    mall_name TEXT NOT NULL,
    keyword TEXT NOT NULL,
    target_rank INTEGER DEFAULT 10,
    active INTEGER DEFAULT 1,
    workflow_status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS keyword_rank_history (
    id TEXT PRIMARY KEY,
    target_id TEXT NOT NULL,
    tracked_at TEXT NOT NULL,
    organic_rank INTEGER,
    ad_rank INTEGER,
    total_rank INTEGER,
    price INTEGER,
    review_count INTEGER,
    status TEXT NOT NULL,
    matched_title TEXT DEFAULT '',
    matched_url TEXT DEFAULT '',
    matched_mall TEXT DEFAULT '',
    error_message TEXT DEFAULT '',
    FOREIGN KEY(target_id) REFERENCES keyword_rank_targets(id) ON DELETE CASCADE
  );
`);

// Try adding new columns if tables already existed
try { db.exec(`ALTER TABLE supplier_items ADD COLUMN product_title TEXT DEFAULT '';`); } catch(e){}
try { db.exec(`ALTER TABLE product_candidates ADD COLUMN is_catalog TEXT DEFAULT 'UNKNOWN';`); } catch(e){}
try { db.exec(`ALTER TABLE product_candidates ADD COLUMN catalog_id TEXT;`); } catch(e){}
try { db.exec(`ALTER TABLE product_candidates ADD COLUMN cat_id TEXT;`); } catch(e){}
try { db.exec(`ALTER TABLE product_candidates ADD COLUMN nv_mid TEXT;`); } catch(e){}
try { db.exec(`ALTER TABLE product_candidates ADD COLUMN seller_count INTEGER;`); } catch(e){}
try { db.exec(`ALTER TABLE product_candidates ADD COLUMN catalog_min_price INTEGER;`); } catch(e){}
try { db.exec(`ALTER TABLE product_candidates ADD COLUMN catalog_detection_source TEXT DEFAULT 'UNKNOWN';`); } catch(e){}
try { db.exec(`ALTER TABLE product_candidates ADD COLUMN canonical_identity TEXT;`); } catch(e){}
try { db.exec(`ALTER TABLE product_candidates ADD COLUMN identity_type TEXT NOT NULL DEFAULT 'UNKNOWN';`); } catch(e){}
try { db.exec(`ALTER TABLE products ADD COLUMN candidate_id TEXT;`); } catch(e){}
try { db.exec(`ALTER TABLE products ADD COLUMN supplier_item_id TEXT;`); } catch(e){}
try { db.exec(`ALTER TABLE supplier_items ADD COLUMN workflow_status TEXT NOT NULL DEFAULT 'RESEARCHING';`); } catch(e){}
try { db.exec(`ALTER TABLE keyword_rank_targets ADD COLUMN product_id TEXT;`); } catch(e){}
try { db.exec(`ALTER TABLE keyword_rank_targets ADD COLUMN workflow_status TEXT NOT NULL DEFAULT 'ACTIVE';`); } catch(e){}
try { db.exec(`ALTER TABLE keyword_rank_targets ADD COLUMN candidate_id TEXT;`); } catch(e){}
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_product_candidates_canonical_identity
  ON product_candidates(canonical_identity) WHERE canonical_identity IS NOT NULL;`);

// Migrate one representative of each already persisted, safely identifiable
// product. Historical duplicates are retained (no destructive migration), but
// future saves resolve to the representative and Daily can deduplicate them.
const legacyIdentityRows = db.prepare(`SELECT id, nv_mid, product_url FROM product_candidates ORDER BY datetime(created_at) DESC`).all();
const legacyIdentitySeen = new Set();
const setLegacyIdentity = db.prepare(`UPDATE product_candidates SET canonical_identity = ?, identity_type = ? WHERE id = ?`);
for (const row of legacyIdentityRows) {
  const identity = getCanonicalProductIdentity(row);
  if (!identity.identity || legacyIdentitySeen.has(identity.identity)) continue;
  setLegacyIdentity.run(identity.identity, identity.type, row.id);
  legacyIdentitySeen.add(identity.identity);
}

// --- Products Helper Functions ---
function getAllProducts() {
  const stmt = db.prepare(`SELECT * FROM products ORDER BY datetime(created_at) DESC`);
  const rows = stmt.all();
  return rows.map(row => ({
    ...row,
    keywords: JSON.parse(row.keywords || '[]'),
    key_benefits: JSON.parse(row.key_benefits || '[]'),
    detail_structure: JSON.parse(row.detail_structure || '[]'),
  }));
}

function getProductById(id) {
  const stmt = db.prepare(`SELECT * FROM products WHERE id = ?`);
  const row = stmt.get(id);
  if (!row) return null;
  return {
    ...row,
    keywords: JSON.parse(row.keywords || '[]'),
    key_benefits: JSON.parse(row.key_benefits || '[]'),
    detail_structure: JSON.parse(row.detail_structure || '[]'),
  };
}

function saveProduct(product) {
  const stmt = db.prepare(`
    INSERT INTO products (
      id, candidate_id, supplier_item_id, original_name, cost_price, selling_price, supplier, product_url, image_url,
      supply_shipping, customer_shipping, market_fee_rate, margin_amount, margin_rate,
      generated_title, keywords, key_benefits, detail_structure, detail_copy,
      status, created_at, updated_at
    ) VALUES (
      @id, @candidate_id, @supplier_item_id, @original_name, @cost_price, @selling_price, @supplier, @product_url, @image_url,
      @supply_shipping, @customer_shipping, @market_fee_rate, @margin_amount, @margin_rate,
      @generated_title, @keywords, @key_benefits, @detail_structure, @detail_copy,
      @status, @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      candidate_id = excluded.candidate_id,
      supplier_item_id = excluded.supplier_item_id,
      original_name = excluded.original_name,
      cost_price = excluded.cost_price,
      selling_price = excluded.selling_price,
      supplier = excluded.supplier,
      product_url = excluded.product_url,
      image_url = excluded.image_url,
      supply_shipping = excluded.supply_shipping,
      customer_shipping = excluded.customer_shipping,
      market_fee_rate = excluded.market_fee_rate,
      margin_amount = excluded.margin_amount,
      margin_rate = excluded.margin_rate,
      generated_title = excluded.generated_title,
      keywords = excluded.keywords,
      key_benefits = excluded.key_benefits,
      detail_structure = excluded.detail_structure,
      detail_copy = excluded.detail_copy,
      status = excluded.status,
      updated_at = excluded.updated_at
  `);

  const payload = {
    ...product,
    candidate_id: product.candidate_id || null,
    supplier_item_id: product.supplier_item_id || null,
    keywords: JSON.stringify(product.keywords || []),
    key_benefits: JSON.stringify(product.key_benefits || []),
    detail_structure: JSON.stringify(product.detail_structure || []),
    updated_at: new Date().toISOString()
  };

  stmt.run(payload);
  return getProductById(product.id);
}

function deleteProduct(id) {
  const stmt = db.prepare(`DELETE FROM products WHERE id = ?`);
  return stmt.run(id);
}

// --- Market Research Helper Functions ---
function saveMarketReport(report) {
  const stmt = db.prepare(`
    INSERT INTO market_research_reports (
      id, keyword, search_volume_status, monthly_search_total, monthly_search_pc, monthly_search_mobile,
      total_products, competition_ratio, avg_price, median_price, min_price, max_price,
      price_distribution, top_products, avg_review_count, median_review_count,
      trend_status, trend_data,
      related_keywords, opportunity_score, recommendation, recommendation_reasons,
      field_sources, data_source, collected_at, created_at
    ) VALUES (
      @id, @keyword, @search_volume_status, @monthly_search_total, @monthly_search_pc, @monthly_search_mobile,
      @total_products, @competition_ratio, @avg_price, @median_price, @min_price, @max_price,
      @price_distribution, @top_products, @avg_review_count, @median_review_count,
      @trend_status, @trend_data,
      @related_keywords, @opportunity_score, @recommendation, @recommendation_reasons,
      @field_sources, @data_source, @collected_at, @created_at
    )
    ON CONFLICT(id) DO UPDATE SET
      keyword = excluded.keyword,
      search_volume_status = excluded.search_volume_status,
      monthly_search_total = excluded.monthly_search_total,
      monthly_search_pc = excluded.monthly_search_pc,
      monthly_search_mobile = excluded.monthly_search_mobile,
      total_products = excluded.total_products,
      competition_ratio = excluded.competition_ratio,
      avg_price = excluded.avg_price,
      median_price = excluded.median_price,
      min_price = excluded.min_price,
      max_price = excluded.max_price,
      price_distribution = excluded.price_distribution,
      top_products = excluded.top_products,
      avg_review_count = excluded.avg_review_count,
      median_review_count = excluded.median_review_count,
      trend_status = excluded.trend_status,
      trend_data = excluded.trend_data,
      related_keywords = excluded.related_keywords,
      opportunity_score = excluded.opportunity_score,
      recommendation = excluded.recommendation,
      recommendation_reasons = excluded.recommendation_reasons,
      field_sources = excluded.field_sources,
      data_source = excluded.data_source,
      collected_at = excluded.collected_at
  `);

  const payload = {
    ...report,
    price_distribution: JSON.stringify(report.price_distribution || []),
    top_products: JSON.stringify(report.top_products || []),
    trend_data: JSON.stringify(report.trend_data || []),
    related_keywords: JSON.stringify(report.related_keywords || []),
    recommendation_reasons: JSON.stringify(report.recommendation_reasons || []),
    field_sources: JSON.stringify(report.field_sources || {}),
    created_at: report.created_at || new Date().toISOString()
  };

  stmt.run(payload);
  return getMarketReportById(report.id);
}

function getMarketReportById(id) {
  const stmt = db.prepare(`SELECT * FROM market_research_reports WHERE id = ?`);
  const row = stmt.get(id);
  if (!row) return null;
  return {
    ...row,
    price_distribution: JSON.parse(row.price_distribution || '[]'),
    top_products: JSON.parse(row.top_products || '[]'),
    trend_data: JSON.parse(row.trend_data || '[]'),
    related_keywords: JSON.parse(row.related_keywords || '[]'),
    recommendation_reasons: JSON.parse(row.recommendation_reasons || '[]'),
    field_sources: JSON.parse(row.field_sources || '{}'),
  };
}

function getAllMarketReports() {
  const stmt = db.prepare(`SELECT * FROM market_research_reports ORDER BY datetime(created_at) DESC`);
  const rows = stmt.all();
  return rows.map(row => ({
    ...row,
    price_distribution: JSON.parse(row.price_distribution || '[]'),
    top_products: JSON.parse(row.top_products || '[]'),
    trend_data: JSON.parse(row.trend_data || '[]'),
    related_keywords: JSON.parse(row.related_keywords || '[]'),
    recommendation_reasons: JSON.parse(row.recommendation_reasons || '[]'),
    field_sources: JSON.parse(row.field_sources || '{}'),
  }));
}

// --- Product Candidates Helper Functions ---
function saveProductCandidates(candidates) {
  if (!candidates || candidates.length === 0) return [];

  const insertStmt = db.prepare(`
    INSERT INTO product_candidates (
      id, report_id, keyword, rank, title, price, price_tier, mall_name,
      brand_type, review_count, rating, is_ad, image_url, product_url,
      is_catalog, catalog_id, cat_id, nv_mid, seller_count, catalog_min_price, catalog_detection_source,
      canonical_identity, identity_type, status, reasons, created_at
    ) VALUES (
      @id, @report_id, @keyword, @rank, @title, @price, @price_tier, @mall_name,
      @brand_type, @review_count, @rating, @is_ad, @image_url, @product_url,
      @is_catalog, @catalog_id, @cat_id, @nv_mid, @seller_count, @catalog_min_price, @catalog_detection_source,
      @canonical_identity, @identity_type, @status, @reasons, @created_at
    )`);

  const updateStmt = db.prepare(`UPDATE product_candidates SET
      report_id = @report_id,
      keyword = @keyword,
      rank = @rank,
      title = @title, price = @price, price_tier = @price_tier, mall_name = @mall_name,
      brand_type = @brand_type, review_count = @review_count, rating = @rating, is_ad = @is_ad,
      image_url = @image_url, product_url = @product_url, is_catalog = @is_catalog,
      catalog_id = @catalog_id, cat_id = @cat_id, nv_mid = @nv_mid, seller_count = @seller_count,
      catalog_min_price = @catalog_min_price, catalog_detection_source = @catalog_detection_source,
      canonical_identity = @canonical_identity, identity_type = @identity_type, reasons = @reasons
    WHERE id = @id`);
  const findByIdentity = db.prepare(`SELECT * FROM product_candidates WHERE canonical_identity = ?`);
  const findById = db.prepare(`SELECT * FROM product_candidates WHERE id = ?`);

  const insertMany = db.transaction((list) => {
    for (const c of list) {
      const identity = getCanonicalProductIdentity(c);
      const payload = {
        ...c,
        is_ad: c.is_ad ? 1 : 0,
        is_catalog: c.is_catalog || 'UNKNOWN',
        catalog_id: c.catalog_id || c.cat_id || null,
        cat_id: c.cat_id || c.catalog_id || null,
        nv_mid: identity.nv_mid || c.nv_mid || null,
        seller_count: typeof c.seller_count === 'number' ? c.seller_count : null,
        catalog_min_price: typeof c.catalog_min_price === 'number' ? c.catalog_min_price : null,
        catalog_detection_source: c.catalog_detection_source || 'UNKNOWN',
        canonical_identity: identity.identity,
        identity_type: identity.type,
        reasons: JSON.stringify(c.reasons || []),
        created_at: c.created_at || new Date().toISOString()
      };

      // Preserve the existing candidate id and user-managed status when the
      // same actual product is collected again in a later report.
      const existing = identity.identity
        ? findByIdentity.get(identity.identity)
        : findById.get(payload.id);
      if (existing) {
        payload.id = existing.id;
        // A repeated ad/listing is often sparse. Never erase previously
        // collected catalog metadata merely because the latest observation is
        // UNKNOWN or null.
        if (payload.is_catalog === 'UNKNOWN' && existing.is_catalog !== 'UNKNOWN') payload.is_catalog = existing.is_catalog;
        if (!payload.catalog_id && existing.catalog_id) payload.catalog_id = existing.catalog_id;
        if (!payload.cat_id && existing.cat_id) payload.cat_id = existing.cat_id;
        if (!payload.nv_mid && existing.nv_mid) payload.nv_mid = existing.nv_mid;
        if (payload.seller_count === null && existing.seller_count !== null) payload.seller_count = existing.seller_count;
        if (payload.catalog_min_price === null && existing.catalog_min_price !== null) payload.catalog_min_price = existing.catalog_min_price;
        if (payload.catalog_detection_source === 'UNKNOWN' && existing.catalog_detection_source !== 'UNKNOWN') {
          payload.catalog_detection_source = existing.catalog_detection_source;
        }
        payload.rank = Math.min(existing.rank || Number.MAX_SAFE_INTEGER, payload.rank || Number.MAX_SAFE_INTEGER);
        updateStmt.run(payload);
      } else {
        insertStmt.run(payload);
      }
    }
  });

  insertMany(candidates);
  return getProductCandidatesByReportId(candidates[0].report_id);
}

function getProductCandidatesByReportId(reportId) {
  const stmt = db.prepare(`SELECT * FROM product_candidates WHERE report_id = ? ORDER BY rank ASC`);
  const rows = stmt.all(reportId);
  return rows.map(r => ({
    ...r,
    is_ad: r.is_ad === 1,
    reasons: JSON.parse(r.reasons || '[]')
  }));
}

function getCandidateById(candidateId) {
  const stmt = db.prepare(`SELECT * FROM product_candidates WHERE id = ?`);
  const row = stmt.get(candidateId);
  if (!row) return null;
  return {
    ...row,
    is_ad: row.is_ad === 1,
    reasons: JSON.parse(row.reasons || '[]')
  };
}

function updateCandidateStatus(candidateId, status) {
  const current = getCandidateById(candidateId);
  if (!current) return null;
  const normalized = { INTEREST: 'INTERESTED', EXCLUDE: 'EXCLUDED' }[status] || status;
  const allowed = {
    PENDING: ['INTERESTED', 'WATCH', 'EXCLUDED'],
    INTERESTED: ['WATCH', 'EXCLUDED'],
    WATCH: ['INTERESTED', 'EXCLUDED'],
    EXCLUDED: ['PENDING']
  };
  const currentStatus = { INTEREST: 'INTERESTED', EXCLUDE: 'EXCLUDED' }[current.status] || current.status;
  if (currentStatus !== normalized && !(allowed[currentStatus] || []).includes(normalized)) {
    throw new Error(`Candidate 상태 전이 불가: ${currentStatus} → ${normalized}`);
  }
  const stmt = db.prepare(`UPDATE product_candidates SET status = ? WHERE id = ?`);
  stmt.run(normalized, candidateId);
  return getCandidateById(candidateId);
}

// V4 Daily Dashboard: 모든 후보 중 최신 리포트와 결합하여 고유 상품 기준 TOP 5 추출 (Deduplicated)
function getDailyTopCandidates(limit = 5) {
  // 최신 market_research_reports와 JOIN하여 검색량, 트렌드, 중앙가격 결합 (최신순 및 상태 우선순위 정렬)
  const stmt = db.prepare(`
    SELECT 
      c.*,
      r.monthly_search_total,
      r.trend_status,
      r.median_price as market_median_price,
      r.collected_at as report_collected_at
    FROM product_candidates c
    JOIN market_research_reports r ON c.report_id = r.id
    ORDER BY 
      CASE 
        WHEN c.status = 'INTERESTED' THEN 1
        WHEN c.status = 'INTEREST' THEN 2
        WHEN c.status = 'PENDING' THEN 3
        WHEN c.status = 'WATCH' THEN 4
        WHEN c.status = 'EXCLUDED' THEN 5
        ELSE 6
      END ASC,
      datetime(r.collected_at) DESC,
      c.rank ASC
  `);

  const allRows = stmt.all();
  const uniqueCandidates = [];
  const seenIdentities = new Set();

  for (const row of allRows) {
    const identity = row.canonical_identity
      ? { identity: row.canonical_identity, type: row.identity_type, nv_mid: row.nv_mid }
      : getCanonicalProductIdentity(row);

    // UNKNOWN rows are intentionally not guessed from title or mall name.
    if (identity.identity && seenIdentities.has(identity.identity)) continue;
    if (identity.identity) seenIdentities.add(identity.identity);

    uniqueCandidates.push({
      ...row,
      nv_mid: identity.nv_mid || row.nv_mid,
      is_ad: row.is_ad === 1,
      reasons: JSON.parse(row.reasons || '[]')
    });

    if (uniqueCandidates.length >= limit) break;
  }

  return uniqueCandidates;
}

function getDailyDashboardStats() {
  const totalCountRow = db.prepare(`SELECT COUNT(*) as count FROM product_candidates`).get();
  const pendingCountRow = db.prepare(`SELECT COUNT(*) as count FROM product_candidates WHERE status IN ('PENDING', 'INTEREST', 'WATCH')`).get();
  const interestedCountRow = db.prepare(`SELECT COUNT(*) as count FROM product_candidates WHERE status = 'INTERESTED'`).get();
  const latestReportRow = db.prepare(`SELECT collected_at FROM market_research_reports ORDER BY datetime(collected_at) DESC LIMIT 1`).get();

  return {
    total_candidates: totalCountRow ? totalCountRow.count : 0,
    pending_count: pendingCountRow ? pendingCountRow.count : 0,
    interested_count: interestedCountRow ? interestedCountRow.count : 0,
    latest_collected_at: latestReportRow ? latestReportRow.collected_at : null
  };
}

// --- Supplier Items Helper Functions ---
function saveSupplierItem(item) {
  const stmt = db.prepare(`
    INSERT INTO supplier_items (
      id, candidate_id, platform, product_title, supplier_name, supplier_url, unit_cost,
      currency, moq, supply_shipping, notes, verification_status, workflow_status, margin_simulation,
      created_at, updated_at
    ) VALUES (
      @id, @candidate_id, @platform, @product_title, @supplier_name, @supplier_url, @unit_cost,
      @currency, @moq, @supply_shipping, @notes, @verification_status, @workflow_status, @margin_simulation,
      @created_at, @updated_at
    )
    ON CONFLICT(id) DO UPDATE SET
      platform = excluded.platform,
      product_title = excluded.product_title,
      supplier_name = excluded.supplier_name,
      supplier_url = excluded.supplier_url,
      unit_cost = excluded.unit_cost,
      currency = excluded.currency,
      moq = excluded.moq,
      supply_shipping = excluded.supply_shipping,
      notes = excluded.notes,
      verification_status = excluded.verification_status,
      workflow_status = excluded.workflow_status,
      margin_simulation = excluded.margin_simulation,
      updated_at = excluded.updated_at
  `);

  const payload = {
    id: item.id,
    candidate_id: item.candidate_id,
    platform: item.platform || '1688',
    product_title: item.product_title || '',
    supplier_name: item.supplier_name || '',
    supplier_url: item.supplier_url || '',
    unit_cost: item.unit_cost !== null && item.unit_cost !== undefined && item.unit_cost !== '' ? Number(item.unit_cost) : null,
    currency: item.currency || 'KRW',
    moq: Number(item.moq) || 1,
    supply_shipping: Number(item.supply_shipping) || 0,
    notes: item.notes || '',
    verification_status: item.verification_status || 'UNVERIFIED',
    workflow_status: item.workflow_status || 'RESEARCHING',
    margin_simulation: JSON.stringify(item.margin_simulation || {}),
    created_at: item.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  stmt.run(payload);
  return getSupplierItemById(item.id);
}

function getSupplierItemById(id) {
  const stmt = db.prepare(`SELECT * FROM supplier_items WHERE id = ?`);
  const row = stmt.get(id);
  if (!row) return null;
  return {
    ...row,
    margin_simulation: JSON.parse(row.margin_simulation || '{}')
  };
}

function getSupplierItemsByCandidateId(candidateId) {
  const stmt = db.prepare(`SELECT * FROM supplier_items WHERE candidate_id = ? ORDER BY datetime(created_at) DESC`);
  const rows = stmt.all(candidateId);
  return rows.map(r => ({
    ...r,
    margin_simulation: JSON.parse(r.margin_simulation || '{}')
  }));
}

function deleteSupplierItem(id) {
  const stmt = db.prepare(`DELETE FROM supplier_items WHERE id = ?`);
  return stmt.run(id);
}

function updateSupplierWorkflowStatus(id, status) {
  const current = getSupplierItemById(id);
  if (!current) return null;
  const allowed = {
    RESEARCHING: ['CANDIDATE', 'SELECTED', 'REJECTED'],
    CANDIDATE: ['SELECTED', 'REJECTED'],
    SELECTED: ['REJECTED'],
    REJECTED: ['CANDIDATE']
  };
  if (current.workflow_status !== status && !(allowed[current.workflow_status] || []).includes(status)) {
    throw new Error(`Supplier 상태 전이 불가: ${current.workflow_status} → ${status}`);
  }
  if (status === 'SELECTED') {
    db.prepare(`UPDATE supplier_items SET workflow_status = 'REJECTED' WHERE candidate_id = ? AND id <> ? AND workflow_status = 'SELECTED'`).run(current.candidate_id, id);
  }
  db.prepare(`UPDATE supplier_items SET workflow_status = ? WHERE id = ?`).run(status, id);
  return getSupplierItemById(id);
}

// --- Keyword Rank Tracker Helper Functions ---
function saveRankTarget(target) {
  const stmt = db.prepare(`
    INSERT INTO keyword_rank_targets (
      id, product_id, candidate_id, product_name, product_url, nv_mid, mall_name, keyword, target_rank, active, workflow_status, created_at
    ) VALUES (
      @id, @product_id, @candidate_id, @product_name, @product_url, @nv_mid, @mall_name, @keyword, @target_rank, @active, @workflow_status, @created_at
    )
    ON CONFLICT(id) DO UPDATE SET
      product_id = excluded.product_id,
      candidate_id = excluded.candidate_id,
      product_name = excluded.product_name,
      product_url = excluded.product_url,
      nv_mid = excluded.nv_mid,
      mall_name = excluded.mall_name,
      keyword = excluded.keyword,
      target_rank = excluded.target_rank,
      active = excluded.active, workflow_status = excluded.workflow_status
  `);

  const payload = {
    id: target.id,
    product_id: target.product_id || null,
    candidate_id: target.candidate_id || null,
    product_name: target.product_name,
    product_url: target.product_url || '',
    nv_mid: target.nv_mid || '',
    mall_name: target.mall_name,
    keyword: target.keyword.trim(),
    target_rank: Number(target.target_rank) || 10,
    active: target.active === 0 ? 0 : 1,
    workflow_status: target.workflow_status || (target.active === 0 ? 'PAUSED' : 'ACTIVE'),
    created_at: target.created_at || new Date().toISOString()
  };

  stmt.run(payload);
  return getRankTargetById(target.id);
}

function saveRankTargetsBatch(targets) {
  const insertMany = db.transaction((items) => {
    const results = [];
    for (const t of items) {
      results.push(saveRankTarget(t));
    }
    return results;
  });
  return insertMany(targets);
}

function getRankTargetById(id) {
  const stmt = db.prepare(`SELECT * FROM keyword_rank_targets WHERE id = ?`);
  return stmt.get(id);
}

function getAllRankTargets(onlyActive = false) {
  let query = `SELECT * FROM keyword_rank_targets`;
  if (onlyActive) {
    query += ` WHERE active = 1`;
  }
  query += ` ORDER BY datetime(created_at) DESC`;
  const stmt = db.prepare(query);
  return stmt.all();
}

function updateRankTarget(id, updates) {
  const current = getRankTargetById(id);
  if (!current) return null;

  const merged = { ...current, ...updates };
  return saveRankTarget(merged);
}

function deleteRankTarget(id) {
  const deleteHistory = db.prepare(`DELETE FROM keyword_rank_history WHERE target_id = ?`);
  deleteHistory.run(id);
  const stmt = db.prepare(`DELETE FROM keyword_rank_targets WHERE id = ?`);
  return stmt.run(id);
}

function saveRankHistory(history) {
  const stmt = db.prepare(`
    INSERT INTO keyword_rank_history (
      id, target_id, tracked_at, organic_rank, ad_rank, total_rank, price, review_count, status, matched_title, matched_url, matched_mall, error_message
    ) VALUES (
      @id, @target_id, @tracked_at, @organic_rank, @ad_rank, @total_rank, @price, @review_count, @status, @matched_title, @matched_url, @matched_mall, @error_message
    )
  `);

  const payload = {
    id: history.id,
    target_id: history.target_id,
    tracked_at: history.tracked_at || new Date().toISOString(),
    organic_rank: history.organic_rank !== undefined && history.organic_rank !== null ? Number(history.organic_rank) : null,
    ad_rank: history.ad_rank !== undefined && history.ad_rank !== null ? Number(history.ad_rank) : null,
    total_rank: history.total_rank !== undefined && history.total_rank !== null ? Number(history.total_rank) : null,
    price: history.price !== undefined && history.price !== null ? Number(history.price) : null,
    review_count: history.review_count !== undefined && history.review_count !== null ? Number(history.review_count) : null,
    status: history.status || 'UNKNOWN',
    matched_title: history.matched_title || '',
    matched_url: history.matched_url || '',
    matched_mall: history.matched_mall || '',
    error_message: history.error_message || ''
  };

  stmt.run(payload);
  return payload;
}

function getRankHistoryByTargetId(targetId, limit = 30) {
  const stmt = db.prepare(`
    SELECT * FROM keyword_rank_history 
    WHERE target_id = ? 
    ORDER BY datetime(tracked_at) DESC 
    LIMIT ?
  `);
  return stmt.all(targetId, limit);
}

function getRankTargetsWithLatestRank() {
  const targets = getAllRankTargets();
  
  const historyStmt = db.prepare(`
    SELECT * FROM keyword_rank_history 
    WHERE target_id = ? 
    ORDER BY datetime(tracked_at) DESC 
    LIMIT 2
  `);

  return targets.map(target => {
    const historyRows = historyStmt.all(target.id);
    const latest = historyRows[0] || null;
    const previous = historyRows[1] || null;

    let delta = null;
    if (latest && previous && latest.organic_rank !== null && previous.organic_rank !== null) {
      // previous.organic_rank (e.g. 20) - latest.organic_rank (e.g. 13) = +7 (상승)
      delta = previous.organic_rank - latest.organic_rank;
    }

    return {
      ...target,
      active: target.active === 1,
      latest_rank: latest ? {
        tracked_at: latest.tracked_at,
        organic_rank: latest.organic_rank,
        ad_rank: latest.ad_rank,
        total_rank: latest.total_rank,
        price: latest.price,
        review_count: latest.review_count,
        status: latest.status,
        matched_title: latest.matched_title,
        matched_url: latest.matched_url,
        matched_mall: latest.matched_mall,
        error_message: latest.error_message
      } : null,
      previous_rank: previous ? {
        tracked_at: previous.tracked_at,
        organic_rank: previous.organic_rank,
        ad_rank: previous.ad_rank,
        total_rank: previous.total_rank,
        status: previous.status
      } : null,
      delta: delta
    };
  });
}

// --- Workflow Lineage Helper Functions ---
function getProductsByCandidateId(candidateId) {
  const stmt = db.prepare(`SELECT * FROM products WHERE candidate_id = ? ORDER BY datetime(created_at) DESC`);
  const rows = stmt.all(candidateId);
  return rows.map(row => ({
    ...row,
    keywords: JSON.parse(row.keywords || '[]'),
    key_benefits: JSON.parse(row.key_benefits || '[]'),
    detail_structure: JSON.parse(row.detail_structure || '[]'),
  }));
}

function getRankTargetsByProductId(productId) {
  const stmt = db.prepare(`SELECT * FROM keyword_rank_targets WHERE product_id = ? ORDER BY datetime(created_at) DESC`);
  return stmt.all(productId);
}

function getWorkflowLineage(candidateId) {
  const candidate = getCandidateById(candidateId);
  if (!candidate) return null;

  const suppliers = getSupplierItemsByCandidateId(candidateId);
  const products = getProductsByCandidateId(candidateId);

  // Collect rank targets across all products linked to this candidate
  const rankTargets = [];
  const seenTargetIds = new Set();
  for (const product of products) {
    const targets = getRankTargetsByProductId(product.id);
    for (const t of targets) {
      if (!seenTargetIds.has(t.id)) {
        seenTargetIds.add(t.id);
        rankTargets.push(t);
      }
    }
  }

  // Also include rank targets directly linked via candidate_id (future-proof)
  const directTargets = db.prepare(
    `SELECT * FROM keyword_rank_targets WHERE candidate_id = ? ORDER BY datetime(created_at) DESC`
  ).all(candidateId);
  for (const t of directTargets) {
    if (!seenTargetIds.has(t.id)) {
      seenTargetIds.add(t.id);
      rankTargets.push(t);
    }
  }

  // Build workflow status summary
  const selectedSupplier = suppliers.find(s => s.workflow_status === 'SELECTED') || null;
  const activeProduct = products.find(p => ['READY', 'PUBLISHED'].includes(p.status)) || products[0] || null;

  return {
    candidate,
    suppliers,
    selected_supplier: selectedSupplier,
    products,
    active_product: activeProduct,
    rank_targets: rankTargets,
    // Include margin_simulation from selected supplier (reuse existing data)
    margin_simulation: selectedSupplier?.margin_simulation || {},
    workflow_summary: {
      candidate_status: candidate.status,
      supplier_count: suppliers.length,
      selected_supplier_id: selectedSupplier?.id || null,
      product_count: products.length,
      active_product_id: activeProduct?.id || null,
      active_product_status: activeProduct?.status || null,
      rank_target_count: rankTargets.length
    }
  };
}

module.exports = {
  db,
  getAllProducts,
  getProductById,
  saveProduct,
  deleteProduct,
  saveMarketReport,
  getMarketReportById,
  getAllMarketReports,
  saveProductCandidates,
  getProductCandidatesByReportId,
  getCandidateById,
  updateCandidateStatus,
  getDailyTopCandidates,
  getDailyDashboardStats,
  saveSupplierItem,
  getSupplierItemById,
  getSupplierItemsByCandidateId,
  deleteSupplierItem,
  updateSupplierWorkflowStatus,
  // Rank Tracker exports
  saveRankTarget,
  saveRankTargetsBatch,
  getRankTargetById,
  getAllRankTargets,
  updateRankTarget,
  deleteRankTarget,
  saveRankHistory,
  getRankHistoryByTargetId,
  getRankTargetsWithLatestRank,
  // Workflow Lineage exports
  getProductsByCandidateId,
  getRankTargetsByProductId,
  getWorkflowLineage
};
