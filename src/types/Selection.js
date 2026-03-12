/**
 * @file User Selection Type Definitions
 * @description 사용자 선택 조건 타입 정의
 */

/**
 * 사용자 선택 조건
 * @typedef {Object} UserSelection
 * 
 * @property {WeatherType} weather - 선택한 날씨
 *   - 'hot': 더운 날 (여름철 시원한 메뉴)
 *   - 'cold': 추운 날 (겨울철 따뜻한 메뉴)
 *   - 'mild': 선선한 날 (봄/가을)
 *   - 'rainy': 비 오는 날 (전/파전 등)
 * 
 * @property {MoodType} mood - 선택한 기분/상황
 *   - 'safe': 안전한 선택 (실패없는 메뉴)
 *   - 'exciting': 특별한 날 (새로운 경험)
 *   - 'team': 팀 회식/점심
 *   - 'executive': 격식있는 자리
 *   - 'hangover': 숙취 해소
 *   - 'hearty': 든든한 식사
 *   - 'great': 기분 좋은 날
 *   - 'normal': 평범한 날
 *   - 'stressed': 스트레스 풀기
 *   - 'celebration': 축하/기념
 * 
 * @property {number} people - 인원 수 (1~20명)
 *   - 1명: solo
 *   - 2-4명: small
 *   - 5-8명: medium
 *   - 9명 이상: large
 * 
 * @property {DietType} diet - 식단 제한
 *   - 'nodiet': 제한 없음
 *   - 'vegetarian': 채식 (락토-오보)
 *   - 'vegan': 비건
 *   - 'diet': 다이어트 (저칼로리)
 *   - 'light': 가벼운 식사
 *   - 'seafood': 해산물 중심
 * 
 * @property {number} budget - 1인당 예산 (원)
 *   - ~10,000원: cheap
 *   - 10,000~20,000원: normal
 *   - 20,000원 이상: expensive
 * 
 * @example
 * // 기본 선택
 * {
 *   weather: 'hot',
 *   mood: 'safe',
 *   people: 2,
 *   diet: 'nodiet',
 *   budget: 15000
 * }
 * 
 * @example
 * // 특별한 날 점심
 * {
 *   weather: 'mild',
 *   mood: 'celebration',
 *   people: 4,
 *   diet: 'nodiet',
 *   budget: 30000
 * }
 * 
 * @example
 * // 다이어트 중 혼밥
 * {
 *   weather: 'hot',
 *   mood: 'safe',
 *   people: 1,
 *   diet: 'diet',
 *   budget: 12000
 * }
 */

/**
 * 날씨 타입
 * @typedef {'hot'|'cold'|'mild'|'rainy'} WeatherType
 */

/**
 * 기분/상황 타입
 * @typedef {'safe'|'exciting'|'team'|'executive'|'hangover'|'hearty'|'great'|'normal'|'stressed'|'celebration'} MoodType
 */

/**
 * 식단 타입
 * @typedef {'nodiet'|'vegetarian'|'vegan'|'diet'|'light'|'seafood'} DietType
 */

/**
 * 인원 카테고리를 숫자로 변환
 * @param {number} count - 인원 수
 * @returns {'solo'|'small'|'medium'|'large'} 인원 카테고리
 * 
 * @example
 * getPeopleCategory(1)  // => 'solo'
 * getPeopleCategory(3)  // => 'small'
 * getPeopleCategory(6)  // => 'medium'
 * getPeopleCategory(10) // => 'large'
 */
export function getPeopleCategory(count) {
  if (count === 1) return 'solo';
  if (count <= 4) return 'small';
  if (count <= 8) return 'medium';
  return 'large';
}

/**
 * 예산을 카테고리로 변환
 * @param {number} budget - 1인당 예산 (원)
 * @returns {'cheap'|'normal'|'expensive'} 예산 카테고리
 * 
 * @example
 * getBudgetCategory(8000)   // => 'cheap'
 * getBudgetCategory(15000)  // => 'normal'
 * getBudgetCategory(25000)  // => 'expensive'
 */
export function getBudgetCategory(budget) {
  if (budget <= 10000) return 'cheap';
  if (budget <= 20000) return 'normal';
  return 'expensive';
}

// Export for JSDoc
export {};
