import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Plus, 
  Search, 
  RefreshCw, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ExternalLink, 
  Trash2, 
  Layers, 
  Sparkles, 
  ShoppingBag, 
  Clock, 
  Tag,
  ArrowUpRight,
  ShieldCheck,
  Eye
} from 'lucide-react';
import RankHistoryModal from './RankHistoryModal';

export default function RankTrackerView() {
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [checkingTargetId, setCheckingTargetId] = useState(null);

  // Register Modal State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [regForm, setRegForm] = useState({
    product_name: '',
    product_url: '',
    nv_mid: '',
    mall_name: '',
    keywords: '',
    target_rank: 10
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // History Modal State
  const [selectedTargetForHistory, setSelectedTargetForHistory] = useState(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rank-tracker/targets');
      const json = await res.json();
      if (json.success) {
        setTargets(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch rank targets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.product_name || !regForm.mall_name || !regForm.keywords) {
      alert('상품명, 스마트스토어 판매처명, 추적 키워드는 필수입니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/rank-tracker/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...regForm,
          target_rank: Number(regForm.target_rank) || 10
        })
      });
      const json = await res.json();
      if (json.success) {
        setIsRegisterModalOpen(false);
        setRegForm({
          product_name: '',
          product_url: '',
          nv_mid: '',
          mall_name: '',
          keywords: '',
          target_rank: 10
        });
        await fetchTargets();
      } else {
        alert(json.error || '등록 실패');
      }
    } catch (err) {
      alert('등록 중 오류 발생: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckSingle = async (targetId) => {
    setCheckingTargetId(targetId);
    try {
      const res = await fetch(`/api/rank-tracker/targets/${targetId}/check`, {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success) {
        await fetchTargets();
      } else {
        alert(json.error || '순위 확인 실패');
      }
    } catch (err) {
      alert('순위 확인 중 오류: ' + err.message);
    } finally {
      setCheckingTargetId(null);
    }
  };

  const handleCheckAll = async () => {
    if (isCheckingAll) return;
    if (targets.length === 0) {
      alert('추적 대상 상품이 없습니다. 먼저 상품을 등록해주세요.');
      return;
    }

    setIsCheckingAll(true);
    try {
      const res = await fetch('/api/rank-tracker/check-all', {
        method: 'POST'
      });
      const json = await res.json();
      if (json.success) {
        await fetchTargets();
      } else {
        alert(json.error || '전체 순위 확인 실패');
      }
    } catch (err) {
      alert('전체 순위 확인 중 오류: ' + err.message);
    } finally {
      setIsCheckingAll(false);
    }
  };

  const handleDelete = async (targetId) => {
    if (!confirm('이 키워드 추적 대상을 삭제하시겠습니까? (기록된 이력도 함께 삭제됩니다)')) {
      return;
    }

    try {
      const res = await fetch(`/api/rank-tracker/targets/${targetId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        await fetchTargets();
      }
    } catch (err) {
      alert('삭제 중 오류: ' + err.message);
    }
  };

  // Filtered list
  const filteredTargets = targets.filter(t => {
    const matchesSearch = 
      (t.product_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.keyword || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.mall_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'FOUND') return t.latest_rank?.status === 'FOUND';
    if (statusFilter === 'OUT_OF_RANK') return t.latest_rank?.status === 'OUT_OF_RANK';
    if (statusFilter === 'TOP10') return t.latest_rank?.organic_rank && t.latest_rank.organic_rank <= 10;
    if (statusFilter === 'AD') return t.latest_rank?.ad_rank && t.latest_rank.ad_rank > 0;

    return true;
  });

  // Calculate Metrics
  const totalKeywords = targets.length;
  const foundKeywords = targets.filter(t => t.latest_rank?.status === 'FOUND').length;
  const top10Keywords = targets.filter(t => t.latest_rank?.organic_rank && t.latest_rank.organic_rank <= 10).length;
  const adActiveKeywords = targets.filter(t => t.latest_rank?.ad_rank && t.latest_rank.ad_rank > 0).length;
  const outOfRankKeywords = targets.filter(t => t.latest_rank?.status === 'OUT_OF_RANK').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Header & Summary Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>SmartStore Keyword Rank Tracker V1</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              스마트스토어 키워드 노출 순위 추적
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              등록한 내 상품이 네이버 쇼핑 주요 키워드에서 몇 위에 노출되는지 실시간 및 일일 자동(새벽 00:30 KST)으로 추적합니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-4 h-4" />
              <span>추적 상품/키워드 등록</span>
            </button>

            <button
              onClick={handleCheckAll}
              disabled={isCheckingAll || loading || targets.length === 0}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 font-bold text-xs transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isCheckingAll ? 'animate-spin' : ''}`} />
              <span>{isCheckingAll ? '전체 순위 조회 중...' : '전체 즉시 순위 확인'}</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">총 추적 키워드</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-white font-mono">{totalKeywords}</span>
              <span className="text-xs text-slate-500">개</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">노출 확인 (Found)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-emerald-400 font-mono">{foundKeywords}</span>
              <span className="text-xs text-slate-500">개</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">TOP 10 진입</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-indigo-300 font-mono">{top10Keywords}</span>
              <span className="text-xs text-slate-500">개</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] text-slate-400 font-medium block">쇼핑광고 노출</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-purple-300 font-mono">{adActiveKeywords}</span>
              <span className="text-xs text-slate-500">개</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-400 font-medium block">권외 (40위 밖)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-slate-400 font-mono">{outOfRankKeywords}</span>
              <span className="text-xs text-slate-500">개</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            전체 ({targets.length})
          </button>
          <button
            onClick={() => setStatusFilter('FOUND')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              statusFilter === 'FOUND'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            노출 중 ({foundKeywords})
          </button>
          <button
            onClick={() => setStatusFilter('TOP10')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              statusFilter === 'TOP10'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            TOP 10 ({top10Keywords})
          </button>
          <button
            onClick={() => setStatusFilter('AD')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              statusFilter === 'AD'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            광고 노출 ({adActiveKeywords})
          </button>
          <button
            onClick={() => setStatusFilter('OUT_OF_RANK')}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              statusFilter === 'OUT_OF_RANK'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
            }`}
          >
            권외 ({outOfRankKeywords})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="상품명, 키워드, 스토어 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
      </div>

      {/* 3. Target List Table */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
          <span>추적 대상 목록을 불러오는 중...</span>
        </div>
      ) : filteredTargets.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/60 rounded-3xl border border-slate-800 p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto border border-indigo-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">등록된 추적 대상이 없습니다</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              스마트스토어 상품 URL과 추적할 키워드를 등록하면 매일 새벽 00:30 KST 및 실시간으로 순위를 모니터링합니다.
            </p>
          </div>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>첫 상품/키워드 등록하기</span>
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 text-[11px] border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">추적 상품 정보</th>
                  <th className="py-3.5 px-4">추적 키워드</th>
                  <th className="py-3.5 px-4 text-center">현재 순위 (자연노출)</th>
                  <th className="py-3.5 px-4 text-center">어제 순위 / 변화량</th>
                  <th className="py-3.5 px-4 text-center">쇼핑광고 노출</th>
                  <th className="py-3.5 px-4 text-center">상태</th>
                  <th className="py-3.5 px-5 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTargets.map((target) => {
                  const latest = target.latest_rank;
                  const prev = target.previous_rank;
                  const delta = target.delta;
                  const isCheckingThis = checkingTargetId === target.id;

                  const isFound = latest?.status === 'FOUND';
                  const isOut = latest?.status === 'OUT_OF_RANK';
                  const isError = latest?.status === 'ERROR';

                  return (
                    <tr key={target.id} className="hover:bg-slate-800/40 transition">
                      {/* Product Name & Mall */}
                      <td className="py-4 px-5 max-w-xs">
                        <div className="space-y-1">
                          <h4 className="font-bold text-white text-xs line-clamp-1" title={target.product_name}>
                            {target.product_name}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-semibold text-indigo-300 truncate max-w-[120px]">
                              {target.mall_name}
                            </span>
                            {target.product_url && (
                              <a
                                href={target.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 hover:text-slate-300 inline-flex items-center gap-0.5"
                                title="스마트스토어 열기"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Keyword */}
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 inline-flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {target.keyword}
                        </span>
                      </td>

                      {/* Current Organic Rank */}
                      <td className="py-4 px-4 text-center font-mono">
                        {latest ? (
                          latest.organic_rank ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="text-base font-extrabold text-emerald-400">
                                #{latest.organic_rank}위
                              </span>
                              <span className="text-[10px] text-slate-500">
                                (목표: TOP {target.target_rank || 10})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                              40위 밖
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-slate-500 font-sans">미조회</span>
                        )}
                      </td>

                      {/* Yesterday Rank & Delta */}
                      <td className="py-4 px-4 text-center font-mono">
                        {latest && prev ? (
                          <div className="space-y-0.5">
                            <span className="text-xs text-slate-400 block">
                              어제: {prev.organic_rank ? `${prev.organic_rank}위` : '권외'}
                            </span>
                            {delta !== null && delta !== 0 ? (
                              <span className={`text-[11px] font-bold inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded ${
                                delta > 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}>
                                {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                <span>{delta > 0 ? `+${delta}` : delta}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">-</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>

                      {/* Ad Rank */}
                      <td className="py-4 px-4 text-center font-mono">
                        {latest && latest.ad_rank ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            광고 {latest.ad_rank}위
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">미노출</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        {isFound && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            노출 확인
                          </span>
                        )}
                        {isOut && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            40위 밖
                          </span>
                        )}
                        {isError && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            오류
                          </span>
                        )}
                        {!latest && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] text-slate-500 bg-slate-800">
                            대기 중
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleCheckSingle(target.id)}
                            disabled={isCheckingThis}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            title="지금 순위 확인"
                          >
                            <RefreshCw className={`w-3 h-3 ${isCheckingThis ? 'animate-spin' : ''}`} />
                            <span>{isCheckingThis ? '조회중' : '순위 확인'}</span>
                          </button>

                          <button
                            onClick={() => setSelectedTargetForHistory(target)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            title="순위 이력 및 차트 보기"
                          >
                            <TrendingUp className="w-3 h-3 text-indigo-400" />
                            <span>이력</span>
                          </button>

                          <button
                            onClick={() => handleDelete(target.id)}
                            className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                            title="추적 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Register Target Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    스마트스토어 상품 & 키워드 추적 등록
                  </h3>
                  <p className="text-xs text-slate-400">
                    추적할 스마트스토어 상품 정보와 검색 키워드를 등록합니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4 overflow-y-auto">
              
              {/* Product Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <span>상품명</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 2026 어반 고프코어 나일론 5패널 캠프캡"
                  value={regForm.product_name}
                  onChange={(e) => setRegForm({ ...regForm, product_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Mall Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <span>스마트스토어 상호명 (mallName)</span>
                  <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 우정어패럴 또는 티켓투더문"
                  value={regForm.mall_name}
                  onChange={(e) => setRegForm({ ...regForm, mall_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-500">
                  * 네이버 쇼핑 검색 결과의 판매처명과 정확히 일치해야 자동 매칭됩니다.
                </p>
              </div>

              {/* Product URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  스마트스토어 상품 URL (선택 권장)
                </label>
                <input
                  type="url"
                  placeholder="예: https://smartstore.naver.com/woojung/products/123456789"
                  value={regForm.product_url}
                  onChange={(e) => setRegForm({ ...regForm, product_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                />
              </div>

              {/* Keywords */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <span>추적 키워드 (1~10개, 쉼표 또는 줄바꿈으로 구분)</span>
                  <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="예: 캠프캡, 나일론 캠프캡, 방수 볼캡, 고프코어 모자"
                  value={regForm.keywords}
                  onChange={(e) => setRegForm({ ...regForm, keywords: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Target Rank */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  목표 순위 (TOP N)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={regForm.target_rank}
                  onChange={(e) => setRegForm({ ...regForm, target_rank: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>등록 중...</span>
                    </>
                  ) : (
                    <span>추적 등록 완료</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Rank History Modal */}
      <RankHistoryModal
        isOpen={!!selectedTargetForHistory}
        onClose={() => setSelectedTargetForHistory(null)}
        target={selectedTargetForHistory}
        onRefreshSingle={handleCheckSingle}
      />
    </div>
  );
}
