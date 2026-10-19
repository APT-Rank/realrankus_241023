export interface SupplyResolutionOptions {
  supplyPolicy: 'FIXED_ONE' | 'HOUSEHOLD_BASED';
  householdCount: number;
  primarySupplyRatio: number;
}

export function resolveSeasonSupply(options: SupplyResolutionOptions): number {
  if (options.supplyPolicy === 'FIXED_ONE') {
    return 1;
  }
  if (options.supplyPolicy === 'HOUSEHOLD_BASED') {
    return Math.max(1, Math.floor(options.householdCount * options.primarySupplyRatio));
  }
  throw new Error('FAIL CLOSED'); // Unknown policy
}
