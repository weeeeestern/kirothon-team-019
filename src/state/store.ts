import type { Route } from '../engine/types';
import { DEFAULT_THRESHOLD, updateThreshold } from '../engine/threshold';
import { dayKey } from '../engine/utils';
import { routeError } from '../features/routes/route';
import { validReportInput, confirmReport, isConfirmed, REPORT_TYPES } from '../features/reports/reportStore';
import type { CitizenReport } from '../features/reports/reportStore';
import { award, totalPoints, levelFor, OUTFITS } from '../features/points/ledger';
import type { PointEntry } from '../features/points/ledger';
import routesRaw from '../data/synthetic/routes.json';
import { DEMO_POINT_PREFIX, DEMO_ROUTE } from './demo';

export const STORAGE_KEY = 'jamjam.v1';
export type Feedback = 'helpful' | 'notNeeded';
export interface Store {
  version: 1; routes: Route[]; threshold: number; feedback: Record<string, Feedback>;
  reports: CitizenReport[]; ledger: PointEntry[]; read: string[]; outfit: string; unlocked: string[];
  demoEnabled?: boolean;
}
export function initialStore(): Store {
  return { version: 1, routes: structuredClone(routesRaw.items) as Route[], threshold: DEFAULT_THRESHOLD, feedback: {}, reports: [], ledger: [], read: [], outfit: 'base', unlocked: [] };
}
export function validRoute(r: Route): boolean {
  return routeError(r) === null;
}
export function restoreStore(raw: string | null): Store {
  try {
    const s = JSON.parse(raw ?? 'null') as Store;
    if (!s || s.version !== 1 || !Array.isArray(s.routes) || !s.routes.every(validRoute) || !Number.isFinite(s.threshold) || s.threshold < .5 || s.threshold > 3) return initialStore();
    if (s.demoEnabled !== undefined && typeof s.demoEnabled !== 'boolean') return initialStore();
    if (!s.feedback || Array.isArray(s.feedback) || typeof s.feedback !== 'object' || !Object.values(s.feedback).every(v => v === 'helpful' || v === 'notNeeded')) return initialStore();
    const strings = (a: unknown): a is string[] => Array.isArray(a) && a.every(x => typeof x === 'string');
    if (!strings(s.read) || !strings(s.unlocked)) return initialStore();
    if (!Array.isArray(s.ledger) || !s.ledger.every(e => e && typeof e.id === 'string' && [1, 5, 10].includes(e.amount) && typeof e.reason === 'string') || new Set(s.ledger.map(e => e.id)).size !== s.ledger.length) return initialStore();
    if (!Array.isArray(s.reports) || !s.reports.every(r => r && typeof r.id === 'string' && typeof r.author === 'string' && typeof r.place === 'string' && typeof r.note === 'string' && REPORT_TYPES.includes(r.situation) && validReportInput(r) && strings(r.confirmations) && strings(r.helpfulUsers) && Number.isFinite(Date.parse(r.createdAt)))) return initialStore();
    return typeof s.outfit === 'string' && OUTFITS.some(o => o.id === s.outfit) ? s : { ...s, outfit: 'base' };
  } catch { return initialStore(); }
}
export function canWear(s: Store, id: string): boolean {
  const item = OUTFITS.find(o => o.id === id);
  return !!item && (levelFor(totalPoints(s.ledger)) >= item.level || s.unlocked.includes(id));
}
export type Action =
  | { type: 'loadDemo' | 'clearDemo' }
  | { type: 'route'; route: Route }
  | { type: 'deleteRoute'; id: string }
  | { type: 'feedback'; id: string; value: Feedback }
  | { type: 'report'; report: CitizenReport; now: string }
  | { type: 'confirm' | 'helpful'; id: string; user: string; routeId: string; now: string }
  | { type: 'read'; ids: string[] }
  | { type: 'wear'; id: string }
  | { type: 'syncLedger'; entries: PointEntry[] }
  | { type: 'syncRemote'; items: Array<{ routeId: string; report: RemoteReport }>; now: string };
/** 서버 제보 한 건(remote 모드). 확인한 사용자 ID는 받지 않고 수만 받는다. */
export interface RemoteReport { id: string; situation: CitizenReport['situation']; place: string; time: string; note: string; confirmations: number; isMine: boolean }
export function reducer(s: Store, a: Action): Store {
  switch (a.type) {
    case 'loadDemo': {
      if (s.demoEnabled && s.routes.some(r => r.id === DEMO_ROUTE.id)) return s;
      let ledger = s.ledger;
      for (let i = 0; i < 10; i++) ledger = award(ledger, { id: `${DEMO_POINT_PREFIX}${i}`, amount: 10, reason: '시연 포인트' });
      return { ...s, demoEnabled: true, ledger,
        routes: s.routes.some(r => r.id === DEMO_ROUTE.id) ? s.routes : [...s.routes, structuredClone(DEMO_ROUTE)],
        read: s.read.filter(id => !id.includes(`:${DEMO_ROUTE.id}:`)),
      };
    }
    case 'clearDemo': {
      const next = { ...s, demoEnabled: false,
        routes: s.routes.filter(r => r.id !== DEMO_ROUTE.id),
        ledger: s.ledger.filter(entry => !entry.id.startsWith(DEMO_POINT_PREFIX)),
      };
      return { ...next, outfit: canWear(next, next.outfit) ? next.outfit : 'base' };
    }
    case 'route': {
      if (!validRoute(a.route)) return s;
      const route = { ...a.route, stops: a.route.stops.map(stop => stop.trim()) };
      return { ...s, routes: s.routes.some(r => r.id === route.id) ? s.routes.map(r => r.id === route.id ? route : r) : [...s.routes, route] };
    }
    case 'deleteRoute': return { ...s, routes: s.routes.filter(r => r.id !== a.id) };
    case 'feedback': return Object.hasOwn(s.feedback, a.id) ? s : { ...s, threshold: updateThreshold(s.threshold, a.value), feedback: { ...s.feedback, [a.id]: a.value }, ledger: award(s.ledger, { id: `feedback:${a.id}`, amount: 1, reason: '알림 피드백' }) };
    case 'report': {
      if (!validReportInput(a.report) || !s.routes.some(r => r.id === a.report.routeId) || s.reports.some(r => r.id === a.report.id)) return s;
      const limited = a.report.situation === 'marathon' && dayKey(new Date(a.report.createdAt)) === dayKey(new Date(a.now));
      return { ...s, reports: [a.report, ...s.reports], ledger: award(s.ledger, { id: `report:${a.report.id}`, amount: 10, reason: '동네 제보' }), unlocked: limited ? [...new Set([...s.unlocked, 'marathon26'])] : s.unlocked };
    }
    case 'confirm': return { ...s, reports: s.reports.map(r => r.id === a.id ? confirmReport(r, a.user, a.routeId, new Date(a.now)) : r) };
    case 'helpful': {
      const r = s.reports.find(r => r.id === a.id);
      if (!r || !isConfirmed(r) || r.author === a.user || r.helpfulUsers.includes(a.user) || r.routeId !== a.routeId || dayKey(new Date(r.createdAt)) !== dayKey(new Date(a.now))) return s;
      return { ...s, reports: s.reports.map(r => r.id === a.id ? { ...r, helpfulUsers: [...r.helpfulUsers, a.user] } : r), ledger: award(s.ledger, { id: `helpful:${a.id}:${a.user}`, amount: 5, reason: '이웃에게 도움된 제보' }) };
    }
    case 'read': return { ...s, read: [...new Set([...s.read, ...a.ids])] };
    case 'syncLedger': {
      // remote 모드: 서버 원장이 기준이다.
      const entries = a.entries.reduce<PointEntry[]>((acc, e) => award(acc, e), []);
      return { ...s, ledger: entries };
    }
    case 'syncRemote': {
      let reports = s.reports;
      for (const { routeId, report: x } of a.items) {
        if (!s.routes.some(r => r.id === routeId)) continue;
        const confirmations = Array.from({ length: Math.max(0, Math.floor(x.confirmations) || 0) }, (_, i) => `remote-${i + 1}`);
        if (reports.some(r => r.id === x.id)) { reports = reports.map(r => r.id === x.id ? { ...r, confirmations } : r); continue; }
        const report: CitizenReport = { id: x.id, author: x.isMine ? 'me' : 'remote-author', routeId, situation: x.situation, place: x.place, time: x.time, note: x.note, createdAt: a.now, confirmations, helpfulUsers: [] };
        if (validReportInput(report)) reports = [report, ...reports];
      }
      return reports === s.reports ? s : { ...s, reports };
    }
    case 'wear': return canWear(s, a.id) ? { ...s, outfit: a.id } : s;
  }
}
