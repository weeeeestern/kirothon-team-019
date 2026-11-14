import { sampleGeneratedAt } from '@/data/provenance';
import { useEffect } from 'react';
import { Button, Tag, Toast } from 'antd-mobile';
import { useApp } from '@/state/AppState';
import { situationColor } from '@/theme/situation';
import { PageHeader } from '@/components/PageHeader';
import { KiroAvatar } from '@/components/KiroAvatar';
import type { Notice } from '@/engine';
function NoticeCard({ notice }: { notice: Notice }) {
  const { store, dispatch, celebrate } = useApp(); const t = situationColor(notice.situation); const fed = Object.hasOwn(store.feedback, notice.id);
  const max = Math.max(notice.baselineValue, notice.currentValue, 1);
  const report = store.reports.find(r => r.id === notice.anomalyId);
  const route = store.routes.find(r => r.id === notice.routeId);
  function feedback(value: 'helpful' | 'notNeeded') { if (fed) return; dispatch({ type: 'feedback', id: notice.id, value }); celebrate('joy'); Toast.show('피드백 고마워요. +1 P 적립했어요'); }
  return <article className="card notice-card"><div className="row between"><Tag style={{ '--background-color': t.bg, '--text-color': t.accent, '--border-color': 'transparent' }}>{t.label}</Tag><span className="caption">{notice.deliverAt} 알림 예정</span></div>
    <p className="caption">{route?.stops[0]} → {route?.stops.at(-1)} · {route?.departAt}</p><h2>{notice.what}</h2><p className="comparison-head" style={{ color: t.accent }}>{notice.delta}</p>
    <p className="caption">{notice.unit === '%' ? '혼잡도 비교' : '영향 신호 비교 · 시연용 지수 (실측 아님)'}</p>
    {[{ label: '평소', value: notice.baselineValue }, { label: '오늘', value: notice.currentValue }].map((r, i) => <div className="comparison-row" key={r.label}><span>{r.label}</span><div className="comparison-track"><div style={{ width: `${r.value / max * 100}%`, background: i ? t.accent : 'var(--pyeongso-neutral-bar)' }} /></div><strong>{Math.round(r.value)}{notice.unit}</strong></div>)}
    <section className="action-box" style={{ background: t.bg }}><p className="caption">이렇게 준비해요</p><strong>{notice.action}</strong></section>
    <p className="caption">{notice.reason}<br />{notice.learning ? '기준선을 학습 중이에요' : '안정된 기준선이에요'}<br />{notice.source === 'report' ? `시민 제보 · 확인 시뮬레이션 · ${report ? new Date(report.createdAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : '시각 미상'} KST` : `샘플 데이터 · 생성 ${sampleGeneratedAt} · 11.16 평일 시연`}</p>
    <div className="feedback-box"><p>이 알림이 도움이 되었나요?</p>{fed ? <p className="purple" role="status">피드백 반영됐어요 · +1 P</p> : <div className="row"><Button color="primary" size="small" onClick={() => feedback('helpful')}>도움이 됐어요</Button><Button size="small" onClick={() => feedback('notNeeded')}>필요 없었어요</Button></div>}</div>
  </article>;
}
export function NoticeDetail() {
  const { result, dispatch } = useApp();
  const ids = result.notices.map(n => n.id).join('|');
  useEffect(() => { if (ids) dispatch({ type: 'read', ids: ids.split('|') }); }, [ids, dispatch]);
  return <div className="page"><PageHeader title="내 경로 알림" subtitle="오늘, 알아두면 좋은 변화만 모았어요" />{!result.notices.length ? <section className="empty"><KiroAvatar size={220} /><h2>오늘은 알림이 없어요</h2><p>평소와 다를 때만 알려드려요.</p></section> : result.notices.map(n => <NoticeCard key={n.id} notice={n} />)}<p className="source-note">앱 안에서 보는 시연 알림이에요.<br />실제 푸시 알림은 전송하지 않아요.</p></div>;
}
