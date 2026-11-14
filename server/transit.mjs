// Server-only: never import this module from the browser application.
// ODsay protocol: https://lab.odsay.com/guide/guide?platform=web
const MAX_UPSTREAM_BYTES = 8 * 1024 * 1024;
const ENDPOINTS = new Set(['/api/places', '/api/transit', '/api/map-config']);

export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
const text = (value, limit = 100) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
const list = value => Array.isArray(value) ? value : [];
const amount = value => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0;
export function coordinate(x, y) {
  if (x === null || y === null || x === '' || y === '') return null;
  const lng = Number(x), lat = Number(y);
  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= 32 && lat <= 39.5 && lng >= 124 && lng <= 132 ? { lat, lng } : null;
}
function requiredKey(env, names, provider) {
  const key = names.map(n => env[n]?.trim()).find(Boolean);
  if (!key) throw new ApiError(503, `${provider}_NOT_CONFIGURED`, `${provider === 'KAKAO' ? '카카오 장소 검색' : 'ODsay 길찾기'} 연결 설정이 아직 없어요. 직접 경로를 등록할 수 있어요.`);
  return key;
}
function decodedKey(key) {
  try { return decodeURIComponent(key); } catch { return key; }
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
function compactPath(points) {
  return points.filter((p, i) => i === 0 || p.lat !== points[i - 1].lat || p.lng !== points[i - 1].lng);
}
export function normalizePath(path, index = 0) {
  if (!path?.info || !Array.isArray(path.subPath) || path.subPath.length > 40) return null;
  if (['totalTime', 'totalWalk', 'payment'].some(k => path.info[k] == null || !Number.isFinite(Number(path.info[k])) || Number(path.info[k]) < 0)) return null;
  if (path.subPath.some(p => ![1, 2, 3].includes(p.trafficType) || p.sectionTime == null || !Number.isFinite(Number(p.sectionTime)) || Number(p.sectionTime) < 0 || list(p.passStopList?.stations).length > 200)) return null;
  const segments = path.subPath.slice(0, 40).flatMap(p => {
    if (![1, 2, 3].includes(p.trafficType)) return [];
    const type = p.trafficType === 1 ? 'subway' : p.trafficType === 2 ? 'bus' : 'walk';
    const lanes = Array.isArray(p.lane) ? p.lane : p.lane ? [p.lane] : [];
    const lane = lanes[0] ?? {};
    const line = type === 'subway' ? text(lane.name) : text(lane.busNo);
    const stops = list(p.passStopList?.stations).slice(0, 200);
    const stations = stops.map(s => text(s.stationName)).filter(Boolean);
    const points = compactPath(stops.map(s => coordinate(s.x, s.y)).filter(Boolean));
    const from = text(p.startName), to = text(p.endName);
    if (!stations.length) stations.push(...[from, to].filter(Boolean));
    if (!points.length) points.push(...[coordinate(p.startX, p.startY), coordinate(p.endX, p.endY)].filter(Boolean));
    return [{ type, label: type === 'walk' ? '도보' : line || (type === 'subway' ? '지하철' : '버스'), time: amount(p.sectionTime), ...(p.distance != null && Number.isFinite(Number(p.distance)) && Number(p.distance) >= 0 ? { distance: Number(p.distance) } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}), stations, ...(line ? { line } : {}), path: points }];
  });
  if (!segments.length) return null;
  const stations = [...new Set(segments.filter(s => s.type !== 'walk').flatMap(s => s.stations))];
  const boardings = segments.filter(s => s.type !== 'walk').length;
  if (!boardings || stations.length > 200) return null;
  return {
    id: `odsay-${index}`, totalTime: amount(path.info.totalTime), totalWalk: amount(path.info.totalWalk),
    payment: amount(path.info.payment), transferCount: Math.max(0, boardings - 1), segments,
    path: compactPath(segments.flatMap(s => s.path)), stations, provider: 'ODsay', pathKind: 'stops',
  };
}
export async function searchTransit(params, env = process.env, fetcher = fetch) {
  const start = coordinate(params.sx, params.sy), end = coordinate(params.ex, params.ey);
  if (!start || !end) throw new ApiError(400, 'INVALID_COORDINATES', '검색 결과에서 출발지와 도착지를 선택해 주세요.');
  if (start.lat === end.lat && start.lng === end.lng) throw new ApiError(400, 'SAME_PLACE', '출발지와 다른 도착지를 선택해 주세요.');
  const key = decodedKey(requiredKey(env, ['ODSAY_API_KEY'], 'ODSAY'));
  const url = new URL('https://api.odsay.com/v1/api/searchPubTransPathT');
  url.search = new URLSearchParams({ apiKey: key, SX: String(start.lng), SY: String(start.lat), EX: String(end.lng), EY: String(end.lat), OPT: '0', SearchType: '0', SearchPathType: '0' }).toString();
  const data = await upstreamJson(url, {}, 'ODSAY', fetcher);
  if (!Array.isArray(data.result?.path)) throw new ApiError(502, 'ODSAY_BAD_RESPONSE', '대중교통 경로 응답을 읽지 못했어요. 잠시 후 다시 시도해 주세요.');
  // Intercity responses require extra terminal legs; don't misrepresent them as a complete trip.
  if (Number(data.result.searchType) === 1) throw new ApiError(422, 'INTERCITY_UNSUPPORTED', '현재는 도시 안의 버스·지하철 경로를 지원해요. 같은 도시 안에서 검색해 주세요.');
  const routes = data.result.path.slice(0, 5).map(normalizePath).filter(Boolean);
  if (!routes.length) throw new ApiError(422, 'NO_TRANSIT_ROUTE', '이 구간의 대중교통 경로를 찾지 못했어요. 다른 장소를 골라 주세요.');
  // Stop coordinates always remain a truthful schematic fallback. Load geometry for
  // the first three candidates only, with a short independent timeout.
  await Promise.all(routes.slice(0, 3).map(async route => {
    const original = data.result.path[Number(route.id.split('-')[1])];
    const mapObject = text(original?.info?.mapObj, 2000);
    if (!mapObject || !/^[\d:,@\-]+$/.test(mapObject)) return;
    const geometryUrl = new URL('https://api.odsay.com/v1/api/loadLane');
    geometryUrl.search = new URLSearchParams({ apiKey: key, mapObject: `0:0@${mapObject}` }).toString();
    try {
      const graphics = await upstreamJson(geometryUrl, {}, 'ODSAY', fetcher, 3000);
      const sections = list(graphics.result?.lane).flatMap(l => list(l.section).map(s => compactPath(list(s.graphPos).map(p => coordinate(p.x, p.y)).filter(Boolean)))).filter(p => p.length > 1);
      const points = sections.flat();
      if (points.length > 1 && points.length <= 6000) {
        // Flattening disjoint lanes would draw fictitious connections; only upgrade a continuous single section.
        if (sections.length === 1) { route.path = points; route.pathKind = 'geometry'; }
      }
    } catch { /* Directions remain usable without optional route graphics. */ }
  }));
  return { routes, fetchedAt: new Date().toISOString() };
}
export function mapConfig(env = process.env) {
  return { javascriptKey: env.VITE_KAKAO_JS_KEY?.trim() || env.NEXT_PUBLIC_KAKAO_JS_KEY?.trim() || null };
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
