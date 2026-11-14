/** Historical public observations. Never substitute these for live observations. */
export type BaselineDay = 'weekday' | 'saturday' | 'sunday';
export type Statistics = [mean: number | null, std: number | null, count: number];
interface StationRow { station: string; stationCode: string; line: string; direction: string; day: BaselineDay }
interface CongestionRow extends StationRow { values: (number | null)[] }
interface RidershipRow extends StationRow { values: Statistics[] }
interface AirRow { district: string; station: string; stationCode: string; pollutant: 'PM10' | 'PM25'; day: BaselineDay; values: Statistics[] }
export interface PublicBaselines {
  congestion: { referenceDate: string; unit: string; filename: string; slots: number[]; rows: CongestionRow[]; dailyVarianceAvailable: boolean };
  ridership: { periodStart: string; periodEnd: string; unit: string; columns: string[]; rows: RidershipRow[]; filename: string };
  air: { periodStart: string; periodEnd: string; unit: string; rows: AirRow[] };
  provenance: { importedAt: string; mode: string; limitations: string[]; sources: { filename: string; kind: string; parsedRows: number; usedRows: number; sha256: string }[] };
}
export interface StationQuery { station: string; line?: string; direction?: string; day: BaselineDay; time: string }
export interface CongestionMatch extends StationRow {
  meanPercent: number; sourcePeriod: string; slotStart: string; slotEnd: string; unit: '%';
}
export interface RidershipMatch extends StationRow {
  mean: number; std: number | null; sampleDays: number; sourcePeriod: string; timeLabel: string; unit: '명';
}
export interface AirMatch {
  district: string; station: string; stationCode: string; pollutant: 'PM10' | 'PM25'; day: BaselineDay;
  mean: number; std: number | null; sampleHours: number; sourcePeriod: string; unit: 'µg/m³';
}

let pending: Promise<PublicBaselines> | undefined;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('공공데이터 형식을 확인할 수 없어요.');
  return value as Record<string, unknown>;
}
const validNumber = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const maybeNumber = (value: unknown) => value === null || validNumber(value);
const validDay = (value: unknown) => ['weekday', 'saturday', 'sunday'].includes(String(value));
function stationRow(value: unknown): boolean {
  const row = object(value);
  return ['station', 'stationCode', 'line', 'direction'].every(key => typeof row[key] === 'string') && validDay(row.day);
}
function statistics(value: unknown): boolean {
  return Array.isArray(value) && value.length === 3 && maybeNumber(value[0]) && maybeNumber(value[1])
    && validNumber(value[2]) && Number.isInteger(value[2])
    && (value[2] === 0 ? value[0] === null : value[0] !== null)
    && (value[2] < 2 ? value[1] === null : value[1] !== null);
}
/** Reject malformed generated bundles rather than showing missing values as normal. */
export function assertPublicBaselines(value: unknown): asserts value is PublicBaselines {
  const bundle = object(value);
  const congestion = object(bundle.congestion), ridership = object(bundle.ridership), air = object(bundle.air), provenance = object(bundle.provenance);
  const slots = congestion.slots, columns = ridership.columns;
  const valid = typeof congestion.referenceDate === 'string' && congestion.unit === '%' && typeof congestion.filename === 'string'
    && congestion.dailyVarianceAvailable === false && Array.isArray(slots) && slots.every(validNumber)
    && Array.isArray(congestion.rows) && congestion.rows.every(value => {
      const row = object(value);
      return stationRow(row) && Array.isArray(row.values) && row.values.length === slots.length && row.values.every(maybeNumber);
    }) && ['periodStart', 'periodEnd', 'filename'].every(key => typeof ridership[key] === 'string') && ridership.unit === '명'
    && Array.isArray(columns) && columns.every(c => typeof c === 'string')
    && Array.isArray(ridership.rows) && ridership.rows.every(value => {
      const row = object(value);
      return stationRow(row) && Array.isArray(row.values) && row.values.length === columns.length && row.values.every(statistics);
    }) && ['periodStart', 'periodEnd'].every(key => typeof air[key] === 'string') && air.unit === 'µg/m³'
    && Array.isArray(air.rows) && air.rows.every(value => {
      const row = object(value);
      return ['district', 'station', 'stationCode'].every(key => typeof row[key] === 'string') && validDay(row.day)
        && ['PM10', 'PM25'].includes(String(row.pollutant)) && Array.isArray(row.values) && row.values.length === 24 && row.values.every(statistics);
    }) && typeof provenance.importedAt === 'string' && typeof provenance.mode === 'string'
    && Array.isArray(provenance.limitations) && provenance.limitations.every(v => typeof v === 'string')
    && Array.isArray(provenance.sources) && provenance.sources.every(value => {
      const source = object(value);
      return ['filename', 'kind', 'sha256'].every(key => typeof source[key] === 'string') && validNumber(source.parsedRows) && validNumber(source.usedRows);
    });
  if (!valid) throw new Error('공공데이터 형식을 확인할 수 없어요.');
}
export function loadPublicBaselines(): Promise<PublicBaselines> {
  pending ??= Promise.all([
    import('../../data/public/congestion.json'), import('../../data/public/ridership.json'),
    import('../../data/public/air-quality.json'), import('../../data/public/provenance.json'),
  ]).then(([congestion, ridership, air, provenance]) => {
    const bundle: unknown = { congestion: congestion.default, ridership: ridership.default, air: air.default, provenance: provenance.default };
    assertPublicBaselines(bundle);
    return bundle;
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}

function normalizeStation(value: string): string {
  return value.normalize('NFC').replace(/\([^)]*\)/g, '').replace(/\s/g, '').replace(/역$/, '');
}
function normalizeLine(value: string): string { return value.trim().replace(/^수도권\s*/, '').replace(/호선$/, ''); }
function stationMatches(row: StationRow, query: StationQuery): boolean {
  return normalizeStation(row.station) === normalizeStation(query.station) && row.day === query.day
    && (!query.line || normalizeLine(row.line) === normalizeLine(query.line))
    && (!query.direction || row.direction === query.direction);
}
function minutes(time: string): number | null {
  if (!/^(?:[01]\d|2[0-4]):[0-5]\d$/.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}
function railwayMinute(time: string): number | null {
  const value = minutes(time);
  return value === null ? null : value < 300 ? value + 1440 : value;
}
function formatMinute(value: number): string { return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }

/** day is the railway SERVICE day. At 00:30 pass the previous day's category. */
export function findCongestion(bundle: PublicBaselines, query: StationQuery): CongestionMatch[] {
  const value = railwayMinute(query.time);
  if (value === null) return [];
  const index = bundle.congestion.slots.findIndex(start => value >= start && value < start + 30);
  if (index === -1) return [];
  const start = bundle.congestion.slots[index];
  return bundle.congestion.rows.filter(row => stationMatches(row, query)).flatMap(row => {
    const meanPercent = row.values[index];
    return meanPercent === null || meanPercent === undefined ? [] : [{
      station: row.station, stationCode: row.stationCode, line: row.line, direction: row.direction, day: row.day,
      meanPercent, sourcePeriod: bundle.congestion.referenceDate, slotStart: formatMinute(start), slotEnd: formatMinute(start + 30), unit: '%' as const,
    }];
  });
}

/** Ridership is gate entries/exits, not train load %. Holidays stay in their calendar weekday group. */
export function findRidership(bundle: PublicBaselines, query: StationQuery): RidershipMatch[] {
  const value = railwayMinute(query.time);
  if (value === null) return [];
  const hour = Math.floor(value / 60);
  // 06시이전 is a combined service-start interval, not a separate hourly observation.
  const index = hour >= 24 ? bundle.ridership.columns.indexOf('24시이후')
    : hour < 6 ? bundle.ridership.columns.indexOf('06시이전')
    : bundle.ridership.columns.indexOf(`${String(hour).padStart(2, '0')}-${String(hour + 1).padStart(2, '0')}시간대`);
  if (index === -1 || hour > 24) return [];
  return bundle.ridership.rows.filter(row => stationMatches(row, query)).flatMap(row => {
    const [mean, std, sampleDays] = row.values[index] ?? [null, null, 0];
    return mean === null ? [] : [{ station: row.station, stationCode: row.stationCode, line: row.line, direction: row.direction,
      day: row.day, mean, std, sampleDays, sourcePeriod: `${bundle.ridership.periodStart} ~ ${bundle.ridership.periodEnd}`,
      timeLabel: bundle.ridership.columns[index], unit: '명' as const }];
  });
}

/** Hour is civil clock 00..23; source data's 01 end-hour is 00:00–01:00. */
export function findAirQuality(bundle: PublicBaselines, query: { district: string; day: BaselineDay; hour: number; pollutant?: 'PM10' | 'PM25' }): AirMatch[] {
  if (!Number.isInteger(query.hour) || query.hour < 0 || query.hour > 23) return [];
  return bundle.air.rows.filter(row => row.district === query.district && row.day === query.day && (!query.pollutant || row.pollutant === query.pollutant)).flatMap(row => {
    const [mean, std, sampleHours] = row.values[query.hour] ?? [null, null, 0];
    return mean === null ? [] : [{ district: row.district, station: row.station, stationCode: row.stationCode,
      pollutant: row.pollutant, day: row.day, mean, std, sampleHours,
      sourcePeriod: `${bundle.air.periodStart} ~ ${bundle.air.periodEnd}`, unit: 'µg/m³' as const }];
  });
}
