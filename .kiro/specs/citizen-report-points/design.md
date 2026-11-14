# 설계: 시민 제보와 포인트 (citizen-report-points)

## 개요

백엔드 없이 브라우저 상태(`zustand` 없이 React Context + `localStorage`)로 제보, 포인트, 해금을 관리하는 모듈이다. 판정은 `anomaly-engine`이 하고, 이 모듈은 제보 공급과 보상만 맡는다.

```
제보 등록 ─▶ 검증 대기 ─▶ 확인 2명 ─▶ 확인됨 ─▶ Anomaly(source:'report') ─▶ anomaly-engine
   │ +10                                                    │
   ▼                                          '도움됨' ◀── 알림
 포인트 ledger ◀──────────────── +5 / +1 ◀──────────────────┘
   │
   ▼
 레벨 ─▶ 아이템 해금 / 한정판(당일)
```

## 모듈과 경로

| 경로 | 책임 |
|---|---|
| `src/features/reports/types.ts` | 제보, 확인, 반응 타입 |
| `src/features/reports/reportStore.ts` | 등록, 확인, 상태 전이, `localStorage` 저장 |
| `src/features/reports/toAnomaly.ts` | 확인된 제보를 `Anomaly`로 변환 (고정 편차 사용) |
| `src/features/points/ledger.ts` | 적립 내역 기록과 누적 합산 |
| `src/features/points/levels.ts` | 레벨 구간표, 레벨 계산 |
| `src/features/points/unlocks.ts` | 레벨별 아이템, 당일 한정판 |
| `src/features/points/constants.ts` | 포인트 획득량(제안값) 한 곳에 모음 |

## 데이터 모델

```ts
type ReportStatus = 'pending' | 'confirmed';

interface Report {
  id: string; reporterId: string;
  situation: 'construction' | 'strike' | 'marathon' | 'congestion'; // 제보 가능 유형
  place: string; occurredAt: string; note: string;                  // note ≤ 100자
  status: ReportStatus; confirmedBy: string[]; helpedBy: string[];
  createdAt: string;
}

interface LedgerEntry {
  id: string; userId: string; at: string;
  kind: 'report' | 'helpful' | 'feedback'; points: number; refId: string;
}

interface UserState { userId: string; level: number; unlocked: string[]; limitedToday: string[] }
```

## 핵심 규칙

- 상태 전이: `pending` → `confirmed`는 `confirmedBy`에서 제보자를 제외한 서로 다른 사용자가 2명 이상일 때만 일어나고 되돌리지 않는다.
- 같은 `(userId, reportId)` 확인과 '도움됨'은 집합에 넣어 중복을 막는다.
- 적립은 `ledger`에 항목을 추가하는 방식으로만 한다. 누적은 합계로 계산해 중복 적립을 추적할 수 있게 한다.
- `confirmed` 제보만 `toAnomaly`로 변환되어 엔진에 들어간다. 편차는 고정값(초기 `3.0`)이다.
- 한정판은 `limitedToday`에 `YYYY-MM-DD` 키로 저장하고, 날짜가 바뀌면 획득 불가, 보유분은 `unlocked`에 옮겨 유지한다.

## 오류 처리

- `localStorage`를 읽을 수 없거나 JSON이 깨졌으면 초기 상태로 시작하고 앱을 멈추지 않는다.
- 존재하지 않는 제보 ID에 대한 확인·반응은 무시하고 오류를 던지지 않는다.

## 테스트 전략

- 단위 테스트(`vitest`): 2명 확인 시 전이, 제보자 본인·중복 확인 제외, 중복 '도움됨' 1회 적립, 레벨 경계값, 한정판 날짜 경계.
- 시연용 시뮬레이션 사용자 2명을 시드로 두고 확인 버튼 한 번에 전이되도록 한다.

## 제보 지도 (2026-11-14)

- `features/reports/ReportMap.tsx`: 저장 제보를 위치별로 묶고 만료 필터·선택 상세·위치 조회 재시도를 제공한다. 기존 확인 및 포인트 로직과 분리한다.
- `reportLocation.ts`: 경로 출발·도착 이름이 일치하면 저장 좌표를 사용한다. 나머지는 기존 `/api/places`에 서울 지역 장소명을 조회한다. 역 접미사와 노선명만 정규화하며, 멀리 떨어진 동명 장소나 부분 일치는 채택하지 않는다. ODsay 경로 배열 인덱스를 역 좌표로 추정하지 않는다.
- 조회는 같은 장소당 한 번, 최대 3개 동시 요청으로 제한한다. 성공 좌표는 화면 내 캐시에 보관하고 확인 상태 변경이나 입력 중에는 재조회하지 않는다. 화면 해제 시 진행 요청을 취소한다.
- `KakaoMap`의 선택형 마커는 DOM 버튼을 `CustomOverlay`로 표시한다. 버튼 텍스트와 접근성 이름은 문자열로 설정하고 제보 내용을 HTML로 삽입하지 않는다. 기존 경로 지도 기본 동작을 유지한다.
- 빈 제보, 당일 제보 없음, 위치 미확인, 지도 SDK 실패를 각각 안내한다. SDK 실패 시 기존 재시도와 전체 제보 목록을 유지한다.
- 좌표는 제보 장소의 대표 위치이며 사용자의 실제 관측 GPS가 아니다. 서버 비밀 키는 기존 서버 중계에만 둔다.
