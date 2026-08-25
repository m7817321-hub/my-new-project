const https = require('https');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

/**
 * Clean & normalize text for fuzzy token matching
 */
function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[\[\]\(\)\{\}\-_,.\/\\\|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(t => t.length >= 2);
}

/**
 * Extract nv_mid or product ID from a given smartstore or naver shopping URL
 */
function extractProductIdentifiers(url) {
  if (!url) return { nv_mid: null, productId: null, storeAccount: null };

  const nvMidMatch = url.match(/[?&]nv_mid=([0-9]+)/) || url.match(/\/catalog\/([0-9]+)/);
  const smartstoreIdMatch = url.match(/products\/([0-9]+)/) || url.match(/smartstore\.naver\.com\/[^\/]+\/([0-9]+)/);
  const storeAccountMatch = url.match(/smartstore\.naver\.com\/([^\/\?]+)/);

  return {
    nv_mid: nvMidMatch ? nvMidMatch[1] : null,
    productId: smartstoreIdMatch ? smartstoreIdMatch[1] : null,
    storeAccount: storeAccountMatch ? storeAccountMatch[1] : null
  };
}

/**
 * Fetch raw Naver Shopping results from SerpApi (Desktop / Mobile ready)
 */
function fetchNaverShoppingForKeyword(keyword, device = 'desktop') {
  const apiKey = process.env.SERPAPI_KEY;

  if (!apiKey) {
    return Promise.reject(new Error('SERPAPI_KEY is not configured in .env'));
  }

  const enc = encodeURIComponent(keyword.trim());
  const path = `/search.json?engine=naver&query=${enc}&api_key=${apiKey}`;

  const options = {
    hostname: 'serpapi.com',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            const rawResults = json.shopping_results || [];
            
            const shoppingResults = rawResults.map((item, idx) => {
              const rawPrice = item.price ? Number(String(item.price).replace(/[^0-9]/g, '')) : null;
              const rawReviews = item.reviews !== undefined ? Number(String(item.reviews).replace(/[^0-9]/g, '')) : null;
              const link = item.link || '';
              const isAd = link.includes('ader.naver.com') || link.includes('npla') || !!item.is_ad;
              const storesStr = String(item.stores || item.source || '').trim();

              const nvMidMatch = link.match(/[?&]nv_mid=([0-9]+)/) || link.match(/\/catalog\/([0-9]+)/);
              const thumbMidMatch = item.thumbnail ? item.thumbnail.match(/main_[0-9]+\/([0-9]+)/) : null;
              const thumbMidFallback = item.thumbnail ? item.thumbnail.match(/main_([0-9]+)/) : null;

              const nv_mid = nvMidMatch ? nvMidMatch[1] : (thumbMidMatch ? thumbMidMatch[1] : (thumbMidFallback ? thumbMidFallback[1] : null));

              return {
                totalRank: idx + 1,
                title: (item.title || '').trim(),
                price: rawPrice,
                mallName: storesStr,
                reviewCount: rawReviews,
                rating: item.rating !== undefined ? Number(item.rating) : null,
                imageUrl: item.thumbnail || '',
                productUrl: link,
                isAd: isAd,
                nv_mid: nv_mid
              };
            });

            resolve(shoppingResults);
          } else {
            reject(new Error(json.error || `SerpApi HTTP status ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse SerpApi response: ${e.message}`));
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

/**
 * Check whether a search result item matches the target product
 */
function isProductMatch(target, item) {
  const targetIdInfo = extractProductIdentifiers(target.product_url);
  const targetNvMid = target.nv_mid || targetIdInfo.nv_mid;
  const targetProductId = targetIdInfo.productId;
  const targetStoreAccount = targetIdInfo.storeAccount;

  // 1. Check nv_mid exact match (Highest confidence)
  if (targetNvMid && item.nv_mid && String(targetNvMid) === String(item.nv_mid)) {
    return true;
  }

  // 2. Check Smartstore product ID in URL/link (High confidence)
  if (targetProductId && item.productUrl && item.productUrl.includes(targetProductId)) {
    return true;
  }

  // 3. Check Mall Name exact/normalized match
  const targetMall = (target.mall_name || '').toLowerCase().replace(/\s+/g, '');
  const itemMall = (item.mallName || '').toLowerCase().replace(/\s+/g, '');

  if (targetMall && itemMall) {
    const mallMatches = itemMall.includes(targetMall) || targetMall.includes(itemMall);
    
    if (mallMatches) {
      // If mall matches, check title similarity
      const targetTokens = tokenize(target.product_name);
      const itemTokens = tokenize(item.title);
      
      const commonTokens = targetTokens.filter(t => itemTokens.some(it => it.includes(t) || t.includes(it)));
      
      // If there are common product words, or target is the only product in store
      if (commonTokens.length > 0 || targetTokens.length === 0) {
        return true;
      }
    }
  }

  // 4. Check store account in link
  if (targetStoreAccount && item.productUrl && item.productUrl.toLowerCase().includes(targetStoreAccount.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Track rank for a single target and save history
 */
async function trackTargetRank(target, device = 'desktop') {
  if (!target || !target.keyword) {
    throw new Error('Target has no keyword');
  }

  const trackedAt = new Date().toISOString();
  const historyId = uuidv4();

  try {
    const shoppingResults = await fetchNaverShoppingForKeyword(target.keyword, device);

    let foundItem = null;
    let organicRank = null;
    let adRank = null;
    let totalRank = null;

    let organicCounter = 0;
    let adCounter = 0;

    for (const item of shoppingResults) {
      if (item.isAd) {
        adCounter++;
      } else {
        organicCounter++;
      }

      if (!foundItem && isProductMatch(target, item)) {
        foundItem = item;
        totalRank = item.totalRank;
        if (item.isAd) {
          adRank = adCounter;
        } else {
          organicRank = organicCounter;
        }
      }
    }

    let status = 'OUT_OF_RANK';
    if (foundItem) {
      status = 'FOUND';
    }

    const historyRecord = {
      id: historyId,
      target_id: target.id,
      tracked_at: trackedAt,
      organic_rank: organicRank,
      ad_rank: adRank,
      total_rank: totalRank,
      price: foundItem ? foundItem.price : null,
      review_count: foundItem ? foundItem.reviewCount : null,
      status: status,
      matched_title: foundItem ? foundItem.title : '',
      matched_url: foundItem ? foundItem.productUrl : '',
      matched_mall: foundItem ? foundItem.mallName : '',
      error_message: ''
    };

    db.saveRankHistory(historyRecord);

    return {
      success: true,
      target_id: target.id,
      keyword: target.keyword,
      status: status,
      organic_rank: organicRank,
      ad_rank: adRank,
      total_rank: totalRank,
      price: historyRecord.price,
      review_count: historyRecord.review_count,
      tracked_at: trackedAt,
      matched_item: foundItem
    };
  } catch (error) {
    console.error(`[RankTracker] Error tracking target ${target.id} (${target.keyword}):`, error.message);

    const errorRecord = {
      id: historyId,
      target_id: target.id,
      tracked_at: trackedAt,
      organic_rank: null,
      ad_rank: null,
      total_rank: null,
      price: null,
      review_count: null,
      status: 'ERROR',
      matched_title: '',
      matched_url: '',
      matched_mall: '',
      error_message: error.message || 'API call failed'
    };

    db.saveRankHistory(errorRecord);

    return {
      success: false,
      target_id: target.id,
      keyword: target.keyword,
      status: 'ERROR',
      error: error.message,
      tracked_at: trackedAt
    };
  }
}

/**
 * Track rank for all active targets sequentially
 */
async function trackAllActiveTargets() {
  const activeTargets = db.getAllRankTargets(true);
  console.log(`[RankTracker] Starting rank tracking for ${activeTargets.length} active targets...`);

  const results = [];

  for (const target of activeTargets) {
    try {
      const res = await trackTargetRank(target);
      results.push(res);
      // Polite 500ms delay between consecutive requests
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      results.push({
        target_id: target.id,
        keyword: target.keyword,
        status: 'ERROR',
        error: err.message
      });
    }
  }

  console.log(`[RankTracker] Completed tracking ${results.length} targets.`);
  return results;
}

/**
 * Initialize daily scheduler (Runs daily at 00:30 KST)
 */
function initDailyRankScheduler() {
  console.log('[RankTracker Scheduler] Initializing Daily Rank Tracker (Scheduled at 00:30 KST)...');

  // Check every 60 seconds if current time is 00:30 KST (15:30 UTC previous day)
  let lastRunDate = '';

  setInterval(async () => {
    try {
      const now = new Date();
      // Convert to KST (UTC + 9)
      const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const kstHours = kstTime.getUTCHours();
      const kstMinutes = kstTime.getUTCMinutes();
      const currentDateStr = kstTime.toISOString().split('T')[0];

      // Run once per day at 00:30 KST
      if (kstHours === 0 && kstMinutes === 30 && lastRunDate !== currentDateStr) {
        lastRunDate = currentDateStr;
        console.log(`[RankTracker Scheduler] ⏰ Triggering scheduled daily rank check for ${currentDateStr} 00:30 KST`);
        await trackAllActiveTargets();
      }
    } catch (e) {
      console.error('[RankTracker Scheduler] Error in scheduler tick:', e);
    }
  }, 60000);
}

module.exports = {
  fetchNaverShoppingForKeyword,
  extractProductIdentifiers,
  isProductMatch,
  trackTargetRank,
  trackAllActiveTargets,
  initDailyRankScheduler
};
