import { describe, expect, it } from 'vitest';
import { assertPublicBaselines, findAirQuality, findCongestion, findRidership, loadPublicBaselines } from './publicBaseline';
import type { PublicBaselines } from './publicBaseline';

describe('historical public baselines', () => {
  it('loads the latest original quarterly data, keeping directions separate', async () => {
    const bundle = await loadPublicBaselines();
    expect(bundle.congestion.referenceDate).toBe('2026-09-30');
    expect(bundle.congestion.rows).toHaveLength(1671);
    const rows = findCongestion(bundle, { station: '서울역', line: '1', day: 'weekday', time: '08:00' });
    expect(rows.map(r => r.direction).sort()).toEqual(['상선', '하선']);
    // Independently inspected source cells, sheet 평일 / 서울역 / 08:00~08:30.
    expect(rows.find(r => r.direction === '상선')?.meanPercent).toBeCloseTo(76.606, 3);
    expect(rows.find(r => r.direction === '하선')?.meanPercent).toBeCloseTo(41.432, 3);
    expect(rows.every(r => r.unit === '%')).toBe(true);
    expect(bundle.congestion.dailyVarianceAvailable).toBe(false);
  });

  it('looks up service-day midnight without substituting the nearest unsupported slot', async () => {
    const bundle = await loadPublicBaselines();
    const query = { station: '서울', line: '1호선', direction: '상선', day: 'weekday' as const };
    expect(findCongestion(bundle, { ...query, time: '00:30' })[0]?.slotStart).toBe('24:30');
    expect(findCongestion(bundle, { ...query, time: '03:00' })).toEqual([]);
    expect(findCongestion(bundle, { ...query, time: '08:60' })).toEqual([]);
    expect(findCongestion(bundle, { ...query, station: '없는역', time: '08:00' })).toEqual([]);
  });

  it('preserves station line ambiguity instead of silently selecting one line', async () => {
    const bundle = await loadPublicBaselines();
    const query = { station: '교대역', day: 'weekday' as const, time: '08:10' };
    const lines = new Set(findCongestion(bundle, query).map(row => row.line));
    expect(lines.size).toBe(2);
    expect(findCongestion(bundle, { ...query, line: '2호선' }).every(row => row.line === '2호선')).toBe(true);
  });

  it('keeps daily gate passenger statistics in people with calendar sample counts', async () => {
    const bundle = await loadPublicBaselines();
    const rows = findRidership(bundle, { station: '서울역', line: '1', day: 'weekday', time: '08:00' });
    expect(rows).toHaveLength(2);
    expect(rows.every(row => row.sampleDays === 261 && row.mean > 0 && row.std! > 0 && row.unit === '명')).toBe(true);
    expect(rows[0].sourcePeriod).toBe('2025-01-01 ~ 2025-12-31');
  });

  it('retains true zero and excludes missing congestion cells', async () => {
    const bundle = await loadPublicBaselines();
    const base = bundle.congestion.rows[0];
    const fixture = { ...bundle, congestion: { ...bundle.congestion, slots: [480, 510], rows: [{ ...base, values: [0, null] }] } } as PublicBaselines;
    const query = { station: base.station, day: base.day, direction: base.direction };
    expect(findCongestion(fixture, { ...query, time: '08:00' })[0]?.meanPercent).toBe(0);
    expect(findCongestion(fixture, { ...query, time: '08:30' })).toEqual([]);
  });

  it('returns Seoul air observations separately in micrograms per cubic metre', async () => {
    const bundle = await loadPublicBaselines();
    const rows = findAirQuality(bundle, { district: '강남구', day: 'weekday', hour: 8, pollutant: 'PM25' });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every(r => r.unit === 'µg/m³' && r.sampleHours > 1 && r.pollutant === 'PM25')).toBe(true);
    expect(findAirQuality(bundle, { district: '강남구', day: 'weekday', hour: 24 })).toEqual([]);
  });

  it('rejects malformed statistical tuples before displaying generated data', async () => {
    const bundle = structuredClone(await loadPublicBaselines());
    bundle.ridership.rows[0].values[0] = [10, 0, 0];
    expect(() => assertPublicBaselines(bundle)).toThrow('공공데이터 형식');
  });
});
