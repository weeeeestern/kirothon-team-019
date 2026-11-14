import type { DayType } from './types';

export function dayKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
// Supply a verified holiday calendar; do not infer holidays from an outdated list.
export function getDayType(date: Date, holidays: readonly string[] = []): DayType {
  const key = dayKey(date);
  const day = new Date(`${key}T12:00:00+09:00`);
  const dow = new Date(`${key}T00:00:00Z`).getUTCDay();
  if (holidays.includes(key)) return 'holiday';
  day.setTime(day.getTime() - 86400000);
  if (holidays.includes(dayKey(day)) && dow >= 1 && dow <= 5) return 'afterHoliday';
  return dow === 0 || dow === 6 ? 'weekend' : 'weekday';
}
export function timeToMinutes(value: string): number {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return NaN;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}
export function minutesToHHmm(value: number): string {
  const m = ((value % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
