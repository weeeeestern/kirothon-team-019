import type { Anomaly, Route, Situation, EngineState, EngineResult } from './types';
import { getDayType, dayKey } from './utils';
import { decide } from './decide';
import { computeOrdinariness } from './ordinariness';

export function runDay(routes: Route[], anomalies: Anomaly[], state: EngineState, date: Date): EngineResult {
  const seen = new Set<string>();
  const notices = routes.filter(r => r && r.days?.includes(getDayType(date))).flatMap(route =>
    anomalies.filter(a => a && ['construction', 'rain', 'dust', 'marathon', 'strike', 'congestion'].includes(a.situation)).map(a => decide(a, route, state.threshold, date)).filter((n): n is NonNullable<typeof n> => n !== null)
  ).map(n => ({ ...n, id: `${dayKey(date)}:${n.id}` })).filter(n => {
    if (seen.has(n.id)) return false;
    seen.add(n.id); return true;
  });
  const ordinariness = computeOrdinariness(notices);
  const situation: Situation = notices.length === 0
    ? 'ordinary'
    : [...notices].sort((a, b) => b.impact - a.impact)[0].situation;
  return { notices, ordinariness, situation };
}

export { updateThreshold, DEFAULT_THRESHOLD } from './threshold';
export type { Route, Anomaly, Notice, EngineState, EngineResult, Situation } from './types';
