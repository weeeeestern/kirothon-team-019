export interface PointEntry { id: string; amount: number; reason: string }
export function award(ledger: PointEntry[], entry: PointEntry): PointEntry[] {
  return ledger.some(e => e.id === entry.id) || !Number.isFinite(entry.amount) || entry.amount <= 0 ? ledger : [...ledger, entry];
}
export function totalPoints(ledger: PointEntry[]): number { return ledger.reduce((n, e) => n + e.amount, 0); }
export const LEVELS = [0, 20, 50, 100, 200];
export function levelFor(points: number): number { return LEVELS.filter(min => min <= points).length || 1; }
export const OUTFITS = [
  { id: 'base', label: '기본', level: 1 }, { id: 'hardhat', label: '안전모', level: 2 },
  { id: 'raincoat', label: '우비', level: 2 }, { id: 'mask', label: '마스크', level: 3 },
  { id: 'bandana', label: '머리띠', level: 3 }, { id: 'beanie', label: '비니', level: 3 },
  { id: 'phones', label: '헤드폰', level: 4 }, { id: 'glasses', label: '안경', level: 4 },
  { id: 'crown', label: '왕관', level: 5 }, { id: 'marathon26', label: '마라톤 제보자', level: 99 },
] as const;
