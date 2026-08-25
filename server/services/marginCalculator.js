function calculateMargin(data) {
  const costPrice = Number(data.cost_price) || 0;
  const sellingPrice = Number(data.selling_price) || 0;
  const supplyShipping = Number(data.supply_shipping) || 0;
  const customerShipping = Number(data.customer_shipping) || 0;
  const marketFeeRate = Number(data.market_fee_rate) !== undefined ? Number(data.market_fee_rate) : 10.8;
  const packagingCost = Number(data.packaging_cost) || 0;

  // 마켓 결제 수수료
  const marketFeeAmount = Math.round(sellingPrice * (marketFeeRate / 100));

  // 배송 손익 (고객 결제 배송비 - 공급처 배송비)
  const shippingDifference = customerShipping - supplyShipping;

  // 최종 예상 마진액
  const marginAmount = sellingPrice - costPrice - marketFeeAmount - packagingCost + shippingDifference;

  // 최종 예상 마진율 (% 기준: 총 판매금액 기준)
  const totalRevenue = sellingPrice + (customerShipping > 0 ? customerShipping : 0);
  const marginRate = totalRevenue > 0 
    ? Number(((marginAmount / totalRevenue) * 100).toFixed(1)) 
    : 0;

  return {
    cost_price: costPrice,
    selling_price: sellingPrice,
    supply_shipping: supplyShipping,
    customer_shipping: customerShipping,
    market_fee_rate: marketFeeRate,
    market_fee_amount: marketFeeAmount,
    packaging_cost: packagingCost,
    shipping_difference: shippingDifference,
    margin_amount: marginAmount,
    margin_rate: marginRate,
    is_profitable: marginAmount > 0
  };
}

module.exports = { calculateMargin };
