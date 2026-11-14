import type { BaselineKey, Baseline } from './types';

const BASELINES: Record<string, Baseline> = {
  'weekday-16-강남':     { mean: 65, std: 12, learning: false },
  'weekday-17-강남':     { mean: 72, std: 15, learning: false },
  'weekday-16-신촌':     { mean: 58, std: 10, learning: false },
  'weekday-17-홍대입구': { mean: 61, std: 11, learning: false },
  'weekday-33-여의도':   { mean: 55, std: 13, learning: false },
  'weekday-34-여의도':   { mean: 60, std: 14, learning: false },
  'weekday-16-광화문':   { mean: 50, std: 10, learning: false },
  'weekday-default':     { mean: 55, std: 15, learning: true },
  'weekend-default':     { mean: 42, std: 12, learning: true },
  'holiday-default':     { mean: 35, std: 10, learning: true },
  'afterHoliday-default':{ mean: 68, std: 18, learning: true },
};

export function lookupBaseline(key: BaselineKey): Baseline {
  const exact = BASELINES[`${key.dayType}-${key.slot}-${key.area}`];
  if (exact) return exact;
  for (const delta of [-1, 1, -2, 2]) {
    const adj = BASELINES[`${key.dayType}-${key.slot + delta}-${key.area}`];
    if (adj) return { ...adj, learning: true };
  }
  return BASELINES[`${key.dayType}-default`] ?? { mean: 50, std: 15, learning: true };
}
