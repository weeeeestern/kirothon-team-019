import type { Coordinate, TransitJourney } from './types';
export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string);
}
export function coordinate(x: unknown, y: unknown): Coordinate | null;
export function normalizePath(path: unknown, index?: number): TransitJourney | null;
export function searchOdsay(
  params: { sx: string; sy: string; ex: string; ey: string },
  key: string,
  request: (url: URL, timeout: number) => Promise<unknown>,
): Promise<{ routes: TransitJourney[]; fetchedAt: string }>;
