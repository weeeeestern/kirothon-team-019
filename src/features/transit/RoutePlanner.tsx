import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'antd-mobile';
import type { Route } from '@/engine';
import type { Place, TransitJourney } from './types';
import { searchJourneys, searchPlaces } from './client';
import { journeyStops, routeError } from '../routes/route';
import { JourneyDetail, JourneySummary } from './JourneyDetail';
import { KakaoMap } from '@/components/KakaoMap';
import type { CitizenReport } from '../reports/reportStore';
import { dayKey } from '@/engine/utils';
import { assessJourneys, recommendJourney, reportRoutingSignals } from './recommendation';
import { RoutingAdvice } from './RoutingAdvice';
import './recommendation.css';
const NO_REPORTS: CitizenReport[] = [];

function PlaceField({ label, value, initialQuery = '', onChange }: { label: string; value?: Place; initialQuery?: string; onChange: (place?: Place) => void }) {
  const [query, setQuery] = useState(value?.name ?? initialQuery);
  const [results, setResults] = useState<Place[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function search() {
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    if (query.trim().length < 2) { setMessage('장소 이름을 두 글자 이상 입력해 주세요.'); return; }
    setBusy(true); setMessage(''); setResults([]);
    try {
      const found = await searchPlaces(query, controller.signal);
      if (!controller.signal.aborted) { setResults(found); if (!found.length) setMessage('검색 결과가 없어요. 역 이름이나 주소를 조금 더 자세히 입력해 주세요.'); }
    } catch (error) { if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : '장소 검색에 연결하지 못했어요.'); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  return <div className="place-field">
    <label className="field">{label}<input value={query} maxLength={80} autoComplete="off" placeholder="역 이름, 건물명 또는 주소" onChange={event => { request.current?.abort(); setBusy(false); setQuery(event.target.value); setResults([]); setMessage(''); onChange(undefined); }} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void search(); } }} /></label>
    <Button type="button" size="small" loading={busy} disabled={query.trim().length < 2} onClick={() => void search()} aria-label={`${label} 검색`}>검색</Button>
    {value && <p className="place-selected">선택됨 · {value.name}<small>{value.address}</small></p>}
    {message && <p role="alert">{message}</p>}
    {!!results.length && <ul className="place-results" aria-label={`${label} 검색 결과`}>{results.map(place => <li key={place.id}><button type="button" aria-label={`${place.name} · ${place.address}`} onClick={() => { request.current?.abort(); onChange(place); setQuery(place.name); setResults([]); setMessage(''); }}><strong>{place.name}</strong><span>{place.address}</span></button></li>)}</ul>}
  </div>;
}

export function RoutePlanner({ initial, onSave, onManual, reports = NO_REPORTS, now: suppliedNow }: { initial?: Route; onSave: (route: Route) => void; onManual: () => void; reports?: CitizenReport[]; now?: Date }) {
  const [origin, setOrigin] = useState<Place | undefined>(initial?.origin);
  const [destination, setDestination] = useState<Place | undefined>(initial?.destination);
  const [journeys, setJourneys] = useState<TransitJourney[]>(initial?.journey ? [initial.journey] : []);
  const [manualChoice, setManualChoice] = useState<{ id: string; comparison: string }>();
  const [fetchedAt, setFetchedAt] = useState(initial?.fetchedAt ?? '');
  const [departAt, setDepartAt] = useState(initial?.departAt ?? '08:00');
  const [openedAt] = useState(() => new Date());
  const now = suppliedNow ?? openedAt;
  const comparisonDate = dayKey(now);
  const [maxExtraMinutes, setMaxExtraMinutes] = useState(15);
  const [simulate, setSimulate] = useState(false);
  const [simulationArea, setSimulationArea] = useState('');
  const sampleAreas = [...new Set(journeys.flatMap(j => j.stations))];
  const sampleArea = sampleAreas.includes(simulationArea) ? simulationArea : journeys[0]?.stations[Math.floor((journeys[0]?.stations.length ?? 0) / 2)] ?? '';
  const departure = Date.parse(`${comparisonDate}T${departAt}:00+09:00`);
  const confirmedSignals = useMemo(() => reportRoutingSignals(reports, now), [reports, now]);
  const signals = useMemo(() => simulate && sampleArea && Number.isFinite(departure)
    ? [...confirmedSignals, { id: 'routing-demo', area: sampleArea, label: '혼잡 시연', startsAt: departure - 300000, endsAt: departure + 3600000, source: 'synthetic' as const }]
    : confirmedSignals, [confirmedSignals, simulate, sampleArea, departure]);
  const assessments = useMemo(() => assessJourneys(journeys, signals, departure, origin, destination), [journeys, signals, departure, origin, destination]);
  const recommendation = recommendJourney(assessments, maxExtraMinutes);
  const comparison = JSON.stringify([departure, maxExtraMinutes, signals, journeys.map(j => j.id)]);
  const selected = journeys.find(j => j.id === (manualChoice?.comparison === comparison ? manualChoice.id : recommendation?.journey.id)) ?? journeys[0];
  const [daily, setDaily] = useState(initial?.days.includes('weekend') ?? false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  function changeEndpoint(place: Place | undefined, target: 'origin' | 'destination') {
    request.current?.abort(); setBusy(false); setJourneys([]); setManualChoice(undefined); setError(''); setFetchedAt('');
    if (target === 'origin') setOrigin(place); else setDestination(place);
  }
  async function search() {
    if (!origin || !destination) return;
    if (origin.id === destination.id || (origin.lat === destination.lat && origin.lng === destination.lng)) { setError('출발지와 도착지를 다르게 선택해 주세요.'); return; }
    request.current?.abort();
    const controller = new AbortController(); request.current = controller;
    setBusy(true); setError(''); setManualChoice(undefined); setJourneys([]);
    try {
      const response = await searchJourneys(origin, destination, controller.signal);
      if (!controller.signal.aborted) {
        setJourneys(response.routes); setFetchedAt(response.fetchedAt);
        if (!response.routes.length) setError('이 구간의 대중교통 경로를 찾지 못했어요. 가까운 역이나 정류장으로 다시 찾아 주세요.');
      }
    } catch (error) { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : '길찾기 연결을 확인하지 못했어요.'); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  function save() {
    if (!origin || !destination || !selected) return;
    const route: Route = { id: initial?.id ?? crypto.randomUUID(), district: origin.district ?? initial?.district ?? '서울', stops: journeyStops(origin, destination, selected), departAt, days: daily ? ['weekday', 'weekend', 'holiday', 'afterHoliday'] : ['weekday', 'afterHoliday'], origin, destination, journey: selected, fetchedAt };
    const message = routeError(route);
    if (message) { setError(message); return; }
    onSave(route);
  }
  return <section className="route-planner" aria-label="대중교통 경로 찾기">
    <p className="caption">① 장소 선택 → ② 이동 경로 확인 → ③ 내 경로로 저장</p>
    {initial && !initial.journey && <p className="caption">등록한 출발·도착지를 검색해 정확한 장소를 선택해 주세요. 저장하면 기존 경로가 선택한 이동 구간으로 바뀌어요.</p>}
    <PlaceField label="출발지" value={origin} initialQuery={initial?.stops[0]} onChange={place => changeEndpoint(place, 'origin')} />
    <PlaceField label="도착지" value={destination} initialQuery={initial?.stops.at(-1)} onChange={place => changeEndpoint(place, 'destination')} />
    {!selected && <KakaoMap markers={[...(origin ? [{ ...origin, label: `출발: ${origin.name}` }] : []), ...(destination ? [{ ...destination, label: `도착: ${destination.name}` }] : [])]} />}
    <label className="field">알림 기준 출발 시각<input type="time" required value={departAt} onChange={event => setDepartAt(event.target.value)} /></label>
    <p className="caption">이상 신호는 {comparisonDate} (한국 시간) 출발 기준으로 비교해요. 예약 운행시간표가 아니에요.</p>
    <label className="field">우회 시 추가 이동시간<select value={maxExtraMinutes} onChange={event => setMaxExtraMinutes(Number(event.target.value))}><option value={0}>최단 시간 이내</option><option value={15}>최단 경로보다 최대 15분</option><option value={30}>최단 경로보다 최대 30분</option><option value={60}>최단 경로보다 최대 60분</option></select></label>
    <Button block type="button" color="primary" disabled={!origin || !destination || !Number.isFinite(departure)} loading={busy} onClick={() => void search()}>대중교통 경로 찾기</Button>
    <p className="caption">카카오 장소 검색 · ODsay 대중교통 길찾기</p>
    {error && <p role="alert">{error}</p>}
    {!!journeys.length && <>
      <RoutingAdvice assessments={assessments} recommendation={recommendation} signalCount={signals.length} simulate={simulate} maxExtraMinutes={maxExtraMinutes} />
      <details className="routing-simulation"><summary>우회 추천 시연</summary><label className="routing-simulation-toggle"><input type="checkbox" checked={simulate} onChange={event => setSimulate(event.target.checked)} /> 합성 혼잡 신호로 비교하기</label>{simulate && <label className="field">시연할 역·정류장<select value={sampleArea} onChange={event => setSimulationArea(event.target.value)}>{sampleAreas.map(area => <option key={area}>{area}</option>)}</select></label>}<p className="caption">실제 경로 후보에 가상의 혼잡 신호를 적용해요. 실시간 상황이 아니에요.</p></details>
    </>}
    {!!journeys.length && <div className="journey-options" role="group" aria-label="이동 경로 후보">{journeys.map((journey, index) => <button type="button" className={`journey-option ${selected?.id === journey.id ? 'selected' : ''}`} aria-pressed={selected?.id === journey.id} key={journey.id} onClick={() => setManualChoice({ id: journey.id, comparison })}>
      {recommendation?.journey.id === journey.id && <span className="routing-recommended">{simulate ? '시연 · ' : ''}이상 신호 영향이 적은 대안</span>}<span className="caption">경로 {index + 1}{selected?.id === journey.id ? ' · 선택됨' : ''}</span><JourneySummary journey={journey} /><span className="journey-lines">{journey.segments.filter(s => s.type !== 'walk').map(s => s.label).join(' → ') || '도보'}</span>
      <span className="journey-risk">{assessments[index].matches.length ? `겹치는 이상 신호 ${assessments[index].matches.length}건` : '일치하는 이상 신호 없음'} · 최단 대비 +{assessments[index].extraMinutes}분</span>
      {!assessments[index].stopsComplete && <span className="journey-risk">경유 정류장 정보 부족 · 우회 추천 제외</span>}
      {assessments[index].matches.map(signal => <span className="journey-risk" key={`${signal.source}:${signal.id}`}>{signal.area} · {signal.label} · {signal.source === 'synthetic' ? '합성 시연' : '사용자 확인 제보'}</span>)}
    </button>)}</div>}
    {selected && origin && destination && <><JourneyDetail journey={selected} origin={origin} destination={destination} fetchedAt={fetchedAt} />
      <label className="field">알림 받을 요일<select value={daily ? 'daily' : 'weekday'} onChange={event => setDaily(event.target.value === 'daily')}><option value="weekday">평일</option><option value="daily">매일</option></select></label>
      <Button block type="button" color="primary" onClick={save}>이 경로 저장</Button>
    </>}
    <div className="manual-fallback"><p className="caption">검색 연결이 어려우면 지나는 역을 직접 등록할 수 있어요.</p><Button block type="button" fill="outline" onClick={onManual}>역·정류장 직접 입력</Button></div>
  </section>;
}
