import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchJourneys } from './client';
import type { Place, TransitJourney } from './types';

const origin: Place = { id: '1', name: '강남역', address: '서울 강남구', lat: 37.4979, lng: 127.0276 };
const destination: Place = { id: '2', name: '선릉역', address: '서울 강남구', lat: 37.5045, lng: 127.0489 };
const fixture = {
  info: { totalTime: 16, totalWalk: 250, payment: 1550 },
  subPath: [
    { trafficType: 3, sectionTime: 3, distance: 200 },
    { trafficType: 1, sectionTime: 10, distance: 2000, lane: [{ name: '수도권 2호선' }], startName: '강남', endName: '선릉', passStopList: { stations: [
      { stationName: '강남', x: '127.0276', y: '37.4979' },
      { stationName: '역삼', x: '127.0364', y: '37.5007' },
      { stationName: '선릉', x: '127.0489', y: '37.5045' },
    ] } },
    { trafficType: 3, sectionTime: 3, distance: 50 },
  ],
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const response = () => json({ result: { searchType: 0, path: [fixture] } });
const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv('VITE_ODSAY_WEB_KEY', 'test%2Bkey');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('ODsay Web client', () => {
  it('calls ODsay directly with one key encoding and keeps stations, fares, minutes and meters', async () => {
    fetchMock.mockResolvedValueOnce(response());
    const result = await searchJourneys(origin, destination);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [input, options] = fetchMock.mock.calls[0];
    const url = new URL(String(input));
    expect(url.origin + url.pathname).toBe('https://api.odsay.com/v1/api/searchPubTransPathT');
    expect(url.searchParams.get('apiKey')).toBe('test+key');
    expect(url.searchParams.get('SX')).toBe(String(origin.lng));
    expect(url.searchParams.get('EY')).toBe(String(destination.lat));
    expect(options).toMatchObject({ credentials: 'omit', redirect: 'error', referrerPolicy: 'strict-origin-when-cross-origin' });
    expect(new Headers(options?.headers).has('Referer')).toBe(false);
    expect(result.routes[0]).toMatchObject({ totalTime: 16, totalWalk: 250, payment: 1550, transferCount: 0, stations: ['강남', '역삼', '선릉'], pathKind: 'stops' });
    expect(result.routes[0].segments.map(segment => segment.type)).toEqual(['walk', 'subway', 'walk']);
    expect(Number.isFinite(Date.parse(result.fetchedAt))).toBe(true);
  });

  it('reports HTTP 200 authentication errors without exposing the provider body or key', async () => {
    fetchMock.mockResolvedValueOnce(json({ error: [{ code: '500', message: '[ApiKeyAuthFailed] apiKey=test+key' }] }));
    const error = await searchJourneys(origin, destination).catch(error => error as Error);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('URI용 키');
    expect((error as Error).message).toContain('허용 도메인');
    expect((error as Error).message).not.toContain('test+key');
    expect(fetchMock).toHaveBeenCalledOnce(); // An invalid Web key must not silently fall back to the server.
  });

  it('cancels an in-flight browser request when the selected places change', async () => {
    let upstreamSignal: AbortSignal | undefined;
    fetchMock.mockImplementation((_input, options) => new Promise((_resolve, reject) => {
      upstreamSignal = options?.signal ?? undefined;
      upstreamSignal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
    }));
    const controller = new AbortController();
    const pending = searchJourneys(origin, destination, controller.signal);
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(upstreamSignal?.aborted).toBe(true);
  });

  it('uses an explicitly public runtime Web key when the build-time key is absent', async () => {
    vi.stubEnv('VITE_ODSAY_WEB_KEY', '');
    fetchMock.mockResolvedValueOnce(json({ odsayWebKey: 'runtime-web-key' })).mockResolvedValueOnce(response());
    await searchJourneys(origin, destination);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/map-config');
    expect(new URL(String(fetchMock.mock.calls[1][0])).searchParams.get('apiKey')).toBe('runtime-web-key');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('keeps the server route fallback when no Web key is configured', async () => {
    vi.stubEnv('VITE_ODSAY_WEB_KEY', '');
    const journey: TransitJourney = { id: 'server-route', provider: 'ODsay', totalTime: 12, totalWalk: 200, payment: 1550, transferCount: 0, stations: ['강남', '선릉'], path: [], segments: [{ type: 'subway', label: '2호선', time: 12 }] };
    const serverResult = { routes: [journey], fetchedAt: '2026-11-14T08:00:00Z' };
    fetchMock.mockResolvedValueOnce(json({ javascriptKey: null })).mockResolvedValueOnce(json(serverResult));
    expect(await searchJourneys(origin, destination)).toEqual(serverResult);
    const input = String(fetchMock.mock.calls[1][0]);
    expect(input).toMatch(/^\/api\/transit\?/);
    expect(input).not.toContain('apiKey');
  });

  it('retains the honest stop schematic if optional geometry fails', async () => {
    fetchMock.mockResolvedValueOnce(json({ result: { searchType: 0, path: [{ ...fixture, info: { ...fixture.info, mapObj: '2:2:222:220' } }] } }))
      .mockResolvedValueOnce(json({ error: [{ code: '500', message: 'Unavailable' }] }));
    const result = await searchJourneys(origin, destination);
    expect(new URL(String(fetchMock.mock.calls[1][0])).pathname).toBe('/v1/api/loadLane');
    expect(result.routes[0].pathKind).toBe('stops');
    expect(result.routes[0].path).toHaveLength(3);
    expect(result.routes[0].stations).toEqual(['강남', '역삼', '선릉']);
  });

  it('masks raw network errors that may contain the complete request URL', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch https://api.odsay.com?apiKey=test+key'));
    const error = await searchJourneys(origin, destination).catch(error => error as Error);
    expect((error as Error).message).toContain('허용 도메인');
    expect((error as Error).message).not.toContain('test+key');
  });
});
