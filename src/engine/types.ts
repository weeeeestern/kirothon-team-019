import type { Place, TransitJourney } from '../features/transit/types';

export type DayType = 'weekday' | 'weekend' | 'holiday' | 'afterHoliday';
export type Situation =
  | 'ordinary'
  | 'construction'
  | 'rain'
  | 'dust'
  | 'marathon'
  | 'strike'
  | 'congestion';
export type Timing = 'scheduled' | 'sudden';

export interface BaselineKey {
  dayType: DayType;
  slot: number; // 0~47 (30분 단위)
  area: string;
}

export interface Baseline {
  mean: number;
  std: number;
  learning: boolean;
}

export interface Route {
  id: string;
  district: string;
  stops: string[];
  departAt: string; // HH:mm
  days: DayType[];
  origin?: Place;
  destination?: Place;
  journey?: TransitJourney;
  fetchedAt?: string;
}

export interface Anomaly {
  id: string;
  situation: Exclude<Situation, 'ordinary'>;
  timing: Timing;
  area: string;
  value: number;
  startsAt: string; // HH:mm
  endsAt: string;   // HH:mm
  source: 'official' | 'synthetic' | 'report';
}

export interface Notice {
  id: string;
  baselineValue: number;
  currentValue: number;
  unit: string;
  source: Anomaly['source'];
  anomalyId: string;
  routeId: string;
  situation: Situation;
  what: string;
  delta: string;
  action: string;
  reason: string;
  learning: boolean;
  deliverAt: string;
  impact: number;
}

export interface EngineState {
  threshold: number;
  feedbackCounts: { helpful: number; notNeeded: number };
}

export interface EngineResult {
  notices: Notice[];
  ordinariness: number;
  situation: Situation;
}
