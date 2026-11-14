import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReportMap } from './ReportMap';
import { matchReportLocation, savedReportLocation } from './reportLocation';
import { searchPlaces } from '@/features/transit/client';
import type { CitizenReport } from './reportStore';
import type { Place } from '@/features/transit/types';
import type { Route } from '@/engine/types';
vi.mock('@/features/transit/client', () => ({ searchPlaces: vi.fn(), requestJson: vi.fn() }));
const point: Place = { id: 'gangnam', name: '강남역 2호선', lat: 37.498, lng: 127.028, address: '서울 강남구' };
const report: CitizenReport = { id: 'one', author: 'me', routeId: 'deleted', situation: 'congestion', place: '강남', time: '08:00', note: '승강장이 붐벼요', createdAt: '2026-11-14T08:00:00+09:00', confirmations: [], helpfulUsers: [] };
const now = new Date('2026-11-14T09:00:00+09:00');
let markerCount: number;
beforeEach(() => {
  vi.mocked(searchPlaces).mockReset().mockResolvedValue([point]); markerCount = 0;
  // Exercise the real KakaoMap wrapper, replacing only the remote SDK.
  window.kakao = { maps: {
    load: (fn: () => void) => fn(),
    LatLng: class {}, LatLngBounds: class { extend() {} },
    Map: class { element: HTMLElement; constructor(element: HTMLElement) { this.element = element; } setBounds() {} relayout() {} },
    Marker: class { setMap() {} }, Polyline: class { setMap() {} },
    CustomOverlay: class {
      content: HTMLElement;
      constructor(options: { map: { element: HTMLElement }; content: HTMLElement }) { this.content = options.content; options.map.element.append(this.content); markerCount++; }
      setMap() { this.content.remove(); }
    },
  } } as unknown as NonNullable<Window['kakao']>;
});
describe('report locations', () => {
  it('accepts station aliases but rejects unrelated and distant namesakes', () => {
    expect(matchReportLocation('강남역', [point])).toEqual({ lat: point.lat, lng: point.lng });
    expect(matchReportLocation('강남', [{ ...point, name: '강남역 카페' }])).toBeUndefined();
    expect(matchReportLocation('강남', [point, { ...point, lat: 37.7 }])).toBeUndefined();
    expect(savedReportLocation('강남', { origin: { ...point, name: '강남역' } } as Route)).toEqual({ lat: point.lat, lng: point.lng });
  });
  it('groups restored reports, opens details and filters expired reports', async () => {
    const old = { ...report, id: 'old', createdAt: '2026-11-13T08:00:00+09:00', note: '어제 제보' };
    const view = render(<ReportMap reports={[report, old]} routes={[]} now={now} />);
    fireEvent.click(await screen.findByRole('button', { name: '강남 · 제보 2건' }));
    expect(screen.getByText('승강장이 붐벼요')).toBeTruthy(); expect(screen.getByText('만료')).toBeTruthy();
    expect(searchPlaces).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('checkbox', { name: '만료된 제보도 보기' }));
    expect(await screen.findByRole('button', { name: '강남 · 제보 1건' })).toBeTruthy();
    expect(screen.queryByText('어제 제보')).toBeNull();
    const count = markerCount;
    view.rerender(<ReportMap reports={[{ ...report, confirmations: ['A', 'B'] }, old]} routes={[]} now={now} />);
    expect(screen.getByText('확인됨')).toBeTruthy(); expect(markerCount).toBe(count);
    expect(searchPlaces).toHaveBeenCalledTimes(1);
    view.unmount();
    render(<ReportMap reports={[report]} routes={[]} now={now} />);
    expect(await screen.findByRole('button', { name: '강남 · 제보 1건' })).toBeTruthy();
  });
  it('shows lookup failure, retries, and adds a newly submitted report', async () => {
    vi.mocked(searchPlaces).mockRejectedValueOnce(new Error('offline'));
    const view = render(<ReportMap reports={[report]} routes={[]} now={now} />);
    fireEvent.click(await screen.findByRole('button', { name: '위치 다시 찾기' }));
    expect(await screen.findByRole('button', { name: '강남 · 제보 1건' })).toBeTruthy();
    view.rerender(<ReportMap reports={[report, { ...report, id: 'new' }]} routes={[]} now={now} />);
    expect(await screen.findByRole('button', { name: '강남 · 제보 2건' })).toBeTruthy();
    expect(searchPlaces).toHaveBeenCalledTimes(2);
  });
  it('retries an abbreviated station name without accepting district attractions', async () => {
    vi.mocked(searchPlaces).mockResolvedValueOnce([{ ...point, name: '서울선릉과정릉' }]);
    render(<ReportMap reports={[report]} routes={[]} now={now} />);
    expect(await screen.findByRole('button', { name: '강남 · 제보 1건' })).toBeTruthy();
    expect(vi.mocked(searchPlaces).mock.calls.map(call => call[0])).toEqual(['서울 강남', '서울 강남역']);
  });
  it('shows an empty state without requesting locations or the SDK', async () => {
    render(<ReportMap reports={[]} routes={[]} now={now} />);
    await waitFor(() => expect(screen.getByText('아직 제보가 없어요. 첫 소식을 지도에 남겨 보세요.')).toBeTruthy());
    expect(searchPlaces).not.toHaveBeenCalled(); expect(markerCount).toBe(0);
  });
});
