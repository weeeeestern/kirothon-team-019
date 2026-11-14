import { runDay, DEFAULT_THRESHOLD } from '../../src/engine/index';
import { computeImpact } from '../../src/engine/impact';
import { scenarios } from './scenarios';
export function evaluate() {
  let ordinaryDayNotices = 0, detected = 0, injected = 0, engineCount = 0, fixedCount = 0;
  for (const s of scenarios()) {
    const result = runDay([s.route], s.anomalies, { threshold: DEFAULT_THRESHOLD, feedbackCounts: { helpful: 0, notNeeded: 0 } }, s.date);
    if (s.ordinary) ordinaryDayNotices += result.notices.length;
    detected += s.expected.filter(id => result.notices.some(n => n.anomalyId === id)).length;
    injected += s.expected.length; engineCount += result.notices.length;
    // Comparator deliberately uses only z >= 1, as specified; shares the engine's deviation calculation.
    fixedCount += s.anomalies.filter(a => computeImpact(a, s.route, s.date).z >= 1).length;
  }
  return { basis: '합성 시나리오 기준', scenarioCount: scenarios().length, ordinaryDayNotices, detectionRate: detected / injected, reductionVsFixed: fixedCount ? 1 - engineCount / fixedCount : 0, helpfulRatio: null,
    engineCount, fixedCount, injected, detected,
    method: '페르소나 2종 · 평범한 날 14건 · 관련 이상 10건과 무관 지역/시각 신호 30건. 비교군은 경로·시간을 고려하지 않고 편차 z ≥ 1.0인 신호에 알림을 생성해요. 실제 서비스 성능을 나타내지 않아요.',
    collectedAt: '2026-11-14T00:00:00Z',
    sources: ['기상청 단기예보', '서울시 실시간 도시데이터', 'TOPIS 돌발상황', '지하철 실시간 도착', '서울 버스 도착', '지하철 혼잡도 통계', '에어코리아'].map(name => ({ name, mode: 'synthetic' })),
  };
}
