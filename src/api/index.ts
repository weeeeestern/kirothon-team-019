import { createRemoteApi, isRemoteEnabled } from './client';
import type { ApiEnv } from './client';
import { createLocalApi } from './local';
import type { ReportsApi } from './contract';

export * from './contract';
export { isRemoteEnabled } from './client';
export type { ApiEnv } from './client';

/** VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY가 둘 다 있으면 remote, 하나라도 없으면 local. */
export function selectReportsApi(env: ApiEnv): ReportsApi {
  return isRemoteEnabled(env) ? createRemoteApi(env) : createLocalApi();
}

export const reportsApi: ReportsApi = selectReportsApi({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});
