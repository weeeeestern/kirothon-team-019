import type { Anomaly, Baseline, Route } from './types';
import { lookupBaseline } from './baseline';
import { getDayType, timeToMinutes } from './utils';

export function timeOverlap(start: string, end: string, departure: string, win = 30): number {
  const a = timeToMinutes(start), rawEnd = timeToMinutes(end), d = timeToMinutes(departure);
  if (![a, rawEnd, d].every(Number.isFinite) || a === rawEnd) return 0;
  const b = rawEnd < a ? rawEnd + 1440 : rawEnd;
  let overlap = 0;
  for (const shift of [-1440, 0, 1440]) {
    overlap = Math.max(overlap, Math.max(0, Math.min(b, d + shift + win) - Math.max(a, d + shift - win)));
  }
  return Math.min(1, overlap / (b - a));
}
export function routeOverlap(area: string, stops: string[]): number {
  const normalize = (s: string) => s.trim().replace(/역$/, '');
  if (!area?.trim() || !Array.isArray(stops) || !stops.length) return 0;
  const matches = stops.filter(s => typeof s === 'string' && normalize(s) === normalize(area)).length;
  return Math.min(1, matches / stops.length * 3);
}
export interface ImpactResult { impact: number; z: number; routeOverlap: number; timeOverlap: number; baseline: Baseline }
export function computeImpact(anomaly: Anomaly, route: Route, date: Date): ImpactResult {
  const slot = Math.floor(timeToMinutes(anomaly.startsAt) / 30);
  const baseline = lookupBaseline({ dayType: getDayType(date), slot, area: anomaly.area });
  const z = Number.isFinite(anomaly.value) && baseline.std > 0 ? Math.max(0, (anomaly.value - baseline.mean) / baseline.std) : 0;
  const ro = routeOverlap(anomaly.area, route.stops);
  const to = timeOverlap(anomaly.startsAt, anomaly.endsAt, route.departAt);
  return { impact: z * ro * to, z, routeOverlap: ro, timeOverlap: to, baseline };
}
