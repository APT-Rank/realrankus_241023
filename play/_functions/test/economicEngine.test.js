const assert = require('node:assert/strict');
const test = require('node:test');
const {
  applyAnnualIncomeGrowth,
  calculateEconomicState,
  calculateEconomicStateWithSeasonInflation,
  calculateMonthlyLoanPayment,
  getAnnualIncomeForPeriod
} = require('../lib/play/batch/economicEngine');
const { getNextPeriodDelaySeconds, LIVE_SIMULATION_PERIOD_SECONDS } = require('../lib/play/season/periodSchedule');

test('annual salary remains fixed for twelve periods and grows at the year boundary', () => {
  assert.equal(getAnnualIncomeForPeriod(0), 50_000_000);
  assert.equal(getAnnualIncomeForPeriod(11), 50_000_000);
  assert.equal(getAnnualIncomeForPeriod(12), 50_750_000);
  assert.equal(applyAnnualIncomeGrowth(50_000_000, 0.03), 51_500_000);
  assert.equal(calculateEconomicState(12, 51_500_000).monthly_income, Math.round(51_500_000 / 12));
});

test('monthly living expense follows the existing inflation curve', () => {
  assert.equal(calculateEconomicState(0).monthly_living_expense, 3_000_000);
  assert.ok(calculateEconomicState(12).monthly_living_expense > 3_000_000);
});

test('season inflation drives annual salary growth and forward monthly expenses', () => {
  const yearOne = calculateEconomicStateWithSeasonInflation(12, 50_000_000, 0.02, 1.02);
  assert.equal(yearOne.annual_income_growth, 0.015);
  assert.equal(applyAnnualIncomeGrowth(50_000_000, yearOne.annual_income_growth), 50_750_000);

  const changedInflation = calculateEconomicStateWithSeasonInflation(13, 50_750_000, 0.035, yearOne.cumulative_inflation_factor);
  const expectedFactor = yearOne.cumulative_inflation_factor * Math.pow(1.035, 1 / 12);
  assert.ok(Math.abs(changedInflation.annual_income_growth - 0.03) < 1e-12);
  assert.ok(Math.abs(changedInflation.cumulative_inflation_factor - expectedFactor) < 1e-12);
  assert.equal(changedInflation.monthly_living_expense, Math.round(3_000_000 * expectedFactor));
  assert.equal(changedInflation.monthly_income, Math.round(50_750_000 / 12));
});

test('monthly loan repayment is zero without principal and responds to rate changes', () => {
  assert.equal(calculateMonthlyLoanPayment(0, 0.05, 240), 0);
  const lowerRatePayment = calculateMonthlyLoanPayment(100_000_000, 0.04, 240);
  const higherRatePayment = calculateMonthlyLoanPayment(100_000_000, 0.06, 240);
  assert.ok(higherRatePayment > lowerRatePayment);
});

test('live seasons advance every six hours while test speeds remain accelerated', () => {
  assert.equal(LIVE_SIMULATION_PERIOD_SECONDS, 21_600);
  assert.equal(getNextPeriodDelaySeconds(), 21_600);
  assert.equal(getNextPeriodDelaySeconds(1), 10);
  assert.equal(getNextPeriodDelaySeconds(5), 2);
});
