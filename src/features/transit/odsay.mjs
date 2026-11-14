// Shared ODsay parsing and route logic: no environment access or stored credentials.
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
    const stopsComplete = stations.length >= 2 && stations.length === stops.length;
    const points = compactPath(stops.map(s => coordinate(s.x, s.y)).filter(Boolean));
    const from = text(p.startName), to = text(p.endName);
    if (!stations.length) stations.push(...[from, to].filter(Boolean));
    if (!points.length) points.push(...[coordinate(p.startX, p.startY), coordinate(p.endX, p.endY)].filter(Boolean));
    return [{ type, label: type === 'walk' ? '도보' : line || (type === 'subway' ? '지하철' : '버스'), time: amount(p.sectionTime), ...(p.distance != null && Number.isFinite(Number(p.distance)) && Number(p.distance) >= 0 ? { distance: Number(p.distance) } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}), stations, stopsComplete, ...(line ? { line } : {}), path: points }];
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
export async function searchOdsay(params, key, request) {
  const start = coordinate(params.sx, params.sy), end = coordinate(params.ex, params.ey);
  if (!start || !end) throw new ApiError(400, 'INVALID_COORDINATES', '검색 결과에서 출발지와 도착지를 선택해 주세요.');
  if (start.lat === end.lat && start.lng === end.lng) throw new ApiError(400, 'SAME_PLACE', '출발지와 다른 도착지를 선택해 주세요.');
  try { key = decodeURIComponent(key); } catch { /* Already decoded. */ }
  const url = new URL('https://api.odsay.com/v1/api/searchPubTransPathT');
  url.search = new URLSearchParams({ apiKey: key, SX: String(start.lng), SY: String(start.lat), EX: String(end.lng), EY: String(end.lat), OPT: '0', SearchType: '0', SearchPathType: '0' }).toString();
  const data = await request(url, 10000);
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
      const graphics = await request(geometryUrl, 3000);
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
