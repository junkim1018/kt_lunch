/**
 * LLMService
 * 
 * OpenAI API를 사용한 AI 기반 식당 추천 서비스
 * gpt-4o-mini 모델을 사용하여 자연어 기반 추천 생성
 */

import OpenAI from 'openai';

/**
 * @typedef {import('../types/Restaurant').Restaurant} Restaurant
 * @typedef {import('../types/Selection').UserSelection} UserSelection
 */

/**
 * LLM 추천 서비스
 */
export class LLMService {
  /**
   * @param {string} apiKey - OpenAI API 키
   */
  constructor(apiKey = null) {
    this.openai = null;
    this.isEnabled = false;

    if (apiKey && this._isValidApiKey(apiKey)) {
      try {
        this.openai = new OpenAI({
          apiKey: apiKey,
          dangerouslyAllowBrowser: true
        });
        this.isEnabled = true;
        console.log("✅ OpenAI LLM 추천 활성화");
      } catch (error) {
        console.error("OpenAI 초기화 실패:", error);
        this.isEnabled = false;
      }
    } else {
      console.log("ℹ️ OpenAI API 키 없음 - 기본 알고리즘 사용");
    }
  }

  /**
   * API 키 유효성 검사
   * @private
   * @param {string} apiKey
   * @returns {boolean}
   */
  _isValidApiKey(apiKey) {
    return (
      apiKey &&
      !apiKey.includes('your-api-key') &&
      !apiKey.includes('your-openai-api-key') &&
      apiKey.startsWith('sk-')
    );
  }

  /**
   * LLM 사용 가능 여부
   * @returns {boolean}
   */
  isAvailable() {
    return this.isEnabled && this.openai !== null;
  }

  /**
   * 사용자 선택을 자연어 설명으로 변환
   * @private
   * @param {UserSelection} selection
   * @returns {string}
   */
  _selectionToText(selection) {
    const parts = [];

    if (selection.cuisine && selection.cuisine !== 'all') {
      const cuisineMap = {
        korean: '한식',
        chinese: '중식',
        japanese: '일식',
        western: '양식',
        asian: '아시안',
        other: '기타(샐러드/멕시칸/인도)'
      };
      parts.push(`음식 종류: ${cuisineMap[selection.cuisine]}`);
    }

    if (selection.diet && selection.diet !== 'nodiet') {
      const dietMap = {
        vegetarian: '채식 선호',
        diet: '다이어트 중',
        light: '가볍게 먹고 싶음'
      };
      parts.push(`식단: ${dietMap[selection.diet]}`);
    }

    if (selection.weather) {
      const weatherMap = {
        hot: '더운 날씨',
        mild: '선선한 날씨',
        cold: '추운 날씨',
        rainy: '비 오는 날'
      };
      parts.push(`날씨: ${weatherMap[selection.weather]}`);
    }

    if (selection.mood) {
      const moodMap = {
        safe: '무난한 선택',
        hearty: '든든하게',
        executive: '임원과 함께',
        hangover: '숙취 해소',
        team: '팀 점심',
        exciting: '신나는 날',
        sad: '우울한 날'
      };
      parts.push(`기분: ${moodMap[selection.mood]}`);
    }

    if (selection.people) {
      const peopleMap = {
        solo: '혼밥',
        small: '2~3명',
        medium: '4~6명',
        large: '7명 이상'
      };
      parts.push(`인원: ${peopleMap[selection.people]}`);
    }

    if (selection.budget) {
      const budgetMap = {
        cheap: '1만원 이하',
        normal: '1~2만원',
        expensive: '2만원 이상'
      };
      parts.push(`예산: ${budgetMap[selection.budget]}`);
    }

    return parts.join(', ');
  }

  /**
   * 식당 목록을 LLM 프롬프트용 텍스트로 변환
   * @private
   * @param {Restaurant[]} restaurants
   * @returns {string}
   */
  _restaurantsToText(restaurants) {
    return restaurants.map((r, idx) => {
      return `${idx + 1}. ${r.name}
- 카테고리: ${r.category}
- 메뉴: ${r.menus.join(', ')}
- 가격: ${r.price}
- 도보: ${r.walk}
- 평점: ${r.rating}
- 추천 이유: ${r.reason}`;
    }).join('\n\n');
  }

  /**
   * AI 기반 식당 추천
   * @param {Restaurant[]} candidateRestaurants - 후보 식당 목록 (이미 필터링된)
   * @param {UserSelection} selection - 사용자 선택
   * @param {number} count - 추천할 개수
   * @returns {Promise<{recommendations: string[], explanation: string}>}
   */
  async recommend(candidateRestaurants, selection, count = 5) {
    if (!this.isAvailable()) {
      throw new Error('LLM 서비스가 활성화되지 않았습니다.');
    }

    if (candidateRestaurants.length === 0) {
      return {
        recommendations: [],
        explanation: '조건에 맞는 식당이 없습니다.'
      };
    }

    const userContext = this._selectionToText(selection);
    const restaurantList = this._restaurantsToText(candidateRestaurants);

    const prompt = `당신은 KT 광화문 직원을 위한 점심 추천 전문가입니다.

사용자 조건:
${userContext}

후보 식당 목록:
${restaurantList}

위 식당들 중에서 사용자 조건에 가장 잘 맞는 상위 ${count}개를 추천해주세요.

응답 형식 (JSON):
{
  "recommendations": ["식당명1", "식당명2", ...],
  "explanation": "추천 이유 종합 설명"
}

주의사항:
- 반드시 위 목록에 있는 식당명만 사용하세요
- recommendations는 정확한 식당명 배열입니다
- explanation은 전체 추천의 이유를 2-3문장으로 설명합니다`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: '당신은 KT 광화문 직원을 위한 점심 추천 전문가입니다. 사용자의 조건과 식당 정보를 분석하여 최적의 추천을 제공합니다.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(content);

      return {
        recommendations: result.recommendations || [],
        explanation: result.explanation || '추천 식당입니다.'
      };
    } catch (error) {
      console.error('LLM 추천 실패:', error);
      throw new Error(`LLM 추천 중 오류 발생: ${error.message}`);
    }
  }

  /**
   * 간단한 AI 추천 (스트리밍 없이)
   * @param {Restaurant[]} candidateRestaurants
   * @param {string} userMessage - 사용자의 자연어 요청
   * @param {number} count
   * @returns {Promise<string[]>} 추천 식당명 배열
   */
  async simpleRecommend(candidateRestaurants, userMessage, count = 5) {
    if (!this.isAvailable()) {
      throw new Error('LLM 서비스가 활성화되지 않았습니다.');
    }

    const restaurantNames = candidateRestaurants.map(r => r.name);
    const restaurantList = this._restaurantsToText(candidateRestaurants);

    const prompt = `후보 식당 목록:
${restaurantList}

사용자 요청: "${userMessage}"

위 식당들 중 ${count}개를 추천해주세요. 식당명만 JSON 배열로 반환하세요.
형식: ["식당명1", "식당명2", ...]`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '식당 추천 전문가' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const content = response.choices[0].message.content;
      const recommendations = JSON.parse(content);

      // 유효성 검사: 목록에 있는 식당만 반환
      return recommendations.filter(name => 
        restaurantNames.includes(name)
      );
    } catch (error) {
      console.error('LLM 간단 추천 실패:', error);
      throw error;
    }
  }

  /**
   * 식당 상세 설명 생성
   * @param {Restaurant} restaurant
   * @returns {Promise<string>}
   */
  async generateDescription(restaurant) {
    if (!this.isAvailable()) {
      return restaurant.reason; // LLM 없으면 기본 이유 반환
    }

    const prompt = `다음 식당에 대한 매력적인 한 줄 설명을 생성해주세요:

식당명: ${restaurant.name}
카테고리: ${restaurant.category}
메뉴: ${r.menus.join(', ')}
평점: ${restaurant.rating}
특징: ${restaurant.reason}

20자 이내로 간결하고 매력적인 한 줄 설명을 작성하세요.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: '식당 소개 전문가' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 100
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('설명 생성 실패:', error);
      return restaurant.reason;
    }
  }
}

/**
 * 환경변수에서 API 키를 가져와 기본 인스턴스 생성
 */
let llmServiceInstance = null;

export function createLLMService() {
  if (!llmServiceInstance) {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    llmServiceInstance = new LLMService(apiKey);
  }
  return llmServiceInstance;
}

export const llmService = createLLMService();
