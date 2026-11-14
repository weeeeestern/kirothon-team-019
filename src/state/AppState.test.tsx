import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AppState, useApp } from './AppState';
import { initialStore, reducer, STORAGE_KEY } from './store';
import type { DemoMode } from './context';

const modes: DemoMode[] = ['auto', 'showcase', 'quiet', 'construction', 'rain', 'dust', 'marathon', 'strike', 'congestion'];
function Probe() {
  const { mode, setMode, result, points, store } = useApp();
  return <>
    <output data-testid="state">{JSON.stringify({ mode, count: result.notices.length, situation: result.situation, points, outfit: store.outfit, ordinariness: result.ordinariness, source: result.notices[0]?.source })}</output>
    {modes.map(value => <button key={value} onClick={() => setMode(value)}>{value}</button>)}
  </>;
}
const state = () => JSON.parse(screen.getByTestId('state').textContent!);
afterEach(() => vi.useRealTimers());

describe('scenario selection with seeded demo data', () => {
  it('replaces the three seeded alerts with the selected scenario without changing points or outfit', () => {
    const seeded = reducer(reducer(initialStore(), { type: 'loadDemo' }), { type: 'wear', id: 'phones' });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    render(<AppState><Probe /></AppState>);
    expect(state()).toMatchObject({ mode: 'showcase', count: 3, outfit: 'phones', points: 100 });
    for (const mode of ['rain', 'dust', 'marathon', 'strike', 'congestion', 'construction']) {
      fireEvent.click(screen.getByText(mode));
      expect(state()).toMatchObject({ mode, situation: mode, count: 1, outfit: 'phones', points: 100, source: 'synthetic' });
    }
    fireEvent.click(screen.getByText('quiet'));
    expect(state()).toMatchObject({ situation: 'ordinary', count: 0, ordinariness: 100, points: 100 });
    fireEvent.click(screen.getByText('showcase'));
    expect(state().count).toBe(3);
  });

  it('previews scenarios even with no matching personal route and returns to personal mode', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...initialStore(), routes: [] }));
    render(<AppState><Probe /></AppState>);
    expect(state()).toMatchObject({ mode: 'auto', count: 0 });
    fireEvent.click(screen.getByText('rain'));
    expect(state()).toMatchObject({ situation: 'rain', count: 1 });
    fireEvent.click(screen.getByText('auto'));
    expect(state()).toMatchObject({ situation: 'ordinary', count: 0 });
  });

  it('isolates previews from confirmed citizen reports without deleting those reports', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-16T08:00:00+09:00'));
    const stored = { ...initialStore(), reports: [{ id: 'confirmed', author: 'other', routeId: 'r1', situation: 'construction' as const, place: '강남', time: '08:00', note: '공사 중', createdAt: '2026-11-16T07:30:00+09:00', confirmations: ['a', 'b'], helpfulUsers: [] }] };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    render(<AppState><Probe /></AppState>);
    expect(state()).toMatchObject({ mode: 'auto', count: 1, source: 'report' });
    fireEvent.click(screen.getByText('quiet'));
    expect(state().count).toBe(0);
    fireEvent.click(screen.getByText('rain'));
    expect(state()).toMatchObject({ count: 1, situation: 'rain', source: 'synthetic' });
    fireEvent.click(screen.getByText('auto'));
    expect(state()).toMatchObject({ count: 1, source: 'report' });
  });
});
