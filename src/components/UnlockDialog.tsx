import { useEffect, useRef, useState } from 'react';
import { Dialog } from 'antd-mobile';
import type { Page } from '@/App';
import { useApp } from '@/state/AppState';
import { canWear } from '@/state/store';
import { levelFor, OUTFITS } from '@/features/points/ledger';
import { KiroAvatar } from './KiroAvatar';

type Unlock = { level: number; leveledUp: boolean; items: typeof OUTFITS[number][] };

export function UnlockDialog({ navigate }: { navigate: (page: Page) => void }) {
  const { store, points } = useApp();
  const previous = useRef(store);
  const [unlock, setUnlock] = useState<Unlock | null>(null);
  useEffect(() => {
    const items = OUTFITS.filter(item => canWear(store, item.id) && !canWear(previous.current, item.id));
    if (items.length) {
      const previousPoints = previous.current.ledger.reduce((sum, entry) => sum + entry.amount, 0);
      setUnlock({ level: levelFor(points), leveledUp: levelFor(points) > levelFor(previousPoints), items });
    }
    previous.current = store;
  }, [store, points]);
  const limited = unlock?.items.some(item => item.level === 99);
  return <Dialog visible={!!unlock} destroyOnClose
    title={unlock?.leveledUp ? `Lv. ${unlock.level}, 함께 자랐어요!` : '새 옷이 열렸어요!'}
    content={unlock && <div className="unlock-content"><KiroAvatar size={160} outfit={unlock.items[0].id} expression={limited ? 'sparkle' : 'heart'} motion="unlock" /><p>{unlock.items.map(item => item.label).join(' · ')}</p><p className="caption">키로의 옷장에서 새 옷을 입혀 보세요.</p></div>}
    actions={[{ key: 'wardrobe', text: '옷장으로 가기', bold: true }, { key: 'close', text: '계속하기' }]}
    onAction={action => { setUnlock(null); if (action.key === 'wardrobe') navigate('kiro'); }}
  />;
}
