import { useState } from 'react';
import type { Place, TransitJourney } from './types';
import { KakaoMap } from '@/components/KakaoMap';

export function JourneySummary({ journey }: { journey: TransitJourney }) {
  const walkingMinutes = journey.segments.filter(s => s.type === 'walk').reduce((sum, s) => sum + s.time, 0);
  return <div className="journey-summary"><strong>{journey.totalTime}분</strong><span>환승 {journey.transferCount}회</span><span>도보 {walkingMinutes}분 · {Math.round(journey.totalWalk).toLocaleString('ko-KR')}m</span><span>{journey.payment.toLocaleString('ko-KR')}원</span></div>;
}
export function JourneyDetail({ journey, origin, destination, fetchedAt }: { journey: TransitJourney; origin: Place; destination: Place; fetchedAt?: string }) {
  return <div className="journey-detail">
    <KakaoMap markers={[{ ...origin, label: `출발: ${origin.name}` }, { ...destination, label: `도착: ${destination.name}` }]} path={journey.path} pathKind={journey.pathKind} />
    <div className="route-endpoint"><span>출발</span><strong>{origin.name}</strong></div>
    <ol className="journey-steps">{journey.segments.map((segment, index) => <li key={index} className={`journey-step ${segment.type}`}>
      <span className="journey-step-number">{index + 1}</span><div><strong>{segment.type === 'walk' ? '도보' : segment.label}</strong><span className="journey-step-time">{segment.time}분</span>
      {(segment.from || segment.to) && <p>{segment.from || '이동 시작'} → {segment.to || '다음 구간'}</p>}
      {!!segment.stations?.length && <details><summary>지나는 역·정류장 {segment.stations.length}곳</summary><p>{segment.stations.join(' → ')}</p></details>}</div>
    </li>)}</ol>
    <div className="route-endpoint"><span>도착</span><strong>{destination.name}</strong></div>
    <p className="caption">ODsay 경로 조회{fetchedAt && ` · ${new Date(fetchedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false })}`}<br />소요시간·요금은 조회 시점의 예상값이에요. 저장한 출발 시각은 알림 기준이며 예약 길찾기가 아니에요.</p>
  </div>;
}

export function SavedJourneyDetails(props: Parameters<typeof JourneyDetail>[0]) {
  const [open, setOpen] = useState(false);
  return <details className="saved-route-details" onToggle={event => setOpen(event.currentTarget.open)}><summary>지도·이동 구간 보기</summary>{open && <JourneyDetail {...props} />}</details>;
}
