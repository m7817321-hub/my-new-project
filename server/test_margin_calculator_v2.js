const assert = require('assert');
const { calculateMargin } = require('./services/marginCalculator');

console.log('--- Running Margin Calculator V2 Test Suite ---');

// Test 1: V1 Backwards Compatibility
{
  const v1Input = {
    cost_price: 6800,
    selling_price: 19800,
    supply_shipping: 3000,
    customer_shipping: 3000,
    market_fee_rate: 10.8,
    packaging_cost: 500
  };
  const res = calculateMargin(v1Input);
  assert.strictEqual(res.version, 'V2');
  assert.strictEqual(res.cost_price, 6800);
  assert.strictEqual(res.selling_price, 19800);
  assert.strictEqual(res.market_fee_amount, Math.round(19800 * 0.108)); // 2138
  assert.strictEqual(res.packaging_cost, 500);
  assert.strictEqual(res.supply_shipping, 3000);
  assert.strictEqual(res.customer_shipping, 3000);
  // Net profit = 19800 - 6800 - 2138 - 500 + 0 = 10362
  assert.strictEqual(res.margin_amount, 10362);
  // Rate = (10362 / (19800 + 3000)) * 100 = 45.4%
  assert.strictEqual(res.margin_rate, 45.4);
  assert.strictEqual(res.is_profitable, true);
  console.log('✓ Test 1: V1 backwards compatibility passed');
}

// Test 2: Quick Calculation with Ad Cost
{
  const quickInput = {
    cost_price: 10000,
    selling_price: 30000,
    supply_shipping: 3000,
    customer_shipping: 3000,
    packaging_cost: 1000,
    market_fee_rate: 10,
    ad_cost: 3000
  };
  const res = calculateMargin(quickInput);
  // platform fee = 30000 * 0.1 = 3000
  // platform selling cost = 3000 (fee) + 3000 (ad) = 6000
  // per sale variable cost = 10000 (cost) + 6000 (platform) + 1000 (pack) + 3000 (ship) = 20000
  // total revenue = 30000 + 3000 = 33000
  // net profit = 33000 - 20000 = 13000
  // margin rate = (13000 / 33000) * 100 = 39.4%
  assert.strictEqual(res.results.platform_selling_cost, 6000);
  assert.strictEqual(res.results.total_variable_cost, 20000);
  assert.strictEqual(res.results.net_profit, 13000);
  assert.strictEqual(res.results.margin_rate, 39.4);
  console.log('✓ Test 2: Quick calculation with ad cost passed');
}

// Test 3: Detailed Sourcing Calculation (1688 CNY, MOQ, Batch Costs, Tariff, Risks)
{
  const detailedInput = {
    mode: 'detailed',
    currency: 'CNY',
    exchange_rate: 200,
    unit_cost: 20, // 20 CNY * 200 = 4,000 KRW
    china_local_cost: 2, // 2 CNY * 200 = 400 KRW
    tariff_tax: 800, // 800 KRW
    international_shipping: 1200, // 1200 KRW
    moq: 100,
    quantity: 100,
    batch_forwarding_fee: 50000, // 50,000 / 100 = 500 KRW / item
    batch_customs_fee: 30000, // 30,000 / 100 = 300 KRW / item
    selling_price: 25000,
    customer_shipping: 3000,
    supply_shipping: 3000,
    packaging_cost: 500,
    market_fee_rate: 10.8,
    payment_fee_rate: 3.2,
    ad_cost: 2000,
    discount_cost: 1000,
    return_exchange_cost: 500,
    defect_cost: 300,
    extra_cost: 200,
    target_margin_rate: 25
  };
  const res = calculateMargin(detailedInput);

  // Effective Unit Cost:
  // unit(4000) + china(400) + tariff(800) + intl(1200) + batch((50000+30000)/100=800) = 7,200 KRW
  assert.strictEqual(res.procurement.unit_cost_krw, 4000);
  assert.strictEqual(res.procurement.china_local_cost_krw, 400);
  assert.strictEqual(res.procurement.batch_cost_per_item, 800);
  assert.strictEqual(res.procurement.effective_unit_cost, 7200);
  assert.strictEqual(res.procurement.total_procurement_cost, 720000);

  // Platform Selling Cost:
  // market_fee = 25000 * 0.108 = 2700
  // payment_fee = 25000 * 0.032 = 800
  // ad = 2000, discount = 1000
  // total platform = 2700 + 800 + 2000 + 1000 = 6500
  assert.strictEqual(res.per_sale_costs.platform_selling_cost, 6500);

  // Fulfillment: supply_shipping(3000) + packaging(500) = 3500
  // Risk: return(500) + defect(300) + extra(200) = 1000
  // Total variable cost = 7200 + 6500 + 3500 + 1000 = 18200
  assert.strictEqual(res.results.total_variable_cost, 18200);

  // Total revenue = 25000 + 3000 = 28000
  // Net profit = 28000 - 18200 = 9800
  // Margin rate = (9800 / 28000) * 100 = 35.0%
  assert.strictEqual(res.results.net_profit, 9800);
  assert.strictEqual(res.results.margin_rate, 35.0);

  // BEP & Target Price check
  assert.ok(res.results.break_even_price > 0);
  assert.ok(res.results.break_even_price < 25000);
  assert.ok(res.results.target_selling_price > 0);
  console.log('✓ Test 3: Detailed sourcing calculation passed (Effective Cost:', res.procurement.effective_unit_cost, 'Net Profit:', res.results.net_profit, 'BEP:', res.results.break_even_price, 'TargetPrice:', res.results.target_selling_price, ')');
}

// Test 4: UNKNOWN handling vs 0-won distinction
{
  // Strict mode with missing cost
  const resStrict = calculateMargin({
    cost_price: null,
    selling_price: 20000,
    unknown_handling: 'strict'
  });
  assert.strictEqual(resStrict.calculation_status, 'UNKNOWN_INPUTS');
  assert.strictEqual(resStrict.is_cost_unknown, true);
  assert.strictEqual(resStrict.is_selling_unknown, false);
  assert.strictEqual(resStrict.margin_amount, null);
  assert.strictEqual(resStrict.margin_rate, null);
  assert.deepStrictEqual(resStrict.missing_fields, ['cost_price']);

  // Explicit 0-won cost (e.g. Free gift or promotion)
  const resZeroCost = calculateMargin({
    cost_price: 0,
    selling_price: 20000,
    unknown_handling: 'strict'
  });
  assert.strictEqual(resZeroCost.calculation_status, 'COMPLETE');
  assert.strictEqual(resZeroCost.is_cost_unknown, false);
  assert.strictEqual(resZeroCost.procurement.effective_unit_cost, 0);
  assert.ok(resZeroCost.margin_amount > 0);

  console.log('✓ Test 4: UNKNOWN vs 0-won distinction passed');
}

// Test 5: Dynamic Exchange Rate & Quantity scaling
{
  const customExchange = calculateMargin({
    currency: 'USD',
    exchange_rate: 1400,
    unit_cost: 10, // $10 * 1400 = 14,000 KRW
    quantity: 50,
    batch_forwarding_fee: 100000, // 100,000 / 50 = 2,000 KRW
    selling_price: 35000
  });
  assert.strictEqual(customExchange.procurement.unit_cost_krw, 14000);
  assert.strictEqual(customExchange.procurement.batch_cost_per_item, 2000);
  assert.strictEqual(customExchange.procurement.effective_unit_cost, 16000);
  console.log('✓ Test 5: Custom exchange rate and quantity scaling passed');
}

console.log('All Margin Calculator V2 tests passed successfully!');
