import { Button } from 'antd-mobile';
import type { Page } from '@/App';
import { PageHeader } from '@/components/PageHeader';
import evaluation from '@/data/evaluation.json';
export function Eval({ navigate }: { navigate: (p: Page) => void }) {
  const e = evaluation;
  const metrics = [{ label: '평범한 날 알림', value: `${e.ordinaryDayNotices}건`, pass: e.ordinaryDayNotices === 0, target: '목표 0건' }, { label: '관련 이상 탐지율', value: `${Math.round(e.detectionRate * 100)}%`, pass: e.detectionRate >= .8, target: '목표 80% 이상' }, { label: '알림 감소율', value: `${Math.round(e.reductionVsFixed * 100)}%`, pass: e.reductionVsFixed >= .5, target: '목표 50% 이상' }, { label: '도움됨 비율', value: '미측정', pass: null, target: '실사용자 피드백 없음' }];
  return <div className="page"><Button fill="none" color="primary" onClick={() => navigate('kiro')}>‹ 키로의 방</Button><PageHeader title="조용함을 확인했어요" subtitle="합성 시나리오 기준 · 실제 서비스 성능이 아니에요" /><div className="metric-grid">{metrics.map(m => <section className="card" key={m.label}><p className="caption">{m.label}</p><div className="metric-number">{m.value}</div><p className="caption">{m.target}</p>{m.pass !== null && <span className="metric-status">{m.pass ? '목표 통과' : '목표 미달'}</span>}</section>)}</div>
  </div>;
}
