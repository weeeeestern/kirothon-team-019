// Server-only: never import this module from the browser application.
// ODsay protocol: https://lab.odsay.com/guide/guide?platform=web
const MAX_UPSTREAM_BYTES = 8 * 1024 * 1024;
const ENDPOINTS = new Set(['/api/places', '/api/transit', '/api/map-config']);

import { ApiError, coordinate, normalizePath, searchOdsay } from '../src/features/transit/odsay.mjs';
export { ApiError, coordinate, normalizePath };
const text = (value, limit = 100) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
function requiredKey(env, names, provider) {
  const key = names.map(n => env[n]?.trim()).find(Boolean);
  if (!key) throw new ApiError(503, `${provider}_NOT_CONFIGURED`, `${provider === 'KAKAO' ? '카카오 장소 검색' : 'ODsay 길찾기'} 연결 설정이 아직 없어요. 직접 경로를 등록할 수 있어요.`);
  return key;
}
function failProvider(provider, status, data) {
  const errors = Array.isArray(data?.error) ? data.error : [data?.error];
  const detail = String(data?.message ?? errors[0]?.message ?? '');
  const code = String(errors[0]?.code ?? '');
  if (provider === 'KAKAO' && /disabled.*OPEN_MAP_AND_LOCAL/i.test(detail)) {
    throw new ApiError(503, 'KAKAO_SERVICE_DISABLED', '카카오맵 서비스가 비활성화되어 장소를 검색할 수 없어요. 앱 관리자가 카카오맵 사용 설정을 켜야 해요.');
  }
  if (provider === 'ODSAY' && /ApiKeyAuthFailed/i.test(detail)) {
    throw new ApiError(503, 'ODSAY_AUTH_FAILED', 'ODsay 인증이 확인되지 않았어요. 앱 관리자가 서버용 키와 허용 IP 설정을 확인해야 해요.');
  }
  if (status === 401 || status === 403) throw new ApiError(503, `${provider}_AUTH_FAILED`, '지도·길찾기 서비스 인증을 확인하지 못했어요. 앱 관리자가 키와 서비스 설정을 확인해야 해요.');
  if (status === 429 || /quota|limit|exceed/i.test(detail)) throw new ApiError(429, `${provider}_RATE_LIMIT`, '검색 요청이 잠시 많아요. 잠시 후 다시 검색해 주세요.');
  if (provider === 'ODSAY' && ['3', '4', '5', '6', '-98', '-99'].includes(code)) {
    const message = code === '-98' ? '출발지와 도착지가 너무 가까워 대중교통 경로가 없어요.' : '이 구간의 대중교통 경로를 찾지 못했어요. 다른 출발·도착 장소를 골라 주세요.';
    throw new ApiError(422, 'NO_TRANSIT_ROUTE', message);
  }
  throw new ApiError(502, `${provider}_UNAVAILABLE`, '지도·길찾기 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
}
export async function upstreamJson(url, options = {}, provider, fetcher = fetch, timeout = 10000) {
  let response;
  try {
    response = await fetcher(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(timeout), headers: { Accept: 'application/json', ...options.headers } });
    const reader = response.body?.getReader();
    const parts = []; let bytes = 0;
    if (reader) {
      try {
        while (true) {
          const next = await reader.read();
          if (next.done) break;
          bytes += next.value.byteLength;
          if (bytes > MAX_UPSTREAM_BYTES) {
            await reader.cancel();
            throw new ApiError(502, 'UPSTREAM_TOO_LARGE', '검색 결과가 너무 커서 표시하지 못했어요. 더 가까운 장소로 검색해 주세요.');
          }
          parts.push(next.value);
        }
      } finally { reader.releaseLock(); }
    }
    const data = JSON.parse(Buffer.concat(parts).toString('utf8'));
    if (!response.ok || data?.error || data?.errorType) failProvider(provider, response.status, data);
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') throw new ApiError(504, 'UPSTREAM_TIMEOUT', '검색 응답이 늦어지고 있어요. 잠시 후 다시 시도해 주세요.');
    // Never return fetch errors or upstream bodies: they may contain the credential URL.
    throw new ApiError(502, `${provider}_UNAVAILABLE`, '지도·길찾기 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
  }
}
export async function searchPlaces(query, env = process.env, fetcher = fetch) {
  if (typeof query !== 'string' || query.trim().length < 2 || query.trim().length > 80 || /[\x00-\x1f]/.test(query)) throw new ApiError(400, 'INVALID_QUERY', '장소 이름을 2~80자로 입력해 주세요.');
  const key = requiredKey(env, ['KAKAO_REST_API_KEY', 'NEXT_PUBLIC_KAKAO_REST_API_KEY'], 'KAKAO');
  const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
  url.search = new URLSearchParams({ query: query.trim(), size: '10' }).toString();
  const data = await upstreamJson(url, { headers: { Authorization: `KakaoAK ${key}` } }, 'KAKAO', fetcher);
  if (!Array.isArray(data.documents)) throw new ApiError(502, 'KAKAO_BAD_RESPONSE', '장소 검색 결과를 읽지 못했어요. 잠시 후 다시 시도해 주세요.');
  const places = data.documents.slice(0, 10).flatMap(p => {
    const point = coordinate(p.x, p.y), name = text(p.place_name), id = text(p.id);
    if (!point || !name || !id) return [];
    const address = text(p.road_address_name || p.address_name, 180);
    const district = text(p.address_name, 180).split(' ').find(part => /[구군]$/.test(part));
    return [{ id, name, address, ...point, ...(district ? { district } : {}) }];
  });
  return { places };
}
export async function searchTransit(params, env = process.env, fetcher = fetch) {
  if (!coordinate(params.sx, params.sy) || !coordinate(params.ex, params.ey)) throw new ApiError(400, 'INVALID_COORDINATES', '검색 결과에서 출발지와 도착지를 선택해 주세요.');
  const key = requiredKey(env, ['ODSAY_API_KEY'], 'ODSAY');
  return searchOdsay(params, key, (url, timeout) => upstreamJson(url, {}, 'ODSAY', fetcher, timeout));
}
export function mapConfig(env = process.env) {
  return { javascriptKey: env.VITE_KAKAO_JS_KEY?.trim() || env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim() || null, ...(env.VITE_ODSAY_WEB_KEY?.trim() ? { odsayWebKey: env.VITE_ODSAY_WEB_KEY.trim() } : {}) };
}
export async function handleRequest(req, res, env = process.env, fetcher = fetch) {
  const url = new URL(req.url || '/', 'http://localhost');
  if (!ENDPOINTS.has(url.pathname)) return false;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'GET 요청만 사용할 수 있어요.'); }
    if ([...url.searchParams.keys()].some(k => url.searchParams.getAll(k).length > 1)) throw new ApiError(400, 'DUPLICATE_PARAMETER', '검색 조건을 다시 입력해 주세요.');
    let result;
    if (url.pathname === '/api/map-config') result = mapConfig(env);
    else if (url.pathname === '/api/places') result = await searchPlaces(url.searchParams.get('q'), env, fetcher);
    else result = await searchTransit(Object.fromEntries(url.searchParams), env, fetcher);
    res.statusCode = 200; res.end(JSON.stringify(result));
  } catch (error) {
    const safe = error instanceof ApiError ? error : new ApiError(500, 'INTERNAL_ERROR', '검색을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.');
    res.statusCode = safe.status; res.end(JSON.stringify({ error: safe.message, code: safe.code }));
  }
  return true;
}
