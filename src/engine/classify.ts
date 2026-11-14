import type { Situation, Timing } from './types';

export function classifyTiming(situation: Situation): Timing {
  return ['marathon', 'strike', 'construction'].includes(situation) ? 'scheduled' : 'sudden';
}

export function situationLabel(situation: Situation): string {
  const map: Record<Situation, string> = {
    ordinary: '평범', construction: '공사', rain: '폭우',
    dust: '미세먼지', marathon: '마라톤', strike: '파업·집회', congestion: '혼잡',
  };
  return map[situation];
}
