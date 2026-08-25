import React, { useState } from 'react';
import { 
  Layers, 
  X, 
  ExternalLink, 
  Truck, 
  ShoppingBag, 
  AlertCircle, 
  CheckCircle2, 
  Tag, 
  DollarSign, 
  Users, 
  Hash, 
  HelpCircle,
  Sparkles,
  ShieldAlert,
  Search,
  Image,
  Copy,
  Check,
  Send,
  Sliders,
  Star,
  MessageSquare,
  ArrowLeft
} from 'lucide-react';

/**
 * Extract clear, non-hallucinated product attributes directly from the product title
 */
function extractExplicitTags(title) {
  if (!title) return [];
  const tags = [];
  const lower = title.toLowerCase();

  // Materials (소재)
  if (lower.includes('나일론') || lower.includes('nylon')) tags.push('나일론 소재');
  if (lower.includes('코튼') || lower.includes('면') || lower.includes('cotton')) tags.push('코튼/면');
  if (lower.includes('메쉬') || lower.includes('mesh')) tags.push('통기성 메쉬');
  if (lower.includes('피그먼트')) tags.push('피그먼트 워싱');
  if (lower.includes('데님')) tags.push('데님');
  if (lower.includes('고어텍스') || lower.includes('gore-tex')) tags.push('기능성 고어텍스');
  if (lower.includes('린넨') || lower.includes('마')) tags.push('린넨');
  if (lower.includes('가죽') || lower.includes('레더')) tags.push('가죽/레더');

  // Functions (기능)
  if (lower.includes('방수') || lower.includes('waterproof') || lower.includes('발수')) tags.push('생활방수/발수');
  if (lower.includes('경량') || lower.includes('가벼운') || lower.includes('light')) tags.push('경량');
  if (lower.includes('자외선') || lower.includes('uv') || lower.includes('차단')) tags.push('자외선/UV 차단');
  if (lower.includes('스트랩') || lower.includes('스트링') || lower.includes('조절')) tags.push('사이즈 조절 스트랩');
  if (lower.includes('접이식') || lower.includes('패커블')) tags.push('패커블/휴대용');
  if (lower.includes('쿨') || lower.includes('냉감') || lower.includes('시원한')) tags.push('쿨링/냉감');

  // Fit & Style (핏/스타일)
  if (lower.includes('캠프캡') || lower.includes('camp cap')) tags.push('캠프캡');
  if (lower.includes('볼캡') || lower.includes('ball cap')) tags.push('볼캡');
  if (lower.includes('버킷햇') || lower.includes('bucket')) tags.push('버킷햇');
  if (lower.includes('고프코어') || lower.includes('gorpcore')) tags.push('고프코어 스타일');
  if (lower.includes('숏챙') || lower.includes('숏캡')) tags.push('숏챙 핏');
  if (lower.includes('대두') || lower.includes('빅사이즈')) tags.push('대두/빅사이즈');
  if (lower.includes('소두')) tags.push('소두핏');
  if (lower.includes('빈티지') || lower.includes('워싱')) tags.push('빈티지 워싱');
  if (lower.includes('아웃도어') || lower.includes('캠핑') || lower.includes('등산')) tags.push('아웃도어/캠핑');
  if (lower.includes('러닝') || lower.includes('마라톤')) tags.push('러닝/스포츠');

  // Gender / Target
  if (lower.includes('남녀공용') || lower.includes('공용') || lower.includes('unisex')) tags.push('남녀공용');
  else if (lower.includes('남자') || lower.includes('남성')) tags.push('남성용');
  else if (lower.includes('여자') || lower.includes('여성')) tags.push('여성용');

  return Array.from(new Set(tags));
}

/**
 * Generate Chinese keyword for 1688 search
 */
function getChineseSearchKeyword(title, keyword) {
  const lower = (title + ' ' + (keyword || '')).toLowerCase();
  if (lower.includes('캠프캡') || lower.includes('camp cap')) {
    return lower.includes('방수') ? '露营帽 防水' : '露营帽 户外';
  }
  if (lower.includes('볼캡') || lower.includes('야구모자')) {
    return lower.includes('워싱') ? '棒球帽 水洗' : '棒球帽 鸭舌帽';
  }
  if (lower.includes('버킷햇') || lower.includes('벙거지')) {
    return '渔夫帽 户外';
  }
  if (lower.includes('크로스백') || lower.includes('가방')) {
    return '尼龙斜挎包 男';
  }
  return keyword || '户外 帽子';
}

export default function CatalogDetailModal({
  isOpen,
  onClose,
  product,
  relatedKeywords = [],
  onOpenSupplierSearch,
  onTransferToListing
}) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKeyword, setCopiedKeyword] = useState(false);

  if (!isOpen || !product) return null;

  const isCatalog = product.is_catalog === 'YES' || product.is_catalog === true || product.is_catalog === 'CATALOG' || product.isCatalog === 'YES' || product.isCatalog === true;
  const isSingle = product.is_catalog === 'NO' || product.is_catalog === false || product.is_catalog === 'SINGLE' || product.isCatalog === 'NO' || product.isCatalog === false;

  const sellerCount = (product.seller_count !== null && product.seller_count !== undefined)
    ? product.seller_count
    : ((product.sellerCount !== null && product.sellerCount !== undefined) ? product.sellerCount : null);

  const minPrice = (product.catalog_min_price !== null && product.catalog_min_price !== undefined)
    ? product.catalog_min_price
    : ((product.catalogMinPrice !== null && product.catalogMinPrice !== undefined) ? product.catalogMinPrice : product.price);

  const catId = product.cat_id || product.catId || product.catalog_id || product.catalogId || null;
  const nvMid = product.nv_mid || product.nvMid || null;
  const detectionSource = product.catalog_detection_source || product.catalogDetectionSource || 'UNKNOWN';

  const imageUrl = product.image_url || product.imageUrl || '';
  const productUrl = product.product_url || product.productUrl || '';
  const title = product.title || '';
  const price = product.price || minPrice;
  const reviewCount = product.review_count !== undefined && product.review_count !== null ? product.review_count : product.reviewCount;
  const rating = product.rating || null;
  const mallName = product.mall_name || product.mallName || '네이버 쇼핑';
  const isAd = product.is_ad || product.isAd || false;

  const explicitTags = extractExplicitTags(title);
  const chineseKeyword = getChineseSearchKeyword(title, product.keyword);

  // Sourcing Platform URLs
  const search1688KeywordUrl = `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(chineseKeyword)}`;
  const search1688ImageUrl = imageUrl 
    ? `https://s.1688.com/youyuan/index.htm?tab=imageSearch&imageAddress=${encodeURIComponent(imageUrl)}`
    : search1688KeywordUrl;
  const searchDomeggookUrl = `https://domeggook.com/main/item/itemList.php?sval=${encodeURIComponent(product.keyword || title.slice(0, 15))}`;
  const searchDomemeUrl = `https://domeme.com/main/item/itemList.php?sval=${encodeURIComponent(product.keyword || title.slice(0, 15))}`;

  const handleCopyImageUrl = () => {
    if (!imageUrl) return;
    navigator.clipboard.writeText(imageUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyChineseKeyword = () => {
    navigator.clipboard.writeText(chineseKeyword);
    setCopiedKeyword(true);
    setTimeout(() => setCopiedKeyword(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${
              isCatalog 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                : isSingle
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}>
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  상품 상세 & 소싱 인텔리전스
                </h3>
                {isCatalog && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/25 text-purple-300 border border-purple-500/40 font-black">
                    📦 동일상품 카탈로그 ({sellerCount || '여러'}개 몰)
                  </span>
                )}
                {isSingle && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-semibold">
                    🏷️ 단독 판매 상품
                  </span>
                )}
                {!isCatalog && !isSingle && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                    식별 보류 (UNKNOWN)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                실시간 네이버 쇼핑 수집 데이터 (실제 판매가, 리뷰, 카탈로그 식별자)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
              title="시장 분석 화면으로 돌아가기"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">시장 분석으로 돌아가기</span>
              <span className="sm:hidden">이전으로</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
              title="창 닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {/* 1. Main Product Overview */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-700 shrink-0 shadow-md"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                <ShoppingBag className="w-8 h-8" />
              </div>
            )}
            
            <div className="space-y-2 flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white leading-snug">
                {title}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-slate-400">
                <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">
                  {mallName}
                </span>
                {product.rank && (
                  <span className="px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 font-bold font-mono">
                    #{product.rank}위 노출
                  </span>
                )}
                {isAd ? (
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                    쇼핑광고(AD)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    자연노출
                  </span>
                )}
              </div>

              {/* Price & Rating Bar */}
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">
                    {isCatalog ? '대표 최저가격' : '판매 가격'}
                  </span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono">
                    ₩{price ? price.toLocaleString() : '미제공'}원
                  </span>
                </div>

                {reviewCount !== null && reviewCount !== undefined && (
                  <div className="border-l border-slate-800 pl-4">
                    <span className="text-[10px] text-slate-400 block font-medium">리뷰 수</span>
                    <span className="text-sm font-bold text-slate-200 font-mono flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                      {reviewCount.toLocaleString()}개
                    </span>
                  </div>
                )}

                {rating !== null && rating !== undefined && (
                  <div className="border-l border-slate-800 pl-4">
                    <span className="text-[10px] text-slate-400 block font-medium">평점</span>
                    <span className="text-sm font-bold text-amber-300 font-mono flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      {rating}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Catalog & Naver IDs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">등록 판매처 수</span>
              <span className="text-sm font-bold font-mono text-purple-300 block mt-0.5">
                {sellerCount !== null ? `${sellerCount.toLocaleString()}개 몰` : (isSingle ? '1개 (단독몰)' : '미제공')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">네이버 상품 ID (nv_mid)</span>
              <span className="text-xs font-bold font-mono text-indigo-300 block mt-0.5 truncate" title={nvMid || '미식별'}>
                {nvMid || '미식별'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">카테고리 ID (cat_id)</span>
              <span className="text-xs font-bold font-mono text-blue-300 block mt-0.5 truncate" title={catId || '미식별'}>
                {catId || '미식별'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">감지 원천</span>
              <span className="text-[11px] font-mono text-slate-300 block mt-0.5 truncate" title={detectionSource}>
                {detectionSource}
              </span>
            </div>
          </div>

          {/* 3. Real Product Specifications & Explicit Attribute Tags */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold text-xs">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span>상품 핵심 속성 및 사양 태그 (실데이터 기반)</span>
            </div>
            
            {explicitTags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {explicitTags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/15 text-indigo-200 border border-indigo-500/30"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">추출된 기본 속성 태그가 없습니다.</p>
            )}

            {/* Related Search Queries from AC */}
            {relatedKeywords && relatedKeywords.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-500 block mb-1">실시간 네이버 쇼핑 연관 검색어:</span>
                <div className="flex flex-wrap gap-1">
                  {relatedKeywords.slice(0, 6).map((rk, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-300 border border-slate-700"
                    >
                      {rk.keyword || rk}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 4. Sourcing Strategy Guidance */}
          <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1.5">
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>우정어패럴 소싱 전략 제안</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {isCatalog ? (
                <>현재 네이버에 <strong>{sellerCount}개 판매처가 카탈로그</strong>로 묶여 가격 경쟁 중입니다. 1688 이미지 소싱을 통해 원가를 절감하거나 원단/패키징을 차별화하여 독자 상품으로 런칭하는 것을 권장합니다.</>
              ) : (
                <>스마트스토어 <strong>단독 상세페이지</strong>로 운영되는 상품입니다. 동대문/1688 유사 핏 공급처를 발굴하여 마진 35% 이상으로 경쟁력 있게 진입할 수 있습니다.</>
              )}
            </p>
          </div>
        </div>

        {/* 5. Sourcing Action Bar (Bottom 5 Action Buttons) */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-purple-400" />
              <span>원클릭 공급처 탐색 및 소싱 액션</span>
            </span>

            {/* 1688 Chinese Keyword Copy helper */}
            <button
              onClick={handleCopyChineseKeyword}
              className="text-[11px] text-slate-400 hover:text-indigo-300 inline-flex items-center gap-1 cursor-pointer transition"
              title="1688 검색용 중국어 키워드 복사"
            >
              {copiedKeyword ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>1688 키워드: <strong className="text-indigo-300">{chineseKeyword}</strong></span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {/* 1. 1688 Image Search */}
            <a
              href={search1688ImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-200 text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center group cursor-pointer"
            >
              <Image className="w-4 h-4 text-orange-400 group-hover:scale-110 transition" />
              <span>1688 이미지 검색</span>
            </a>

            {/* 2. 1688 Keyword Search */}
            <a
              href={search1688KeywordUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-200 text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center group cursor-pointer"
            >
              <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
              <span>1688 키워드 검색</span>
            </a>

            {/* 3. Domeggook Search */}
            <a
              href={searchDomeggookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-200 text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center group cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
              <span>도매꾹 검색</span>
            </a>

            {/* 4. Domeme Search */}
            <a
              href={searchDomemeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold transition flex flex-col items-center justify-center gap-1 text-center group cursor-pointer"
            >
              <Tag className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
              <span>도매매 검색</span>
            </a>

            {/* 5. Direct Sourcing Hub / Workspace Transfer */}
            <button
              onClick={() => {
                onClose();
                if (onOpenSupplierSearch) {
                  onOpenSupplierSearch(product.id || product);
                } else if (onTransferToListing) {
                  onTransferToListing({
                    original_name: title,
                    selling_price: price || 25000,
                    cost_price: Math.round((price || 25000) * 0.4),
                    supplier: mallName,
                    product_url: productUrl,
                    image_url: imageUrl
                  });
                }
              }}
              className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer col-span-2 sm:col-span-1"
            >
              <Send className="w-4 h-4" />
              <span>소싱 작업판 이동</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
