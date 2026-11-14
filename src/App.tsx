import './react19-compat';
import { useState, useEffect } from 'react';
import { ConfigProvider, SafeArea } from 'antd-mobile';
import koKR from 'antd-mobile/es/locales/ko-KR';
import { BottomNav } from '@/components/BottomNav';
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
    <BottomNav page={page} unread={unread} navigate={navigate} />
  </div>;
}
export default function App() { return <ConfigProvider locale={koKR}><AppState><AppInner /></AppState></ConfigProvider>; }
