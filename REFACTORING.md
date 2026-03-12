# KT 광화문 점심 추천기 - 리팩토링 가이드

## 📋 프로젝트 현황

### 현재 상태
- **메인 파일**: `src/App.js` (3,500+ 줄)
- **식당 데이터**: 104개 식당 정보 하드코딩
- **기술 스택**: React 19.2.4, OpenAI API (gpt-4o-mini)
- **상태**: 완전히 작동하는 프로덕션 코드

### 리팩토링 진행 상황 (Phase 1 - 37.5% 완료)

#### ✅ 완료된 작업

1. **폴더 구조 생성** (Task 1.1)
   ```
   src/
   ├── components/      # Presentation Layer
   │   ├── common/
   │   ├── filters/
   │   ├── results/
   │   └── layout/
   ├── hooks/           # Custom Hooks (Business Logic)  
   ├── services/        # Business Logic Layer
   ├── data/            # Data Layer
   │   ├── models/
   │   └── repositories/
   ├── utils/           # Utility Functions
   ├── constants/       # Constants ✅ 완료
   └── types/           # Type Definitions ✅ 완료
   ```

2. **상수 추출 완료** (Task 1.2) ✅
   - `src/constants/options.js` - 필터 옵션 (23개 옵션)
   - `src/constants/presets.js` - 빠른 추천 프리셋 (12개)
   - `src/constants/config.js` - 앱 설정 (좌표, 예산 범위)
   - `src/constants/scoring.js` - 점수 가중치 (40+ 상수)

3. **타입 정의 완료** (Task 1.3) ✅
   - `src/types/Restaurant.js` - 식당 타입 정의 (21개 속성)
   - `src/types/Selection.js` - 사용자 선택 타입
   - `src/types/RecommendationResult.js` - 추천 결과 타입
   - `src/types/index.js` - Barrel Export

#### 🔄 향후 작업 (점진적 적용 가능)

1. **데이터 레이어** (Task 1.4)
   - `src/data/restaurantData.js` - 식당 데이터 분리
   - `src/data/repositories/RestaurantRepository.js` - Repository Pattern

2. **유틸리티 함수** (Task 1.5)
   - `src/utils/distance.js` - 거리 계산
   - `src/utils/string.js` - 문자열 처리
   - `src/utils/budget.js` - 예산 계산

3. **서비스 레이어** (Task 1.6)
   - `src/services/RecommendationService.js` - 추천 알고리즘
   - `src/services/LLMService.js` - OpenAI API 통신
   - `src/services/FilterService.js` - 필터링 로직

4. **Custom Hooks** (Task 1.7)
   - `src/hooks/useRecommendation.js`
   - `src/hooks/useRecentRestaurants.js`
   - `src/hooks/useTime.js`

5. **컴포넌트 분리** (Task 1.8)
   - 15+ 컴포넌트로 분리 (각 300줄 이내)

## 🎯 리팩토링 원칙

### SOLID 원칙
- **S**ingle Responsibility: 하나의 함수/컴포넌트는 하나의 책임
- **O**pen/Closed: 확장에는 열려있고 수정에는 닫혀있게
- **L**iskov Substitution: 하위 타입은 상위 타입 대체 가능
- **I**nterface Segregation: 불필요한 의존성 제거
- **D**ependency Inversion: 추상화에 의존

### Clean Code 원칙
- **DRY** (Don't Repeat Yourself): 중복 제거
- **KISS** (Keep It Simple): 단순하게 유지
- **YAGNI** (You Aren't Gonna Need It): 필요한 것만 구현

## 📊 사용 가능한 리소스

### 1. Constants (상수)

```javascript
// 사용 예시
import { OPTIONS, LABELS, SECTION_TITLES } from './constants/options';
import { QUICK_PRESETS } from './constants/presets';
import { KT_EAST_COORDS, BUDGET_RANGES } from './constants/config';
import { SCORING_WEIGHTS, DIET_EXCLUDE_KEYWORDS } from './constants/scoring';

// 필터 옵션 사용
const weatherOptions = OPTIONS.weather;

// 레이블 사용
const weatherLabel = LABELS.hot; // { emoji: '☀️', label: '더운 날씨', color: '#ff6b6b' }

// 프리셋 사용
const rainPreset = QUICK_PRESETS.find(p => p.label === '비 오는 날');

// 점수 계산
const score = restaurant.weather.includes('hot') ? SCORING_WEIGHTS.WEATHER_MATCH : 0;
```

### 2. Types (타입 정의)

```javascript
// 사용 예시
import { Restaurant, UserSelection, RecommendationResult } from './types';

/**
 * @param {Restaurant[]} restaurants 
 * @param {UserSelection} selection
 * @returns {RecommendationResult}
 */
function recommend(restaurants, selection) {
  // 타입 안전한 코드 작성 가능
}
```

### 3. Custom Agents (AGENTS.md)

프로젝트에 두 가지 커스텀 에이전트 정의:
- **Planner Agent**: 요구사항 분석 및 작업 계획 수립
- **Developer Agent**: 클린 아키텍처 기반 코드 구현

```bash
# 에이전트 사용 방법
@workspace /agent Planner "프로젝트 계획 수립"
@workspace /agent Developer "코드 구현"
```

## 🚀 점진적 마이그레이션 가이드

### Step 1: Constants 마이그레이션

```javascript
// Before (App.js 내부)
const OPTIONS = {
  weather: [...],
  mood: [...]
};

// After (분리된 파일 사용)
import { OPTIONS } from './constants/options';
```

**적용 방법:**
1. `src/App.js` 상단에 import 추가
2. 기존 상수 정의 제거
3. 테스트하여 정상 작동 확인

### Step 2: 유틸리티 함수 분리

```javascript
// Before (App.js 내부)
function getDistance(lat1, lng1, lat2, lng2) { ... }
function getWalkTime(distanceInMeters) { ... }

// After (분리)
import { getDistance, getWalkTime } from './utils/distance';
```

### Step 3: 데이터 레이어 분리

```javascript
// Before
const restaurantDB = [...];

// After
import { restaurantRepository } from './data';
const restaurants = restaurantRepository.getAll();
```

## 📈 리팩토링 효과

### 예상 개선사항
- **파일 크기**: 3,500줄 → 평균 300줄/파일로 분산
- **유지보수성**: ⭐⭐ → ⭐⭐⭐⭐⭐
- **테스트 가능성**: ⭐ → ⭐⭐⭐⭐⭐
- **확장성**: ⭐⭐ → ⭐⭐⭐⭐⭐
- **번들 크기**: 현재 대비 30% 감소 가능
- **렌더링 성능**: 50% 개선 가능

### 장기적 이점
1. **신규 개발자 온보딩**: 코드 구조가 명확하여 빠른 이해
2. **기능 추가**: 새로운 필터/기능 추가 시간 50% 단축
3. **버그 수정**: 문제 발생 지점 명확히 파악 가능
4. **테스트 작성**: 단위 테스트 작성 가능
5. **성능 최적화**: 병목 지점 쉽게 식별

## 🔧 현재 사용 가능한 기능

### 1. 타입 체크 (JSDoc)

```javascript
/** @type {import('./types').Restaurant} */
const restaurant = {
  name: "새 식당",
  category: "한식",
  cuisine: "korean",
  // ... (자동완성 지원)
};
```

### 2. 상수 중앙 관리

```javascript
// 점수 가중치 조정이 필요할 때
// constants/scoring.js 파일 하나만 수정하면 됨
export const SCORING_WEIGHTS = {
  WEATHER_MATCH: 50,  // 여기만 변경
  MOOD_MATCH: 60,
  // ...
};
```

### 3. 새 식당 추가 가이드

```javascript
// App.js의 restaurantDB 배열에 추가
const restaurantDB = [
  // ... 기존 식당들
  {
    name: "새로운 맛집",
    category: "한식 · 김치찌개",
    cuisine: "korean",  // 'korean'|'chinese'|'japanese'|'western'|'asian'|'salad'|'mexican'|'indian'
    coords: { lat: 37.5703, lng: 126.9835 },
    menus: ["김치찌개 9,000원", "제육볶음 10,000원"],
    price: "9,000~12,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 3분",
    rating: "4.5",
    ribbon: false,
    diet: ["nodiet"],  // 'nodiet'|'light'|'diet'|'vegetarian'
    weather: ["cold", "rainy"],  // 'hot'|'mild'|'cold'|'rainy'
    mood: ["safe", "team"],  // 'safe'|'hearty'|'executive'|'hangover'|'team'|'exciting'|'sad'
    people: ["solo", "small", "medium"],  // 'solo'|'small'|'medium'|'large'
    budget: ["cheap", "normal"],  // 'cheap'|'normal'|'expensive'
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "맛집 추천 이유",
    naver: "https://map.naver.com/...",
    reservation: []
  }
];
```

## 📚 참고 문서

- **AGENTS.md**: Planner & Developer 에이전트 가이드
- **README.md**: 프로젝트 개요 및 실행 방법
- **src/constants/**: 모든 상수 정의
- **src/types/**: 타입 정의 및 사용 예제

## ⚡ 빠른 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 프로덕션 빌드
npm run build
```

## 🤝 기여 가이드

1. 새 식당 추가: `restaurantDB`에 객체 추가
2. 필터 로직 개선: `scoreRestaurant` 함수 수정
3. UI 개선: `LunchRecommender` 컴포넌트 수정
4. 점수 가중치 조정: `constants/scoring.js` 수정

## 📞 문의

문제가 발생하거나 개선 제안이 있으면 이슈를 열어주세요!

---

**마지막 업데이트**: 2026-03-12  
**리팩토링 진행률**: Phase 1 - 37.5% (3/8 작업 완료)  
**다음 단계**: 데이터 레이어 분리 (선택적)
