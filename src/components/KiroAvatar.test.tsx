import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { KiroAvatar } from './KiroAvatar';
import { OUTFITS } from '../features/points/ledger';
import { initialStore, restoreStore } from '../state/store';
import { award } from '../features/points/ledger';

// 렌더러가 매번 붙이는 고유 id(k1, k2...)를 지우고 마크업만 비교한다.
const norm = (h: string) => h.replace(/\bk\d+/g, 'kN');
const markup = (c: HTMLElement) => norm(c.querySelector('.kiro-avatar')!.innerHTML);
// innerHTML 직렬화 차이를 없애려고 렌더러 결과도 DOM에 넣은 뒤 읽는다.
const direct = (o: Record<string, unknown>) => { const d = document.createElement('div'); d.innerHTML = window.KiroAvatar.render({ size: 280, motion: 'float', ...o }); return norm(d.innerHTML); };

describe('요구사항 6.10 상황 의상 우선', () => {
  it('마라톤 옷을 입어도 공사 날에는 안전모(상황 의상)를 그린다', () => {
    const { container } = render(<KiroAvatar situation="construction" outfit="marathon26" size={280} />);
    expect(markup(container)).toBe(direct({ state: 'construction' }));
    expect(markup(container)).not.toBe(direct({ state: 'construction', outfit: 'marathon26' }));
  });
  it('평범한 날에는 착용 옷을 그린다', () => {
    const { container } = render(<KiroAvatar situation="ordinary" outfit="marathon26" size={280} />);
    expect(markup(container)).toBe(direct({ state: 'ordinary', outfit: 'marathon26' }));
    expect(markup(container)).not.toBe(direct({ state: 'ordinary' }));
  });
  it('이상이 있는 모든 상황에서 착용 옷이 무시된다', () => {
    for (const s of ['construction', 'rain', 'dust', 'marathon', 'strike', 'congestion'] as const) {
      const { container } = render(<KiroAvatar situation={s} outfit="crown" size={280} />);
      expect(markup(container), s).toBe(direct({ state: s }));
    }
  });
});

describe('요구사항 6.11 옷장과 상황 의상 분리', () => {
  it('옷장(OUTFITS)에 hardhat, raincoat, mask, bandana가 없다', () => {
    const situational = ['hardhat', 'raincoat', 'mask', 'bandana'];
    expect(OUTFITS.filter(o => situational.includes(o.id))).toHaveLength(0);
  });
  it('옷장 아이템은 모두 렌더러 OUTFITS에 있다', () => {
    for (const o of OUTFITS) if (o.id !== 'base') expect(Object.hasOwn(window.KiroAvatar.OUTFITS, o.id), o.id).toBe(true);
  });
});

describe('요구사항 6.12 옛 저장값 복구', () => {
  it('옷장에 없는 hardhat은 base로 되돌리고 포인트·경로·피드백 등은 유지한다', () => {
    const base = initialStore();
    const ledger = award(award([], { id: 'a', amount: 10, reason: '동네 제보' }), { id: 'b', amount: 5, reason: '이웃에게 도움된 제보' });
    const old = { ...base, outfit: 'hardhat', ledger, threshold: 1.7, read: ['n1'], unlocked: ['marathon26'], feedback: { n1: 'helpful' as const }, routes: base.routes.slice(0, 1) };
    const s = restoreStore(JSON.stringify(old));
    expect(s.outfit).toBe('base');
    expect(s).toEqual({ ...old, outfit: 'base' });
  });
  it('유효한 착용 옷은 그대로 유지한다', () => {
    expect(restoreStore(JSON.stringify({ ...initialStore(), outfit: 'cap' })).outfit).toBe('cap');
  });
});
