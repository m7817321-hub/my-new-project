import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Layers,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  ShieldAlert,
  Sliders,
  Sparkles,
  RefreshCw,
  Coins
} from 'lucide-react';

export default function MarginCalculatorSection({
  formData = {},
  onChange,
  className = ''
}) {
  const [calcTab, setCalcTab] = useState('quick'); // 'quick' | 'detailed'
  const [unknownMode, setUnknownMode] = useState('zero'); // 'zero' | 'strict'
  const [expandedSections, setExpandedSections] = useState({
    procurement: false,
    platform: false,
    risk: false,
    bep: true
  });

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Currency presets
  const handleCurrencyChange = (curr) => {
    let rate = 1;
    if (curr === 'CNY') rate = 195;
    if (curr === 'USD') rate = 1350;
    if (curr === 'KRW') rate = 1;

    onChange({ target: { name: 'currency', value: curr } });
    onChange({ target: { name: 'exchange_rate', value: rate } });
  };

  // Real-time calculation logic
  const calculation = useMemo(() => {
    const rawCost = formData.cost_price !== undefined && formData.cost_price !== '' && formData.cost_price !== null
      ? Number(formData.cost_price)
      : null;
    const rawSelling = formData.selling_price !== undefined && formData.selling_price !== '' && formData.selling_price !== null
      ? Number(formData.selling_price)
      : null;

    const isCostUnknown = rawCost === null;
    const isSellingUnknown = rawSelling === null;

    const currency = (formData.currency || 'KRW').toUpperCase();
    const exchangeRate = currency === 'KRW' ? 1 : Number(formData.exchange_rate) || (currency === 'CNY' ? 195 : 1350);

    const moq = Math.max(1, Number(formData.moq) || 1);
    const quantity = Math.max(1, Number(formData.quantity) || moq);

    // 1. Per-item procurement
    const unitCostRaw = isCostUnknown ? 0 : rawCost;
    const unitCostKrw = Math.round(unitCostRaw * exchangeRate);
    const chinaLocalCostRaw = Number(formData.china_local_cost) || 0;
    const chinaLocalCostKrw = currency === 'CNY' ? Math.round(chinaLocalCostRaw * exchangeRate) : chinaLocalCostRaw;
    const tariffTax = Number(formData.tariff_tax) || 0;
    const intlShipping = Number(formData.international_shipping) || 0;

    // 2. Batch procurement
    const batchForwarding = Number(formData.batch_forwarding_fee) || Number(formData.forwarding_fee) || 0;
    const batchIntl = Number(formData.batch_international_shipping) || 0;
    const batchCustoms = Number(formData.batch_customs_fee) || 0;
    const batchExtra = Number(formData.batch_extra_cost) || 0;
    const totalBatchCost = batchForwarding + batchIntl + batchCustoms + batchExtra;
    const batchCostPerItem = quantity > 0 ? Math.round(totalBatchCost / quantity) : 0;

    const effectiveUnitCost = isCostUnknown && unknownMode === 'strict'
      ? null
      : unitCostKrw + chinaLocalCostKrw + tariffTax + intlShipping + batchCostPerItem;

    const totalProcurementCost = effectiveUnitCost !== null ? effectiveUnitCost * quantity : null;

    // 3. Per-sale costs
    const sellingPrice = isSellingUnknown ? 0 : rawSelling;
    const supplyShipping = Number(formData.supply_shipping) !== undefined && formData.supply_shipping !== ''
      ? Number(formData.supply_shipping)
      : (formData.platform === '1688' ? 6000 : 3000);
    const customerShipping = Number(formData.customer_shipping) !== undefined && formData.customer_shipping !== ''
      ? Number(formData.customer_shipping)
      : 3000;
    const packagingCost = Number(formData.packaging_cost) !== undefined && formData.packaging_cost !== ''
      ? Number(formData.packaging_cost)
      : 500;

    const marketFeeRate = Number(formData.market_fee_rate) !== undefined && formData.market_fee_rate !== ''
      ? Number(formData.market_fee_rate)
      : 10.8;
    const paymentFeeRate = Number(formData.payment_fee_rate) || 0;
    const paymentFeeFixed = Number(formData.payment_fee) || 0;
    const adCost = Number(formData.ad_cost) || 0;
    const discountCost = Number(formData.discount_cost) || 0;

    const returnExchangeCost = Number(formData.return_exchange_cost) || 0;
    const defectCost = Number(formData.defect_cost) || 0;
    const extraCost = Number(formData.extra_cost) || 0;

    const marketFeeAmount = Math.round(sellingPrice * (marketFeeRate / 100));
    const paymentFeeAmount = Math.round(sellingPrice * (paymentFeeRate / 100)) + paymentFeeFixed;
    const platformSellingCost = marketFeeAmount + paymentFeeAmount + adCost + discountCost;
    const fulfillmentCost = supplyShipping + packagingCost;
    const riskCost = returnExchangeCost + defectCost + extraCost;

    const perSaleVariableCost = (effectiveUnitCost !== null ? effectiveUnitCost : 0) +
      platformSellingCost + fulfillmentCost + riskCost;

    const totalRevenue = sellingPrice + (customerShipping > 0 ? customerShipping : 0);

    let netProfit = null;
    let marginRate = null;
    let isProfitable = false;

    if (isCostUnknown || isSellingUnknown) {
      if (unknownMode === 'zero') {
        netProfit = totalRevenue - perSaleVariableCost;
        marginRate = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;
        isProfitable = netProfit > 0;
      }
    } else {
      netProfit = totalRevenue - perSaleVariableCost;
      marginRate = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;
      isProfitable = netProfit > 0;
    }

    // BEP & Target Selling Price
    const targetMarginRate = Number(formData.target_margin_rate) || 25;
    let breakEvenPrice = null;
    let targetSellingPrice = null;

    if (effectiveUnitCost !== null && effectiveUnitCost > 0) {
      const combinedFeeRate = (marketFeeRate + paymentFeeRate) / 100;
      const nonRateVarCost = effectiveUnitCost + packagingCost + supplyShipping +
        riskCost + adCost + discountCost + paymentFeeFixed - customerShipping;

      if (combinedFeeRate < 1) {
        const rawBep = nonRateVarCost / (1 - combinedFeeRate);
        breakEvenPrice = Math.max(0, Math.ceil(rawBep / 100) * 100);
      }

      const targetRatio = targetMarginRate / 100;
      const targetDenom = 1 - combinedFeeRate - targetRatio;
      if (targetDenom > 0) {
        const rawTarget = (nonRateVarCost + (customerShipping * targetRatio)) / targetDenom;
        targetSellingPrice = Math.max(0, Math.ceil(rawTarget / 100) * 100);
      }
    }

    return {
      isCostUnknown,
      isSellingUnknown,
      currency,
      exchangeRate,
      moq,
      quantity,
      unitCostKrw,
      effectiveUnitCost,
      totalProcurementCost,
      totalBatchCost,
      batchCostPerItem,
      marketFeeAmount,
      paymentFeeAmount,
      platformSellingCost,
      fulfillmentCost,
      riskCost,
      perSaleVariableCost,
      totalRevenue,
      netProfit,
      marginRate,
      isProfitable,
      breakEvenPrice,
      targetSellingPrice,
      targetMarginRate
    };
  }, [formData, unknownMode]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Mode Tabs & UNKNOWN Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setCalcTab('quick')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              calcTab === 'quick'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>빠른 마진 계산</span>
          </button>
          <button
            type="button"
            onClick={() => setCalcTab('detailed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              calcTab === 'detailed'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>상세 원가 계산 (V2)</span>
          </button>
        </div>

        {/* UNKNOWN Toggle */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-slate-400 font-medium">미입력 항목:</span>
          <button
            type="button"
            onClick={() => setUnknownMode(m => m === 'zero' ? 'strict' : 'zero')}
            className={`px-2.5 py-1 rounded-lg border font-mono transition flex items-center gap-1.5 ${
              unknownMode === 'zero'
                ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-300'
            }`}
            title="미입력 값을 0원으로 처리할지, UNKNOWN으로 명확히 구분할지 설정합니다."
          >
            <span className={`w-1.5 h-1.5 rounded-full ${unknownMode === 'zero' ? 'bg-slate-400' : 'bg-amber-400'}`} />
            {unknownMode === 'zero' ? '0원 처리' : 'UNKNOWN 표시'}
          </button>
        </div>
      </div>

      {/* UNKNOWN Notice Banner if critical inputs are missing */}
      {(calculation.isCostUnknown || calculation.isSellingUnknown) && (
        <div className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {calculation.isCostUnknown && calculation.isSellingUnknown
              ? '공급 원가와 목표 판매가를 입력하면 정확한 실질 원가 및 마진이 계산됩니다.'
              : calculation.isCostUnknown
              ? '공급 원가(사입가)가 입력되지 않았습니다.'
              : '목표 판매가가 입력되지 않았습니다.'}
          </span>
        </div>
      )}

      {/* Hero Metric Cards (가장 중요한 3대 숫자: 실질 원가, 순이익, 순이익률) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. 상품당 실질 원가 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-indigo-400" />
              상품당 실질 원가
            </span>
            <span className="text-[10px] text-slate-500">사입+물류+통관</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-300 tracking-tight">
            {calculation.effectiveUnitCost !== null ? (
              `₩${calculation.effectiveUnitCost.toLocaleString()}원`
            ) : (
              <span className="text-slate-500 text-base font-normal">입력 필요 (UNKNOWN)</span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            {calcTab === 'detailed' && calculation.totalBatchCost > 0
              ? `일괄비용 ₩${calculation.totalBatchCost.toLocaleString()}원 (${calculation.quantity}개 안분)`
              : `공급단가: ₩${calculation.unitCostKrw.toLocaleString()}원`}
          </div>
        </div>

        {/* 2. 예상 순이익 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="font-semibold flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              예상 순이익
            </span>
            <span className="text-[10px] text-slate-500">1건 판매당</span>
          </div>
          <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${
            calculation.netProfit === null
              ? 'text-slate-500 text-base font-normal'
              : calculation.isProfitable
              ? 'text-emerald-400'
              : 'text-rose-400'
          }`}>
            {calculation.netProfit !== null ? (
              `₩${calculation.netProfit.toLocaleString()}원`
            ) : (
              '입력 필요 (UNKNOWN)'
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            변동비: ₩{calculation.perSaleVariableCost.toLocaleString()}원 차감 후
          </div>
        </div>

        {/* 3. 순이익률 */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 relative overflow-hidden shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-[11px] mb-1">
            <span className="font-semibold flex items-center gap-1">
              <Percent className="w-3.5 h-3.5 text-purple-400" />
              순이익률 (마진율)
            </span>
            {calculation.marginRate !== null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                calculation.marginRate >= 30
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                  : calculation.marginRate >= 15
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                  : 'bg-rose-950 text-rose-300 border border-rose-800/50'
              }`}>
                {calculation.marginRate >= 30 ? '🔥 고마진' : calculation.marginRate >= 15 ? '✅ 적정' : '⚠️ 저마진'}
              </span>
            )}
          </div>
          <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${
            calculation.marginRate === null
              ? 'text-slate-500 text-base font-normal'
              : calculation.marginRate >= 25
              ? 'text-emerald-400'
              : calculation.marginRate > 0
              ? 'text-amber-400'
              : 'text-rose-400'
          }`}>
            {calculation.marginRate !== null ? `${calculation.marginRate}%` : 'UNKNOWN'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            총매출 ₩{calculation.totalRevenue.toLocaleString()}원 기준
          </div>
        </div>
      </div>

      {/* Decision Support Badges (손익분기 판매가 & 목표 마진 판매가 & 총 조달비) */}
      <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">손익분기 판매가 (BEP)</span>
          <span className="text-sm font-bold font-mono text-amber-300">
            {calculation.breakEvenPrice ? `₩${calculation.breakEvenPrice.toLocaleString()}원` : '-'}
          </span>
          <span className="text-[10px] text-slate-500 block">순이익 0원 기준</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 block font-medium">
            목표 마진({calculation.targetMarginRate}%) 판매가
          </span>
          <span className="text-sm font-bold font-mono text-purple-300">
            {calculation.targetSellingPrice ? `₩${calculation.targetSellingPrice.toLocaleString()}원` : '-'}
          </span>
          <span className="text-[10px] text-slate-500 block">권장 소비자가</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 block font-medium">총 조달비 (사입총액)</span>
          <span className="text-sm font-bold font-mono text-slate-200">
            {calculation.totalProcurementCost !== null ? `₩${calculation.totalProcurementCost.toLocaleString()}원` : '-'}
          </span>
          <span className="text-[10px] text-slate-500 block">{calculation.quantity}개 기준</span>
        </div>

        <div>
          <span className="text-[11px] text-slate-400 block font-medium">1건당 총 변동비</span>
          <span className="text-sm font-bold font-mono text-slate-200">
            ₩{calculation.perSaleVariableCost.toLocaleString()}원
          </span>
          <span className="text-[10px] text-slate-500 block">원가+수수료+물류</span>
        </div>
      </div>

      {/* Detailed Mode Inputs & Collapsible Cost Breakdown */}
      {calcTab === 'detailed' && (
        <div className="space-y-3 pt-2">
          {/* Section 1: 통화, 환율, 수량 및 사입 조달비 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('procurement')}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-200 bg-slate-900/60 hover:bg-slate-900 transition"
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                <span>1. 사입 & 조달 비용 (통화, 환율, 수량/MOQ, 상품당/일괄비용)</span>
              </div>
              {expandedSections.procurement ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.procurement && (
              <div className="p-4 space-y-4 border-t border-slate-800/80">
                {/* Currency & Exchange Rate & Quantity */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">통화 선택</label>
                    <div className="grid grid-cols-3 gap-1">
                      {['KRW', 'CNY', 'USD'].map(curr => (
                        <button
                          key={curr}
                          type="button"
                          onClick={() => handleCurrencyChange(curr)}
                          className={`py-1.5 rounded-lg text-xs font-semibold transition ${
                            (formData.currency || 'KRW').toUpperCase() === curr
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {curr === 'CNY' ? 'CNY(1688)' : curr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">
                      환율 (KRW)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="exchange_rate"
                      value={formData.exchange_rate !== undefined ? formData.exchange_rate : (formData.currency === 'CNY' ? 195 : formData.currency === 'USD' ? 1350 : 1)}
                      onChange={onChange}
                      disabled={formData.currency === 'KRW'}
                      placeholder="195"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">MOQ (최소주문수량)</label>
                    <input
                      type="number"
                      min="1"
                      name="moq"
                      value={formData.moq || 1}
                      onChange={onChange}
                      placeholder="1"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-300 mb-1">시뮬레이션 사입 수량</label>
                    <input
                      type="number"
                      min="1"
                      name="quantity"
                      value={formData.quantity || formData.moq || 1}
                      onChange={onChange}
                      placeholder="100"
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Per-item costs */}
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
                    <span>• 상품 1개당 추가 조달비</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">
                        중국 내륙 배송/기타비 {formData.currency === 'CNY' ? '(CNY)' : '(KRW)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        name="china_local_cost"
                        value={formData.china_local_cost || ''}
                        onChange={onChange}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">상품당 국제 운송비 (KRW)</label>
                      <input
                        type="number"
                        min="0"
                        name="international_shipping"
                        value={formData.international_shipping || ''}
                        onChange={onChange}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">상품당 관부가세/통관비 (KRW)</label>
                      <input
                        type="number"
                        min="0"
                        name="tariff_tax"
                        value={formData.tariff_tax || ''}
                        onChange={onChange}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Batch / One-time costs */}
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1">
                    <span>• 1회 사입 일괄 비용 (수량으로 자동 균등 안분)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">포워딩/구매대행 수수료 (일괄 KRW)</label>
                      <input
                        type="number"
                        min="0"
                        name="batch_forwarding_fee"
                        value={formData.batch_forwarding_fee || formData.forwarding_fee || ''}
                        onChange={onChange}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">일괄 국제물류비 (해운/항공 KRW)</label>
                      <input
                        type="number"
                        min="0"
                        name="batch_international_shipping"
                        value={formData.batch_international_shipping || ''}
                        onChange={onChange}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-300 mb-1">일괄 검사/통관비용 (KRW)</label>
                      <input
                        type="number"
                        min="0"
                        name="batch_customs_fee"
                        value={formData.batch_customs_fee || ''}
                        onChange={onChange}
                        placeholder="0"
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: 플랫폼 판매 및 마케팅비 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('platform')}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-200 bg-slate-900/60 hover:bg-slate-900 transition"
            >
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-purple-400" />
                <span>2. 플랫폼 판매 및 마케팅비 (수수료, 결제비, 광고비, 할인부담)</span>
              </div>
              {expandedSections.platform ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.platform && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 border-t border-slate-800/80">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">플랫폼 수수료율 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="market_fee_rate"
                    value={formData.market_fee_rate !== undefined ? formData.market_fee_rate : 10.8}
                    onChange={onChange}
                    placeholder="10.8"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">쿠팡 ~10.8%, 네이버 ~5.6%</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">결제 수수료율 (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="payment_fee_rate"
                    value={formData.payment_fee_rate || ''}
                    onChange={onChange}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">PG 결제망 수수료</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">1건당 광고비 (KRW)</label>
                  <input
                    type="number"
                    min="0"
                    name="ad_cost"
                    value={formData.ad_cost || ''}
                    onChange={onChange}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">예: 네이버 쇼핑검색 광고비</span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">할인/쿠폰 부담금 (KRW)</label>
                  <input
                    type="number"
                    min="0"
                    name="discount_cost"
                    value={formData.discount_cost || ''}
                    onChange={onChange}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500">셀러 부담 쿠폰</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: 리스크 & 부대비용 및 목표 마진율 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('risk')}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-bold text-slate-200 bg-slate-900/60 hover:bg-slate-900 transition"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>3. 리스크(반품/불량), 포장비 및 목표 마진율</span>
              </div>
              {expandedSections.risk ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.risk && (
              <div className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 border-t border-slate-800/80">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">포장/부자재비 (KRW)</label>
                  <input
                    type="number"
                    min="0"
                    name="packaging_cost"
                    value={formData.packaging_cost !== undefined ? formData.packaging_cost : 500}
                    onChange={onChange}
                    placeholder="500"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">반품/교환 손실충당 (KRW)</label>
                  <input
                    type="number"
                    min="0"
                    name="return_exchange_cost"
                    value={formData.return_exchange_cost || ''}
                    onChange={onChange}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">불량/폐기 손실충당 (KRW)</label>
                  <input
                    type="number"
                    min="0"
                    name="defect_cost"
                    value={formData.defect_cost || ''}
                    onChange={onChange}
                    placeholder="0"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">목표 순이익률 (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    name="target_margin_rate"
                    value={formData.target_margin_rate !== undefined ? formData.target_margin_rate : 25}
                    onChange={onChange}
                    placeholder="25"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-purple-300 font-mono font-semibold"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Mode Basic Shipping & Fee Controls */}
      {calcTab === 'quick' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">공급처 배송비 (KRW)</label>
            <input
              type="number"
              min="0"
              name="supply_shipping"
              value={formData.supply_shipping !== undefined ? formData.supply_shipping : 3000}
              onChange={onChange}
              placeholder="3000"
              className="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">국내 배송비(고객) (KRW)</label>
            <input
              type="number"
              min="0"
              name="customer_shipping"
              value={formData.customer_shipping !== undefined ? formData.customer_shipping : 3000}
              onChange={onChange}
              placeholder="3000"
              className="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">플랫폼 수수료율 (%)</label>
            <input
              type="number"
              step="0.1"
              name="market_fee_rate"
              value={formData.market_fee_rate !== undefined ? formData.market_fee_rate : 10.8}
              onChange={onChange}
              placeholder="10.8"
              className="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">1건당 광고비 (KRW)</label>
            <input
              type="number"
              min="0"
              name="ad_cost"
              value={formData.ad_cost || ''}
              onChange={onChange}
              placeholder="0"
              className="w-full px-2.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
