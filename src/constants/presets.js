/**
 * @fileoverview 빠른 추천 프리셋 상수
 * 자주 사용하는 조건 조합을 프리셋으로 제공
 */

/**
 * @typedef {Object} PresetSettings
 * @property {string} weather - 날씨 조건
 * @property {string} mood - 기분 조건
 * @property {number} people - 인원 수
 * @property {string} diet - 식단 조건
 * @property {number} budget - 1인 예산 (원)
 */

/**
 * @typedef {Object} QuickPreset
 * @property {string} emoji - 프리셋 아이콘
 * @property {string} label - 프리셋 이름
 * @property {PresetSettings} settings - 설정 값
 */

/**
 * 빠른 추천 프리셋 목록
 * UI에서는 이 중 4개를 랜덤으로 선택하여 표시
 * @type {QuickPreset[]}
 */
export const QUICK_PRESETS = [
  { 
    emoji: '🌧️', 
    label: '비 오는 날 국물 점심', 
    settings: { weather: 'rainy', mood: 'hearty', people: 2, diet: 'nodiet', budget: 12000 } 
  },
  { 
    emoji: '🥗', 
    label: '다이어트 점심', 
    settings: { weather: 'hot', mood: 'safe', people: 1, diet: 'diet', budget: 12000 } 
  },
  { 
    emoji: '👥', 
    label: '4인 팀 점심', 
    settings: { weather: 'mild', mood: 'team', people: 4, diet: 'nodiet', budget: 18000 } 
  },
  { 
    emoji: '🤢', 
    label: '해장 모드', 
    settings: { weather: 'cold', mood: 'hangover', people: 2, diet: 'nodiet', budget: 12000 } 
  },
  { 
    emoji: '🔥', 
    label: '더운 날 시원한 점심', 
    settings: { weather: 'hot', mood: 'safe', people: 2, diet: 'light', budget: 15000 } 
  },
  { 
    emoji: '❄️', 
    label: '추운 날 따뜻한 점심', 
    settings: { weather: 'cold', mood: 'hearty', people: 2, diet: 'nodiet', budget: 15000 } 
  },
  { 
    emoji: '💼', 
    label: '임원과 점심', 
    settings: { weather: 'mild', mood: 'executive', people: 3, diet: 'nodiet', budget: 25000 } 
  },
  { 
    emoji: '🎉', 
    label: '특별한 날', 
    settings: { weather: 'mild', mood: 'exciting', people: 4, diet: 'nodiet', budget: 25000 } 
  },
  { 
    emoji: '😔', 
    label: '위로가 필요해', 
    settings: { weather: 'mild', mood: 'sad', people: 2, diet: 'nodiet', budget: 15000 } 
  },
  { 
    emoji: '🍜', 
    label: '혼자 간단하게', 
    settings: { weather: 'mild', mood: 'safe', people: 1, diet: 'nodiet', budget: 10000 } 
  },
  { 
    emoji: '🥘', 
    label: '든든한 한 끼', 
    settings: { weather: 'mild', mood: 'hearty', people: 2, diet: 'nodiet', budget: 15000 } 
  },
  { 
    emoji: '🌿', 
    label: '채식 점심', 
    settings: { weather: 'mild', mood: 'safe', people: 1, diet: 'vegetarian', budget: 15000 } 
  },
];
