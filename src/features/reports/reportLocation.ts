import type { Route } from '@/engine/types';
import type { Coordinate, Place } from '@/features/transit/types';
import { normalizeStop, validCoordinate } from '@/features/routes/route';

// A saved endpoint is exact. A journey's path is not indexed by station name.
export function savedReportLocation(place: string, route?: Route): Coordinate | undefined {
  const endpoint = [route?.origin, route?.destination].find(p => p && normalizeStop(p.name) === normalizeStop(place) && validCoordinate(p));
  return endpoint ? { lat: endpoint.lat, lng: endpoint.lng } : undefined;
}

export function matchReportLocation(place: string, candidates: Place[]): Coordinate | undefined {
  const name = normalizeStop(place);
  const matches = candidates.filter(p => normalizeStop(p.name.replace(/\s+\S*선$/, '')) === name && validCoordinate(p));
  const first = matches[0];
  // Multiple subway lines can name the same station. Distant namesakes are ambiguous.
  if (!first || matches.some(p => Math.hypot(p.lat - first.lat, (p.lng - first.lng) * .8) > .003)) return undefined;
  return { lat: first.lat, lng: first.lng };
}
