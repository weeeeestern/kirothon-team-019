# 설치와 외부 API 설정

README의 "직접 실행해 보기"보다 자세한 설정이 필요할 때 읽는 문서입니다.

## 실행

Node.js와 npm이 필요합니다. 저장소 루트에서 실행합니다.

```bash
npm ci --prefix src
npm run dev
npm test
npm run build
npm run evaluate
```

React + TypeScript + Vite, antd-mobile v5를 사용합니다. 앱은 `src/`, 공용 키로 자산은 `design/`에 있습니다. 경로·제보·포인트·옷장 상태는 브라우저 `localStorage`의 `jamjam.v1`에 저장됩니다. 브라우저 저장소를 지우면 초기화되며 기기 간 공유하지 않습니다.

## 환경변수

| 환경변수 | 용도 | 브라우저 공개 |
|---|---|---|
| `VITE_KAKAO_JS_KEY` | 카카오 지도 SDK | 가능, 허용 도메인 설정 필요 |
| `KAKAO_REST_API_KEY` | 카카오 장소 검색 | 금지, 서버 전용 |
| `VITE_ODSAY_WEB_KEY` | ODsay Web/URI 대중교통 경로 조회 | 가능, 허용 도메인 설정 필요 |
| `ODSAY_API_KEY` | Web 키 미설정 시 서버 대중교통 경로 조회 | 금지, Server 플랫폼 전용 |
| `SEOUL_DATA_API_KEY` | 서울시 도시데이터·TOPIS | 금지, 서버 전용 |
| `SEOUL_SUBWAY_REALTIME_API_KEY` | 지하철 실시간 도착 | 금지, 서버 전용 |
| `PUBLIC_DATA_API_KEY` | 공공데이터포털 서비스 | 금지, 서버 전용 |

기존 로컬 `NEXT_PUBLIC_KAKAO_JS_KEY`와 `NEXT_PUBLIC_KAKAO_REST_API_KEY`는 서버 호환 입력으로 처리합니다. REST 키를 `VITE_` 변수로 옮기지 않습니다. `/api/map-config`는 지도 JavaScript 키와 명시적으로 설정한 ODsay Web 키(`odsayWebKey`)만 반환하며, `ODSAY_API_KEY`를 대신 공개하지 않습니다. 실제 값은 `.env`와 Vercel 환경변수에만 저장하고 커밋하지 않습니다.

Vercel의 Root Directory는 저장소 루트(`.`), 출력 폴더는 `src/dist`입니다. 새 환경변수와 제공자 허용 도메인은 배포 설정에서 별도로 적용해야 합니다. 키 미설정·인증 실패·할당량 초과를 실제 결과처럼 표시하지 않습니다.

## ODsay Web/URI 설정

1. ODsay LAB의 내 애플리케이션 → 설정에서 URI 플랫폼에 `kirothon-team-019.vercel.app`을 등록합니다. 로컬 검증은 `localhost:5174`도 등록합니다.
2. 해당 앱의 Web/URI 플랫폼 키를 `VITE_ODSAY_WEB_KEY`에 넣습니다. Server 플랫폼 키와 혼용하지 않습니다.
3. Vercel 프로젝트 → Settings → Environment Variables에서 같은 이름으로 **Production**에 저장한 뒤 재배포합니다. 로컬에서는 `src/.env.local`에 설정합니다.
4. 배포 도메인에서 장소 검색 → 경로 조회 → 지도·구간 표시 → 저장을 확인합니다. URI 등록과 키 저장만으로 실제 호출 성공을 판정하지 않습니다.

Web 키가 설정되면 브라우저가 ODsay에 직접 요청하며 등록 도메인으로 인증합니다. Web 키가 없으면 `/api/transit` 서버 경로를 사용하고, 이때 `ODSAY_API_KEY`에는 Server 키와 실제 발신 IP 허용 설정이 필요합니다. Web 인증 실패 시 서버 키를 브라우저로 전달하지 않습니다. 공식 설정 안내는 [ODsay 가이드](https://lab.odsay.com/guide/guide?platform=web)를 따릅니다.

2026-11-14 초기 배포 검증에서는 카카오 장소 검색 서비스 비활성(403), 지도 SDK 도메인 미등록(401), ODsay 키 인증 오류를 확인했습니다. 당시 실패 기록과 이후 검증 결과는 [개발 기록](../BUILD_REPORT.md)에서 구분합니다.
