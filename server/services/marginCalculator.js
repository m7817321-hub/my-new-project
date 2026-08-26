/**
 * Margin Calculator V2 Engine
 * Supports Quick & Detailed Cost Calculation, Currency Conversions,
 * Item/Transaction/Batch Cost breakdown, UNKNOWN handling, BEP, and Target Price.
 */

function parseOptionalNumber(val) {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function getNumberOrDefault(val, defaultVal = 0) {
  const parsed = parseOptionalNumber(val);
  return parsed !== null ? parsed : defaultVal;
}

/**
 * Main Margin Calculator V2 function
 * @param {Object} data
 * @returns {Object} Full Margin Calculation Result with V1 backwards compatibility
 */
function calculateMargin(data = {}) {
  const mode = data.mode || 'quick'; // 'quick' | 'detailed'
  const unknownHandling = data.unknown_handling || 'zero'; // 'zero' | 'strict'

  // 1. Raw Inputs & UNKNOWN Detection
  const rawCostPrice = parseOptionalNumber(data.cost_price !== undefined ? data.cost_price : data.unit_cost);
  const rawSellingPrice = parseOptionalNumber(data.selling_price);

  const missingFields = [];
  if (rawCostPrice === null) missingFields.push('cost_price');
  if (rawSellingPrice === null) missingFields.push('selling_price');

  const isCostUnknown = rawCostPrice === null;
  const isSellingUnknown = rawSellingPrice === null;

  // Currency & Exchange Rate
  const currency = (data.currency || 'KRW').toUpperCase();
  let exchangeRate = getNumberOrDefault(data.exchange_rate, currency === 'CNY' ? 195 : currency === 'USD' ? 1350 : 1);
  if (currency === 'KRW') exchangeRate = 1;

  // Quantity & MOQ
  const moq = Math.max(1, getNumberOrDefault(data.moq, 1));
  const quantity = Math.max(1, getNumberOrDefault(data.quantity, moq));

  // --- A. 상품당 조달 비용 (Per-Item Procurement Costs) ---
  const unitCostRaw = isCostUnknown ? 0 : rawCostPrice;
  const unitCostKrw = Math.round(unitCostRaw * exchangeRate);

  // Detailed per-item sourcing additions
  const chinaLocalCostRaw = getNumberOrDefault(data.china_local_cost, 0);
  const chinaLocalCostKrw = currency === 'CNY' ? Math.round(chinaLocalCostRaw * exchangeRate) : chinaLocalCostRaw;
  const customsTariffPerItem = getNumberOrDefault(data.tariff_tax, 0);
  const intlShippingPerItem = getNumberOrDefault(data.international_shipping, 0);

  // --- B. 일괄/일회성 조달 비용 (Batch / One-Time Procurement Costs) ---
  const batchForwardingFee = getNumberOrDefault(data.batch_forwarding_fee, getNumberOrDefault(data.forwarding_fee, 0));
  const batchIntlShipping = getNumberOrDefault(data.batch_international_shipping, 0);
  const batchCustomsFee = getNumberOrDefault(data.batch_customs_fee, 0);
  const batchExtraCost = getNumberOrDefault(data.batch_extra_cost, 0);

  const totalBatchCost = batchForwardingFee + batchIntlShipping + batchCustomsFee + batchExtraCost;
  const batchCostPerItem = quantity > 0 ? Math.round(totalBatchCost / quantity) : 0;

  // 상품당 실질 원가 (Effective Unit Cost)
  const effectiveUnitCost = isCostUnknown && unknownHandling === 'strict'
    ? null
    : unitCostKrw + chinaLocalCostKrw + customsTariffPerItem + intlShippingPerItem + batchCostPerItem;

  // 총 조달비 (Total Procurement Cost for batch)
  const totalProcurementCost = effectiveUnitCost !== null
    ? (effectiveUnitCost * quantity)
    : null;

  // --- C. 판매 1건당 비용 (Per-Sale / Transaction Costs) ---
  const sellingPrice = isSellingUnknown ? 0 : rawSellingPrice;
  const supplyShipping = getNumberOrDefault(data.supply_shipping, data.platform === '1688' ? 6000 : 3000);
  const customerShipping = getNumberOrDefault(data.customer_shipping, 3000);
  const packagingCost = getNumberOrDefault(data.packaging_cost, 500);

  const marketFeeRate = getNumberOrDefault(data.market_fee_rate, 10.8);
  const paymentFeeRate = getNumberOrDefault(data.payment_fee_rate, 0);
  const paymentFeeFixed = getNumberOrDefault(data.payment_fee, 0);
  const adCost = getNumberOrDefault(data.ad_cost, 0);
  const discountCost = getNumberOrDefault(data.discount_cost, 0);

  // Risk / Defect Costs
  const returnExchangeCost = getNumberOrDefault(data.return_exchange_cost, 0);
  const defectCost = getNumberOrDefault(data.defect_cost, 0);
  const extraCost = getNumberOrDefault(data.extra_cost, 0);

  // Rate-based fees
  const marketFeeAmount = Math.round(sellingPrice * (marketFeeRate / 100));
  const paymentFeeAmount = Math.round(sellingPrice * (paymentFeeRate / 100)) + paymentFeeFixed;

  // Grouped Costs per Sale
  const platformSellingCost = marketFeeAmount + paymentFeeAmount + adCost + discountCost;
  const fulfillmentCost = supplyShipping + packagingCost;
  const riskCost = returnExchangeCost + defectCost + extraCost;
  const shippingDifference = customerShipping - supplyShipping;

  // 총 변동비 (Total Variable Cost per sale)
  const perSaleVariableCost = (effectiveUnitCost !== null ? effectiveUnitCost : 0) +
    platformSellingCost + packagingCost + supplyShipping + riskCost;

  // --- D. 매출 및 이익 계산 (Revenue & Profit Metrics) ---
  const totalRevenue = sellingPrice + (customerShipping > 0 ? customerShipping : 0);

  let marginAmount = null;
  let marginRate = null;
  let isProfitable = false;
  let calculationStatus = 'COMPLETE';

  if (isCostUnknown || isSellingUnknown) {
    calculationStatus = 'UNKNOWN_INPUTS';
    if (unknownHandling === 'strict') {
      marginAmount = null;
      marginRate = null;
      isProfitable = false;
    } else {
      // In zero-handling or fallback, compute if partial
      marginAmount = totalRevenue - perSaleVariableCost;
      marginRate = totalRevenue > 0 ? Number(((marginAmount / totalRevenue) * 100).toFixed(1)) : 0;
      isProfitable = marginAmount > 0;
    }
  } else {
    marginAmount = totalRevenue - perSaleVariableCost;
    marginRate = totalRevenue > 0 ? Number(((marginAmount / totalRevenue) * 100).toFixed(1)) : 0;
    isProfitable = marginAmount > 0;
  }

  // --- E. 손익분기점(BEP) & 목표 마진율 판매가 계산 ---
  const targetMarginRate = getNumberOrDefault(data.target_margin_rate, 25); // default 25% target

  let breakEvenPrice = null;
  let targetSellingPrice = null;

  if (effectiveUnitCost !== null && effectiveUnitCost > 0) {
    const combinedFeeRate = (marketFeeRate + paymentFeeRate) / 100;
    const nonRateVariableCost = effectiveUnitCost + packagingCost + supplyShipping +
      riskCost + adCost + discountCost + paymentFeeFixed - customerShipping;

    // BEP Selling Price (Net Profit = 0)
    if (combinedFeeRate < 1) {
      const rawBep = nonRateVariableCost / (1 - combinedFeeRate);
      breakEvenPrice = Math.max(0, Math.ceil(rawBep / 100) * 100);
    }

    // Target Selling Price for targetMarginRate%
    const targetMarginRatio = targetMarginRate / 100;
    const targetDenominator = 1 - combinedFeeRate - targetMarginRatio;
    if (targetDenominator > 0) {
      const rawTarget = (nonRateVariableCost + (customerShipping * targetMarginRatio)) / targetDenominator;
      targetSellingPrice = Math.max(0, Math.ceil(rawTarget / 100) * 100);
    }
  }

  // Return Object with V1 Compatibility + V2 Detailed Structure
  return {
    // --- V1 Backward Compatibility Keys ---
    cost_price: unitCostKrw,
    selling_price: sellingPrice,
    supply_shipping: supplyShipping,
    customer_shipping: customerShipping,
    market_fee_rate: marketFeeRate,
    market_fee_amount: marketFeeAmount,
    packaging_cost: packagingCost,
    shipping_difference: shippingDifference,
    margin_amount: marginAmount,
    margin_rate: marginRate,
    is_profitable: isProfitable,

    // --- V2 Metadata & Status ---
    version: 'V2',
    mode,
    unknown_handling: unknownHandling,
    calculation_status: calculationStatus,
    missing_fields: missingFields,
    is_cost_unknown: isCostUnknown,
    is_selling_unknown: isSellingUnknown,

    // --- V2 Input Config ---
    currency,
    exchange_rate: exchangeRate,
    unit_cost_raw: rawCostPrice,
    moq,
    quantity,
    target_margin_rate: targetMarginRate,

    // --- V2 Category 1: 조달 원가 (Procurement Breakdown) ---
    procurement: {
      unit_cost_raw: rawCostPrice,
      currency,
      exchange_rate: exchangeRate,
      unit_cost_krw: unitCostKrw,
      china_local_cost_krw: chinaLocalCostKrw,
      customs_tariff_per_item: customsTariffPerItem,
      intl_shipping_per_item: intlShippingPerItem,
      batch_cost_per_item: batchCostPerItem,
      total_batch_cost: totalBatchCost,
      effective_unit_cost: effectiveUnitCost,
      total_procurement_cost: totalProcurementCost
    },

    // --- V2 Category 2: 판매건당 변동비 (Per-Sale Costs) ---
    per_sale_costs: {
      platform_fee_amount: marketFeeAmount,
      payment_fee_amount: paymentFeeAmount,
      ad_cost: adCost,
      discount_cost: discountCost,
      platform_selling_cost: platformSellingCost,
      supply_shipping: supplyShipping,
      customer_shipping: customerShipping,
      packaging_cost: packagingCost,
      fulfillment_cost: fulfillmentCost,
      return_exchange_cost: returnExchangeCost,
      defect_cost: defectCost,
      extra_cost: extraCost,
      risk_cost: riskCost,
      total_variable_cost: perSaleVariableCost
    },

    // --- V2 Category 3: 핵심 결과 지표 (Key Results) ---
    results: {
      total_revenue: totalRevenue,
      total_procurement_cost: totalProcurementCost,
      effective_unit_cost: effectiveUnitCost,
      platform_selling_cost: platformSellingCost,
      total_variable_cost: perSaleVariableCost,
      net_profit: marginAmount,
      margin_rate: marginRate,
      break_even_price: breakEvenPrice,
      target_selling_price: targetSellingPrice
    }
  };
}

module.exports = { calculateMargin, parseOptionalNumber, getNumberOrDefault };
