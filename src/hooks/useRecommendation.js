/**
 * useRecommendation Hook
 * 
 * 식당 추천 로직을 담당하는 커스텀 훅
 * 필터링, 점수 계산, 추천 실행을 한 곳에서 관리
 */

import { useState, useCallback, useMemo } from 'react';
import { restaurantRepository } from '../data';
import { recommendationService } from '../services';
import { getDistance } from '../utils/distance';
import { KT_EAST_COORDS } from '../constants/config';

/**
 * @typedef {import('../types/Selection').UserSelection} UserSelection
 * @typedef {import('../types/RecommendationResult').RecommendedRestaurant} RecommendedRestaurant
 */

/**
 * 식당 추천 훅
 * @param {string[]} [recentNames=[]] - 최근 방문 식당명
 * @returns {Object}
 */
export function useRecommendation(recentNames = []) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 전체 식당 목록 (메모이제이션)
  const allRestaurants = useMemo(() => {
    return restaurantRepository.getAll();
  }, []);

  /**
   * 추천 실행
   * @param {UserSelection} selection - 사용자 선택 조건
   * @param {number} [maxResults=10] - 최대 결과 개수
   */
  const recommend = useCallback(async (selection, maxResults = 10) => {
    setLoading(true);
    setError(null);

    try {
      const results = recommendationService.recommend(
        allRestaurants,
        selection,
        recentNames,
        getDistance,
        KT_EAST_COORDS,
        maxResults
      );

      setRecommendations(results);
      return results;
    } catch (err) {
      console.error('추천 실행 중 오류:', err);
      setError(err.message);
      setRecommendations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [allRestaurants, recentNames]);

  /**
   * 빠른 추천 (프리셋 기반)
   * @param {Object} preset - 프리셋 설정
   */
  const quickRecommend = useCallback(async (preset) => {
    setLoading(true);
    setError(null);

    try {
      const results = recommendationService.quickRecommend(
        allRestaurants,
        preset,
        recentNames,
        getDistance,
        KT_EAST_COORDS
      );

      setRecommendations(results);
      return results;
    } catch (err) {
      console.error('빠른 추천 중 오류:', err);
      setError(err.message);
      setRecommendations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [allRestaurants, recentNames]);

  /**
   * 랜덤 추천
   * @param {number} count - 개수
   */
  const randomRecommend = useCallback((count = 10) => {
    setLoading(true);
    setError(null);

    try {
      const results = recommendationService.randomRecommend(
        allRestaurants,
        count
      );

      setRecommendations(results);
      return results;
    } catch (err) {
      console.error('랜덤 추천 중 오류:', err);
      setError(err.message);
      setRecommendations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [allRestaurants]);

  /**
   * 인기 식당 추천
   * @param {number} count - 개수
   */
  const popularRecommend = useCallback((count = 10) => {
    setLoading(true);
    setError(null);

    try {
      const results = recommendationService.popularRecommend(
        allRestaurants,
        count
      );

      setRecommendations(results);
      return results;
    } catch (err) {
      console.error('인기 식당 추천 중 오류:', err);
      setError(err.message);
      setRecommendations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [allRestaurants]);

  /**
   * 근처 식당 추천
   * @param {number} maxDistanceMeters - 최대 거리 (미터)
   * @param {number} count - 개수
   */
  const nearbyRecommend = useCallback((maxDistanceMeters = 300, count = 10) => {
    setLoading(true);
    setError(null);

    try {
      const results = recommendationService.nearbyRecommend(
        allRestaurants,
        getDistance,
        KT_EAST_COORDS,
        maxDistanceMeters,
        count
      );

      setRecommendations(results);
      return results;
    } catch (err) {
      console.error('근처 식당 추천 중 오류:', err);
      setError(err.message);
      setRecommendations([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [allRestaurants]);

  /**
   * 추천 초기화
   */
  const reset = useCallback(() => {
    setRecommendations([]);
    setError(null);
  }, []);

  return {
    recommendations,
    loading,
    error,
    recommend,
    quickRecommend,
    randomRecommend,
    popularRecommend,
    nearbyRecommend,
    reset
  };
}
