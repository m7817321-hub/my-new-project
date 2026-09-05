const { randomUUID, createHash } = require('node:crypto');

const AUTO_TYPES = ['MARKET_ANALYSIS', 'MARGIN_ANALYSIS', 'RANK_ANALYSIS', 'LISTING_DRAFT'];
const kstDate = (now = new Date()) => new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10);
const fingerprint = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function createActionQueue(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS autonomous_runs (
      run_key TEXT PRIMARY KEY, status TEXT NOT NULL CHECK(status IN ('COMPLETED','FAILED')),
      started_at TEXT NOT NULL, finished_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 1,
      action_count INTEGER NOT NULL DEFAULT 0, error TEXT
    );
    CREATE TABLE IF NOT EXISTS action_queue (
      id TEXT PRIMARY KEY, dedupe_key TEXT NOT NULL UNIQUE, run_key TEXT,
      type TEXT NOT NULL, source_type TEXT NOT NULL, source_id TEXT NOT NULL,
      title TEXT NOT NULL, evidence TEXT NOT NULL, priority TEXT NOT NULL CHECK(priority IN ('NORMAL','RISK')),
      status TEXT NOT NULL CHECK(status IN ('PENDING','COMPLETED','APPROVED','DISMISSED')),
      approval_required INTEGER NOT NULL CHECK(approval_required IN (0,1)),
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      CHECK(approval_required = 1 OR type IN ('MARKET_ANALYSIS','MARGIN_ANALYSIS','RANK_ANALYSIS','LISTING_DRAFT')),
      CHECK(status != 'COMPLETED' OR (approval_required = 0 AND type IN ('MARKET_ANALYSIS','MARGIN_ANALYSIS','RANK_ANALYSIS','LISTING_DRAFT')))
    );
    CREATE INDEX IF NOT EXISTS action_queue_status ON action_queue(status, priority, created_at);
    CREATE TABLE IF NOT EXISTS action_events (
      id TEXT PRIMARY KEY, action_id TEXT NOT NULL, from_status TEXT, to_status TEXT NOT NULL,
      actor TEXT NOT NULL, created_at TEXT NOT NULL
    );
  `);
  const decode = row => row && { ...row, evidence: JSON.parse(row.evidence), approval_required: !!row.approval_required };
  function get(id) { return decode(db.prepare('SELECT * FROM action_queue WHERE id = ?').get(id)); }
  function put(input, now = new Date()) {
    const automatic = AUTO_TYPES.includes(input.type) && input.automatic === true;
    const at = now.toISOString();
    const row = {
      id: randomUUID(), dedupe_key: input.dedupe_key, run_key: input.run_key || null,
      type: input.type, source_type: input.source_type, source_id: input.source_id,
      title: input.title, evidence: JSON.stringify(input.evidence || {}), priority: input.priority || 'NORMAL',
      status: automatic ? 'COMPLETED' : 'PENDING', approval_required: automatic ? 0 : 1,
      created_at: at, updated_at: at
    };
    return db.transaction(() => {
      const result = db.prepare(`INSERT INTO action_queue
        (id,dedupe_key,run_key,type,source_type,source_id,title,evidence,priority,status,approval_required,created_at,updated_at)
        VALUES (@id,@dedupe_key,@run_key,@type,@source_type,@source_id,@title,@evidence,@priority,@status,@approval_required,@created_at,@updated_at)
        ON CONFLICT(dedupe_key) DO NOTHING`).run(row);
      if (result.changes) db.prepare('INSERT INTO action_events VALUES (?,?,?,?,?,?)')
        .run(randomUUID(), row.id, null, row.status, automatic ? 'system' : 'proposal', at);
      return decode(db.prepare('SELECT * FROM action_queue WHERE dedupe_key = ?').get(row.dedupe_key));
    })();
  }
  function list({ status, limit = 100, offset = 0 } = {}) {
    if (status && !['PENDING','COMPLETED','APPROVED','DISMISSED'].includes(status)) throw new Error('Invalid status');
    if (!Number.isInteger(limit) || limit < 1 || limit > 200 || !Number.isInteger(offset) || offset < 0) throw new Error('Invalid pagination');
    const where = status ? 'WHERE status = ?' : '';
    const args = status ? [status] : [];
    return {
      total: db.prepare(`SELECT COUNT(*) AS n FROM action_queue ${where}`).get(...args).n,
      items: db.prepare(`SELECT * FROM action_queue ${where} ORDER BY created_at DESC, id LIMIT ? OFFSET ?`).all(...args, limit, offset).map(decode)
    };
  }
  function decide(id, decision, now = new Date()) {
    if (!['APPROVED', 'DISMISSED'].includes(decision)) throw new Error('Only APPROVED or DISMISSED decisions are supported');
    return db.transaction(() => {
      const row = get(id);
      if (!row) return null;
      if (row.status === decision) return row;
      if (!(row.status === 'PENDING' || (row.status === 'APPROVED' && decision === 'DISMISSED'))) {
        const error = new Error('Action is no longer pending'); error.statusCode = 409; throw error;
      }
      db.prepare('UPDATE action_queue SET status = ?, updated_at = ? WHERE id = ?').run(decision, now.toISOString(), id);
      db.prepare('INSERT INTO action_events VALUES (?,?,?,?,?,?)').run(randomUUID(), id, row.status, decision, 'human-review-token', now.toISOString());
      return get(id);
    }).immediate();
  }
  function brief(now = new Date()) {
    const day = kstDate(now);
    const start = new Date(`${day}T00:00:00+09:00`).toISOString();
    const end = new Date(Date.parse(start) + 86400000).toISOString();
    const latest = db.prepare('SELECT * FROM autonomous_runs ORDER BY started_at DESC LIMIT 1').get() || null;
    const auto = db.prepare("SELECT COUNT(*) AS n FROM action_queue WHERE status='COMPLETED' AND created_at >= ? AND created_at < ?").get(start, end).n;
    const pending = db.prepare("SELECT * FROM action_queue WHERE status IN ('PENDING','APPROVED') ORDER BY CASE priority WHEN 'RISK' THEN 0 ELSE 1 END, created_at DESC").all().map(decode);
    const health = !latest ? 'NEVER_RUN' : latest.status === 'FAILED' ? 'FAILED' :
      now.getTime() - Date.parse(latest.finished_at) > 26 * 3600000 ? 'STALE' : 'OK';
    return { date: day, timezone: 'Asia/Seoul', automatic_completed: auto,
      needs_review: pending.filter(x => x.priority !== 'RISK').length,
      risks: pending.filter(x => x.priority === 'RISK').length + (health === 'OK' ? 0 : 1),
      automation_health: health, latest_run: latest, items: pending.slice(0, 20),
      unresolved_total: pending.length, note: '승인은 기록만 남깁니다. 외부 작업은 실행되지 않습니다.' };
  }
  return { put, get, list, decide, brief };
}

module.exports = { createActionQueue, kstDate, fingerprint, AUTO_TYPES };
