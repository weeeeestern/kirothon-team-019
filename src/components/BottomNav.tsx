import { Badge, SafeArea } from 'antd-mobile';
import { HomeOutlined, BellOutlined, FlagOutlined, SmileOutlined } from '@ant-design/icons';
import type { Page } from '@/App';
const items = [
  { id: 'home', title: '오늘', icon: <HomeOutlined /> },
  { id: 'notices', title: '알림', icon: <BellOutlined /> },
  { id: 'report', title: '제보', icon: <FlagOutlined /> },
  { id: 'kiro', title: '키로의 방', icon: <SmileOutlined /> },
] as const;
// antd-mobile's TabBar renders click-only divs. Native buttons preserve keyboard access.
export function BottomNav({ page, unread, navigate }: { page: Page; unread: number; navigate: (page: Page) => void }) {
  const active = page === 'routes' ? 'home' : page === 'eval' ? 'kiro' : page;
  return <nav className="bottom-nav" aria-label="메인 메뉴"><div className="nav-items">{items.map(item => <button key={item.id} aria-label={item.title} aria-current={active === item.id ? 'page' : undefined} className={`nav-button ${active === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}><Badge content={item.id === 'notices' && unread ? unread : undefined}><span className="nav-icon" aria-hidden="true">{item.icon}</span></Badge><span>{item.title}</span></button>)}</div><SafeArea position="bottom" /></nav>;
}
