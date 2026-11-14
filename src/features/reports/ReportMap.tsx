import { useEffect, useRef, useState } from 'react';
import { Button, Tag } from 'antd-mobile';
import { KakaoMap } from '@/components/KakaoMap';
import type { Route } from '@/engine/types';
import { dayKey } from '@/engine/utils';
import { normalizeStop } from '@/features/routes/route';
import { searchPlaces } from '@/features/transit/client';
import type { Coordinate } from '@/features/transit/types';
import { situationColor } from '@/theme/situation';
import { isConfirmed, type CitizenReport } from './reportStore';
import { matchReportLocation, savedReportLocation } from './reportLocation';

export function ReportMap({ reports, routes, now }: { reports: CitizenReport[]; routes: Route[]; now: Date }) {
  const cache = useRef(new Map<string, Coordinate>());
  const [locations, setLocations] = useState<Record<string, Coordinate>>({});
  const [loading, setLoading] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<string>();
  const [includeExpired, setIncludeExpired] = useState(true);
  // Confirmations and form typing do not trigger another location lookup.
  const signature = JSON.stringify(reports.map(report => ({
    place: normalizeStop(report.place),
    point: savedReportLocation(report.place, routes.find(route => route.id === report.routeId)),
  })));
  useEffect(() => {
    const controller = new AbortController();
    const entries = JSON.parse(signature) as { place: string; point?: Coordinate }[];
    const unique = new Map(entries.map(entry => [entry.point ? JSON.stringify(entry.point) : entry.place, entry]));
    setLoading(unique.size > 0);
    const found: Record<string, Coordinate> = {};
    // Bound parallel requests so a long report history does not flood the API.
    const queue = [...unique.entries()];
    async function worker() {
      while (queue.length && !controller.signal.aborted) {
        const [key, entry] = queue.shift()!;
        let point = entry.point ?? cache.current.get(key);
        try {
          if (!point) {
            point = matchReportLocation(entry.place, await searchPlaces(`서울 ${entry.place}`, controller.signal));
            // Short station names such as 강남 otherwise return district attractions.
            if (!point && !controller.signal.aborted) point = matchReportLocation(entry.place, await searchPlaces(`서울 ${entry.place}역`, controller.signal));
          }
          if (point) { found[key] = point; cache.current.set(key, point); }
        } catch { /* Unresolved locations stay in the list and can be retried. */ }
      }
    }
    void Promise.all(Array.from({ length: Math.min(3, queue.length) }, worker)).then(() => {
      if (!controller.signal.aborted) { setLocations(found); setLoading(false); }
    });
    return () => controller.abort();
  }, [signature, attempt]);

  const visible = reports.filter(r => includeExpired || dayKey(new Date(r.createdAt)) === dayKey(now));
  const groups = new Map<string, { point: Coordinate; reports: CitizenReport[] }>();
  let missing = 0;
  for (const report of visible) {
    const saved = savedReportLocation(report.place, routes.find(route => route.id === report.routeId));
    const point = saved ?? locations[normalizeStop(report.place)];
    if (!point) { missing++; continue; }
    const key = JSON.stringify(point);
    const group = groups.get(key) ?? { point, reports: [] };
    group.reports.push(report); groups.set(key, group);
  }
  const markers = [...groups].map(([id, group]) => ({
    ...group.point, id, badge: `${group.reports.length}`, label: `${group.reports[0].place} · 제보 ${group.reports.length}건`,
  }));
  const selectedGroup = selected ? groups.get(selected) : undefined;
  return <section className="report-map-section" aria-labelledby="report-map-title">
    <div className="row between"><h3 id="report-map-title">제보 지도 <span className="purple">{visible.length - missing}건</span></h3></div>
    <p className="caption">이 브라우저에 저장된 제보예요. 장소를 누르면 내용을 볼 수 있어요.</p>
    <label className="report-map-filter"><input type="checkbox" checked={includeExpired} onChange={e => setIncludeExpired(e.target.checked)} />만료된 제보도 보기</label>
    <KakaoMap markers={markers} onMarkerSelect={setSelected} ariaLabel="등록된 제보 위치 지도"
      emptyMessage={loading ? '제보 위치를 찾고 있어요…' : !reports.length ? '아직 제보가 없어요. 첫 소식을 지도에 남겨 보세요.' : !visible.length ? '오늘 등록된 제보가 없어요. 만료된 제보도 볼 수 있어요.' : '위치를 확인한 제보가 없어요. 아래 목록에서 내용을 볼 수 있어요.'}
      caption="카카오맵 · 제보 장소 기준 위치예요. 숫자는 해당 위치의 제보 수예요." />
    {loading && markers.length > 0 && <p className="caption" role="status">제보 위치를 찾고 있어요…</p>}
    {!loading && missing > 0 && <div className="report-map-missing"><p className="caption" role="status">{missing}건은 위치를 확인하지 못했어요. 아래 제보 목록에는 남아 있어요.</p><Button size="small" onClick={() => setAttempt(n => n + 1)}>위치 다시 찾기</Button></div>}
    {selectedGroup && <div className="card report-map-detail" aria-live="polite">
      <div className="row between"><strong>{selectedGroup.reports[0].place}의 제보</strong><Button size="small" onClick={() => setSelected(undefined)}>닫기</Button></div>
      {selectedGroup.reports.map(report => <div className="report-map-item" key={report.id}>
        <strong style={{ color: situationColor(report.situation).accent }}>{situationColor(report.situation).label}</strong>{' '}
        <Tag>{dayKey(new Date(report.createdAt)) !== dayKey(now) ? '만료' : isConfirmed(report) ? '확인됨' : '검증 대기'}</Tag>
        <p>{report.note || '한 줄 설명 없이 등록했어요.'}</p>
        <p className="caption">{dayKey(new Date(report.createdAt))} · {report.time} · 확인 {report.confirmations.length}/2명</p>
      </div>)}
    </div>}
  </section>;
}
