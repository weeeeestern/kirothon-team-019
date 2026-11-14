const AREAS = new Set(['강남역', '여의도']);
const cache = new Map();
const pending = new Map();
const TTL = 5 * 60 * 1000;

const unescapeXml = value => value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
function field(xml, name) {
  const value = new RegExp(`<${name}>([\\s\\S]*?)</${name}>`).exec(xml)?.[1];
  return value === undefined ? null : unescapeXml(value).trim().slice(0, 1200);
}
function number(xml, name) {
  const value = field(xml, name);
  if (!value || !/^-?\d+(\.\d+)?$/.test(value)) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function timestamp(xml, name) {
  const raw = field(xml, name);
  if (!raw) return null;
  const normalized = raw.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/, '$1-$2-$3 $4:$5');
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(normalized) ? normalized : null;
}

export function parseCityData(xml, requestedArea, fetchedAt = new Date().toISOString()) {
  if (field(xml, 'RESULT.CODE') !== 'INFO-000') throw new Error('UPSTREAM_REJECTED');
  const area = field(xml, 'AREA_NM');
  if (area !== requestedArea) throw new Error('AREA_MISMATCH');
  const disruptions = [];
  // Capture leaf records only; the service wraps them in another tag with the same name.
  for (const match of xml.matchAll(/<ACDNT_CNTRL_STTS>((?:(?!<ACDNT_CNTRL_STTS>)[\s\S])*?)<\/ACDNT_CNTRL_STTS>/g)) {
    const info = field(match[1], 'ACDNT_INFO');
    if (info) disruptions.push({ info, type: field(match[1], 'ACDNT_TYPE'), observedAt: timestamp(match[1], 'ACDNT_TIME'), startsAt: timestamp(match[1], 'ACDNT_OCCR_DT'), endsAt: timestamp(match[1], 'EXP_CLR_DT') });
  }
  return {
    source: '서울시 실시간 도시데이터', area, fetchedAt,
    population: { observedAt: timestamp(xml, 'PPLTN_TIME'), level: field(xml, 'AREA_CONGEST_LVL'), message: field(xml, 'AREA_CONGEST_MSG'), min: number(xml, 'AREA_PPLTN_MIN'), max: number(xml, 'AREA_PPLTN_MAX') },
    weather: { observedAt: timestamp(xml, 'WEATHER_TIME'), temperature: number(xml, 'TEMP'), precipitation: field(xml, 'PRECIPITATION'), precipitationType: field(xml, 'PRECPT_TYPE'), pm10: number(xml, 'PM10'), pm25: number(xml, 'PM25'), pm25Level: field(xml, 'PM25_INDEX') },
    disruptions: disruptions.slice(0, 20),
  };
}

async function boundedText(response) {
  if (!response.ok || !response.body) throw new Error('UPSTREAM_HTTP');
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 5_000_000) throw new Error('RESPONSE_TOO_LARGE');
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  return Buffer.concat(chunks).toString('utf8');
}

export async function getLiveArea(area, env = process.env) {
  if (!AREAS.has(area)) throw new Error('UNSUPPORTED_AREA');
  const key = env.SEOUL_DATA_API_KEY;
  if (!key) throw new Error('MISSING_KEY');
  const existing = cache.get(area);
  if (existing && Date.now() - existing.time < TTL) return existing.value;
  if (pending.has(area)) return pending.get(area);
  const request = (async () => {
    const url = `http://openapi.seoul.go.kr:8088/${encodeURIComponent(key)}/xml/citydata/1/5/${encodeURIComponent(area)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(12000), redirect: 'error' });
    const value = parseCityData(await boundedText(response), area);
    cache.set(area, { time: Date.now(), value });
    return value;
  })();
  pending.set(area, request);
  try { return await request; } finally { pending.delete(area); }
}

export async function handleLiveRequest(req, res, env = process.env) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname !== '/api/live') return false;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET'); res.statusCode = 405;
    res.end(JSON.stringify({ error: '조회 요청만 사용할 수 있어요.' })); return true;
  }
  const area = url.searchParams.get('area') ?? '강남역';
  try { res.end(JSON.stringify(await getLiveArea(area, env))); }
  catch (error) {
    const code = error?.message;
    res.statusCode = code === 'UNSUPPORTED_AREA' ? 400 : 503;
    const message = code === 'UNSUPPORTED_AREA' ? '아직 지원하지 않는 관측 지점이에요.' : code === 'MISSING_KEY' ? '현재 관측 데이터 연결을 준비하고 있어요.' : '현재 관측 데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
    res.end(JSON.stringify({ error: message, code: ['UNSUPPORTED_AREA', 'MISSING_KEY'].includes(code) ? code : 'LIVE_UNAVAILABLE' }));
  }
  return true;
}
