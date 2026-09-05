const express = require('express');
const { timingSafeEqual, randomUUID } = require('node:crypto');

function createAutonomousRouter(system) {
  const router = express.Router();
  const auth = env => (req, res, next) => {
    const expected = process.env[env];
    if (!expected || expected.length < 32 || process.env.AUTONOMOUS_JOB_TOKEN === process.env.AUTONOMOUS_REVIEW_TOKEN) return res.status(503).json({ error: 'Autonomous access is not configured' });
    const supplied = (req.get('authorization') || '').match(/^Bearer (.+)$/)?.[1] || '';
    const a = Buffer.from(supplied), b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return res.status(401).json({ error: 'Unauthorized' });
    res.set('Cache-Control', 'no-store');
    next();
  };
  router.post('/overnight/run', auth('AUTONOMOUS_JOB_TOKEN'), (req, res) => {
    try { res.json({ success: true, run: system.run() }); }
    catch { res.status(500).json({ success: false, error: 'ANALYSIS_FAILED' }); }
  });
  // The cron credential cannot approve actions or read business data.
  router.use(auth('AUTONOMOUS_REVIEW_TOKEN'));
  router.get('/morning-brief', (req, res) => res.json(system.queue.brief()));
  router.get('/actions', (req, res) => {
    try {
      res.json(system.queue.list({ status: req.query.status, limit: req.query.limit === undefined ? 100 : Number(req.query.limit), offset: req.query.offset === undefined ? 0 : Number(req.query.offset) }));
    } catch { res.status(400).json({ error: 'Invalid filter or pagination' }); }
  });
  router.get('/actions/:id', (req, res) => {
    const action = system.queue.get(req.params.id);
    if (!action) return res.status(404).json({ error: 'Action not found' });
    res.json(action);
  });
  router.post('/actions', (req, res) => {
    const { type, title, source_type, source_id, evidence } = req.body || {};
    if (![type, title, source_type, source_id].every(v => typeof v === 'string' && v.trim().length && v.length <= 500) ||
      (evidence !== undefined && (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)))) {
      return res.status(400).json({ error: 'type, title, source_type, source_id and optional evidence object required' });
    }
    // Never accept caller-supplied status, approval_required, automatic or dedupe keys.
    const action = system.queue.put({ type, title, source_type, source_id, evidence, dedupe_key: `manual:${randomUUID()}` });
    res.status(201).json(action);
  });
  router.post('/actions/:id/decision', (req, res) => {
    try {
      const action = system.queue.decide(req.params.id, req.body?.decision);
      if (!action) return res.status(404).json({ error: 'Action not found' });
      res.json({ action, executed: false });
    } catch (error) { res.status(error.statusCode || 400).json({ error: error.message }); }
  });
  return router;
}

module.exports = { createAutonomousRouter };
