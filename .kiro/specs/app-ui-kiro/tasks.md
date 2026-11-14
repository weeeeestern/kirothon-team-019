# 작업 목록: 앱 화면과 키로 (app-ui-kiro)

- [ ] 1. 프로젝트 스캐폴드
  - [ ] 1.1 Vite + React + TypeScript 생성, `npm install antd-mobile @ant-design/icons`
  - [ ] 1.2 `src/theme/theme.css`, `src/theme/situation.ts`, `src/main.tsx`를 `design/DESIGN.md` 5장대로 작성
  - [ ] 1.3 `ConfigProvider(koKR)`, 다크 테마 고정, Pretendard 글꼴
  - _요구사항: 1.3, 8.3_

- [ ] 2. 앱 뼈대
  - [ ] 2.1 `App.tsx` 라우터와 `BottomTabBar`(홈, 알림, 제보, 키로의 방), 알림 개수 `Badge`
  - [ ] 2.2 `PageHeader`, `SafeArea`, 최대 폭 480px 가운데 정렬
  - _요구사항: 1.1~1.5_

- [ ] 3. 키로 컴포넌트
  - [ ] 3.1 `KiroAvatar`(`Kiro.render` 래핑), 알 수 없는 옵션은 `ordinary`로 대체
  - [ ] 3.2 `KiroHero`(원형 타일, glow, 280px / 260px)
  - [ ] 3.3 `prefers-reduced-motion` 처리, 시각 오버라이드 `?now=HH:mm`
  - _요구사항: 6.1, 6.2, 6.7, 3.4_

- [ ] 4. 상태와 엔진 연결
  - [ ] 4.1 `AppState`(경로, 읽음, 피드백, 착용 아이템)와 `localStorage`, 페르소나 시드
  - [ ] 4.2 `useDay`: `anomaly-engine`의 `runDay` 호출, 알림 0건 정상 처리
  - 선행: `anomaly-engine` 8번 작업
  - _요구사항: 2.3, 3.1, 3.2_

- [ ] 5. 홈
  - [ ] 5.1 평범한 날 구성: `TodayScore`, `RoutePill`, `QuietCard`, 레벨 카드
  - [ ] 5.2 이상 감지 구성: 상황 색, `IncidentCard`, 이상 첫 감지 시 `surprise`
  - [ ] 5.3 컴포넌트 테스트: 0건/이상 분기
  - _요구사항: 3.1~3.5_

- [ ] 6. 알림 상세
  - [ ] 6.1 `ComparisonBar`, `ActionBox`, `EvidenceNote`(근거, 학습 상태, 출처, 기준 시각)
  - [ ] 6.2 `FeedbackCard`: 1회 제한, 엔진 반영, +1 P 토스트, `joy` 표정
  - [ ] 6.3 "샘플 데이터" 태그
  - [ ] 6.4 컴포넌트 테스트: 3요소 표시, 피드백 1회
  - _요구사항: 4.1~4.6_

- [ ] 7. 경로 등록
  - [ ] 7.1 경로 목록 `RouteCard`, 추가·수정 `Popup`(자치구, 역/정류장, 출발 시각)
  - [ ] 7.2 선택 자치구의 사용 가능 신호 표시(`src/data/regions.json`)
  - [ ] 7.3 위치 권한을 요청하지 않음을 확인
  - _요구사항: 2.1~2.5_

- [ ] 8. 제보
  - [ ] 8.1 `Form` 구성, 필수값 검사, 100자 제한
  - [ ] 8.2 `citizen-report-points`의 `reportStore` 연결, +10 P 토스트, `proud` + `hop`
  - [ ] 8.3 시뮬레이션 사용자 확인 버튼(시연용)
  - 선행: `citizen-report-points` 2번 작업
  - _요구사항: 5.1~5.5_

- [ ] 9. 키로의 방
  - [ ] 9.1 키로 카드, 다음 레벨 카드, 포인트 획득 방법
  - [ ] 9.2 `WardrobeItem`(착용 중 / 보유 / 잠김 / 한정판)과 `Tabs`
  - [ ] 9.3 착용·해제, 잠긴 아이템 착용 불가, 해금 표정(`sparkle` + `unlock`)
  - 선행: `citizen-report-points` 6번 작업
  - _요구사항: 6.3~6.6_

- [ ] 10. 평가 결과 화면
  - [ ] 10.1 `src/data/evaluation.json`을 읽어 지표 4개와 목표 대비 통과 여부 표시
  - [ ] 10.2 "합성 시나리오 기준" 문구, 소스별 실데이터/합성 `Tag`, 수집 시각
  - 선행: `data-and-evaluation` 5번 작업
  - _요구사항: 7.1~7.3_

- [ ] 11. 마감 점검
  - [ ] 11.1 시안 `scene1~3.png`, `01`~`04`와 화면 대조, 390px / 480px 이상 폭 확인
  - [ ] 11.2 문구 점검: "~해요" 체, "위험/경고" 없음, "+10 P", "07:50", "강남 → 선릉"
  - [ ] 11.3 `BUILD_REPORT.md` 구현·검증 행 채우기
  - _요구사항: 8.1, 8.2_
