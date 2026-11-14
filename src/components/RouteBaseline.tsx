import { useEffect, useState } from 'react';
import { Button } from 'antd-mobile';
import type { Route } from '@/engine';
import { findCongestion, findRidership, loadPublicBaselines } from '@/features/baseline/publicBaseline';
import type { BaselineDay, PublicBaselines } from '@/features/baseline/publicBaseline';

export function RouteBaseline({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<BaselineDay>('weekday');
  const [bundle, setBundle] = useState<PublicBaselines | null>(null);
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  useEffect(() => {
    if (!open) return;
    let active = true; setError(false);
    loadPublicBaselines().then(value => { if (active) setBundle(value); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [open, attempt]);
  const station = bundle ? route.stops.find(stop => findCongestion(bundle, { station: stop, day, time: route.departAt }).length > 0 || findRidership(bundle, { station: stop, day, time: route.departAt }).length > 0) : undefined;
  const query = { station: station ?? '', day, time: route.departAt };
  const congestion = bundle ? findCongestion(bundle, query) : [];
  const ridership = bundle ? findRidership(bundle, query) : [];
  return <details className="baseline-panel" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>이 경로의 평소 기준 살펴보기 <span className="real-data-tag">실제 파일</span></summary>
    {open && <>
      <label className="field compact-field">비교 요일<select value={day} onChange={event => setDay(event.target.value as BaselineDay)}><option value="weekday">평일</option><option value="saturday">토요일</option><option value="sunday">일요일</option></select></label>
      {!bundle && !error && <p role="status">공공데이터 기준을 불러오고 있어요…</p>}
      {error && <div role="status"><p>기준 데이터를 불러오지 못했어요.</p><Button size="small" onClick={() => retry(n => n + 1)}>다시 불러오기</Button></div>}
      {bundle && !station && <p>등록한 역의 {route.departAt} 기준 자료가 없어요. 다른 지점이나 시각의 수치로 대신 표시하지 않아요.</p>}
      {station && <>
        <p><strong>{station} · {route.departAt} 출발 기준</strong></p>
        <p className="caption">경로에서 자료가 있는 첫 역의 과거 통계예요. 방향을 자동 추정하지 않고 나눠 보여드려요.</p>
        {congestion.length > 0 && <><h4>평소 열차 혼잡도</h4><div className="baseline-rows">{congestion.map(item => <div className="baseline-row" key={`${item.stationCode}-${item.line}-${item.direction}`}><span>{item.line.endsWith('호선') ? item.line : `${item.line}호선`} · {item.direction}<small>{item.slotStart}–{item.slotEnd}</small></span><strong>{item.meanPercent.toFixed(1)}<small>%</small></strong></div>)}</div><p className="caption">서울교통공사 {congestion[0].sourcePeriod} 기준 분기 평균 · 정원 대비 비율이라 100%를 넘을 수 있어요.</p></>}
        {ridership.length > 0 && <details className="ridership-detail"><summary>역 이용 인원 통계도 보기</summary>{ridership.map(item => <div className="baseline-row" key={`${item.stationCode}-${item.line}-${item.direction}`}><span>{item.line.endsWith('호선') ? item.line : `${item.line}호선`} · {item.direction}<small>{item.timeLabel} · {item.sampleDays}일</small></span><span><strong>{Math.round(item.mean).toLocaleString()}명</strong><small>표준편차 {item.std === null ? '미산출' : Math.round(item.std).toLocaleString() + '명'}</small></span></div>)}<p className="caption">{ridership[0].sourcePeriod} 개찰구 이용 인원 평균이에요. 열차 혼잡도와 다른 지표예요.</p></details>}
      </>}
      <p className="caption">과거 평균은 현재 관측이 아니에요. 공휴일 별도 보정은 없고, 자정 이후는 이전 운행일 기준이에요.</p>
    </>}
  </details>;
}
