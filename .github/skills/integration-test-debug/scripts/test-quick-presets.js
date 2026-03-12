/**
 * KT 점심 추천기 - 빠른 추천 프리셋 통합 테스트
 * 
 * 실행: node .github/skills/integration-test-debug/scripts/test-quick-presets.js
 * 
 * 테스트 대상:
 * 1. 12개 QUICK_PRESETS 각각의 추천 결과 + 재추천 3회
 * 2. handleQuickRecommend (시간/계절 자동 추천) 시뮬레이션
 * 3. 프리셋 간 전환 시나리오 (diet 보존 로직)
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// 식당 데이터 로드
// ============================================================
const appCode = fs.readFileSync(path.join(__dirname, '../../../../src/App.js'), 'utf8');

const dbStart = appCode.indexOf('const restaurantDB = [');
if (dbStart === -1) { console.error('❌ restaurantDB를 찾을 수 없습니다'); process.exit(1); }

function findMatchingBracket(code, startIdx) {
  let depth = 0;
  for (let i = startIdx; i < code.length; i++) {
    if (code[i] === '[') depth++;
    else if (code[i] === ']') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

const bracketStart = appCode.indexOf('[', dbStart);
const dbEnd = findMatchingBracket(appCode, bracketStart);
const dbArrayStr = appCode.slice(bracketStart, dbEnd + 1);

let restaurantDB;
try {
  const fn = new Function(`return ${dbArrayStr}`);
  restaurantDB = fn();
  console.log(`✅ 식당 데이터 로드 성공: ${restaurantDB.length}개\n`);
} catch (e) { console.error('❌ 식당 데이터 파싱 실패:', e.message); process.exit(1); }

// ============================================================
// 매칭 함수들 (App.js와 동일)
// ============================================================
const categoryMap = { solo: 0, small: 1, medium: 2, large: 3 };

function matchWeather(r, weather) {
  if (!weather) return false;
  if (r.weather && Array.isArray(r.weather) && r.weather.includes(weather)) return true;
  const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
  if (weather === 'hot') return /냉면|콩국수|물회|냉모밀|빙수|샐러드|냉채/.test(text);
  if (weather === 'cold') return /국밥|탕|찌개|전골|라멘|설렁탕|갈비탕|부대/.test(text);
  if (weather === 'rainy') return /전|파전|수제비|칼국수|국밥|짬뽕/.test(text);
  return false;
}

function matchMood(r, mood) {
  if (!mood) return false;
  if (mood === 'hangover') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('hangover');
    const hasCat = r.category && (r.category.includes('국밥') || r.category.includes('해장') ||
      r.category.includes('탕') || r.category.includes('찌개') || r.category.includes('국'));
    return hasMoodTag || hasCat;
  }
  if (mood === 'executive') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('executive');
    return hasMoodTag || r.ribbon || (r.budget && Array.isArray(r.budget) && r.budget.includes('expensive'));
  }
  if (mood === 'team') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('team');
    return hasMoodTag || (r.people && Array.isArray(r.people) && (r.people.includes('large') || r.people.includes('medium')));
  }
  if (mood === 'sad') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('sad');
    const isComfortFood = r.mood && Array.isArray(r.mood) && (r.mood.includes('great') || r.mood.includes('exciting'));
    const category = r.category || '';
    const hasComfortCategory = category.includes('디저트') || category.includes('카페') ||
      category.includes('빵') || category.includes('떡볶이') || category.includes('치킨') ||
      category.includes('파스타') || category.includes('라멘');
    return hasMoodTag || isComfortFood || hasComfortCategory;
  }
  if (mood === 'exciting') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('exciting');
    const isSpecial = r.ribbon || (r.mood && Array.isArray(r.mood) && r.mood.includes('great'));
    const category = r.category || '';
    const hasExcitingCategory = category.includes('오마카세') || category.includes('코스') ||
      category.includes('프리미엄') || category.includes('스테이크');
    return hasMoodTag || isSpecial || hasExcitingCategory;
  }
  if (mood === 'hearty') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('hearty');
    const category = r.category || '';
    const isHearty = category.includes('구이') || category.includes('갈비') ||
      category.includes('삼겹') || category.includes('돈까스') || category.includes('카츠') ||
      category.includes('육') || category.includes('불고기') || category.includes('곱창');
    const isHighCal = r.calorie && r.calorie.label === '고칼로리';
    return hasMoodTag || isHearty || isHighCal;
  }
  if (mood === 'stressed') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('stressed');
    const category = r.category || '';
    const menuText = (r.menus || []).join(' ');
    const isStressRelief = category.includes('구이') || category.includes('매운') ||
      category.includes('불') || category.includes('마라') ||
      category.includes('떡볶이') || category.includes('닭갈비') ||
      category.includes('곱창') || category.includes('삼겹');
    const hasSpicyMenu = /매운|불닭|마라|떡볶이|쭈꾸미|닭발|엽기/.test(menuText);
    const isComfort = r.mood && Array.isArray(r.mood) && (r.mood.includes('hearty') || r.mood.includes('great'));
    return hasMoodTag || isStressRelief || hasSpicyMenu || isComfort;
  }
  return r.mood && Array.isArray(r.mood) && r.mood.includes(mood);
}

function matchPeople(r, peopleCategory) {
  if (!r.people || !Array.isArray(r.people)) return false;
  if (r.people.includes(peopleCategory)) return true;
  const userCat = categoryMap[peopleCategory];
  return r.people.some(p => categoryMap[p] !== undefined && Math.abs(categoryMap[p] - userCat) <= 1);
}

function matchDiet(r, diet) {
  if (!diet || diet === 'nodiet') return true;
  if (!r.diet || !Array.isArray(r.diet)) return false;
  if (diet === 'vegetarian') return r.diet.includes('vegetarian');
  if (diet === 'diet') return r.diet.includes('diet') || r.diet.includes('light');
  if (diet === 'light') return r.diet.includes('light') || r.diet.includes('diet');
  return false;
}

function parsePriceRange(r) {
  const priceStr = r.price || r.priceNote || '';
  const rangeMatch = priceStr.match(/(\d{1,3}(?:,?\d{3})*)\s*[~-]\s*(\d{1,3}(?:,?\d{3})*)/);
  if (rangeMatch) return { min: parseInt(rangeMatch[1].replace(/,/g, '')), max: parseInt(rangeMatch[2].replace(/,/g, '')) };
  const manRangeMatch = priceStr.match(/(\d+\.?\d*)\s*[~-]\s*(\d+\.?\d*)\s*만원/);
  if (manRangeMatch) return { min: Math.round(parseFloat(manRangeMatch[1]) * 10000), max: Math.round(parseFloat(manRangeMatch[2]) * 10000) };
  const manwonMatch = priceStr.match(/(\d+\.?\d*)\s*만원/);
  if (manwonMatch) { const p = Math.round(parseFloat(manwonMatch[1]) * 10000); return { min: p, max: p }; }
  const singleMatch = priceStr.match(/(\d{1,3}(?:,?\d{3})*)\s*원/);
  if (singleMatch) { const p = parseInt(singleMatch[1].replace(/,/g, '')); return { min: p, max: p }; }
  return null;
}

function matchBudget(r, budgetNum) {
  const parsed = parsePriceRange(r);
  if (!parsed) return false;
  const { min } = parsed;
  if (budgetNum >= min) return true;
  const tolerance = Math.max(2000, budgetNum * 0.15);
  return min - budgetNum <= tolerance;
}

function calculateScore(r, matches, budgetNum) {
  let totalScore = 0;
  const matchCount = matches.filter(Boolean).length;
  totalScore += matchCount * 20;
  if (r.rating) totalScore += parseFloat(r.rating) * 2;
  if (r.ribbon) totalScore += 10;
  const parsed = parsePriceRange(r);
  if (parsed && matches[4]) {
    const budgetDiff = Math.abs(parsed.min - budgetNum);
    if (parsed.min <= budgetNum) {
      if (budgetDiff < 2000) totalScore += 8;
      else if (budgetDiff < 5000) totalScore += 5;
      else totalScore += 2;
    } else {
      if (budgetDiff < 2000) totalScore += 3;
      else if (budgetDiff < 5000) totalScore -= 3;
      else totalScore -= Math.min(Math.round(budgetDiff / 1000), 10);
    }
  }
  return totalScore;
}

// ============================================================
// 시뮬레이션 엔진
// ============================================================
function simulate(settings, excludeNames = []) {
  const { weather, mood, people, diet, budget } = settings;
  const peopleCategory = people === 1 ? 'solo' : people <= 3 ? 'small' : people <= 6 ? 'medium' : 'large';
  const hasDietFilter = diet && diet !== 'nodiet';
  const excludeSet = new Set(excludeNames);

  return restaurantDB
    .filter(r => !excludeSet.has(r.name))
    .map(r => {
      const matches = [
        matchWeather(r, weather),
        matchMood(r, mood),
        matchPeople(r, peopleCategory),
        matchDiet(r, diet),
        matchBudget(r, budget)
      ];
      return {
        name: r.name,
        category: r.category,
        matchCount: matches.filter(Boolean).length,
        dietMatched: matches[3],
        weatherMatched: matches[0],
        moodMatched: matches[1],
        peopleMatched: matches[2],
        budgetMatched: matches[4],
        matches,
        score: calculateScore(r, matches, budget),
        price: r.price || r.priceNote || '미정',
        ribbon: r.ribbon || false,
        diet: r.diet || [],
        people: r.people || [],
        mood_tags: r.mood || [],
      };
    })
    .filter(r => {
      if (hasDietFilter && !r.dietMatched) return false;
      return r.matchCount >= 2;
    })
    .sort((a, b) => b.score - a.score);
}

// ============================================================
// QUICK_PRESETS 정의 (App.js와 동일)
// ============================================================
const QUICK_PRESETS = [
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

// ============================================================
// handleQuickRecommend 시뮬레이션 (시간/계절 기반 자동 설정)
// ============================================================
function simulateQuickRecommend(hour, month, userDiet = 'nodiet') {
  let mood = 'safe';
  if (hour >= 11 && hour < 13) mood = 'hearty';
  else if (hour >= 13 && hour < 14) mood = 'safe';
  else if (hour >= 14) mood = 'safe';

  let weather = 'mild';
  if (month >= 6 && month <= 8) weather = 'hot';
  else if (month >= 12 || month <= 2) weather = 'cold';
  // else: mild (default)

  return {
    weather,
    mood,
    people: 2,
    diet: userDiet !== 'nodiet' ? userDiet : 'nodiet',
    budget: 15000,
  };
}

// ============================================================
// 테스트 실행
// ============================================================
let totalPass = 0;
let totalFail = 0;
let totalWarn = 0;
const failures = [];
const warnings = [];

console.log('═'.repeat(70));
console.log('  KT 점심 추천기 - 빠른 추천 프리셋 통합 테스트');
console.log('  12개 프리셋 × (추천 + 재추천 3회) + 자동추천 시뮬레이션');
console.log('═'.repeat(70));

// ============================================================
// Test 1: 12개 QUICK_PRESETS 각각 테스트
// ============================================================
console.log(`\n${'═'.repeat(70)}`);
console.log('  📋 Part 1: QUICK_PRESETS 12개 프리셋별 추천 테스트');
console.log('═'.repeat(70));

QUICK_PRESETS.forEach((preset, idx) => {
  const results = simulate(preset.settings);
  const top10 = results.slice(0, 10);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📋 Preset ${idx + 1}/12: ${preset.emoji} ${preset.label}`);
  console.log(`   조건: W=${preset.settings.weather} M=${preset.settings.mood} P=${preset.settings.people} D=${preset.settings.diet} B=${preset.settings.budget.toLocaleString()}`);
  console.log(`   후보: ${results.length}개`);

  const hasDietFilter = preset.settings.diet && preset.settings.diet !== 'nodiet';

  // 검증 1: 최소 후보 수
  if (results.length < 3) {
    console.log(`   ❌ FAIL: 후보 ${results.length}개 (최소 3개 필요)`);
    totalFail++;
    failures.push(`${preset.label}: 후보 부족 (${results.length}개)`);
  } else {
    console.log(`   ✅ PASS: 후보 수 충분 (${results.length}개)`);
    totalPass++;
  }

  // 검증 2: 식단 필터
  if (hasDietFilter) {
    const dietViolations = top10.filter(r => !r.dietMatched);
    if (dietViolations.length > 0) {
      console.log(`   ❌ FAIL: 식단 필터 위반! ${dietViolations.map(r => r.name).join(', ')}`);
      totalFail++;
      failures.push(`${preset.label}: 식단 필터 위반`);
    } else {
      console.log(`   ✅ PASS: 식단 필터 정상 (${preset.settings.diet})`);
      totalPass++;
    }
  }

  // 검증 3: 날씨 관련성 (날씨 특화 프리셋에서)
  const weatherPresets = ['rainy', 'hot', 'cold'];
  if (weatherPresets.includes(preset.settings.weather) && top10.length > 0) {
    const weatherMatched = top10.filter(r => r.weatherMatched).length;
    const ratio = weatherMatched / top10.length;
    if (ratio < 0.3) {
      console.log(`   ❌ FAIL: 날씨 매칭률 ${(ratio * 100).toFixed(0)}% (30% 미만)`);
      totalFail++;
      failures.push(`${preset.label}: 날씨 매칭률 부족 (${(ratio * 100).toFixed(0)}%)`);
    } else {
      console.log(`   ✅ PASS: 날씨 매칭률 ${(ratio * 100).toFixed(0)}%`);
      totalPass++;
    }
  }

  // 검증 4: 기분 매칭률
  if (top10.length > 0) {
    const moodMatched = top10.filter(r => r.moodMatched).length;
    const ratio = moodMatched / top10.length;
    if (ratio < 0.3) {
      console.log(`   ❌ FAIL: 기분 매칭률 ${(ratio * 100).toFixed(0)}% (30% 미만)`);
      totalFail++;
      failures.push(`${preset.label}: 기분(${preset.settings.mood}) 매칭률 부족 (${(ratio * 100).toFixed(0)}%)`);
    } else {
      console.log(`   ✅ PASS: 기분 매칭률 ${(ratio * 100).toFixed(0)}% (mood=${preset.settings.mood})`);
      totalPass++;
    }
  }

  // 검증 5: 인원 매칭률
  if (top10.length > 0) {
    const peopleMatched = top10.filter(r => r.peopleMatched).length;
    const ratio = peopleMatched / top10.length;
    if (ratio < 0.5) {
      console.log(`   ⚠️ WARN: 인원 매칭률 ${(ratio * 100).toFixed(0)}% (50% 미만)`);
      totalWarn++;
      warnings.push(`${preset.label}: 인원 매칭률 낮음 (${(ratio * 100).toFixed(0)}%)`);
    } else {
      console.log(`   ✅ PASS: 인원 매칭률 ${(ratio * 100).toFixed(0)}%`);
      totalPass++;
    }
  }

  // 검증 6: 예산 매칭률
  if (top10.length > 0) {
    const budgetMatched = top10.filter(r => r.budgetMatched).length;
    const ratio = budgetMatched / top10.length;
    if (ratio < 0.3) {
      console.log(`   ⚠️ WARN: 예산 매칭률 ${(ratio * 100).toFixed(0)}% (30% 미만)`);
      totalWarn++;
      warnings.push(`${preset.label}: 예산 매칭률 낮음 (${(ratio * 100).toFixed(0)}%)`);
    } else {
      console.log(`   ✅ PASS: 예산 매칭률 ${(ratio * 100).toFixed(0)}%`);
      totalPass++;
    }
  }

  // 검증 7: 추천 품질 (Top 5의 매칭 카운트)
  if (top10.length >= 5) {
    const avgMatch = top10.slice(0, 5).reduce((sum, r) => sum + r.matchCount, 0) / 5;
    if (avgMatch < 3) {
      console.log(`   ⚠️ WARN: Top5 평균 매칭 수 ${avgMatch.toFixed(1)} (3 미만)`);
      totalWarn++;
      warnings.push(`${preset.label}: Top5 평균 매칭 수 낮음 (${avgMatch.toFixed(1)})`);
    } else {
      console.log(`   ✅ PASS: Top5 평균 매칭 수 ${avgMatch.toFixed(1)}`);
      totalPass++;
    }
  }

  // Top 3 표시
  console.log(`   Top 3:`);
  top10.slice(0, 3).forEach((r, i) => {
    const flags = [
      r.weatherMatched ? 'W✅' : 'W❌',
      r.moodMatched ? 'M✅' : 'M❌',
      r.peopleMatched ? 'P✅' : 'P❌',
      r.dietMatched ? 'D✅' : 'D❌',
      r.budgetMatched ? 'B✅' : 'B❌'
    ].join(' ');
    console.log(`     ${i + 1}. ${r.name} (score:${r.score}, match:${r.matchCount}) [${flags}]`);
  });
});

// ============================================================
// Test 2: 재추천 시뮬레이션 (각 프리셋별 3회)
// ============================================================
console.log(`\n${'═'.repeat(70)}`);
console.log('  🔄 Part 2: 프리셋별 재추천(다른 맛집) 시뮬레이션');
console.log('═'.repeat(70));

QUICK_PRESETS.forEach((preset, idx) => {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🔄 재추천 ${idx + 1}/12: ${preset.emoji} ${preset.label}`);

  let excluded = [];
  const allSeenNames = new Set();
  let allUnique = true;
  let resetTriggered = false;

  for (let round = 0; round <= 3; round++) {
    const results = simulate(preset.settings, excluded);
    const top10 = results.slice(0, 10);
    const roundLabel = round === 0 ? '최초' : `${round}회`;

    if (results.length < 3 && excluded.length > 0) {
      console.log(`   ℹ️ ${roundLabel}: 후보 ${results.length}개 → 소진 초기화 발동`);
      excluded = [];
      resetTriggered = true;
      const resetResults = simulate(preset.settings, []);
      console.log(`   ✅ 초기화 후 후보: ${resetResults.length}개`);
      break;
    }

    const newNames = top10.map(r => r.name);
    const duplicates = newNames.filter(n => allSeenNames.has(n));
    if (duplicates.length > 0 && !resetTriggered) {
      console.log(`   ❌ ${roundLabel}: 중복 발생! ${duplicates.join(', ')}`);
      allUnique = false;
    }

    newNames.forEach(n => allSeenNames.add(n));
    excluded = [...excluded, ...newNames].slice(0, 80);

    console.log(`   ${roundLabel}: 후보 ${results.length}개, 선택 ${top10.length}개, 누적제외 ${excluded.length}`);
  }

  if (allUnique) {
    console.log(`   ✅ PASS: 재추천 중복 없음 (총 ${allSeenNames.size}개 고유)`);
    totalPass++;
  } else {
    totalFail++;
    failures.push(`${preset.label}: 재추천 중복 발생`);
  }
});

// ============================================================
// Test 3: handleQuickRecommend 시뮬레이션 (다양한 시간/계절)
// ============================================================
console.log(`\n${'═'.repeat(70)}`);
console.log('  ⚡ Part 3: handleQuickRecommend 시간/계절 시뮬레이션');
console.log('═'.repeat(70));

const quickRecommendScenarios = [
  { label: '봄 점심 (3월 12시)', hour: 12, month: 3, expectedWeather: 'mild', expectedMood: 'hearty' },
  { label: '여름 점심 (7월 12시)', hour: 12, month: 7, expectedWeather: 'hot', expectedMood: 'hearty' },
  { label: '가을 오후 (10월 14시)', hour: 14, month: 10, expectedWeather: 'mild', expectedMood: 'safe' },
  { label: '겨울 이른 점심 (1월 11시)', hour: 11, month: 1, expectedWeather: 'cold', expectedMood: 'hearty' },
  { label: '겨울 늦은 점심 (12월 13시)', hour: 13, month: 12, expectedWeather: 'cold', expectedMood: 'safe' },
  { label: '봄 아침 (4월 9시)', hour: 9, month: 4, expectedWeather: 'mild', expectedMood: 'safe' },
  { label: '여름 늦은 오후 (8월 15시)', hour: 15, month: 8, expectedWeather: 'hot', expectedMood: 'safe' },
  { label: '가을 점심피크 (9월 12시30분)', hour: 12, month: 9, expectedWeather: 'mild', expectedMood: 'hearty' },
  // diet 보존 테스트
  { label: '봄 + 채식 보존', hour: 12, month: 3, userDiet: 'vegetarian', expectedWeather: 'mild', expectedMood: 'hearty' },
  { label: '여름 + 다이어트 보존', hour: 12, month: 7, userDiet: 'diet', expectedWeather: 'hot', expectedMood: 'hearty' },
];

quickRecommendScenarios.forEach((scenario, idx) => {
  const settings = simulateQuickRecommend(scenario.hour, scenario.month, scenario.userDiet || 'nodiet');

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`⚡ Quick ${idx + 1}/${quickRecommendScenarios.length}: ${scenario.label}`);
  console.log(`   생성된 설정: W=${settings.weather} M=${settings.mood} P=${settings.people} D=${settings.diet} B=${settings.budget}`);

  // 검증: 날씨/기분이 기대값과 일치하는지
  if (settings.weather !== scenario.expectedWeather) {
    console.log(`   ❌ FAIL: 날씨 불일치! 기대=${scenario.expectedWeather}, 실제=${settings.weather}`);
    totalFail++;
    failures.push(`Quick(${scenario.label}): 날씨 불일치 (기대=${scenario.expectedWeather}, 실제=${settings.weather})`);
  } else {
    console.log(`   ✅ PASS: 날씨 정상 (${settings.weather})`);
    totalPass++;
  }

  if (settings.mood !== scenario.expectedMood) {
    console.log(`   ❌ FAIL: 기분 불일치! 기대=${scenario.expectedMood}, 실제=${settings.mood}`);
    totalFail++;
    failures.push(`Quick(${scenario.label}): 기분 불일치 (기대=${scenario.expectedMood}, 실제=${settings.mood})`);
  } else {
    console.log(`   ✅ PASS: 기분 정상 (${settings.mood})`);
    totalPass++;
  }

  // diet 보존 검증
  if (scenario.userDiet && scenario.userDiet !== 'nodiet') {
    if (settings.diet !== scenario.userDiet) {
      console.log(`   ❌ FAIL: diet 보존 실패! 기대=${scenario.userDiet}, 실제=${settings.diet}`);
      totalFail++;
      failures.push(`Quick(${scenario.label}): diet 보존 실패`);
    } else {
      console.log(`   ✅ PASS: diet 보존 정상 (${settings.diet})`);
      totalPass++;
    }
  }

  // 추천 결과 검증
  const results = simulate(settings);
  const top10 = results.slice(0, 10);

  if (results.length < 3) {
    console.log(`   ❌ FAIL: 후보 ${results.length}개 (최소 3개 필요)`);
    totalFail++;
    failures.push(`Quick(${scenario.label}): 후보 부족`);
  } else {
    console.log(`   ✅ PASS: 후보 수 충분 (${results.length}개)`);
    totalPass++;
  }

  // diet 결과 검증
  const hasDietFilter = settings.diet && settings.diet !== 'nodiet';
  if (hasDietFilter) {
    const dietViolations = top10.filter(r => !r.dietMatched);
    if (dietViolations.length > 0) {
      console.log(`   ❌ FAIL: 식단 필터 위반! ${dietViolations.map(r => r.name).join(', ')}`);
      totalFail++;
      failures.push(`Quick(${scenario.label}): 식단 필터 위반`);
    } else {
      console.log(`   ✅ PASS: 식단 필터 정상`);
      totalPass++;
    }
  }

  // 재추천 1회 테스트
  const excluded = top10.map(r => r.name);
  const reResults = simulate(settings, excluded);
  if (reResults.length > 0) {
    const reDuplicates = reResults.slice(0, 10).filter(r => excluded.includes(r.name));
    if (reDuplicates.length > 0) {
      console.log(`   ❌ FAIL: 재추천 중복! ${reDuplicates.map(r => r.name).join(', ')}`);
      totalFail++;
      failures.push(`Quick(${scenario.label}): 재추천 중복`);
    } else {
      console.log(`   ✅ PASS: 재추천 중복 없음`);
      totalPass++;
    }
  }

  // Top 3 표시
  console.log(`   Top 3:`);
  top10.slice(0, 3).forEach((r, i) => {
    const flags = [r.weatherMatched ? 'W✅' : 'W❌', r.moodMatched ? 'M✅' : 'M❌',
      r.peopleMatched ? 'P✅' : 'P❌', r.budgetMatched ? 'B✅' : 'B❌'].join(' ');
    console.log(`     ${i + 1}. ${r.name} (score:${r.score}, match:${r.matchCount}) [${flags}]`);
  });
});

// ============================================================
// Test 4: 프리셋 전환 시나리오 (diet 보존 로직)
// ============================================================
console.log(`\n${'═'.repeat(70)}`);
console.log('  🔀 Part 4: 프리셋 전환 + diet 보존 시나리오');
console.log('═'.repeat(70));

const switchScenarios = [
  {
    label: '채식 선택 → 해장 프리셋 (diet 보존)',
    userDiet: 'vegetarian',
    presetIdx: 3, // 해장 모드
    expectedDiet: 'vegetarian',
  },
  {
    label: '다이어트 선택 → 팀점심 프리셋 (diet 보존)',
    userDiet: 'diet',
    presetIdx: 2, // 4인 팀 점심
    expectedDiet: 'diet',
  },
  {
    label: 'nodiet 선택 → 다이어트 프리셋 (프리셋 diet 사용)',
    userDiet: 'nodiet',
    presetIdx: 1, // 다이어트 점심
    expectedDiet: 'diet',
  },
  {
    label: 'nodiet 선택 → 채식 프리셋 (프리셋 diet 사용)',
    userDiet: 'nodiet',
    presetIdx: 11, // 채식 점심
    expectedDiet: 'vegetarian',
  },
  {
    label: 'light 선택 → 임원과 점심 (diet 보존)',
    userDiet: 'light',
    presetIdx: 6, // 임원과 점심
    expectedDiet: 'light',
  },
];

switchScenarios.forEach((scenario, idx) => {
  const preset = QUICK_PRESETS[scenario.presetIdx];

  // 프리셋 버튼 클릭 시 diet 보존 로직 시뮬레이션
  const resolvedDiet = scenario.userDiet !== 'nodiet' ? scenario.userDiet : preset.settings.diet;
  const settings = { ...preset.settings, diet: resolvedDiet };

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🔀 Switch ${idx + 1}: ${scenario.label}`);
  console.log(`   프리셋: ${preset.emoji} ${preset.label} (diet=${preset.settings.diet})`);
  console.log(`   유저 diet: ${scenario.userDiet} → 결과 diet: ${resolvedDiet}`);

  if (resolvedDiet !== scenario.expectedDiet) {
    console.log(`   ❌ FAIL: diet 결과 불일치! 기대=${scenario.expectedDiet}, 실제=${resolvedDiet}`);
    totalFail++;
    failures.push(`Switch(${scenario.label}): diet 불일치`);
  } else {
    console.log(`   ✅ PASS: diet 보존/전환 정상`);
    totalPass++;
  }

  // 실제 추천 결과 검증
  const results = simulate(settings);
  const top10 = results.slice(0, 10);
  const hasDietFilter = settings.diet && settings.diet !== 'nodiet';

  if (hasDietFilter && top10.length > 0) {
    const dietViolations = top10.filter(r => !r.dietMatched);
    if (dietViolations.length > 0) {
      console.log(`   ❌ FAIL: 전환 후 식단 필터 위반! ${dietViolations.map(r => r.name).join(', ')}`);
      totalFail++;
      failures.push(`Switch(${scenario.label}): 식단 필터 위반`);
    } else {
      console.log(`   ✅ PASS: 전환 후 식단 필터 정상 (diet=${settings.diet}, 후보 ${results.length}개)`);
      totalPass++;
    }
  } else {
    console.log(`   ✅ PASS: 전환 후 추천 정상 (후보 ${results.length}개)`);
    totalPass++;
  }
});

// ============================================================
// Test 5: 프리셋 설정값 유효성 검증
// ============================================================
console.log(`\n${'═'.repeat(70)}`);
console.log('  🔍 Part 5: 프리셋 설정값 유효성 검증');
console.log('═'.repeat(70));

const validWeathers = ['hot', 'mild', 'cold', 'rainy'];
const validMoods = ['safe', 'hearty', 'executive', 'hangover', 'team', 'exciting', 'stressed', 'sad'];
const validDiets = ['nodiet', 'light', 'diet', 'vegetarian'];

QUICK_PRESETS.forEach((preset, idx) => {
  const s = preset.settings;
  const issues = [];

  if (!validWeathers.includes(s.weather)) issues.push(`weather="${s.weather}" 유효하지 않음`);
  if (!validMoods.includes(s.mood)) issues.push(`mood="${s.mood}" 유효하지 않음`);
  if (!validDiets.includes(s.diet)) issues.push(`diet="${s.diet}" 유효하지 않음`);
  if (s.people < 1 || s.people > 8) issues.push(`people=${s.people} 범위 외 (1-8)`);
  if (s.budget < 8000 || s.budget > 30000) issues.push(`budget=${s.budget} 범위 외 (8000-30000)`);
  if (!s.weather || !s.mood || !s.diet || !s.people || !s.budget) issues.push('필수 필드 누락');

  if (issues.length > 0) {
    console.log(`   ❌ FAIL: ${preset.emoji} ${preset.label}: ${issues.join(', ')}`);
    totalFail++;
    failures.push(`설정값(${preset.label}): ${issues.join(', ')}`);
  } else {
    console.log(`   ✅ PASS: ${preset.emoji} ${preset.label} — 모든 설정값 유효`);
    totalPass++;
  }
});

// ============================================================
// 최종 결과
// ============================================================
console.log('\n' + '═'.repeat(70));
console.log(`  📊 최종 결과: ${totalPass} PASS / ${totalFail} FAIL / ${totalWarn} WARN`);
console.log('═'.repeat(70));

if (warnings.length > 0) {
  console.log('\n⚠️ 경고 항목:');
  warnings.forEach(w => console.log(`  - ${w}`));
}

if (failures.length > 0) {
  console.log('\n❌ 실패 항목:');
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log('\n✅ 모든 테스트 통과!');
  process.exit(0);
}
