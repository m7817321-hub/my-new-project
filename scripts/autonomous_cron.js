// Remote mode deliberately never opens SQLite: the web service owns the Railway volume.
require('dotenv').config();

async function runCron(env = process.env, fetchImpl = fetch) {
  if (!env.AUTONOMOUS_API_URL || !env.AUTONOMOUS_JOB_TOKEN || env.AUTONOMOUS_JOB_TOKEN.length < 32) {
    throw new Error('AUTONOMOUS_API_URL and a job token of at least 32 characters are required');
  }
  const url = new URL('/api/autonomous/overnight/run', env.AUTONOMOUS_API_URL);
  const privateHttp = url.protocol === 'http:' && (url.hostname.endsWith('.railway.internal') || ['localhost','127.0.0.1'].includes(url.hostname));
  if (url.username || url.password || (url.protocol !== 'https:' && !privateHttp)) throw new Error('HTTPS or Railway private networking required');
  const response = await fetchImpl(url, {
    method: 'POST', redirect: 'error', headers: { Authorization: `Bearer ${env.AUTONOMOUS_JOB_TOKEN}` },
    signal: AbortSignal.timeout(55000)
  });
  if (!response.ok) throw new Error(`Overnight request failed (${response.status})`);
  const result = await response.json();
  if (!result.success || result.run?.status !== 'COMPLETED') throw new Error('Overnight job did not complete');
  return result;
}

if (require.main === module) runCron().then(result => console.log(JSON.stringify(result))).catch(() => {
  console.error('Autonomous cron failed; check configuration and morning brief.'); process.exitCode = 1;
});

module.exports = { runCron };
