import { describe, it, expect } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { initialStore, STORAGE_KEY } from './state/store';
import type { Store } from './state/store';
const saved = () => JSON.parse(localStorage.getItem(STORAGE_KEY)!) as Store;
async function navigate(name: string, user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(screen.getByRole('navigation', { name: '메인 메뉴' })).getByRole('button', { name }));
}
describe('the complete local demo', () => {
  it('keeps a quiet home, renders an anomaly and persists one feedback award', async () => {
    const user = userEvent.setup(); const app = render(<App />);
    expect(screen.getByText('알림을 쉬고 있어요')).toBeTruthy();
    await user.click(screen.getByText('샘플 시나리오 바꾸기'));
    await user.click(screen.getByRole('option', { name: '혼잡', exact: true }));
    await navigate('알림', user);
    expect(await screen.findByRole('heading', { name: '강남 혼잡' })).toBeTruthy();
    expect(screen.getByText(/평소 .*오늘.*배/)).toBeTruthy();
    expect(screen.getByText(/5~10분 일찍/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '도움이 됐어요' }));
    await waitFor(() => expect(saved().ledger).toHaveLength(1));
    expect(saved().ledger[0].amount).toBe(1);
    await navigate('키로의 방', user); await navigate('알림', user);
    expect(screen.queryByRole('button', { name: '도움이 됐어요' })).toBeNull();
    app.unmount(); location.hash = ''; render(<App />);
    await user.click(screen.getByText('샘플 시나리오 바꾸기')); await user.click(screen.getByRole('option', { name: '혼잡', exact: true })); await navigate('알림', user);
    expect(await screen.findByText('피드백 반영됐어요 · +1 P')).toBeTruthy(); expect(saved().ledger).toHaveLength(1);
  });
  it('registers a report, requires two confirmations, rewards once and equips an unlocked item', async () => {
    const seed = initialStore(); seed.routes[0].days = ['weekday','weekend','holiday','afterHoliday']; localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    const user = userEvent.setup(); const app = render(<App />); await navigate('제보', user);
    await user.click(screen.getByRole('button', { name: '제보하고 +10 P 받기' })); expect(await screen.findByRole('alert')).toBeTruthy();
    await user.click(screen.getByRole('option', { name: '마라톤', exact: true })); await user.type(screen.getByLabelText('장소'), '강남');
    await user.type(screen.getByLabelText(/한 줄 설명/), '행사로 역 앞이 혼잡해요'); await user.click(screen.getByRole('button', { name: '제보하고 +10 P 받기' }));
    await waitFor(() => expect(saved().reports).toHaveLength(1)); expect(saved().ledger[0].amount).toBe(10);
    expect(await screen.findByText('새 옷이 열렸어요!')).toBeTruthy(); await waitFor(() => expect(getComputedStyle(screen.getByRole('button', { name: '계속하기' })).pointerEvents).not.toBe('none')); await user.click(screen.getByRole('button', { name: '계속하기' }));
    await user.click(screen.getByRole('button', { name: '이웃 A 확인' })); expect(screen.getByText('검증 대기')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '이웃 B 확인' })); expect(screen.getByText('확인됨')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '이웃 A 도움됨 +5 P' }));
    await waitFor(() => expect(saved().ledger.reduce((n, e) => n + e.amount, 0)).toBe(15));
    await navigate('키로의 방', user); await user.click(screen.getByRole('tab', { name: '한정판' }));
    await user.click(screen.getByRole('button', { name: /마라톤 제보자 보유/ })); await waitFor(() => expect(saved().outfit).toBe('marathon26'));
    app.unmount(); render(<App />); await user.click(screen.getByRole('tab', { name: '한정판' })); expect(await screen.findByRole('button', { name: /마라톤 제보자 착용 중/ })).toBeTruthy();
  });
  it('saves a route through its form and retains it after remount', async () => {
    const user = userEvent.setup(); const app = render(<App />); await user.click(screen.getByRole('button', { name: '경로 관리' }));
    await user.click(await screen.findByRole('button', { name: '새 경로 등록' }));
    await waitFor(() => expect(getComputedStyle(screen.getByLabelText('출발역')).pointerEvents).not.toBe('none'));
    await user.type(screen.getByLabelText('출발역'), '강남'); await user.type(screen.getByLabelText('도착역'), '삼성');
    await user.click(screen.getByRole('button', { name: '경유지 추가' }));
    await user.type(screen.getByLabelText('경유지 1'), '역삼');
    fireEvent.change(screen.getByLabelText('출발 시각'), { target: { value: '09:15' } });
    await user.click(screen.getByRole('button', { name: '경로 저장' }));
    await waitFor(() => expect(saved().routes).toHaveLength(3)); expect(saved().routes.at(-1)?.departAt).toBe('09:15'); expect(saved().routes.at(-1)?.stops).toEqual(['강남', '역삼', '삼성']);
    app.unmount(); render(<App />); expect(await screen.findByRole('heading', { name: '강남 → 역삼 → 삼성' })).toBeTruthy();
  });
  it('announces a level unlock once and wears the new outfit on home', async () => {
    const seed = initialStore(); seed.ledger = [{ id: 'seed', amount: 10, reason: '이전 제보' }];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    const user = userEvent.setup(); const app = render(<App />); await navigate('제보', user);
    await user.click(screen.getByRole('option', { name: '혼잡', exact: true }));
    await user.type(screen.getByLabelText('장소'), '강남');
    await user.click(screen.getByRole('button', { name: '제보하고 +10 P 받기' }));
    expect(await screen.findByText('Lv. 2, 함께 자랐어요!')).toBeTruthy();
    await waitFor(() => expect(getComputedStyle(screen.getByRole('button', { name: '옷장으로 가기' })).pointerEvents).not.toBe('none'));
    await user.click(screen.getByRole('button', { name: '옷장으로 가기' }));
    await user.click(await screen.findByRole('button', { name: '캡 보유' }));
    await waitFor(() => expect(saved().outfit).toBe('cap'));
    await navigate('오늘', user);
    expect(document.querySelector('.hero .kiro-avatar')?.innerHTML).toContain('M380 330a262 262 0 0 1 500 24');
    app.unmount(); render(<App />);
    expect(screen.queryByText('Lv. 2, 함께 자랐어요!')).toBeNull();
  });
  it('offers route registration without showing a false quiet-day score when routes are empty', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...initialStore(), routes: [] }));
    const user = userEvent.setup(); render(<App />);
    expect(screen.getByText('아직 살펴볼 경로가 없어요')).toBeTruthy();
    expect(screen.queryByText('알림을 쉬고 있어요')).toBeNull();
    await navigate('제보', user);
    await user.click(screen.getByRole('button', { name: '경로 등록하기' }));
    expect(await screen.findByRole('button', { name: '새 경로 등록' })).toBeTruthy();
  });
  it('recovers corrupted saved data and renders the evaluation', async () => {
    localStorage.setItem(STORAGE_KEY, '{broken'); const user = userEvent.setup(); render(<App />);
    expect(screen.getByText('알림을 쉬고 있어요')).toBeTruthy(); await navigate('키로의 방', user);
    await user.click(await screen.findByRole('button', { name: /평가 보기/ }));
    expect(await screen.findByText('100%')).toBeTruthy(); expect(screen.getByText('75%')).toBeTruthy();
  });
});
