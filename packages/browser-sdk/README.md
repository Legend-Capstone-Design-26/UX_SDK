# @enejwl/ux-sdk

설치형 브라우저 SDK 패키지입니다.

## 설치

현재 이 패키지 이름은 **`@enejwl/ux-sdk`** 이며, 로컬 패키지 구조와 tarball 생성까지 완료된 상태입니다.

공개 배포가 완료되기 전까지는 아래 명령이 바로 동작하지 않을 수 있습니다.

```bash
npm install @enejwl/ux-sdk
```

지금은 아래 방식으로 설치할 수 있습니다.

```bash
npm install ../UX_SDK/packages/browser-sdk
```

또는

```bash
npm pack ./packages/browser-sdk
npm install ./enejwl-ux-sdk-0.1.1.tgz
```

## 사용

```js
import UXSDK from "@enejwl/ux-sdk";

UXSDK.initUxSdk({
  siteId: "legend-ecommerce",
  sdkBaseUrl: "http://localhost:3001"
});
```

또는

```js
import { initUxSdk } from "@enejwl/ux-sdk";

initUxSdk({
  siteId: "legend-ecommerce",
  sdkBaseUrl: "http://localhost:3001"
});
```

dashboard/editor는 이 패키지에 포함되지 않으며 별도 대시보드 서비스에서 호스팅됩니다.

대시보드 서비스 실행 예시:

```bash
cd UX_SDK
npm install
npm run dev
```

접속 예시:

- Dashboard: `http://localhost:3001/dashboard?site_id=legend-ecommerce`
- Editor: `http://localhost:3001/editor?site_id=legend-ecommerce`

브라우저 `<script>` 방식으로 사용할 때 전역 이름은 `MiniSDK`입니다.
