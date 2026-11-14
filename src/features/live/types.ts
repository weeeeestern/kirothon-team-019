export interface LiveArea {
  source: string;
  area: string;
  fetchedAt: string;
  population: { observedAt: string | null; level: string | null; message: string | null; min: number | null; max: number | null };
  weather: { observedAt: string | null; temperature: number | null; precipitation: string | null; precipitationType: string | null; pm10: number | null; pm25: number | null; pm25Level: string | null };
  disruptions: { info: string; type: string | null; observedAt: string | null; startsAt: string | null; endsAt: string | null }[];
}

export function isFresh(observedAt: string | null, now = Date.now()): boolean {
  if (!observedAt) return false;
  const age = now - Date.parse(observedAt.replace(' ', 'T') + '+09:00');
  return Number.isFinite(age) && age >= -5 * 60_000 && age <= 2 * 60 * 60_000;
}
