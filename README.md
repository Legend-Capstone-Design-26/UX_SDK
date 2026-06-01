# UX_SDK

UX_SDK는 **UX-Stream 캡스톤 프로젝트의 설치형 브라우저 SDK 원본 레포지토리**입니다.

이 SDK는 외부 웹사이트에 설치되어 사용자의 페이지뷰, 클릭, 체류 시간, A/B 실험 배정 정보 등을 수집하고, 수집된 이벤트를 별도의 Dashboard 서버로 전송합니다.

현재 캡스톤 프로젝트에서 실제 운영/배포 기준이 되는 수집 서버와 대시보드 기능은 **Dashboard 레포지토리**에서 관리합니다.

---

## 1. 프로젝트 내 역할

UX-Stream 프로젝트는 크게 세 개의 레포지토리로 구성됩니다.

| 레포지토리 | 역할 |
|---|---|
| `UX_SDK` | 브라우저에 설치되는 SDK 원본 코드 |
| `Dashboard` | 이벤트 수집 서버, 운영자 대시보드, A/B 테스트, LLM 인사이트, Agent Mode, Redis/Kafka 연동 |
| `Ecommerce` | SDK가 설치되는 예시 이커머스 서비스 |

즉, 이 레포지토리는 **SDK 자체를 개발하고 패키징하기 위한 저장소**입니다.

실제 대시보드 서버 실행, 이벤트 수집 API, 관리자 화면, A/B 테스트 관리, Redis/Kafka 연동, LLM/Agent 기능은 `Dashboard` 레포지토리를 기준으로 동작합니다.

---

## 2. 현재 SDK 구조

```txt
UX_SDK/
├─ packages/
│  └─ browser-sdk/
│     ├─ package.json
│     ├─ README.md
│     └─ src/
│        ├─ sdk.js
│        └─ index.mjs
├─ package.json
└─ README.md
```

핵심 SDK 코드는 다음 위치에 있습니다.

```txt
packages/browser-sdk/src/sdk.js
```

---

## 3. SDK가 하는 일

UX_SDK는 웹사이트에 설치된 뒤 다음 역할을 수행합니다.

1. 사용자 행동 이벤트 수집
2. 익명 사용자 ID 생성 및 유지
3. 세션 ID 생성 및 유지
4. 이벤트를 일정 주기로 batch 전송
5. 페이지 이탈 시 `sendBeacon` 기반 이벤트 전송
6. Dashboard 서버에서 A/B 테스트 설정 조회
7. 사용자별 variant 배정
8. variant B에 해당하는 DOM 변경사항 적용
9. 실험 적용 결과를 이벤트로 기록

---

## 4. 수집하는 주요 이벤트

현재 SDK는 다음과 같은 이벤트를 수집합니다.

| 이벤트 | 설명 |
|---|---|
| `page_view` | 페이지 진입 기록 |
| `click` | `data-track-id`가 있는 요소 클릭 기록 |
| `dwell_time` | 페이지 체류 시간 |
| `ab_config_applied` | A/B 실험 설정 적용 및 variant 배정 기록 |
| `add_to_cart` | 장바구니 추가 의미 이벤트 |
| `remove_from_cart` | 장바구니 제거 의미 이벤트 |
| `checkout_start` | 결제 시작 의미 이벤트 |
| `payment_attempt` | 결제 시도 의미 이벤트 |
| `search` | 검색 관련 클릭 이벤트 |
| `filter_change` | 필터/정렬 변경 이벤트 |

의미 이벤트는 클릭한 요소의 `data-track-id` 값을 기반으로 추론됩니다.

예를 들어 다음 버튼을 클릭하면:

```html
<button data-track-id="add_to_cart_button">
  장바구니 담기
</button>
```

SDK는 기본 `click` 이벤트와 함께 `add_to_cart` 의미 이벤트도 기록할 수 있습니다.

---

## 5. 기본 설정값

SDK의 기본 설정은 다음과 같습니다.

```js
{
  endpoint: "/collect",
  configEndpoint: "/api/config",
  siteId: "ab-sample",
  appId: "ab-sample",
  schemaVersion: 1,
  flushIntervalMs: 3000,
  maxBatchSize: 20,
  sessionTtlMs: 30 * 60 * 1000,
  clickSelector: "[data-track-id]",
  abAssignmentMode: "sticky",
  debug: false,
  sdkBaseUrl: ""
}
```

각 옵션의 의미는 다음과 같습니다.

| 옵션 | 설명 |
|---|---|
| `endpoint` | 이벤트를 전송할 수집 API 경로 |
| `configEndpoint` | A/B 테스트 설정을 가져올 API 경로 |
| `siteId` | 데이터를 구분하기 위한 사이트 ID |
| `appId` | 앱 또는 서비스 식별자 |
| `schemaVersion` | 이벤트 스키마 버전 |
| `flushIntervalMs` | 이벤트를 서버로 전송하는 주기 |
| `maxBatchSize` | 한 번에 전송할 최대 이벤트 수 |
| `sessionTtlMs` | 세션 유지 시간 |
| `clickSelector` | 클릭 이벤트를 수집할 대상 selector |
| `abAssignmentMode` | A/B variant 배정 방식 |
| `debug` | SDK 디버그 로그 출력 여부 |
| `sdkBaseUrl` | Dashboard 서버 주소 |

---

## 6. 설치 방식

현재 SDK는 npm registry에 공식 publish된 상태가 아닙니다.

따라서 현재 캡스톤 프로젝트에서는 `Dashboard` 레포지토리에서 SDK 패키지를 tarball 형태로 포함하여 사용합니다.

Dashboard 레포 기준으로는 다음 패키지가 사용됩니다.

```txt
Dashboard/vendor/enejwl-ux-sdk-0.1.1.tgz
```

Dashboard 서버는 이 패키지를 기반으로 `/sdk.js`를 제공합니다.

```txt
GET /sdk.js
```

따라서 SDK를 설치할 웹사이트는 Dashboard 서버의 `/sdk.js`를 로드하여 SDK를 사용할 수 있습니다.

---

## 7. 일반 HTML 사이트에서 사용하는 방법

Dashboard 서버가 실행 중일 때, 일반 HTML 사이트에서는 다음과 같이 SDK를 사용할 수 있습니다.

```html
<script src="http://localhost:3001/sdk.js"></script>
<script>
  MiniSDK.create({
    siteId: "legend-ecommerce",
    appId: "legend-ecommerce",
    endpoint: "http://localhost:3001/collect",
    configEndpoint: "http://localhost:3001/api/config",
    debug: true
  }).install();
</script>
```

---

## 8. React/Vite 프로젝트에서 사용하는 방법

React/Vite 프로젝트에서는 SDK 스크립트를 동적으로 로드한 뒤 `MiniSDK.create()`를 호출할 수 있습니다.

현재 `Ecommerce` 레포는 다음 흐름으로 SDK를 설치합니다.

```txt
Ecommerce FE
  → /uxsdk/sdk.js 요청
  → Vite proxy
  → Dashboard /sdk.js
```

예시 코드는 다음과 같습니다.

```ts
const SDK_SCRIPT_ID = "uxsdk-browser-sdk";
const SDK_SCRIPT_SRC = "/uxsdk/sdk.js";

const ensureSdkScript = async () => {
  if (window.MiniSDK?.create) {
    return;
  }

  const existingScript = document.getElementById(SDK_SCRIPT_ID) as HTMLScriptElement | null;

  if (!existingScript) {
    const script = document.createElement("script");
    script.id = SDK_SCRIPT_ID;
    script.src = SDK_SCRIPT_SRC;
    script.async = true;
    document.head.appendChild(script);
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("Timed out while loading UX SDK script"));
    }, 5000);

    const poll = () => {
      if (window.MiniSDK?.create) {
        window.clearTimeout(timeout);
        resolve();
        return;
      }

      window.requestAnimationFrame(poll);
    };

    poll();
  });
};

const installUxSdkOnce = async () => {
  await ensureSdkScript();

  window.MiniSDK?.create({
    endpoint: "/uxsdk/collect",
    configEndpoint: "/uxsdk/api/config",
    siteId: "legend-ecommerce",
    appId: "legend-ecommerce",
    schemaVersion: 1,
    debug: true
  }).install();
};

export const initUxSdk = () => {
  if (typeof window === "undefined") {
    return;
  }

  void installUxSdkOnce();
};
```

Vite proxy 예시는 다음과 같습니다.

```ts
server: {
  proxy: {
    "/uxsdk": {
      target: "http://localhost:3001",
      changeOrigin: true,
      rewrite: (requestPath) => requestPath.replace(/^\/uxsdk/, ""),
    },
  },
}
```

이 설정을 사용하면 다음과 같이 요청이 매핑됩니다.

| Ecommerce 요청 | Dashboard로 전달되는 요청 |
|---|---|
| `/uxsdk/sdk.js` | `/sdk.js` |
| `/uxsdk/collect` | `/collect` |
| `/uxsdk/api/config` | `/api/config` |

---

## 9. 이벤트 전송 흐름

SDK가 설치된 웹사이트에서 사용자가 행동하면 다음 흐름으로 이벤트가 수집됩니다.

```txt
사용자 행동
  ↓
Browser SDK
  ↓
POST /collect
  ↓
Dashboard 서버
  ↓
events.jsonl 저장
  ↓
Kafka dual write
  ↓
Kafka Consumer
  ↓
Redis realtime session / metrics 반영
  ↓
Dashboard 화면에서 분석 결과 확인
```

현재 Dashboard 레포에서는 파일 기반 저장소를 primary로 사용하고, Kafka와 Redis는 실시간 처리를 위한 보조 파이프라인으로 사용합니다.

---

## 10. A/B 테스트 동작 흐름

SDK는 페이지 로드 시 Dashboard 서버의 `/api/config`를 호출하여 현재 URL에 적용 가능한 running 상태의 실험을 가져옵니다.

```txt
페이지 로드
  ↓
GET /api/config?site_id=...&url=...
  ↓
running 상태의 실험 목록 응답
  ↓
SDK가 사용자별 variant 결정
  ↓
variant B인 경우 DOM 변경사항 적용
  ↓
ab_config_applied 이벤트 기록
```

기본 variant 배정 방식은 `sticky`입니다.

즉, 동일 사용자는 같은 실험에 대해 같은 variant를 유지합니다.

---

## 11. 강제 variant 확인

미리보기나 테스트 상황에서는 URL query parameter로 variant를 강제할 수 있습니다.

```txt
?__ab_force=A
?__ab_force=B
```

예시:

```txt
http://localhost:3001/preview/legend-ecommerce/checkout?__ab_force=B
```

이 경우 SDK는 실제 배정 로직과 관계없이 B variant를 적용합니다.

---

## 12. 클릭 이벤트 수집 방식

SDK는 기본적으로 모든 클릭을 수집하지 않습니다.

다음 selector에 해당하는 요소만 클릭 이벤트를 수집합니다.

```js
"[data-track-id]"
```

예시:

```html
<button data-track-id="checkout_start_button">
  결제하기
</button>
```

수집되는 클릭 이벤트에는 다음 정보가 포함됩니다.

```js
{
  element_id: "checkout_start_button",
  tag: "button",
  text: "결제하기",
  aria_label: null,
  id: null,
  class: "...",
  rect: { x, y, w, h },
  x: 120,
  y: 340
}
```

---

## 13. 수집 이벤트의 기본 형태

SDK가 전송하는 이벤트는 대략 다음 구조를 가집니다.

```js
{
  event_name: "click",
  schema_version: 1,
  app_id: "legend-ecommerce",
  site_id: "legend-ecommerce",
  ts: 1770000000000,
  url: "http://localhost:8080/checkout",
  path: "/checkout",
  referrer: "...",
  user_agent: "...",
  lang: "ko-KR",
  screen: {
    w: 1920,
    h: 1080
  },
  viewport: {
    w: 1440,
    h: 900
  },
  anon_user_id: "u_xxx",
  session_id: "s_xxx",
  ui_variant: "U",
  experiments: [
    {
      key: "exp_checkout_cta_v1",
      variant: "B",
      version: 1,
      url_prefix: "/checkout",
      goals: ["checkout_complete"]
    }
  ],
  experiment_goals: ["checkout_complete"],
  props: {
    element_id: "checkout_start_button",
    text: "결제하기"
  }
}
```

---

## 14. 로컬 개발 순서

### 14.1 Dashboard 서버 실행

SDK는 이벤트 전송과 A/B 설정 조회를 Dashboard 서버에 의존합니다.

따라서 SDK를 설치한 웹사이트를 실행하기 전에 Dashboard 서버가 먼저 실행되어야 합니다.

```bash
cd Dashboard
npm install
npm run dev
```

Dashboard 기본 주소는 다음과 같습니다.

```txt
http://localhost:3001
```

---

### 14.2 Ecommerce 서버 실행

Ecommerce 프로젝트를 사용하는 경우 FE와 BE를 각각 실행합니다.

Backend:

```bash
cd Ecommerce/BE
npm install
npm start
```

Frontend:

```bash
cd Ecommerce/FE
npm install
npm run dev
```

Ecommerce FE 기본 주소는 다음과 같습니다.

```txt
http://localhost:8080
```

---

### 14.3 이벤트 수집 확인

Ecommerce 사이트에 접속한 뒤 Dashboard 서버 로그에서 다음과 같은 수집 로그를 확인할 수 있습니다.

```txt
collect: page_view
collect: click
collect: dwell_time
```

Dashboard에서는 다음 주소에서 데이터를 확인할 수 있습니다.

```txt
http://localhost:3001/dashboard?site_id=legend-ecommerce
```

---

## 15. siteId 주의사항

SDK에서 설정한 `siteId`는 Dashboard의 site registry에 등록된 값과 일치해야 합니다.

예시:

```js
siteId: "legend-ecommerce"
```

Dashboard는 이 값을 기준으로 사이트별 이벤트, 실험, 세션, 인사이트를 분리합니다.

`siteId`가 일치하지 않으면 다음 문제가 발생할 수 있습니다.

- 이벤트는 수집되지만 대시보드에 표시되지 않음
- A/B 테스트 설정을 가져오지 못함
- 관리자 권한 체크에서 접근이 거부됨
- 실험 메트릭이 비어 보임

---

## 16. 현재 지원 기능

현재 SDK는 다음 기능을 지원합니다.

- 페이지뷰 수집
- 클릭 이벤트 수집
- 체류 시간 수집
- 세션 ID 유지
- 익명 사용자 ID 유지
- A/B 테스트 설정 조회
- sticky variant 배정
- forced variant 지원
- variant B DOM 변경 적용
- 실험 적용 이벤트 기록
- 의미 이벤트 추론
- batch 전송
- `sendBeacon` 기반 unload 시점 전송

---

## 17. 현재 구조에서 주의할 점

### 17.1 SDK 패키지명과 Dashboard tarball 확인 필요

현재 `UX_SDK` 원본 패키지명과 Dashboard에서 실제로 사용하는 SDK tarball 패키지명이 다를 수 있습니다.

- `UX_SDK` 원본 패키지: `@legend/ux-sdk`
- `Dashboard`에서 사용하는 패키지: `@enejwl/ux-sdk`

따라서 SDK 코드를 수정한 뒤에는 반드시 Dashboard에서 실제로 서빙되는 `/sdk.js`에도 변경사항이 반영되었는지 확인해야 합니다.

확인 예시:

```bash
curl http://localhost:3001/sdk.js | grep "MiniSDK"
```

또는 특정 수정 문자열을 검색합니다.

```bash
curl http://localhost:3001/sdk.js | grep "ab_config_applied"
```

---

### 17.2 SDK 수정 후 Dashboard 반영 절차 필요

SDK 원본 코드를 수정했다고 해서 Dashboard가 자동으로 최신 SDK를 사용하는 것은 아닙니다.

현재 구조에서는 다음 절차가 필요합니다.

```txt
UX_SDK 수정
  ↓
SDK tarball 생성
  ↓
Dashboard/vendor에 tarball 반영
  ↓
Dashboard package.json 의존성 확인
  ↓
npm install
  ↓
Dashboard 재배포
```

---

### 17.3 수집 API 보안 보강 필요

현재 SDK 이벤트 수집 API는 외부 웹사이트에서 호출되어야 하므로 공개 endpoint 성격을 가집니다.

운영 단계에서는 다음 보강이 필요합니다.

- `site_id` 검증
- Origin/Referer allowlist
- 등록된 도메인에서 온 이벤트인지 확인
- payload schema validation
- rate limit
- 비정상 이벤트 필터링
- 민감 정보 수집 방지

---

## 18. 앞으로 보완할 점

현재 SDK와 Dashboard 연동 구조에서 보완이 필요한 부분은 다음과 같습니다.

1. SDK 패키지명과 버전 정책 정리
   - `@legend/ux-sdk`와 `@enejwl/ux-sdk` 중 실제 운영 기준 패키지명을 하나로 통일

2. npm publish 여부 결정
   - 현재는 Dashboard 레포에 tarball을 포함하는 방식
   - 장기적으로는 npm registry에 publish하여 외부 프로젝트에서도 쉽게 설치 가능하도록 개선

3. SDK 배포 자동화
   - SDK 수정
   - tarball 생성
   - Dashboard vendor 갱신
   - Dashboard 배포까지 이어지는 절차 자동화

4. 수집 이벤트 schema 정리
   - 이벤트 타입별 필수 필드 정의
   - 잘못된 payload 필터링
   - 버전별 schema 관리

5. 개인정보 보호 정책 정리
   - 민감 정보 수집 방지
   - 텍스트 수집 범위 제한
   - 필요 시 `enableTextCapture` 같은 옵션 도입

6. 운영 환경 보안 보강
   - CORS allowlist
   - site/domain 검증
   - rate limit
   - dashboard 관리자 권한 관리

---

## 19. 관련 레포지토리

| 레포지토리 | 설명 |
|---|---|
| `Dashboard` | 운영자 대시보드, 이벤트 수집 서버, A/B 테스트, Agent Mode, Redis/Kafka 연동 |
| `UX_SDK` | 브라우저 SDK 원본 코드 |
| `Ecommerce` | SDK가 설치되는 예시 이커머스 서비스 |

---

## 20. 한 줄 요약

UX_SDK는 UX-Stream 프로젝트의 **브라우저 행동 데이터 수집 SDK 원본 레포지토리**입니다.

실제 이벤트 수집, 분석, 대시보드 운영, A/B 테스트 관리, Redis/Kafka 연동은 **Dashboard 레포지토리**를 기준으로 동작합니다.