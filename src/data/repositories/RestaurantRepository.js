/**
 * Restaurant Repository
 * 
 * 식당 데이터에 대한 모든 쿼리 로직을 담당하는 레포지토리 패턴 구현
 * 데이터 소스와 비즈니스 로직을 분리하여 확장 가능하고 테스트 가능한 구조 제공
 */

import { restaurantDB } from '../restaurantData.js';

/**
 * @typedef {import('../../types/Restaurant').Restaurant} Restaurant
 * @typedef {import('../../types/Restaurant').Coordinates} Coordinates
 */

/**
 * 식당 데이터 저장소
 */
export class RestaurantRepository {
  /**
   * @param {Restaurant[]} [dataSource=restaurantDB] - 데이터 소스
   */
  constructor(dataSource = restaurantDB) {
    this.restaurants = dataSource;
  }

  // ────────────────────────────────────────────────────────────────────
  // 기본 CRUD 메서드
  // ────────────────────────────────────────────────────────────────────

  /**
   * 모든 식당 가져오기
   * @returns {Restaurant[]}
   */
  getAll() {
    return [...this.restaurants];
  }

  /**
   * ID로 식당 찾기
   * @param {string} name - 식당명 (현재는 name이 ID 역할)
   * @returns {Restaurant | undefined}
   */
  getByName(name) {
    return this.restaurants.find(r => r.name === name);
  }

  /**
   * 총 식당 개수
   * @returns {number}
   */
  count() {
    return this.restaurants.length;
  }

  // ────────────────────────────────────────────────────────────────────
  // 필터링 메서드
  // ────────────────────────────────────────────────────────────────────

  /**
   * 카테고리로 필터링
   * @param {string} category - 카테고리 (예: '한식', '일식', '중식' 등)
   * @returns {Restaurant[]}
   */
  findByCategory(category) {
    if (!category) return this.getAll();
    return this.restaurants.filter(r => 
      r.category.includes(category)
    );
  }

  /**
   * 요리 유형으로 필터링
   * @param {'korean'|'western'|'chinese'|'japanese'|'asian'|'salad'|'mexican'|'indian'} cuisine
   * @returns {Restaurant[]}
   */
  findByCuisine(cuisine) {
    if (!cuisine) return this.getAll();
    return this.restaurants.filter(r => r.cuisine === cuisine);
  }

  /**
   * 식단 유형으로 필터링
   * @param {'vegetarian'|'diet'|'light'|'nodiet'} dietType
   * @returns {Restaurant[]}
   */
  findByDiet(dietType) {
    if (!dietType) return this.getAll();
    return this.restaurants.filter(r => 
      r.diet?.includes(dietType)
    );
  }

  /**
   * 날씨 조건으로 필터링
   * @param {'hot'|'mild'|'cold'|'rainy'} weather
   * @returns {Restaurant[]}
   */
  findByWeather(weather) {
    if (!weather) return this.getAll();
    return this.restaurants.filter(r => 
      r.weather?.includes(weather)
    );
  }

  /**
   * 기분/상황으로 필터링
   * @param {'great'|'stressed'|'tired'|'normal'|'hangover'|'exciting'|'safe'|'hearty'|'team'|'executive'|'sad'} mood
   * @returns {Restaurant[]}
   */
  findByMood(mood) {
    if (!mood) return this.getAll();
    return this.restaurants.filter(r => 
      r.mood?.includes(mood)
    );
  }

  /**
   * 인원 수로 필터링
   * @param {'solo'|'small'|'medium'|'large'} peopleCategory
   * @returns {Restaurant[]}
   */
  findByPeople(peopleCategory) {
    if (!peopleCategory) return this.getAll();
    return this.restaurants.filter(r => 
      r.people?.includes(peopleCategory)
    );
  }

  /**
   * 예산으로 필터링
   * @param {'cheap'|'normal'|'expensive'} budgetCategory
   * @returns {Restaurant[]}
   */
  findByBudget(budgetCategory) {
    if (!budgetCategory) return this.getAll();
    return this.restaurants.filter(r => 
      r.budget?.includes(budgetCategory)
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // 특수 필터 메서드
  // ────────────────────────────────────────────────────────────────────

  /**
   * 블루리본 레스토랑만 필터링
   * @returns {Restaurant[]}
   */
  getBlueRibbonRestaurants() {
    return this.restaurants.filter(r => r.ribbon === true);
  }

  /**
   * 웨이팅이 있는 레스토랑 필터링
   * @returns {Restaurant[]}
   */
  getWaitingRestaurants() {
    return this.restaurants.filter(r => r.waiting === true);
  }

  /**
   * 평점 이상으로 필터링
   * @param {number} minRating - 최소 평점 (예: 4.5)
   * @returns {Restaurant[]}
   */
  findByMinRating(minRating) {
    return this.restaurants.filter(r => 
      parseFloat(r.rating) >= minRating
    );
  }

  /**
   * 칼로리 레벨로 필터링
   * @param {'저칼로리'|'보통칼로리'|'고칼로리'} calorieLabel
   * @returns {Restaurant[]}
   */
  findByCalorie(calorieLabel) {
    if (!calorieLabel) return this.getAll();
    return this.restaurants.filter(r => 
      r.calorie?.label === calorieLabel
    );
  }

  /**
   * 예약 가능한 레스토랑 필터링
   * @returns {Restaurant[]}
   */
  getReservableRestaurants() {
    return this.restaurants.filter(r => 
      r.reservation && 
      Array.isArray(r.reservation) && 
      r.reservation.length > 0
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // 거리 기반 쿼리
  // ────────────────────────────────────────────────────────────────────

  /**
   * 특정 좌표로부터 일정 거리 내 식당 찾기
   * @param {Coordinates} coords - 기준 좌표
   * @param {number} maxDistanceMeters - 최대 거리 (미터)
   * @param {function} getDistanceFunc - 거리 계산 함수
   * @returns {Restaurant[]}
   */
  findWithinDistance(coords, maxDistanceMeters, getDistanceFunc) {
    return this.restaurants.filter(r => {
      const distance = getDistanceFunc(
        coords.lat, 
        coords.lng, 
        r.coords.lat, 
        r.coords.lng
      );
      return distance <= maxDistanceMeters;
    });
  }

  /**
   * 도보 시간 이내 식당 찾기
   * @param {Coordinates} coords - 기준 좌표
   * @param {number} maxWalkMinutes - 최대 도보 시간 (분)
   * @param {function} getDistanceFunc - 거리 계산 함수
   * @param {function} getWalkTimeFunc - 도보 시간 계산 함수
   * @returns {Restaurant[]}
   */
  findByWalkTime(coords, maxWalkMinutes, getDistanceFunc, getWalkTimeFunc) {
    return this.restaurants.filter(r => {
      const distance = getDistanceFunc(
        coords.lat, 
        coords.lng, 
        r.coords.lat, 
        r.coords.lng
      );
      const walkTime = getWalkTimeFunc(distance);
      return walkTime <= maxWalkMinutes;
    });
  }

  // ────────────────────────────────────────────────────────────────────
  // 검색 메서드
  // ────────────────────────────────────────────────────────────────────

  /**
   * 키워드로 검색 (이름, 카테고리, 메뉴 포함)
   * @param {string} keyword - 검색 키워드
   * @returns {Restaurant[]}
   */
  search(keyword) {
    if (!keyword) return this.getAll();
    
    const lowerKeyword = keyword.toLowerCase();
    return this.restaurants.filter(r => {
      const nameMatch = r.name.toLowerCase().includes(lowerKeyword);
      const categoryMatch = r.category.toLowerCase().includes(lowerKeyword);
      const menuMatch = r.menus.some(menu => 
        menu.toLowerCase().includes(lowerKeyword)
      );
      return nameMatch || categoryMatch || menuMatch;
    });
  }

  /**
   * 메뉴로 검색
   * @param {string} menuKeyword - 메뉴 키워드
   * @returns {Restaurant[]}
   */
  searchByMenu(menuKeyword) {
    if (!menuKeyword) return this.getAll();
    
    const lowerKeyword = menuKeyword.toLowerCase();
    return this.restaurants.filter(r => 
      r.menus.some(menu => menu.toLowerCase().includes(lowerKeyword))
    );
  }

  // ────────────────────────────────────────────────────────────────────
  // 복합 필터링 메서드
  // ────────────────────────────────────────────────────────────────────

  /**
   * 여러 조건으로 동시 필터링
   * @param {Object} filters
   * @param {string} [filters.cuisine] - 요리 유형
   * @param {string} [filters.diet] - 식단 유형
   * @param {string} [filters.weather] - 날씨
   * @param {string} [filters.mood] - 기분/상황
   * @param {string} [filters.people] - 인원 수
   * @param {string} [filters.budget] - 예산
   * @param {number} [filters.minRating] - 최소 평점
   * @param {boolean} [filters.ribbonOnly] - 블루리본만
   * @returns {Restaurant[]}
   */
  filterByMultipleCriteria(filters) {
    let results = this.getAll();

    if (filters.cuisine) {
      results = results.filter(r => r.cuisine === filters.cuisine);
    }

    if (filters.diet) {
      results = results.filter(r => r.diet?.includes(filters.diet));
    }

    if (filters.weather) {
      results = results.filter(r => r.weather?.includes(filters.weather));
    }

    if (filters.mood) {
      results = results.filter(r => r.mood?.includes(filters.mood));
    }

    if (filters.people) {
      results = results.filter(r => r.people?.includes(filters.people));
    }

    if (filters.budget) {
      results = results.filter(r => r.budget?.includes(filters.budget));
    }

    if (filters.minRating) {
      results = results.filter(r => 
        parseFloat(r.rating) >= filters.minRating
      );
    }

    if (filters.ribbonOnly) {
      results = results.filter(r => r.ribbon === true);
    }

    return results;
  }

  // ────────────────────────────────────────────────────────────────────
  // 통계 메서드
  // ────────────────────────────────────────────────────────────────────

  /**
   * 요리 유형별 통계
   * @returns {Object.<string, number>}
   */
  getCuisineStats() {
    const stats = {};
    this.restaurants.forEach(r => {
      stats[r.cuisine] = (stats[r.cuisine] || 0) + 1;
    });
    return stats;
  }

  /**
   * 평균 평점 계산
   * @returns {number}
   */
  getAverageRating() {
    const sum = this.restaurants.reduce((acc, r) => 
      acc + parseFloat(r.rating), 0
    );
    return sum / this.restaurants.length;
  }

  /**
   * 가장 인기 있는 카테고리 (출현 빈도 기준)
   * @returns {string[]} - 카테고리 배열 (빈도순)
   */
  getMostPopularCategories() {
    const categoryCount = {};
    this.restaurants.forEach(r => {
      const categories = r.category.split('·').map(c => c.trim());
      categories.forEach(cat => {
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      });
    });

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .map(([category]) => category);
  }
}

/**
 * 기본 레포지토리 인스턴스
 */
export const restaurantRepository = new RestaurantRepository();
