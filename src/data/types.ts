export interface DataMeta {
  source: string;
  mode: 'real' | 'synthetic';
  collectedAt: string | null;
  generatedAt?: string;
}
export interface BundleFile<T> { meta: DataMeta; items: T[] }
export interface SourceRecord {
  name: string;
  mode: 'real' | 'synthetic';
  verification: 'verified' | 'unverified';
  collectedAt: string | null;
}
