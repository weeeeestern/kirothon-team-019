import type { Notice } from './types';

export function computeOrdinariness(notices: Notice[]): number {
  if (notices.length === 0) return 100;
  const max = Math.max(...notices.map(n => n.impact));
  return Math.max(0, Math.round(100 - Math.min(100, (max / 10) * 100)));
}
