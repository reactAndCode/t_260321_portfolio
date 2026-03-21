# Studio By Code Portfolio

정적 `HTML/CSS/JS` 기반의 GitHub Pages용 개발자 포트폴리오 사이트입니다.

## Structure

- `index.html`: 홈
- `projects/`: 프로젝트 페이지
- `services/`: 서비스 페이지
- `about/`: 소개 페이지
- `contact/`: 문의 페이지
- `assets/css/styles.css`: 공통 스타일
- `assets/js/site-data.js`: 한/영 콘텐츠 데이터
- `assets/js/app.js`: 공통 렌더러와 인터랙션
- `404.html`: GitHub Pages용 에러 페이지

## Customize

1. `assets/js/site-data.js`에서 이름, 소개, 프로젝트, 서비스, 링크를 실제 내용으로 교체합니다.
2. `hello@studiobycode.dev`, `https://github.com/yourname`를 실제 연락처로 바꿉니다.
3. 필요하면 `assets/og-cover.svg`를 실제 Open Graph 이미지로 교체합니다.

## Deploy To GitHub Pages

1. 저장소에 파일을 push 합니다.
2. GitHub 저장소의 `Settings > Pages`로 이동합니다.
3. `Deploy from a branch`를 선택합니다.
4. 브랜치는 `main`, 폴더는 `/ (root)`를 선택합니다.

사용자 페이지(`username.github.io`)와 프로젝트 페이지 모두 동작하도록 상대 경로 기반으로 구성했습니다.
