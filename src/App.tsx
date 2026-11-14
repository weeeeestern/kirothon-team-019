import { useState, useEffect } from 'react';
import { ConfigProvider, SafeArea, TabBar } from 'antd-mobile';
import koKR from 'antd-mobile/es/locales/ko-KR';
import { HomeOutlined, BellOutlined, FlagOutlined, SmileOutlined } from '@ant-design/icons';
import { AppState, useApp } from '@/state/AppState';
import { Home } from '@/pages/Home';
import { NoticeDetail } from '@/pages/NoticeDetail';
import { Report } from '@/pages/Report';
import { KiroRoom } from '@/pages/KiroRoom';
import { Routes } from '@/pages/Routes';
import { Eval } from '@/pages/Eval';
import '@/theme/theme.css';
export type Page = 'home' | 'notices' | 'report' | 'kiro' | 'routes' | 'eval';
const PAGES: Page[] = ['home', 'notices', 'report', 'kiro', 'routes', 'eval'];
function currentPage(): Page { const p = location.hash.slice(1) as Page; return PAGES.includes(p) ? p : 'home'; }
function AppInner() {
  const [page, setPage] = useState<Page>(currentPage); const { unread, storageError } = useApp();
  useEffect(() => { const onHash = () => { setPage(currentPage()); window.scrollTo(0, 0); }; window.addEventListener('hashchange', onHash); return () => window.removeEventListener('hashchange', onHash); }, []);
  function navigate(p: Page) { location.hash = p; }
  return <div className="app"><SafeArea position="top" />{storageError && <div role="status" className="storage-message">저장 공간을 사용할 수 없어 이번 화면에서만 유지돼요.</div>}
    <main id="main-content">
      {page === 'home' && <Home navigate={navigate} />}{page === 'notices' && <NoticeDetail />}
      {page === 'report' && <Report />}{page === 'kiro' && <KiroRoom navigate={navigate} />}
      {page === 'routes' && <Routes navigate={navigate} />}{page === 'eval' && <Eval navigate={navigate} />}
    </main>
    <nav className="bottom-nav" aria-label="메인 메뉴"><TabBar activeKey={page === 'routes' ? 'home' : page === 'eval' ? 'kiro' : page} onChange={p => navigate(p as Page)}>
      <TabBar.Item key="home" icon={<HomeOutlined />} title="오늘" />
      <TabBar.Item key="notices" icon={<BellOutlined />} title="알림" badge={unread || undefined} />
      <TabBar.Item key="report" icon={<FlagOutlined />} title="제보" />
      <TabBar.Item key="kiro" icon={<SmileOutlined />} title="키로의 방" />
    </TabBar><SafeArea position="bottom" /></nav>
  </div>;
}
export default function App() { return <ConfigProvider locale={koKR}><AppState><AppInner /></AppState></ConfigProvider>; }
