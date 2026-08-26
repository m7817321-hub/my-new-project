const assert = require('node:assert/strict');
const { getIntegrationHealth, recordCollectorStatus } = require('./services/integrationHealth');

console.log('--- Testing /api/health/integrations Diagnostic Service ---');

// 1. Check initial environment status
const health1 = getIntegrationHealth();
assert.equal(health1.success, true);
assert.equal(typeof health1.naver_client_id, 'boolean');
assert.equal(typeof health1.naver_client_secret, 'boolean');
assert.equal(typeof health1.naver_searchad_api_key, 'boolean');
assert.equal(typeof health1.naver_searchad_secret_key, 'boolean');
assert.equal(typeof health1.naver_searchad_customer_id, 'boolean');
assert.equal(typeof health1.serpapi_key, 'boolean');
assert.equal(typeof health1.woojung_db_path, 'boolean');

// 2. Security Check: Assert that NO secret values or string lengths leaked
const rawValues = [
  health1.naver_client_id,
  health1.naver_client_secret,
  health1.naver_searchad_api_key,
  health1.naver_searchad_secret_key,
  health1.naver_searchad_customer_id,
  health1.serpapi_key,
  health1.woojung_db_path
];

for (const val of rawValues) {
  assert.equal(typeof val, 'boolean', 'Every environment check field must be strictly boolean');
}

// 3. Collector status tracking check
assert.ok(health1.collectors, 'collectors status object must exist');
assert.ok(['UNKNOWN', 'LIVE_COLLECTED', 'API_ERROR_401', 'API_ERROR_403', 'NETWORK_ERROR'].includes(health1.collectors.naver_shopping) || health1.collectors.naver_shopping.startsWith('API_ERROR_'));

// 4. Test status recording transitions
recordCollectorStatus('naver_searchad', 'LIVE_COLLECTED');
recordCollectorStatus('serpapi', 'API_ERROR_401');

const health2 = getIntegrationHealth();
assert.equal(health2.collectors.naver_searchad, 'LIVE_COLLECTED');
assert.equal(health2.collectors.serpapi, 'API_ERROR_401');

console.log('✓ Integration Health checks passed with 100% security & schema compliance.');
