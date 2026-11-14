import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RoutePlanner } from './RoutePlanner';
import { searchJourneys, searchPlaces } from './client';
import { journeyStops, routeError } from '../routes/route';
import type { Place, TransitJourney } from './types';
import type { Route } from '@/engine';
vi.mock('./client', () => ({ searchPlaces: vi.fn(), searchJourneys: vi.fn() }));
vi.mock('@/components/KakaoMap', () => ({ KakaoMap: () => <div>지도 영역</div> }));
const origin: Place = { id: '1', name: '강남역', address: '서울 강남구', district: '강남구', lat: 37.4979, lng: 127.0276 };
const destination: Place = { id: '2', name: '선릉역', address: '서울 강남구', lat: 37.5045, lng: 127.049 };
const journey: TransitJourney = { id: 'route-1', provider: 'ODsay', totalTime: 12, totalWalk: 400, payment: 1550, transferCount: 0, path: [], pathKind: 'stops', stations: ['강남', '역삼', '선릉'], segments: [{ type: 'walk', label: '도보', time: 5 }, { type: 'subway', label: '2호선', time: 7, from: '강남', to: '선릉', stations: ['강남', '역삼', '선릉'] }] };
const fetchedAt = '2026-11-14T08:00:00.000Z';
const savedRoute = (): Route => ({ id: 'saved', district: '강남구', stops: journeyStops(origin, destination, journey), departAt: '08:00', days: ['weekday'], origin, destination, journey: structuredClone(journey), fetchedAt });
beforeEach(() => { vi.mocked(searchPlaces).mockReset(); vi.mocked(searchJourneys).mockReset(); });
async function pickPlaces(user: ReturnType<typeof userEvent.setup>) {
  vi.mocked(searchPlaces).mockResolvedValueOnce([origin]).mockResolvedValueOnce([destination]);
  await user.type(screen.getByLabelText('출발지'), '강남'); await user.click(screen.getByRole('button', { name: '출발지 검색' })); await user.click(await screen.findByRole('button', { name: /강남역.*서울 강남구/ }));
  await user.type(screen.getByLabelText('도착지'), '선릉'); await user.click(screen.getByRole('button', { name: '도착지 검색' })); await user.click(await screen.findByRole('button', { name: /선릉역.*서울 강남구/ }));
}
describe('actual route UI contract', () => {
  it('automatically selects a less affected candidate, supports manual override, and recomputes for time changes', async () => {
    const user = userEvent.setup(); const onSave = vi.fn();
    const now = new Date('2026-11-14T08:00:00+09:00');
    const report = { id: 'r', routeId: 'saved', author: 'a', situation: 'congestion' as const, place: '역삼', time: '08:00', note: '', createdAt: '2026-11-14T07:50:00+09:00', confirmations: ['b', 'c'], helpfulUsers: [] };
    const direct = structuredClone(journey); direct.segments[1].stopsComplete = true;
    const detour = { ...structuredClone(direct), id: 'detour', totalTime: 20, stations: ['강남', '삼성', '선릉'], segments: [{ type: 'subway' as const, label: '우회선', time: 20, stations: ['강남', '삼성', '선릉'], stopsComplete: true }] };
    render(<RoutePlanner reports={[report]} now={now} onSave={onSave} onManual={vi.fn()} />);
    await pickPlaces(user);
    vi.mocked(searchJourneys).mockResolvedValue({ routes: [direct, detour], fetchedAt });
    await user.click(screen.getByRole('button', { name: '대중교통 경로 찾기' }));
    const alternative = await screen.findByRole('button', { name: /경로 2.*선택됨/ });
    expect(alternative.getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByText(/첫 번째 후보보다 겹치는 이상 신호가 1건 적은/)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /경로 1.*12분/ }));
    expect(screen.getByRole('button', { name: /경로 1.*선택됨/ }).getAttribute('aria-pressed')).toBe('true');
    await user.click(alternative);
    await user.click(screen.getByRole('button', { name: '이 경로 저장' }));
    expect(onSave.mock.calls[0][0].journey.id).toBe('detour');
    fireEvent.change(screen.getByLabelText('알림 기준 출발 시각'), { target: { value: '10:00' } });
    expect(screen.getByRole('button', { name: /경로 1.*선택됨/ }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.queryByText('이상 신호 영향이 적은 대안')).toBeNull();
    fireEvent.change(screen.getByLabelText('알림 기준 출발 시각'), { target: { value: '08:00' } });
    expect(screen.getByRole('button', { name: /경로 2.*선택됨/ })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('우회 시 추가 이동시간'), { target: { value: '0' } });
    expect(screen.getByRole('button', { name: /경로 1.*선택됨/ })).toBeTruthy();
    expect(screen.getByText(/추가 0분 이내 후보에서/)).toBeTruthy();
  });
  it('does not inject synthetic alerts without opting in to the labeled simulation', async () => {
    const user = userEvent.setup(); render(<RoutePlanner now={new Date('2026-11-14T08:00:00+09:00')} onSave={vi.fn()} onManual={vi.fn()} />);
    await pickPlaces(user); vi.mocked(searchJourneys).mockResolvedValue({ routes: [journey], fetchedAt });
    await user.click(screen.getByRole('button', { name: '대중교통 경로 찾기' }));
    expect(await screen.findByText('비교할 유효한 제보가 없어요. 일반 길찾기 결과를 표시해요.')).toBeTruthy();
    await user.click(screen.getByText('우회 추천 시연'));
    await user.click(screen.getByLabelText('합성 혼잡 신호로 비교하기'));
    expect(screen.getByText('합성 데이터로 우회 추천 시연 중')).toBeTruthy();
    expect(screen.getByText(/역삼 · 혼잡 시연 · 합성 시연/)).toBeTruthy();
    await user.click(screen.getByLabelText('합성 혼잡 신호로 비교하기'));
    expect(screen.queryByText(/역삼 · 혼잡 시연 · 합성 시연/)).toBeNull();
  });
  it('keeps selected places visible on the map when transit lookup fails', async () => {
    const user = userEvent.setup(); render(<RoutePlanner onSave={vi.fn()} onManual={vi.fn()} />);
    await pickPlaces(user);
    expect(screen.getByText('지도 영역')).toBeTruthy();
    vi.mocked(searchJourneys).mockRejectedValue(new Error('길찾기 연결 실패'));
    await user.click(screen.getByRole('button', { name: '대중교통 경로 찾기' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', '길찾기 연결 실패');
    expect(screen.getByText('지도 영역')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '이 경로 저장' })).toBeNull();
  });
  it('prefills manual route endpoints without inventing selected coordinates', () => {
    render(<RoutePlanner initial={{ id: 'manual', district: '강남구', stops: ['신논현', '강남', '역삼', '선릉'], departAt: '09:00', days: ['weekday'] }} onSave={vi.fn()} onManual={vi.fn()} />);
    expect(screen.getByLabelText('출발지')).toHaveProperty('value', '신논현');
    expect(screen.getByLabelText('도착지')).toHaveProperty('value', '선릉');
    expect(screen.getByRole('button', { name: '대중교통 경로 찾기' })).toHaveProperty('disabled', true);
  });
  it('selects places, displays API route units and saves the journey with notification schedule', async () => {
    const user = userEvent.setup(); const onSave = vi.fn(); render(<RoutePlanner onSave={onSave} onManual={vi.fn()} />);
    await pickPlaces(user);
    vi.mocked(searchJourneys).mockResolvedValue({ routes: [journey], fetchedAt });
    await user.click(screen.getByRole('button', { name: '대중교통 경로 찾기' }));
    expect(await screen.findByText('12분')).toBeTruthy(); expect(screen.getByText('도보 5분 · 400m')).toBeTruthy();
    fireEvent.change(screen.getByLabelText('알림 기준 출발 시각'), { target: { value: '09:20' } });
    await user.click(screen.getByRole('button', { name: '이 경로 저장' }));
    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0][0] as Route;
    expect(saved.departAt).toBe('09:20'); expect(saved.journey?.id).toBe('route-1'); expect(saved.origin).toEqual(origin); expect(saved.stops).toEqual(['강남', '역삼', '선릉역']); expect(routeError(saved)).toBeNull();
  });
  it('keeps a real authorization failure visible and offers direct registration', async () => {
    const user = userEvent.setup(); const onManual = vi.fn(); const onSave = vi.fn(); render(<RoutePlanner onSave={onSave} onManual={onManual} />);
    vi.mocked(searchPlaces).mockRejectedValue(new Error('장소 검색 연결을 확인하고 있어요. 카카오 서비스 설정을 확인해 주세요.'));
    await user.type(screen.getByLabelText('출발지'), '강남'); await user.click(screen.getByRole('button', { name: '출발지 검색' }));
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', '장소 검색 연결을 확인하고 있어요. 카카오 서비스 설정을 확인해 주세요.');
    expect(screen.queryByRole('button', { name: '이 경로 저장' })).toBeNull();
    await user.click(screen.getByRole('button', { name: '역·정류장 직접 입력' })); expect(onManual).toHaveBeenCalledOnce(); expect(onSave).not.toHaveBeenCalled();
  });
  it('discards a late route response after the destination changes', async () => {
    const user = userEvent.setup(); render(<RoutePlanner onSave={vi.fn()} onManual={vi.fn()} />); await pickPlaces(user);
    let resolve!: (value: { routes: TransitJourney[]; fetchedAt: string }) => void;
    vi.mocked(searchJourneys).mockReturnValue(new Promise(done => { resolve = done; }));
    await user.click(screen.getByRole('button', { name: '대중교통 경로 찾기' }));
    await user.clear(screen.getByLabelText('도착지')); resolve({ routes: [journey], fetchedAt });
    await waitFor(() => expect(screen.queryByRole('button', { name: '이 경로 저장' })).toBeNull());
    expect(vi.mocked(searchJourneys).mock.calls[0][2]?.aborted).toBe(true);
  });
});
describe('persisted transit route validation', () => {
  it('accepts a complete transit route with more than twelve passing stations', () => {
    const route = savedRoute(); route.journey!.stations = Array.from({ length: 25 }, (_, i) => `정류장${i}`); route.stops = journeyStops(origin, destination, route.journey!);
    expect(routeError(route)).toBeNull();
  });
  it('rejects malformed stored coordinates and numeric route metadata', () => {
    const route = savedRoute(); route.origin!.lat = Number.NaN; expect(routeError(route)).not.toBeNull();
    const invalid = savedRoute(); invalid.journey!.segments[0].time = -1; expect(routeError(invalid)).not.toBeNull();
    const oversized = savedRoute(); oversized.journey!.stations = Array.from({ length: 201 }, () => '강남'); expect(routeError(oversized)).not.toBeNull();
  });
});
