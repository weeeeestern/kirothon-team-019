import { createContext, useContext } from 'react';
import type { Dispatch } from 'react';
import type { EngineResult } from '@/engine';
import type { Store, Action } from './store';

export type DemoMode = 'auto' | 'showcase' | 'quiet' | 'congestion' | 'construction' | 'rain' | 'dust' | 'marathon' | 'strike';
export interface AppCtx { store: Store; dispatch: Dispatch<Action>; result: EngineResult; points: number; mode: DemoMode; setMode: (v: DemoMode) => void; now: Date; day: Date; storageError: boolean; unread: number; celebration: string; celebrate: (v: string) => void;
  /** reportsApi.mode === 'remote' */ remote: boolean;
  /** 서버 호출이 실패했으면 true ("연결이 불안정해요" 안내용) */ apiError: boolean;
  /** 서버 호출을 감싼다. 실패하면 안내를 띄우고 undefined를 돌려준다. */ call: <T>(fn: () => Promise<T>) => Promise<T | undefined>;
  /** remote 모드에서 포인트 원장과 오늘 제보를 서버 기준으로 다시 읽는다. local이면 아무것도 하지 않는다. */ refresh: () => Promise<void> }
export const Ctx = createContext<AppCtx | null>(null);
export function useApp(): AppCtx { const c = useContext(Ctx); if (!c) throw new Error('useApp outside AppState'); return c; }
