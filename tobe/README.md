# Mable 퍼블리싱 가이드 (tobe)

정적 HTML/SCSS로 화면을 퍼블리싱하고, Vite로 미리보고, `npm run build`로 정적 산출물(`dist/`)을 뽑는 프로젝트입니다.

## 실행

```bash
npm install       # 최초 1회
npm run dev       # 개발 서버 (http://localhost:3000, 자동 오픈)
npm run build     # dist/ 에 정적 HTML/CSS 빌드
```

`.html` 파일을 브라우저에서 직접 더블클릭해서 열면 안 됩니다. `.scss` 링크와 `../` 상대경로는
Vite 개발 서버가 요청 시점에 변환해주기 때문에, 반드시 `npm run dev` 후 `localhost:3000`으로
접속해야 스타일이 정상적으로 적용됩니다.

- `npm run dev` 실행 시 `/` 접속하면 `src/index.html`(리스트 페이지)이 열립니다.
- 개별 화면은 `/pages/...`, 컴포넌트 스타일 가이드는 `/guide/guide.html` 로 바로 접근할 수 있습니다.

## 폴더 구조

```
tobe/
├─ vite.config.js      # 개발 서버 설정 (include 치환, scss 처리, 라우팅)
├─ build.js             # npm run build 스크립트 (dist/ 생성)
└─ src/
   ├─ index.html        # 전체 화면 리스트
   ├─ pages/             # 실제 화면 (예: missionGuide.html)
   ├─ guide/guide.html   # 컴포넌트 스타일 가이드 (Forms / Layout 탭)
   ├─ components/        # 재사용 컴포넌트의 마크업 예시 + props 문서
   ├─ styles/
   │  ├─ abstracts/      # 변수, mixin, function (figmaRem 등)
   │  ├─ base/            # reset, 폰트, 레이아웃
   │  ├─ components/      # 컴포넌트별 scss (_button, _input, _note, ...)
   │  └─ pages/            # 페이지 전용 scss (그 페이지에서만 쓰는 클래스)
   └─ assets/             # css(컴파일 산출물)/js/font/images
```

## 컴포넌트 경계 표기 규칙

실제 화면(`pages/*.html`)과 컴포넌트 예시(`components/*.html`)에는 아래 형식의 주석으로
React 컴포넌트 경계를 표기합니다. 개발 단계에서 이 주석을 기준으로 컴포넌트를 나누면 됩니다.

```html
<!-- @@컴포넌트명: props(key="value") -->
...마크업...
<!-- //@@컴포넌트명: props(key="value") -->
```

- 중첩 컴포넌트는 부모 안쪽에 같은 방식으로 표기합니다.
- `props(...)`는 "그 케이스에서 실제로 넘긴 값"이며, 적히지 않은 props는 기본값으로 동작합니다.
- 컴포넌트가 아닌 유틸 클래스(`.contTxt`, `.subTxt`, `.fcRed` 등)는 마커 없이 그냥 씁니다.

같은 모양이 다른 화면에서도 재사용되면, 마크업 예시는 `src/components/`, 스타일은
`src/styles/components/`로 옮기고 `globals.scss`/`globalsPub.scss`에 등록합니다. 특정
페이지에서만 쓰는 문구가 박힌 블록(예: 이 미션 페이지의 보상 안내 문구)은 `src/styles/pages/`에
그대로 둡니다.

## HTML Include

`vite.config.js`의 `html-include` 플러그인과 `build.js`가 아래 태그를 재귀적으로 치환합니다
(HTML 주석 안에 있는 것은 그대로 통과합니다).

```html
<include src="./src/components/note.html"></include>
```

`guide/guide.html`이 이 방식으로 `components/*.html`을 가져와 스타일 가이드를 구성합니다.

## Figma px → rem

`src/styles/abstracts/_function.scss`의 `figmaRem($px, $base: 16)`으로 Figma 시안의 px 값을
rem으로 변환합니다 (`abstracts`가 전역에 forward되어 있어 별도 `@use` 없이 바로 사용 가능).

```scss
.pageTit {
  font-size: figmaRem(20); // 20px 시안값 → 1.25rem
}
```

실제 화면에서는 `base/_base.scss`의 반응형 `html` font-size(뷰포트별 14~18px)에 따라
rem 기준값이 함께 스케일됩니다.

## Sass만 컴파일하고 싶을 때

```bash
npm run sass:watch   # 저장할 때마다 globals.css / globalsPub.css 갱신
npm run sass:build   # 1회 컴파일
```
