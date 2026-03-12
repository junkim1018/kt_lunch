/**
 * @file Type Definitions Index
 * @description 모든 타입 정의를 중앙에서 관리하는 Barrel Export
 * 
 * 이 파일을 통해 프로젝트의 모든 타입을 한 곳에서 import 할 수 있습니다.
 * JSDoc typedef는 자동으로 전역에서 사용 가능하지만,
 * 명확성을 위해 각 파일의 타입을 여기서 re-export 합니다.
 */

// Restaurant Types
import './Restaurant.js';
// - Restaurant
// - Coordinates
// - CalorieInfo
// - ReservationLink
// - CuisineType
// - DietType
// - WeatherType
// - MoodType
// - PeopleType
// - BudgetType

// Selection Types
import './Selection.js';
export { getPeopleCategory, getBudgetCategory } from './Selection.js';
// - UserSelection
// - WeatherType
// - MoodType
// - DietType

// Recommendation Result Types
import './RecommendationResult.js';
// - RecommendedRestaurant
// - RecommendationResult
// - RecommendationConfig
// - MatchDetail

/**
 * 타입 사용 가이드
 * ===============
 * 
 * 이 프로젝트는 TypeScript 없이 JSDoc을 사용하여 타입 안정성을 확보합니다.
 * 
 * ## 기본 사용법
 * 
 * ```javascript
 * // 1. 함수 파라미터 타입 지정
 * /**
 *  * 식당 목록을 필터링합니다
 *  * @param {Restaurant[]} restaurants - 식당 배열
 *  * @param {UserSelection} selection - 사용자 선택 조건
 *  * @returns {Restaurant[]} 필터링된 식당 목록
 *  *\/
 * function filterRestaurants(restaurants, selection) {
 *   // ...
 * }
 * 
 * // 2. 변수 타입 지정
 * /** @type {Restaurant} *\/
 * const restaurant = {
 *   name: "파이프그라운드",
 *   category: "이탈리안",
 *   // ...
 * };
 * 
 * // 3. 반환 타입 지정
 * /**
 *  * @returns {RecommendationResult}
 *  *\/
 * function getRecommendations() {
 *   return {
 *     list: [...],
 *     relaxedMsg: null
 *   };
 * }
 * 
 * // 4. 컴포넌트 Props 타입 지정
 * /**
 *  * @param {{
 *  *   restaurant: Restaurant,
 *  *   onSelect: (restaurant: Restaurant) => void
 *  * }} props
 *  *\/
 * function RestaurantCard({ restaurant, onSelect }) {
 *   // ...
 * }
 * ```
 * 
 * ## VS Code에서 자동완성 활용
 * 
 * ```javascript
 * // 1. 타입 힌트 받기
 * /** @type {Restaurant} *\/
 * const r = {}; // <- 속성 자동완성 제공
 * 
 * // 2. 파라미터 타입 체크
 * /**
 *  * @param {Restaurant} restaurant
 *  *\/
 * function calculate(restaurant) {
 *   // restaurant. 입력 시 자동완성
 *   const price = restaurant.price; // ✅ 타입 체크
 * }
 * 
 * // 3. 타입 가드
 * /**
 *  * @param {any} obj
 *  * @returns {obj is Restaurant}
 *  *\/
 * function isRestaurant(obj) {
 *   return obj && typeof obj.name === 'string';
 * }
 * ```
 * 
 * ## 유틸리티 함수 사용
 * 
 * ```javascript
 * import { getPeopleCategory, getBudgetCategory } from './types';
 * 
 * const peopleType = getPeopleCategory(3);      // => 'small'
 * const budgetType = getBudgetCategory(15000);  // => 'normal'
 * ```
 * 
 * ## React 컴포넌트에서 사용
 * 
 * ```javascript
 * import React from 'react';
 * 
 * /**
 *  * 식당 카드 컴포넌트
 *  * @param {{
 *  *   restaurant: Restaurant,
 *  *   selected: boolean,
 *  *   onSelect: (restaurant: Restaurant) => void,
 *  *   onBookmark?: (name: string) => void
 *  * }} props
 *  *\/
 * function RestaurantCard({ restaurant, selected, onSelect, onBookmark }) {
 *   return (
 *     <div onClick={() => onSelect(restaurant)}>
 *       <h3>{restaurant.name}</h3>
 *       <p>{restaurant.category}</p>
 *     </div>
 *   );
 * }
 * 
 * export default RestaurantCard;
 * ```
 * 
 * ## Custom Hook에서 사용
 * 
 * ```javascript
 * /**
 *  * 식당 추천 Hook
 *  * @param {UserSelection} selection - 사용자 선택
 *  * @returns {{
 *  *   result: RecommendationResult,
 *  *   loading: boolean,
 *  *   error: Error | null,
 *  *   refresh: () => void
 *  * }}
 *  *\/
 * function useRecommendation(selection) {
 *   const [result, setResult] = useState({ list: [], relaxedMsg: null });
 *   const [loading, setLoading] = useState(false);
 *   
 *   // ...
 *   
 *   return { result, loading, error, refresh };
 * }
 * ```
 * 
 * ## Service Layer에서 사용
 * 
 * ```javascript
 * /**
 *  * 추천 서비스
 *  *\/
 * class RecommendationService {
 *   /**
 *    * @param {Restaurant[]} restaurants
 *    * @param {UserSelection} selection
 *    * @returns {RecommendationResult}
 *    *\/
 *   recommend(restaurants, selection) {
 *     // ...
 *     return {
 *       list: scored,
 *       relaxedMsg: null
 *     };
 *   }
 * }
 * ```
 * 
 * ## 주의사항
 * 
 * 1. **타입 체크 활성화**
 *    - VS Code 설정에서 JavaScript 타입 체크 활성화
 *    - `// @ts-check` 주석 사용
 * 
 * 2. **타입 안정성**
 *    - Optional 속성은 `[property]` 또는 `property?`로 표시
 *    - Union 타입은 `'type1'|'type2'` 형식 사용
 * 
 * 3. **문서화**
 *    - 모든 public 함수/컴포넌트에 JSDoc 작성
 *    - 복잡한 타입은 별도 typedef로 정의
 * 
 * 4. **성능**
 *    - JSDoc은 런타임 오버헤드가 없음
 *    - 빌드 후에도 일반 JavaScript로 변환
 */

// Named exports for utility functions
export { getPeopleCategory, getBudgetCategory };

// All typedefs are automatically available globally through JSDoc
// No need to explicitly export types in JavaScript with JSDoc
