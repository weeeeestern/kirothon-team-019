import { useEffect, useRef, useState } from 'react';
import type { Coordinate } from '@/features/transit/types';
import { requestJson } from '@/features/transit/client';

type LatLng = object;
interface MapInstance { setBounds(bounds: object): void; relayout(): void }
interface Overlay { setMap(map: MapInstance | null): void }
interface MapsApi {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => LatLng;
  LatLngBounds: new () => { extend(point: LatLng): void };
  Map: new (element: HTMLElement, options: { center: LatLng; level: number }) => MapInstance;
  Marker: new (options: { position: LatLng; map: MapInstance; title?: string }) => Overlay;
  Polyline: new (options: { map: MapInstance; path: LatLng[]; strokeWeight: number; strokeColor: string; strokeOpacity: number; strokeStyle: string }) => Overlay;
}
declare global { interface Window { kakao?: { maps: MapsApi } } }
interface Marker extends Coordinate { label?: string }
interface Props { markers: Marker[]; path?: Coordinate[]; pathKind?: 'geometry' | 'stops'; height?: number }
let sdkPromise: Promise<MapsApi> | undefined;

async function loadSdk(): Promise<MapsApi> {
  if (window.kakao?.maps?.Map) return window.kakao.maps;
  if (sdkPromise) return sdkPromise;
  sdkPromise = (async () => {
    const configured = import.meta.env.VITE_KAKAO_JS_KEY;
    const key = configured || (await requestJson<{ javascriptKey: string | null }>('/api/map-config')).javascriptKey;
    if (!key) throw new Error('지도 연결을 준비하고 있어요. 아래 이동 구간으로 경로를 확인해 주세요.');
    return await new Promise<MapsApi>((resolve, reject) => {
      const script = document.createElement('script');
      script.dataset.jamjamMap = 'true';
      let settled = false;
      const fail = () => { if (settled) return; settled = true; clearTimeout(timer); script.remove(); reject(new Error('지도를 불러오지 못했어요. 아래 이동 구간은 계속 확인할 수 있어요.')); };
      const timer = setTimeout(fail, 12000);
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false`;
      script.async = true;
      script.onerror = fail;
      script.onload = () => {
        if (!window.kakao?.maps) { fail(); return; }
        window.kakao.maps.load(() => {
          if (settled) return;
          if (!window.kakao?.maps?.Map) { fail(); return; }
          settled = true; clearTimeout(timer); resolve(window.kakao.maps);
        });
      };
      document.head.appendChild(script);
    });
  })().catch(error => { sdkPromise = undefined; throw error; });
  return sdkPromise;
}

export function KakaoMap({ markers, path = [], pathKind = 'stops', height = 260 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('지도를 불러오고 있어요…');
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  // Stable serialized coordinates avoid rebuilding the map after unrelated form edits.
  const signature = JSON.stringify({ markers, path, pathKind });
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | undefined;
    const overlays: Overlay[] = [];
    const element = ref.current;
    const data = JSON.parse(signature) as { markers: Marker[]; path: Coordinate[]; pathKind: 'geometry' | 'stops' };
    setFailed(false); setStatus('지도를 불러오고 있어요…');
    if (!data.markers.length) { setStatus('출발지와 도착지를 선택하면 지도가 나타나요.'); return; }
    loadSdk().then(maps => {
      if (cancelled || !element) return;
      const first = data.markers[0];
      const map = new maps.Map(element, { center: new maps.LatLng(first.lat, first.lng), level: 6 });
      const bounds = new maps.LatLngBounds();
      data.markers.forEach(marker => {
        const position = new maps.LatLng(marker.lat, marker.lng);
        overlays.push(new maps.Marker({ map, position, title: marker.label }));
        bounds.extend(position);
      });
      if (data.path.length > 1) {
        const coordinates = data.path.map(point => { const value = new maps.LatLng(point.lat, point.lng); bounds.extend(value); return value; });
        overlays.push(new maps.Polyline({ map, path: coordinates, strokeWeight: 5, strokeColor: '#8B4DFF', strokeOpacity: .8, strokeStyle: data.pathKind === 'geometry' ? 'solid' : 'shortdash' }));
      }
      map.setBounds(bounds);
      if (typeof ResizeObserver !== 'undefined') { observer = new ResizeObserver(() => { map.relayout(); map.setBounds(bounds); }); observer.observe(element); }
      setStatus('');
    }).catch(error => { if (!cancelled) { setStatus(error instanceof Error ? error.message : '지도를 불러오지 못했어요.'); setFailed(true); } });
    return () => { cancelled = true; observer?.disconnect(); overlays.forEach(overlay => overlay.setMap(null)); if (element) element.replaceChildren(); };
  }, [signature, attempt]);
  return <div className="transit-map-wrap">
    <div ref={ref} className="transit-map" style={{ height }} aria-label="선택한 경로의 카카오 지도" />
    {status && <div className="transit-map-status" role="status"><p>{status}</p>{failed && <button type="button" onClick={() => setAttempt(n => n + 1)}>지도 다시 불러오기</button>}</div>}
    {!status && <p className="caption">{pathKind === 'geometry' ? '카카오맵 · ODsay 이동 경로' : '카카오맵 · 점선은 경유지 연결이며 실제 도로 모양과 달라요.'}</p>}
  </div>;
}
