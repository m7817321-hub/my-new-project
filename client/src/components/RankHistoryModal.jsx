import React, { useEffect, useState } from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  ExternalLink, 
  Sparkles,
  ShoppingBag,
  Layers,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';

export default function RankHistoryModal({
  isOpen,
  onClose,
  target,
  onRefreshSingle
}) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen && target) {
      fetchHistory();
    }
  }, [isOpen, target]);

  const fetchHistory = async () => {
    if (!target) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rank-tracker/history/${target.id}`);
      const json = await res.json();
      if (json.success) {
        setHistory(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch rank history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualCheck = async () => {
    if (!target || isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (onRefreshSingle) {
        await onRefreshSingle(target.id);
      }
      await fetchHistory();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isOpen || !target) return null;

  const latest = history[0] || target.latest_rank;
  const bestRank = history.reduce((min, h) => {
    if (h.organic_rank && h.organic_rank > 0) {
      return min === null ? h.organic_rank : Math.min(min, h.organic_rank);
    }
    return min;
  }, null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  키워드: {target.keyword}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {target.mall_name}
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-0.5 truncate max-w-md">
                {target.product_name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualCheck}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? '확인 중...' : '지금 순위 갱신'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          
          {/* Summary Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
              <span className="text-[11px] text-slate-400 font-medium block">현재 자연 순위</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono block">
                {latest && latest.organic_rank ? `${latest.organic_rank}위` : (latest?.status === 'OUT_OF_RANK' ? '권외' : '-')}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
              <span className="text-[11px] text-slate-400 font-medium block">역대 최고 순위</span>
              <span className="text-xl font-extrabold text-indigo-300 font-mono block">
                {bestRank ? `${bestRank}위` : '-'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
              <span className="text-[11px] text-slate-400 font-medium block">쇼핑광고 노출</span>
              <span className="text-xl font-extrabold text-purple-300 font-mono block">
                {latest && latest.ad_rank ? `광고 ${latest.ad_rank}위` : '미노출'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
              <span className="text-[11px] text-slate-400 font-medium block">목표 순위</span>
              <span className="text-xl font-extrabold text-amber-300 font-mono block">
                TOP {target.target_rank || 10}
              </span>
            </div>
          </div>

          {/* Product Match Info */}
          {target.product_url && (
            <div className="p-3.5 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs">
              <div className="space-y-0.5 min-w-0 pr-4">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">스마트스토어 연결 URL</span>
                <p className="text-slate-300 font-mono truncate text-[11px]">
                  {target.product_url}
                </p>
              </div>
              <a
                href={target.product_url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 shrink-0 transition"
              >
                <span>스토어 열기</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* History List / Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>날짜별 순위 기록 이력 ({history.length}회 기록)</span>
              </h4>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                <span>순위 기록을 불러오는 중...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 p-6 space-y-2">
                <p className="text-xs text-slate-400">아직 기록된 순위 이력이 없습니다.</p>
                <p className="text-[11px] text-slate-500">상단의 [지금 순위 갱신] 버튼을 누르면 첫 순위 조회가 실행됩니다.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 text-[11px] border-b border-slate-800 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">조회 일시</th>
                      <th className="py-3 px-3">상태</th>
                      <th className="py-3 px-3">자연노출 순위</th>
                      <th className="py-3 px-3">광고 순위</th>
                      <th className="py-3 px-3">전체 순위</th>
                      <th className="py-3 px-4">노출 가격</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                    {history.map((h, i) => {
                      const isFound = h.status === 'FOUND';
                      const isOut = h.status === 'OUT_OF_RANK';
                      const isError = h.status === 'ERROR';

                      const dateStr = new Date(h.tracked_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <tr key={h.id || i} className="hover:bg-slate-900/50 transition">
                          <td className="py-3 px-4 font-sans text-slate-400 text-[11px]">
                            {dateStr}
                          </td>
                          <td className="py-3 px-3 font-sans">
                            {isFound && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                노출 확인
                              </span>
                            )}
                            {isOut && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                                40위 밖
                              </span>
                            )}
                            {isError && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                조회 오류
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-bold">
                            {h.organic_rank ? (
                              <span className="text-emerald-400 text-xs">
                                #{h.organic_rank}위
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-bold">
                            {h.ad_rank ? (
                              <span className="text-purple-300 text-xs">
                                AD #{h.ad_rank}위
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-400">
                            {h.total_rank ? `#${h.total_rank}번째` : '-'}
                          </td>
                          <td className="py-3 px-4 text-slate-300">
                            {h.price ? `₩${h.price.toLocaleString()}원` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
