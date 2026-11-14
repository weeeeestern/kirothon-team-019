import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within, act, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toast } from 'antd-mobile';
import type { ReportStatus } from '@/api';

// 환경변수 없이도 remote 경로를 검증하려고 '@/api'를 mock으로 바꾼다. 다른 테스트 파일에는 영향이 없다.
const api = vi.hoisted(() => ({
  mode: 'remote' as const,
  submitReport: vi.fn(), confirmReport: vi.fn(), markHelpful: vi.fn(), recordFeedback: vi.fn(), listToday: vi.fn(), myPoints: vi.fn(),
}));
vi.mock('@/api', async () => {
  const contract = await vi.importActual<typeof import('@/api/contract')>('@/api/contract');
  return { ...contract, reportsApi: api };
});

import App from '../App';
import { ApiError } from '@/api/contract';
import { AppState, useApp } from './AppState';
import { PageHeader } from '@/components/PageHeader';
import { initialStore, STORAGE_KEY } from './store';
import type { Store } from './store';

const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!) as Store;
const nav = (name: string, user: ReturnType<typeof userEvent.setup>) =>
  user.click(within(screen.getByRole('navigation', { name: '메인 메뉴' })).getByRole('button', { name }));
const status = (o: Partial<ReportStatus> = {}): ReportStatus => ({
  id: 'r-remote-1', routeKey: '', situation: 'strike', place: '강남', time: '08:00', note: '이웃 제보', reportDay: '2026-11-16',
  confirmations: 1, confirmed: false, isMine: false, ...o,
});

afterEach(() => { cleanup(); Toast.clear(); });

beforeEach(() => {
  Toast.clear();
  for (const f of [api.submitReport, api.confirmReport, api.markHelpful, api.recordFeedback, api.listToday, api.myPoints]) f.mockReset();
  api.listToday.mockResolvedValue([]); api.myPoints.mockResolvedValue([]);
  const seed = initialStore(); seed.routes[0].days = ['weekday', 'weekend', 'holiday', 'afterHoliday'];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  location.hash = '';
});

describe('remote 모드 제보 (요구사항 5.1, mock 클라이언트)', () => {
  it('제출은 submitReport에 경로 키만 보내고 서버가 준 id로 저장해요', async () => {
    api.submitReport.mockResolvedValue({ id: 'server-id-1' });
    const user = userEvent.setup(); render(<App />); await nav('제보', user);
    await user.click(screen.getByRole('option', { name: '혼잡', exact: true }));
    await user.type(screen.getByLabelText('장소'), '강남');
    await user.click(screen.getByRole('button', { name: '제보하고 +10 P 받기' }));
    await waitFor(() => expect(api.submitReport).toHaveBeenCalledTimes(1));
    const arg = api.submitReport.mock.calls[0][0];
    expect(Object.keys(arg).sort()).toEqual(['note', 'place', 'routeKey', 'situation', 'time']);
    expect(arg.situation).toBe('congestion'); expect(arg.place).toBe('강남'); expect(arg.routeKey).toMatch(/:.+-.+/);
    await waitFor(() => expect(saved().reports.map(r => r.id)).toContain('server-id-1'));
    await waitFor(() => expect(api.myPoints).toHaveBeenCalled()); // 제출 뒤 refresh
  });

  it('syncRemote: 서버 제보와 확인 수, 서버 원장이 상태에 반영돼요', async () => {
    api.listToday.mockResolvedValue([status({ confirmations: 2, confirmed: true })]);
    api.myPoints.mockResolvedValue([
      { id: 'helpful:x:u', amount: 5, reason: 'helpful', createdAt: '2026-11-16T09:00:00Z' },
      { id: 'report:y', amount: 10, reason: 'report', createdAt: '2026-11-16T08:00:00Z' },
    ]);
    render(<App />);
    await waitFor(() => expect(saved().reports.some(r => r.id === 'r-remote-1')).toBe(true));
    const r = saved().reports.find(x => x.id === 'r-remote-1')!;
    expect(r.confirmations).toHaveLength(2); expect(r.author).toBe('remote-author');
    expect(saved().ledger.map(e => e.amount)).toEqual([10, 5]);
    expect(api.listToday).toHaveBeenCalledWith(expect.stringMatching(/:.+-.+/));
  });

  it('확인 버튼은 confirmReport를 부르고, 확인된 제보에만 도움됨을 보여요', async () => {
    api.listToday.mockResolvedValue([status()]);
    api.confirmReport.mockResolvedValue({ confirmations: 2 });
    const user = userEvent.setup(); render(<App />); await nav('제보', user);
    const confirmBtn = await screen.findByRole('button', { name: '같은 경로예요 · 확인' });
    expect(screen.queryByRole('button', { name: '도움이 됐어요' })).toBeNull();
    api.listToday.mockResolvedValue([status({ confirmations: 2, confirmed: true })]);
    await user.click(confirmBtn);
    await waitFor(() => expect(api.confirmReport).toHaveBeenCalledWith('r-remote-1', expect.stringMatching(/:.+-.+/)));
    expect(await screen.findByRole('button', { name: '도움이 됐어요' })).toBeTruthy();
  });

  it('도움됨은 markHelpful을 한 번 부르고 버튼을 잠가요', async () => {
    api.listToday.mockResolvedValue([status({ confirmations: 2, confirmed: true })]);
    api.markHelpful.mockResolvedValue(true);
    const user = userEvent.setup(); render(<App />); await nav('제보', user);
    await user.click(await screen.findByRole('button', { name: '도움이 됐어요' }));
    await waitFor(() => expect(api.markHelpful).toHaveBeenCalledWith('r-remote-1'));
    expect(await screen.findByRole('button', { name: '도움됨 반영됨' })).toHaveProperty('disabled', true);
    expect(api.markHelpful).toHaveBeenCalledTimes(1);
  });

  it('서버 오류 코드는 안내 문구로 바뀌고 저장하지 않아요', async () => {
    api.submitReport.mockRejectedValue(new ApiError('invalid_input'));
    const user = userEvent.setup(); render(<App />); await nav('제보', user);
    await user.click(screen.getByRole('option', { name: '혼잡', exact: true }));
    await user.type(screen.getByLabelText('장소'), '강남');
    await user.click(screen.getByRole('button', { name: '제보하고 +10 P 받기' }));
    expect(await screen.findByText('입력을 다시 확인해 주세요')).toBeTruthy();
    expect(saved().reports).toHaveLength(0);
    expect(screen.queryByText(/연결이 불안정해요/)).toBeNull(); // 입력 오류는 연결 문제가 아니에요
  });
});

describe('연결 실패 (요구사항 5.2)', () => {
  it('제출이 connection으로 실패하면 안내가 뜨고 저장하지 않으며 앱은 계속 동작해요', async () => {
    api.submitReport.mockRejectedValue(new ApiError('connection'));
    const user = userEvent.setup(); render(<App />); await nav('제보', user);
    await user.click(screen.getByRole('option', { name: '혼잡', exact: true }));
    await user.type(screen.getByLabelText('장소'), '강남');
    await user.click(screen.getByRole('button', { name: '제보하고 +10 P 받기' }));
    expect((await screen.findAllByText(/연결이 불안정해요/)).length).toBeGreaterThan(0);
    expect(saved().reports).toHaveLength(0); expect(saved().ledger).toHaveLength(0);
    await nav('오늘', user); // 화면 전환이 계속 돼요
    expect(screen.getByText('알림을 쉬고 있어요')).toBeTruthy();
  });

  it('refresh가 실패해도 홈은 토스트, 다른 탭은 PageHeader로 안내하고 앱은 멈추지 않아요', async () => {
    api.myPoints.mockRejectedValue(new TypeError('Failed to fetch'));
    const user = userEvent.setup(); render(<App />);
    expect(await screen.findByText('연결이 불안정해요. 잠시 뒤에 다시 해 주세요')).toBeTruthy(); // 홈은 토스트로 알려요
    expect(screen.getByText('알림을 쉬고 있어요')).toBeTruthy();
    await nav('제보', user);
    expect(screen.getByText('연결이 불안정해요. 잠시 뒤에 다시 시도해 주세요')).toBeTruthy();
  });

  it('AppState.call: connection·unknown은 undefined와 안내, 나머지 코드는 안내 없이 undefined', async () => {
    const bar = () => document.querySelector('.adm-notice-bar');
    let ctx!: ReturnType<typeof useApp>;
    function Grab() { ctx = useApp(); return <PageHeader title="시험" />; }
    render(<AppState><Grab /></AppState>);
    await waitFor(() => expect(api.myPoints).toHaveBeenCalled());
    expect(bar()).toBeNull();

    let v: unknown = 'x';
    await act(async () => { v = await ctx.call(() => Promise.reject(new ApiError('duplicate'))); });
    expect(v).toBeUndefined(); expect(bar()).toBeNull();

    await act(async () => { v = await ctx.call(() => Promise.reject(new ApiError('connection'))); });
    expect(v).toBeUndefined(); expect(bar()?.textContent).toBe('연결이 불안정해요. 잠시 뒤에 다시 시도해 주세요');

    await act(async () => { v = await ctx.call(() => Promise.reject(new Error('boom'))); }); // ApiError가 아닌 예외도 멈추지 않아요
    expect(v).toBeUndefined(); expect(ctx.apiError).toBe(true);

    await act(async () => { v = await ctx.call(async () => 42); });
    expect(v).toBe(42);
    await waitFor(() => expect(bar()).toBeNull());
    expect(ctx.apiError).toBe(false);
  });
});
