import { useMemo } from 'react';
import '../../design/animation/kiro-avatar-soft.js';
import '../../design/animation/kiro-avatar-soft.css';
import type { Situation } from '@/engine/types';
import { situationColor } from '@/theme/situation';

export function KiroAvatar({ situation = 'ordinary', size = 280, outfit, expression, motion = 'float', preferOutfit = false }: { situation?: Situation; size?: number; outfit?: string; expression?: string; motion?: string; preferOutfit?: boolean }) {
  const renderer = window.KiroAvatar;
  const state = Object.hasOwn(renderer.SITUATIONS, situation) ? situation : 'ordinary';
  const safeFit = outfit && Object.hasOwn(renderer.OUTFITS, outfit) ? outfit : undefined;
  const safeExpression = expression && Object.hasOwn(renderer.EXPRESSIONS, expression) ? expression : undefined;
  // Only the repository's renderer and whitelisted options produce this markup.
  const html = useMemo(() => renderer.render({ state, size, outfit: safeFit, expression: safeExpression, motion, preferOutfit }), [renderer, state, size, safeFit, safeExpression, motion, preferOutfit]);
  return <div className="kiro-avatar" style={{ width: size, maxWidth: '100%', filter: `drop-shadow(0 12px 32px ${situationColor(state).tile}22)` }} dangerouslySetInnerHTML={{ __html: html }} />;
}
