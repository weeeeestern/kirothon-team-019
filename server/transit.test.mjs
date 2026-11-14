import test from 'node:test';
import assert from 'node:assert/strict';
import { coordinate, handleRequest, mapConfig, normalizePath, searchPlaces, searchTransit, upstreamJson } from './transit.mjs';

const fixture = {
  info: { totalTime: 16, totalWalk: 250, payment: 1550, mapObj: '2:2:222:220' },
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
const params = { sx: '127.0276', sy: '37.4979', ex: '127.0489', ey: '37.5045' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status });
function response() {
  return { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(s) { this.body = JSON.parse(s); } };
}

test('coordinates reject missing, non-finite and outside-Korea values', () => {
  for (const pair of [[null, null], ['', ''], [undefined, 37], [127, Infinity], [0, 37], [127, 90]]) assert.equal(coordinate(...pair), null);
  assert.deepEqual(coordinate('127', '37'), { lat: 37, lng: 127 });
});
test('ODsay normalization preserves intermediate stations, units and transport mode', () => {
  const route = normalizePath(fixture);
  assert.deepEqual(route.stations, ['강남', '역삼', '선릉']);
  assert.equal(route.totalWalk, 250); // meters, not six walking minutes
  assert.equal(route.totalTime, 16);
  assert.equal(route.transferCount, 0);
  assert.equal(route.payment, 1550);
  assert.equal(route.segments[1].line, '수도권 2호선');
  assert.equal(route.segments[1].stopsComplete, true);
  const withoutStops = structuredClone(fixture);
  delete withoutStops.subPath[1].passStopList;
  assert.equal(normalizePath(withoutStops).segments[1].stopsComplete, false);
  assert.equal(route.pathKind, 'stops');
  assert.equal(route.path.length, 3);
  assert.equal(Object.hasOwn(route.segments[0], 'from'), false);
  assert.equal(Object.hasOwn(route.segments[0], 'to'), false);
  assert.equal(Object.hasOwn(route.segments[0], 'line'), false);
});
test('malformed or unsupported partial transit results are not invented as complete routes', () => {
  assert.equal(normalizePath({ ...fixture, info: { totalTime: null } }), null);
  assert.equal(normalizePath({ ...fixture, subPath: [...fixture.subPath, { trafficType: 4 }] }), null);
  assert.equal(normalizePath({ ...fixture, subPath: new Array(41).fill(fixture.subPath[1]) }), null);
});
test('server requests Kakao with secret header and only returns safe place fields', async () => {
  const result = await searchPlaces('강남역', { KAKAO_REST_API_KEY: 'private-token' }, async (url, opts) => {
    assert.equal(new URL(url).hostname, 'dapi.kakao.com');
    assert.equal(new URL(url).searchParams.get('query'), '강남역');
    assert.equal(opts.headers.Authorization, 'KakaoAK private-token');
    return json({ documents: [{ id: '1', place_name: '강남역', road_address_name: '서울 강남구 강남대로', address_name: '서울 강남구 역삼동', x: '127.0276', y: '37.4979', secret: 'discard' }] });
  });
  assert.equal(result.places[0].district, '강남구');
  assert.equal(result.places[0].secret, undefined);
  assert.ok(!JSON.stringify(result).includes('private-token'));
});
test('key encoded exactly once, geometry failure keeps truthful stop schematic', async () => {
  const calls = [];
  const result = await searchTransit(params, { ODSAY_API_KEY: 'a%2Bb%3D' }, async url => {
    calls.push(new URL(url));
    assert.equal(new URL(url).searchParams.get('apiKey'), 'a+b=');
    if (String(url).includes('loadLane')) return json({ error: [{ code: '500', message: 'Unavailable' }] });
    return json({ result: { searchType: 0, path: [fixture] } });
  });
  assert.equal(calls.length, 2);
  assert.equal(result.routes[0].pathKind, 'stops');
  assert.ok(Number.isFinite(Date.parse(result.fetchedAt)));
});
test('successful loadLane upgrades only valid continuous geometry', async () => {
  const result = await searchTransit(params, { ODSAY_API_KEY: 'test' }, async url => String(url).includes('loadLane')
    ? json({ result: { lane: [{ section: [{ graphPos: [{ x: 127.0276, y: 37.4979 }, { x: 127.0489, y: 37.5045 }] }] }] } })
    : json({ result: { searchType: 0, path: [fixture] } }));
  assert.equal(result.routes[0].pathKind, 'geometry');
  assert.equal(result.routes[0].path.length, 2);
});
test('provider denial is actionable and never returns original secret-containing body', async () => {
  const res = response();
  await handleRequest({ method: 'GET', url: '/api/places?q=강남역' }, res, { KAKAO_REST_API_KEY: 'secret' }, async () => json({ message: 'App(secret) disabled OPEN_MAP_AND_LOCAL service.', errorType: 'NotAuthorizedError' }, 403));
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, 'KAKAO_SERVICE_DISABLED');
  assert.ok(!JSON.stringify(res.body).includes('secret'));
  const odsay = response();
  await handleRequest({ method: 'GET', url: '/api/transit?' + new URLSearchParams(params) }, odsay, { ODSAY_API_KEY: 'secret' }, async () => json({ error: [{ code: '500', message: '[ApiKeyAuthFailed] secret' }] }));
  assert.equal(odsay.body.code, 'ODSAY_AUTH_FAILED');
});
test('invalid input and method fail before upstream call', async () => {
  const fetcher = () => { throw new Error('Must not fetch'); };
  for (const [url, method, status] of [['/api/places?q=x', 'GET', 400], ['/api/transit?sx=NaN', 'GET', 400], ['/api/places?q=강남&q=선릉', 'GET', 400], ['/api/map-config', 'POST', 405]]) {
    const res = response(); await handleRequest({ method, url }, res, {}, fetcher); assert.equal(res.statusCode, status);
  }
});
test('only public JS key can leave map configuration, unrelated routes remain untouched', async () => {
  assert.deepEqual(mapConfig({ VITE_ODSAY_WEB_KEY: 'uri-public', ODSAY_API_KEY: 'server-private', KAKAO_REST_API_KEY: 'rest-private' }), { javascriptKey: null, odsayWebKey: 'uri-public' });
  assert.deepEqual(mapConfig({ NEXT_PUBLIC_KAKAO_JS_KEY: 'public', KAKAO_REST_API_KEY: 'private', ODSAY_API_KEY: 'private' }), { javascriptKey: 'public' });
  assert.deepEqual(mapConfig({}), { javascriptKey: null });
  const res = response();
  assert.equal(await handleRequest({ method: 'GET', url: '/api/live' }, res), false);
  assert.equal(res.body, undefined);
});
test('raw network errors with secret URLs are replaced', async () => {
  await assert.rejects(upstreamJson('https://example.invalid?apiKey=secret', {}, 'ODSAY', () => { throw new Error('https://example.invalid?apiKey=secret'); }), error => error.code === 'ODSAY_UNAVAILABLE' && !error.message.includes('secret'));
});
