/**
 * LLM 서비스 — TOP3 식당에 대한 자연어 추천 이유 생성
 * Vercel 서버리스 함수(/api/llm)를 통해 Azure OpenAI 호출
 * API 키는 서버 측에서만 처리 (클라이언트 노출 없음)
 */

const LLM_API_PATH = '/api/llm';

/**
 * 단일 식당의 LLM 추천 이유를 가져옵니다.
 * @param {Object} restaurant - 식당 객체
 * @param {Object} selections - 사용자 선택
 * @returns {Promise<string|null>} 추천 이유 문자열 또는 null
 */
export async function fetchSingleLLMReason(restaurant, selections) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(LLM_API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        restaurants: [{
          name: restaurant.name,
          category: restaurant.category,
          menus: restaurant.weatherMenus || restaurant.menus,
          allMenus: restaurant.menus,
          price: restaurant.price,
          priceNote: restaurant.priceNote,
          walk: restaurant.walk,
          rating: restaurant.rating,
          calorie: restaurant.calorie,
          waiting: restaurant.waiting,
          ribbon: restaurant.ribbon,
          hot: restaurant.hot,
        }],
        selections,
      }),
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    return data.reasons?.[0] || null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}
