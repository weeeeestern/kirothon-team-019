import { describe, it, expect } from 'vitest';
import { runDay, DEFAULT_THRESHOLD, updateThreshold } from './index';
import type { Anomaly, Route } from './types';
import { computeImpact, timeOverlap, routeOverlap } from './impact';
import { lookupBaseline } from './baseline';
import { dayKey, getDayType, timeToMinutes } from './utils';
import { evaluate } from '../../scripts/eval/run';
import evaluation from '../data/evaluation.json';
const date = new Date('2026-11-16T08:00:00+09:00');
const route: Route = { id: 'r', district: '강남구', stops: ['강남', '선릉'], departAt: '08:00', days: ['weekday'] };
const anomaly: Anomaly = { id: 'a', area: '강남', value: 120, startsAt: '07:30', endsAt: '08:30', situation: 'congestion', timing: 'sudden', source: 'synthetic' };
const state = { threshold: DEFAULT_THRESHOLD, feedbackCounts: { helpful: 0, notNeeded: 0 } };
describe('notification engine', () => {
  it('keeps an ordinary day silent', () => { const r = runDay([route], [{ ...anomaly, value: 50 }], state, date); expect(r.notices).toEqual([]); expect(r.ordinariness).toBe(100); });
  it('rejects unrelated routes, time windows and inactive days', () => {
    expect(runDay([route], [{ ...anomaly, area: '광화문' }, { ...anomaly, startsAt: '12:00', endsAt: '13:00' }], state, date).notices).toEqual([]);
    expect(runDay([route], [anomaly], state, new Date('2026-11-14T08:00:00+09:00')).notices).toEqual([]);
  });
  it('includes exact threshold equality and deduplicates input', () => { const impact = computeImpact(anomaly, route, date).impact; expect(runDay([route], [anomaly, anomaly], { ...state, threshold: impact }, date).notices).toHaveLength(1); expect(runDay([route], [anomaly], { ...state, threshold: impact + .01 }, date).notices).toHaveLength(0); });
  it('uses explicit scheduled timing and correct midnight wrap', () => { const scheduled = runDay([route], [{ ...anomaly, timing: 'scheduled' }], state, date).notices[0]; expect(scheduled.deliverAt).toBe('전날 22:00'); const midnight = { ...route, departAt: '00:05' }; expect(runDay([midnight], [{ ...anomaly, startsAt: '23:40', endsAt: '00:40' }], state, date).notices[0].deliverAt).toBe('23:48'); });
  it('ignores invalid numerical and time input', () => { for (const value of [NaN, Infinity, -10]) expect(runDay([route], [{ ...anomaly, value }], state, date).notices).toHaveLength(0); expect(timeOverlap('bad', '09:00', '08:00')).toBe(0); expect(timeToMinutes('24:00')).toBeNaN(); expect(routeOverlap('', route.stops)).toBe(0); });
  it('handles overlap boundaries and station suffixes', () => { expect(timeOverlap('08:30', '09:30', '08:00')).toBe(0); expect(timeOverlap('07:30', '08:30', '08:00')).toBe(1); expect(routeOverlap('강남역', ['강남', '선릉'])).toBe(1); expect(routeOverlap('강', ['강남'])).toBe(0); });
  it('marks fallback baselines as learning and clamps personalization', () => { expect(lookupBaseline({ dayType: 'weekday', slot: 15, area: '강남' }).learning).toBe(true); expect(lookupBaseline({ dayType: 'weekday', slot: 0, area: '없음' }).learning).toBe(true); expect(updateThreshold(.5, 'helpful')).toBe(.5); expect(updateThreshold(3, 'notNeeded')).toBe(3); expect(updateThreshold(1.5, 'helpful')).toBe(1.4); });
  it('uses Seoul dates and accepts an explicit holiday calendar', () => { expect(dayKey(new Date('2026-11-15T15:01:00Z'))).toBe('2026-11-16'); expect(getDayType(date, ['2026-11-16'])).toBe('holiday'); expect(getDayType(date, ['2026-11-15'])).toBe('afterHoliday'); });
  it('passes the shared-engine evaluation and keeps displayed results current', () => { const e = evaluate(); expect(e.ordinaryDayNotices).toBe(0); expect(e.detectionRate).toBeGreaterThanOrEqual(.8); expect(e.reductionVsFixed).toBeGreaterThanOrEqual(.5); expect(e.helpfulRatio).toBeNull(); expect(e).toEqual(evaluation); });
});
