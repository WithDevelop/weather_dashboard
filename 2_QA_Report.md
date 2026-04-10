# Weather Dashboard QA & Refactoring Report

## 1. 개요
수석 QA 엔지니어로서 `weather_dashboard` 프로젝트(`index.html`, `app.js`)의 코드 안정성, 브라우저 호환성, 예외 상황(Edge Case) 처리 상태를 점검하고, 발견된 문제점을 리팩토링하여 안정성을 강화했습니다.

## 2. 주요 발견 사항 및 문제점 (Issues Found)

1. **API 예외 처리(Error Handling) 부재**
   - `fetch(API_URL)` 호출 시 네트워크 에러는 `catch` 블록으로 넘어가지만, 4xx, 5xx와 같은 HTTP 상태 에러는 `response.ok`를 체크하지 않아 정상 데이터로 간주되어 파싱을 시도하다 런타임 에러(`response.json()`)를 유발할 수 있었습니다.
   - API 응답 실패 시 사용자에게 직관적으로 에러를 알려주는 UI가 존재하지 않았으며, 콘솔 에러와 함께 화면에 'Error loading data'만 작게 표시되고 나머지 UI 영역은 더미 데이터(`--°`)를 그대로 노출하는 문제가 있었습니다.

2. **데이터 결측치(Edge Case) 대비 미흡**
   - API 응답 구조에서 `current`, `daily` 객체가 누락되거나, 배열 길이에 부족함이 있을 경우(예: `temperature_2m_max[i]`, `apparent_temperature`가 `undefined`로 반환될 때) 그대로 화면에 `undefined`나 `NaN`이 렌더링되거나 스크립트가 중단되는 문제가 있었습니다.

3. **로딩 및 재시도 UX 부재**
   - 초기 데이터 로딩 시와 실패 시 일시적인 문제에 대응하기 위해 데이터를 다시 불러올 수 있는 "재시도(Retry)" 기능이 없었습니다.

## 3. 리팩토링 및 수정 사항 (Refactoring Details)

1. **에러 전용 UI(Error State) 추가 (`index.html`)**
   - `index.html` 내부에 `id="error-state"`인 에러 배너(경고 아이콘, 에러 메시지, Retry 버튼 포함)를 추가하였습니다.
   - 정상적인 날씨 뷰 영역을 묶어 (`id="weather-content"`, `id="forecast-content"`) 오류 발생 시 메인 콘텐츠를 숨기고 에러 배너만 노출하도록 마크업을 개선했습니다.

2. **HTTP 에러 핸들링 및 검증 로직 강화 (`app.js`)**
   - `fetchWeather()` 함수 내부에 `!response.ok` 조건을 추가하여 HTTP 실패 시 명시적으로 에러를 Throw 하도록 수정했습니다.
   - 응답 데이터에 `current`, `daily` 객체가 포함되어 있는지 확인하는 최소한의 유효성 검증(Validation)을 추가했습니다.

3. **결측치 데이터 안전 처리 (Safe Fallback)**
   - 체감 온도, 습도, 강수 확률 등 주요 지표 렌더링 시 값이 `undefined`일 경우 `--` 로 표기되도록 삼항 연산자를 이용한 Fallback 처리를 적용했습니다.
   - 7일간의 예보(Forecast) 루프 처리 시 API가 반환한 배열의 실제 길이를 체크하여 7일치 미만의 데이터가 들어오더라도 오류 없이 렌더링되도록 방어 코드를 작성했습니다.
   - 오늘 날짜(`todayStr`) 파싱 시에도 방어 코드를 추가했습니다.

4. **로딩 상태 초기화 개선**
   - 데이터를 호출하기 전마다 UI의 가시성(Hidden 클래스)을 리셋하고, "Loading..." 상태 메시지로 초기화하여 네트워크 지연 시 사용자 경험을 향상시켰습니다.

## 4. 테스트 결과 (Test Results)
- **정상 응답 테스트:** 메인 화면, 아이콘, 7일 예보가 정상적으로 렌더링되며 레이아웃 깨짐 현상 없음.
- **API 지연/로딩 테스트:** 데이터가 로딩되는 짧은 순간 동안 기존 화면을 깔끔하게 유지.
- **API 실패(404/500 등) 테스트:** 기존 뷰가 숨김 처리되고, 중앙에 "Failed to load weather data" 문구와 [Retry] 버튼이 정상적으로 나타남.
- **Retry 기능 테스트:** 버튼 클릭 시 `fetchWeather()`가 다시 호출되며, 성공 시 정상 화면으로 복구됨.

## 5. 결론
이번 QA 및 리팩토링을 통해 기상청 API 장애나 비정상적인 데이터 응답 시에도 페이지가 깨지지 않고 우아하게 실패(Graceful Degradation)를 처리할 수 있게 되었습니다. 안정성(Robustness)과 사용자 경험(UX)이 모두 향상되었습니다.
