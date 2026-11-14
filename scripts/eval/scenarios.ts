import type { Anomaly, Route } from '../../src/engine/types';
export interface Scenario { id: string; date: Date; route: Route; anomalies: Anomaly[]; expected: string[]; ordinary: boolean }
// Deterministic fixtures: two personas, seven quiet days each and ten relevant events.
export function scenarios(): Scenario[] {
  const rows: Scenario[] = [];
  const personas = [
    { id: 'commuter', district: '강남구', stops: ['강남', '역삼', '선릉'], departAt: '08:00', days: ['weekday'] },
    { id: 'student', district: '마포구', stops: ['신촌', '이대'], departAt: '08:00', days: ['weekday'] },
  ] as Route[];
  for (const route of personas) {
    for (let i = 0; i < 7; i++) rows.push({ id: `${route.id}-quiet-${i}`, date: new Date(`2026-11-${16 + (i % 5)}T08:00:00+09:00`), route, ordinary: true, expected: [], anomalies: [{ id: `normal-${i}`, situation: 'congestion', timing: 'sudden', area: route.stops[0], startsAt: '07:30', endsAt: '08:30', value: 55 + i, source: 'synthetic' }] });
    for (let i = 0; i < 5; i++) {
      const base: Anomaly = { id: `${route.id}-event-${i}`, situation: (['congestion', 'construction', 'rain', 'dust', 'strike'] as const)[i], timing: i === 1 || i === 4 ? 'scheduled' : 'sudden', area: route.stops[0], startsAt: '07:30', endsAt: '08:30', value: 100 + i * 5, source: 'synthetic' };
      rows.push({ id: `${route.id}-event-${i}`, date: new Date(`2026-11-${16 + i}T08:00:00+09:00`), route, ordinary: false, expected: [base.id], anomalies: [base, { ...base, id: `${base.id}-other-area`, area: '광화문' }, { ...base, id: `${base.id}-other-time`, startsAt: '14:00', endsAt: '15:00' }, { ...base, id: `${base.id}-other-area2`, area: '여의도' }] });
    }
  }
  return rows;
}
