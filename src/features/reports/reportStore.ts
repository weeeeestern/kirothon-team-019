import type { Anomaly } from '../../engine/types';
import { dayKey, timeToMinutes, minutesToHHmm } from '../../engine/utils';
import { classifyTiming } from '../../engine/classify';

export const REPORT_TYPES = ['construction', 'strike', 'marathon', 'congestion', 'rain', 'dust'] as const;
export type ReportType = typeof REPORT_TYPES[number];
export interface CitizenReport {
  id: string; author: string; routeId: string; situation: ReportType;
  place: string; time: string; note: string; createdAt: string;
  confirmations: string[]; helpfulUsers: string[];
}
export type ReportInput = Pick<CitizenReport, 'routeId' | 'situation' | 'place' | 'time' | 'note'>;
export function validReportInput(input: ReportInput): boolean {
  return REPORT_TYPES.includes(input.situation) && !!input.routeId && !!input.place.trim() && input.place.trim().length <= 60 && Number.isFinite(timeToMinutes(input.time)) && input.note.length <= 100;
}
export function isConfirmed(report: CitizenReport): boolean { return new Set(report.confirmations.filter(u => u !== report.author)).size >= 2; }
export function confirmReport(report: CitizenReport, user: string, routeId: string, now: Date): CitizenReport {
  if (user === report.author || report.confirmations.includes(user) || routeId !== report.routeId || dayKey(new Date(report.createdAt)) !== dayKey(now)) return report;
  return { ...report, confirmations: [...report.confirmations, user] };
}
export function toAnomaly(report: CitizenReport, now: Date): Anomaly | null {
  if (!isConfirmed(report) || dayKey(new Date(report.createdAt)) !== dayKey(now)) return null;
  return { id: report.id, situation: report.situation, timing: classifyTiming(report.situation), area: report.place,
    value: 120, startsAt: report.time, endsAt: minutesToHHmm(timeToMinutes(report.time) + 60), source: 'report' };
}
