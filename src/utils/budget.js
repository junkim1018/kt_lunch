/**
 * 예산 관련 유틸리티
 */

/**
 * 문자열을 예산 카테고리로 변환
 * @param {string} budgetStr - 예산 문자열 ('LOW', 'MEDIUM', 'HIGH', '~15000', '15000~25000' 등)
 * @returns {'LOW'|'MEDIUM'|'HIGH'|null} 예산 카테고리
 */
export function parseBudgetCategory(budgetStr) {
  if (!budgetStr) return null;
  
  // 이미 카테고리 형식인 경우
  if (['LOW', 'MEDIUM', 'HIGH'].includes(budgetStr)) {
    return budgetStr;
  }
  
  // 숫자 범위에서 카테고리 추론
  const match = budgetStr.match(/(\d+)/g);
  if (!match) return null;
  
  const price = parseInt(match[0]);
  if (price < 15000) return 'LOW';
  if (price < 25000) return 'MEDIUM';
  return 'HIGH';
}

/**
 * 식당 가격이 예산 범위에 맞는지 확인
 * @param {string} restaurantPrice - 식당 가격 문자열 (예: "12,000원", "10,000~15,000원")
 * @param {'LOW'|'MEDIUM'|'HIGH'} budgetCategory - 사용자 예산 카테고리
 * @returns {boolean} 예산 범위 내 여부
 */
export function matchBudget(restaurantPrice, budgetCategory) {
  if (!restaurantPrice || !budgetCategory) return true;
  
  // 가격 추출
  const priceMatch = restaurantPrice.match(/\d+(,\d+)*/g);
  if (!priceMatch) return true;
  
  // 평균 가격 계산 (범위인 경우)
  const prices = priceMatch.map(p => parseInt(p.replace(/,/g, '')));
  const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
  
  // 예산 범위
  const ranges = {
    LOW: [0, 15000],
    MEDIUM: [10000, 25000],
    HIGH: [20000, 100000]
  };
  
  const [min, max] = ranges[budgetCategory];
  return avgPrice >= min && avgPrice <= max;
}

/**
 * 예산 카테고리를 한글로 변환
 * @param {'LOW'|'MEDIUM'|'HIGH'} category - 예산 카테고리
 * @returns {string} 한글 예산 이름
 */
export function getBudgetLabel(category) {
  const labels = {
    LOW: '가성비 (~15,000원)',
    MEDIUM: '적당한 (~25,000원)',
    HIGH: '특별한 날 (25,000원~)'
  };
  return labels[category] || category;
}

/**
 * 예산 카테고리 호환성 체크
 * @param {'LOW'|'MEDIUM'|'HIGH'} userBudget - 사용자 예산
 * @param {'LOW'|'MEDIUM'|'HIGH'} restaurantBudget - 식당 예산 카테고리
 * @returns {boolean} 호환 여부
 */
export function isBudgetCompatible(userBudget, restaurantBudget) {
  // 호환 매트릭스
  const compatibility = {
    LOW: ['LOW'],
    MEDIUM: ['LOW', 'MEDIUM'],
    HIGH: ['LOW', 'MEDIUM', 'HIGH']
  };
  
  return compatibility[userBudget]?.includes(restaurantBudget) ?? true;
}

/**
 * 가격 문자열에서 최소/최대 가격 추출
 * @param {string} priceStr - 가격 문자열
 * @returns {{min: number, max: number}} 최소/최대 가격
 */
export function extractPriceRange(priceStr) {
  if (!priceStr) return { min: 0, max: Infinity };
  
  const prices = priceStr
    .match(/\d+(,\d+)*/g)
    ?.map(p => parseInt(p.replace(/,/g, ''))) || [];
  
  if (prices.length === 0) return { min: 0, max: Infinity };
  if (prices.length === 1) return { min: prices[0], max: prices[0] };
  
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}
