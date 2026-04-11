# UX_SDK

이 프로젝트는 **설치형 브라우저 SDK 패키지**만 담당합니다.

## 구성

- `packages/browser-sdk`
  - npm publish 대상 브라우저 SDK
  - 패키지명: `@enejwl/ux-sdk`

dashboard, editor, 로그인, preview, metrics, insights 등 운영 콘솔은 별도 프로젝트인 `../Dashboard`로 분리되었습니다.

## SDK 패키지 pack

```bash
cd UX_SDK
npm install
npm run sdk:pack
```

예시 결과:

```bash
enejwl-ux-sdk-0.1.1.tgz
```

## 웹사이트에서 설치

### npm registry 배포 후

```bash
npm install @enejwl/ux-sdk
```

### 로컬 경로 설치

```bash
npm install ../UX_SDK/packages/browser-sdk
```

### tarball 설치

```bash
npm install ./enejwl-ux-sdk-0.1.1.tgz
```

## 사용 예시

```js
import { initUxSdk } from "@enejwl/ux-sdk";

initUxSdk({
  siteId: "legend-ecommerce",
  sdkBaseUrl: "http://localhost:3001"
});
```

## 일반 HTML 사이트 예시

```html
<script src="http://localhost:3001/sdk.js"></script>
<script>
  MiniSDK.create({
    siteId: "legend-ecommerce",
    appId: "legend-ecommerce",
    endpoint: "http://localhost:3001/collect",
    configEndpoint: "http://localhost:3001/api/config"
  }).install();
</script>
```

## publish

패키지 폴더:

```bash
cd UX_SDK\packages\browser-sdk
npm publish --access public
```

## 운영 콘솔

운영용 dashboard/editor/login 서버는 `Dashboard` 프로젝트에서 실행합니다.

자세한 내용은:

```txt
../Dashboard/README.md
```
