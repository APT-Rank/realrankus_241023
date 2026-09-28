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
}

export function calculateEconomicState(target_period: number): EconomicState {
  const base_annual_income = 50_000_000;
  const base_monthly_expense = 3_000_000;

  let cumulative_inflation_factor = 1.0;
  let cumulative_income_factor = 1.0;

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
    const monthly_income_growth = Math.pow(1 + annual_income_growth, 1/12) - 1;

    // Apply inflation starting from period 1, so period 0 is base value.
    if (p > 0) {
      cumulative_inflation_factor *= (1 + monthly_inflation);
      cumulative_income_factor *= (1 + monthly_income_growth);
    }

    if (p === target_period) {
      current_monthly_inflation = monthly_inflation;
      current_annual_income_growth = annual_income_growth;
    }
  }

  // Calculate current values (rounded to integer to avoid floating point issues accumulating in cash)
  const monthly_income = Math.round((base_annual_income * cumulative_income_factor) / 12);
  const monthly_living_expense = Math.round(base_monthly_expense * cumulative_inflation_factor);

  return {
    monthly_inflation: current_monthly_inflation,
    monthly_income,
    monthly_living_expense,
    cumulative_inflation_factor,
    annual_income_growth: current_annual_income_growth
  };
}
