/**
 * KT 점심 추천기 통합 시뮬레이션 테스트 v2
 * 
 * 실행: node .github/skills/integration-test-debug/scripts/simulate-recommendations.js
 * 
 * 모든 카테고리(날씨, 기분, 식단, 인원, 예산)를 최소 2회 이상 테스트하며
 * 재추천(다른 맛집 추천하기) 로직도 포함하여 검증합니다.
 */

const fs = require('fs');
const path = require('path');

// 식당 데이터 로드 (src/data/restaurantData.js)
function loadDataFromFile(filePath, varName) {
  const code = fs.readFileSync(filePath, 'utf8');
  const match = code.match(new RegExp(`(?:export\\s+)?(?:const|let|var)\\s+${varName}\\s*=\\s*`));
  if (!match) return null;
  const startIdx = match.index + match[0].length;
  let depth = 0, end = -1;
  const opener = code[startIdx];
  const closer = opener === '[' ? ']' : '}';
  for (let i = startIdx; i < code.length; i++) {
    if (code[i] === opener) depth++;
    else if (code[i] === closer) { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  return new Function(`return ${code.slice(startIdx, end)}`)();
}

const dataPath = path.join(__dirname, '../../../../src/data/restaurantData.js');
const restaurantDB = loadDataFromFile(dataPath, 'restaurantDB');
if (!restaurantDB) { console.error('❌ restaurantDB를 찾을 수 없습니다'); process.exit(1); }
console.log(`✅ 식당 데이터 로드 성공: ${restaurantDB.length}개\n`);

// ============================================================
// 매칭 함수들 (App.js와 동일한 로직)
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
    const hasHangoverCategory = r.category && 
      /(국밥|순대국|해장국|해장|육개장|감자탕|뼈다귀|곰탕|설렁탕|탕|찌개)/.test(r.category);
    return hasMoodTag || hasHangoverCategory;
  }
  
  if (mood === 'executive') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('executive');
    const isUpscale = r.ribbon || (r.budget && Array.isArray(r.budget) && r.budget.includes('expensive'));
    const category = r.category || '';
    const isCasual = /(순대|분식|떡볶이|김밥|국밥|백반|푸드코트)/.test(category);
    return hasMoodTag || (isUpscale && !isCasual);
  }
  
  if (mood === 'team') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('team');
    return hasMoodTag || (r.people && Array.isArray(r.people) && (r.people.includes('large') || r.people.includes('medium')));
  }
  
  if (mood === 'sad') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('sad');
    const isComfortFood = r.mood && Array.isArray(r.mood) && 
      (r.mood.includes('great') || r.mood.includes('exciting'));
    const category = r.category || '';
    const hasComfortCategory = category.includes('디저트') || category.includes('카페') || 
      category.includes('빵') || category.includes('떡볶이') || category.includes('치킨') ||
      category.includes('파스타') || category.includes('라멘');
    return hasMoodTag || isComfortFood || hasComfortCategory;
  }
  
  if (mood === 'exciting') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('exciting');
    const isSpecial = r.ribbon || 
      (r.mood && Array.isArray(r.mood) && r.mood.includes('great'));
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
    const isCafeOrBrunch = /(카페|디저트|브런치|팬케이크|베이커리|빵)/.test(category);
    return hasMoodTag || isHearty || (isHighCal && !isCafeOrBrunch);
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
    return hasMoodTag || isStressRelief || hasSpicyMenu;
  }
  
  // 나머지 mood: 직접 매칭 (safe 등)
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
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1].replace(/,/g, '')), max: parseInt(rangeMatch[2].replace(/,/g, '')) };
  }
  
  const manRangeMatch = priceStr.match(/(\d+\.?\d*)\s*[~-]\s*(\d+\.?\d*)\s*만원/);
  if (manRangeMatch) {
    return { min: Math.round(parseFloat(manRangeMatch[1]) * 10000), max: Math.round(parseFloat(manRangeMatch[2]) * 10000) };
  }
  
  const manwonMatch = priceStr.match(/(\d+\.?\d*)\s*만원/);
  if (manwonMatch) {
    const price = Math.round(parseFloat(manwonMatch[1]) * 10000);
    return { min: price, max: price };
  }
  
  const singleMatch = priceStr.match(/(\d{1,3}(?:,?\d{3})*)\s*원/);
  if (singleMatch) {
    const price = parseInt(singleMatch[1].replace(/,/g, ''));
    return { min: price, max: price };
  }
  
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

// ============================================================
// 점수 계산 (App.js의 budgetProximity 등 반영)
// ============================================================
function calculateScore(r, matches, budgetNum) {
  let totalScore = 0;
  const matchCount = matches.filter(Boolean).length;
  totalScore += matchCount * 20;
  if (r.rating) totalScore += r.rating * 2;
  if (r.ribbon) totalScore += 10;

  // budgetProximity
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
function simulate(scenario, excludeNames = []) {
  const { weather, mood, people, diet, budget } = scenario;
  const peopleCategory = people === 1 ? 'solo' : people <= 3 ? 'small' : people <= 6 ? 'medium' : 'large';
  const hasDietFilter = diet && diet !== 'nodiet';
  const excludeSet = new Set(excludeNames);
  
  const results = restaurantDB
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
        calorie: r.calorie?.label || '미정',
        diet: r.diet || [],
        people: r.people || [],
        mood_tags: r.mood || [],
        weather_tags: r.weather || [],
        score: calculateScore(r, matches, budget),
        price: r.price || r.priceNote || '미정',
        ribbon: r.ribbon || false
      };
    })
    .filter(r => {
      if (hasDietFilter && !r.dietMatched) return false;
      return r.matchCount >= 2;
    })
    .sort((a, b) => b.score - a.score);
  
  return results;
}

// ============================================================
// 테스트 시나리오 정의 (모든 카테고리 2회 이상)
// ============================================================
const scenarios = [
  // === 날씨 테스트 (4가지 × 최소 1회, rainy/cold 2회) ===
  { label: '[날씨] 더운 날 + 혼밥', weather: 'hot', mood: 'safe', people: 1, diet: 'nodiet', budget: 12000,
    assertions: { minCandidates: 3, mustMatchWeather: true } },
  { label: '[날씨] 더운 날 + 다이어트', weather: 'hot', mood: 'safe', people: 1, diet: 'diet', budget: 12000,
    assertions: { minCandidates: 1, mustMatchWeather: false } },
  { label: '[날씨] 추운 날 + 해장', weather: 'cold', mood: 'hangover', people: 2, diet: 'nodiet', budget: 12000,
    assertions: { minCandidates: 5, mustMatchWeather: true } },
  { label: '[날씨] 추운 날 + 든든하게', weather: 'cold', mood: 'hearty', people: 3, diet: 'nodiet', budget: 15000,
    assertions: { minCandidates: 5, mustMatchWeather: true } },
  { label: '[날씨] 선선한 날 + 무난', weather: 'mild', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000,
    assertions: { minCandidates: 10, mustMatchWeather: false } },
  { label: '[날씨] 비오는 날 + 무난', weather: 'rainy', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000,
    assertions: { minCandidates: 3, mustMatchWeather: true } },
  { label: '[날씨] 비오는 날 + 채식', weather: 'rainy', mood: 'safe', people: 1, diet: 'vegetarian', budget: 15000,
    assertions: { minCandidates: 1, mustMatchWeather: false } },

  // === 기분 테스트 (8가지 mood 모두 테스트) ===
  { label: '[기분] 무난하게 (safe)', weather: 'mild', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000,
    assertions: { minCandidates: 5, mustMatchMood: true } },
  { label: '[기분] 든든하게 (hearty)', weather: 'mild', mood: 'hearty', people: 2, diet: 'nodiet', budget: 15000,
    assertions: { minCandidates: 5, mustMatchMood: true } },
  { label: '[기분] 임원과 함께 (executive)', weather: 'mild', mood: 'executive', people: 4, diet: 'nodiet', budget: 30000,
    assertions: { minCandidates: 5, mustMatchMood: true } },
  { label: '[기분] 숙취 해장 (hangover)', weather: 'cold', mood: 'hangover', people: 1, diet: 'nodiet', budget: 10000,
    assertions: { minCandidates: 3, mustMatchMood: true } },
  { label: '[기분] 팀점심 (team)', weather: 'mild', mood: 'team', people: 6, diet: 'nodiet', budget: 20000,
    assertions: { minCandidates: 5, mustMatchMood: true } },
  { label: '[기분] 신나는 날 (exciting)', weather: 'mild', mood: 'exciting', people: 2, diet: 'nodiet', budget: 25000,
    assertions: { minCandidates: 3, mustMatchMood: true } },
  { label: '[기분] 스트레스 (stressed)', weather: 'hot', mood: 'stressed', people: 2, diet: 'nodiet', budget: 15000,
    assertions: { minCandidates: 3, mustMatchMood: true } },
  { label: '[기분] 우울해요 (sad)', weather: 'mild', mood: 'sad', people: 1, diet: 'nodiet', budget: 15000,
    assertions: { minCandidates: 3, mustMatchMood: true } },

  // === 식단 테스트 (4가지 모두) ===
  { label: '[식단] 상관없음 (nodiet)', weather: 'mild', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000,
    assertions: { minCandidates: 10 } },
  { label: '[식단] 가볍게 (light)', weather: 'mild', mood: 'safe', people: 2, diet: 'light', budget: 13000,
    assertions: { minCandidates: 3, mustMatchDiet: true } },
  { label: '[식단] 다이어트 (diet)', weather: 'mild', mood: 'safe', people: 1, diet: 'diet', budget: 12000,
    assertions: { minCandidates: 3, mustMatchDiet: true } },
  { label: '[식단] 채식 (vegetarian)', weather: 'mild', mood: 'safe', people: 1, diet: 'vegetarian', budget: 15000,
    assertions: { minCandidates: 1, mustMatchDiet: true } },
  { label: '[식단] 채식 + 팀점심', weather: 'mild', mood: 'team', people: 4, diet: 'vegetarian', budget: 20000,
    assertions: { minCandidates: 1, mustMatchDiet: true } },

  // === 인원 테스트 (solo/small/medium/large 각각) ===
  { label: '[인원] 1명 혼밥 (solo)', weather: 'mild', mood: 'safe', people: 1, diet: 'nodiet', budget: 10000,
    assertions: { minCandidates: 5, mustMatchPeople: true, expectedCategory: 'solo' } },
  { label: '[인원] 2명 소규모 (small)', weather: 'mild', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000,
    assertions: { minCandidates: 5, mustMatchPeople: true, expectedCategory: 'small' } },
  { label: '[인원] 5명 중규모 (medium)', weather: 'mild', mood: 'team', people: 5, diet: 'nodiet', budget: 15000,
    assertions: { minCandidates: 5, mustMatchPeople: true, expectedCategory: 'medium' } },
  { label: '[인원] 8명+ 대규모 (large)', weather: 'mild', mood: 'team', people: 8, diet: 'nodiet', budget: 20000,
    assertions: { minCandidates: 3, mustMatchPeople: true, expectedCategory: 'large' } },

  // === 예산 테스트 (극저/보통/고액) ===
  { label: '[예산] 8,000원 극저예산', weather: 'mild', mood: 'safe', people: 1, diet: 'nodiet', budget: 8000,
    assertions: { minCandidates: 3, mustMatchBudget: true } },
  { label: '[예산] 15,000원 보통', weather: 'mild', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000,
    assertions: { minCandidates: 10, mustMatchBudget: true } },
  { label: '[예산] 30,000원 고예산', weather: 'mild', mood: 'executive', people: 4, diet: 'nodiet', budget: 30000,
    assertions: { minCandidates: 5, mustMatchBudget: true } },
  { label: '[예산] 10,000원 + 채식', weather: 'mild', mood: 'safe', people: 1, diet: 'vegetarian', budget: 10000,
    assertions: { minCandidates: 1, mustMatchBudget: false } },

  // === 복합 시나리오 테스트 ===
  { label: '[복합] 비+해장+혼밥+저예산', weather: 'rainy', mood: 'hangover', people: 1, diet: 'nodiet', budget: 10000,
    assertions: { minCandidates: 1 } },
  { label: '[복합] 더운날+다이어트+혼밥', weather: 'hot', mood: 'safe', people: 1, diet: 'diet', budget: 12000,
    assertions: { minCandidates: 1 } },
  { label: '[복합] 추운날+임원+대규모+고예산', weather: 'cold', mood: 'executive', people: 7, diet: 'nodiet', budget: 30000,
    assertions: { minCandidates: 1 } },
];

// ============================================================
// 테스트 실행 엔진
// ============================================================
let totalPass = 0;
let totalFail = 0;
let totalWarn = 0;
const failures = [];
const warnings = [];

console.log('═'.repeat(70));
console.log('  KT 점심 추천기 - 포괄적 통합 시뮬레이션 테스트 v2');
console.log('  카테고리: 날씨(4) × 기분(8) × 식단(4) × 인원(4) × 예산(4) + 복합(3)');
console.log('═'.repeat(70));

scenarios.forEach((scenario, idx) => {
  const results = simulate(scenario);
  const top10 = results.slice(0, 10);
  const { assertions } = scenario;
  
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📋 Test ${idx + 1}/${scenarios.length}: ${scenario.label}`);
  console.log(`   조건: weather=${scenario.weather}, mood=${scenario.mood}, people=${scenario.people}, diet=${scenario.diet}, budget=${scenario.budget.toLocaleString()}원`);
  console.log(`   후보: ${results.length}개`);
  
  // ── 검증 1: 후보 수 ──
  if (results.length < assertions.minCandidates) {
    console.log(`   ❌ FAIL: 후보 ${results.length}개 < 최소 ${assertions.minCandidates}개`);
    totalFail++;
    failures.push(`${scenario.label}: 후보 부족 (${results.length} < ${assertions.minCandidates})`);
  } else {
    console.log(`   ✅ PASS: 후보 수 충분 (${results.length}개 ≥ ${assertions.minCandidates})`);
    totalPass++;
  }
  
  // ── 검증 2: 식단 필수 필터 ──
  const hasDietFilter = scenario.diet && scenario.diet !== 'nodiet';
  if (hasDietFilter) {
    const dietViolations = top10.filter(r => !r.dietMatched);
    if (dietViolations.length > 0) {
      console.log(`   ❌ FAIL: 식단 필터 위반! ${dietViolations.map(r => r.name).join(', ')}`);
      totalFail++;
      failures.push(`${scenario.label}: 식단 필터 위반 - ${dietViolations.map(r => r.name).join(', ')}`);
    } else {
      console.log(`   ✅ PASS: 식단 필터 정상 (${scenario.diet})`);
      totalPass++;
    }
  }
  
  // ── 검증 3: 날씨 매칭률 ──
  if (assertions.mustMatchWeather && top10.length > 0) {
    const weatherMatched = top10.filter(r => r.weatherMatched).length;
    const ratio = weatherMatched / top10.length;
    if (ratio < 0.3) {
      console.log(`   ❌ FAIL: Top10 날씨 매칭률 ${(ratio * 100).toFixed(0)}% (30% 미만)`);
      totalFail++;
      failures.push(`${scenario.label}: 날씨 매칭률 부족 (${(ratio * 100).toFixed(0)}%)`);
    } else {
      console.log(`   ✅ PASS: 날씨 매칭률 ${(ratio * 100).toFixed(0)}% (${weatherMatched}/${top10.length})`);
      totalPass++;
    }
  }
  
  // ── 검증 4: 기분 매칭률 ──
  if (assertions.mustMatchMood && top10.length > 0) {
    const moodMatched = top10.filter(r => r.moodMatched).length;
    const ratio = moodMatched / top10.length;
    if (ratio < 0.3) {
      console.log(`   ❌ FAIL: Top10 기분 매칭률 ${(ratio * 100).toFixed(0)}% (30% 미만)`);
      totalFail++;
      failures.push(`${scenario.label}: 기분 매칭률 부족 (${(ratio * 100).toFixed(0)}%)`);
    } else {
      console.log(`   ✅ PASS: 기분 매칭률 ${(ratio * 100).toFixed(0)}% (${moodMatched}/${top10.length})`);
      totalPass++;
    }
  }
  
  // ── 검증 5: 인원 매칭률 ──
  if (assertions.mustMatchPeople && top10.length > 0) {
    const peopleMatched = top10.filter(r => r.peopleMatched).length;
    const ratio = peopleMatched / top10.length;
    if (ratio < 0.5) {
      console.log(`   ❌ FAIL: Top10 인원 매칭률 ${(ratio * 100).toFixed(0)}% (50% 미만)`);
      totalFail++;
      failures.push(`${scenario.label}: 인원 매칭률 부족 (${(ratio * 100).toFixed(0)}%)`);
    } else {
      console.log(`   ✅ PASS: 인원 매칭률 ${(ratio * 100).toFixed(0)}% (${peopleMatched}/${top10.length})`);
      totalPass++;
    }
  }
  
  // ── 검증 6: 예산 매칭률 ──
  if (assertions.mustMatchBudget && top10.length > 0) {
    const budgetMatched = top10.filter(r => r.budgetMatched).length;
    const ratio = budgetMatched / top10.length;
    if (ratio < 0.3) {
      console.log(`   ⚠️ WARN: Top10 예산 매칭률 ${(ratio * 100).toFixed(0)}% (30% 미만)`);
      totalWarn++;
      warnings.push(`${scenario.label}: 예산 매칭률 낮음 (${(ratio * 100).toFixed(0)}%)`);
    } else {
      console.log(`   ✅ PASS: 예산 매칭률 ${(ratio * 100).toFixed(0)}% (${budgetMatched}/${top10.length})`);
      totalPass++;
    }
  }
  
  // ── Top 5 표시 ──
  console.log(`   Top 5:`);
  top10.slice(0, 5).forEach((r, i) => {
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
// 재추천 시뮬레이션 테스트
// ============================================================
console.log(`\n${'═'.repeat(70)}`);
console.log('  🔄 재추천(다른 맛집 추천하기) 시뮬레이션 테스트');
console.log('═'.repeat(70));

const reRecScenarios = [
  { label: '무난한 조건 재추천 5회', weather: 'mild', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000, rounds: 5 },
  { label: '제한적 조건 재추천 3회 (채식)', weather: 'mild', mood: 'safe', people: 1, diet: 'vegetarian', budget: 15000, rounds: 3 },
  { label: '팀점심 재추천 4회', weather: 'mild', mood: 'team', people: 6, diet: 'nodiet', budget: 20000, rounds: 4 },
];

reRecScenarios.forEach((scenario, idx) => {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`🔄 재추천 Test ${idx + 1}: ${scenario.label}`);
  console.log(`   조건: weather=${scenario.weather}, mood=${scenario.mood}, people=${scenario.people}, diet=${scenario.diet}, budget=${scenario.budget.toLocaleString()}원`);
  
  let excluded = [];
  let allUnique = true;
  let resetTriggered = false;
  const allSeenNames = new Set();
  
  for (let round = 0; round <= scenario.rounds; round++) {
    const results = simulate(scenario, excluded);
    const top10 = results.slice(0, 10);
    const roundLabel = round === 0 ? '최초 추천' : `재추천 ${round}회`;
    
    if (results.length < 3 && excluded.length > 0) {
      console.log(`   ℹ️ ${roundLabel}: 후보 ${results.length}개 → 소진 초기화 발동`);
      excluded = [];
      resetTriggered = true;
      const resetResults = simulate(scenario, []);
      console.log(`   ✅ 초기화 후 후보: ${resetResults.length}개`);
      break;
    }
    
    // 중복 체크
    const newNames = top10.map(r => r.name);
    const duplicates = newNames.filter(n => allSeenNames.has(n));
    if (duplicates.length > 0 && !resetTriggered) {
      console.log(`   ❌ FAIL: ${roundLabel}에서 이전과 중복! ${duplicates.join(', ')}`);
      allUnique = false;
    }
    newNames.forEach(n => allSeenNames.add(n));
    excluded = [...excluded, ...newNames].slice(0, 80);
    
    console.log(`   ${roundLabel}: 후보 ${results.length}개, 선택 ${top10.length}개, 누적제외 ${excluded.length}개`);
  }
  
  if (allUnique) {
    console.log(`   ✅ PASS: 재추천 결과 중복 없음 (총 ${allSeenNames.size}개 고유 식당)`);
    totalPass++;
  } else {
    totalFail++;
    failures.push(`${scenario.label}: 재추천 중복 발생`);
  }
});

// ============================================================
// 데이터 무결성 검증
// ============================================================
console.log(`\n${'═'.repeat(70)}`);
console.log('  📊 데이터 무결성 검증');
console.log('═'.repeat(70));

// 모든 식당 가격 파싱 검증
const parseFailures = restaurantDB.filter(r => {
  const price = r.price || r.priceNote || '';
  return price && !parsePriceRange(r);
});
if (parseFailures.length > 0) {
  console.log(`\n⚠️ WARN: 가격 파싱 실패 ${parseFailures.length}개:`);
  parseFailures.forEach(r => console.log(`   - ${r.name}: "${r.price || r.priceNote}"`));
  totalWarn++;
  warnings.push(`가격 파싱 실패: ${parseFailures.length}개`);
} else {
  console.log(`\n✅ PASS: 모든 가격 정상 파싱`);
  totalPass++;
}

// mood 태그 검증 (유효한 mood 태그만 사용하는지)
const validMoods = new Set(['safe', 'hearty', 'executive', 'hangover', 'team', 'exciting', 'stressed', 'sad', 'great']);
const invalidMoodEntries = restaurantDB.filter(r => {
  if (!r.mood || !Array.isArray(r.mood)) return false;
  return r.mood.some(m => !validMoods.has(m));
});
if (invalidMoodEntries.length > 0) {
  console.log(`\n⚠️ WARN: 알 수 없는 mood 태그 발견:`);
  invalidMoodEntries.forEach(r => {
    const unknowns = r.mood.filter(m => !validMoods.has(m));
    console.log(`   - ${r.name}: [${unknowns.join(', ')}]`);
  });
  totalWarn++;
  warnings.push(`알 수 없는 mood 태그: ${invalidMoodEntries.length}개 식당`);
} else {
  console.log(`✅ PASS: mood 태그 유효성 확인`);
  totalPass++;
}

// weather 태그 검증
const validWeathers = new Set(['hot', 'mild', 'cold', 'rainy']);
const invalidWeatherEntries = restaurantDB.filter(r => {
  if (!r.weather || !Array.isArray(r.weather)) return false;
  return r.weather.some(w => !validWeathers.has(w));
});
if (invalidWeatherEntries.length > 0) {
  console.log(`\n❌ FAIL: 잘못된 weather 태그 발견:`);
  invalidWeatherEntries.forEach(r => {
    const unknowns = r.weather.filter(w => !validWeathers.has(w));
    console.log(`   - ${r.name}: [${unknowns.join(', ')}]`);
  });
  totalFail++;
  failures.push(`잘못된 weather 태그: ${invalidWeatherEntries.map(r => r.name + '(' + r.weather.filter(w => !validWeathers.has(w)).join(',') + ')').join(', ')}`);
} else {
  console.log(`✅ PASS: weather 태그 유효성 확인`);
  totalPass++;
}

// people 태그 검증
const validPeople = new Set(['solo', 'small', 'medium', 'large']);
const invalidPeopleEntries = restaurantDB.filter(r => {
  if (!r.people || !Array.isArray(r.people)) return false;
  return r.people.some(p => !validPeople.has(p));
});
if (invalidPeopleEntries.length > 0) {
  console.log(`\n❌ FAIL: 잘못된 people 태그 발견:`);
  invalidPeopleEntries.forEach(r => {
    const unknowns = r.people.filter(p => !validPeople.has(p));
    console.log(`   - ${r.name}: [${unknowns.join(', ')}]`);
  });
  totalFail++;
  failures.push(`잘못된 people 태그: ${invalidPeopleEntries.length}개`);
} else {
  console.log(`✅ PASS: people 태그 유효성 확인`);
  totalPass++;
}

// diet 태그 검증
const validDiets = new Set(['vegetarian', 'diet', 'light', 'nodiet', 'seafood', 'spicy']);
const invalidDietEntries = restaurantDB.filter(r => {
  if (!r.diet || !Array.isArray(r.diet)) return false;
  return r.diet.some(d => !validDiets.has(d));
});
if (invalidDietEntries.length > 0) {
  console.log(`\n⚠️ WARN: 알 수 없는 diet 태그 발견:`);
  invalidDietEntries.forEach(r => {
    const unknowns = r.diet.filter(d => !validDiets.has(d));
    console.log(`   - ${r.name}: [${unknowns.join(', ')}]`);
  });
  totalWarn++;
  warnings.push(`알 수 없는 diet 태그: ${invalidDietEntries.length}개`);
} else {
  console.log(`✅ PASS: diet 태그 유효성 확인`);
  totalPass++;
}

// ============================================================
// 최종 결과
// ============================================================
console.log('\n' + '═'.repeat(70));
console.log(`  📊 최종 결과: ${totalPass} PASS / ${totalFail} FAIL / ${totalWarn} WARN`);
console.log(`  테스트 시나리오: ${scenarios.length}개 + 재추천 ${reRecScenarios.length}개 + 데이터검증 5개`);
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
