// UI 옵션, 라벨, 프리셋 상수

export const OPTIONS = {
  weather: [
    { value: "hot", emoji: "☀️", label: "더워요", sub: "25°C 이상" },
    { value: "mild", emoji: "🌤️", label: "선선해요", sub: "15~24°C" },
    { value: "cold", emoji: "🥶", label: "추워요", sub: "14°C 이하" },
    { value: "rainy", emoji: "🌧️", label: "비 와요", sub: "우중충한 날" },
  ],
  mood: [
    { value: "safe", emoji: "😊", label: "무난하게", sub: "평소처럼 적당히" },
    { value: "hearty", emoji: "💪", label: "든든하게", sub: "배부르게 먹고 싶어요" },
    { value: "executive", emoji: "👔", label: "임원과 함께", sub: "격식 있는 자리" },
    { value: "hangover", emoji: "🤢", label: "숙취 해장", sub: "뜨끈한 국물이 당겨요" },
    { value: "team", emoji: "👥", label: "팀점심", sub: "다같이 먹어요" },
    { value: "exciting", emoji: "🎉", label: "신나는 날", sub: "오늘은 특별하게!" },
    { value: "stressed", emoji: "😤", label: "스트레스", sub: "매운 거 땡겨요" },
    { value: "sad", emoji: "😢", label: "우울해요", sub: "달콤한 위로가 필요해요" },
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

export const LABELS = {
  weather: { hot:"더운 날씨", mild:"선선한 날", cold:"추운 날", rainy:"비 오는 날" },
  mood: { safe:"무난하게", hearty:"든든하게", executive:"임원과 함께", hangover:"숙취 해장", team:"팀점심", exciting:"신나는 날", stressed:"스트레스", sad:"우울해요" },
  people: { solo:"혼밥", small:"2~3명", medium:"4~6명", large:"7명 이상" },
  diet: { nodiet:"식단 자유", light:"가볍게", diet:"다이어트 중", vegetarian:"채식 선호" },
  budget: { cheap:"1만원 이하", normal:"1~2만원", expensive:"2만원 이상" },
};

export const SECTION_TITLES = {
  weather: "오늘 날씨가 어때요?",
  mood: "오늘 기분은요?",
  people: "몇 명이서 먹어요?",
  diet: "식단 관리 중이에요?",
  budget: "1인 예산은요?",
};

export const BUDGET_COMPAT = {
  cheap:     ["cheap"],
  normal:    ["cheap", "normal"],
  expensive: ["expensive"],
};

export const QUICK_PRESETS = [
  { emoji: '🌧️', label: '비 오는 날 국물 점심', settings: { weather: 'rainy', mood: 'hearty', people: 2, diet: 'nodiet', budget: 12000 } },
  { emoji: '🥗', label: '다이어트 점심', settings: { weather: 'hot', mood: 'safe', people: 1, diet: 'diet', budget: 12000 } },
  { emoji: '👥', label: '4인 팀 점심', settings: { weather: 'mild', mood: 'team', people: 4, diet: 'nodiet', budget: 18000 } },
  { emoji: '🤢', label: '해장 모드', settings: { weather: 'cold', mood: 'hangover', people: 2, diet: 'nodiet', budget: 12000 } },
  { emoji: '🔥', label: '더운 날 시원한 점심', settings: { weather: 'hot', mood: 'safe', people: 2, diet: 'light', budget: 15000 } },
  { emoji: '❄️', label: '추운 날 따뜻한 점심', settings: { weather: 'cold', mood: 'hearty', people: 2, diet: 'nodiet', budget: 15000 } },
  { emoji: '💼', label: '임원과 점심', settings: { weather: 'mild', mood: 'executive', people: 3, diet: 'nodiet', budget: 25000 } },
  { emoji: '🎉', label: '특별한 날', settings: { weather: 'mild', mood: 'exciting', people: 4, diet: 'nodiet', budget: 25000 } },
  { emoji: '😔', label: '위로가 필요해', settings: { weather: 'mild', mood: 'sad', people: 2, diet: 'nodiet', budget: 15000 } },
  { emoji: '🍜', label: '혼자 간단하게', settings: { weather: 'mild', mood: 'safe', people: 1, diet: 'nodiet', budget: 10000 } },
  { emoji: '🥘', label: '든든한 한 끼', settings: { weather: 'mild', mood: 'hearty', people: 2, diet: 'nodiet', budget: 15000 } },
  { emoji: '🌿', label: '채식 점심', settings: { weather: 'mild', mood: 'safe', people: 1, diet: 'vegetarian', budget: 15000 } },
];
