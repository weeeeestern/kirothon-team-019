import { Tag } from 'antd-mobile';
import { useApp } from '@/state/AppState';
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { points } = useApp();
  return <header className="page-header"><div className="row between"><h1>{title}</h1><span className="point-badge">{points} P</span></div>{subtitle && <p>{subtitle}</p>}<Tag className="sample-tag">샘플 데이터 · 로컬 데모</Tag></header>;
}
