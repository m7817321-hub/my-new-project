/**
 * Canonical product identity contract.
 *
 * Product names, mall names, ranks, and ad flags are intentionally excluded:
 * they describe a listing, not an actual product.  When neither a Naver MID,
 * a usable URL, nor an upstream stable product id is available, identity stays
 * UNKNOWN and the record must not be guessed or deduplicated.
 */
function extractNvMid(value) {
  if (value === null || value === undefined) return null;
  const mid = String(value).trim();
  return /^\d{6,14}$/.test(mid) ? mid : null;
}

function extractNvMidFromUrl(value) {
  if (!value) return null;
  const directMatch = String(value).match(/(?:[?&]nv_mid=|\/products\/)(\d{6,14})(?:\b|[/?&])/i);
  return directMatch ? directMatch[1] : null;
}

function normalizeProductUrl(value) {
  if (!value || String(value).includes('ader.naver.com')) return null;
  try {
    const url = new URL(String(value).trim());
    if (!/^https?:$/.test(url.protocol) || !url.hostname) return null;

    // Queries commonly contain tracking tokens. nv_mid is extracted before this
    // step, so dropping query/hash does not lose the preferred Naver identity.
    const path = url.pathname.replace(/\/+$/, '') || '/';
    return `${url.protocol.toLowerCase()}//${url.hostname.toLowerCase()}${path}`;
  } catch (_) {
    return null;
  }
}

function getCanonicalProductIdentity(product = {}) {
  const nvMid = extractNvMid(product.nv_mid) || extractNvMidFromUrl(product.product_url || product.productUrl);
  if (nvMid) return { identity: `nv_mid:${nvMid}`, type: 'NV_MID', nv_mid: nvMid };

  const normalizedUrl = normalizeProductUrl(product.product_url || product.productUrl);
  if (normalizedUrl) return { identity: `url:${normalizedUrl}`, type: 'PRODUCT_URL', normalized_url: normalizedUrl };

  // Only accept an explicitly supplied stable upstream/persisted id. Do not use
  // a newly generated candidate UUID: it cannot establish real-world identity.
  const existingId = product.existing_product_id || product.existingProductId || product.canonical_product_id;
  if (existingId && String(existingId).trim()) {
    return { identity: `product_id:${String(existingId).trim()}`, type: 'EXISTING_PRODUCT_ID' };
  }

  return { identity: null, type: 'UNKNOWN' };
}

module.exports = {
  extractNvMid,
  extractNvMidFromUrl,
  normalizeProductUrl,
  getCanonicalProductIdentity
};
