const { createActionQueue, kstDate, fingerprint } = require('./actionQueue');
const { calculateMargin } = require('./marginCalculator');
const { evaluateKeyword } = require('../../scripts/overnight_opportunity_analysis');

function createAutonomousSystem(repository) {
  const db = repository.db;
  const queue = createActionQueue(db);
  function run(now = new Date()) {
    const runKey = `overnight-v1:${kstDate(now)}`;
    const at = now.toISOString();
    try {
      return db.transaction(() => {
        const previous = db.prepare('SELECT * FROM autonomous_runs WHERE run_key = ?').get(runKey);
        if (previous?.status === 'COMPLETED') return { ...previous, reused: true };
        const before = db.prepare('SELECT COUNT(*) AS n FROM action_queue').get().n;
        const emit = (type, sourceType, sourceId, version, title, evidence, automatic = false, risk = false) => queue.put({
          dedupe_key: fingerprint([type, sourceType, sourceId, version]), run_key: runKey,
          type, source_type: sourceType, source_id: sourceId, title, evidence, automatic,
          priority: risk ? 'RISK' : 'NORMAL'
        }, now);
        const fresh = (time, hours) => {
          const age = now.getTime() - Date.parse(time);
          return Number.isFinite(age) && age >= 0 && age <= hours * 3600000;
        };
        const reports = repository.getAllMarketReports();
        const latestReports = new Map();
        // Select by source collection time, not insertion order.
        for (const report of reports) {
          const old = latestReports.get(report.keyword);
          const timestamp = Date.parse(report.collected_at) || 0;
          if (!old || timestamp > (Date.parse(old.collected_at) || 0)) latestReports.set(report.keyword, report);
        }
        if (!reports.length) emit('DATA_REVIEW', 'market', 'missing', 'v1', '시장 데이터 없음', { status: 'UNKNOWN' }, false, true);
        for (const report of latestReports.values()) {
          const isFresh = fresh(report.collected_at, 168);
          const evaluation = isFresh ? evaluateKeyword(report) : { verdict: 'INSUFFICIENT_DATA', reasons: ['시장 데이터가 7일보다 오래되었거나 시각이 유효하지 않음'], flags: {} };
          const unknown = !isFresh || !Number.isFinite(report.monthly_search_total) || !Number.isFinite(report.median_price) ||
            !report.top_products.length || report.top_products.some(p => !Number.isFinite(p.reviewCount) || typeof p.isAd !== 'boolean' || !p.mallName) ||
            Object.values(evaluation.flags).includes('UNKNOWN');
          const evidence = { report_id: report.id, collected_at: report.collected_at, data_source: report.data_source,
            field_sources: report.field_sources, stored_recommendation: report.recommendation,
            hypothesis: evaluation, decision: unknown ? 'HOLD' : 'REVIEW_ONLY',
            note: '기존 가설 참고용. 실제 마진/진입 가능성 확정 아님.' };
          emit('MARKET_ANALYSIS', 'market_report', report.id, [runKey, report.collected_at], `${report.keyword}: 저장 데이터 분석 완료`, evidence, true);
          if (unknown) emit('DATA_REVIEW', 'market_report', report.id, [report.collected_at, isFresh], `${report.keyword}: 데이터 확인 필요`, evidence, false, true);
          for (const candidate of repository.getProductCandidatesByReportId(report.id)) {
            if (!['PENDING', 'INTERESTED'].includes(candidate.status)) continue;
            emit('CANDIDATE_REVIEW', 'candidate', candidate.id, [report.id, candidate.status], `${candidate.title}: 소싱 검토`,
              { candidate_id: candidate.id, report_id: report.id, source_status: candidate.status, market_decision: evidence.decision, supplier_data: 'UNKNOWN' });
            if (candidate.status === 'INTERESTED' && isFresh && !unknown && !repository.getProductsByCandidateId(candidate.id).length) {
              emit('LISTING_DRAFT', 'candidate', candidate.id, [report.id, candidate.title], `${candidate.title}: 상품 검토 초안 생성`,
                { candidate_id: candidate.id, report_id: report.id, draft: { title: candidate.title, keyword: candidate.keyword,
                  source_url: candidate.product_url, cost: 'UNKNOWN', claims: [], status: 'DRAFT' },
                  note: '큐 내부 초안. Listing 상품 저장/외부 게시 전 사람 검토 필요.' }, true);
            }
          }
        }
        for (const product of repository.getAllProducts()) {
          const version = [product.updated_at, product.cost_price, product.selling_price];
          if (!(product.cost_price > 0 && product.selling_price > 0) || !fresh(product.updated_at, 168)) {
            emit('DATA_REVIEW', 'product', product.id, [version, fresh(product.updated_at, 168)], `${product.original_name}: 원가/판매가/갱신일 확인`,
              { product_id: product.id, status: 'UNKNOWN', updated_at: product.updated_at }, false, true);
            continue;
          }
          const margin = calculateMargin({ ...product, unknown_handling: 'strict' });
          const evidence = { product_id: product.id, candidate_id: product.candidate_id, supplier_item_id: product.supplier_item_id,
            updated_at: product.updated_at, calculation: margin, note: '저장된 비용 기준 추정. 미기록 비용은 포함되지 않을 수 있음.' };
          emit('MARGIN_ANALYSIS', 'product', product.id, [runKey, version], `${product.original_name}: 예상 마진 분석 완료`, evidence, true);
          if (!Number.isFinite(margin.margin_rate) || margin.margin_rate < 15) emit('PRICE_CHANGE', 'product', product.id, version,
            `${product.original_name}: 낮은 예상 마진 검토`, { ...evidence, threshold_hypothesis: 15, proposed_price: null }, false, true);
        }
        const targets = repository.getAllRankTargets(true);
        if (!targets.length) emit('DATA_REVIEW', 'rank', 'missing', 'v1', '활성 순위 추적 대상 없음', { status: 'UNKNOWN' }, false, true);
        for (const target of targets) {
          const history = db.prepare('SELECT * FROM keyword_rank_history WHERE target_id = ? ORDER BY julianday(tracked_at) DESC, id DESC LIMIT 2').all(target.id);
          const [current, previous] = history;
          const evidence = { target_id: target.id, product_id: target.product_id, candidate_id: target.candidate_id, observations: history };
          const validRank = row => row?.status === 'FOUND' && Number.isInteger(row.organic_rank) && row.organic_rank > 0;
          if (!current || !fresh(current.tracked_at, 48) || !validRank(current) || !validRank(previous) || !fresh(previous.tracked_at, 168) || Date.parse(previous.tracked_at) >= Date.parse(current.tracked_at)) {
            emit('DATA_REVIEW', 'rank_target', target.id, [history.map(x => x.id), current && fresh(current.tracked_at, 48)], `${target.keyword}: 순위 데이터 확인`,
              { ...evidence, status: 'UNKNOWN', note: '오류/관측 밖/광고순위/오래된 이력은 오가닉 순위 0으로 해석하지 않음' }, false, true);
          } else {
            const drop = current.organic_rank - previous.organic_rank;
            emit('RANK_ANALYSIS', 'rank_target', target.id, [runKey, current.id, previous.id], `${target.keyword}: 순위 비교 완료`, { ...evidence, drop }, true);
            if (drop >= 10) emit('RANK_REVIEW', 'rank_target', target.id, [current.id, previous.id], `${target.keyword}: 순위 ${drop}단계 하락`,
              { ...evidence, drop, threshold_hypothesis: 10 }, false, true);
          }
        }
        const count = db.prepare('SELECT COUNT(*) AS n FROM action_queue').get().n - before;
        db.prepare(`INSERT INTO autonomous_runs(run_key,status,started_at,finished_at,action_count)
          VALUES (?,'COMPLETED',?,?,?) ON CONFLICT(run_key) DO UPDATE SET status='COMPLETED',started_at=excluded.started_at,
          finished_at=excluded.finished_at,action_count=excluded.action_count,error=NULL,attempts=autonomous_runs.attempts+1`)
          .run(runKey, at, at, count);
        return { ...db.prepare('SELECT * FROM autonomous_runs WHERE run_key=?').get(runKey), reused: false };
      }).immediate();
    } catch (error) {
      // Transaction rollback keeps partial actions out of the queue. No raw errors/secrets in API output.
      db.prepare(`INSERT INTO autonomous_runs(run_key,status,started_at,finished_at,error) VALUES (?,'FAILED',?,?,'ANALYSIS_FAILED')
        ON CONFLICT(run_key) DO UPDATE SET status='FAILED',started_at=excluded.started_at,finished_at=excluded.finished_at,
        error=excluded.error,attempts=autonomous_runs.attempts+1 WHERE autonomous_runs.status != 'COMPLETED'`).run(runKey, at, at);
      throw error;
    }
  }
  return { queue, run };
}

module.exports = { createAutonomousSystem };
