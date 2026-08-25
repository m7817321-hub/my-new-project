import React, { useMemo } from 'react';
import { 
  Sparkles, 
  DollarSign, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Building2, 
  Tag, 
  ArrowRight, 
  TrendingUp, 
  Percent, 
  HelpCircle,
  FlaskConical
} from 'lucide-react';

export default function ProductInputForm({ 
  formData, 
  onChange, 
  onTransform, 
  isTransforming,
  onLoadSample,
  samples
}) {
  // 실시간 마진 계산
  const marginSummary = useMemo(() => {
    const cost = Number(formData.cost_price) || 0;
    const selling = Number(formData.selling_price) || 0;
    const supplyShip = Number(formData.supply_shipping) || 0;
    const custShip = Number(formData.customer_shipping) || 0;
    const feeRate = Number(formData.market_fee_rate) || 10.8;
    const pkgCost = Number(formData.packaging_cost) || 0;

    const marketFee = Math.round(selling * (feeRate / 100));
    const shipDiff = custShip - supplyShip;
    const marginAmount = selling - cost - marketFee - pkgCost + shipDiff;
    const totalRev = selling + (custShip > 0 ? custShip : 0);
    const marginRate = totalRev > 0 ? Number(((marginAmount / totalRev) * 100).toFixed(1)) : 0;

    return {
      marginAmount,
      marginRate,
      marketFee,
      isProfitable: marginAmount > 0
    };
  }, [formData]);

  const isValid = formData.original_name && formData.original_name.trim().length > 0;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Quick Sample Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-indigo-400"></span>
            1. 상품 기본정보 입력
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            도매처/공급처의 원천 상품 정보를 입력하면 AI가 판매용 등록 데이터로 가공합니다.
          </p>
        </div>

        {/* Test sample chips */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
            <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
            테스트 샘플:
          </span>
          {samples?.map((sample, idx) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => onLoadSample(sample)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-800/50 transition flex items-center gap-1 shadow-sm active:scale-95"
            >
              <span>🧢</span>
              {idx === 0 ? '캠프캡' : '볼캡'}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onTransform(); }} className="mt-5 space-y-4">
        {/* 원본 상품명 */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              원본 상품명 <span className="text-rose-400">*</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">도매처에 기재된 원래 이름</span>
          </label>
          <input
            type="text"
            required
            name="original_name"
            value={formData.original_name || ''}
            onChange={onChange}
            placeholder="예: 2026 어반 고프코어 나일론 스트랩 5패널 캠프캡 생활방수 모자"
            className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
          />
        </div>

        {/* 가격 & 마진 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* 공급 원가 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              공급 원가 (사입가)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="100"
                name="cost_price"
                value={formData.cost_price || ''}
                onChange={onChange}
                placeholder="6800"
                className="w-full pl-7 pr-10 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition font-mono"
              />
              <span className="absolute left-2.5 top-2 text-xs text-slate-400">₩</span>
              <span className="absolute right-3 top-2 text-xs text-slate-400">원</span>
            </div>
          </div>

          {/* 목표 판매가 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              목표 판매가 (소비자가)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="100"
                name="selling_price"
                value={formData.selling_price || ''}
                onChange={onChange}
                placeholder="19800"
                className="w-full pl-7 pr-10 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition font-mono font-medium text-emerald-300"
              />
              <span className="absolute left-2.5 top-2 text-xs text-slate-400">₩</span>
              <span className="absolute right-3 top-2 text-xs text-slate-400">원</span>
            </div>
          </div>
        </div>

        {/* 실시간 마진 계산 프리뷰 카드 */}
        <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-slate-400 text-[11px] block">예상 순마진액</span>
              <span className={`font-bold font-mono text-sm ${marginSummary.isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                ₩{marginSummary.marginAmount.toLocaleString()}원
              </span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-400 text-[11px] block">마진율</span>
              <span className={`font-bold font-mono text-sm ${marginSummary.marginRate >= 25 ? 'text-emerald-400' : marginSummary.marginRate > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                {marginSummary.marginRate}%
              </span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-400 text-[11px] block">마켓 수수료(10.8%)</span>
              <span className="text-slate-300 font-mono text-xs">
                ₩{marginSummary.marketFee.toLocaleString()}원
              </span>
            </div>
          </div>

          <div className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800/80 text-slate-300 font-medium border border-slate-700/50">
            {marginSummary.marginRate >= 30 ? '🔥 고마진 타겟' : marginSummary.marginRate >= 15 ? '✅ 적정 마진' : '⚠️ 마진 재검토 권장'}
          </div>
        </div>

        {/* 공급처 & 링크 & 이미지 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* 공급처 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              공급처 (도매처)
            </label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier || ''}
              onChange={onChange}
              placeholder="예: 도매꾹 (우정무역)"
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
            />
          </div>

          {/* 상품 URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              상품 URL (소싱 링크)
            </label>
            <input
              type="url"
              name="product_url"
              value={formData.product_url || ''}
              onChange={onChange}
              placeholder="https://domeggook.com/..."
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
            />
          </div>

          {/* 이미지 경로 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              대표 이미지 경로/URL
            </label>
            <input
              type="text"
              name="image_url"
              value={formData.image_url || ''}
              onChange={onChange}
              placeholder="https://... 또는 /images/cap.jpg"
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* 이미지 미리보기 (URL이 있을 경우) */}
        {formData.image_url && (
          <div className="flex items-center gap-3 p-2.5 bg-slate-950/60 border border-slate-800 rounded-xl">
            <img 
              src={formData.image_url} 
              alt="상품 미리보기" 
              className="w-12 h-12 object-cover rounded-lg border border-slate-700"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div className="text-xs text-slate-400 truncate">
              <span className="text-slate-300 font-medium block">이미지 미리보기 연결됨</span>
              <span className="truncate block max-w-xs">{formData.image_url}</span>
            </div>
          </div>
        )}

        {/* '상품화 시작' 버튼 */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isValid || isTransforming}
            className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg ${
              isValid && !isTransforming
                ? 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-indigo-500/25 active:scale-[0.99] cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
            }`}
          >
            {isTransforming ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>AI 상품화 분석 및 등록 데이터 생성 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>상품화 시작 (AI 등록 데이터 자동 생성)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
