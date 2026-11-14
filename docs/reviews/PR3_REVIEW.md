# PreToolUse 훅: 도구 호출 전 비밀 값·force push 차단 (PR #3)

모든 Kiro 도구 호출 직전에 `guard-pretool.sh`를 실행하고, 종료 코드 2로 force push, `.env`/`.pem`/`.key` 스테이징, 도구 입력 속 비밀 값, 비밀 값이 스테이징된 커밋을 막는 PR이다. 이벤트 JSON 전체를 `grep`으로 훑는 방식이며 JSON 파서는 쓰지 않는다. 이 레포는 Public이고 실제 키가 로컬 `.env`에 있으므로 목적은 타당하다. 그러나 스크립트를 로컬에서 직접 돌려 보니, 이 레포의 대표 정상 작업(`src/.env.example` 편집)을 차단하고, 가장 민감한 `DATABASE_URL` 비밀번호는 탐지하지 못한다.

Watch for: (1) 실제 `src/.env.example` 내용을 쓰는 호출이 차단된다 (confirmed). (2) `DATABASE_URL`의 비밀번호, Supabase JWT는 도구 입력과 커밋 검사 모두에서 통과한다 (confirmed). (3) `git add -A`/`git add .`/`git commit -a`는 통과한다 (confirmed). (4) 이벤트 JSON 구조 가정이 틀리면 force push·add 규칙 전체가 조용히 통과한다. 이 가정은 PR 설명도 미검증이라고 밝혔다 (confirmed).

**Verdict**: NEEDS_CHANGES

범례: **[실행]** 스크립트를 직접 돌려 확인함 (`/bin/bash` 3.2.57, BSD grep 2.6.0, 임시 git 저장소 사용). **[추론]** 코드만 읽고 판단함.

## High-level view

도구 호출 이벤트를 문자열로 취급해 `grep`으로 검사한다. 셸 명령 규칙(force push, `git add`)은 `"command"` 값만 뽑아서 적용하고, 비밀 값 규칙은 이벤트 전체에 적용한다. 설계 의도는 맞지만 이벤트 스키마를 확인하지 못한 채 `"command"` 키 하나에 기대고 있고, 키가 없으면 아무 경고 없이 통과한다.

비밀 값 정규식은 변수 이름 뒤 최대 6개 비영숫자를 건너뛰고 16자 이상을 값으로 본다. 이 구조 때문에 JSON의 `\n`(2글자)을 건너뛰어 다음 변수 이름을 값으로 오인한다. 빈 값 목록인 `.env.example`과 변수 이름을 나열한 문서가 차단된다. 반대로 `DATABASE_URL` 형식, Supabase JWT, `serviceKey=`/`appkey=` 쿼리 형식은 패턴에 없어서 통과한다.

force push와 `git add` 규칙은 우회가 쉽다. `+refspec`, `-uf`, `git -C`, `git add -A/.`, 따옴표로 감싼 경로가 모두 통과한다. 이 훅은 에이전트의 실수를 막는 안전망이지 적대적 우회를 막는 장치가 아니므로 모든 우회를 막을 필요는 없다. 다만 `git add -A`와 `git commit -a`는 에이전트가 흔히 쓰는 형태라 최소한 커밋 단계 검사가 이를 커버해야 한다.

비밀 값이 stderr로 새는 경로는 찾지 못했다. 스크립트 실패(경로 오류, 구조 불일치)는 모두 fail-open이다.

## Issues (13)

<details>
<summary>Issues (13)</summary>

1. **`.env.example` 편집 차단 (머지 차단)** — `[^A-Za-z0-9]{0,6}`가 JSON `\n`을 건너뛰고 다음 변수 이름을 값으로 매칭한다. 값 부분에서 `_`를 제외하거나 변수 이름 자체는 값으로 인정하지 않도록 정규식을 고친다.
2. **DATABASE_URL 비밀번호 미탐지 (머지 차단)** — `://user:password@host` 형식 패턴(`[a-z]+://[^:/@[:space:]]+:[^@[:space:]]{4,}@`)을 추가한다.
3. **`git commit -a`/`-am` 우회 (수정 권장)** — 커밋 단계 검사는 `--cached`만 보므로 `-a`가 올리는 tracked 변경은 검사되지 않는다. `-a`가 있으면 `git diff HEAD`도 검사한다.
4. **`git add -A`/`.`/`-u`/`:/` 미차단 (수정 권장)** — `.env`는 `.gitignore`에 있어 대부분 안 올라가지만, `-f` 없이 `.`을 쓰는 경우를 대비해 커밋 단계 검사(3번)로 보완한다.
5. **이벤트 구조 가정 fail-open (수정 권장)** — `"command"`가 없으면 규칙 1, 2, 4가 통째로 꺼진다. 최소한 `tool_name`이 셸 도구인데 `command`를 못 찾으면 stderr 경고를 남기고, 가능하면 `jq`/`node`로 파싱한다.
6. **훅 경로가 cwd 상대 경로 (수정 권장)** — `bash .kiro/scripts/guard-pretool.sh`는 cwd가 레포 루트가 아니면 종료 코드 127로 실패한다. 2가 아니므로 차단되지 않고 통과한다. 절대 경로나 `git rev-parse --show-toplevel` 기반으로 바꾼다.
7. **force push 변형 누락 (수정 권장)** — `+main`/`+HEAD:main`, `-uf`/`-fu`, `git -C . push -f`, `git -c k=v push -f`가 통과한다. `+refspec`과 묶음 단문 옵션(`-[a-z]*f`), `git ... push` 사이 옵션 허용을 추가한다.
8. **force push 오탐 (수정 권장)** — 커밋 메시지나 `echo`에 "git push -f"가 들어가거나 `git push origin fix --force-x`처럼 비슷한 옵션이 있어도 막는다. 단어 경계(`--force([[:space:]=]|$)`)를 쓰고, 명령 구분자(`&&`, `;`, `|`) 단위로 나눠 검사한다.
9. **`git add` 정규식 오탐/우회 (수정 권장)** — `src/foo.env.ts`, `docs/.environment.md`는 막히고, `git add "a.pem"`, `'a.pem'`, `a.pem;`, `a.pem&&`, `.env*`는 통과한다. 종결 문자 집합을 `[[:space:]"'\\;&|]`로 넓히고 `.env` 매칭은 파일명 시작(`(^|/)\.env`)으로 고정한다.
10. **커밋 단계 검사가 대소문자 구분 (참고)** — 입력 검사는 `-i`인데 `git diff -G`는 구분한다. `odsay_api_key=...`를 스테이징하면 통과한다. 두 검사의 대소문자 처리를 맞춘다.
11. **`serviceKey=`/`appkey=` 쿼리 형식 미탐지 (참고)** — 공공데이터 API가 실제로 쓰는 형식이지만 변수 이름이 없어 통과한다. 기존 PostFileSave 에이전트 훅이 보완하므로 우선순위는 낮다.
12. **placeholder 예외가 매칭 문자열에만 적용 (참고)** — 의도대로 동작하지만, `your`/`example`이 값 안에 들어 있으면 실제 키도 통과한다 (`ODSAY_API_KEY=yourRealKey...` 형태).
13. **PostFileSave 훅과 역할 중복, 실제 Kiro 동작 미검증 (참고)** — 머지 후 PR 설명의 `echo AKIA...` 시나리오뿐 아니라 force push와 `.env.example` 편집도 같이 확인한다.

</details>

<details>
<summary>Details</summary>

## 비밀 값 정규식이 변수 이름을 값으로 오인하는 문제 (`guard-pretool.sh:19`, `:36`)

비밀 값 규칙 `(KAKAO|ODSAY|SEOUL|PUBLIC_DATA|SUPABASE)[A-Z_]*(KEY|SECRET|TOKEN)[^A-Za-z0-9]{0,6}[A-Za-z0-9%+/=_.-]{16,}`에서 값 문자 집합에 `_`가 들어 있다. 이벤트는 JSON이라 줄바꿈이 문자 그대로 `\n` 두 글자로 들어오고, 이 두 글자가 `{0,6}` 구분자에 흡수된다. 그 뒤에 오는 다음 변수 이름(`SEOUL_DATA_API_KEY` 등, 모두 16자 이상)이 값으로 매칭된다. **[실행]** 입력 `ODSAY_API_KEY=\nSEOUL_DATA_API_KEY=\n`이 종료 코드 2로 차단되고, 레포의 실제 `src/.env.example` 전체를 `fs_write` 이벤트로 만들어 넣어도 차단된다(매칭: `PUBLIC_DATA_API_KEY=\nSEOUL_DATA_API_KEY=`). 같은 원인으로 `ODSAY_API_KEY_FOR_SOMETHING_LONG` 같은 긴 변수 이름이 코드나 문서에 나와도 차단된다. `grep -rn ODSAY_API_KEY_REALLY_LONG_NAME src` 같은 읽기 명령도 차단되었다 **[실행]**.

해커톤 마감 직전에 팀원이 `.env.example`이나 환경 변수 문서를 고치려는 순간 에이전트가 이유를 이해하기 어려운 차단을 받게 된다. 안내 메시지는 "process.env에서 읽게 바꾸세요"인데, 빈 값 파일에는 해당되지 않는다. 값 문자 집합에서 `_`를 빼고(실제 키는 영숫자와 `%+/=-.`가 대부분) 구분자를 `[ \t]*[=:][ \t]*["']?`처럼 `=`/`:`가 있어야 하는 형태로 좁히면 두 문제가 같이 풀린다. 이 변경 후 `.env.example` 전체 내용으로 회귀 테스트를 추가해야 한다 (확인: confirmed).

## 누락된 형식: DATABASE_URL, Supabase JWT, 쿼리 키 (`guard-pretool.sh:19`)

패턴은 변수 이름에 `KAKAO|ODSAY|SEOUL|PUBLIC_DATA|SUPABASE`와 `KEY|SECRET|TOKEN`이 있어야 걸린다. **[실행]** 다음이 모두 통과했다: `DATABASE_URL=postgresql://user:S3cretPassw0rd@db.host:5432/app`, 변수 이름 없는 `postgresql://postgres:...@db.x.supabase.co:5432/postgres`, `eyJ...`로 시작하는 Supabase anon JWT 단독 문자열, `?serviceKey=<32자>`, `sdk.js?appkey=<32자>`, `ODSAY_API_KEY:` 뒤에 공백이 7개 이상 오는 경우. 커밋 단계에도 같은 `SECRET_ERE`를 쓰므로 `DATABASE_URL`이 스테이징돼도 통과한다 **[실행]**.

`DATABASE_URL`은 비밀번호가 들어 있는 유일한 변수라 가장 피해가 크다. `NEXT_PUBLIC_SUPABASE_URL`은 비밀이 아니므로 통과해도 된다. `NEXT_PUBLIC_SUPABASE_ANON_KEY=<영숫자 32자>`는 차단된다 **[실행]**. 변수 이름 없이 JWT만 들어오면 잡히지 않는다 **[실행]**.

## force push 규칙의 변형 누락과 오탐 (`guard-pretool.sh:24`)

규칙은 `git push` 뒤 아무 문자열(`.*`) 다음에 ` --force`, `--force-with-lease`, ` -f`가 오는지 본다. **[실행]** 차단: `--force`, `-f`, `--force-if-includes`(` --force` 접두 매칭), `cd x && git push origin main -f`. 통과: `git push origin +main`, `+HEAD:main`, `git push -uf`, `-fu`, `git -C . push -f`, `git -c x=y push -f`, `--mirror`, `--delete`. 오탐 **[실행]**: `git commit -m 'docs: git push -f 금지'`와 `echo 'git push -f is banned' >> README.md`가 차단된다. 문서화 작업에서 쉽게 발생한다. 정규식이 `git[[:space:]]+push`만 보므로 `git -C`·`git -c`가 끼면 못 잡는다 **[추론: 정규식 구조상 자명, 실행으로도 확인]**. `--force-with-lease`는 `--force` 접두라 차단되는데, 일부 팀은 이를 허용하지만 PR 설명이 금지로 명시했으므로 의도대로다.

`--mirror`와 `--delete`는 force push가 아니지만 파괴적이다. PR 범위 밖이므로 참고로만 적는다.

## `git add` 차단 규칙의 경계 (`guard-pretool.sh:29-32`)

`.env`는 `.gitignore`에 있어 `git add .env`는 `-f` 없이는 어차피 실패한다. 이 규칙의 실익은 `-f`를 쓴 경우와 `.pem`/`.key`다(`.pem`/`.key`도 `.gitignore`에 있다). **[실행]** 차단: `.env`, `src/.env`, `./.env.local`, `-f .env`, `key.pem`, `prod.env`. 통과: `-A`, `.`, `-u`, `:/`, `"a.pem"`(JSON에서 `\"`로 인코딩되어 종결 문자 집합 `[[:space:]"]`에 `\`가 없음), `'a.pem'`, `a.pem;`, `a.pem&&`, `.env*`, `[.]env`, `git -C d add .env`, `id_rsa`. 오탐 **[실행]**: `src/foo.env.ts`와 `docs/.environment.md`가 차단된다(`[^[:space:]]*` 접두 허용 + `.env[A-Za-z0-9._-]*`). `git add .env src/.env.example`처럼 같이 넣으면 `.env`가 토큰으로 따로 매칭되어 정상 차단된다. `git add .env; echo example`은 `.env` 뒤 `;`가 종결 문자 집합에 없어 통과하고, `git add .env && echo example`은 정상 차단된다 **[실행]**.

`git add -A`/`.`는 `.gitignore` 덕분에 `.env`를 올리지 않으므로 실제 위험은 `.gitignore`에 없는 이름의 비밀 파일이며, 이는 커밋 단계 검사(아래)가 담당한다.

## 커밋 단계 검사의 범위 (`guard-pretool.sh:42-49`)

`git diff --cached -G...`는 스테이징된 변경만 본다. **[실행]** `.env`(강제 add)·`a.env.txt`(대문자 `ODSAY_API_KEY=<값>`)·`ghp_`·`AKIA`는 파일 이름만 출력하며 차단된다. 통과: `git commit -am x`(스테이징되지 않은 tracked 파일에 비밀 값이 있는 경우 두 가지 모두), 소문자 `odsay_api_key=`(입력 검사는 `-i`, `-G`는 대소문자 구분), `DATABASE_URL`. `git -C other commit`은 훅의 cwd 저장소를 검사하므로 다른 저장소 커밋은 검사 대상이 아니다 **[추론]**. `git diff -G`는 삭제되는 줄도 매칭하므로, 비밀 값이 든 파일을 `git rm`으로 지우는 커밋도 차단된다 **[실행]**. 이 경우 이미 커밋된 비밀을 제거하는 정리 작업이 막힌다.

`git diff -G`에서 `{16,}`와 `[^A-Za-z0-9]`는 `grep -E`와 같게 동작했다(대문자 변수 이름 테스트 통과). 차이는 대소문자 구분뿐이다 **[실행]**.

## 이벤트 구조 가정과 실패 시 동작 (`guard-pretool.sh:16`, `hooks/guard-pretool.json:8`)

`CMD`는 `"command"` 키의 첫 문자열 값을 `grep -Eo ... | head -1`로 뽑는다. **[실행]** `command`가 없는 이벤트(`"cmd"`, `"commands":[...]`)와 빈 stdin, JSON 유니코드 이스케이프(`\u002d` = `-`)는 모두 종료 코드 0으로 통과한다. 줄바꿈이 있는 pretty-print JSON과 CRLF는 정상 처리된다. 첫 번째 `"command"` 값만 쓰므로, 이벤트에 다른 `command` 키가 앞서 나오는 스키마라면 잘못된 값을 검사한다 **[추론]**.

실패 모드는 전부 fail-open이다. 스크립트 안에서 `set -e`를 쓰지 않고 `|| true`로 grep 실패를 삼키며, 정상적으로 `exit 0`에 도달한다. 이것 자체는 도구 호출 전체를 막지 않으려는 합리적 선택이지만 두 가지가 조용히 일어난다. 하나는 이벤트 구조 불일치로 규칙이 꺼지는 경우이고, 다른 하나는 cwd가 레포 루트가 아닐 때 `bash .kiro/scripts/guard-pretool.sh`가 "No such file" 종료 코드 127로 끝나는 경우다 **[실행]**. 127은 2가 아니므로 차단 없이 통과한다. 어느 쪽도 관리자나 사용자에게 보이는 신호가 없다. PR 설명이 "Kiro의 실제 이벤트 형식을 확인하지 못했다"고 밝혔고, 형식이 틀리면 force push·add 규칙은 무효가 된다(비밀 값 규칙은 이벤트 전체를 훑으므로 구조와 무관하게 동작).

## 성능, 타임아웃, 이식성 (`guard-pretool.json:9`)

**[실행]** 입력 `ls` 호출 10회에 0.455초(회당 약 45ms), 1.5MB 파일 쓰기 이벤트 1회에 0.585초다. 20초 타임아웃에 한참 못 미치고, matcher가 없어도 호출당 부담은 작다. 타임아웃이 나면 종료 코드가 2가 아니므로 fail-open이다 **[추론]**.

macOS bash 3.2.57과 BSD grep 2.6.0에서 모든 테스트가 돌았고 bash 4+ 전용 문법은 없다. 셸 인젝션 경로는 찾지 못했다 **[추론]**. 이벤트 내용은 `printf '%s'`로만 전달되고 `-G` 인자는 스크립트 상수다.

## 비밀 값 누출 확인 (`guard-pretool.sh:10`, `:38`, `:46`)

**[실행]** 비밀 값이 든 이벤트를 차단시킨 뒤 stdout+stderr에서 해당 값을 검색한 결과 0건이었다. 차단 메시지는 고정 문구와 파일 이름만 출력한다. 스크립트에 `set -x`나 로그 파일 쓰기는 없다. 다만 Kiro가 훅 stdin(이벤트 전체)을 자체 로그에 남기는지는 이 PR로 알 수 없다 **[추론: 확인 필요]**.

## 테스트 범위

PR 설명은 로컬 14건(허용 7, 차단 7)을 돌렸다고 하지만 테스트 파일은 PR에 없다. 이번 리뷰에서 발견한 문제는 `.env.example` 실제 내용, `DATABASE_URL`, `-a` 커밋, 구조가 다른 이벤트, cwd 불일치다. 이 케이스들은 Not tested: 실제 Kiro 이벤트 형식, 훅 cwd, `.env.example` 편집, `commit -a`, 소문자 변수 이름의 커밋 검사.

</details>

<details>
<summary>File map</summary>

- `.kiro/hooks/guard-pretool.json` (신규, 12줄): `PreToolUse` 명령 훅 등록, matcher 없음, timeout 20.
- `.kiro/scripts/guard-pretool.sh` (신규, 51줄): force push, 비밀 파일 add, 도구 입력 속 비밀 값, 스테이징된 비밀 값 검사.

전체 diff: `gh pr diff 3 --repo weeeeestern/kirothon-team-019`

</details>

## 머지 판정

**수정 후 머지.** 도구 호출이 모두 이 훅을 지나가므로, 정상 작업을 막는 오탐은 팀 전체의 마감 직전 작업 속도를 직접 깎는다. 실제 `src/.env.example` 내용을 쓰는 호출이 차단되는 것을 직접 확인했고(Issue 1), 가장 민감한 `DATABASE_URL` 비밀번호가 통과하는 것도 확인했다(Issue 2). 이 둘은 정규식 몇 줄 수정으로 풀리니 머지 전에 고쳐야 한다. 나머지(`-a` 커밋, force push 변형, cwd 상대 경로, fail-open 경고)는 머지 직후 따로 고쳐도 되지만, 실제 Kiro 이벤트 형식은 머지 전에 한 번 확인하는 편이 안전하다. 형식이 가정과 다르면 force push·add 규칙이 전부 무효인데 아무 신호가 없기 때문이다.
