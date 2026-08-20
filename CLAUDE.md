# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 언어

- 모든 응답, 설명, 질문은 **한국어**로 작성한다.
- 코드, 변수명, 함수명는 영어를 유지한다.
- 코드 주석, 커밋 메시지은 한국어로 작성한다.

## Project overview

Sinjo (신조어/slang) — a Korean slang dictionary and quiz web app. Two independent projects in one repo, no shared tooling or monorepo config:

- `back_end/` — Spring Boot 4.1 (Java 21) REST API, package root `com.slangs.sinjo`
- `front_end/` — React 19 + Vite SPA

The backend and frontend are started, linted, and tested completely separately.

## Commands

### Backend (`back_end/`)

```
./gradlew build          # compile + run tests
./gradlew test           # run tests only
./gradlew test --tests "com.slangs.sinjo.SinjoApplicationTests"   # single test class
./gradlew bootRun         # run the API on :8080
```

On Windows use `gradlew.bat` instead of `./gradlew`.

Requires a reachable PostgreSQL instance (see `src/main/resources/application.yaml`) plus these env vars — the app fails to start without them being resolvable (empty defaults are allowed for local dev but `app.jwt.secret` must be ≥32 UTF-8 bytes):

- `DB_USERNAME`, `DB_PASSWORD` — Postgres credentials
- `JWT_SECRET` — HS256 signing key, ≥32 bytes (falls back to a local dev default)
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NICKNAME` — seeded admin account (falls back to defaults)
- `OPENAI_API_KEY` — only needed once the (currently commented-out) Spring AI starter is enabled

### Frontend (`front_end/`)

```
npm run dev        # Vite dev server on :5555 (see vite.config.js)
npm run build       # production build
npm run lint         # eslint .
npm run preview      # preview a production build
```

Requires `.env` with `VITE_API_BASE_URL` (defaults to `http://localhost:8080` if unset — see `src/api/client.js`). An `.env.example`-style template exists but isn't committed as `.env.example`; check the comment at the top of `.env`.

## Architecture

### Backend layering

Standard Spring layering, one package per concern: `controller` → `service` → `repository` → `entity`, plus `dto`, `security`, `config`, `exception`, `util`.

- **Auth is stateless JWT**, not sessions. `SecurityConfig` sets `SessionCreationPolicy.STATELESS`, disables CSRF/form login/basic auth, and wires a single `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`. The filter parses `Authorization: Bearer <token>`, and on a valid token puts the **numeric user id** (not a username) as the `Authentication` principal, with a `ROLE_*` authority derived from the `role` claim. Controllers read the current user via `@AuthenticationPrincipal Long userId` — this is `null` for anonymous requests since `anyRequest().permitAll()` is the default, so 401s must be thrown explicitly (see `UserController.mypage`) rather than relied upon from Security.
- **Authorization is centralized**, not per-endpoint: only `SecurityConfig` (`.requestMatchers("/api/admin/**").hasRole("ADMIN")`) gates admin access. `AdminController` itself has no permission checks by design — keep new admin endpoints under `/api/admin/**` rather than adding checks in the controller.
- **CORS is configured in exactly one place**: `app.cors.allowed-origins` in `application.yaml`, consumed by `SecurityConfig.corsConfigurationSource()`. Do not add `@CrossOrigin` on controllers — it's been deliberately removed before (see `WordController` comment) because a second CORS layer silently overrides the central one.
- **Global exception handling**: `GlobalExceptionHandler` (`@RestControllerAdvice`) is the only place HTTP status codes get decided for domain errors — throw the existing typed exceptions (`DuplicateEmailException`, `InvalidCredentialsException`, `UnauthorizedException`, `DuplicateWordException`, `NotFoundException`) from services rather than building `ResponseEntity` error bodies manually. `@Valid` + `MethodArgumentNotValidException` produces field-level errors consumed by the frontend's `error.fieldErrors`.
- **Admin bootstrap, not admin signup**: there's no signup path that grants `ADMIN`. `AdminAccountInitializer` (an `ApplicationRunner`) seeds/promotes the account at `app.admin.email` to `ADMIN` on every boot — idempotent, safe to run repeatedly.
- **Demo data seeding**: `DataInitializer` inserts sample `Word`/`QuizWord` rows only if their tables are empty, so it never overwrites real data. Delete it once a real content pipeline exists.
- **Quiz answer checking** (`QuizService.checkAnswer`) grades differently per `QuizType`: multiple-choice checks against the *meaning*, initial-sound/subjective check against the *word* itself — this split exists because the subjective quiz prompt used to leak the meaning into the question text, making a copy-paste a free correct answer. `QuizWord.options` in the DB holds only wrong answers; the correct answer is merged and shuffled in at request time (`getMultipleChoiceQuizzes`).
- **Korean text handling**: `KoreanUtils.extractInitialSound` decomposes Hangul syllables (U+AC00–U+D7A3) into their leading consonant (초성) for the initial-sound quiz game mode — this is the only place Unicode Hangul-block math happens.
- Entity note: `User` extends `BaseEntity` (JPA auditing, enabled via `@EnableJpaAuditing` on `SinjoApplication`); `Word`/`QuizWord` do not.
- `application.yaml` has Korean-language inline comments (`[수정]` = "fixed/changed") documenting *why* a setting is what it is — read them before changing datasource/JPA/CORS/JWT config, they usually record a prior bug.

### Frontend structure

- Routing is centralized in `App.jsx`; all routes render inside a single `Layout` (shared header/footer via `<Outlet>`). Protected routes wrap their element in `RequireAuth` (logged-in) or `RequireAdmin` (role check) rather than guarding inside the page component.
- **Auth state**: `AuthContext.js` defines the context/hook only (kept separate from the provider component so Vite Fast Refresh doesn't break — components and non-component exports can't share a file). `Auth.jsx` implements `AuthProvider`: JWT lives in `localStorage` (`src/api/client.js`'s `getToken`/`setToken`/`clearToken`), and on mount, if a token exists, it re-fetches `/api/users/me` to rehydrate `user`; a failed fetch (expired/invalid token) clears the token and logs out silently.
- **API layer**: everything funnels through `src/api/client.js#request()`, which attaches the `Authorization` header when a token exists and normalizes error handling — a non-2xx response throws an `Error` with `.status` and `.fieldErrors` populated from the JSON body (matching `GlobalExceptionHandler.ErrorResponse` shape). Per-domain modules (`userApi.js`, `wordApi.js`, `quizApi.js`, `adminApi.js`, `translateApi.js`) wrap `request()`/`apiUrl()` — add new endpoints there rather than calling `fetch` directly from a page.
- The backend base URL is configured in exactly one place: `VITE_API_BASE_URL` in `.env`, read by `client.js`. Don't hardcode `http://localhost:8080` in a page or api module.
- The backend accepts requests at both `/api/users/me` and the legacy `/api/users/mypage` — prefer `/me` in new frontend code; `/mypage` is kept only for compatibility.


## 알려진 이슈 / 주의사항

작업 전 반드시 확인할 것. 과거에 실제로 문제가 됐던 항목들이다.

### DB: PostgreSQL로 전환됨 — MySQL 문법 금지
`QuizRepository.findRandomQuizzes`가 `ORDER BY RAND()`를 쓰고 있다면 고쳐야 한다.
`RAND()`는 MySQL 함수라 PostgreSQL에서 `function rand() does not exist`로 실패한다.
퀴즈 목록 API 3개가 500을 반환하는데, 프론트가 샘플 데이터로 폴백하기 때문에
화면은 정상으로 보이고 "DB에 등록한 문제가 안 나온다"는 형태로만 드러난다.
네이티브 쿼리 대신 JPQL로 id만 읽어 Java에서 셔플하는 방식을 쓴다.

### 비밀정보를 소스에 넣지 않는다
`application.yaml`에 DB 주소, 관리자 비밀번호, JWT 시크릿의 **실제 값**을 넣지 않는다.
모두 `${ENV_VAR:}` 형태로 두고 값은 IntelliJ 실행 구성이나 서버 환경변수에 넣는다.
`front_end/.env`도 커밋 대상이 아니다. `.gitignore`에 `.env`가 없으면 추가한다.

### JWT
- role은 토큰에 담겨 24시간 유지된다. 권한을 바꿔도 재로그인 전까지 반영되지 않는다.
- 토큰 본문은 Base64 인코딩일 뿐 암호화가 아니다. 비밀번호·개인정보를 클레임에 넣지 않는다.
- `Role.getAuthority()`의 `ROLE_` 접두어를 제거하면 `hasRole("ADMIN")`이 항상 403이 된다.
- `JwtAuthenticationFilter`에 `@Component`를 붙이지 않는다.
  Filter 빈은 서블릿 컨테이너에 자동 등록되어 시큐리티 체인과 이중으로 걸리고,
  필터 순서가 바뀌면 "토큰을 보냈는데 401"이 되는 추적 불가 버그가 된다.
  `SecurityConfig`에서 `new`로 생성해 체인에만 등록한다.

### 미완성 항목 (건드릴 때 확인 필요)
- `Word.category`: 컬럼은 있으나 값을 넣는 코드가 없어 항상 null이다.
- `WordResponse.java`: `WordDto.java`로 대체되어 참조하는 곳이 없는 죽은 코드다.
- 좋아요 중복 방지 없음. 한 사람이 무한히 누를 수 있다.
- refresh token 없음. access token만 24시간.
- 마이페이지의 활동 요약·배지·주간 기록은 아직 샘플 데이터다 (`data/myPageSampleData.js`).

## Git 규칙

- **`main` 브랜치에 직접 커밋하지 않는다.** 반드시 브랜치를 만들고 PR로 올린다.
- 브랜치명: `fix/`, `feat/`, `refactor/`, `docs/` 접두어 사용
- 커밋 메시지는 한글, `type: subject` 형식 (예: `fix(auth): resolve token expiry`)
- 4인 팀 프로젝트다. 여러 파일을 한 번에 고치기 전에 무엇을 바꿀지 먼저 알린다.
- 커밋 전 확인:
  - `back_end/`: `gradlew.bat build`   
  - `front_end/`: `npm run lint`