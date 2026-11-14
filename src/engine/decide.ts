import type { Anomaly, Notice, Route } from './types';
import { computeImpact } from './impact';
import { buildNotice } from './notice';

export function decide(anomaly: Anomaly, route: Route, threshold: number, date: Date): Notice | null {
  const { impact, z, baseline } = computeImpact(anomaly, route, date);
  return impact >= threshold ? buildNotice(anomaly, route, impact, z, baseline) : null;
}
