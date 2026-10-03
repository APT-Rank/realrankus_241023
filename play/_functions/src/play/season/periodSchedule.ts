export const LIVE_SIMULATION_PERIOD_SECONDS = 6 * 60 * 60;

export function getNextPeriodDelaySeconds(testModeSpeed?: number): number {
  if (testModeSpeed == null || !Number.isFinite(testModeSpeed) || testModeSpeed <= 0) {
    return LIVE_SIMULATION_PERIOD_SECONDS;
  }

  return Math.max(1, Math.floor(10 / testModeSpeed));
}
