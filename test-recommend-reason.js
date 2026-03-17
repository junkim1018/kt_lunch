/**
 * recommendReason 시뮬레이션 테스트
 * primary(DB reason) + tags(동적 이유) 조합 확인
 *
 * 실행: node test-recommend-reason.js
 */
const { restaurantDB } = require('./src/data/restaurantData');

// ── 시나리오별 동적 이유 생성 ──
function buildReasons(restaurant, scenario) {
  const reasons = [];

  // 날씨
  const weatherMap = {
    hot: '🌡️ 더운 날 딱 맞는 메뉴',
    cold: '❄️ 추운 날 몸 녹이기 좋은 메뉴',
    rainy: '☔ 비 오는 날 생각나는 메뉴',
    mild: '🌤️ 선선한 날씨에 제격',
  };
  if (restaurant.weather?.includes(scenario.weather)) {
    reasons.push(weatherMap[scenario.weather]);
  }

  // 기분
  const moodMap = {
    hangover: '💊 해장에 최고',
    formal: '🤵 격식있는 자리에 적합',
    team: '👥 팀 점심으로 추천',
    hungry: '🍖 든든하게 배부르게',
    exciting: '🎉 특별한 날 분위기 좋음',
    sad: '😌 기분 전환에 좋은 맛',
    stress: '🔥 스트레스 해소에 딱',
    safe: '😊 무난하고 안전한 선택',
  };
  if (restaurant.mood?.includes(scenario.mood)) {
    reasons.push(moodMap[scenario.mood]);
  }

  // 인원
  const people = scenario.people;
  if (people === 1 && restaurant.people?.includes('solo')) {
    reasons.push('🧍 혼밥하기 편한 곳');
  } else if (people <= 3 && restaurant.people?.includes('small')) {
    reasons.push('👫 소수 인원 최적');
  } else if (people <= 5 && restaurant.people?.includes('medium')) {
    reasons.push('👨‍👨‍👦‍👦 중간 규모 모임에 좋음');
  } else if (people >= 6 && restaurant.people?.includes('large')) {
    reasons.push('👨‍👩‍👧‍👦 단체 손님 환영');
  }

  // 예산
  const budget = scenario.budget;
  if (budget <= 10000 && restaurant.budget?.includes('cheap')) {
    reasons.push(`💰 ${Math.floor(budget / 1000)}천원대 가성비 최고`);
  } else if (budget <= 15000 && restaurant.budget?.includes('normal')) {
    reasons.push('💵 만원 초반 합리적 가격');
  } else if (budget > 15000 && restaurant.budget?.includes('expensive')) {
    reasons.push('💎 가격 대비 만족도 높음');
  }

  // 식단
  if (restaurant.diet?.includes('vegan')) reasons.push('🥗 채식 메뉴 가능');
  if (restaurant.diet?.includes('diet')) reasons.push('🏃 다이어트 추천');
  if (restaurant.diet?.includes('light')) reasons.push('🍃 가볍게 먹기 좋음');

  // 특별 속성
  if (restaurant.ribbon) reasons.push('🏅 블루리본 인증');
  if (parseFloat(restaurant.rating) >= 4.5) reasons.push(`⭐ 평점 ${restaurant.rating}★`);
  if (restaurant.walk?.includes('1분') || restaurant.walk?.includes('2분')) {
    const m = restaurant.walk.match(/(\d+)분/);
    if (m) reasons.push(`🚶 도보 ${m[1]}분 이내`);
  }
  if (!restaurant.waiting) reasons.push('✅ 대기 없이 바로');
  if (restaurant.calorie?.label === '저칼로리') reasons.push('🥬 저칼로리');

  return reasons;
}

// ── recommendReason 구조 생성 (App.js 712-731 그대로) ──
function buildRecommendReason(restaurant, reasons) {
  const uniqueReasons = [];
  const contextReasons = [];
  const weatherReasons = [];

  reasons.forEach(reason => {
    if (/블루리본|평점|도보|대기 없이|저칼로리|시즌/.test(reason)) {
      uniqueReasons.push(reason);
    } else if (/추운 날|더운 날|비 오는|선선한/.test(reason)) {
      weatherReasons.push(reason);
    } else {
      contextReasons.push(reason);
    }
  });

  const orderedReasons = [...uniqueReasons, ...contextReasons, ...weatherReasons];

  return {
    primary: restaurant.reason || '추천 맛집',
    tags: orderedReasons.slice(0, 4),
  };
}

// ── 시나리오 정의 ──
const scenarios = [
  { label: '☀️ 시나리오 1: 더운 날·무난·2명·12,000원', weather: 'hot', mood: 'safe', people: 2, budget: 12000 },
  { label: '☔ 시나리오 2: 비 오는 날·해장·1명·10,000원', weather: 'rainy', mood: 'hangover', people: 1, budget: 10000 },
  { label: '🌤️ 시나리오 3: 선선한 날·팀회식·6명·20,000원', weather: 'mild', mood: 'team', people: 6, budget: 20000 },
];

// ── 실행 ──
scenarios.forEach(scenario => {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${scenario.label}`);
  console.log('═'.repeat(70));

  // 조건에 1개 이상 부합하는 식당 필터 → 랜덤 5개
  const candidates = restaurantDB.filter(r =>
    r.weather?.includes(scenario.weather) ||
    r.mood?.includes(scenario.mood)
  );

  const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, 5);

  shuffled.forEach((r, i) => {
    const reasons = buildReasons(r, scenario);
    const rec = buildRecommendReason(r, reasons);

    console.log(`\n  [${i + 1}] ${r.name}  (${r.category})`);
    console.log(`  ── primary ──`);
    console.log(`     "${rec.primary}"`);
    console.log(`  ── tags (${rec.tags.length}개) ──`);
    rec.tags.forEach(tag => console.log(`     • ${tag}`));
    if (reasons.length > 4) {
      console.log(`     (... +${reasons.length - 4}개 미표시)`);
    }
  });
});

console.log('\n' + '═'.repeat(70));
console.log('  ✅ 시뮬레이션 완료');
console.log('═'.repeat(70) + '\n');
