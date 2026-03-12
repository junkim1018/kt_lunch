/**
 * @fileoverview 추천 알고리즘 점수 가중치 상수
 * 식당 추천 점수 계산에 사용되는 모든 가중치와 키워드
 */

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
