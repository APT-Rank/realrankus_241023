export const LIVE_SIMULATION_PERIOD_SECONDS = 6 * 60 * 60;
export const SIMULATION_PERIODS_PER_SEASON = 360;

export function getSeasonStartTimestamp(season: any): unknown {
  return season?.simulation_started_at
    || season?.started_at
    || season?.activated_at
    || season?.created_at;
}

function getTimestampMilliseconds(value: any): number | null {
  if (value == null) return null;
  if (typeof value.toMillis === 'function') {
    const milliseconds = value.toMillis();
    return Number.isFinite(milliseconds) ? milliseconds : null;
  }
  if (typeof value.toDate === 'function') {
    const milliseconds = value.toDate()?.getTime();
    return Number.isFinite(milliseconds) ? milliseconds : null;
  }
  if (Number.isFinite(value.seconds)) return value.seconds * 1000 + (value.nanoseconds || 0) / 1e6;
  if (Number.isFinite(value._seconds)) return value._seconds * 1000 + (value._nanoseconds || 0) / 1e6;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

export function getElapsedSimulationPeriods(startTimestamp: unknown, nowMilliseconds = Date.now()): number {
  const startMilliseconds = getTimestampMilliseconds(startTimestamp);
  if (startMilliseconds === null || !Number.isFinite(nowMilliseconds) || nowMilliseconds <= startMilliseconds) return 0;

  const periodMilliseconds = LIVE_SIMULATION_PERIOD_SECONDS * 1000;
  return Math.min(
    SIMULATION_PERIODS_PER_SEASON,
    Math.floor((nowMilliseconds - startMilliseconds) / periodMilliseconds)
  );
}

export function getNextPeriodDelaySeconds(testModeSpeed?: number): number {
  if (testModeSpeed == null || !Number.isFinite(testModeSpeed) || testModeSpeed <= 0) {
    return LIVE_SIMULATION_PERIOD_SECONDS;
  }

  return Math.max(1, Math.floor(10 / testModeSpeed));
}
