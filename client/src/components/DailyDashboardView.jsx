import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Clock, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  ExternalLink, 
  Truck, 
  Heart, 
  PauseCircle, 
  XCircle, 
  CheckCircle2, 
  Search, 
  ShoppingBag, 
  ChevronRight, 
  RefreshCw,
  Info,
  Star,
  Megaphone
} from 'lucide-react';
import CatalogDetailModal from './CatalogDetailModal';

export default function DailyDashboardView({
  onSelectCandidateForSupplier,
  onInspectMarketKeyword
}) {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // 카탈로그 상세 모달 상태
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  const handleOpenCatalogModal = (product) => {
    setSelectedCatalogProduct(product);
    setIsCatalogModalOpen(true);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/daily/dashboard');
      const data = await res.json();
      if (data.success) {
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Fetch daily dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (candidateId, newStatus) => {
    setActionLoadingId(candidateId);
    try {
      const res = await fetch(`/api/daily/candidate/${candidateId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setDashboardData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            candidates: prev.candidates.map(c => c.id === candidateId ? { ...c, status: newStatus } : c)
          };
        });
      }
    } catch (err) {
      console.error('Update status error:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-300">오늘의 추천 소싱 후보를 선별하고 있습니다...</p>
        <p className="text-xs text-slate-500">네이버 검색량 & 쇼핑 랭킹 실시간 결합 중</p>
      </div>
    );
  }

  const todayStr = dashboardData?.today || new Date().toISOString().split('T')[0];
  const stats = dashboardData?.stats || {};
  const candidates = dashboardData?.candidates || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Daily Header & Top Stats Banner */}
      <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Calendar className="w-4 h-4" />
              <span>오늘의 소싱 브리핑 ({todayStr})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              오늘 검토할 유망 소싱 상품
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              네이버에서 실제 검색량이 높고 마진 확보가 유리한 소호 상품 3~5개를 엄선했습니다. 마음에 드는 상품은 <strong className="text-emerald-300 font-semibold">[관심]</strong> 또는 <strong className="text-purple-300 font-semibold">[공급처 찾기]</strong>를 눌러 1688/도매매 공급가를 확인하세요.
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 shrink-0">
            <div className="text-center px-2">
              <span className="text-[11px] text-slate-400 block font-medium">오늘 추천 후보</span>
              <span className="text-xl sm:text-2xl font-black text-white font-mono">{candidates.length}개</span>
            </div>
            <div className="text-center px-2 border-x border-slate-800">
              <span className="text-[11px] text-slate-400 block font-medium">검토 대기</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">{stats.pending_count || 0}개</span>
            </div>
            <div className="text-center px-2">
              <span className="text-[11px] text-slate-400 block font-medium">관심 등록</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">{stats.interested_count || 0}개</span>
            </div>
          </div>
        </div>

        {/* Sub-bar: Latest collected time & Toggle detail */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-5 mt-6 border-t border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>최근 시장 수집 시각: <strong className="text-slate-300">{stats.latest_collected_at ? new Date(stats.latest_collected_at).toLocaleTimeString('ko-KR') : '방금 전'}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-slate-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer text-[11px]"
            >
              <Info className="w-3.5 h-3.5" />
              <span>{showTechnicalDetails ? '기술 지표 숨기기' : '상세 분석 지표 보기'}</span>
            </button>
            <button
              onClick={fetchDashboard}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top 3~5 Candidate Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>오늘의 소싱 추천 TOP {candidates.length}</span>
          </h2>
          <span className="text-xs text-slate-400">
            * 상태를 선택하시면 자동 저장되어 다음 검토 시 반영됩니다.
          </span>
        </div>

        {candidates.length > 0 ? (
          <div className="grid grid-cols-1 gap-5">
            {candidates.map((cand, idx) => {
              const isInterested = cand.status === 'INTERESTED' || cand.status === 'INTEREST';
              const isWatch = cand.status === 'WATCH';
              const isExcluded = cand.status === 'EXCLUDED' || cand.status === 'EXCLUDE';
              const isPending = cand.status === 'PENDING' || (!isInterested && !isWatch && !isExcluded);

              return (
                <div
                  key={cand.id}
                  className={`rounded-2xl p-5 sm:p-6 border transition shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                    isInterested
                      ? 'bg-slate-900/90 border-emerald-500/50 shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                      : isWatch
                      ? 'bg-slate-900/80 border-amber-500/40'
                      : isExcluded
                      ? 'bg-slate-950/60 border-slate-800 opacity-60'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Left: Rank & Product Details */}
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    {/* Rank Badge */}
                    <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 text-indigo-400 flex items-center justify-center font-black font-mono text-base shrink-0">
                      #{idx + 1}
                    </div>

                    {/* Image Thumbnail */}
                    {cand.image_url && (
                      <img
                        src={cand.image_url}
                        alt={cand.title}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-slate-700 shrink-0 shadow-md"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}

                    {/* Info */}
                    <div className="space-y-2 min-w-0 flex-1">
                      {/* Keyword & Brand Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => onInspectMarketKeyword && onInspectMarketKeyword(cand.keyword)}
                          className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 hover:bg-indigo-500/30 transition flex items-center gap-1 cursor-pointer"
                          title="이 시장 키워드 전체 분석 보기"
                        >
                          <Search className="w-3 h-3" />
                          <span>{cand.keyword}</span>
                        </button>

                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          cand.brand_type === 'BRAND_OFFICIAL' 
                            ? 'bg-slate-800 text-indigo-300 border border-slate-700' 
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {cand.brand_type === 'BRAND_OFFICIAL' ? '대형 브랜드몰' : '소호몰/스마트스토어'}
                        </span>

                        {/* Catalog / Single Seller Badge */}
                        {(cand.is_catalog === 'YES' || cand.is_catalog === true || cand.is_catalog === 'CATALOG') ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                            <Layers className="w-3 h-3 text-purple-400" />
                            카탈로그 ({cand.seller_count || '여러'}개 몰)
                          </span>
                        ) : (cand.is_catalog === 'NO' || cand.is_catalog === false || cand.is_catalog === 'SINGLE') ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            단독상품
                          </span>
                        ) : null}

                        {cand.is_ad ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-0.5">
                            <Megaphone className="w-2.5 h-2.5" />
                            쇼핑광고
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700">
                            오가닉 랭킹
                          </span>
                        )}

                        {/* Status Badge */}
                        {isInterested && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Heart className="w-3 h-3 fill-emerald-400 text-emerald-400" />
                            관심 상품
                          </span>
                        )}
                        {isWatch && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <PauseCircle className="w-3 h-3" />
                            보류/관찰
                          </span>
                        )}
                        {isExcluded && (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            제외
                          </span>
                        )}
                      </div>

                      {/* Product Title */}
                      <h3 className="text-base font-bold text-white leading-snug">
                        {cand.title}
                      </h3>

                      {/* Simple Market Indicators for Dad */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                        <span>판매처: <strong className="text-slate-200">{cand.mall_name}</strong></span>
                        <span>•</span>
                        <span>
                          {(cand.is_catalog === 'YES' || cand.is_catalog === true || cand.is_catalog === 'CATALOG') ? '대표 최저가: ' : '국내 판매가: '}
                          <strong className="text-emerald-400 font-mono font-bold text-sm">
                            ₩{(cand.catalog_min_price || cand.price)?.toLocaleString()}원
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          {(cand.is_catalog === 'YES' || cand.is_catalog === true || cand.is_catalog === 'CATALOG')
                            ? <span>등록 판매처: <strong className="text-purple-300 font-mono font-bold">{cand.seller_count || '여러'}개</strong></span>
                            : <span>리뷰 수: <strong className="text-slate-200">{cand.review_count !== null ? cand.review_count.toLocaleString() + '개' : '미제공'}</strong></span>
                          }
                        </span>
                      </div>

                      {/* Technical Details (Toggled) */}
                      {showTechnicalDetails && (
                        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] space-y-1.5 text-slate-400 animate-in fade-in">
                          <div className="flex items-center gap-4">
                            <span>월간 총 검색량: <strong className="text-white font-mono">{cand.monthly_search_total?.toLocaleString() || '-'}회</strong></span>
                            <span>트렌드: <strong className="text-indigo-300">{cand.trend_status || '-'}</strong></span>
                            <span>시장 중앙가: <strong className="text-emerald-400 font-mono">₩{cand.market_median_price?.toLocaleString() || '-'}</strong></span>
                          </div>
                          {cand.reasons && (
                            <div>
                              <span className="font-semibold text-slate-500">선정 사유:</span> {cand.reasons.join(' / ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Dad Decision Actions & Sourcing Link */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end justify-between gap-3 border-t lg:border-t-0 pt-4 lg:pt-0 shrink-0">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {/* 카탈로그 상세 버튼 */}
                      <button
                        onClick={() => handleOpenCatalogModal(cand)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
                        title="카탈로그 상세 및 식별자 보기"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>카탈로그 상세</span>
                      </button>

                      {/* Big Action: 공급처 찾기 */}
                      <button
                        onClick={() => onSelectCandidateForSupplier(cand.id)}
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Truck className="w-4 h-4" />
                        <span>공급처 찾기</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Quick Status Decision Buttons (관심 / 보류 / 제외) */}
                    <div className="flex items-center gap-1.5 w-full justify-end">
                      <button
                        onClick={() => handleUpdateStatus(cand.id, 'INTERESTED')}
                        disabled={actionLoadingId === cand.id}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer ${
                          isInterested
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                        title="관심 상품으로 저장"
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span>관심</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(cand.id, 'WATCH')}
                        disabled={actionLoadingId === cand.id}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer ${
                          isWatch
                            ? 'bg-amber-600 text-white shadow'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                        title="보류 후 관찰"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span>보류</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(cand.id, 'EXCLUDED')}
                        disabled={actionLoadingId === cand.id}
                        className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1 cursor-pointer ${
                          isExcluded
                            ? 'bg-rose-600 text-white shadow'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                        }`}
                        title="소싱 대상에서 제외"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>제외</span>
                      </button>

                      {cand.product_url && (
                        <a
                          href={cand.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                          title="네이버 쇼핑 원문 링크"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/60 border border-dashed border-slate-800 rounded-3xl space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">오늘 등록된 소싱 후보가 없습니다.</h3>
            <p className="text-xs text-slate-500">
              상단의 <strong>[시장 분석]</strong> 메뉴에서 원하는 키워드를 입력하고 [후보 발굴]을 실행해 보세요.
            </p>
          </div>
        )}
      </div>

      {/* Catalog Detail Modal */}
      <CatalogDetailModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        product={selectedCatalogProduct}
        onOpenSupplierSearch={onSelectCandidateForSupplier}
      />
    </div>
  );
}
