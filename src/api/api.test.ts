import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// supabase-js는 가짜로 바꿔 실제 네트워크 없이 remote 구현이 부르는 RPC와 테이블을 확인한다.
const { rpc, from, getSession, signInAnonymously, createClient } = vi.hoisted(() => {
  const rpc = vi.fn();
  const from = vi.fn();
  const getSession = vi.fn();
  const signInAnonymously = vi.fn();
  const createClient = vi.fn(() => ({ rpc, from, auth: { getSession, signInAnonymously } }));
  return { rpc, from, getSession, signInAnonymously, createClient };
});
vi.mock('@supabase/supabase-js', () => ({ createClient }));

import { isRemoteEnabled, createRemoteApi } from './client';
import { createLocalApi } from './local';
import { ApiError, isApiError } from './contract';
import type { ReportInput } from './contract';

const URL_ = 'http://127.0.0.1:54321';
const KEY = 'anon-test-key';
const input: ReportInput = { routeKey: '2:강남-선릉', situation: 'strike', place: '강남역', time: '08:00', note: '파업이에요' };

beforeEach(() => {
  rpc.mockReset(); from.mockReset(); getSession.mockReset(); signInAnonymously.mockReset(); createClient.mockClear();
  getSession.mockResolvedValue({ data: { session: null } });
  signInAnonymously.mockResolvedValue({ error: null });
});
afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

async function loadIndex(env: Record<string, string>) {
  vi.resetModules();
  for (const k of ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']) vi.stubEnv(k, env[k] ?? '');
  return import('./index');
}

describe('모드 선택 (요구사항 5.1)', () => {
  it('환경변수가 없으면 local', async () => {
    expect((await loadIndex({})).reportsApi.mode).toBe('local');
  });
  it('URL만 있으면 local', async () => {
    expect((await loadIndex({ VITE_SUPABASE_URL: URL_ })).reportsApi.mode).toBe('local');
  });
  it('anon 키만 있으면 local', async () => {
    expect((await loadIndex({ VITE_SUPABASE_ANON_KEY: KEY })).reportsApi.mode).toBe('local');
  });
  it('공백뿐인 값은 없는 것으로 본다', async () => {
    expect((await loadIndex({ VITE_SUPABASE_URL: '  ', VITE_SUPABASE_ANON_KEY: '  ' })).reportsApi.mode).toBe('local');
  });
  it('URL과 anon 키가 둘 다 있으면 remote', async () => {
    expect((await loadIndex({ VITE_SUPABASE_URL: URL_, VITE_SUPABASE_ANON_KEY: KEY })).reportsApi.mode).toBe('remote');
  });
  it('selectReportsApi와 isRemoteEnabled가 같은 기준을 쓴다', async () => {
    const m = await loadIndex({});
    expect(isRemoteEnabled({})).toBe(false);
    expect(isRemoteEnabled({ VITE_SUPABASE_URL: URL_, VITE_SUPABASE_ANON_KEY: KEY })).toBe(true);
    expect(m.selectReportsApi({}).mode).toBe('local');
    expect(m.selectReportsApi({ VITE_SUPABASE_URL: URL_, VITE_SUPABASE_ANON_KEY: KEY }).mode).toBe('remote');
  });
  it('local 모드는 supabase 클라이언트를 만들지 않는다', async () => {
    const m = await loadIndex({});
    await m.reportsApi.listToday('2:강남-선릉');
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe('remote 구현 (요구사항 1.1, 2.1, 3.1, 4.1, 4.4)', () => {
  const api = () => createRemoteApi({ VITE_SUPABASE_URL: URL_, VITE_SUPABASE_ANON_KEY: KEY });

  it('세션이 없으면 익명 로그인을 한 번만 한다 (1.1)', async () => {
    rpc.mockResolvedValue({ data: 'id-1', error: null });
    const a = api();
    await a.submitReport(input);
    await a.submitReport(input);
    expect(signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('세션이 이미 있으면 익명 로그인을 하지 않는다', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u' } } } });
    rpc.mockResolvedValue({ data: 'id-1', error: null });
    await api().submitReport(input);
    expect(signInAnonymously).not.toHaveBeenCalled();
  });

  it('제보·확인·도움됨·피드백은 RPC로만 보낸다 (2.1, 3.1, 4.1, 4.4)', async () => {
    rpc.mockResolvedValueOnce({ data: 'r1', error: null })
      .mockResolvedValueOnce({ data: 2, error: null })
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: true, error: null });
    const a = api();
    expect(await a.submitReport(input)).toEqual({ id: 'r1' });
    expect(await a.confirmReport('r1', '2:강남-선릉')).toEqual({ confirmations: 2 });
    expect(await a.markHelpful('r1')).toBe(true);
    expect(await a.recordFeedback('n1')).toBe(true);
    expect(rpc.mock.calls.map(c => c[0])).toEqual(['submit_report', 'confirm_report', 'mark_helpful', 'record_feedback']);
    expect(rpc.mock.calls[0][1]).toEqual({ p_route_key: '2:강남-선릉', p_situation: 'strike', p_place: '강남역', p_time: '08:00', p_note: '파업이에요' });
    expect(rpc.mock.calls[1][1]).toEqual({ p_report_id: 'r1', p_route_key: '2:강남-선릉' });
    expect(rpc.mock.calls[2][1]).toEqual({ p_report_id: 'r1' });
    expect(rpc.mock.calls[3][1]).toEqual({ p_notice_id: 'n1' });
    // 제보 입력 외의 값(정류장 목록, 출발 시각, 위치)은 RPC 인자에 없다 (1.2)
    expect(Object.keys(rpc.mock.calls[0][1]).sort()).toEqual(['p_note', 'p_place', 'p_route_key', 'p_situation', 'p_time']);
  });

  it('읽기는 report_status 뷰와 point_ledger만 select하고 쓰기 메서드를 부르지 않는다 (2.4, 4.3)', async () => {
    const writes = { insert: vi.fn(), update: vi.fn(), delete: vi.fn(), upsert: vi.fn() };
    const order = vi.fn().mockResolvedValue({ data: [], error: null });
    const eq = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ eq, order }));
    from.mockImplementation(() => ({ select, ...writes }));
    const a = api();
    await a.listToday('2:강남-선릉');
    await a.myPoints();
    expect(from.mock.calls.map(c => c[0])).toEqual(['report_status', 'point_ledger']);
    for (const fn of Object.values(writes)) expect(fn).not.toHaveBeenCalled();
  });

  it('listToday가 뷰 행을 계약 타입으로 바꾼다 (3.4)', async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: 'r1', route_key: '2:강남-선릉', situation: 'strike', place: '강남역', time: '08:00', note: '', report_day: '2026-11-15', confirmations: 2, confirmed: true, is_mine: false }],
      error: null,
    });
    from.mockReturnValue({ select: () => ({ eq: () => ({ order }) }) });
    const [r] = await api().listToday('2:강남-선릉');
    expect(r).toEqual({ id: 'r1', routeKey: '2:강남-선릉', situation: 'strike', place: '강남역', time: '08:00', note: '', reportDay: '2026-11-15', confirmations: 2, confirmed: true, isMine: false });
    expect(Object.keys(r)).not.toContain('author');
  });

  it('RPC 오류 메시지를 오류 코드로 바꾼다 (3.2)', async () => {
    for (const code of ['self_confirm', 'duplicate', 'route_mismatch', 'expired', 'not_confirmed', 'self_helpful', 'invalid_input']) {
      rpc.mockResolvedValueOnce({ data: null, error: { code: 'P0001', message: code } });
      await expect(api().confirmReport('r1', 'k')).rejects.toMatchObject({ code });
    }
  });

  it('알 수 없는 DB 오류는 unknown', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { code: 'P0001', message: 'something else' } });
    await expect(api().markHelpful('r1')).rejects.toMatchObject({ code: 'unknown' });
  });

  it('네트워크 실패는 connection 오류가 되고 앱이 멈추지 않는다 (5.2)', async () => {
    rpc.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const err = await api().submitReport(input).catch(e => e);
    expect(isApiError(err)).toBe(true);
    expect(err.code).toBe('connection');
  });

  it('5xx 응답은 connection 오류 (5.2)', async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'bad gateway', status: 502 } });
    await expect(api().recordFeedback('n1')).rejects.toMatchObject({ code: 'connection' });
  });

  it('익명 로그인 실패는 connection 오류이고 다음 호출에서 다시 시도한다 (5.2)', async () => {
    signInAnonymously.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const a = api();
    await expect(a.recordFeedback('n1')).rejects.toBeInstanceOf(ApiError);
    rpc.mockResolvedValueOnce({ data: true, error: null });
    expect(await a.recordFeedback('n1')).toBe(true);
    expect(signInAnonymously).toHaveBeenCalledTimes(2);
  });

  it('remote에는 시연용 simulateNeighbors가 없다', () => {
    expect(api().simulateNeighbors).toBeUndefined();
  });
});

describe('local 구현 (요구사항 2.1~2.3, 3.2~3.3, 4.1, 5.1)', () => {
  const fixed = new Date('2026-11-15T09:00:00+09:00');
  const make = () => createLocalApi(() => fixed);

  it('제보하면 +10 P가 한 번 쌓인다 (2.1)', async () => {
    const a = make();
    const { id } = await a.submitReport(input);
    const pts = await a.myPoints();
    expect(pts.filter(p => p.id === `report:${id}`)).toHaveLength(1);
    expect(pts.reduce((s, p) => s + p.amount, 0)).toBe(10);
    expect((await a.listToday(input.routeKey))[0]).toMatchObject({ id, isMine: true, confirmations: 0, confirmed: false });
  });

  it('잘못된 입력은 저장하지 않는다 (2.2)', async () => {
    const a = make();
    const bad: ReportInput[] = [
      { ...input, situation: 'flood' as never },
      { ...input, place: '   ' },
      { ...input, place: 'ㅁ'.repeat(61) },
      { ...input, note: 'ㅁ'.repeat(101) },
      { ...input, time: '25:00' },
      { ...input, routeKey: '' },
      { ...input, routeKey: 'x'.repeat(81) },
    ];
    for (const b of bad) await expect(a.submitReport(b)).rejects.toMatchObject({ code: 'invalid_input' });
    expect(await a.listToday(input.routeKey)).toHaveLength(0);
    expect(await a.myPoints()).toHaveLength(0);
  });

  it('작성자 본인의 확인과 도움됨은 거부한다 (3.2, 4.2)', async () => {
    const a = make();
    const { id } = await a.submitReport(input);
    await expect(a.confirmReport(id, input.routeKey)).rejects.toMatchObject({ code: 'self_confirm' });
    await expect(a.markHelpful(id)).rejects.toMatchObject({ code: 'self_helpful' });
  });

  it('다른 경로 키와 없는 제보는 거부한다 (3.2)', async () => {
    const a = make();
    const { id } = await a.submitReport(input);
    await expect(a.confirmReport(id, '9:다른-경로')).rejects.toBeInstanceOf(ApiError);
    await expect(a.confirmReport('nope', input.routeKey)).rejects.toMatchObject({ code: 'not_found' });
  });

  it('시뮬레이션 이웃 2명이 확인하면 confirmed (3.3)', async () => {
    const a = make();
    const { id } = await a.submitReport(input);
    await a.simulateNeighbors!(id);
    expect(await a.listToday(input.routeKey)).toMatchObject([{ id, confirmations: 2, confirmed: true }]);
  });

  it('지난 날의 제보는 오늘 목록에 없고 확인할 수 없다 (3.2, 3.4)', async () => {
    const day1 = createLocalApi(() => fixed);
    const { id } = await day1.submitReport(input);
    const day2 = createLocalApi(() => new Date('2026-11-16T09:00:00+09:00'));
    expect(await day2.listToday(input.routeKey)).toHaveLength(0);
    // local에서는 모든 제보의 작성자가 본인이라 self_confirm이 먼저 걸린다. expired 자체는 pgTAP이 확인한다.
    await expect(day2.confirmReport(id, input.routeKey)).rejects.toBeInstanceOf(ApiError);
  });

  it('경로 키가 다른 제보는 listToday에 섞이지 않는다 (3.4)', async () => {
    const a = make();
    await a.submitReport(input);
    expect(await a.listToday('9:다른-경로')).toHaveLength(0);
  });

  it('피드백 +1은 알림 ID당 한 번 (4.4)', async () => {
    const a = make();
    expect(await a.recordFeedback('n1')).toBe(true);
    expect(await a.recordFeedback('n1')).toBe(false);
    expect(await a.recordFeedback('n2')).toBe(true);
    expect((await a.myPoints()).reduce((s, p) => s + p.amount, 0)).toBe(2);
    await expect(a.recordFeedback('')).rejects.toMatchObject({ code: 'invalid_input' });
  });

  it('local 구현은 앱 상태 키(jamjam.v1)를 건드리지 않는다 (5.1)', async () => {
    localStorage.setItem('jamjam.v1', 'keep');
    const a = make();
    await a.submitReport(input);
    expect(localStorage.getItem('jamjam.v1')).toBe('keep');
  });

  it('local 구현은 네트워크를 쓰지 않는다 (5.1)', async () => {
    const f = vi.spyOn(globalThis, 'fetch');
    const a = make();
    await a.submitReport(input);
    await a.recordFeedback('n1');
    expect(f).not.toHaveBeenCalled();
    expect(createClient).not.toHaveBeenCalled();
  });
});
