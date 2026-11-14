import { useState, useMemo, useReducer, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { runDay } from '@/engine';
import type { Anomaly, EngineResult, Situation } from '@/engine';
import { toAnomaly } from '@/features/reports/reportStore';
import { totalPoints } from '@/features/points/ledger';
import { dayKey } from '@/engine/utils';
import { initialStore, restoreStore, reducer, STORAGE_KEY } from './store';
import anomaliesRaw from '@/data/synthetic/anomalies.json';
import { DEMO_ANOMALIES, DEMO_ROUTE } from './demo';

import { Ctx } from './context';
import type { DemoMode } from './context';
export { useApp } from './context';
export type { DemoMode } from './context';

export function AppState({ children }: { children: ReactNode }) {
  const [store, dispatch] = useReducer(reducer, undefined, () => { try { return restoreStore(localStorage.getItem(STORAGE_KEY)); } catch { return initialStore(); } });
  const [storageError, setStorageError] = useState(false);
  const [mode, setMode] = useState<DemoMode>(store.demoEnabled ? 'showcase' : 'auto');
  const [now, setNow] = useState(() => new Date());
  const [celebration, celebrate] = useState('');
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 30000); return () => clearInterval(id); }, []);
  useEffect(() => { if (!celebration) return; const id = setTimeout(() => celebrate(''), 2500); return () => clearTimeout(id); }, [celebration]);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); setStorageError(false); } catch { setStorageError(true); } }, [store]);
  // A fixed, disclosed weekday keeps the scenario reproducible on weekends.
  const day = useMemo(() => new Date('2026-11-16T08:00:00+09:00'), []);
  const result = useMemo(() => {
    const sample: Anomaly[] = ['auto', 'showcase', 'quiet'].includes(mode) ? [] : [{ ...anomaliesRaw.items[0], id: `demo-${mode}`, situation: mode as Exclude<Situation, 'ordinary'>, timing: ['construction', 'marathon', 'strike'].includes(mode) ? 'scheduled' : 'sudden', value: 120, startsAt: '07:30', endsAt: '08:30', source: 'synthetic' }];
    // Explicit scenario previews always use the disclosed sample commute, so a
    // user's route edits cannot make the selected scenario silently disappear.
    const demo = runDay([DEMO_ROUTE], sample, { threshold: store.threshold, feedbackCounts: { helpful: 0, notNeeded: 0 } }, day);
    // Reports use the actual Seoul date and expire at midnight. The demo day never extends their lifetime.
    const reported = runDay(store.routes, mode === 'auto' ? store.reports.flatMap(r => { const a = toAnomaly(r, now); return a ? [a] : []; }) : [], { threshold: store.threshold, feedbackCounts: { helpful: 0, notNeeded: 0 } }, now);
    const showcase = runDay(mode === 'showcase' && store.demoEnabled ? store.routes.filter(r => r.id === DEMO_ROUTE.id) : [], DEMO_ANOMALIES, { threshold: store.threshold, feedbackCounts: { helpful: 0, notNeeded: 0 } }, day);
    const notices = [...demo.notices, ...reported.notices, ...showcase.notices].sort((a, b) => b.impact - a.impact);
    return { notices, ordinariness: Math.min(demo.ordinariness, reported.ordinariness, showcase.ordinariness), situation: notices[0]?.situation ?? 'ordinary' } as EngineResult;
  }, [mode, store.routes, store.reports, store.threshold, store.demoEnabled, day, now]);
  const lastSituation = useRef(result.situation);
  useEffect(() => {
    if (result.situation !== 'ordinary' && lastSituation.current !== result.situation) celebrate('surprise');
    lastSituation.current = result.situation;
  }, [result.situation]);
  const points = totalPoints(store.ledger);
  const unread = result.notices.filter(n => !store.read.includes(n.id)).length;
  return <Ctx.Provider value={{ store, dispatch, result, points, mode, setMode, now, day, storageError, unread, celebration, celebrate }}>{children}</Ctx.Provider>;
}
export { dayKey };
