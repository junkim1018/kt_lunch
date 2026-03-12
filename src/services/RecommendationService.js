/**
 * RecommendationService
 * 
 * 식당 추천 알고리즘의 핵심 로직을 담당하는 서비스
 * 필터링, 점수 계산, 정렬, 다양성 확보를 통해 최종 추천 목록 생성
 */

import { FilterService } from './FilterService.js';
import { shuffle, uniqueBy, groupBy } from '../utils/array.js';
import { extractBrand } from '../utils/string.js';

/**
 * @typedef {import('../types/Restaurant').Restaurant} Restaurant
 * @typedef {import('../types/Selection').UserSelection} UserSelection
 * @typedef {import('../types/RecommendationResult').RecommendedRestaurant} RecommendedRestaurant
 */

/**
 * 추천 서비스
 */
export class RecommendationService {
  /**
   * @param {FilterService} filterService
   */
  constructor(filterService = new FilterService()) {
    this.filterService = filterService;
  }

  /**
   * 브랜드 중복 제거 (같은 브랜드는 점수 높은 것만 남김)
   * @param {Array<{restaurant: Restaurant, score: number}>} scoredRestaurants
   * @returns {Array<{restaurant: Restaurant, score: number}>}
   */
  deduplicateByBrand(scoredRestaurants) {
    const grouped = groupBy(
      scoredRestaurants, 
      item => extractBrand(item.restaurant.name)
    );

    const deduplicated = [];
    for (const [brand, items] of Object.entries(grouped)) {
      // 같은 브랜드 중 점수 최고인 것만 선택
      const best = items.reduce((max, curr) => 
        curr.score > max.score ? curr : max
      );
      deduplicated.push(best);
    }

    return deduplicated;
  }

  /**
   * 상위 N개 + 랜덤 M개 조합으로 다양성 확보
   * @param {Array<{restaurant: Restaurant, score: number}>} scoredRestaurants
   * @param {number} topCount - 상위 개수
   * @param {number} randomCount - 랜덤 개수
   * @returns {Array<{restaurant: Restaurant, score: number}>}
   */
  selectDiverseResults(scoredRestaurants, topCount = 7, randomCount = 3) {
    if (scoredRestaurants.length <= topCount) {
      return scoredRestaurants;
    }

    // 상위 N개
    const topResults = scoredRestaurants.slice(0, topCount);

    // 나머지에서 랜덤 M개
    const remaining = scoredRestaurants.slice(topCount);
    const randomResults = shuffle(remaining).slice(0, randomCount);

    return [...topResults, ...randomResults];
  }

  /**
   * 카테고리 다양성 확보 (같은 카테고리 3개 이상 연속 방지)
   * @param {Array<{restaurant: Restaurant, score: number}>} scoredRestaurants
   * @returns {Array<{restaurant: Restaurant, score: number}>}
   */
  diversifyByCategory(scoredRestaurants) {
    if (scoredRestaurants.length <= 3) return scoredRestaurants;

    const result = [];
    const remaining = [...scoredRestaurants];
    let lastCuisine = null;
    let sameCount = 0;

    while (remaining.length > 0) {
      let selected = null;

      if (sameCount >= 2) {
        // 같은 cuisine 3개 연속이면 다른 cuisine 찾기
        const differentIndex = remaining.findIndex(
          item => item.restaurant.cuisine !== lastCuisine
        );
        
        if (differentIndex !== -1) {
          selected = remaining.splice(differentIndex, 1)[0];
        } else {
          // 다른 cuisine 없으면 그냥 첫 번째
          selected = remaining.shift();
        }
      } else {
        // 정상 순서대로
        selected = remaining.shift();
      }

      result.push(selected);

      // 연속 카운트 업데이트
      if (selected.restaurant.cuisine === lastCuisine) {
        sameCount++;
      } else {
        lastCuisine = selected.restaurant.cuisine;
        sameCount = 1;
      }
    }

    return result;
  }

  /**
   * 식당 추천 (핵심 메서드)
   * @param {Restaurant[]} restaurants - 전체 식당 목록
   * @param {UserSelection} selection - 사용자 선택 조건
   * @param {string[]} recentNames - 최근 방문 식당명
   * @param {function} getDistanceFunc - 거리 계산 함수
   * @param {Object} baseCoords - 기준 좌표 {lat, lng}
   * @param {number} maxResults - 최대 결과 개수
   * @returns {RecommendedRestaurant[]}
   */
  recommend(
    restaurants,
    selection,
    recentNames = [],
    getDistanceFunc,
    baseCoords,
    maxResults = 10
  ) {
    // 1. 필터링 & 점수 계산
    let scoredRestaurants = this.filterService.filterAndScore(
      restaurants,
      selection,
      recentNames,
      extractBrand,
      getDistanceFunc,
      baseCoords
    );

    // 2. 점수순 정렬
    scoredRestaurants.sort((a, b) => b.score - a.score);

    // 3. 브랜드 중복 제거
    scoredRestaurants = this.deduplicateByBrand(scoredRestaurants);

    // 4. 다양성 확보 (상위 7개 + 랜덤 3개)
    scoredRestaurants = this.selectDiverseResults(scoredRestaurants, 7, 3);

    // 5. 카테고리 다양성 확보
    scoredRestaurants = this.diversifyByCategory(scoredRestaurants);

    // 6. 상위 N개 선택
    const topResults = scoredRestaurants.slice(0, maxResults);

    // 7. RecommendedRestaurant 형식으로 변환
    const recommendations = topResults.map(({ restaurant, score }) => ({
      ...restaurant,
      recommendScore: Math.round(score),
      matchReasons: this._generateMatchReasons(restaurant, selection)
    }));

    return recommendations;
  }

  /**
   * 매칭 이유 생성 (내부 메서드)
   * @private
   * @param {Restaurant} restaurant
   * @param {UserSelection} selection
   * @returns {string[]}
   */
  _generateMatchReasons(restaurant, selection) {
    const reasons = [];

    if (selection.weather && restaurant.weather.includes(selection.weather)) {
      reasons.push(`${selection.weather} 날씨에 딱`);
    }

    if (selection.mood && restaurant.mood.includes(selection.mood)) {
      reasons.push(`${selection.mood} 기분에 맞음`);
    }

    if (selection.people && restaurant.people.includes(selection.people)) {
      reasons.push(`${selection.people} 인원에 적합`);
    }

    if (restaurant.ribbon) {
      reasons.push('블루리본 맛집');
    }

    if (parseFloat(restaurant.rating) >= 4.5) {
      reasons.push('높은 평점');
    }

    return reasons;
  }

  /**
   * 빠른 추천 (프리셋 기반)
   * @param {Restaurant[]} restaurants
   * @param {Object} preset - 프리셋 설정 객체
   * @param {string[]} recentNames
   * @param {function} getDistanceFunc
   * @param {Object} baseCoords
   * @returns {RecommendedRestaurant[]}
   */
  quickRecommend(restaurants, preset, recentNames, getDistanceFunc, baseCoords) {
    const selection = {
      cuisine: preset.cuisine || 'all',
      diet: preset.diet || 'nodiet',
      weather: preset.weather || null,
      mood: preset.mood || null,
      people: preset.people || null,
      budget: preset.budget || null
    };

    return this.recommend(
      restaurants,
      selection,
      recentNames,
      getDistanceFunc,
      baseCoords,
      10
    );
  }

  /**
   * 랜덤 추천 (다양성 극대화)
   * @param {Restaurant[]} restaurants
   * @param {number} count
   * @returns {Restaurant[]}
   */
  randomRecommend(restaurants, count = 10) {
    return shuffle(restaurants).slice(0, count);
  }

  /**
   * 인기 식당 추천 (평점 + 특별 속성 기준)
   * @param {Restaurant[]} restaurants
   * @param {number} count
   * @returns {Restaurant[]}
   */
  popularRecommend(restaurants, count = 10) {
    const scored = restaurants.map(r => {
      let score = parseFloat(r.rating) * 20; // 평점 기본
      if (r.ribbon) score += 25;
      if (r.hot) score += 15;
      if (r.waiting) score += 10;
      return { restaurant: r, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map(item => item.restaurant);
  }

  /**
   * 근처 식당 추천 (거리 기준)
   * @param {Restaurant[]} restaurants
   * @param {function} getDistanceFunc
   * @param {Object} baseCoords
   * @param {number} maxDistanceMeters
   * @param {number} count
   * @returns {Restaurant[]}
   */
  nearbyRecommend(
    restaurants,
    getDistanceFunc,
    baseCoords,
    maxDistanceMeters = 300,
    count = 10
  ) {
    const withDistance = restaurants.map(r => ({
      restaurant: r,
      distance: getDistanceFunc(
        baseCoords.lat,
        baseCoords.lng,
        r.coords.lat,
        r.coords.lng
      )
    }));

    const nearby = withDistance
      .filter(item => item.distance <= maxDistanceMeters)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, count);

    return nearby.map(item => item.restaurant);
  }
}

/**
 * 기본 RecommendationService 인스턴스
 */
export const recommendationService = new RecommendationService();
