export const DEFAULT_THRESHOLD = 1.5;
const MIN_T = 0.5, MAX_T = 3.0, DELTA = 0.1;

export function updateThreshold(current: number, feedback: 'helpful' | 'notNeeded'): number {
  const next = feedback === 'helpful' ? current - DELTA : current + DELTA;
  return parseFloat(Math.min(MAX_T, Math.max(MIN_T, next)).toFixed(2));
}
