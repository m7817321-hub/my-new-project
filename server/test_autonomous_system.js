const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
process.env.WOOJUNG_DB_PATH = ':memory:';
const repository = require('./db');
const { createAutonomousSystem } = require('./services/autonomousSystem');
const { kstDate } = require('./services/actionQueue');
const { evaluateKeyword } = require('../scripts/overnight_opportunity_analysis');
const { runCron } = require('../scripts/autonomous_cron');
const system = createAutonomousSystem(repository);
const db = repository.db;
const now = new Date('2026-09-05T20:00:00Z'); // Sep 6 KST

function reset() {
  for (const table of ['action_events','action_queue','autonomous_runs','keyword_rank_history','keyword_rank_targets','products','supplier_items','product_candidates','market_research_reports']) db.prepare(`DELETE FROM ${table}`).run();
}
function seed() {
  reset();
  db.prepare(`INSERT INTO market_research_reports(id,keyword,data_source,collected_at,created_at,monthly_search_total,median_price,top_products,trend_status)
    VALUES ('r','cap','fixture',?,?,4000,20000,?,'STABLE')`).run(now.toISOString(), now.toISOString(), JSON.stringify([{ title:'cap', mallName:'small shop', reviewCount:100, isAd:false }]));
  db.prepare("INSERT INTO product_candidates(id,report_id,keyword,title,status,created_at) VALUES ('c','r','cap','cap draft','INTERESTED',?)").run(now.toISOString());
  db.prepare("INSERT INTO products(id,original_name,cost_price,selling_price,created_at,updated_at) VALUES ('p','cap',19000,20000,?,?)").run(now.toISOString(), now.toISOString());
  db.prepare("INSERT INTO keyword_rank_targets(id,product_name,mall_name,keyword,created_at) VALUES ('t','cap','shop','cap',?)").run(now.toISOString());
  db.prepare("INSERT INTO keyword_rank_history(id,target_id,tracked_at,organic_rank,status) VALUES ('h1','t',?,5,'FOUND'),('h2','t',?,26,'FOUND')")
    .run(new Date(now.getTime()-86400000).toISOString(), now.toISOString());
}
test('KST day boundaries and UNKNOWN evaluator are explicit', () => {
  assert.equal(kstDate(new Date('2026-09-05T14:59:59Z')), '2026-09-05');
  assert.equal(kstDate(new Date('2026-09-05T15:00:00Z')), '2026-09-06');
  assert.equal(evaluateKeyword({}).verdict, 'INSUFFICIENT_DATA');
});
test('saved-data pipeline produces analysis, linked draft, margin and rank risk without domain mutation', () => {
  seed();
  const snapshot = JSON.stringify(['market_research_reports','product_candidates','products','keyword_rank_history'].map(t=>db.prepare(`SELECT * FROM ${t}`).all()));
  const result = system.run(now);
  assert.equal(result.status, 'COMPLETED');
  const items = system.queue.list().items;
  for (const type of ['MARKET_ANALYSIS','LISTING_DRAFT','CANDIDATE_REVIEW','MARGIN_ANALYSIS','PRICE_CHANGE','RANK_ANALYSIS','RANK_REVIEW']) assert.ok(items.some(x=>x.type===type), type);
  assert.equal(items.find(x=>x.type==='LISTING_DRAFT').evidence.candidate_id, 'c');
  assert.equal(items.find(x=>x.type==='PRICE_CHANGE').approval_required, true);
  assert.equal(JSON.stringify(['market_research_reports','product_candidates','products','keyword_rank_history'].map(t=>db.prepare(`SELECT * FROM ${t}`).all())), snapshot);
  assert.equal(system.queue.brief(now).automatic_completed, 4);
  assert.equal(system.queue.brief(now).risks, 2);
  assert.equal(system.queue.brief(now).needs_review, 1);
});
test('daily retries and next-day review deduplication preserve decisions', () => {
  seed(); system.run(now);
  const total = system.queue.list().total;
  const proposal = system.queue.list().items.find(x=>x.type==='CANDIDATE_REVIEW');
  system.queue.decide(proposal.id, 'DISMISSED', now);
  assert.equal(system.run(now).reused, true);
  assert.equal(system.queue.list().total, total);
  system.run(new Date(now.getTime()+86400000));
  assert.equal(system.queue.get(proposal.id).status, 'DISMISSED');
  assert.equal(system.queue.list().items.filter(x=>x.type==='CANDIDATE_REVIEW').length, 1);
});
test('missing, stale, failed and out-of-rank observations never become good data', () => {
  reset();
  assert.equal(system.queue.brief(now).automation_health, 'NEVER_RUN');
  system.run(now);
  assert.equal(system.queue.brief(now).automatic_completed, 0);
  assert.ok(system.queue.brief(now).risks >= 2);
  seed();
  db.prepare("UPDATE market_research_reports SET monthly_search_total=NULL").run();
  db.prepare("UPDATE keyword_rank_history SET status='ERROR',organic_rank=NULL WHERE id='h2'").run();
  db.prepare('UPDATE products SET cost_price=0').run();
  system.run(now);
  const items = system.queue.list().items;
  assert.equal(items.find(x=>x.type==='MARKET_ANALYSIS').evidence.decision, 'HOLD');
  assert.ok(!items.some(x=>['LISTING_DRAFT','RANK_ANALYSIS','MARGIN_ANALYSIS'].includes(x.type)));
  assert.equal(system.queue.brief(new Date(now.getTime()+27*3600000)).automation_health, 'STALE');
  seed(); system.run(new Date(now.getTime()+8*86400000));
  assert.equal(system.queue.list().items.find(x=>x.type==='MARKET_ANALYSIS').evidence.decision, 'HOLD');
});
test('unsafe and unknown action types cannot automatically complete, even through service or SQL', () => {
  reset();
  for (const type of ['PURCHASE','AD_SPEND','PRICE_CHANGE','CUSTOMER_SEND','DEPLOY','NEW_UNKNOWN']) {
    const action = system.queue.put({type, automatic:true, approval_required:false, dedupe_key:type,source_type:'test',source_id:'x',title:type}, now);
    assert.equal(action.approval_required, true);
    assert.equal(action.status, 'PENDING');
    const approved = system.queue.decide(action.id, 'APPROVED', now);
    assert.equal(approved.approval_required, true);
    assert.throws(()=>system.queue.decide(action.id, 'COMPLETED'));
    assert.throws(()=>db.prepare("UPDATE action_queue SET status='COMPLETED',approval_required=0 WHERE id=?").run(action.id));
  }
});
test('partial results roll back and failed runs can retry safely', () => {
  seed();
  const broken = createAutonomousSystem({ ...repository, getAllProducts: () => { throw new Error('fixture failure'); } });
  assert.throws(()=>broken.run(now), /fixture failure/);
  assert.equal(system.queue.list().total, 0);
  assert.equal(system.queue.brief(now).automation_health, 'FAILED');
  assert.equal(system.run(now).attempts, 2);
  assert.equal(system.queue.brief(now).automation_health, 'OK');
});
test('HTTP boundary separates cron and review, rejects bypasses, and never executes approval', async () => {
  reset();
  const app = require('./index');
  const server = app.listen(0, '127.0.0.1'); await once(server,'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/autonomous`;
  const job = 'j'.repeat(32), review = 'r'.repeat(32);
  const request = (route,token,body) => fetch(base+route, {method:body?'POST':'GET',headers:{Authorization:`Bearer ${token || ''}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
  try {
    const health = await fetch(`http://127.0.0.1:${server.address().port}/api/health`);
    assert.equal(health.status, 200); assert.equal((await health.json()).status, 'ok');
    delete process.env.AUTONOMOUS_REVIEW_TOKEN;
    assert.equal((await request('/morning-brief')).status,503);
    process.env.AUTONOMOUS_JOB_TOKEN=job; process.env.AUTONOMOUS_REVIEW_TOKEN=review;
    process.env.AUTONOMOUS_REVIEW_TOKEN=job;
    assert.equal((await request('/morning-brief',job)).status,503);
    process.env.AUTONOMOUS_REVIEW_TOKEN=review;
    assert.equal((await fetch(base+'/morning-brief',{headers:{Authorization:review}})).status,401);
    assert.equal((await request('/morning-brief',job)).status,401);
    assert.equal((await request('/overnight/run',review,{})).status,401);
    assert.equal((await request('/overnight/run',job,{})).status,200);
    const created = await (await request('/actions',review,{type:'PURCHASE',title:'review',source_type:'product',source_id:'p',automatic:true,approval_required:false,status:'COMPLETED'})).json();
    assert.equal(created.status,'PENDING'); assert.equal(created.approval_required,true);
    const spoofed = await (await request('/actions',review,{type:'LISTING_DRAFT',title:'not yet generated',source_type:'product',source_id:'p',automatic:true,approval_required:false,status:'COMPLETED'})).json();
    assert.equal(spoofed.status,'PENDING'); assert.equal(spoofed.approval_required,true);
    assert.equal((await request(`/actions/${created.id}/decision`,job,{decision:'APPROVED'})).status,401);
    const approved = await (await request(`/actions/${created.id}/decision`,review,{decision:'APPROVED'})).json();
    assert.equal(approved.executed,false); assert.equal(approved.action.status,'APPROVED');
    assert.equal((await request(`/actions/${created.id}/decision`,review,{decision:'COMPLETED'})).status,400);
    assert.equal((await request('/actions?limit=-1',review)).status,400);
    assert.equal((await request('/actions/missing',review)).status,404);
    assert.equal((await request('/morning-brief',review)).headers.get('cache-control'),'no-store');
  } finally { server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); delete process.env.AUTONOMOUS_JOB_TOKEN; delete process.env.AUTONOMOUS_REVIEW_TOKEN; }
});
test('cron validates transport, bounds requests, rejects failure, and accepts idempotent success', async () => {
  await assert.rejects(runCron({}), /required/);
  const env = {AUTONOMOUS_API_URL:'https://seller.example',AUTONOMOUS_JOB_TOKEN:'x'.repeat(32)};
  await assert.rejects(runCron({...env,AUTONOMOUS_API_URL:'http://unsafe.example'}),/HTTPS/);
  await assert.rejects(runCron(env,async()=>({ok:false,status:500})),/500/);
  await assert.rejects(runCron(env,async()=>({ok:true,json:async()=>({success:true,run:{status:'FAILED'}})})),/complete/);
  const result = await runCron(env,async(url,options)=>{
    assert.equal(url.pathname,'/api/autonomous/overnight/run'); assert.equal(options.redirect,'error'); assert.ok(options.signal);
    return {ok:true,json:async()=>({success:true,run:{status:'COMPLETED',reused:true}})};
  });
  assert.equal(result.run.reused,true);
});
test('separate saved-data processes share persistent daily deduplication and exit', async () => {
  seed();
  // Exercise the exported evaluator when this same script is the executable entrypoint.
  db.prepare('UPDATE market_research_reports SET collected_at=?').run(new Date().toISOString());
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'seller-autonomous-test-'));
  const filename = path.join(dir,'test.db');
  try {
    await db.backup(filename);
    const exec = promisify(execFile);
    const settled = await Promise.allSettled([1,2].map(()=>exec(process.execPath,['scripts/overnight_opportunity_analysis.js','--saved'],{
      cwd:path.join(__dirname,'..'),env:{...process.env,WOOJUNG_DB_PATH:filename},timeout:20000
    })));
    for (const result of settled) assert.equal(result.status,'fulfilled',result.reason?.stderr || result.reason?.message);
    const results = settled.map(result=>result.value);
    assert.ok(results.every(r=>r.stdout.includes('COMPLETED')));
    assert.ok(results.some(r=>r.stdout.includes('"reused":true')));
    const Database = require('better-sqlite3'); const persisted = new Database(filename);
    try {
      assert.equal(persisted.prepare('SELECT COUNT(*) AS n FROM autonomous_runs').get().n,1);
      const evidence = JSON.parse(persisted.prepare("SELECT evidence FROM action_queue WHERE type='MARKET_ANALYSIS'").get().evidence);
      assert.equal(evidence.decision, 'REVIEW_ONLY');
    }
    finally { persisted.close(); }
  } finally {
    assert.equal(path.dirname(path.resolve(dir)), path.resolve(os.tmpdir()));
    fs.rmSync(dir,{recursive:true,force:true,maxRetries:10,retryDelay:100});
  }
});
