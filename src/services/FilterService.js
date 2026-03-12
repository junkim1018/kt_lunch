/**
 * FilterService
 * 
 * 식당 필터링 로직을 담당하는 서비스
 * 식단, 날씨, 기분, 인원, 예산 등의 조건에 따라 식당을 필터링
 */

import { BUDGET_COMPAT } from '../constants/config.js';

/**
 * @typedef {import('../types/Restaurant').Restaurant} Restaurant
 * @typedef {import('../types/Selection').UserSelection} UserSelection
 */

/**
 * 필터링 서비스
 */
export class FilterService {
  /**
   * cuisine 필터 적용 (HARD FILTER)
   * @param {Restaurant[]} restaurants
   * @param {string} cuisineSelection - 선택된 cuisine ('all', 'korean', 'chinese', etc. or 'other')
   * @returns {Restaurant[]}
   */
  filterByCuisine(restaurants, cuisineSelection) {
    if (!cuisineSelection || cuisineSelection === 'all') {
      return restaurants;
    }

    const mainCuisines = ['korean', 'chinese', 'japanese', 'western', 'asian'];

    if (cuisineSelection === 'other') {
      // '기타' 선택: salad, mexican, indian만 허용
      return restaurants.filter(r => !mainCuisines.includes(r.cuisine));
    } else {
      // 특정 카테고리 선택
      return restaurants.filter(r => r.cuisine === cuisineSelection);
    }
  }

  /**
   * 식단 필터 적용 (HARD FILTER)
   * @param {Restaurant[]} restaurants
   * @param {'vegetarian'|'diet'|'light'|'nodiet'} dietSelection
   * @returns {Restaurant[]}
   */
  filterByDiet(restaurants, dietSelection) {
    if (!dietSelection || dietSelection === 'nodiet') {
      return restaurants;
    }

    if (dietSelection === 'vegetarian') {
      // 채식: vegetarian 태그가 있는 식당만
      return restaurants.filter(r => 
        Array.isArray(r.diet) && r.diet.includes('vegetarian')
      );
    }

    if (dietSelection === 'diet') {
      // 다이어트: diet 또는 light 포함
      const filtered = restaurants.filter(r => 
        r.diet.includes('diet') || r.diet.includes('light')
      );

      // 다이어트 제외 카테고리
      const excludeKeywords = [
        '국밥', '국', '탕', '전골', '찌개', '뚝배기',
        '덮밥', '돈부리', '돌솥밥',
        '튀김', '치킨', '돈까스', '카츠', '텐동', '가라아게', '크리스피', '프라이',
        '분식', '떡볶이', '순대', '김밥',
        '라멘', '라면', '우동', '소바',
        '갈비', '구이', '석갈비', '삼겹살', '목살', '항정살',
        '피자', '파스타',
        '햄버거', '버거',
        '곰탕', '설렁탕', '육개장'
      ];

      return filtered.filter(r => {
        const category = r.category || '';
        return !excludeKeywords.some(keyword => category.includes(keyword));
      });
    }

    if (dietSelection === 'light') {
      // 가벼운 식사: light, diet, seafood 포함
      return restaurants.filter(r => 
        r.diet.includes('light') || 
        r.diet.includes('diet') || 
        r.diet.includes('seafood')
      );
    }

    return restaurants;
  }

  /**
   * 날씨 필터 적용 (SOFT FILTER - 점수에 반영)
   * @param {Restaurant} restaurant
   * @param {string} weatherSelection
   * @returns {number} 점수 조정값 (-15 ~ +50)
   */
  getWeatherScore(restaurant, weatherSelection) {
    if (!weatherSelection) return 0;
    
    if (restaurant.weather.includes(weatherSelection)) {
      return 50; // 날씨 매칭 보너스
    }
    return -15; // 날씨 불일치 감점
  }

  /**
   * 기분 필터 적용 (SOFT FILTER - 점수에 반영)
   * @param {Restaurant} restaurant
   * @param {string} moodSelection
   * @returns {number} 점수 조정값 (-20 ~ +60)
   */
  getMoodScore(restaurant, moodSelection) {
    if (!moodSelection) return 0;

    const restaurantMoods = new Set(restaurant.mood);

    // 식당 특성에 따라 추가 mood 부여
    if (restaurant.people.includes('large') || restaurant.people.includes('medium')) {
      restaurantMoods.add('team');
    }
    if (restaurant.category && (
      restaurant.category.includes('국밥') || 
      restaurant.category.includes('해장') || 
      restaurant.category.includes('탕') || 
      restaurant.category.includes('국')
    )) {
      restaurantMoods.add('hangover');
    }
    if (restaurant.ribbon || 
       (restaurant.budget.includes('expensive') && parseFloat(restaurant.rating) >= 4.3)) {
      restaurantMoods.add('executive');
    }

    if (restaurantMoods.has(moodSelection)) {
      return 60; // 기분 매칭 최고 보너스
    }
    return -20; // 기분 불일치 감점
  }

  /**
   * 인원 수 필터 적용 (SOFT FILTER - 점수에 반영)
   * @param {Restaurant} restaurant
   * @param {string} peopleSelection
   * @returns {number} 점수 조정값 (-10 ~ +35)
   */
  getPeopleScore(restaurant, peopleSelection) {
    if (!peopleSelection) return 0;

    if (restaurant.people.includes(peopleSelection)) {
      return 35; // 인원 매칭 보너스
    }
    return -10; // 인원 불일치 감점
  }

  /**
   * 예산 필터 적용 (SOFT FILTER - 점수에 반영)
   * @param {Restaurant} restaurant
   * @param {string} budgetSelection
   * @returns {number} 점수 조정값 (-30 ~ +40)
   */
  getBudgetScore(restaurant, budgetSelection) {
    if (!budgetSelection) return 0;

    const compatibleBudgets = BUDGET_COMPAT[budgetSelection] || [budgetSelection];
    const hasCompatibleBudget = restaurant.budget.some(b => 
      compatibleBudgets.includes(b)
    );

    if (hasCompatibleBudget) {
      return 40; // 예산 매칭 보너스
    }
    return -30; // 예산 불일치 강한 감점
  }

  /**
   * 평점 보너스 계산
   * @param {Restaurant} restaurant
   * @returns {number} 점수 조정값 (0 ~ +30)
   */
  getRatingBonus(restaurant) {
    const rating = parseFloat(restaurant.rating);
    if (rating >= 4.8) return 30;
    if (rating >= 4.5) return 20;
    if (rating >= 4.2) return 10;
    return 0;
  }

  /**
   * 특별 속성 보너스 계산
   * @param {Restaurant} restaurant
   * @returns {number} 점수 조정값 (0 ~ +50)
   */
  getSpecialBonus(restaurant) {
    let bonus = 0;
    
    if (restaurant.ribbon) bonus += 25; // 블루리본
    if (restaurant.hot) bonus += 15; // 핫플레이스
    if (restaurant.waiting) bonus += 10; // 웨이팅 맛집
    
    return bonus;
  }

  /**
   * 최근 방문 이력 페널티 계산
   * @param {Restaurant} restaurant
   * @param {string[]} recentNames - 최근 방문한 식당명 배열
   * @param {function} extractBrandFunc - 브랜드 추출 함수
   * @returns {number} 점수 조정값 (-200 ~ 0)
   */
  getRecentVisitPenalty(restaurant, recentNames, extractBrandFunc) {
    if (!recentNames || recentNames.length === 0) return 0;

    const brandName = extractBrandFunc(restaurant.name);
    const daysSinceVisit = recentNames.indexOf(restaurant.name);
    
    if (daysSinceVisit !== -1) {
      // 최근 방문 (인덱스 낮을수록 최근)
      const penalty = -200 + (daysSinceVisit * 20); // -200 ~ -20
      return penalty;
    }

    // 같은 브랜드 체크
    const brandIndex = recentNames.findIndex(name => 
      extractBrandFunc(name) === brandName
    );
    
    if (brandIndex !== -1) {
      return -50; // 같은 브랜드 감점
    }

    return 0;
  }

  /**
   * 거리 점수 계산
   * @param {number} distanceMeters - 거리 (미터)
   * @returns {number} 점수 조정값 (-20 ~ +10)
   */
  getDistanceScore(distanceMeters) {
    if (distanceMeters <= 200) return 10; // 초근거리
    if (distanceMeters <= 400) return 5;  // 가까움
    if (distanceMeters <= 600) return 0;  // 보통
    return -20; // 멀다
  }

  /**
   * 종합 필터링 및 점수 계산
   * @param {Restaurant[]} restaurants
   * @param {UserSelection} selection
   * @param {string[]} recentNames
   * @param {function} extractBrandFunc
   * @param {function} getDistanceFunc
   * @param {Object} baseCoords - {lat, lng}
   * @returns {Array<{restaurant: Restaurant, score: number}>}
   */
  filterAndScore(
    restaurants, 
    selection, 
    recentNames, 
    extractBrandFunc,
    getDistanceFunc,
    baseCoords
  ) {
    // 1. HARD FILTERS 적용
    let filtered = this.filterByCuisine(restaurants, selection.cuisine);
    filtered = this.filterByDiet(filtered, selection.diet);

    // 2. 점수 계산
    const scored = filtered.map(restaurant => {
      let score = 100; // 기본 점수

      // SOFT FILTERS
      score += this.getWeatherScore(restaurant, selection.weather);
      score += this.getMoodScore(restaurant, selection.mood);
      score += this.getPeopleScore(restaurant, selection.people);
      score += this.getBudgetScore(restaurant, selection.budget);

      // BONUS
      score += this.getRatingBonus(restaurant);
      score += this.getSpecialBonus(restaurant);

      // PENALTY
      score += this.getRecentVisitPenalty(restaurant, recentNames, extractBrandFunc);

      // 거리 점수
      if (getDistanceFunc && baseCoords) {
        const distance = getDistanceFunc(
          baseCoords.lat,
          baseCoords.lng,
          restaurant.coords.lat,
          restaurant.coords.lng
        );
        score += this.getDistanceScore(distance);
      }

      return { restaurant, score };
    });

    return scored;
  }
}

/**
 * 기본 FilterService 인스턴스
 */
export const filterService = new FilterService();
