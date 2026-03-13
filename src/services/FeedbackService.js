/**
 * FeedbackService
 * 
 * 사용자 피드백 (좋아요/싫어요) 저장, 조회, 점수화
 * localStorage 기반 영구 저장
 */

const FEEDBACK_KEY = 'kt-lunch-feedback';

/**
 * 저장된 피드백 조회
 * @returns {Array} 피드백 배열
 */
export function getUserFeedback() {
  try {
    const feedback = localStorage.getItem(FEEDBACK_KEY);
    if (!feedback) return [];
    const parsed = JSON.parse(feedback);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('피드백 로드 실패:', e);
    return [];
  }
}

/**
 * 피드백 저장
 * @param {string} restaurantName - 식당명
 * @param {string} feedbackType - 'like' 또는 'dislike'
 * @param {Object} context - 추천 조건 컨텍스트
 * @returns {boolean} 저장 성공 여부
 */
export function saveFeedback(restaurantName, feedbackType, context) {
  try {
    const allFeedback = getUserFeedback();
    const newFeedback = {
      restaurantId: restaurantName,
      feedback: feedbackType,
      timestamp: new Date().toISOString(),
      context: context
    };
    
    const filtered = allFeedback.filter(f => f.restaurantId !== restaurantName);
    filtered.push(newFeedback);
    
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.error('피드백 저장 실패:', e);
    return false;
  }
}

/**
 * 식당의 피드백 기반 점수 계산
 * @param {string} restaurantName - 식당명
 * @returns {number} -25 ~ +25 점수
 */
export function getFeedbackScore(restaurantName) {
  const allFeedback = getUserFeedback();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentFeedback = allFeedback.filter(f => {
    const feedbackDate = new Date(f.timestamp);
    return f.restaurantId === restaurantName && feedbackDate > thirtyDaysAgo;
  });
  
  if (recentFeedback.length === 0) return 0;
  
  const likes = recentFeedback.filter(f => f.feedback === 'like').length;
  const dislikes = recentFeedback.filter(f => f.feedback === 'dislike').length;
  const total = likes + dislikes;
  const ratio = likes / total;
  
  if (ratio > 0.66) return 25;
  else if (ratio < 0.33) return -25;
  else return 0;
}
