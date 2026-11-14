import catalog from './sources.json';
import type { BundleFile, SourceRecord } from './types';

export const sourceCatalog = catalog as BundleFile<SourceRecord>;
export function formatSourceTime(value: string | null | undefined): string {
  if (!value || !Number.isFinite(Date.parse(value))) return '미수집';
  return new Date(value).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false }) + ' KST';
}
export const sampleGeneratedAt = formatSourceTime(sourceCatalog.meta.generatedAt);
