/**
 * @file Restaurant Type Definitions
 * @description 식당 데이터 모델의 타입 정의
 */

/**
 * 식당 좌표 정보
 * @typedef {Object} Coordinates
 * @property {number} lat - 위도
 * @property {number} lng - 경도
 */

/**
 * 칼로리 정보
 * @typedef {Object} CalorieInfo
 * @property {string} emoji - 칼로리 표시 이모지 (🔴 고칼로리, 🟡 보통, 🟢 저칼로리)
 * @property {string} label - 칼로리 레이블 ("고칼로리", "보통", "저칼로리")
 * @property {string} color - 색상 코드 (hex)
 * 
 * @example
 * { emoji: "🔴", label: "고칼로리", color: "#ff4444" }
 */

/**
 * 예약 링크 정보
 * @typedef {Object} ReservationLink
 * @property {string} label - 예약 플랫폼 이름 ("캐치테이블", "네이버 예약" 등)
 * @property {string} url - 예약 URL
 * @property {string} color - 브랜드 색상 코드 (hex)
 * 
 * @example
 * { label: "캐치테이블", url: "https://app.catchtable.co.kr/...", color: "#FF6B35" }
 */

/**
 * 식당 정보 타입
 * @typedef {Object} Restaurant
 * 
 * @property {string} name - 식당명
 * @property {string} category - 카테고리 ("한식 · 갈비/구이", "일식 · 규카츠" 등)
 * @property {CuisineType} cuisine - 요리 타입 (korean, chinese, japanese 등)
 * @property {Coordinates} coords - GPS 좌표 (KT East 빌딩 기준)
 * @property {string[]} menus - 대표 메뉴 목록 (가격 포함)
 * @property {string} price - 가격대 범위 ("10,000~15,000원" 형식)
 * @property {string} priceNote - 1인 평균 가격 설명
 * @property {string} walk - 도보 소요 시간 및 위치 설명
 * @property {string} rating - 네이버 평점 (문자열 형태, "4.9" 등)
 * @property {boolean} ribbon - 네이버 블루리본 획득 여부
 * @property {DietType[]} diet - 식단 타입 배열 (nodiet, vegetarian, diet, light 등)
 * @property {WeatherType[]} weather - 적합한 날씨 배열 (hot, cold, mild, rainy)
 * @property {MoodType[]} mood - 적합한 기분/상황 배열 (safe, exciting, team, executive 등)
 * @property {PeopleType[]} people - 적합한 인원 배열 (solo, small, medium, large)
 * @property {BudgetType[]} budget - 예산 카테고리 배열 (cheap, normal, expensive)
 * @property {boolean} [waiting] - 웨이팅 필요 여부 (선택적)
 * @property {CalorieInfo} calorie - 칼로리 정보 객체
 * @property {string} reason - 추천 이유 (한 줄 설명)
 * @property {string} naver - 네이버 지도 링크
 * @property {ReservationLink[]} [reservation] - 예약 링크 배열 (선택적)
 * 
 * @example
 * {
 *   name: "파이프그라운드 광화문점",
 *   category: "이탈리안 · 피자/파스타",
 *   cuisine: "western",
 *   coords: { lat: 37.5709, lng: 126.9762 },
 *   menus: ["옥수수 피자 26,000원", "화이트 라구 파스타 25,000원"],
 *   price: "21,000~45,000원",
 *   priceNote: "1인 평균 2~3만원",
 *   walk: "도보 1분 (KT West 지하 1층)",
 *   rating: "4.9",
 *   ribbon: true,
 *   diet: ["nodiet"],
 *   weather: ["mild", "cold"],
 *   mood: ["great", "normal"],
 *   people: ["solo", "small", "medium"],
 *   budget: ["expensive"],
 *   waiting: true,
 *   calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
 *   reason: "KT West 건물 지하 바로! 블루리번·네이버 4.9. 옥수수피자 시그니처.",
 *   naver: "https://map.naver.com/v5/search/파이프그라운드+광화문",
 *   reservation: [
 *     { label: "캐치테이블", url: "https://app.catchtable.co.kr/...", color: "#FF6B35" }
 *   ]
 * }
 */

/**
 * 요리 타입
 * @typedef {'korean'|'chinese'|'japanese'|'western'|'asian'|'salad'|'mexican'|'indian'} CuisineType
 */

/**
 * 식단 타입
 * @typedef {'nodiet'|'vegetarian'|'diet'|'light'|'seafood'|'vegan'} DietType
 */

/**
 * 날씨 타입
 * @typedef {'hot'|'cold'|'mild'|'rainy'} WeatherType
 */

/**
 * 기분/상황 타입
 * @typedef {'safe'|'exciting'|'team'|'executive'|'hangover'|'hearty'|'great'|'normal'|'stressed'|'celebration'} MoodType
 */

/**
 * 인원 타입
 * @typedef {'solo'|'small'|'medium'|'large'} PeopleType
 */

/**
 * 예산 타입
 * @typedef {'cheap'|'normal'|'expensive'} BudgetType
 */

// Export: 다른 파일에서 import 없이 JSDoc에서 사용 가능
export {};
