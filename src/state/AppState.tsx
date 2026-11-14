import { useState, useMemo, useReducer, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { runDay } from '@/engine';
import type { Anomaly, EngineResult, Situation } from '@/engine';
import { toAnomaly } from '@/features/reports/reportStore';
import { totalPoints } from '@/features/points/ledger';
import { dayKey } from '@/engine/utils';
import { initialStore, restoreStore, reducer, STORAGE_KEY } from './store';
import type { RemoteReport } from './store';
import { Toast } from 'antd-mobile';
import { reportsApi, isApiError } from '@/api';
import type { ApiErrorCode, PointReason } from '@/api';
import { routeKey } from '@/features/routes/route';

const POINT_LABELS: Record<PointReason, string> = { report: '동네 제보', helpful: '이웃에게 도움된 제보', feedback: '알림 피드백' };
const API_MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  invalid_input: '입력을 다시 확인해 주세요', unauthenticated: '로그인 상태를 확인하지 못했어요', not_found: '제보를 찾지 못했어요',
  self_confirm: '내가 쓴 제보는 확인할 수 없어요', route_mismatch: '같은 경로의 제보만 확인할 수 있어요', expired: '오늘 지난 제보는 확인할 수 없어요',
  duplicate: '이미 확인했어요', self_helpful: '내가 쓴 제보에는 도움됨을 누를 수 없어요', not_confirmed: '아직 확인이 모이지 않았어요',
};
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
  const remote = reportsApi.mode === 'remote';
  const [apiError, setApiError] = useState(false);
  async function call<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try { const v = await fn(); setApiError(false); return v; } catch (e) {
      const code = isApiError(e) ? e.code : 'connection';
      if (code === 'connection' || code === 'unknown') { setApiError(true); Toast.show('연결이 불안정해요. 잠시 뒤에 다시 해 주세요'); }
      else Toast.show(API_MESSAGES[code] ?? '요청을 처리하지 못했어요');
      return undefined;
    }
  }
  const routesRef = useRef(store.routes); routesRef.current = store.routes;
  const nowRef = useRef(now); nowRef.current = now;
  async function refresh() {
    if (!remote) return;
    await call(async () => {
      const entries = await reportsApi.myPoints();
      const items: Array<{ routeId: string; report: RemoteReport }> = [];
      for (const route of routesRef.current) {
        for (const r of await reportsApi.listToday(routeKey(route))) items.push({ routeId: route.id, report: { id: r.id, situation: r.situation, place: r.place, time: r.time, note: r.note, confirmations: r.confirmations, isMine: r.isMine } });
      }
      dispatch({ type: 'syncLedger', entries: [...entries].reverse().map(e => ({ id: e.id, amount: e.amount, reason: POINT_LABELS[e.reason] })) });
      dispatch({ type: 'syncRemote', items, now: nowRef.current.toISOString() });
    });
  }
  const routeIds = store.routes.map(r => r.id).join('|');
  const refreshRef = useRef(refresh); refreshRef.current = refresh;
  useEffect(() => {
    if (!remote) return;
    void refreshRef.current();
    const id = setInterval(() => void refreshRef.current(), 30000);
    return () => clearInterval(id);
  }, [remote, routeIds]);
  return <Ctx.Provider value={{ store, dispatch, result, points, mode, setMode, now, day, storageError, unread, celebration, celebrate, remote, apiError, call, refresh }}>{children}</Ctx.Provider>;
}
export { dayKey };
