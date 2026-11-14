import { ProgressBar } from 'antd-mobile';
import { LEVELS, levelFor } from '@/features/points/ledger';
import { useApp } from '@/state/AppState';
export function LevelCard() {
  const { points } = useApp(); const level = levelFor(points); const next = LEVELS[level]; const min = LEVELS[level - 1];
  return <section className="card brand"><div className="row between"><strong>Lv. {level} · {['새싹 이웃', '동네 탐험가', '경로 지킴이', '든든한 이웃', '우리 동네 영웅'][level - 1]}</strong><span className="purple">{points} P</span></div><ProgressBar percent={next ? (points - min) / (next - min) * 100 : 100} /><p className="caption">{next ? `${next - points} P 더 모으면 키로가 한 단계 자라요` : '가장 든든한 이웃이 되었어요'}</p></section>;
}
