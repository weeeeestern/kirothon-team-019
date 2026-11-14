import { Button, Selector } from 'antd-mobile';
import { BellOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useApp } from '@/state/AppState';
import type { DemoMode } from '@/state/AppState';
import type { Page } from '@/App';
import { situationColor } from '@/theme/situation';
import { KiroAvatar } from '@/components/KiroAvatar';
import { LevelCard } from '@/components/LevelCard';
import { dayKey } from '@/engine/utils';

export function Home({ navigate }: { navigate: (p: Page) => void }) {
  const { result, store, mode, setMode, now, day, unread, celebration } = useApp();
  const quiet = result.notices.length === 0; const theme = situationColor(result.situation);
  const override = new URLSearchParams(location.search).get('now');
  const hour = override && /^([01]\d|2[0-3]):[0-5]\d$/.test(override) ? Number(override.slice(0, 2)) : Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', hour12: false }).format(now));
  return <div className="page home-page">
    <header className="row between"><div><div className="eyebrow">조용한 하루의 시작</div><h1 className="wordmark">잠잠<span>●</span></h1></div><button className="icon-button" aria-label={`알림 ${unread}건 보기`} onClick={() => navigate('notices')}><BellOutlined />{unread > 0 && <span className="notification-dot" />}</button></header>
    <section className="hero"><p className="caption">평소와 다른 날에만, 키로가 알려줘요</p><h2>{quiet ? <>오늘도, 평소처럼<br />다녀오세요.</> : <>내 경로에<br />작은 변화가 있어요.</>}</h2>
      <KiroAvatar situation={result.situation} expression={celebration || (hour >= 23 || hour < 6 ? 'sleep' : undefined)} size={quiet ? 280 : 260} />
      <div className="score" style={{ color: theme.accent }}>{result.ordinariness}<span> / 100</span></div><p className="caption">오늘 평범도 <span className="sample-inline">샘플 데이터</span></p>
    </section>
    <section className="card quiet-card" style={{ borderColor: theme.accent + '44' }}><div className="row"><span className="status-dot" style={{ background: quiet ? 'var(--pyeongso-success)' : theme.accent }} /><strong>{quiet ? '알림을 쉬고 있어요' : result.notices[0].what}</strong></div><p>{quiet ? '내 경로에 큰 변화가 없어요. 평소와 다를 때만 알려드릴게요.' : result.notices[0].action}</p>{!quiet && <Button size="small" fill="none" color="primary" onClick={() => navigate('notices')}>변화 자세히 보기 <ArrowRightOutlined /></Button>}</section>
    <div className="section-title row between"><h3>내가 다니는 길</h3><Button size="small" fill="none" color="primary" onClick={() => navigate('routes')}>경로 관리</Button></div>
    {store.routes.length ? store.routes.map(r => <button className="route-pill" key={r.id} onClick={() => navigate('routes')}><span>{r.stops[0]} → {r.stops.at(-1)}</span><span className="caption">{r.departAt} <ArrowRightOutlined /></span></button>) : <div className="card"><p>등록한 경로가 없어요.</p><Button block color="primary" onClick={() => navigate('routes')}>첫 경로 등록하기</Button></div>}
    {quiet && <LevelCard />}
    <details className="demo-controls"><summary>샘플 시나리오 바꾸기</summary><p className="caption">{dayKey(day)} 평일 시나리오예요. 실제 교통 상황이 아니에요.</p><Selector columns={3} value={[mode]} options={[{ label: '평범한 날', value: 'quiet' }, { label: '혼잡', value: 'congestion' }, { label: '공사', value: 'construction' }, { label: '비', value: 'rain' }, { label: '미세먼지', value: 'dust' }, { label: '마라톤', value: 'marathon' }, { label: '파업·집회', value: 'strike' }]} onChange={v => v[0] && setMode(v[0] as DemoMode)} /><p className="caption">강남 · 07:30–08:30 신호를 내 경로와 비교해요.</p></details>
    <p className="source-note">합성 데이터 기준 · 수집 2026.11.14<br />위치 권한 없이, 등록한 경로만 살펴봐요.</p>
  </div>;
}
