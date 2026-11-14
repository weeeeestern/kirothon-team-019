import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCityData, handleLiveRequest } from './live.mjs';

test('city XML preserves zero, missing values, source times, and leaf disruptions', () => {
  const xml = '<root><RESULT.CODE>INFO-000</RESULT.CODE><AREA_NM>강남역</AREA_NM><TEMP>0</TEMP><PM25>-</PM25><PPLTN_TIME>2026-11-14 16:00</PPLTN_TIME><WEATHER_TIME>202611141620</WEATHER_TIME><ACDNT_CNTRL_STTS><ACDNT_CNTRL_STTS><ACDNT_INFO>통제 &amp; 우회</ACDNT_INFO></ACDNT_CNTRL_STTS></ACDNT_CNTRL_STTS></root>';
  const result = parseCityData(xml, '강남역');
  assert.equal(result.weather.temperature, 0);
  assert.equal(result.weather.pm25, null);
  assert.equal(result.weather.observedAt, '2026-11-14 16:20');
  assert.equal(result.population.observedAt, '2026-11-14 16:00');
  assert.deepEqual(result.disruptions.map(item => item.info), ['통제 & 우회']);
});
test('failed and mismatched upstream data never becomes a normal result', () => {
  assert.throws(() => parseCityData('<RESULT.CODE>ERROR-300</RESULT.CODE>', '강남역'));
  assert.throws(() => parseCityData('<RESULT.CODE>INFO-000</RESULT.CODE><AREA_NM>여의도</AREA_NM>', '강남역'));
});
test('handler rejects unsupported area and masks missing credentials', async () => {
  const call = async url => {
    let output;
    const res = { setHeader() {}, end(value) { output = JSON.parse(value); } };
    await handleLiveRequest({ url, method: 'GET' }, res, {});
    return { status: res.statusCode, output };
  };
  assert.equal((await call('/api/live?area=other')).status, 400);
  assert.deepEqual((await call('/api/live?area=강남역')).output, { error: '현재 관측 데이터 연결을 준비하고 있어요.', code: 'MISSING_KEY' });
});
