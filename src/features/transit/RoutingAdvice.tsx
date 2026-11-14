import type { JourneyAssessment } from './recommendation';

export function RoutingAdvice({ assessments, recommendation, signalCount, simulate, maxExtraMinutes }: { assessments: JourneyAssessment[]; recommendation?: JourneyAssessment; signalCount: number; simulate: boolean; maxExtraMinutes: number }) {
  const baseline = assessments[0];
  if (!baseline) return null;
  const avoided = recommendation ? baseline.matches.filter(signal => !recommendation.matches.some(match => match.source === signal.source && match.id === signal.id)) : [];
  return <section className="routing-advice" aria-label="이상 신호 경로 비교">
    <div role="status">
      <strong>{simulate ? '합성 데이터로 우회 추천 시연 중' : '이상 신호 경로 비교'}</strong>
      {recommendation ? <>
        <p>첫 번째 후보보다 겹치는 이상 신호가 {baseline.matches.length - recommendation.matches.length}건 적은 경로를 추천해요.</p>
        <p>{avoided.map(signal => `${signal.area} ${signal.label}`).join(' · ')} 신호를 피해 가는 대안이에요. 최단 경로 대비 <strong>+{recommendation.extraMinutes}분</strong>이에요.</p>
        {recommendation.matches.length > 0 && <p>이 대안에도 겹치는 신호 {recommendation.matches.length}건이 남아 있어요.</p>}
      </> : <p>{!signalCount ? '비교할 유효한 제보가 없어요. 일반 길찾기 결과를 표시해요.' : !baseline.matches.length ? '첫 번째 후보와 장소·시간이 겹치는 신호가 없어요.' : `추가 ${maxExtraMinutes}분 이내 후보에서 이상 신호가 더 적은 대안을 찾지 못했어요.`}</p>}
    </div>
    <p className="caption">이 브라우저에 저장된 제보 중 오늘 작성되고 다른 사용자 2명 이상이 확인한 제보를 최대 1시간, 자정까지 반영해요. 조회된 최대 5개 후보의 역·정류장 이름과 예상 구간 통과 시간(앞뒤 5분)을 비교하며, 겹치는 신호가 적은 순으로 추천해요.</p>
    <p className="caption">공식 운행장애·실시간 열차 혼잡은 아직 미연동이에요. 일치하는 신호가 없다는 뜻이 정상 운행을 보장하지는 않아요. 아래에서 다른 경로도 직접 선택할 수 있어요.</p>
  </section>;
}
