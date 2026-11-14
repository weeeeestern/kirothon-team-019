import { useState } from 'react';
import { Button, Dialog, Popup, Toast } from 'antd-mobile';
import type { Route } from '@/engine';
import type { Page } from '@/App';
import { useApp } from '@/state/AppState';
import { PageHeader } from '@/components/PageHeader';
import { validRoute } from '@/state/store';
import regions from '@/data/regions.json';
const fresh = (): Route => ({ id: crypto.randomUUID(), district: '강남구', stops: ['', ''], departAt: '08:00', days: ['weekday', 'afterHoliday'] });
export function Routes({ navigate }: { navigate: (p: Page) => void }) {
  const { store, dispatch } = useApp(); const [editing, setEditing] = useState<Route | null>(null); const [error, setError] = useState('');
  const region = regions.items.find(r => r.name === editing?.district);
  function save() { if (!editing || !validRoute(editing) || editing.stops[0] === editing.stops.at(-1)) { setError('서로 다른 출발·도착역과 출발 시각을 입력해 주세요.'); return; } dispatch({ type: 'route', route: { ...editing, stops: editing.stops.map(s => s.trim()) } }); setEditing(null); Toast.show('경로를 저장했어요'); }
  return <div className="page"><Button fill="none" color="primary" onClick={() => navigate('home')}>‹ 오늘로</Button><PageHeader title="내가 다니는 길" subtitle="위치 추적 없이, 등록한 경로만 살펴봐요" />
    {store.routes.map(r => <section className="card" key={r.id}><h3>{r.stops.join(' → ')}</h3><p>{r.district} · {r.departAt} 출발 · {r.days.includes('weekend') ? '매일' : '평일'}</p><div className="row"><Button size="small" onClick={() => { setEditing(r); setError(''); }}>수정</Button><Button size="small" fill="none" onClick={async () => { if (await Dialog.confirm({ content: '이 경로를 삭제할까요?', confirmText: '삭제해요', cancelText: '유지해요' })) dispatch({ type: 'deleteRoute', id: r.id }); }}>삭제</Button></div></section>)}
    {!store.routes.length && <p className="empty">아직 등록한 경로가 없어요.</p>}<Button block color="primary" onClick={() => { setEditing(fresh()); setError(''); }}>새 경로 등록</Button>
    <Popup visible={!!editing} onMaskClick={() => setEditing(null)} bodyStyle={{ borderTopLeftRadius: 'var(--adm-radius-l)', borderTopRightRadius: 'var(--adm-radius-l)', maxHeight: '90dvh', overflowY: 'auto' }}>
      {editing && <form className="page route-form" onSubmit={e => { e.preventDefault(); save(); }}><div className="row between"><h2>경로 설정</h2><Button fill="none" onClick={() => setEditing(null)}>닫기</Button></div>
        <label className="field">자치구<select value={editing.district} onChange={e => setEditing({ ...editing, district: e.target.value, stops: ['', ''] })}>{regions.items.map(r => <option key={r.name}>{r.name}</option>)}</select></label>
        <p className="caption">사용 가능한 샘플 신호: {region?.signals.join(' · ')}</p>
        <label className="field">출발역<input list="route-stops" value={editing.stops[0]} maxLength={40} onChange={e => setEditing({ ...editing, stops: [e.target.value, ...editing.stops.slice(1)] })} placeholder="예: 강남" /></label>
        <label className="field">도착역<input list="route-stops" value={editing.stops.at(-1)} maxLength={40} onChange={e => setEditing({ ...editing, stops: [...editing.stops.slice(0, -1), e.target.value] })} placeholder="예: 선릉" /></label>
        <datalist id="route-stops">{region?.stops.map(s => <option key={s} value={s} />)}</datalist>
        <label className="field">출발 시각<input type="time" value={editing.departAt} onChange={e => setEditing({ ...editing, departAt: e.target.value })} /></label>
        <label className="field">이동 요일<select value={editing.days.includes('weekend') ? 'daily' : 'weekday'} onChange={e => setEditing({ ...editing, days: e.target.value === 'daily' ? ['weekday', 'weekend', 'holiday', 'afterHoliday'] : ['weekday', 'afterHoliday'] })}><option value="weekday">평일</option><option value="daily">매일</option></select></label>
        {error && <p role="alert">{error}</p>}<Button block color="primary" type="submit">경로 저장</Button><p className="caption">직접 등록한 역 이름을 비교해요. 길찾기는 제공하지 않아요.</p>
      </form>}
    </Popup>
  </div>;
}
