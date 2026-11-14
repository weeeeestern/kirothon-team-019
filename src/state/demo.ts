import type { Anomaly, Route } from '../engine/types';

export const DEMO_POINT_PREFIX = 'showcase:points:';
export const DEMO_ROUTE: Route = {
  id: 'showcase-route', district: '강남구 · 시연',
  stops: ['강남', '역삼', '선릉'], departAt: '08:00', days: ['weekday', 'afterHoliday'],
};
export const DEMO_ANOMALIES: Anomaly[] = [
  { id: 'showcase-congestion', situation: 'congestion', area: '강남', value: 120, timing: 'sudden', startsAt: '07:30', endsAt: '08:30', source: 'synthetic' },
  { id: 'showcase-rain', situation: 'rain', area: '역삼', value: 130, timing: 'sudden', startsAt: '07:30', endsAt: '08:30', source: 'synthetic' },
  { id: 'showcase-construction', situation: 'construction', area: '선릉', value: 140, timing: 'scheduled', startsAt: '07:30', endsAt: '08:30', source: 'synthetic' },
];
