---
inclusion: fileMatch
fileMatchPattern: ['src/pages/**', 'src/components/**', 'src/state/**', 'src/theme/**', 'src/features/**', 'src/App.tsx', 'src/main.tsx']
---

# 프론트엔드(Vercel) 규칙

- 서버와의 통신은 `src/api/`의 함수만 쓴다. 컴포넌트에서 `@supabase/supabase-js`를 직접 가져오지 않는다.
- Supabase 연결 여부는 `src/api/`가 알려 주는 값으로만 판단한다. 연결이 없으면 지금의 `localStorage` 데모 흐름을 그대로 쓴다.
- 판정(`runDay`)은 브라우저에서만 돌린다. 경로와 출발 시각을 서버로 보내지 않는다.
- 키로는 `KiroAvatar`로만 그린다. 이상이 있는 날은 상황 의상이 착용 옷보다 우선한다(`design/DESIGN.md` 6장).
- 화면 규칙은 `design-system` steering을 따른다.
- 배포(`vercel`)는 사람이 승인한 뒤에만 한다. 환경변수는 Vercel 대시보드에 둔다.
