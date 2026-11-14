import { useEffect, useRef } from 'react';

declare global { interface Window { kakao: any } }

interface Marker { lat: number; lng: number; label?: string }
interface Props { lat?: number; lng?: number; markers?: Marker[]; height?: number }

export function KakaoMap({ lat = 37.4979, lng = 127.0276, markers = [], height = 180 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = import.meta.env.VITE_KAKAO_JS_KEY;
    if (!key) return;

    function init() {
      if (!ref.current || !window.kakao?.maps) return;
      const map = new window.kakao.maps.Map(ref.current, {
        center: new window.kakao.maps.LatLng(lat, lng), level: 4,
      });
      markers.forEach(m => {
        const mk = new window.kakao.maps.Marker({ position: new window.kakao.maps.LatLng(m.lat, m.lng), map });
        if (m.label) {
          new window.kakao.maps.InfoWindow({
            content: `<div style="padding:4px 8px;font-size:12px">${m.label}</div>`,
          }).open(map, mk);
        }
      });
    }

    if (window.kakao?.maps) { window.kakao.maps.load(init); return; }
    const s = document.createElement('script');
    s.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`;
    s.onload = () => window.kakao.maps.load(init);
    document.head.appendChild(s);
  }, [lat, lng]);

  return (
    <div ref={ref} style={{
      width: '100%', height, borderRadius: 12, overflow: 'hidden',
      background: 'var(--pyeongso-surface)',
    }} />
  );
}
