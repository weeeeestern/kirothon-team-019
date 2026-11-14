import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { API_ERROR_CODES, ApiError } from './contract';
import type { ApiErrorCode, PointEntry, ReportInput, ReportsApi, ReportSituation, ReportStatus } from './contract';

export interface ApiEnv { VITE_SUPABASE_URL?: string; VITE_SUPABASE_ANON_KEY?: string }

/** URL과 anon 키가 둘 다 있을 때만 remote. */
export function isRemoteEnabled(env: ApiEnv): boolean {
  return !!env.VITE_SUPABASE_URL?.trim() && !!env.VITE_SUPABASE_ANON_KEY?.trim();
}

function toCode(message: string | undefined): ApiErrorCode {
  const found = API_ERROR_CODES.find(c => c !== 'connection' && c !== 'unknown' && c === message?.trim());
  return found ?? 'unknown';
}

function fail(error: { message?: string; code?: string; status?: number }): never {
  // PostgREST: 우리 RPC의 raise exception 은 P0001 이고 message 가 코드다.
  if (error.code === 'P0001') throw new ApiError(toCode(error.message));
  if (!error.status || error.status >= 500 || /fetch|network|load failed/i.test(error.message ?? '')) throw new ApiError('connection');
  throw new ApiError(toCode(error.message));
}

interface StatusRow {
  id: string; route_key: string; situation: ReportSituation; place: string; time: string; note: string;
  report_day: string; confirmations: number; confirmed: boolean; is_mine: boolean;
}
interface LedgerRow { id: string; amount: 1 | 5 | 10; reason: PointEntry['reason']; created_at: string }

export function createRemoteApi(env: ApiEnv): ReportsApi {
  let client: SupabaseClient | null = null;
  const sb = (): SupabaseClient => client ??= createClient(env.VITE_SUPABASE_URL!.trim(), env.VITE_SUPABASE_ANON_KEY!.trim());

  // 익명 로그인으로 사용자 ID를 만든다. 세션이 있으면 재사용한다.
  let session: Promise<void> | null = null;
  function ready(): Promise<void> {
    session ??= (async () => {
      try {
        const { data } = await sb().auth.getSession();
        if (data.session) return;
        const { error } = await sb().auth.signInAnonymously();
        if (error) fail(error);
      } catch (e) {
        session = null;
        throw e instanceof ApiError ? e : new ApiError('connection');
      }
    })();
    return session;
  }
  async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
    await ready();
    try {
      const { data, error } = await sb().rpc(name, args);
      if (error) fail(error);
      return data as T;
    } catch (e) {
      throw e instanceof ApiError ? e : new ApiError('connection');
    }
  }

  return {
    mode: 'remote',
    async submitReport(input: ReportInput) {
      const id = await rpc<string>('submit_report', {
        p_route_key: input.routeKey, p_situation: input.situation, p_place: input.place, p_time: input.time, p_note: input.note,
      });
      return { id };
    },
    async confirmReport(id, routeKey) {
      const confirmations = await rpc<number>('confirm_report', { p_report_id: id, p_route_key: routeKey });
      return { confirmations };
    },
    markHelpful: id => rpc<boolean>('mark_helpful', { p_report_id: id }),
    recordFeedback: noticeId => rpc<boolean>('record_feedback', { p_notice_id: noticeId }),
    async listToday(routeKey) {
      await ready();
      try {
        const { data, error } = await sb().from('report_status').select('*').eq('route_key', routeKey).order('confirmations', { ascending: false });
        if (error) fail(error);
        return ((data ?? []) as StatusRow[]).map((r): ReportStatus => ({
          id: r.id, routeKey: r.route_key, situation: r.situation, place: r.place, time: r.time, note: r.note,
          reportDay: r.report_day, confirmations: r.confirmations, confirmed: r.confirmed, isMine: r.is_mine,
        }));
      } catch (e) {
        throw e instanceof ApiError ? e : new ApiError('connection');
      }
    },
    async myPoints() {
      await ready();
      try {
        const { data, error } = await sb().from('point_ledger').select('id, amount, reason, created_at').order('created_at', { ascending: false });
        if (error) fail(error);
        return ((data ?? []) as LedgerRow[]).map((r): PointEntry => ({ id: r.id, amount: r.amount, reason: r.reason, createdAt: r.created_at }));
      } catch (e) {
        throw e instanceof ApiError ? e : new ApiError('connection');
      }
    },
  };
}
