# 설계: 데이터와 합성 시나리오 평가 (data-and-evaluation)

## 개요

수집은 개발 시점에 Node 스크립트로 한 번 하고, 결과를 `src/data/*.json`으로 커밋한다. 앱은 이 JSON만 읽는다. 평가는 같은 JSON과 합성 시나리오를 `anomaly-engine`에 넣어 지표를 낸다.

```
scripts/collect/*.ts ──(키: .env)──▶ 공공 API
        │ 검증 통과분
        ▼
src/data/*.json (+ meta)   data/SOURCES.md (검증 기록)
        │                          │
        ▼                          ▼
 anomaly-engine ◀── scripts/eval/scenarios.ts ──▶ 지표 JSON ──▶ 결과 화면 / README
```

## 모듈과 경로

| 경로 | 책임 |
|---|---|
| `scripts/collect/<source>.ts` | 소스별 수집. 키는 `process.env`에서만 읽는다 |
| `scripts/collect/verify.ts` | 키 발급 여부, 샘플 호출, 스키마 확인 → `data/SOURCES.md` 갱신 |
| `src/data/baselines.json` | 기준선(요일 유형 × 30분 × 지역/구간) |
| `src/data/signals.json` | 오늘 신호(기상, 혼잡, 돌발 등), `meta` 포함 |
| `src/data/regions.json` | 자치구별 사용 가능 신호, 검증 대상 3곳 |
| `src/data/synthetic/` | 소스 대체용 합성 데이터 |
| `scripts/eval/scenarios.ts` | 평범한 날, 이상 주입일 시나리오 생성 |
| `scripts/eval/run.ts` | `runDay` 호출, 지표 계산, `src/data/evaluation.json` 출력 |
| `data/SOURCES.md` | 소스별 검증 결과와 사용 여부 |

## 데이터 모델

```ts
interface DataMeta { source: string; collectedAt: string; mode: 'real' | 'synthetic'; note?: string }

interface BundleFile<T> { meta: DataMeta; items: T[] }

interface EvaluationResult {
  basis: '합성 시나리오 기준';
  ordinaryDayNotices: number;          // 목표 0
  detectionRate: number;               // 목표 ≥ 0.8
  reductionVsFixed: number;            // 목표 ≥ 0.5
  helpfulRatio: number | null;         // 참고 지표
  sources: { name: string; mode: 'real' | 'synthetic' }[];
}
```

## 핵심 규칙

- 수집 스크립트는 응답을 그대로 저장하지 않고 필요한 필드만 뽑아 `BundleFile`로 정규화한다. 소스마다 형식이 달라도 앱 쪽 타입은 하나다.
- `verify.ts`가 실패한 소스는 `mode: 'synthetic'`으로 합성 데이터를 `src/data/synthetic/`에서 가져오고, 실패 사유를 `SOURCES.md`에 남긴다.
- 고정 임계값 비교는 같은 입력에서 `z >= 1.0`이면 알림으로 센다. 개인 임계값 엔진의 알림 수와 비교해 `reductionVsFixed = 1 - engine / fixed`로 계산한다.
- 탐지율은 `주입한 이상 중 알림이 생성된 수 / 주입한 이상 수`다. 평범한 날과 이상 주입일의 데이터는 시드를 고정해 재현 가능하게 만든다.
- 샘플 데이터 모드가 기본이다. 실데이터 모드는 `VITE_DATA_MODE=real`일 때만 켜진다. 두 모드 모두 번들을 읽을 뿐 네트워크를 쓰지 않는다.

## 오류 처리

- 수집 스크립트는 API 오류, 빈 응답, 스키마 불일치를 소스별로 잡아 로그에 남기고 다른 소스 수집을 계속한다.
- 키가 없으면 해당 소스를 `unverified`로 기록하고 합성 데이터로 대체한다. 스크립트는 종료 코드 0으로 끝난다.
- 번들 JSON의 `meta`가 없으면 앱은 로드 시점에 오류를 표시하지 않고 "수집 시각 미상"으로 표기한다.

## 보안

- `.env`는 이미 `.gitignore`에 있다. 수집 스크립트 로그에 키나 요청 URL의 쿼리 문자열을 출력하지 않는다.
- 번들 JSON에 개인정보를 넣지 않는다(공공데이터 집계값만).

## 테스트 전략

- `scripts/eval/run.ts`를 `vitest`로 감싸 목표 3개를 단언한다(알림 0건, 탐지율 0.8 이상, 감소율 0.5 이상). 지표가 목표 아래로 내려가면 테스트가 실패하도록 해 튜닝 회귀를 막는다.
- 정규화 함수는 샘플 응답 fixture로 단위 테스트한다.

## 2026-11-14 실제 파일 기준선

- 입력: 혼잡도 CSV/XLSX 5개, 2025년 일별 승하차 CSV 1개, 2026년 1~4월 대기질 XLSX 4개. 원본은 보존하고 해시·행수·단위를 `src/data/public/provenance.json`에 기록한다.
- 최신 혼잡도 분기 평균은 호선·역·방향·요일·30분 구간의 % 값이다. 날짜별 분산을 가진 데이터로 간주하지 않는다.
- 승하차 인원은 평균·표본표준편차(n-1)·표본일수를 별도 계산한다.
- 대기질은 서울 도시대기 측정소의 시간별 농도를 사용하며 결측을 0으로 바꾸지 않는다.
- 번들은 필요할 때 읽고 `src/features/baseline/`에서 조회한다. 현재 관측과 합성 평가를 별도 경로로 유지한다.
