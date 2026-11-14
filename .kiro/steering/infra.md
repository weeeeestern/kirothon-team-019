# 인프라 및 외부 API 지침

## 배포: Vercel

- 배포 플랫폼은 Vercel을 사용한다.
- 환경변수는 Vercel 대시보드의 Environment Variables에 등록한다. `.env` 파일은 `.gitignore`에 포함시키고 커밋하지 않는다.
- 빌드 명령, 출력 디렉토리 등 Vercel 설정은 `vercel.json` 또는 Vercel 대시보드에서 관리한다.

## 카카오맵 API

- 지도 표시 및 장소 검색은 카카오맵 API를 사용한다.
- JavaScript 키는 환경변수 `NEXT_PUBLIC_KAKAO_JS_KEY`로 관리한다. (브라우저에서 사용)
- REST API 키는 환경변수 `NEXT_PUBLIC_KAKAO_REST_API_KEY`로 관리한다. (서버사이드 전용)
- API 문서: https://apis.map.kakao.com
- 지도 스크립트 로드: `//dapi.kakao.com/v2/maps/sdk.js?appkey=${NEXT_PUBLIC_KAKAO_JS_KEY}`

## 공공데이터포털

- API 키는 환경변수 `PUBLIC_DATA_API_KEY`로 관리한다.
- API 포털: https://www.data.go.kr

## 서울 열린데이터광장

- 일반 API 키는 환경변수 `SEOUL_DATA_API_KEY`로 관리한다.
- 실시간 지하철 도착 현황 API 키는 환경변수 `SEOUL_SUBWAY_REALTIME_API_KEY`로 관리한다. (별도 활용사례 승인 필요)
- API 포털: https://data.seoul.go.kr

## 대중교통 API: ODsay LAB

- 대중교통 경로/정보 조회는 [ODsay LAB API](https://lab.odsay.com)를 사용한다.
- API 키는 환경변수 `ODSAY_API_KEY`로 관리한다. 코드에 직접 하드코딩하지 않는다.
- API 키 값은 Vercel 환경변수에 등록한다.
- API 문서: https://lab.odsay.com/application/info
