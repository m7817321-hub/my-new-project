/**
 * Candidate Finder & Supplier Scout V3 - 공급처 탐색 키워드 및 원클릭 검색 URL 생성기
 * 
 * 국내 상품 정보를 분석하여:
 * 1. 핵심 상품명 / 상품 유형
 * 2. 핵심 소재 / 디자인 특징
 * 3. 1688 (영문/중문) 및 도매매(국문) 최적화 검색어 3~5개 생성
 * 4. 각 검색어별 1688 직접 검색 URL & 도매매 직접 검색 URL 자동 생성
 */

const MATERIAL_MAP = {
  '나일론': { en: 'nylon', zh: '尼龙' },
  '코튼': { en: 'cotton', zh: '纯棉' },
  '면': { en: 'cotton', zh: '棉' },
  '메쉬': { en: 'mesh', zh: '网眼' },
  '매쉬': { en: 'mesh', zh: '网眼' },
  '린넨': { en: 'linen', zh: '亚麻' },
  '방수': { en: 'waterproof', zh: '防水' },
  '생활방수': { en: 'waterproof', zh: '防水' },
  '가죽': { en: 'leather', zh: '皮革' },
  '데님': { en: 'denim', zh: '牛仔' },
  '캔버스': { en: 'canvas', zh: '帆布' },
  '폴리': { en: 'polyester', zh: '聚酯纤维' },
  '니트': { en: 'knit', zh: '针织' },
  '기모': { en: 'fleece', zh: '加绒' },
  '골지': { en: 'ribbed', zh: '罗纹' }
};

const CATEGORY_MAP = {
  '캠프캡': { en: 'camp cap', zh: '露营帽 五片帽', kr: '캠프캡 5패널' },
  '볼캡': { en: 'ball cap', zh: '棒球帽 鸭舌帽', kr: '볼캡 야구모자' },
  '버킷햇': { en: 'bucket hat', zh: '渔夫帽 盆帽', kr: '버킷햇 벙거지모자' },
  '바라클라바': { en: 'balaclava', zh: '头套 防风头套', kr: '바라클라바 방한마스크' },
  '비니': { en: 'beanie', zh: '毛线帽 冷帽', kr: '비니 숏비니' },
  '크로스백': { en: 'crossbody bag', zh: '斜挎包 单肩包', kr: '크로스백 메신저백' },
  '나일론 크로스백': { en: 'nylon crossbody bag', zh: '尼龙斜挎包', kr: '나일론 크로스백' },
  '보스턴백': { en: 'boston bag', zh: '波士顿包 旅行包', kr: '보스턴백 더플백 여행가방' },
  '토트백': { en: 'tote bag', zh: '托特包 手提包', kr: '토트백 쇼퍼백' },
  '백팩': { en: 'backpack', zh: '双肩包 背包', kr: '백팩 배낭' },
  '카드지갑': { en: 'card wallet', zh: '卡包 卡套', kr: '카드지갑 카드홀더' },
  '키링': { en: 'keychain', zh: '钥匙扣 挂件', kr: '키링 열쇠고리' },
  '파우치': { en: 'pouch', zh: '收纳包 手拿包', kr: '파우치 수납백' },
  '트래블 파우치': { en: 'travel pouch', zh: '旅行收纳包', kr: '트래블 파우치 여행용' },
  '텀블러백': { en: 'tumbler bag cup holder', zh: '水杯套 奶茶袋', kr: '텀블러백 텀블러가방 보틀백' }
};

const FEATURE_WORDS = [
  '경량', '대두', '소두', '스트랩', '포켓', '투웨이', '미니', '빅사이즈', '오버핏',
  '스트링', '멀티', '여행용', '방수', '자수', '무지', '빈티지', '고프코어', '워싱'
];

function build1688SearchUrl(keyword) {
  return `https://s.1688.com/youyuan.html?keywords=${encodeURIComponent(keyword)}`;
}

function buildDomemeSearchUrl(keyword) {
  return `https://domeme.domeggook.com/s/?keyword=${encodeURIComponent(keyword)}`;
}

function buildDomeggookSearchUrl(keyword) {
  return `https://domeggook.com/ssl/search/?kw=${encodeURIComponent(keyword)}`;
}

function extractProductFeatures(title, keywordHint = '') {
  const cleanTitle = (title || '').replace(/[\[\]\(\)\{\}\-_,.\/\\\|]/g, ' ');

  // 1. 소재 추출
  const detectedMaterials = [];
  for (const [mat, trans] of Object.entries(MATERIAL_MAP)) {
    if (cleanTitle.includes(mat)) {
      detectedMaterials.push({ kr: mat, en: trans.en, zh: trans.zh });
    }
  }

  // 2. 특징 추출
  const detectedFeatures = FEATURE_WORDS.filter(f => cleanTitle.includes(f));

  // 3. 카테고리 매핑
  let matchedCat = null;
  for (const [catKey, catVal] of Object.entries(CATEGORY_MAP)) {
    if (cleanTitle.includes(catKey) || (keywordHint && keywordHint.includes(catKey))) {
      matchedCat = { key: catKey, ...catVal };
      break;
    }
  }

  if (!matchedCat) {
    matchedCat = {
      key: keywordHint || '패션잡화',
      en: keywordHint || 'fashion goods',
      zh: '时尚配件',
      kr: keywordHint || '패션잡화'
    };
  }

  // 4. 공급처 검색 키워드 3~5개 조합 및 검색 URL 바인딩
  const searchKeywords = [];

  // 키워드 1: 영문 표준 (예: nylon camp cap)
  const primaryMatEn = detectedMaterials[0]?.en || '';
  const enKeyword = `${primaryMatEn} ${matchedCat.en}`.trim();
  if (enKeyword) {
    searchKeywords.push({
      target: '1688 (영문 표준)',
      keyword: enKeyword,
      type: 'ENGLISH',
      url_1688: build1688SearchUrl(enKeyword),
      url_domeggook: buildDomeggookSearchUrl(enKeyword),
      url_domeme: buildDomemeSearchUrl(enKeyword)
    });
  }

  // 키워드 2: 중문 검색어 (예: 尼龙 露营帽 五片帽)
  const primaryMatZh = detectedMaterials[0]?.zh || '';
  const zhKeyword = `${primaryMatZh} ${matchedCat.zh}`.trim();
  if (zhKeyword) {
    searchKeywords.push({
      target: '1688 (중문 직구)',
      keyword: zhKeyword,
      type: 'CHINESE',
      url_1688: build1688SearchUrl(zhKeyword),
      url_domeggook: buildDomeggookSearchUrl(zhKeyword),
      url_domeme: buildDomemeSearchUrl(zhKeyword)
    });
  }

  // 키워드 3: 세부 특징 영문 조합 (예: 5 panel strapback nylon camp cap)
  if (matchedCat.key === '캠프캡') {
    const specKw = '5 panel strapback nylon camp cap';
    searchKeywords.push({
      target: '1688 (영문 규격)',
      keyword: specKw,
      type: 'ENGLISH_SPEC',
      url_1688: build1688SearchUrl(specKw),
      url_domeggook: buildDomeggookSearchUrl(specKw),
      url_domeme: buildDomemeSearchUrl(specKw)
    });
  } else if (detectedFeatures.length > 0) {
    const featKw = `${detectedFeatures[0]} ${matchedCat.en}`;
    searchKeywords.push({
      target: '1688 (영문 상세)',
      keyword: featKw,
      type: 'ENGLISH_FEATURE',
      url_1688: build1688SearchUrl(featKw),
      url_domeggook: buildDomeggookSearchUrl(featKw),
      url_domeme: buildDomemeSearchUrl(featKw)
    });
  }

  // 키워드 4: 도매매/도매꾹/국내 B2B (예: 나일론 캠프캡 5패널 방수)
  const krFeatures = detectedFeatures.slice(0, 2).join(' ');
  const krKeyword = `${detectedMaterials[0]?.kr || ''} ${matchedCat.key} ${krFeatures}`.trim();
  searchKeywords.push({
    target: '도매꾹/도매매 (국내 도매)',
    keyword: krKeyword,
    type: 'KOREAN_B2B',
    url_1688: build1688SearchUrl(krKeyword),
    url_domeggook: buildDomeggookSearchUrl(krKeyword),
    url_domeme: buildDomemeSearchUrl(krKeyword)
  });

  // 키워드 5: 도매꾹/도매매 무지/도매 대량용
  const wholesaleKw = `무지 ${matchedCat.key} 도매`;
  searchKeywords.push({
    target: '도매꾹/도매매 (대량 도매)',
    keyword: wholesaleKw,
    type: 'KOREAN_WHOLESALE',
    url_1688: build1688SearchUrl(wholesaleKw),
    url_domeggook: buildDomeggookSearchUrl(wholesaleKw),
    url_domeme: buildDomemeSearchUrl(wholesaleKw)
  });

  return {
    original_title: title,
    category: matchedCat.key,
    detected_materials: detectedMaterials.map(m => m.kr),
    detected_features: detectedFeatures,
    search_keywords: searchKeywords
  };
}

module.exports = {
  extractProductFeatures,
  build1688SearchUrl,
  buildDomeggookSearchUrl,
  buildDomemeSearchUrl
};
