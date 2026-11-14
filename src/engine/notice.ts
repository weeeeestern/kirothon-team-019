import type { Anomaly, Notice, Route, Baseline } from './types';
import { classifyTiming, situationLabel } from './classify';
import { timeToMinutes, minutesToHHmm } from './utils';

const ACTIONS: Record<string, string> = {
  construction: '우회 경로를 확인하고 10분 일찍 출발해요',
  rain:         '우산을 챙기고 버스 대신 지하철을 이용해요',
  dust:         '마스크를 착용하고 환기를 줄여요',
  marathon:     '경로가 통제돼요. 대중교통으로 우회해요',
  strike:       '운행이 감소해요. 10~20분 일찍 출발해요',
  congestion:   '혼잡이 예상돼요. 5~10분 일찍 출발해요',
};

export function buildNotice(
  anomaly: Anomaly, route: Route, impact: number, z: number, baseline: Baseline,
): Notice {
  const timing = anomaly.timing ?? classifyTiming(anomaly.situation);
  const deliverAt = timing === 'scheduled'
    ? '전날 22:00'
    : minutesToHHmm(timeToMinutes(route.departAt) - 17);

  const ratio = baseline.mean > 0 ? (anomaly.value / baseline.mean).toFixed(1) : '—';
  return {
    id: `${route.id}:${anomaly.id}`,
    baselineValue: baseline.mean, currentValue: anomaly.value,
    unit: anomaly.situation === 'congestion' ? '%' : '점', source: anomaly.source,
    anomalyId: anomaly.id,
    routeId: route.id,
    situation: anomaly.situation,
    what: `${anomaly.area} ${situationLabel(anomaly.situation)}`,
    delta: `평소 ${Math.round(baseline.mean)}${anomaly.situation === 'congestion' ? '%' : '점'} → 오늘 ${Math.round(anomaly.value)}${anomaly.situation === 'congestion' ? '%' : '점'} (약 ${ratio}배)`,
    action: ACTIONS[anomaly.situation] ?? '이동 계획을 조정해요',
    reason: `기준선 대비 편차 ${z.toFixed(1)}σ · 출처: ${anomaly.source === 'synthetic' ? '합성 데이터' : anomaly.source === 'report' ? '시민 제보' : '공공 API'}`,
    learning: baseline.learning,
    deliverAt,
    impact,
  };
}
