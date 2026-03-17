/**
 * LLM 서비스 — TOP3 식당에 대한 자연어 추천 이유 생성
 * Vercel 서버리스 함수(/api/llm)를 통해 Azure OpenAI 호출
 * API 키는 서버 측에서만 처리 (클라이언트 노출 없음)
 */

const LLM_API_PATH = '/api/llm';

/**
 * TOP3 식당의 LLM 추천 이유를 가져옵니다.
 * @param {Array} top3 - 상위 3개 식당 배열
 * @param {Object} selections - 사용자 선택 (weather, mood, people, diet, budget)
 * @returns {Promise<string[]>} 추천 이유 배열 (3개)
 */
export async function fetchLLMReasons(top3, selections) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(LLM_API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        restaurants: top3.map(r => ({
          name: r.name,
          category: r.category,
          menus: r.menus,
          price: r.price,
          priceNote: r.priceNote,
          walk: r.walk,
          rating: r.rating,
          score100: r.score100,
        })),
        selections,
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) return null;

    const data = await response.json();
    return data.reasons || null;
  } catch {
    clearTimeout(timeout);
    return null;
  }
}
