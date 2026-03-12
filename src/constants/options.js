/**
 * @fileoverview 사용자 선택 옵션 및 레이블 상수
 * 날씨, 기분, 인원, 식단, 예산 등 필터 옵션 정의
 */

/**
 * @typedef {Object} OptionItem
 * @property {string} value - 옵션 값
 * @property {string} emoji - 표시할 이모지
 * @property {string} label - 주 레이블
 * @property {string} sub - 부가 설명
 */

/**
 * 사용자 선택 가능한 모든 필터 옵션
 * @type {Object.<string, OptionItem[]>}
 */
export const OPTIONS = {
  weather: [
    { value: "hot", emoji: "☀️", label: "더워요", sub: "25°C 이상" },
    { value: "mild", emoji: "🌤️", label: "선선해요", sub: "15~24°C" },
    { value: "cold", emoji: "🥶", label: "추워요", sub: "14°C 이하" },
    { value: "rainy", emoji: "🌧️", label: "비 와요", sub: "우중충한 날" },
  ],
  mood: [
    { value: "safe", emoji: "😊", label: "무난함", sub: "적당한 선택" },
    { value: "hearty", emoji: "💪", label: "든든하게", sub: "배부르게 먹고 싶어요" },
    { value: "executive", emoji: "👔", label: "임원과 함께", sub: "격식 있는 자리" },
    { value: "hangover", emoji: "🤢", label: "숙취", sub: "국물이 당겨요" },
    { value: "team", emoji: "👥", label: "팀점심", sub: "단체 식사" },
    { value: "exciting", emoji: "🎉", label: "신나는 날", sub: "특별한 음식" },
    { value: "sad", emoji: "😢", label: "우울해요", sub: "위로가 필요해요" },
  ],
  people: [
    { value: "solo", emoji: "🙋", label: "혼밥", sub: "나 혼자" },
    { value: "small", emoji: "👫", label: "2~3명", sub: "소수 정예" },
    { value: "medium", emoji: "👥", label: "4~6명", sub: "팀 점심" },
    { value: "large", emoji: "🎉", label: "7명 이상", sub: "단체 회식" },
  ],
  diet: [
    { value: "nodiet", emoji: "🍖", label: "아니요", sub: "다 먹어요" },
    { value: "light", emoji: "🥗", label: "가볍게", sub: "칼로리 신경써요" },
    { value: "diet", emoji: "💪", label: "다이어트 중", sub: "저칼로리만요" },
    { value: "vegetarian", emoji: "🌿", label: "채식 선호", sub: "고기 안 먹어요" },
  ],
  budget: [
    { value: "cheap", emoji: "💸", label: "~1만원", sub: "가성비 최고" },
    { value: "normal", emoji: "💳", label: "1~2만원", sub: "보통 수준" },
    { value: "expensive", emoji: "💎", label: "2만원 이상", sub: "특별하게" },
  ],
};

/**
 * 옵션 값에 대한 간결한 레이블 매핑
 * @type {Object.<string, Object.<string, string>>}
 */
export const LABELS = {
  weather: { 
    hot: "더운 날씨", 
    mild: "선선한 날", 
    cold: "추운 날", 
    rainy: "비 오는 날" 
  },
  mood: { 
    safe: "무난함", 
    hearty: "든든하게", 
    executive: "임원과 함께", 
    hangover: "숙취", 
    team: "팀점심", 
    exciting: "신나는 날", 
    sad: "우울해요" 
  },
  people: { 
    solo: "혼밥", 
    small: "2~3명", 
    medium: "4~6명", 
    large: "7명 이상" 
  },
  diet: { 
    nodiet: "식단 자유", 
    light: "가볍게", 
    diet: "다이어트 중", 
    vegetarian: "채식 선호" 
  },
  budget: { 
    cheap: "1만원 이하", 
    normal: "1~2만원", 
    expensive: "2만원 이상" 
  },
};

/**
 * 각 필터 섹션의 제목
 * @type {Object.<string, string>}
 */
export const SECTION_TITLES = {
  weather: "오늘 날씨가 어때요?",
  mood: "오늘 기분은요?",
  people: "몇 명이서 먹어요?",
  diet: "식단 관리 중이에요?",
  budget: "1인 예산은요?",
};
