import type { Place, TransitJourney } from './types';
import { validJourney, validPlace } from '../routes/route';

export async function requestJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, 25000);
  try {
    const response = await fetch(path, { signal: controller.signal, headers: { Accept: 'application/json' } });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(typeof body?.error === 'string' ? body.error : '연결을 확인하지 못했어요. 잠시 후 다시 검색해 주세요.');
    if (!body || typeof body !== 'object') throw new Error('검색 결과를 읽지 못했어요. 다시 검색해 주세요.');
    return body as T;
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (controller.signal.aborted) throw new Error('응답이 늦어지고 있어요. 다시 검색해 주세요.');
    if (error instanceof TypeError) throw new Error('인터넷 연결을 확인한 뒤 다시 검색해 주세요.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const body = await requestJson<{ places: unknown }>(`/api/places?${new URLSearchParams({ q: query.trim() })}`, signal);
  if (!Array.isArray(body.places) || !body.places.every(validPlace)) throw new Error('장소 정보가 올바르지 않아요. 다시 검색해 주세요.');
  return body.places;
}

export async function searchJourneys(origin: Place, destination: Place, signal?: AbortSignal) {
  const query = new URLSearchParams({ sx: String(origin.lng), sy: String(origin.lat), ex: String(destination.lng), ey: String(destination.lat) });
  const body = await requestJson<{ routes: unknown; fetchedAt: string }>(`/api/transit?${query}`, signal);
  if (!Array.isArray(body.routes) || !body.routes.every(validJourney) || !Number.isFinite(Date.parse(body.fetchedAt))) throw new Error('경로 정보가 올바르지 않아요. 다시 검색해 주세요.');
  return { routes: body.routes as TransitJourney[], fetchedAt: body.fetchedAt };
}
