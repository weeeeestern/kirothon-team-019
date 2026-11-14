import { useEffect, useState } from 'react';
import { Button } from 'antd-mobile';
import { BarChartOutlined, DownOutlined, InfoCircleOutlined, SwapOutlined } from '@ant-design/icons';
import type { Route } from '@/engine';
import { findCongestion, findRidership, loadPublicBaselines } from '@/features/baseline/publicBaseline';
import type { BaselineDay, PublicBaselines } from '@/features/baseline/publicBaseline';

const DAYS: { value: BaselineDay; label: string }[] = [
  { value: 'weekday', label: '평일' },
  { value: 'saturday', label: '토요일' },
  { value: 'sunday', label: '일요일' },
];
const lineLabel = (line: string) => line.endsWith('호선') ? line : `${line}호선`;

export function RouteBaseline({ route }: { route: Route }) {
  const [open, setOpen] = useState(false);
  const [day, setDay] = useState<BaselineDay>('weekday');
  const [bundle, setBundle] = useState<PublicBaselines | null>(null);
  const [error, setError] = useState(false);
  const [attempt, retry] = useState(0);
  useEffect(() => {
    if (!open || bundle) return;
    let active = true;
    setError(false);
    loadPublicBaselines().then(value => { if (active) setBundle(value); }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [open, attempt, bundle]);
  const station = bundle ? route.stops.find(stop => findCongestion(bundle, { station: stop, day, time: route.departAt }).length > 0 || findRidership(bundle, { station: stop, day, time: route.departAt }).length > 0) : undefined;
  const query = { station: station ?? '', day, time: route.departAt };
  const congestion = bundle ? findCongestion(bundle, query) : [];
  const ridership = bundle ? findRidership(bundle, query) : [];

  return <details className="route-baseline" open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="route-baseline-toggle">
      <span className="route-baseline-icon" aria-hidden="true"><BarChartOutlined /></span>
      <span className="route-baseline-title"><strong>이 시간, 평소에는</strong><span>요일별 혼잡도와 이용 인원</span></span>
      <span className="route-baseline-chevron" aria-hidden="true"><DownOutlined /></span>
    </summary>
    {open && <div className="route-baseline-content">
      <div className="baseline-day-picker" role="group" aria-label="비교 요일">
        {DAYS.map(option => <Button key={option.value} size="small" fill="none" aria-pressed={day === option.value} onClick={() => setDay(option.value)}>{option.label}</Button>)}
      </div>
      {!bundle && !error && <p className="baseline-message" role="status">평소 통계를 불러오고 있어요…</p>}
      {error && <div className="baseline-message" role="status"><p>통계를 불러오지 못했어요.</p><Button size="small" fill="outline" onClick={() => retry(n => n + 1)}>다시 불러오기</Button></div>}
      {bundle && !station && <div className="baseline-message"><InfoCircleOutlined aria-hidden="true" /><p>이 시간의 통계가 아직 없어요.</p><span>등록한 역의 {route.departAt} 기준 자료가 없어요. 다른 역이나 시각의 수치로 대신 표시하지 않아요.</span></div>}
      {station && <>
        <div className="baseline-station-heading"><div><span className="baseline-eyebrow">출발 시간 기준</span><h4>{station.replace(/역$/, '')}역 <span>· {route.departAt}</span></h4></div><span className="baseline-history-tag">과거 통계</span></div>
        <p className="baseline-context">경로에서 자료가 있는 첫 역이에요.<br />이동 방향을 추정하지 않고 각각 보여드려요.</p>
        {congestion.length > 0 && <section className="baseline-congestion" aria-label="평소 열차 혼잡도">
          <h5>평소 열차 혼잡도</h5>
          <div className="baseline-metric-grid">{congestion.map(item => <div className="baseline-metric" key={`${item.stationCode}-${item.line}-${item.direction}`}>
            <div className="baseline-metric-label"><span>{lineLabel(item.line)}</span><strong>{item.direction}</strong></div>
            <p className="baseline-metric-value">{item.meanPercent.toFixed(1)}<span>%</span></p>
            <span className="baseline-metric-time">{item.slotStart}–{item.slotEnd}</span>
          </div>)}</div>
          <p className="baseline-source">서울교통공사 · {congestion[0].sourcePeriod} 기준 분기 평균</p>
          <p className="baseline-source">열차 정원 대비 비율로, 100%를 넘을 수 있어요.</p>
        </section>}
        {ridership.length > 0 && <details className="baseline-ridership">
          <summary><span><SwapOutlined aria-hidden="true" /> 역 이용 인원</span><span className="baseline-detail-label">상세 보기 <DownOutlined aria-hidden="true" /></span></summary>
          <div className="baseline-ridership-content">
            {ridership.map(item => <div className="baseline-ridership-row" key={`${item.stationCode}-${item.line}-${item.direction}`}>
              <div><strong>{lineLabel(item.line)} · {item.direction}</strong><span>{item.timeLabel} · {item.sampleDays}일 평균</span></div>
              <div className="baseline-ridership-number"><strong>{Math.round(item.mean).toLocaleString('ko-KR')}<span>명</span></strong><span>표준편차 {item.std === null ? '미산출' : Math.round(item.std).toLocaleString('ko-KR') + '명'}</span></div>
            </div>)}
            <p className="baseline-source">{ridership[0].sourcePeriod} 개찰구 이용 인원이에요. 열차 혼잡도와는 다른 지표예요.</p>
          </div>
        </details>}
      </>}
      <div className="baseline-disclaimer"><InfoCircleOutlined aria-hidden="true" /><p>실시간 관측이 아닌 과거 평균이에요.<span>공휴일 별도 보정은 없으며, 자정 이후는 이전 운행일 기준이에요.</span></p></div>
    </div>}
  </details>;
}
