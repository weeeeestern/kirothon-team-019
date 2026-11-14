import { Tag, NoticeBar } from 'antd-mobile';
import { useApp } from '@/state/AppState';
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { points, remote, apiError } = useApp();
  return <header className="page-header"><div className="row between"><h1>{title}</h1><span className="point-badge">{points} P</span></div>{subtitle && <p>{subtitle}</p>}{apiError && <NoticeBar color="alert" content="연결이 불안정해요. 잠시 뒤에 다시 시도해 주세요" />}<Tag className="sample-tag">{remote ? '샘플 데이터 · 서버 연결' : '샘플 데이터 · 로컬 데모'}</Tag></header>;
}
