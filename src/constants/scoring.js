/**
 * @fileoverview 추천 알고리즘 점수 가중치 상수
 * 식당 추천 점수 계산에 사용되는 모든 가중치와 키워드
 */

/**
 * 상황 적응형 동적 가중치 프로필
 * 각 상황에서 5개 차원(weather, mood, people, diet, budget)의 중요도를 다르게 설정
 * 합계 = 100 (정규화)
 */
export const WEIGHT_PROFILES = {
  // 기본 (mood가 safe 등 일반적일 때)
  default:   { weather: 20, mood: 20, people: 20, diet: 20, budget: 20 },
  
  // 해장: 음식 종류(mood)가 압도적으로 중요, 날씨는 부차적
  hangover:  { weather: 10, mood: 40, people: 10, diet: 10, budget: 30 },
  
  // 격식: 분위기(mood) + 가격(budget)이 핵심
  executive: { weather: 5,  mood: 35, people: 20, diet: 10, budget: 30 },
  
  // 팀점심: 인원수 + 분위기가 핵심
  team:      { weather: 15, mood: 20, people: 30, diet: 15, budget: 20 },
  
  // 든든하게: 음식 종류(mood)가 중요
  hearty:    { weather: 15, mood: 30, people: 15, diet: 15, budget: 25 },
  
  // 특별한 날: mood + 가격 둘 다 중요
  exciting:  { weather: 10, mood: 30, people: 15, diet: 10, budget: 35 },
  
  // 우울: mood가 중요, 기분전환 음식
  sad:       { weather: 15, mood: 35, people: 15, diet: 15, budget: 20 },
  
  // 스트레스: 매운/자극적 음식이 중요
  stressed:  { weather: 15, mood: 35, people: 15, diet: 10, budget: 25 },
  
  // 비 오는 날: 날씨 적합성이 최우선
  rainy:     { weather: 35, mood: 20, people: 15, diet: 15, budget: 15 },
  
  // 더울 때: 시원한 메뉴가 중요
  hot:       { weather: 30, mood: 20, people: 15, diet: 15, budget: 20 },
  
  // 추울 때: 따뜻한 메뉴 중요
  cold:      { weather: 25, mood: 20, people: 15, diet: 20, budget: 20 },
  
  // 식단 관리 (다이어트/채식/가볍게): 식단이 가장 중요
  diet:      { weather: 15, mood: 15, people: 15, diet: 35, budget: 20 },
};

/**
 * 상황에 맞는 가중치 프로필 선택
 * @param {Object} selections - { weather, mood, diet, people, budget }
 * @returns {Object} { weather, mood, people, diet, budget } 가중치
 */
export function getWeightProfile(selections) {
  // 1순위: 식단이 특수하면 diet 프로필
  if (selections.diet && selections.diet !== 'nodiet') {
    return WEIGHT_PROFILES.diet;
  }
  // 2순위: mood가 핵심 상황이면 mood 프로필
  if (selections.mood && WEIGHT_PROFILES[selections.mood]) {
    return WEIGHT_PROFILES[selections.mood];
  }
  // 3순위: 날씨가 극단적이면 날씨 프로필
  if (selections.weather && ['rainy', 'hot', 'cold'].includes(selections.weather)) {
    return WEIGHT_PROFILES[selections.weather];
  }
  return WEIGHT_PROFILES.default;
}

/**
 * 네거티브 어피니티 — 필터 통과했지만 "약간 부적합"한 식당 감점
 * @param {Object} restaurant - 식당 객체
 * @param {Object} selections - 사용자 선택
 * @returns {number} 감점 (0 또는 음수)
 */
export function getNegativeAffinityPenalty(restaurant, selections) {
  let penalty = 0;
  const category = (restaurant.category || '').toLowerCase();
  const cuisine = restaurant.cuisine || '';
  
  if (selections.mood === 'hangover') {
    // 해장인데 양식 계열이 필터 통과 시 — 낮은 적합도
    if (cuisine === 'western') penalty -= 15;
    // 일식 중 라멘/우동은 OK, 나머지는 감점
    if (cuisine === 'japanese' && !/라멘|우동/.test(category)) penalty -= 10;
    // 멕시칸/인도 커리 — 해장에 덜 적합
    if (cuisine === 'mexican' || cuisine === 'indian') penalty -= 12;
  }
  
  if (selections.mood === 'executive') {
    // 격식인데 캐주얼 분위기
    if (/포차|주점|선술집|편의점/.test(category)) penalty -= 20;
    // 격식인데 체인 분식
    if (/분식|떡볶이|김밥천국/.test(category)) penalty -= 20;
  }
  
  if (selections.mood === 'hearty') {
    // 든든하게인데 저칼로리/가벼운 식당
    if (restaurant.calorie && restaurant.calorie.label === '저칼로리') penalty -= 10;
    if (/샐러드|포케|요거트|그릭요거트/.test(category)) penalty -= 15;
  }
  
  if (selections.mood === 'sad') {
    // 기분전환인데 너무 평범한 식당 (약간만 감점)
    if (/백반|구내식당/.test(category)) penalty -= 8;
  }
  
  if (selections.mood === 'stressed') {
    // 스트레스 해소에 가벼운 식사는 부적합
    if (/샐러드|포케|요거트|그릭요거트/.test(category)) penalty -= 12;
    // 격식 있는 환경은 스트레스 가중
    if (/오마카세|파인다이닝|코스/.test(category)) penalty -= 10;
  }
  
  if (selections.mood === 'exciting') {
    // 신나는 날에 분위기 없는 식당 감점
    if (/국밥|해장국|순대국|북어국|설렁탕|곰탕|백반/.test(category)) penalty -= 15;
    if (/샐러드|포케|요거트|그릭요거트/.test(category)) penalty -= 12;
    if (/분식|떡볶이|김밥|순두부/.test(category)) penalty -= 10;
  }
  
  // 날씨별 부적합
  if (selections.weather === 'hot') {
    // 더운 날 뜨거운 국물류 약간 감점 (하드 블록은 아님)
    if (/전골|부대찌개|샤브샤브/.test(category)) penalty -= 8;
  }
  
  if (selections.weather === 'cold') {
    // 추운 날 차가운 음식 (이미 샐러드는 하드 블록, 추가 방어)  
    if (/냉면|물회|콩국수|빙수/.test(category)) penalty -= 15;
  }
  
  return penalty;
}

/**
 * 추천 알고리즘 점수 가중치
 * 각 기준별 점수 증감 값 정의
 * @type {Object}
 */
export const SCORING_WEIGHTS = {
  // 카테고리 매칭
  category: {
    match: 20,              // 카테고리 일치 시 보너스
  },
  
  // 식단 매칭
  diet: {
    vegetarian: 100,        // 채식 매칭 시 매우 높은 보너스
    diet_match: 20,         // 다이어트/가벼운 식사 매칭
    light_mismatch: -10,    // 가벼운 식사 불일치 시 감점
    light_match: 15,        // 가벼운 식사 일치 시 보너스
  },
  
  // 날씨 매칭
  weather: {
    match: 50,              // 날씨 조건 일치 시 보너스
    mismatch: -15,          // 날씨 조건 불일치 시 감점
  },
  
  // 기분 매칭
  mood: {
    match: 60,              // 기분 조건 일치 시 최고 보너스
    mismatch: -15,          // 기분 조건 불일치 시 감점
  },
  
  // 인원 매칭
  people: {
    exact_match: 20,        // 정확한 인원 매칭
    flexible_match_1: 10,   // 유연한 매칭 (인접 범위)
    flexible_match_2: 5,    // 유연한 매칭 (넓은 범위)
    mismatch: -10,          // 인원 불일치
    solo_waiting: -15,      // 혼밥 + 웨이팅 긴 곳 감점
  },
  
  // 예산 매칭
  budget: {
    match: 15,              // 예산 범위 매칭
    exact_match: 10,        // 정확한 예산 매칭 추가 보너스
    mismatch: -15,          // 예산 불일치
  },
  
  // 평점 및 특별 요소
  quality: {
    ribbon: 10,             // 블루리본 선정 보너스
    rating_multiplier: 5,   // 평점 1점당 가중치 (4.0 기준)
  },
  
  // 최근 방문 패널티
  recent_visit: {
    base_penalty: 20,       // 최근 방문 기본 감점
    decay_per_item: 1,      // 방문 순서별 감점 감소량
  },
  
  // 다양성 랜덤 점수
  diversity: {
    random_max: 50,         // 랜덤 점수 최대값 (다양성 확보)
  },
  
  // 완전 제외 점수
  exclude: -999,            // 조건 불충족 시 제외
};

/**
 * 다이어트 모드 제외 키워드
 * 고칼로리 음식 카테고리
 * @type {string[]}
 */
export const DIET_EXCLUDE_KEYWORDS = [
  // 국물 요리
  '국밥', '국', '탕', '전골', '찌개', '뚝배기',
  
  // 밥류
  '덮밥', '돈부리', '돌솥밥',
  
  // 튀김류
  '튀김', '치킨', '돈까스', '카츠', '텐동', '가라아게', '크리스피', '프라이',
  
  // 분식류
  '분식', '떡볶이', '순대', '김밥',
  
  // 면류 (국물 면)
  '라멘', '라면', '우동', '소바',
  
  // 고칼로리 육류 구이
  '갈비', '구이', '석갈비', '삼겹살', '목살', '항정살',
  
  // 고칼로리 양식
  '피자', '파스타',
  
  // 패스트푸드
  '햄버거', '버거',
  
  // 기타 국물 요리
  '곰탕', '설렁탕', '육개장'
];

/**
 * 채식 선호 키워드
 * 채식 가능한 음식 카테고리
 * @type {string[]}
 */
export const VEGETARIAN_KEYWORDS = [
  '샐러드', '비건', '채식', '야채', '샌드위치', 
  '아보카도', '두부', '나물', '비빔밥'
];

/**
 * 숙취 해소 제외 키워드
 * 해장에 적합하지 않은 음식
 * @type {string[]}
 */
export const HANGOVER_EXCLUDE_KEYWORDS = [
  '피자', '파스타', '파이프', '이탈리안'
];

/**
 * 숙취 해소 포함 카테고리
 * 해장에 좋은 음식 카테고리
 * @type {string[]}
 */
export const HANGOVER_INCLUDE_CATEGORIES = [
  '국밥', '해장', '탕', '찌개', '국'
];

/**
 * 임원 식사 적합 조건
 * 격식 있는 식사 판단 기준
 * @type {Object}
 */
export const EXECUTIVE_CRITERIA = {
  min_rating: 4.3,        // 최소 평점 기준
  has_ribbon: true,       // 블루리본 선정 여부
  has_expensive: true,    // 고가 예산 범위 포함
};
