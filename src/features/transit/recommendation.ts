import type { Place, TransitJourney } from './types';
import type { CitizenReport } from '../reports/reportStore';
import { isConfirmed } from '../reports/reportStore';
import { dayKey, timeToMinutes } from '@/engine/utils';
import { situationLabel } from '@/engine/classify';

/** Dated events, not synthetic z-scores or historical train occupancy. */
export interface RoutingSignal {
  id: string;
  area: string;
  label: string;
  startsAt: number;
  endsAt: number;
  source: 'report' | 'synthetic';
}
export interface JourneyAssessment {
  journey: TransitJourney;
  matches: RoutingSignal[];
  stopsComplete: boolean;
  extraMinutes: number;
}
export const normalizeRoutingStop = (name: string) => name.trim().replace(/\s+/g, '').replace(/역$/, '');

export function reportRoutingSignals(reports: CitizenReport[], now: Date): RoutingSignal[] {
  const today = dayKey(now);
  const midnight = Date.parse(`${today}T00:00:00+09:00`);
  return reports.flatMap(report => {
    const createdAt = Date.parse(report.createdAt);
    const minute = timeToMinutes(report.time);
    if (!Number.isFinite(createdAt) || createdAt > now.getTime() || !Number.isFinite(minute) || !isConfirmed(report) || dayKey(new Date(createdAt)) !== today || !report.place.trim()) return [];
    const startsAt = midnight + minute * 60000;
    // Reports expire at Seoul midnight, matching the existing report lifecycle.
    const endsAt = Math.min(startsAt + 3600000, midnight + 86400000);
    if (endsAt <= now.getTime()) return [];
    return [{ id: report.id, area: report.place, label: situationLabel(report.situation), startsAt, endsAt, source: 'report' as const }];
  });
}

export function assessJourneys(journeys: TransitJourney[], signals: RoutingSignal[], departure: number, origin?: Place, destination?: Place): JourneyAssessment[] {
  const fastest = Math.min(...journeys.map(journey => journey.totalTime));
  const unique = [...new Map(signals.filter(s => s.area.trim() && Number.isFinite(s.startsAt) && Number.isFinite(s.endsAt) && s.endsAt > s.startsAt).map(s => [`${s.source}:${s.id}`, s])).values()];
  return journeys.map(journey => {
    const windows: { names: string[]; start: number; end: number }[] = [];
    let elapsed = 0;
    for (const segment of journey.segments) {
      // ODsay only supplies segment durations. Conservatively match the whole
      // segment, with five minutes of uncertainty, rather than inventing station ETAs.
      windows.push({ names: [...(segment.stations ?? []), segment.from ?? '', segment.to ?? ''], start: departure + (elapsed - 5) * 60000, end: departure + (elapsed + segment.time + 5) * 60000 });
      elapsed += segment.time;
    }
    windows.push({ names: [origin?.name ?? ''], start: departure - 300000, end: departure + 300000 });
    windows.push({ names: [destination?.name ?? ''], start: departure + (journey.totalTime - 5) * 60000, end: departure + (journey.totalTime + 5) * 60000 });
    const matches = Number.isFinite(departure) ? unique.filter(signal => windows.some(w => w.start < signal.endsAt && w.end > signal.startsAt && w.names.some(name => name && normalizeRoutingStop(name) === normalizeRoutingStop(signal.area)))) : [];
    const transit = journey.segments.filter(s => s.type !== 'walk');
    return { journey, matches, stopsComplete: transit.length > 0 && transit.every(s => s.stopsComplete === true && (s.stations?.length ?? 0) >= 2), extraMinutes: journey.totalTime - fastest };
  });
}

/** Prefer fewer known overlapping events; never mistake missing stops for safety. */
export function recommendJourney(assessments: JourneyAssessment[], maxExtraMinutes: number): JourneyAssessment | undefined {
  const baseline = assessments[0];
  if (!baseline?.matches.length || !Number.isFinite(maxExtraMinutes) || maxExtraMinutes < 0) return undefined;
  return assessments.filter(a => a.stopsComplete && a.extraMinutes <= maxExtraMinutes && a.matches.length < baseline.matches.length)
    .sort((a, b) => a.matches.length - b.matches.length || a.journey.totalTime - b.journey.totalTime || a.journey.transferCount - b.journey.transferCount)[0];
}
