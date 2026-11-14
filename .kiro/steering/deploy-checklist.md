---
inclusion: manual
---

# 배포 점검 절차

채팅에서 `#deploy-checklist`로 불러 쓴다. 배포 직전과 외부 API 키를 바꾼 뒤에만 필요한 절차라서 항상 불러오지 않는다. 키와 도메인 규칙은 `infra.md`를 따른다.

## 배포 전

1. `npm test`와 `npm run build`가 저장소 루트에서 통과하는지 확인한다.
2. 새 환경변수가 있으면 Vercel → Settings → Environment Variables의 **Production**에 같은 이름으로 넣는다. 값은 채팅, 문서, 로그에 쓰지 않는다.
3. 브라우저 공개 키(`VITE_KAKAO_JS_KEY`, `VITE_ODSAY_WEB_KEY`) 외에 `VITE_` 접두사가 붙은 비밀 키가 없는지 `src/.env.example`과 대조한다.
4. 카카오 개발자 콘솔의 허용 도메인과 ODsay Service URI에 `kirothon-team-019.vercel.app`이 등록돼 있는지 확인한다.

## 배포 후 (공개 모바일 브라우저)

1. 카카오 장소 검색으로 출발지와 도착지를 고른다.
2. ODsay 대중교통 후보가 나오는지 본다. 인증 오류가 나면 성공 샘플로 바꾸지 않고 오류 그대로 기록한다.
3. 지도에 노선과 구간이 표시되는지 본다.
4. 경로를 저장하고 새로고침해 복구되는지 본다.
5. 결과(시각, 커밋 해시, 성공·실패 단계)를 `BUILD_REPORT.md`에 남긴다. 화면 구현 완료와 실제 제공자 응답 성공을 구분해 쓴다.
