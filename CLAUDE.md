# 소방 계통도 훈련판 개발 안내

소방 관련 학과 수업용 앱입니다. 사용자는 소방 담당 교수이며 개발자가 아닙니다. 설명은 한국어로, 쉬운 말로 합니다.

## 구조

- `src/data/`: 설비별 부품, 배관, 시나리오 데이터. `types.ts`가 형식 기준입니다.
- `src/engine/engine.ts`: 문제 생성과 채점. 화면 코드를 쓰지 않는 순수 함수입니다.
- `src/ui/app.ts`: SVG 도면 렌더링과 입력 처리. 상태 객체 `S`를 바꾸고 `render()`로 전체를 다시 그립니다.
- `src/ui/photoStore.ts`: 교수 모드 사진의 기기 내 저장(IndexedDB).
- `src/data/photos.ts`: 앱에 포함해 배포할 사진 목록.

## 작업 규칙

- 변경 후 `npm run typecheck`, `npm test`, `npm run build`를 통과시킵니다.
- 시나리오의 `e`는 `from>to` 형식의 연결 id와 정확히 맞아야 합니다. `tests/data.test.ts`가 검사합니다.
- 같은 문제 번호가 같은 문제를 만들어야 합니다. 난수는 `problemRand`만 씁니다.
- 부품 수치와 기준 문구는 근거를 확인하고 바꿉니다. 현행 NFTC를 우선합니다.
- 옥내소화전 도면은 교수가 준 참고 계통도의 배치를 따릅니다.
- 색은 `src/style.css`의 토큰으로만 지정하고 라이트·다크 테마를 함께 확인합니다.
- 인터넷 없이 동작해야 합니다. 외부 서버에 의존하는 기능은 없어도 앱이 돌아가게 만듭니다.

## 알려진 과제

- `src/ui/app.ts`는 한 파일 HTML에서 옮긴 코드라 타입이 느슨합니다(`any`, tsconfig의 `noImplicitAny: false`).
- 실물 사진이 아직 없습니다. `src/data/photos.ts`가 비어 있습니다.
- 교수 모드는 비밀번호가 없고, 기기 간 사진 공유와 학생 점수 저장을 위한 서버가 없습니다.
- 가스계소화설비는 아직 없습니다.
- Android 프로젝트는 `npx cap add android` 생성까지만 확인했고 APK 빌드는 시험하지 않았습니다.
- 옥내소화전 참고 도면의 "25m 이상" 표기는 교수 확인이 필요합니다.

## 배포

GitHub Pages로 배포합니다. `main`에 소스를 두고, 빌드 결과는 `gh-pages` 브랜치에 올립니다. 주소는 https://skh9991.github.io/fire-system/ 입니다.
수정 후 `npm run build`로 만든 `dist` 내용과 `.nojekyll` 파일을 `gh-pages` 브랜치에 푸시합니다.
