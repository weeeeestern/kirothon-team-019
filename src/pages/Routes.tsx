import { useState } from 'react';
import { Button, Dialog, Popup, Toast } from 'antd-mobile';
import { ArrowRightOutlined, ClockCircleOutlined, EditOutlined } from '@ant-design/icons';
import type { Route } from '@/engine';
import type { Page } from '@/App';
import { useApp } from '@/state/AppState';
import { PageHeader } from '@/components/PageHeader';
import { routeError, MAX_STOPS } from '@/features/routes/route';
import regions from '@/data/regions.json';
import { RoutePlanner } from '@/features/transit/RoutePlanner';
import { SavedJourneyDetails, JourneySummary } from '@/features/transit/JourneyDetail';
import { RouteBaseline } from '@/components/RouteBaseline';
import '@/theme/transit.css';
import '@/theme/routes.css';
const fresh = (): Route => ({ id: crypto.randomUUID(), district: '강남구', stops: ['', ''], departAt: '08:00', days: ['weekday', 'afterHoliday'] });
export function Routes({ navigate }: { navigate: (p: Page) => void }) {
  const { store, dispatch, now } = useApp(); const [editing, setEditing] = useState<Route | null>(null); const [error, setError] = useState('');
  const [planning, setPlanning] = useState<Route | 'new' | null>(null);
  const region = regions.items.find(r => r.name === editing?.district);
  function save() {
    if (!editing) return;
    const message = routeError(editing);
    if (message) { setError(message); return; }
    dispatch({ type: 'route', route: editing }); setEditing(null); Toast.show('경로를 저장했어요');
  }
  return <div className="page"><Button fill="none" color="primary" onClick={() => navigate('home')}>‹ 오늘로</Button><PageHeader title="내가 다니는 길" subtitle="위치 추적 없이, 등록한 경로만 살펴봐요" />
    <section className="card route-search-intro"><h3>어디로 다니세요?</h3><p>장소를 찾고 이동 구간을 확인해요.<br />저장하면 내 경로의 평소 기준을 살펴볼 수 있어요.</p><Button block color="primary" onClick={() => setPlanning('new')}>지도에서 경로 찾기</Button><p className="caption">카카오맵 + ODsay · 위치 권한 없이 검색해요</p></section>
    {store.routes.length > 0 && <div className="saved-routes-heading"><h3>저장한 경로 <span>{store.routes.length}</span></h3><span>내 일상의 기준</span></div>}
    {store.routes.map((r, index) => <section className="card saved-route-card" key={r.id}>
      <div className="saved-route-topline"><span className="saved-route-index">경로 {String(index + 1).padStart(2, '0')}</span><span>{r.district} · {r.days.includes('weekend') ? '매일' : '평일'}</span></div>
      <h3 className="saved-route-endpoints" aria-label={r.journey ? `${r.origin?.name} → ${r.destination?.name}` : r.stops.join(' → ')}><span>{r.journey ? r.origin?.name : r.stops[0]}</span><ArrowRightOutlined aria-hidden="true" /><span>{r.journey ? r.destination?.name : r.stops.at(-1)}</span></h3>
      {!r.journey && r.stops.length > 2 && <p className="saved-route-via">경유 <span>{r.stops.slice(1, -1).join(' · ')}</span></p>}
      <div className="saved-route-departure"><ClockCircleOutlined aria-hidden="true" /><strong>{r.departAt}</strong><span>출발</span></div>
      {r.journey && r.origin && r.destination && <><JourneySummary journey={r.journey} /><SavedJourneyDetails journey={r.journey} origin={r.origin} destination={r.destination} fetchedAt={r.fetchedAt} /></>}
      {!r.journey && <div className="saved-route-map-connect"><p className="caption">역 이름으로 등록한 경로예요. 장소를 선택하면 지도와 이동 구간을 연결할 수 있어요.</p><Button block fill="outline" onClick={() => setPlanning(r)}>지도 연결</Button></div>}
      <RouteBaseline route={r} />
      <div className="saved-route-actions"><Button size="small" fill="none" onClick={() => { if (r.journey) setPlanning(r); else setEditing(r); setError(''); }}><EditOutlined aria-hidden="true" /> 수정</Button><Button size="small" fill="none" onClick={async () => { if (await Dialog.confirm({ content: '이 경로를 삭제할까요?', confirmText: '삭제해요', cancelText: '유지해요' })) dispatch({ type: 'deleteRoute', id: r.id }); }}>삭제</Button></div>
    </section>)}
    {!store.routes.length && <p className="empty">아직 등록한 경로가 없어요.</p>}<Button block fill="outline" onClick={() => { setEditing(fresh()); setError(''); }}>새 경로 등록</Button><p className="caption">익숙한 역·정류장은 직접 입력해서 등록할 수도 있어요.</p>
    <Popup visible={!!planning} onMaskClick={() => setPlanning(null)} bodyClassName="transit-popup" bodyStyle={{ borderTopLeftRadius: 'var(--adm-radius-l)', borderTopRightRadius: 'var(--adm-radius-l)' }}>
      {planning && <div className="page transit-popup-content"><div className="row between"><h2>내 이동 경로 찾기</h2><Button fill="none" onClick={() => setPlanning(null)}>닫기</Button></div><RoutePlanner reports={store.reports} now={now} initial={planning === 'new' ? undefined : planning} onSave={route => { dispatch({ type: 'route', route }); setPlanning(null); Toast.show('이동 경로를 저장했어요'); }} onManual={() => { setPlanning(null); setEditing(fresh()); setError(''); }} /></div>}
    </Popup>
    <Popup visible={!!editing} onMaskClick={() => setEditing(null)} bodyStyle={{ borderTopLeftRadius: 'var(--adm-radius-l)', borderTopRightRadius: 'var(--adm-radius-l)', maxHeight: '90dvh', overflowY: 'auto' }}>
      {editing && <form className="page route-form" onSubmit={e => { e.preventDefault(); save(); }}><div className="row between"><h2>경로 설정</h2><Button fill="none" onClick={() => setEditing(null)}>닫기</Button></div>
        <label className="field">자치구<select value={editing.district} onChange={e => setEditing({ ...editing, district: e.target.value, stops: ['', ''] })}>{regions.items.map(r => <option key={r.name}>{r.name}</option>)}</select></label>
        <p className="caption">사용 가능한 샘플 신호: {region?.signals.join(' · ')}</p>
        <label className="field">출발역<input list="route-stops" value={editing.stops[0]} maxLength={40} onChange={e => setEditing({ ...editing, stops: [e.target.value, ...editing.stops.slice(1)] })} placeholder="예: 강남" /></label>
        {editing.stops.slice(1, -1).map((stop, index) => <div className="route-stop-row" key={index}>
          <label className="field">경유지 {index + 1}<input list="route-stops" value={stop} maxLength={40} onChange={e => setEditing({ ...editing, stops: editing.stops.map((s, i) => i === index + 1 ? e.target.value : s) })} placeholder="지나는 역·정류장" /></label>
          <Button aria-label={`경유지 ${index + 1} 삭제`} fill="none" onClick={() => setEditing({ ...editing, stops: editing.stops.filter((_, i) => i !== index + 1) })}>삭제</Button>
        </div>)}
        <Button block fill="outline" disabled={editing.stops.length >= MAX_STOPS} onClick={() => setEditing({ ...editing, stops: [...editing.stops.slice(0, -1), '', editing.stops.at(-1)!] })}>경유지 추가</Button>
        <p className="caption">지나는 역·정류장도 직접 넣어 주세요. 등록한 지점의 변화만 비교해요. 최대 {MAX_STOPS}곳까지 저장해요.</p>
        <label className="field">도착역<input list="route-stops" value={editing.stops.at(-1)} maxLength={40} onChange={e => setEditing({ ...editing, stops: [...editing.stops.slice(0, -1), e.target.value] })} placeholder="예: 선릉" /></label>
        <datalist id="route-stops">{region?.stops.map(s => <option key={s} value={s} />)}</datalist>
        <label className="field">출발 시각<input type="time" value={editing.departAt} onChange={e => setEditing({ ...editing, departAt: e.target.value })} /></label>
        <label className="field">이동 요일<select value={editing.days.includes('weekend') ? 'daily' : 'weekday'} onChange={e => setEditing({ ...editing, days: e.target.value === 'daily' ? ['weekday', 'weekend', 'holiday', 'afterHoliday'] : ['weekday', 'afterHoliday'] })}><option value="weekday">평일</option><option value="daily">매일</option></select></label>
        {error && <p role="alert">{error}</p>}<Button block color="primary" type="submit">경로 저장</Button><p className="caption">직접 등록한 역 이름을 비교해요. 지도에서 검색하면 이동 구간도 함께 저장할 수 있어요.</p>
      </form>}
    </Popup>
  </div>;
}
