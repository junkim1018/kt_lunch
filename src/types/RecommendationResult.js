/**
 * @file Recommendation Result Type Definitions
 * @description 추천 결과 타입 정의
 */

/**
 * 점수가 포함된 추천 식당 정보
 * @typedef {Object} RecommendedRestaurant
 * 
 * @property {string} name - 식당명
 * @property {string} category - 카테고리
 * @property {string} cuisine - 요리 타입
 * @property {{lat: number, lng: number}} coords - GPS 좌표
 * @property {string[]} menus - 대표 메뉴 목록
 * @property {string} price - 가격대 범위
 * @property {string} priceNote - 1인 평균 가격 설명
 * @property {string} walk - 도보 소요 시간
 * @property {string} rating - 네이버 평점
 * @property {boolean} ribbon - 블루리본 여부
 * @property {string[]} diet - 식단 타입
 * @property {string[]} weather - 적합한 날씨
 * @property {string[]} mood - 적합한 기분
 * @property {string[]} people - 적합한 인원
 * @property {string[]} budget - 예산 카테고리
 * @property {boolean} [waiting] - 웨이팅 필요 여부
 * @property {{emoji: string, label: string, color: string}} calorie - 칼로리 정보
 * @property {string} reason - 추천 이유
 * @property {string} naver - 네이버 지도 링크
 * @property {Array<{label: string, url: string, color: string}>} [reservation] - 예약 링크
 * 
 * @property {number} score - 추천 점수 (0-100)
 * @property {number} matchCount - 조건 매칭 개수 (0-5)
 * @property {string[]} matchReasons - 매칭된 이유 목록
 * @property {boolean} isRecent - 최근 방문 여부
 * @property {number} distance - KT East 빌딩으로부터의 거리 (미터)
 * 
 * @example
 * {
 *   name: "파이프그라운드 광화문점",
 *   category: "이탈리안 · 피자/파스타",
 *   cuisine: "western",
 *   coords: { lat: 37.5709, lng: 126.9762 },
 *   menus: ["옥수수 피자 26,000원"],
 *   price: "21,000~45,000원",
 *   priceNote: "1인 평균 2~3만원",
 *   walk: "도보 1분",
 *   rating: "4.9",
 *   ribbon: true,
 *   diet: ["nodiet"],
 *   weather: ["mild", "cold"],
 *   mood: ["great", "normal"],
 *   people: ["solo", "small", "medium"],
 *   budget: ["expensive"],
 *   waiting: true,
 *   calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
 *   reason: "KT West 건물 지하 바로!",
 *   naver: "https://map.naver.com/...",
 *   reservation: [...],
 *   score: 92,
 *   matchCount: 5,
 *   matchReasons: ["🌤️ 선선한 날씨에 제격", "👤 혼밥/소규모 모임"],
 *   isRecent: false,
 *   distance: 50
 * }
 */

/**
 * 추천 결과
 * @typedef {Object} RecommendationResult
 * 
 * @property {RecommendedRestaurant[]} list - 추천 식당 목록 (최대 10개)
 * @property {string|null} relaxedMsg - 조건 완화 메시지
 *   - null: 충분한 결과가 있음
 *   - "😢 조건에 맞는 식당이 없어요...": 결과 없음
 *   - "💡 조건에 맞는 식당이 적어요...": 결과가 5개 미만
 *   - "⚠️ 오류가 발생해 랜덤으로 보여드려요": 에러 발생
 * 
 * @example
 * // 성공적인 추천
 * {
 *   list: [
 *     { name: "파이프그라운드", score: 92, ... },
 *     { name: "광화문석갈비", score: 88, ... },
 *     // ... 최대 10개
 *   ],
 *   relaxedMsg: null
 * }
 * 
 * @example
 * // 결과가 적을 때
 * {
 *   list: [
 *     { name: "일품 광화문점", score: 75, ... },
 *     { name: "쌤쌤쌤", score: 68, ... }
 *   ],
 *   relaxedMsg: "💡 조건에 맞는 식당이 적어요. 다른 조건을 선택해보세요!"
 * }
 * 
 * @example
 * // 결과가 없을 때
 * {
 *   list: [],
 *   relaxedMsg: "😢 조건에 맞는 식당이 없어요. 다른 조건을 선택해보세요!"
 * }
 */

/**
 * 추천 알고리즘 설정
 * @typedef {Object} RecommendationConfig
 * 
 * @property {number} maxResults - 최대 추천 개수 (기본: 10)
 * @property {number} minMatchCount - 최소 매칭 조건 개수 (기본: 3)
 * @property {number} recentPenalty - 최근 방문 페널티 점수 (기본: -15)
 * @property {boolean} useDistance - 거리 기반 점수 반영 여부 (기본: true)
 * @property {boolean} useRating - 평점 기반 점수 반영 여부 (기본: true)
 * @property {boolean} randomize - 동점자 랜덤 섞기 여부 (기본: true)
 * 
 * @example
 * {
 *   maxResults: 10,
 *   minMatchCount: 3,
 *   recentPenalty: -15,
 *   useDistance: true,
 *   useRating: true,
 *   randomize: true
 * }
 */

/**
 * 매칭 조건 상세 정보
 * @typedef {Object} MatchDetail
 * 
 * @property {boolean} weather - 날씨 매칭 여부
 * @property {boolean} mood - 기분 매칭 여부
 * @property {boolean} people - 인원 매칭 여부
 * @property {boolean} diet - 식단 매칭 여부
 * @property {boolean} budget - 예산 매칭 여부
 * @property {number} matchCount - 총 매칭 개수 (0-5)
 * @property {string[]} reasons - 매칭 이유 목록
 * 
 * @example
 * {
 *   weather: true,
 *   mood: true,
 *   people: false,
 *   diet: true,
 *   budget: true,
 *   matchCount: 4,
 *   reasons: ["🌡️ 더운 날 딱 맞는 메뉴", "😊 안전한 선택"]
 * }
 */

// Export for JSDoc
export {};
