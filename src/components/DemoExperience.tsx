import { useEffect } from 'react';
import { Button } from 'antd-mobile';
import type { Page } from '@/App';
import { useApp } from '@/state/AppState';
import { DEMO_ROUTE } from '@/state/demo';

export function DemoExperience({ navigate }: { navigate: (page: Page) => void }) {
  const { store, dispatch, setMode } = useApp();
  useEffect(() => {
    const url = new URL(location.href);
    if (url.searchParams.get('demo') !== '1') return;
    dispatch({ type: 'loadDemo' });
    setMode('showcase');
    url.searchParams.delete('demo');
    history.replaceState(history.state, '', url);
  }, [dispatch, setMode]);
  function load() { dispatch({ type: 'loadDemo' }); setMode('showcase'); }
  return <section className="card" aria-label="시연 데이터">
    <h3>{store.demoEnabled ? '시연 데이터로 둘러보고 있어요' : '키로의 성장을 먼저 만나봐요'}</h3>
    <p className="caption">혼잡·비·공사 알림 3개와 100 P를 추가해요. 처음 시작하면 Lv.4까지 자라요. 실제 교통 상황이나 적립 실적은 아니에요.</p>
    {store.demoEnabled ? <>
      {store.routes.some(route => route.id === DEMO_ROUTE.id)
        ? <Button block color="primary" onClick={() => { setMode('showcase'); navigate('notices'); }}>시연 알림 보기</Button>
        : <Button block color="primary" onClick={load}>시연 경로 다시 추가</Button>}
      <Button block fill="none" onClick={() => { dispatch({ type: 'clearDemo' }); setMode('auto'); }}>시연 데이터 지우기</Button>
    </> : <Button block color="primary" onClick={load}>알림·레벨업 체험하기</Button>}
  </section>;
}
