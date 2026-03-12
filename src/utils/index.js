/**
 * 유틸리티 함수 모음
 * 
 * 이 모듈은 프로젝트 전반에서 사용되는 순수 함수들을 제공합니다.
 * 모든 함수는 부수 효과가 없으며 테스트 가능합니다.
 */

// 거리 및 시간 계산
export {
  getDistance,
  getWalkTime,
  formatDistance,
  formatWalkTime
} from './distance.js';

// 문자열 처리
export {
  extractBrand,
  extractPrice,
  parsePriceRange,
  formatCurrency,
  truncate,
  joinItems
} from './string.js';

// 예산 관련
export {
  parseBudgetCategory,
  matchBudget,
  getBudgetLabel,
  isBudgetCompatible,
  extractPriceRange
} from './budget.js';

// 배열 및 객체 조작
export {
  shuffle,
  uniqueBy,
  groupBy,
  sampleSize,
  chunk,
  sortBy
} from './array.js';
