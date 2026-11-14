import { describe, it, expect } from 'vitest';
import { assessJourneys, recommendJourney, reportRoutingSignals, type RoutingSignal } from './recommendation';
import type { TransitJourney } from './types';
import type { CitizenReport } from '../reports/reportStore';
const at = (time: string) => Date.parse(`2026-11-14T${time}:00+09:00`);
const route = (id: string, stops: string[], time = 20, complete = true): TransitJourney => ({ id, provider: 'ODsay', totalTime: time, totalWalk: 0, transferCount: 0, payment: 1550, stations: stops, path: [], segments: [{ type: 'subway', label: '2호선', time, stations: stops, stopsComplete: complete }] });
const signal: RoutingSignal = { id: 'event', area: '역삼역', label: '혼잡', startsAt: at('08:00'), endsAt: at('09:00'), source: 'report' };
const report: CitizenReport = { id: 'report', routeId: 'saved', author: 'author', situation: 'congestion', place: '역삼', time: '08:00', note: '', createdAt: '2026-11-14T07:50:00+09:00', confirmations: ['a', 'b'], helpfulUsers: [] };
describe('route anomaly comparison', () => {
  it('recommends a bounded detour and preserves provider candidates', () => {
    const routes = [route('direct', ['강남', '역삼', '선릉']), route('detour', ['강남', '삼성', '선릉'], 28)];
    const assessments = assessJourneys(routes, [signal], at('08:00'));
    expect(assessments[0].matches).toEqual([signal]);
    expect(recommendJourney(assessments, 15)?.journey.id).toBe('detour');
    expect(recommendJourney(assessments, 0)).toBeUndefined();
    expect(routes.map(r => r.id)).toEqual(['direct', 'detour']);
  });
  it('does not suggest missing-stop routes as clear or claim a detour when all are affected', () => {
    const assessments = assessJourneys([route('direct', ['강남', '역삼', '선릉']), route('unknown', ['강남', '선릉'], 21, false), route('same', ['역삼', '선릉'], 25)], [signal], at('08:00'));
    expect(recommendJourney(assessments, 15)).toBeUndefined();
  });
  it('matches exact station names and segment arrival windows, not the whole journey departure', () => {
    const late = route('late', ['역삼', '선릉']);
    late.segments.unshift({ type: 'walk', label: '도보', time: 60 }); late.totalTime += 60;
    expect(assessJourneys([late], [{ ...signal, endsAt: at('08:30') }], at('08:00'))[0].matches).toHaveLength(0);
    expect(assessJourneys([route('different', ['역삼동', '선릉'])], [signal], at('08:00'))[0].matches).toHaveLength(0);
    expect(assessJourneys([route('normal', ['역삼', '선릉'])], [signal], at('10:00'))[0].matches).toHaveLength(0);
  });
  it('uses absolute time across midnight without recurring yesterday events', () => {
    const event = { ...signal, startsAt: at('23:55'), endsAt: Date.parse('2026-11-15T00:15:00+09:00') };
    expect(assessJourneys([route('night', ['역삼', '선릉'])], [event], at('23:50'))[0].matches).toHaveLength(1);
    expect(assessJourneys([route('morning', ['역삼', '선릉'])], [event], at('00:00'))[0].matches).toHaveLength(0);
  });
  it('deduplicates signals, ignores invalid dates, and has no recommendation without evidence', () => {
    const routes = [route('direct', ['역삼', '선릉']), route('other', ['강남', '선릉'])];
    expect(assessJourneys(routes, [signal, signal, { ...signal, id: 'invalid', endsAt: NaN }], at('08:00'))[0].matches).toHaveLength(1);
    expect(recommendJourney(assessJourneys(routes, [], at('08:00')), 15)).toBeUndefined();
    expect(recommendJourney(assessJourneys(routes, [signal], NaN), 15)).toBeUndefined();
  });
  it('keeps unavoidable endpoint events on every candidate and prefers fewer remaining events', () => {
    const endpoint = { ...signal, id: 'end', area: '선릉' };
    const assessments = assessJourneys([route('direct', ['역삼', '선릉']), route('other', ['삼성', '선릉'], 25)], [signal, endpoint], at('08:00'));
    expect(recommendJourney(assessments, 15)?.matches).toEqual([endpoint]);
  });
});
describe('confirmed report routing source', () => {
  it('accepts today confirmed reports only, with one-hour validity', () => {
    const now = new Date(at('08:10'));
    expect(reportRoutingSignals([report], now)).toHaveLength(1);
    expect(reportRoutingSignals([{ ...report, confirmations: ['author', 'a', 'a'] }], now)).toEqual([]);
    expect(reportRoutingSignals([{ ...report, createdAt: '2026-11-13T08:00:00+09:00' }], now)).toEqual([]);
    expect(reportRoutingSignals([{ ...report, createdAt: 'invalid' }], now)).toEqual([]);
    expect(reportRoutingSignals([report], new Date(at('09:00')))).toEqual([]);
    expect(reportRoutingSignals([{ ...report, createdAt: '2026-11-14T09:00:00+09:00' }], now)).toEqual([]);
  });
  it('expires late-night reports at midnight', () => {
    const late = { ...report, time: '23:50' };
    expect(reportRoutingSignals([late], new Date(at('23:55')))[0].endsAt).toBe(Date.parse('2026-11-15T00:00:00+09:00'));
    expect(reportRoutingSignals([late], new Date('2026-11-15T00:01:00+09:00'))).toEqual([]);
  });
});
