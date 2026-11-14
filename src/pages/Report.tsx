import { useState } from 'react';
import { Button, Selector, Toast, Tag } from 'antd-mobile';
import { useApp } from '@/state/AppState';
import { PageHeader } from '@/components/PageHeader';
import { KiroAvatar } from '@/components/KiroAvatar';
import { REPORT_TYPES, isConfirmed, validReportInput } from '@/features/reports/reportStore';
import type { ReportType } from '@/features/reports/reportStore';
import { situationColor } from '@/theme/situation';
import { dayKey } from '@/engine/utils';
import type { Page } from '@/App';
export function Report({ navigate }: { navigate: (page: Page) => void }) {
  const { store, dispatch, now, celebration, celebrate, result } = useApp();
  const [situation, setSituation] = useState<ReportType | undefined>();
  const [routeId, setRouteId] = useState(store.routes[0]?.id ?? '');
  const route = store.routes.find(r => r.id === routeId);
  const [place, setPlace] = useState(''); const [time, setTime] = useState('08:00'); const [note, setNote] = useState(''); const [error, setError] = useState('');
  function submit() {
    const input = { routeId, situation: situation!, place: place.trim(), time, note: note.trim() };
    if (!situation || !validReportInput(input) || !route) { setError('상황, 경로, 장소, 시각을 모두 입력해 주세요.'); return; }
    if (!route.stops.some(s => s.replace(/역$/, '') === place.trim().replace(/역$/, ''))) { setError('선택한 경로에 있는 역이나 정류장을 입력해 주세요.'); return; }
    dispatch({ type: 'report', report: { ...input, id: crypto.randomUUID(), author: 'me', createdAt: now.toISOString(), confirmations: [], helpfulUsers: [] }, now: now.toISOString() });
    setSituation(undefined); setPlace(''); setNote(''); setError(''); celebrate('proud'); Toast.show('제보를 등록했어요. +10 P 적립했어요');
  }
  return <div className="page"><PageHeader title="동네를 돕는 한마디" subtitle="내가 본 작은 변화가, 이웃의 여유가 돼요" />
    {celebration === 'proud' && <div className="mini-celebration"><KiroAvatar size={120} expression="proud" motion="hop" /><span>고마워요! +10 P</span></div>}
    {!store.routes.length && <section className="card"><h3>먼저 내 경로를 등록해 주세요</h3><p>같은 길을 다니는 이웃에게 소식을 전할 수 있어요.</p><Button block color="primary" onClick={() => navigate('routes')}>경로 등록하기</Button></section>}
    {store.routes.length > 0 && <form onSubmit={e => { e.preventDefault(); submit(); }}><fieldset><legend>어떤 변화인가요?</legend><Selector columns={3} options={REPORT_TYPES.map(value => ({ value, label: situationColor(value).label }))} value={situation ? [situation] : []} onChange={v => setSituation(v[0])} /></fieldset>
      <label className="field">내 경로<select value={routeId} onChange={e => { setRouteId(e.target.value); setPlace(''); }}><option value="">경로를 선택해 주세요</option>{store.routes.map(r => <option value={r.id} key={r.id}>{r.stops[0]} → {r.stops.at(-1)}</option>)}</select></label>
      <label className="field">장소<input value={place} maxLength={60} list="report-stops" onChange={e => setPlace(e.target.value)} placeholder="예: 강남" /></label><datalist id="report-stops">{route?.stops.map(s => <option value={s} key={s} />)}</datalist>
      <label className="field">발생 시각<input type="time" value={time} onChange={e => setTime(e.target.value)} /></label>
      <label className="field">한 줄 설명<textarea value={note} maxLength={100} rows={3} onChange={e => setNote(e.target.value)} placeholder="어떤 상황인지 간단히 알려주세요" /><span className="counter">{note.length} / 100</span></label>
      {error && <p role="alert">{error}</p>}<Button block type="submit" color="primary" disabled={!store.routes.length}>제보하고 +10 P 받기</Button>
      <p className="caption">같은 경로의 서로 다른 이웃 2명이 확인하면 신뢰도가 올라가요. 실제 다중 사용자 대신 아래 시연 버튼을 사용해요.</p>
    </form>}
    <h3 className="section-title">내가 전한 소식 <span className="purple">{store.reports.length}</span></h3>
    {!store.reports.length && <div className="card"><p>아직 제보가 없어요. 첫 소식을 전해 보세요.</p></div>}
    {store.reports.map(r => { const expired = dayKey(new Date(r.createdAt)) !== dayKey(now); const confirmed = isConfirmed(r); const routeExists = store.routes.some(route => route.id === r.routeId); const sent = result.notices.some(n => n.anomalyId === r.id); return <article className="card" key={r.id}>
      <div className="row between"><strong>{r.place} · {situationColor(r.situation).label}</strong><Tag color={confirmed ? 'success' : 'default'}>{expired ? '만료' : confirmed ? '확인됨' : '검증 대기'}</Tag></div><p>{r.note || '한 줄 설명 없이 등록했어요.'}</p><p className="caption">{r.time} · 확인 {r.confirmations.length}/2명 · {dayKey(new Date(r.createdAt))}</p>
      {!routeExists && <p className="caption">삭제된 경로의 제보예요. 기록과 적립 포인트는 남아 있어요.</p>}
      {!expired && routeExists && <div className="simulation"><p className="caption">같은 경로 이웃 · 시뮬레이션</p><div className="row">{['이웃 A', '이웃 B'].map(user => <Button size="small" key={user} disabled={r.confirmations.includes(user)} onClick={() => { dispatch({ type: 'confirm', id: r.id, user, routeId: r.routeId, now: now.toISOString() }); Toast.show('이웃의 확인을 반영했어요'); }}>{user} 확인</Button>)}</div>
        {confirmed && <><p className="caption">{sent ? '내 경로에 영향이 있어 알림을 만들었어요.' : '신뢰도는 확인됐어요. 오늘의 경로·시각·영향도 조건을 만족할 때 알림을 만들어요.'}</p>{sent && <Button size="small" disabled={r.helpfulUsers.includes('이웃 A')} onClick={() => { dispatch({ type: 'helpful', id: r.id, user: '이웃 A', routeId: r.routeId, now: now.toISOString() }); celebrate('proud'); Toast.show('이웃에게 도움이 됐어요. +5 P'); }}>이웃 A 도움됨 {r.helpfulUsers.includes('이웃 A') ? '반영됨' : '+5 P'}</Button>}</>}
      </div>}
    </article>; })}
  </div>;
}
