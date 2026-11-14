import type { Situation } from '@/engine/types';

export interface SituationTheme {
  accent: string;
  bg: string;
  tile: string;
  label: string;
}

export const SITUATION_THEMES: Record<Situation, SituationTheme> = {
  ordinary:    { accent: '#C9B1FF', bg: '#221D33', tile: '#A57BFF', label: '평범' },
  construction:{ accent: '#F2C46B', bg: '#33291A', tile: '#F3C98A', label: '공사' },
  rain:        { accent: '#8CC4EA', bg: '#17283A', tile: '#6BA3C9', label: '폭우' },
  dust:        { accent: '#D9BE8E', bg: '#2E2619', tile: '#C4A574', label: '미세먼지' },
  marathon:    { accent: '#F5A3B8', bg: '#3A1E27', tile: '#F090A8', label: '마라톤' },
  strike:      { accent: '#FF6B6B', bg: '#3A1A1E', tile: '#E8928A', label: '파업·집회' },
  congestion:  { accent: '#F2C46B', bg: '#33291A', tile: '#C97A9A', label: '혼잡' },
};

export function situationColor(situation: Situation): SituationTheme {
  return SITUATION_THEMES[situation];
}
