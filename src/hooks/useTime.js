/**
 * useTime Hook
 * 
 * 현재 시각을 실시간으로 표시하는 훅
 * 1초마다 업데이트
 */

import { useState, useEffect } from 'react';

/**
 * 현재 시각 표시 훅
 * @returns {Object}
 */
export function useTime() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // 1초마다 시간 업데이트
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 클린업
    return () => clearInterval(timer);
  }, []);

  /**
   * 포맷된 시간 문자열 (HH:MM:SS)
   */
  const formattedTime = currentTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  /**
   * 포맷된 날짜 문자열 (YYYY년 MM월 DD일)
   */
  const formattedDate = currentTime.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  /**
   * 요일
   */
  const dayOfWeek = currentTime.toLocaleDateString('ko-KR', {
    weekday: 'long'
  });

  /**
   * 시간대 (오전/오후)
   */
  const isPM = currentTime.getHours() >= 12;
  const period = isPM ? '오후' : '오전';

  /**
   * 점심시간 여부 (11:00~14:00)
   */
  const isLunchTime = (() => {
    const hour = currentTime.getHours();
    return hour >= 11 && hour < 14;
  })();

  return {
    currentTime,
    formattedTime,
    formattedDate,
    dayOfWeek,
    period,
    isLunchTime,
    hour: currentTime.getHours(),
    minute: currentTime.getMinutes(),
    second: currentTime.getSeconds()
  };
}
