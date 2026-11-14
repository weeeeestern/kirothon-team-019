import { useEffect, useState } from 'react';
import { Button } from 'antd-mobile';
import type { LiveArea } from '@/features/live/types';
import { isFresh } from '@/features/live/types';

export function LiveConditions() {
  const [area, setArea] = useState('강남역');
  const [data, setData] = useState<LiveArea | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [attempt, retry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    let active = true;
    setData(null); setError(''); setLoading(true);
    void (async () => {
      try {
        const response = await fetch(`/api/live?area=${encodeURIComponent(area)}`, { signal: controller.signal });
        const value = await response.json();
        if (!response.ok) throw new Error(typeof value.error === 'string' ? value.error : '관측 정보를 불러오지 못했어요.');
        if (value.area !== area || !value.weather || !value.population || !Array.isArray(value.disruptions)) throw new Error('관측 정보 형식을 확인하고 있어요.');
        if (active) setData(value);
      } catch (err) {
        if (active) setError(controller.signal.aborted ? '연결이 지연되고 있어요. 다시 시도해 주세요.' : err instanceof Error ? err.message : '관측 정보를 불러오지 못했어요.');
      } finally { clearTimeout(timer); if (active) setLoading(false); }
    })();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [area, attempt]);
  return <section className="card live-conditions" aria-label="공공데이터 현재 관측">
    <div className="row between"><h3>지금, 동네는 어때요?</h3><span className="real-data-tag">공공 관측</span></div>
    <label className="field compact-field">관측 지점<select value={area} onChange={event => setArea(event.target.value)}><option>강남역</option><option>여의도</option></select></label>
    {loading && <p role="status">서울시 관측 정보를 가져오고 있어요…</p>}
    {error && <div role="status"><p>{error}</p><Button size="small" onClick={() => retry(n => n + 1)}>다시 불러오기</Button></div>}
    {data && <>
      <div className="observation-grid">
        <div><span>기온</span><strong>{data.weather.temperature === null ? '미관측' : `${data.weather.temperature}°`}</strong></div>
        <div><span>초미세먼지</span><strong>{data.weather.pm25 === null ? '미관측' : `${data.weather.pm25}`}<small>{data.weather.pm25 !== null ? ' µg/m³' : ''}</small></strong></div>
        <div><span>지역 인구 혼잡</span><strong>{data.population.level ?? '미관측'}</strong></div>
      </div>
      <p className="caption">날씨 관측 {data.weather.observedAt ?? '시각 미제공'} · 인구 관측 {data.population.observedAt ?? '시각 미제공'} (KST)</p>
      {(!isFresh(data.weather.observedAt) || !isFresh(data.population.observedAt)) && <p className="caption">관측 시각이 오래됐거나 확인되지 않아요. 현재 상황과 다를 수 있어요.</p>}
      {data.disruptions.length > 0 && <details><summary>주변 도로 통제 {data.disruptions.length}건</summary>{data.disruptions.map((item, index) => <div className="observation-event" key={index}><p>{item.info}</p><span className="caption">{item.observedAt ?? '확인 시각 미제공'}{item.endsAt ? ` · 종료 예정 ${item.endsAt}` : ''}</span></div>)}</details>}
      <p className="caption">선택한 지역의 관측이에요. 열차 혼잡도나 내 경로의 운행 상태를 뜻하지 않아요.</p>
      <div className="row between"><a className="caption" href="https://data.seoul.go.kr/dataList/OA-21285/F/1/datasetView.do" target="_blank" rel="noreferrer">서울시 도시데이터 출처</a><Button size="small" fill="none" onClick={() => retry(n => n + 1)}>새로고침</Button></div>
    </>}
  </section>;
}
