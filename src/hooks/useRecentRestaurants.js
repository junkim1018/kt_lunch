/**
 * useRecentRestaurants Hook
 * 
 * 최근 방문 식당 이력 관리 훅
 * localStorage를 사용하여 영구 저장
 */

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kt-lunch-recent-restaurants';
const MAX_RECENT = 10; // 최대 저장 개수

/**
 * 최근 방문 식당 관리 훅
 * @returns {Object}
 */
export function useRecentRestaurants() {
  const [recentNames, setRecentNames] = useState([]);

  /**
   * localStorage에서 최근 이력 불러오기
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentNames(parsed.slice(0, MAX_RECENT));
        }
      }
    } catch (error) {
      console.error('최근 이력 불러오기 실패:', error);
      setRecentNames([]);
    }
  }, []);

  /**
   * localStorage에 저장
   * @param {string[]} names
   */
  const saveToStorage = useCallback((names) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
    } catch (error) {
      console.error('최근 이력 저장 실패:', error);
    }
  }, []);

  /**
   * 식당 추가 (최신순 정렬, 중복 제거)
   * @param {string} restaurantName - 식당명
   */
  const addRecent = useCallback((restaurantName) => {
    if (!restaurantName) return;

    setRecentNames(prev => {
      // 이미 있으면 제거
      const filtered = prev.filter(name => name !== restaurantName);
      // 맨 앞에 추가
      const updated = [restaurantName, ...filtered].slice(0, MAX_RECENT);
      
      // 저장
      saveToStorage(updated);
      
      return updated;
    });
  }, [saveToStorage]);

  /**
   * 특정 식당 제거
   * @param {string} restaurantName - 식당명
   */
  const removeRecent = useCallback((restaurantName) => {
    setRecentNames(prev => {
      const updated = prev.filter(name => name !== restaurantName);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  /**
   * 전체 이력 초기화
   */
  const clearRecent = useCallback(() => {
    setRecentNames([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('이력 삭제 실패:', error);
    }
  }, []);

  /**
   * 특정 식당이 최근 방문 이력에 있는지 확인
   * @param {string} restaurantName - 식당명
   * @returns {boolean}
   */
  const isRecent = useCallback((restaurantName) => {
    return recentNames.includes(restaurantName);
  }, [recentNames]);

  /**
   * 최근 방문일 (인덱스 반환, 없으면 -1)
   * @param {string} restaurantName - 식당명
   * @returns {number} 0이면 가장 최근, -1이면 이력 없음
   */
  const getRecentIndex = useCallback((restaurantName) => {
    return recentNames.indexOf(restaurantName);
  }, [recentNames]);

  return {
    recentNames,
    addRecent,
    removeRecent,
    clearRecent,
    isRecent,
    getRecentIndex,
    count: recentNames.length
  };
}
