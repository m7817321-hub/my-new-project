import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Clock, 
  Database, 
  ArrowRight, 
  Hash, 
  ShoppingBag, 
  ExternalLink, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  HelpCircle, 
  Star, 
  Layers, 
  AlertCircle,
  Megaphone,
  CheckCircle2,
  Eye,
  XCircle,
  HelpCircle as QuestionIcon,
  ChevronRight,
  SlidersHorizontal,
  Send,
  Truck,
  RefreshCw
} from 'lucide-react';
import CatalogDetailModal from './CatalogDetailModal';

export default function MarketResearchView({
  onTransferToListing,
  onAnalyzeKeyword,
  onOpenSupplierSearch,
  isAnalyzing,
  currentReport,
  sampleKeywords
}) {
  const [keywordInput, setKeywordInput] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [candidateFilter, setCandidateFilter] = useState('ALL'); // ALL, INTEREST, WATCH, EXCLUDE
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [moreBatchIndex, setMoreBatchIndex] = useState(1);

  // 카탈로그 상세 모달 상태
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  const handleOpenCatalogModal = (product) => {
    setSelectedCatalogProduct(product);
    setIsCatalogModalOpen(true);
  };

  // 후보 목록은 report의 top_products가 아니라 canonical candidates API에서만 읽는다.
  useEffect(() => {
    setCandidates([]);
    setMoreBatchIndex(1);
    if (!currentReport?.id) return;

    let cancelled = false;
    fetch(`/api/market/candidates/${currentReport.id}`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled && data.success) setCandidates(data.candidates || []);
      })
      .catch(err => console.error('Load canonical candidates failed:', err));

    return () => { cancelled = true; };
  }, [currentReport?.id]);

  const handleLoadMoreProducts = async () => {
    if (!currentReport || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch('/api/market/more-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: currentReport.id,
          keyword: currentReport.keyword,
          batchIndex: moreBatchIndex
        })
      });
      const data = await res.json();
      if (data.success) {
        setCandidates(data.data?.candidates || []);
        setMoreBatchIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!keywordInput.trim()) return;
    onAnalyzeKeyword(keywordInput.trim());
  };

  const handleChipClick = (keyword) => {
    setKeywordInput(keyword);
    onAnalyzeKeyword(keyword);
  };

  // Candidate Finder API 호출
  const handleExtractCandidates = async () => {
    if (!currentReport) return;
    setIsExtracting(true);
    try {
      const res = await fetch('/api/market/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: currentReport.id })
      });
      const data = await res.json();
      if (data.success) {
        setCandidates(data.candidates || []);
      }
    } catch (e) {
      console.error('Candidate extraction failed:', e);
    } finally {
      setIsExtracting(false);
    }
  };

  const isSearchAdConnected = currentReport?.search_volume_status === 'LIVE_COLLECTED';
  const hasCandidates = candidates.length > 0;

  // 후보 필터링
  const filteredCandidates = candidates.filter(c => {
    if (candidateFilter === 'ALL') return true;
    return c.status === candidateFilter;
  });

  const interestCount = candidates.filter(c => c.status === 'INTEREST').length;
  const watchCount = candidates.filter(c => c.status === 'WATCH').length;
  const excludeCount = candidates.filter(c => c.status === 'EXCLUDE').length;

  return (
    <div className="space-y-8">
      {/* 1. Search Bar & Preset Chips */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 text-center">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center justify-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              네이버 실시간 시장 분석 & 공급처 탐색 엔진
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              키워드 하나로 공식 검색 수요, 쇼핑 트렌드를 확인하고 실제 진입 가치가 있는 상품 3~5개를 압축 발굴합니다.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="시장 분석할 키워드를 입력하세요 (예: 캠프캡, 볼캡, 나일론 크로스백)"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/90 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isAnalyzing || !keywordInput.trim()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/20 transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>통합 수집 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>실시간 시장 분석</span>
                </>
              )}
            </button>
          </form>

          {/* Preset Benchmark Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400 font-medium">실전 테스트 키워드:</span>
            {sampleKeywords?.map((sample) => (
              <button
                key={sample.keyword}
                type="button"
                onClick={() => handleChipClick(sample.keyword)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
              >
                <span>{sample.keyword}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis Result View */}
      {currentReport && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Metadata Banner: Data Source & Timestamp */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span>연동 엔진: <strong className="text-slate-300">{currentReport.data_source}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>수집 시각: <strong className="text-slate-300">{new Date(currentReport.collected_at).toLocaleString('ko-KR')}</strong></span>
            </div>
          </div>

          {/* 4 KPI Grid (Search Volume + Trend) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. 월간 총 검색량 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">네이버 월간 총 검색량 (Total)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white font-mono">
                  {currentReport.monthly_search_total !== null ? currentReport.monthly_search_total.toLocaleString() : 'UNKNOWN'}
                </span>
                {currentReport.monthly_search_total !== null && <span className="text-xs text-slate-400">회/월</span>}
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 truncate">
                {currentReport.field_sources?.search_volume_total}
              </div>
            </div>

            {/* 2. PC / 모바일 분리 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">PC vs 모바일 검색 비중</span>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block">PC</span>
                  <span className="text-sm font-bold text-indigo-300 font-mono">
                    {currentReport.monthly_search_pc !== null ? currentReport.monthly_search_pc.toLocaleString() : '-'}
                  </span>
                </div>
                <div className="h-6 w-[1px] bg-slate-800" />
                <div>
                  <span className="text-[11px] text-slate-400 block">모바일</span>
                  <span className="text-sm font-bold text-indigo-300 font-mono">
                    {currentReport.monthly_search_mobile !== null ? currentReport.monthly_search_mobile.toLocaleString() : '-'}
                  </span>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                모바일 점유율: {currentReport.monthly_search_total > 0 
                  ? Math.round((currentReport.monthly_search_mobile / currentReport.monthly_search_total) * 100) + '%' 
                  : '-'}
              </div>
            </div>

            {/* 3. 쇼핑 클릭 트렌드 (DataLab) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">쇼핑 클릭 트렌드 (최근 30일)</span>
              <div className="flex items-center gap-2">
                {currentReport.trend_status === 'RISING' ? (
                  <>
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                    <span className="text-lg font-bold text-emerald-400">급상승 (Rising)</span>
                  </>
                ) : currentReport.trend_status === 'DECLINING' ? (
                  <>
                    <TrendingDown className="w-6 h-6 text-rose-400" />
                    <span className="text-lg font-bold text-rose-400">하강 (Declining)</span>
                  </>
                ) : currentReport.trend_status === 'STABLE' ? (
                  <>
                    <Minus className="w-6 h-6 text-amber-400" />
                    <span className="text-lg font-bold text-amber-400">안정/유지</span>
                  </>
                ) : (
                  <span className="text-sm font-bold text-slate-400">표본 미달 (미제공)</span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80 truncate">
                {currentReport.field_sources?.shopping_trend}
              </div>
            </div>

            {/* 4. 상위 상품 평균가 & 리뷰 */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
              <span className="text-xs text-slate-400 font-semibold block">상위 상품 중앙 판매가</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-emerald-400 font-mono">
                  {currentReport.median_price !== null ? '₩' + currentReport.median_price.toLocaleString() : 'UNKNOWN'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                평균 리뷰: {currentReport.avg_review_count !== null ? currentReport.avg_review_count.toLocaleString() + '개' : 'UNKNOWN'}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ⚡ Candidate Finder V2 (실제 상품 후보 발굴 & 공급처 탐색 연계) */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-900/40">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  Candidate Finder V2 — 실제 상품 후보 & 공급처 탐색
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  INTEREST 상품 후보의 [공급처 찾기]를 누르면 1688 / 도매매 검색 키워드가 자동 생성되고 공급처 후보를 기록할 수 있습니다.
                </p>
              </div>

              <button
                onClick={handleExtractCandidates}
                disabled={isExtracting || !currentReport?.id}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-800 text-slate-950 disabled:text-slate-500 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                {isExtracting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                    <span>후보 압축 분석 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ 후보 발굴 시작</span>
                  </>
                )}
              </button>
            </div>

            {/* Candidates Content View */}
            {candidates.length > 0 ? (
              <div className="space-y-4">
                {/* Filter Tabs */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCandidateFilter('ALL')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                      candidateFilter === 'ALL'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    전체 ({candidates.length})
                  </button>
                  <button
                    onClick={() => setCandidateFilter('INTEREST')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                      candidateFilter === 'INTEREST'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-800/80 text-emerald-400 hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>유망 후보 INTEREST ({interestCount})</span>
                  </button>
                  <button
                    onClick={() => setCandidateFilter('WATCH')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                      candidateFilter === 'WATCH'
                        ? 'bg-amber-600 text-white shadow'
                        : 'bg-slate-800/80 text-amber-400 hover:bg-slate-700'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>관찰 WATCH ({watchCount})</span>
                  </button>
                  <button
                    onClick={() => setCandidateFilter('EXCLUDE')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
                      candidateFilter === 'EXCLUDE'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-slate-800/80 text-rose-400 hover:bg-slate-700'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>제외 EXCLUDE ({excludeCount})</span>
                  </button>
                </div>

                {/* Candidate Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCandidates.map((cand) => {
                    const isInterest = cand.status === 'INTEREST';
                    const isWatch = cand.status === 'WATCH';
                    const isExclude = cand.status === 'EXCLUDE';
                    const isCatalog = cand.is_catalog === 'YES' || cand.is_catalog === true || cand.is_catalog === 'CATALOG';
                    const isSingle = cand.is_catalog === 'NO' || cand.is_catalog === false || cand.is_catalog === 'SINGLE';

                    return (
                      <div
                        key={cand.id}
                        className={`rounded-2xl p-5 border transition flex flex-col justify-between space-y-4 shadow-xl ${
                          isInterest
                            ? 'bg-slate-900/95 border-emerald-500/50 shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                            : isWatch
                            ? 'bg-slate-900/80 border-amber-500/40'
                            : 'bg-slate-950/70 border-slate-800 opacity-75'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Card Header: Badges */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {/* 1. Candidate Status Badge */}
                              {isInterest && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  유망 후보 (INTEREST)
                                </span>
                              )}
                              {isWatch && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                  <Eye className="w-3.5 h-3.5" />
                                  관찰 (WATCH)
                                </span>
                              )}
                              {isExclude && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                  <XCircle className="w-3.5 h-3.5" />
                                  제외 (EXCLUDE)
                                </span>
                              )}

                              {/* 2. Core Catalog / Single / UNKNOWN Badge */}
                              {isCatalog && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-purple-500/25 text-purple-300 border border-purple-500/40 flex items-center gap-1 shadow-sm">
                                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                                  카탈로그 ({cand.seller_count ? `${cand.seller_count}개 몰` : '동일상품 묶음'})
                                </span>
                              )}
                              {isSingle && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                  단독상품 (단일몰)
                                </span>
                              )}
                              {!isCatalog && !isSingle && (
                                <span className="px-2.5 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400 border border-slate-700">
                                  식별보류 (UNKNOWN)
                                </span>
                              )}

                              <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-800 font-mono font-bold text-slate-300">
                                #{cand.rank}위
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {cand.is_ad ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  쇼핑광고
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[11px] bg-slate-800 text-slate-400 border border-slate-700">
                                  자연노출
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="flex gap-3.5">
                            {cand.image_url && (
                              <img
                                src={cand.image_url}
                                alt={cand.title}
                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-700 shrink-0 shadow-md"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            <div className="space-y-1.5 min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug">
                                {cand.title}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="font-medium text-slate-300 truncate">{cand.mall_name}</span>
                                <span className="text-slate-600">•</span>
                                <span className={`font-semibold ${
                                  cand.brand_type === 'BRAND_OFFICIAL' ? 'text-indigo-400' : 'text-slate-400'
                                }`}>
                                  {cand.brand_type === 'BRAND_OFFICIAL' ? '대형브랜드' : '소호/스마트스토어'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Core Sourcing Metrics Box (카탈로그/판매처수/최저가 직접 표기) */}
                          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 block font-medium">상품 분류</span>
                              <span className={`text-xs font-bold block truncate ${
                                isCatalog ? 'text-purple-300' : isSingle ? 'text-blue-300' : 'text-slate-400'
                              }`}>
                                {isCatalog ? '카탈로그 묶음' : isSingle ? '단독 상품' : 'UNKNOWN'}
                              </span>
                            </div>

                            <div className="space-y-0.5 border-x border-slate-800/80 px-2 text-center">
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {isCatalog ? '등록 판매처' : '판매처 수'}
                              </span>
                              <span className={`text-xs font-bold font-mono block ${
                                isCatalog ? 'text-purple-300' : 'text-slate-300'
                              }`}>
                                {isCatalog 
                                  ? `${cand.seller_count || '여러'}개 몰` 
                                  : isSingle ? '1개 (단일몰)' : '미제공'}
                              </span>
                            </div>

                            <div className="space-y-0.5 text-right">
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {isCatalog ? '대표 최저가격' : '실제 판매가'}
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-emerald-400 font-mono block">
                                ₩{(cand.catalog_min_price || cand.price)?.toLocaleString()}원
                              </span>
                            </div>
                          </div>

                          {/* Filter Reasoning List */}
                          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-[11px] space-y-1">
                            <span className="font-semibold text-slate-400 block text-[10px]">소싱 분석 사유:</span>
                            <ul className="space-y-0.5 text-slate-400 pl-4 list-disc">
                              {cand.reasons.map((r, i) => (
                                <li key={i}>{r}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-800/80 text-xs gap-2">
                          <div className="flex items-center gap-2">
                            {cand.product_url && (
                              <a
                                href={cand.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition text-xs truncate px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
                              >
                                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                <span>원문 링크</span>
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* 1. 카탈로그 상세 버튼 */}
                            <button
                              onClick={() => handleOpenCatalogModal(cand)}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                              title="카탈로그 상세 식별자(cat_id, nv_mid, seller_count) 확인"
                            >
                              <Layers className="w-3.5 h-3.5 text-indigo-400" />
                              <span>카탈로그 상세</span>
                            </button>

                            {/* 2. 소싱 시작 버튼 (공급처 찾기 연계) */}
                            {onOpenSupplierSearch && (
                              <button
                                onClick={() => onOpenSupplierSearch(cand.id)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                                  isInterest
                                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white shadow-purple-500/25 ring-1 ring-purple-400/30'
                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                }`}
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>소싱 시작</span>
                              </button>
                            )}

                            {isInterest && onTransferToListing && (
                              <button
                                onClick={() => onOpenSupplierSearch(cand.id)}
                                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition flex items-center gap-1 cursor-pointer"
                                title="AI 상품화로 직접 이동"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>상품화</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  우측 상단의 <strong>[⚡ 후보 발굴 시작]</strong> 버튼을 누르면 상위 노출 상품 중 진입 검토 가치가 높은 상품 3~5개를 자동으로 압축합니다.
                </p>
              </div>
            )}
          </div>

          {/* Canonical candidate pagination. Raw report snapshots are retained
              server-side for collector compatibility and are not rendered. */}
          <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 border border-slate-800 p-4 shadow-xl">
            <span className="text-xs text-slate-400 font-mono">
              canonical candidate {candidates.length}개
            </span>
            <button
              onClick={handleLoadMoreProducts}
              disabled={isLoadingMore}
              className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMore ? 'animate-spin' : ''}`} />
              <span>{isLoadingMore ? '추가 상품 수집 중...' : '+ 20개 상품 더 불러오기'}</span>
            </button>
          </div>

          {/* Deprecated raw snapshot view: intentionally not rendered. */}
          {false && currentReport?.top_products?.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  네이버 쇼핑 실제 수집 원본 상품 ({currentReport.top_products.length}개)
                </h4>
                <span className="text-[11px] text-slate-500">
                  출처: {currentReport.field_sources?.top_products}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                      <th className="py-2.5 px-3 w-12 text-center">순위</th>
                      <th className="py-2.5 px-3">상품 정보</th>
                      <th className="py-2.5 px-3">판매처 / 유형</th>
                      <th className="py-2.5 px-3 text-right">대표가격</th>
                      <th className="py-2.5 px-3 text-center">리뷰 수</th>
                      <th className="py-2.5 px-3 text-center">카탈로그 식별</th>
                      <th className="py-2.5 px-3 text-center">상세 / 링크</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {currentReport.top_products.map((item, idx) => {
                      const isCatalogItem = item.is_catalog === 'YES' || item.is_catalog === true || item.is_catalog === 'CATALOG';
                      const isSingleItem = item.is_catalog === 'NO' || item.is_catalog === false || item.is_catalog === 'SINGLE';

                      return (
                        <tr key={idx} className="hover:bg-slate-950/50 transition">
                          <td className="py-3 px-3 text-center font-bold font-mono text-indigo-400">
                            #{item.rank || idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              {item.imageUrl && (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.title} 
                                  className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                              )}
                              <span className="font-semibold text-white truncate max-w-xs sm:max-w-md">
                                {item.title}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            <div className="space-y-0.5">
                              <div className="font-medium">{item.mallName}</div>
                              {item.isAd ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  <Megaphone className="w-2.5 h-2.5" />
                                  쇼핑광고
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                                  자연노출
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                            {item.price !== null ? '₩' + item.price.toLocaleString() + '원' : 'UNKNOWN'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {item.reviewCount !== null ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-amber-300 border border-slate-700">
                                <Star className="w-3 h-3 fill-amber-300" />
                                {item.reviewCount.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-slate-500">미제공</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isCatalogItem ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                <Layers className="w-3 h-3" />
                                카탈로그 ({item.seller_count || '여러'}개)
                              </span>
                            ) : isSingleItem ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                단독상품
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                                UNKNOWN
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenCatalogModal(item)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-semibold border border-slate-700 transition cursor-pointer"
                                title="카탈로그 상세 정보"
                              >
                                <Layers className="w-3 h-3" />
                                <span>상세</span>
                              </button>
                              {item.productUrl && (
                                <a
                                  href={item.productUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex p-1.5 text-slate-400 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition"
                                  title="상품 바로가기"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Load More Button (+20개 더 불러오기) */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  현재 {currentReport.top_products.length}개 상품 로드됨 (SerpApi 실데이터)
                </span>

                <button
                  onClick={handleLoadMoreProducts}
                  disabled={isLoadingMore}
                  className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/40 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMore ? 'animate-spin' : ''}`} />
                  <span>{isLoadingMore ? '추가 상품 수집 중...' : '+ 20개 상품 더 불러오기'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Related Keywords Section */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Hash className="w-4 h-4 text-purple-400" />
                네이버 실시간 연관 검색어 ({currentReport.related_keywords?.length || 0}개)
              </h4>
              <span className="text-[11px] text-slate-500">
                출처: {currentReport.field_sources?.related_keywords}
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {currentReport.related_keywords?.map((rel, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChipClick(rel.keyword)}
                  className="px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/60 text-xs font-semibold text-indigo-200 transition active:scale-95 cursor-pointer flex items-center gap-1"
                >
                  <Hash className="w-3 h-3 text-indigo-400" />
                  <span>{rel.keyword}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Catalog & Product Detail Modal (with 5 Sourcing Buttons & Specs) */}
      <CatalogDetailModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        product={selectedCatalogProduct}
        relatedKeywords={currentReport?.related_keywords}
        onOpenSupplierSearch={onOpenSupplierSearch}
        onTransferToListing={onTransferToListing}
      />
    </div>
  );
}
