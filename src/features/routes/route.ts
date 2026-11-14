import type { Route } from '../../engine/types';
import { timeToMinutes } from '../../engine/utils';

export const MAX_STOPS = 12;
export const normalizeStop = (stop: string) => stop.trim().replace(/역$/, '');

export function routeError(route: Route): string | null {
  if (!route || typeof route.id !== 'string' || !route.id || typeof route.district !== 'string' || !route.district.trim()) return '자치구를 선택해 주세요.';
  if (!Array.isArray(route.stops) || route.stops.length < 2 || route.stops.length > MAX_STOPS) return `출발·도착을 포함해 2~${MAX_STOPS}곳을 등록해 주세요.`;
  if (route.stops.some(s => typeof s !== 'string' || !normalizeStop(s) || s.trim().length > 40)) return '비어 있는 역·정류장을 입력하거나 삭제해 주세요.';
  if (new Set(route.stops.map(normalizeStop)).size !== route.stops.length) return '같은 역·정류장을 중복해서 등록할 수 없어요.';
  if (!Number.isFinite(timeToMinutes(route.departAt))) return '출발 시각을 입력해 주세요.';
  if (!Array.isArray(route.days) || !route.days.length || route.days.some(d => !['weekday', 'weekend', 'holiday', 'afterHoliday'].includes(d))) return '이동 요일을 선택해 주세요.';
  return null;
}
