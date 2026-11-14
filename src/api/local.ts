import { dayKey } from '../engine/utils';
import { confirmReport, isConfirmed, validReportInput } from '../features/reports/reportStore';
import type { CitizenReport } from '../features/reports/reportStore';
import { ApiError } from './contract';
import type { PointEntry, ReportInput, ReportsApi, ReportStatus } from './contract';

// localStorage 데모 구현. remote와 같은 규칙(2인 규칙, 본인·중복·경로·날짜 제외, 포인트 1회)을 따른다.
// 앱 상태(`jamjam.v1`)와 키를 나누어 서로 덮어쓰지 않는다.
export const LOCAL_API_KEY = 'jamjam.api.local.v1';
const ME = 'me';
const NEIGHBORS = ['sim-neighbor-1', 'sim-neighbor-2'];

interface LocalState { reports: CitizenReport[]; ledger: Array<PointEntry & { userId: string }>; seq: number }
const empty = (): LocalState => ({ reports: [], ledger: [], seq: 0 });

function load(): LocalState {
  try {
    const s = JSON.parse(localStorage.getItem(LOCAL_API_KEY) ?? 'null') as LocalState | null;
    return s && Array.isArray(s.reports) && Array.isArray(s.ledger) && Number.isFinite(s.seq) ? s : empty();
  } catch { return empty(); }
}
function save(s: LocalState): void {
  try { localStorage.setItem(LOCAL_API_KEY, JSON.stringify(s)); } catch { /* 저장 실패해도 앱은 계속 동작한다 */ }
}
function credit(s: LocalState, userId: string, id: string, amount: 1 | 5 | 10, reason: PointEntry['reason']): boolean {
  if (s.ledger.some(e => e.userId === userId && e.id === id)) return false;
  s.ledger.push({ userId, id, amount, reason, createdAt: new Date().toISOString() });
  return true;
}
const confirmedBy = (r: CitizenReport) => new Set(r.confirmations.filter(u => u !== r.author)).size;

export function createLocalApi(now: () => Date = () => new Date()): ReportsApi {
  return {
    mode: 'local',
    async submitReport(input: ReportInput) {
      if (!validReportInput({ routeId: input.routeKey, situation: input.situation, place: input.place, time: input.time, note: input.note }) || input.routeKey.length > 80) {
        throw new ApiError('invalid_input');
      }
      const s = load();
      const id = `local-${now().getTime()}-${++s.seq}`;
      s.reports.unshift({
        id, author: ME, routeId: input.routeKey, situation: input.situation, place: input.place.trim(), time: input.time,
        note: input.note, createdAt: now().toISOString(), confirmations: [], helpfulUsers: [],
      });
      credit(s, ME, `report:${id}`, 10, 'report');
      save(s);
      return { id };
    },
    async confirmReport(id, routeKey) {
      const s = load();
      const r = s.reports.find(x => x.id === id);
      if (!r) throw new ApiError('not_found');
      if (r.author === ME) throw new ApiError('self_confirm');
      if (r.routeId !== routeKey) throw new ApiError('route_mismatch');
      if (dayKey(new Date(r.createdAt)) !== dayKey(now())) throw new ApiError('expired');
      if (r.confirmations.includes(ME)) throw new ApiError('duplicate');
      s.reports = s.reports.map(x => x.id === id ? confirmReport(x, ME, routeKey, now()) : x);
      save(s);
      return { confirmations: confirmedBy(s.reports.find(x => x.id === id)!) };
    },
    async markHelpful(id) {
      const s = load();
      const r = s.reports.find(x => x.id === id);
      if (!r) throw new ApiError('not_found');
      if (r.author === ME) throw new ApiError('self_helpful');
      if (!isConfirmed(r)) throw new ApiError('not_confirmed');
      if (r.helpfulUsers.includes(ME)) return false;
      r.helpfulUsers.push(ME);
      credit(s, r.author, `helpful:${id}:${ME}`, 5, 'helpful');
      save(s);
      return true;
    },
    async recordFeedback(noticeId) {
      if (!noticeId || noticeId.length > 100) throw new ApiError('invalid_input');
      const s = load();
      const added = credit(s, ME, `feedback:${noticeId}`, 1, 'feedback');
      if (added) save(s);
      return added;
    },
    async listToday(routeKey) {
      const today = dayKey(now());
      return load().reports
        .filter(r => r.routeId === routeKey && dayKey(new Date(r.createdAt)) === today)
        .map((r): ReportStatus => ({
          id: r.id, routeKey: r.routeId, situation: r.situation, place: r.place, time: r.time, note: r.note,
          reportDay: today, confirmations: confirmedBy(r), confirmed: isConfirmed(r), isMine: r.author === ME,
        }));
    },
    async myPoints() {
      return load().ledger.filter(e => e.userId === ME)
        .map(({ id, amount, reason, createdAt }): PointEntry => ({ id, amount, reason, createdAt }))
        .reverse();
    },
    async simulateNeighbors(id) {
      const s = load();
      const r = s.reports.find(x => x.id === id);
      if (!r) return;
      s.reports = s.reports.map(x => x.id === id ? NEIGHBORS.reduce((acc, u) => confirmReport(acc, u, acc.routeId, now()), x) : x);
      save(s);
    },
  };
}
