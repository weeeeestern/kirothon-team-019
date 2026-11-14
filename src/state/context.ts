import { createContext, useContext } from 'react';
import type { Dispatch } from 'react';
import type { EngineResult } from '@/engine';
import type { Store, Action } from './store';

export type DemoMode = 'quiet' | 'congestion' | 'construction' | 'rain' | 'dust' | 'marathon' | 'strike';
export interface AppCtx { store: Store; dispatch: Dispatch<Action>; result: EngineResult; points: number; mode: DemoMode; setMode: (v: DemoMode) => void; now: Date; day: Date; storageError: boolean; unread: number; celebration: string; celebrate: (v: string) => void }
export const Ctx = createContext<AppCtx | null>(null);
export function useApp(): AppCtx { const c = useContext(Ctx); if (!c) throw new Error('useApp outside AppState'); return c; }
