import type { Route } from '../../engine/types';
import { timeToMinutes } from '../../engine/utils';
import type { Coordinate, Place, TransitJourney } from '../transit/types';

export const MAX_STOPS = 12;
export const MAX_TRANSIT_STOPS = 202;
export const normalizeStop = (stop: string) => stop.trim().replace(/역$/, '');
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, max = 120): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const number = (value: unknown, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= max;
const strings = (value: unknown) => Array.isArray(value) && value.length <= 200 && value.every(v => text(v, 100));
export const validCoordinate = (value: unknown): value is Coordinate => record(value) && typeof value.lat === 'number' && Number.isFinite(value.lat) && value.lat >= 32 && value.lat <= 39.5 && typeof value.lng === 'number' && Number.isFinite(value.lng) && value.lng >= 124 && value.lng <= 132;
const coordinates = (value: unknown) => Array.isArray(value) && value.length <= 10000 && value.every(validCoordinate);
export function validPlace(value: unknown): value is Place {
  return record(value) && validCoordinate(value) && text(value.id) && text(value.name, 100) && typeof value.address === 'string' && value.address.length <= 300 && (value.district === undefined || text(value.district));
}
export function validJourney(value: unknown): value is TransitJourney {
  if (!record(value) || value.provider !== 'ODsay' || !text(value.id) || !number(value.totalTime, 2880) || !number(value.totalWalk, 200000) || !number(value.payment, 1000000) || !number(value.transferCount, 100) || !coordinates(value.path) || !strings(value.stations)) return false;
  if (value.pathKind !== undefined && !['geometry', 'stops'].includes(String(value.pathKind))) return false;
  return Array.isArray(value.segments) && value.segments.length > 0 && value.segments.length <= 100 && value.segments.every(s => record(s) && ['subway', 'bus', 'walk'].includes(String(s.type)) && text(s.label) && number(s.time, 2880) && (s.distance === undefined || number(s.distance, 2000000)) && ['from', 'to', 'line'].every(k => s[k] === undefined || (typeof s[k] === 'string' && s[k].length <= 120)) && (s.stations === undefined || strings(s.stations)) && (s.path === undefined || coordinates(s.path)));
}

export function journeyStops(origin: Place, destination: Place, journey: TransitJourney): string[] {
  const values = [origin.name, ...journey.stations, destination.name];
  return [...new Map(values.map(s => [normalizeStop(s), s.trim()])).values()];
}

export function routeError(route: Route): string | null {
  if (!route || typeof route.id !== 'string' || !route.id || typeof route.district !== 'string' || !route.district.trim()) return '자치구를 선택해 주세요.';
  if (route.journey !== undefined && (!validJourney(route.journey) || !validPlace(route.origin) || !validPlace(route.destination) || !Number.isFinite(Date.parse(route.fetchedAt ?? '')))) return '저장할 길찾기 정보를 다시 확인해 주세요.';
  const maximum = route.journey ? MAX_TRANSIT_STOPS : MAX_STOPS;
  if (!Array.isArray(route.stops) || route.stops.length < 2 || route.stops.length > maximum) return `출발·도착을 포함해 2~${maximum}곳을 등록해 주세요.`;
  if (route.stops.some(s => typeof s !== 'string' || !normalizeStop(s) || s.trim().length > (route.journey ? 100 : 40))) return '비어 있는 역·정류장을 입력하거나 삭제해 주세요.';
  if (new Set(route.stops.map(normalizeStop)).size !== route.stops.length) return '같은 역·정류장을 중복해서 등록할 수 없어요.';
  if (!Number.isFinite(timeToMinutes(route.departAt))) return '출발 시각을 입력해 주세요.';
  if (!Array.isArray(route.days) || !route.days.length || route.days.some(d => !['weekday', 'weekend', 'holiday', 'afterHoliday'].includes(d))) return '이동 요일을 선택해 주세요.';
  return null;
}
