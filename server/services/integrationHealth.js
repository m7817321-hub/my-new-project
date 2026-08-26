/**
 * Integration Health & Environment Diagnostics Service
 * 
 * Provides safe boolean-only verification of required API keys and
 * tracks the runtime status of each external collector.
 * ABSOLUTELY NO SECRET VALUES, PARTIAL STRINGS, OR STRING LENGTHS ARE EXPOSED.
 */

const collectorStatusMap = {
  naver_shopping: 'UNKNOWN',
  naver_datalab: 'UNKNOWN',
  naver_searchad: 'UNKNOWN',
  serpapi: 'UNKNOWN'
};

function normalizeStatus(status) {
  if (!status) return 'UNKNOWN';
  if (status === 'LIVE_COLLECTED') return 'LIVE_COLLECTED';
  if (status === 'API_ERROR_401' || status === 401 || status === '401') return 'API_ERROR_401';
  if (status === 'API_ERROR_403' || status === 403 || status === '403') return 'API_ERROR_403';
  if (status === 'NETWORK_ERROR') return 'NETWORK_ERROR';
  if (typeof status === 'string' && status.startsWith('API_ERROR_')) return status;
  return status;
}

function recordCollectorStatus(collectorKey, status) {
  if (collectorStatusMap.hasOwnProperty(collectorKey)) {
    collectorStatusMap[collectorKey] = normalizeStatus(status);
  }
}

function getIntegrationHealth() {
  const envStatus = {
    naver_client_id: Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_ID.trim()),
    naver_client_secret: Boolean(process.env.NAVER_CLIENT_SECRET && process.env.NAVER_CLIENT_SECRET.trim()),
    naver_searchad_api_key: Boolean(process.env.NAVER_SEARCHAD_API_KEY && process.env.NAVER_SEARCHAD_API_KEY.trim()),
    naver_searchad_secret_key: Boolean(process.env.NAVER_SEARCHAD_SECRET_KEY && process.env.NAVER_SEARCHAD_SECRET_KEY.trim()),
    naver_searchad_customer_id: Boolean(process.env.NAVER_SEARCHAD_CUSTOMER_ID && process.env.NAVER_SEARCHAD_CUSTOMER_ID.trim()),
    serpapi_key: Boolean(process.env.SERPAPI_KEY && process.env.SERPAPI_KEY.trim()),
    woojung_db_path: Boolean(process.env.WOOJUNG_DB_PATH && process.env.WOOJUNG_DB_PATH.trim())
  };

  return {
    success: true,
    ...envStatus,
    env: envStatus,
    collectors: {
      naver_shopping: collectorStatusMap.naver_shopping,
      naver_datalab: collectorStatusMap.naver_datalab,
      naver_searchad: collectorStatusMap.naver_searchad,
      serpapi: collectorStatusMap.serpapi
    },
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getIntegrationHealth,
  recordCollectorStatus
};
