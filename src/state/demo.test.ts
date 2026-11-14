import { describe, expect, it } from 'vitest';
import { runDay } from '../engine';
import { levelFor, totalPoints } from '../features/points/ledger';
import type { CitizenReport } from '../features/reports/reportStore';
import { DEMO_ANOMALIES, DEMO_POINT_PREFIX, DEMO_ROUTE } from './demo';
import { canWear, initialStore, reducer, restoreStore } from './store';
import type { Store } from './store';

describe('reversible demo data', () => {
  it('levels a new user to 4, unlocks outfits and stays idempotent after restoring storage', () => {
    const before = initialStore();
    const seeded = reducer(before, { type: 'loadDemo' });
    expect(totalPoints(seeded.ledger)).toBe(100);
    expect(levelFor(totalPoints(seeded.ledger))).toBe(4);
    expect(canWear(seeded, 'phones')).toBe(true);
    expect(canWear(seeded, 'crown')).toBe(false);
    expect(seeded.demoEnabled).toBe(true);
    expect(seeded.routes.filter(route => route.id === DEMO_ROUTE.id)).toHaveLength(1);
    expect(seeded.routes.filter(route => route.id !== DEMO_ROUTE.id)).toEqual(before.routes);
    expect(before.ledger).toEqual([]);

    const restored = restoreStore(JSON.stringify(seeded));
    expect(restored).toEqual(seeded);
    expect(reducer(restored, { type: 'loadDemo' })).toEqual(seeded);
    expect(seeded.ledger.every(entry => entry.id.startsWith(DEMO_POINT_PREFIX))).toBe(true);
  });

  it('clears only seeded records while retaining user routes, reports, feedback and earned rewards', () => {
    const base = initialStore();
    const report: CitizenReport = {
      id: 'user-report', author: 'me', routeId: 'my-commute', situation: 'marathon',
      place: '강남', time: '08:00', note: '직접 작성한 제보',
      createdAt: '2026-11-16T08:00:00+09:00', confirmations: [], helpfulUsers: [],
    };
    const before: Store = {
      ...base,
      routes: [{ ...base.routes[0], id: 'my-commute', departAt: '09:10' }],
      reports: [report],
      ledger: [{ id: 'report:user-report', amount: 10, reason: '동네 제보' }, { id: 'feedback:user-notice', amount: 1, reason: '알림 피드백' }],
      feedback: { 'user-notice': 'helpful' }, read: ['user-notice'],
      threshold: 1.4, unlocked: ['marathon26'], outfit: 'marathon26',
    };
    const seeded = reducer(before, { type: 'loadDemo' });
    expect(totalPoints(seeded.ledger)).toBe(111);
    const cleared = reducer(restoreStore(JSON.stringify(seeded)), { type: 'clearDemo' });
    expect(cleared.demoEnabled).toBe(false);
    for (const field of ['routes', 'reports', 'ledger', 'feedback', 'read', 'threshold', 'unlocked', 'outfit'] as const) {
      expect(cleared[field]).toEqual(before[field]);
    }
    expect(restoreStore(JSON.stringify(cleared))).toEqual(cleared);
    expect(reducer(cleared, { type: 'clearDemo' })).toEqual(cleared);
  });

  it('removes demo-only wardrobe access without unequipping an independently earned outfit', () => {
    let temporary = reducer(initialStore(), { type: 'loadDemo' });
    temporary = reducer(temporary, { type: 'wear', id: 'phones' });
    expect(temporary.outfit).toBe('phones');
    const cleared = reducer(temporary, { type: 'clearDemo' });
    expect(cleared.outfit).toBe('base');
    expect(canWear(cleared, 'phones')).toBe(false);

    const earned: Store = {
      ...initialStore(), outfit: 'phones',
      ledger: Array.from({ length: 10 }, (_, i) => ({ id: `earned:${i}`, amount: 10, reason: '동네 제보' })),
    };
    const earnedAfterReset = reducer(reducer(earned, { type: 'loadDemo' }), { type: 'clearDemo' });
    expect(earnedAfterReset.outfit).toBe('phones');
    expect(totalPoints(earnedAfterReset.ledger)).toBe(100);
  });

  it('restores older stores and rejects a malformed demo flag without losing valid compatibility', () => {
    const older = initialStore();
    delete older.demoEnabled;
    expect(restoreStore(JSON.stringify(older))).toEqual(older);
    expect(restoreStore(JSON.stringify({ ...older, demoEnabled: 'true', threshold: 2 }))).toEqual(initialStore());
  });

  it('produces three explicitly synthetic notices with the normal engine even at the highest threshold', () => {
    const result = runDay([DEMO_ROUTE], DEMO_ANOMALIES, { threshold: 3, feedbackCounts: { helpful: 0, notNeeded: 0 } }, new Date('2026-11-16T08:00:00+09:00'));
    expect(result.notices).toHaveLength(3);
    expect(new Set(result.notices.map(notice => notice.id)).size).toBe(3);
    expect(result.notices.every(notice => notice.source === 'synthetic' && notice.routeId === DEMO_ROUTE.id)).toBe(true);
    expect(result.ordinariness).toBeLessThan(100);
  });

  it('makes demo notices unread again on a fresh demo run without clearing other read history', () => {
    const notices = runDay([DEMO_ROUTE], DEMO_ANOMALIES, { threshold: 3, feedbackCounts: { helpful: 0, notNeeded: 0 } }, new Date('2026-11-16T08:00:00+09:00')).notices;
    let state = reducer(initialStore(), { type: 'loadDemo' });
    state = reducer(state, { type: 'read', ids: ['user-notice', ...notices.map(notice => notice.id)] });
    state = reducer(state, { type: 'clearDemo' });
    state = reducer(restoreStore(JSON.stringify(state)), { type: 'loadDemo' });
    expect(state.read).toContain('user-notice');
    expect(notices.filter(notice => !state.read.includes(notice.id))).toHaveLength(3);
  });
});
