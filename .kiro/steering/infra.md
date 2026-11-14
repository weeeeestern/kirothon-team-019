---
inclusion: always
---

# 인프라 및 외부 API 지침

## 배포

- Vercel 프로젝트는 저장소 루트에서 빌드한다. 프론트 출력은 `src/dist`, 서버 핸들러는 `api/`이다.
- `.env` 및 키는 커밋하지 않는다. Vercel 환경변수 설정은 코드 반영과 별개다.
- 로컬 Vite 개발 서버도 동일한 `/api/` 계약을 제공한다.

## 카카오맵과 장소 검색

- 지도 JavaScript 키는 `VITE_KAKAO_JS_KEY`를 사용한다. 이 키는 브라우저에 공개되므로 카카오 개발자 콘솔에서 허용 도메인을 제한한다.
- `/api/map-config`는 지도 JavaScript 키와 명시적으로 설정된 `VITE_ODSAY_WEB_KEY`의 `odsayWebKey`만 반환할 수 있다. 카카오 REST 키와 `ODSAY_API_KEY` 등 서버 비밀 키는 절대 반환하지 않는다.
- 장소 검색 REST 키는 서버 환경변수 `KAKAO_REST_API_KEY`를 사용한다.
- 이전 로컬 환경의 `NEXT_PUBLIC_KAKAO_JS_KEY`, `NEXT_PUBLIC_KAKAO_REST_API_KEY`는 서버에서만 호환해 읽는다. `NEXT_PUBLIC_`라는 접두사가 REST 키 공개를 허용하지 않는다.
- 공식 문서: https://apis.map.kakao.com/web/documentation/

## ODsay 대중교통 길찾기

- 2026-11-14 사용자 승인으로 Web/URI 도메인 인증을 우선 사용한다. `VITE_ODSAY_WEB_KEY`는 ODsay Web/URI 플랫폼에서 발급한 키이며 브라우저가 선택 좌표로 ODsay를 직접 호출한다.
- ODsay Service URI에는 `kirothon-team-019.vercel.app`, 로컬 검증용 `localhost:5174`를 등록한다. 운영 키는 Vercel의 Production 환경변수에 추가하고 재배포한다.
- Web 키가 없을 때만 기존 `/api/transit` 서버 경로를 사용한다. `ODSAY_API_KEY`는 Server 플랫폼 전용이며 호출 서버의 허용 IP 설정이 필요하다. Web 인증 실패를 Server 키 공개나 합성 경로로 우회하지 않는다.
- 지도는 실제 노선 geometry와 정류장 연결선을 구분해 표시한다.
- 인증·도메인·할당량 오류를 숨기지 않는다. 키를 포함한 URL을 로그에 남기지 않는다.
- 공식 문서: https://lab.odsay.com/guide/guide?platform=web

## 공공데이터

- `PUBLIC_DATA_API_KEY`, `SEOUL_DATA_API_KEY`, `SEOUL_SUBWAY_REALTIME_API_KEY`는 서버·수집 스크립트 전용이다.
- 원본 CSV/XLSX는 변경하지 않는다. 정제본에는 출처·기간·단위·원본 해시를 남긴다.
- API 정상 응답, 앱 연결, 실제 서비스 검증을 각각 구분한다.
