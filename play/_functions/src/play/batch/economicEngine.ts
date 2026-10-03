export function getEconomicPhase(period: number): string {
  // period is 0 to 359
  const year = Math.floor(period / 12) + 1; // 1 to 30
  
  if (year >= 1 && year <= 5) return 'Recovery';
  if (year >= 6 && year <= 10) return 'Boom';
  if (year >= 11 && year <= 15) return 'Tightening';
  if (year >= 16 && year <= 20) return 'Recession';
  if (year >= 21 && year <= 25) return 'Recovery';
  if (year >= 26 && year <= 30) return 'Growth';
  
  return 'Unknown';
}

export function getAnnualInflation(phase: string): number {
  switch (phase) {
    case 'Recovery': return 0.020;
    case 'Boom': return 0.035;
    case 'Tightening': return 0.025;
    case 'Recession': return 0.010;
    case 'Growth': return 0.025;
    default: return 0.020;
  }
}

export interface EconomicState {
  monthly_inflation: number;
  monthly_income: number;
  monthly_living_expense: number;
  cumulative_inflation_factor: number;
  annual_income_growth: number;
  annual_income: number;
}

export const STARTING_ANNUAL_INCOME = 50_000_000;
export const BASE_MONTHLY_LIVING_EXPENSE = 3_000_000;

export function normalizeAnnualRate(value: unknown, fallback: number | null = null): number | null {
  if (value === null || value === undefined || value === '') return fallback;
  const parsedValue = typeof value === 'string' && value.trim().endsWith('%')
    ? Number.parseFloat(value)
    : Number(value);
  if (!Number.isFinite(parsedValue)) return fallback;
  return Math.abs(parsedValue) > 1 || (typeof value === 'string' && value.trim().endsWith('%'))
    ? parsedValue / 100
    : parsedValue;
}

export function getAnnualIncomeForPeriod(target_period: number): number {
  let annualIncome = STARTING_ANNUAL_INCOME;
  const completedYears = Math.floor(Math.max(0, target_period) / 12);

  for (let year = 0; year < completedYears; year++) {
    const phase = getEconomicPhase(year * 12);
    annualIncome = Math.round(annualIncome * (1 + getAnnualInflation(phase) - 0.005));
  }

  return annualIncome;
}

export function applyAnnualIncomeGrowth(annualIncome: number, annualGrowthRate: unknown): number {
  const normalizedRate = normalizeAnnualRate(annualGrowthRate, 0) || 0;
  return Math.round(annualIncome * (1 + normalizedRate));
}

export function calculateMonthlyLoanPayment(principal: number, annualInterestRate: number, remainingMonths: number): number {
  if (!(principal > 0) || !(remainingMonths > 0)) return 0;
  const monthlyRate = Math.max(0, annualInterestRate) / 12;
  if (monthlyRate === 0) return principal / remainingMonths;
  return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -remainingMonths));
}

export function calculateEconomicStateWithSeasonInflation(
  target_period: number,
  annualIncome: number,
  seasonAnnualInflation: unknown,
  previousCumulativeInflationFactor = 1,
  applyPeriodInflation = true
): EconomicState {
  const annualInflation = normalizeAnnualRate(seasonAnnualInflation, 0) ?? 0;
  const monthly_inflation = Math.pow(1 + annualInflation, 1 / 12) - 1;
  const annual_income_growth = annualInflation - 0.005;
  let cumulative_inflation_factor = Number.isFinite(previousCumulativeInflationFactor) && previousCumulativeInflationFactor > 0
    ? previousCumulativeInflationFactor
    : 1;

  if (target_period > 0 && applyPeriodInflation) {
    cumulative_inflation_factor *= 1 + monthly_inflation;
  }

  return {
    monthly_inflation,
    monthly_income: Math.round(annualIncome / 12),
    monthly_living_expense: Math.round(BASE_MONTHLY_LIVING_EXPENSE * cumulative_inflation_factor),
    cumulative_inflation_factor,
    annual_income_growth,
    annual_income: annualIncome
  };
}

export function calculateEconomicState(target_period: number, annualIncome = getAnnualIncomeForPeriod(target_period)): EconomicState {
  const base_monthly_expense = 3_000_000;

  let cumulative_inflation_factor = 1.0;

  // We must calculate up to the target_period exactly.
  // Period 0 is the first month.
  let current_monthly_inflation = 0;
  let current_annual_income_growth = 0;

  for (let p = 0; p <= target_period; p++) {
    const phase = getEconomicPhase(p);
    const annual_inflation = getAnnualInflation(phase);
    
    // Monthly inflation: (1 + annual_inflation)^(1/12) - 1
    const monthly_inflation = Math.pow(1 + annual_inflation, 1/12) - 1;
    
    // Income growth: annual_inflation - 0.005
    const annual_income_growth = annual_inflation - 0.005;

    // Apply inflation starting from period 1, so period 0 is base value.
    if (p > 0) {
      cumulative_inflation_factor *= (1 + monthly_inflation);
    }

    if (p === target_period) {
      current_monthly_inflation = monthly_inflation;
      current_annual_income_growth = annual_income_growth;
    }
  }

  // Calculate current values (rounded to integer to avoid floating point issues accumulating in cash)
  const monthly_income = Math.round(annualIncome / 12);
  const monthly_living_expense = Math.round(base_monthly_expense * cumulative_inflation_factor);

  return {
    monthly_inflation: current_monthly_inflation,
    monthly_income,
    monthly_living_expense,
    cumulative_inflation_factor,
    annual_income_growth: current_annual_income_growth,
    annual_income: annualIncome
  };
}
