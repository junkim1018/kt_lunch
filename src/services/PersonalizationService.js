/**
 * PersonalizationService
 * 
 * 사용자 방문 이력 관리 및 개인화 점수 계산
 * localStorage 기반 영구 저장
 */

const VISITS_KEY = 'kt-lunch-visits';

/**
 * 방문 이력 조회
 * @returns {Array} 방문 이력 배열
 */
export function getVisitHistory() {
  try {
    const history = localStorage.getItem(VISITS_KEY);
    if (!history) return [];
    const parsed = JSON.parse(history);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('방문 이력 로드 실패:', e);
    return [];
  }
}

/**
 * 방문 기록 저장
 * @param {string} restaurantName - 식당명
 * @param {string} category - 카테고리
 * @param {string} cuisine - 음식 종류
 * @returns {boolean} 저장 성공 여부
 */
export function saveVisit(restaurantName, category, cuisine) {
  try {
    const history = getVisitHistory();
    const newVisit = {
      restaurantName,
      category,
      cuisine,
      timestamp: new Date().toISOString()
    };
    
    history.push(newVisit);
    const trimmed = history.slice(-100);
    localStorage.setItem(VISITS_KEY, JSON.stringify(trimmed));
    return true;
  } catch (e) {
    console.error('방문 기록 실패:', e);
    return false;
  }
}

/**
 * 식당의 개인화 점수 계산 (방문 이력 기반)
 * @param {Object} restaurant - 식당 객체
 * @returns {number} 개인화 점수
 */
export function getPersonalizationScore(restaurant) {
  const history = getVisitHistory();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentHistory = history.filter(v => {
    const visitDate = new Date(v.timestamp);
    return visitDate > thirtyDaysAgo;
  });
  
  if (recentHistory.length === 0) return 0;
  
  let score = 0;
  
  // 자주 가는 카테고리 보너스
  const cuisineCounts = {};
  recentHistory.forEach(v => {
    cuisineCounts[v.cuisine] = (cuisineCounts[v.cuisine] || 0) + 1;
  });
  
  const mostVisitedCuisine = Object.keys(cuisineCounts).reduce((a, b) => 
    cuisineCounts[a] > cuisineCounts[b] ? a : b, ''
  );
  
  if (restaurant.cuisine === mostVisitedCuisine && cuisineCounts[mostVisitedCuisine] >= 3) {
    score += 5;
  }
  
  // 새로운 카테고리 보너스
  const visitedCuisines = new Set(recentHistory.map(v => v.cuisine));
  if (!visitedCuisines.has(restaurant.cuisine)) {
    score += 3;
  }
  
  // 최근 3일 내 방문 감점
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const veryRecentVisit = recentHistory.find(v => {
    const visitDate = new Date(v.timestamp);
    return v.restaurantName === restaurant.name && visitDate > threeDaysAgo;
  });
  
  if (veryRecentVisit) {
    score -= 15;
  }
  
  return score;
}
