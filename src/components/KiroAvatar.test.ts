import { describe, expect, it } from 'vitest';

function avatar(options: Record<string, unknown>) {
  const host = document.createElement('div');
  host.innerHTML = window.KiroAvatar.render(options).replace(/k\d+-/g, 'avatar-');
  return host;
}

const signals = [
  ['construction', '.kiro-hat-hardhat', '.kiro-prop'],
  ['rain', '.kiro-raincoat', '.kiro-umbrella', '.kiro-rain-drops'],
  ['dust', '.kiro-mask', '.kiro-dust'],
  ['marathon', '.kiro-hat-bandana', '.kiro-sweat'],
  ['strike', '.kiro-placard'],
  ['congestion', '.kiro-eyes-swirl'],
];

describe('Kiro situation and costume composition', () => {
  const wornItems = [
    ['hardhat', '.kiro-hat-hardhat'], ['raincoat', '.kiro-raincoat'],
    ['mask', '.kiro-mask'], ['bandana', '.kiro-hat-bandana'],
    ['beanie', '.kiro-hat-beanie'], ['phones', '.kiro-hat-phones'],
    ['glasses', '.kiro-glasses-frame'], ['crown', '.kiro-hat-crown'],
    ['marathon26', '.kiro-hat-bandana'],
  ];
  it.each(wornItems)('keeps the selected %s costume on Home while mood and weather change', (outfit, selector) => {
    for (const state of ['construction', 'rain', 'dust']) {
      for (const expression of [undefined, 'heart', 'surprise', 'sleep']) {
        const host = avatar({ state, outfit, expression, preferOutfit: true });
        const reference = avatar({ state, expression });
        expect(host.querySelectorAll(selector), `${state} ${expression}`).toHaveLength(1);
        expect(host.querySelector('.kiro-eyes')?.outerHTML).toBe(reference.querySelector('.kiro-eyes')?.outerHTML);
        expect([...host.querySelectorAll('stop')].map(s => s.getAttribute('stop-color')))
          .toEqual([...reference.querySelectorAll('stop')].map(s => s.getAttribute('stop-color')));
        if (state === 'rain') expect(host.querySelector('.kiro-rain-drops')).not.toBeNull();
        if (state === 'dust') expect(host.querySelector('.kiro-dust')).not.toBeNull();
      }
    }
  });

  it('lets worn clothing own overlapping slots without stacking two hats or props', () => {
    const hat = avatar({ state: 'construction', outfit: 'crown', preferOutfit: true });
    expect(hat.querySelector('.kiro-hat-crown')).not.toBeNull();
    expect(hat.querySelector('.kiro-hat-hardhat')).toBeNull();
    const coat = avatar({ state: 'construction', outfit: 'raincoat', preferOutfit: true });
    expect(coat.querySelector('.kiro-raincoat')).not.toBeNull();
    expect(coat.querySelector('.kiro-hat-hardhat')).toBeNull();
    expect(coat.querySelector('.kiro-prop')?.innerHTML).toBe('');
    expect(coat.querySelector('.kiro-umbrella')).not.toBeNull();
    const rain = avatar({ state: 'rain', outfit: 'phones', preferOutfit: true });
    expect(rain.querySelector('.kiro-hat-phones')).not.toBeNull();
    expect(rain.querySelector('.kiro-raincoat')).toBeNull();
    expect(rain.querySelector('.kiro-umbrella')).not.toBeNull();
  });

  it('keeps base outfit automatic and renders glasses frames without extra eye artwork', () => {
    expect(avatar({ state: 'construction', outfit: 'base', preferOutfit: true }).innerHTML)
      .toBe(avatar({ state: 'construction', outfit: 'base' }).innerHTML);
    const glasses = avatar({ state: 'ordinary', outfit: 'glasses', expression: 'heart', preferOutfit: true });
    expect(glasses.querySelector('.kiro-glasses-frame')?.querySelectorAll('circle')).toHaveLength(2);
    expect(glasses.querySelector('.kiro-eyes-heart')).not.toBeNull();
    expect(glasses.querySelector('.kiro-eyes-canon, .kiro-eyes-glasses')).toBeNull();
  });

  it.each(Object.keys(window.KiroAvatar.OUTFITS))('preserves every alert with the %s outfit', outfit => {
    for (const [state, ...selectors] of signals) {
      const host = avatar({ state, outfit });
      const reference = avatar({ state });
      for (const selector of [...selectors, '.kiro-eyes', '.kiro-brows', '.kiro-mouth']) {
        expect(host.querySelector(selector)?.outerHTML, `${state} ${selector}`)
          .toBe(reference.querySelector(selector)?.outerHTML);
      }
    }
  });

  it.each(['surprise', 'heart', 'sparkle', 'sleep'])('keeps alert equipment and color during %s', expression => {
    for (const outfit of [undefined, ...Object.keys(window.KiroAvatar.OUTFITS)]) {
      for (const [state, ...selectors] of signals) {
        const host = avatar({ state, outfit, expression });
        const reference = avatar({ state });
        for (const selector of selectors.filter(s => !s.startsWith('.kiro-eyes'))) {
          expect(host.querySelector(selector)?.outerHTML, `${outfit} ${state} ${selector}`)
            .toBe(reference.querySelector(selector)?.outerHTML);
        }
        expect(host.querySelector('.kiro-eyes')?.outerHTML)
          .toBe(avatar({ expression }).querySelector('.kiro-eyes')?.outerHTML);
        expect([...host.querySelectorAll('stop')].map(s => s.getAttribute('stop-color')))
          .toEqual([...reference.querySelectorAll('stop')].map(s => s.getAttribute('stop-color')));
      }
    }
  });

  it('combines compatible equipment and deduplicates shared decorations', () => {
    const dust = avatar({ state: 'dust', outfit: 'hardhat' });
    expect(dust.querySelector('.kiro-hat-hardhat')).not.toBeNull();
    expect(dust.querySelector('.kiro-mask')).not.toBeNull();
    const rain = avatar({ state: 'rain', outfit: 'mask' });
    expect(rain.querySelector('.kiro-mask')).not.toBeNull();
    expect(rain.querySelector('.kiro-raincoat')).not.toBeNull();
    // SVG paint order must leave the mask visible above the raincoat.
    for (const host of [rain, avatar({ state: 'dust', outfit: 'raincoat' })]) {
      expect(host.querySelector('.kiro-raincoat')!.compareDocumentPosition(host.querySelector('.kiro-mask')!))
        .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    }
    for (const [state, outfit, selector] of [
      ['dust', 'mask', '.kiro-mask'], ['rain', 'raincoat', '.kiro-umbrella'],
      ['rain', 'raincoat', '.kiro-raincoat'],
    ]) expect(avatar({ state, outfit }).querySelectorAll(selector)).toHaveLength(1);
  });

  it('gives situation equipment priority in occupied head and hand slots', () => {
    for (const outfit of ['crown', 'bikehelmet', 'raincoat']) {
      const host = avatar({ state: 'construction', outfit });
      expect(host.querySelector('.kiro-hat-hardhat')).not.toBeNull();
      expect(host.querySelector('.kiro-hat-crown, .kiro-bikehelmet, .kiro-raincoat, .kiro-umbrella')).toBeNull();
    }
    expect(avatar({ state: 'rain', outfit: 'hardhat' }).querySelector('.kiro-hat-hardhat')).toBeNull();
    expect(avatar({ state: 'strike', outfit: 'raincoat' }).querySelector('.kiro-umbrella')).toBeNull();
    expect(avatar({ state: 'rain', outfit: 'mug' }).querySelector('.kiro-prop')?.innerHTML).toBe('');
  });

  it('preserves wardrobe previews and lets outfit celebrations and sleep change the face', () => {
    const preview = avatar({ state: 'ordinary', outfit: 'crown' });
    expect(preview.querySelector('.kiro-hat-crown')).not.toBeNull();
    expect(preview.querySelector('.kiro-eyes-canon')).not.toBeNull();
    expect(preview.querySelector('.kiro-zzz')).toBeNull();
    for (const expression of ['heart', 'sleep']) {
      const host = avatar({ state: 'ordinary', outfit: 'crown', expression });
      expect(host.querySelector('.kiro-hat-crown')).not.toBeNull();
      expect(host.querySelector('.kiro-eyes')?.outerHTML)
        .toBe(avatar({ expression }).querySelector('.kiro-eyes')?.outerHTML);
      expect(host.querySelector(expression === 'sleep' ? '.kiro-zzz' : '.kiro-hearts')).not.toBeNull();
    }
  });
});
