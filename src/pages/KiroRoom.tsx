import { Button, Tabs, Toast } from 'antd-mobile';
import { KiroAvatar } from '@/components/KiroAvatar';
import { PageHeader } from '@/components/PageHeader';
import { LevelCard } from '@/components/LevelCard';
import { useApp } from '@/state/AppState';
import { canWear } from '@/state/store';
import { OUTFITS } from '@/features/points/ledger';
import type { Page } from '@/App';
import { DemoExperience } from '@/components/DemoExperience';
export function KiroRoom({ navigate }: { navigate: (p: Page) => void }) {
  const { store, dispatch, celebration, celebrate } = useApp();
  function wardrobe(limited: boolean) { return <div className="wardrobe-grid">{OUTFITS.filter(o => (o.level === 99) === limited).map(o => { const unlocked = canWear(store, o.id); const selected = store.outfit === o.id; return <button key={o.id} aria-label={`${o.label} ${selected ? '착용 중' : unlocked ? '보유' : '잠김'}`} className={`wardrobe-item ${selected ? 'selected' : ''}`} disabled={!unlocked} aria-pressed={selected} onClick={() => { dispatch({ type: 'wear', id: o.id }); celebrate(limited ? 'sparkle' : 'heart'); Toast.show(`${o.label} 아이템을 착용했어요`); }}><KiroAvatar size={64} outfit={o.id} motion="idle" /><strong>{o.label}</strong><small>{selected ? '착용 중' : unlocked ? '보유' : limited ? '오늘 마라톤 제보로 해금' : `Lv. ${o.level} 해금`}</small></button>; })}</div>; }
  return <div className="page"><PageHeader title="키로의 방" subtitle="함께 다닐수록, 조금씩 자라요" /><div className="room-hero"><KiroAvatar preferOutfit size={240} outfit={store.outfit} expression={celebration || 'joy'} motion={celebration ? 'unlock' : 'float'} /></div><LevelCard />
    <DemoExperience navigate={navigate} />
    <section className="section-title row between"><h3>키로의 옷장</h3>{store.outfit !== 'base' && <Button size="small" fill="none" onClick={() => dispatch({ type: 'wear', id: 'base' })}>착용 해제</Button>}</section>
    <Tabs><Tabs.Tab title="기본 옷장" key="base">{wardrobe(false)}</Tabs.Tab><Tabs.Tab title="한정판" key="limited">{wardrobe(true)}<p className="caption">당일 마라톤을 제보하면 전용 아이템을 받아요. 얻은 아이템은 다음 날에도 남아요.</p></Tabs.Tab></Tabs>
    <section className="card"><h3>작은 도움이 포인트가 돼요</h3><div className="reward-row"><span>변화를 제보하면</span><strong>+10 P</strong></div><div className="reward-row"><span>이웃이 도움됨을 누르면</span><strong>+5 P</strong></div><div className="reward-row"><span>알림에 피드백을 남기면</span><strong>+1 P</strong></div></section>
    <Button block onClick={() => navigate('eval')}>잠잠은 얼마나 조용할까요? · 평가 보기</Button>
    {store.ledger.length > 0 && <details className="demo-controls"><summary>포인트 내역</summary>{store.ledger.slice().reverse().map(e => <div className="reward-row" key={e.id}><span>{e.reason}</span><strong>+{e.amount} P</strong></div>)}</details>}
  </div>;
}
