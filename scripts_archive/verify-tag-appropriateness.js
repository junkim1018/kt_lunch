/**
 * 133개 식당 태그 적합성 전수 검증
 * 
 * 검증 항목:
 * 1. 각 식당의 mood 태그가 카테고리/메뉴와 논리적으로 일치하는지
 * 2. weather 태그가 음식 특성과 맞는지
 * 3. diet 태그가 메뉴 내용과 일치하는지
 * 4. budget 태그가 실제 가격과 일치하는지
 * 5. people 태그가 식당 특성과 맞는지
 * 6. 특정 필터 조합에서 추천되면 안 되는 식당이 추천되는지 (부적절 추천)
 * 7. 특정 필터 조합에서 추천되어야 하는 식당이 누락되는지
 */

// ESM → CJS 호환
const { createRequire } = require('module');
const path = require('path');

// restaurantData.js를 직접 파싱
const fs = require('fs');
const dataPath = path.join(__dirname, '..', 'src', 'data', 'restaurantData.js');
const dataContent = fs.readFileSync(dataPath, 'utf8');

// export const restaurantDB = [...] 추출
const match = dataContent.match(/export\s+const\s+restaurantDB\s*=\s*(\[[\s\S]*\]);?\s*$/);
if (!match) {
  console.error('restaurantDB를 파싱할 수 없습니다.');
  process.exit(1);
}

let restaurantDB;
try {
  restaurantDB = eval(match[1]);
} catch (e) {
  console.error('restaurantDB eval 실패:', e.message);
  process.exit(1);
}

console.log(`\n${'═'.repeat(70)}`);
console.log(`  🔍 133개 식당 태그 적합성 전수 검증`);
console.log(`  식당 수: ${restaurantDB.length}개`);
console.log(`${'═'.repeat(70)}\n`);

let totalIssues = 0;
let warnings = 0;
let criticals = 0;
const issues = [];

function addIssue(level, restaurant, category, detail) {
  issues.push({ level, restaurant, category, detail });
  if (level === 'CRITICAL') criticals++;
  else if (level === 'WARNING') warnings++;
  totalIssues++;
}

// ═══════════════════════════════════════════════════
// 검증 1: budget 태그와 실제 가격 일치 여부
// ═══════════════════════════════════════════════════
console.log('── 검증 1: 예산 태그 vs 실제 가격 ──');

function parsePrice(r) {
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

let budgetOk = 0, budgetFail = 0;
restaurantDB.forEach(r => {
  const parsed = parsePrice(r);
  if (!parsed) return;
  const { min } = parsed;
  const budget = r.budget || [];
  
  // cheap: ~10,000원 / normal: 10,000~20,000원 / expensive: 20,000원+
  if (budget.includes('cheap') && min > 12000) {
    addIssue('WARNING', r.name, 'budget', `cheap 태그이지만 최소가 ${min.toLocaleString()}원 (기준: ~12,000원)`);
    budgetFail++;
  } else if (budget.includes('expensive') && min < 15000) {
    addIssue('WARNING', r.name, 'budget', `expensive 태그이지만 최소가 ${min.toLocaleString()}원 (기준: 15,000원+)`);
    budgetFail++;
  } else if (!budget.includes('cheap') && min <= 8000 && !budget.includes('normal')) {
    addIssue('WARNING', r.name, 'budget', `최소가 ${min.toLocaleString()}원인데 cheap 태그 없음`);
    budgetFail++;
  } else {
    budgetOk++;
  }
});
console.log(`  ✅ 정상: ${budgetOk}개 / ⚠️ 이슈: ${budgetFail}개\n`);

// ═══════════════════════════════════════════════════
// 검증 2: mood 태그 논리적 적합성
// ═══════════════════════════════════════════════════
console.log('── 검증 2: 기분(mood) 태그 적합성 ──');

const moodChecks = {
  hangover: {
    // 해장: 국밥, 국, 탕, 찌개, 칼국수 등이어야 함. 파스타/스테이크/디저트는 부적절
    inappropriate: /(오마카세|스테이크|피자|초밥|디저트|카페|브런치|팬케이크|베이커리|빵|샌드위치|포케|요거트|그릭요거트)/i,
    appropriate: /(국밥|탕|찌개|해장|순대|칼국수|라면|분식|짬뽕|쌀국수|설렁탕|갈비탕|감자탕|뼈다귀|곰탕|추어탕|삼계탕|매운탕|육개장)/i,
    label: '해장'
  },
  executive: {
    // 격식: 프리미엄, 오마카세, 코스, 스테이크. 분식/푸드코트/국밥 부적절
    inappropriate: /(분식|떡볶이|김밥|국밥|백반|순대|푸드코트|라면|편의점)/i,
    appropriate: /(프리미엄|오마카세|코스|스테이크|파인|다이닝|호텔|블루리본)/i,
    label: '격식'
  },
  hearty: {
    // 든든하게: 고기, 구이, 돈까스, 육류. 샐러드/카페/디저트는 부적절
    inappropriate: /(카페|디저트|브런치|팬케이크|베이커리|빵|요거트|그릭요거트)/i,
    appropriate: /(구이|갈비|삼겹|돈까스|카츠|육|불고기|곱창|보쌈|족발|치킨|고기|한우|소고기|돼지|양고기|스테이크|햄버거|버거|쌈)/i,
    label: '든든하게'
  },
  sad: {
    label: '우울/기분전환'
  }
};

let moodOk = 0, moodFail = 0;
restaurantDB.forEach(r => {
  const moods = r.mood || [];
  const cat = r.category || '';
  
  // hangover 태그인데 부적절한 카테고리
  if (moods.includes('hangover') && moodChecks.hangover.inappropriate.test(cat)) {
    addIssue('CRITICAL', r.name, 'mood', `해장(hangover) 태그이지만 카테고리가 "${cat}" — 해장에 부적절`);
    moodFail++;
  }
  // executive 태그인데 부적절한 카테고리
  else if (moods.includes('executive') && moodChecks.executive.inappropriate.test(cat)) {
    addIssue('CRITICAL', r.name, 'mood', `격식(executive) 태그이지만 카테고리가 "${cat}" — 격식에 부적절`);
    moodFail++;
  }
  // hearty 태그인데 부적절한 카테고리
  else if (moods.includes('hearty') && moodChecks.hearty.inappropriate.test(cat)) {
    addIssue('WARNING', r.name, 'mood', `든든하게(hearty) 태그이지만 카테고리가 "${cat}" — 가벼운 식당`);
    moodFail++;
  }
  // 해장 적합한데 hangover 태그 없음
  else if (!moods.includes('hangover') && moodChecks.hangover.appropriate.test(cat) && !/(오마카세|코스|프리미엄|스테이크)/.test(cat)) {
    // 국밥/탕 계열인데 hangover가 없으면 경고
    addIssue('WARNING', r.name, 'mood', `카테고리가 "${cat}"인데 해장(hangover) 태그 없음 — 해장 선택 시 누락될 수 있음`);
    moodFail++;
  }
  else {
    moodOk++;
  }
});
console.log(`  ✅ 정상: ${moodOk}개 / ⚠️ 이슈: ${moodFail}개\n`);

// ═══════════════════════════════════════════════════
// 검증 3: weather 태그 논리적 적합성
// ═══════════════════════════════════════════════════
console.log('── 검증 3: 날씨(weather) 태그 적합성 ──');

let weatherOk = 0, weatherFail = 0;
restaurantDB.forEach(r => {
  const weathers = r.weather || [];
  const cat = r.category || '';
  const menuText = (r.menus || []).join(' ');
  
  // 냉면/냉모밀/물회인데 hot 없음
  if (/(냉면|냉모밀|물회|콩국수|빙수)/.test(cat + ' ' + menuText) && !weathers.includes('hot')) {
    addIssue('WARNING', r.name, 'weather', `시원한 메뉴("${cat}")인데 hot(더운 날) 태그 없음`);
    weatherFail++;
  }
  // 국밥/탕/찌개인데 cold 없음
  else if (/(국밥|설렁탕|갈비탕|감자탕|뼈다귀탕|곰탕|추어탕|삼계탕|해장국|찌개|전골)/.test(cat) && !weathers.includes('cold')) {
    addIssue('WARNING', r.name, 'weather', `따뜻한 국물 메뉴("${cat}")인데 cold(추운 날) 태그 없음`);
    weatherFail++;
  }
  // 샐러드/포케인데 cold 있음 (추운 날 샐러드는 부적절)
  else if (/(샐러드|포케|요거트|그릭요거트)/.test(cat) && weathers.includes('cold')) {
    addIssue('WARNING', r.name, 'weather', `샐러드/포케 카테고리인데 cold(추운 날) 태그 있음 — 추운 날 추천 부적절`);
    weatherFail++;
  }
  // 파전/전류/칼국수인데 rainy 없음
  else if (/(파전|해물전|전병|수제비|칼국수)/.test(cat + ' ' + menuText) && !weathers.includes('rainy') && !(weathers.includes('rainy'))) {
    addIssue('WARNING', r.name, 'weather', `비 오는 날 메뉴("${cat}")인데 rainy(비 오는 날) 태그 없음`);
    weatherFail++;
  }
  else {
    weatherOk++;
  }
});
console.log(`  ✅ 정상: ${weatherOk}개 / ⚠️ 이슈: ${weatherFail}개\n`);

// ═══════════════════════════════════════════════════
// 검증 4: diet 태그 적합성
// ═══════════════════════════════════════════════════
console.log('── 검증 4: 식단(diet) 태그 적합성 ──');

let dietOk = 0, dietFail = 0;
restaurantDB.forEach(r => {
  const diets = r.diet || [];
  const cat = r.category || '';
  const menuText = (r.menus || []).join(' ').toLowerCase();
  
  // vegetarian인데 고기/해산물 전문점
  if (diets.includes('vegetarian')) {
    if (/(삼겹|갈비|불고기|곱창|족발|보쌈|치킨|고기|한우|소고기|돼지|양고기|스테이크|규카츠|돈까스)/.test(cat)) {
      addIssue('CRITICAL', r.name, 'diet', `채식(vegetarian) 태그이지만 카테고리가 "${cat}" — 육류 전문점`);
      dietFail++;
      return;
    }
  }
  
  // 샐러드 전문점인데 diet/light 없음
  if (/(샐러드|포케)/.test(cat) && !diets.includes('diet') && !diets.includes('light')) {
    addIssue('WARNING', r.name, 'diet', `샐러드/포케 전문점인데 diet/light 태그 없음`);
    dietFail++;
  }
  // 고칼로리인데 diet 태그
  else if (r.calorie && r.calorie.label === '고칼로리' && diets.includes('diet')) {
    addIssue('WARNING', r.name, 'diet', `고칼로리 식당인데 diet 태그 있음 — 다이어트 추천 시 부적절`);
    dietFail++;
  }
  else {
    dietOk++;
  }
});
console.log(`  ✅ 정상: ${dietOk}개 / ⚠️ 이슈: ${dietFail}개\n`);

// ═══════════════════════════════════════════════════
// 검증 5: 필터 조합별 부적절 추천 시뮬레이션
// ═══════════════════════════════════════════════════
console.log('── 검증 5: 필터 조합별 부적절 추천 검사 ──');

// 알고리즘의 매칭 함수 복제
function matchWeather(r, weather) {
  if (!weather) return false;
  if (weather === 'cold') {
    const cat = r.category || '';
    if (/(샐러드|포케|요거트|그릭요거트)/.test(cat)) return false;
  }
  const hasTag = r.weather && Array.isArray(r.weather) && r.weather.includes(weather);
  if (hasTag) return true;
  const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
  if (weather === 'hot') return /냉면|콩국수|물회|냉모밀|빙수|샐러드|냉채/.test(text);
  if (weather === 'cold') return /국밥|탕|찌개|전골|라멘|설렁탕|갈비탕|부대/.test(text);
  if (weather === 'rainy') return /파전|해물전|녹두전|감자전|부침|수제비|칼국수|국밥|짬뽕/.test(text);
  if (weather === 'mild') return true;
  return false;
}

function matchMood(r, mood) {
  if (!mood) return false;
  if (mood === 'hangover') {
    const category = r.category || '';
    const isInappropriate = /(카페|디저트|브런치|팬케이크|베이커리|빵|샐러드|오마카세|초밥|회|사시미|스테이크|파스타|리조또|피자|포케|요거트|샌드위치|라멘|규카츠|오믠라이스)/.test(category);
    if (isInappropriate) return false;
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('hangover');
    const hasHangoverCategory = /(국밥|순대국|해장국|해장|육개장|감자탕|뼈다귀|곰탕|설렁탕|갈비탕|닭볶음탕|매운탕|추어탕|삼계탕|찌개|짬봉|쌀국수|라면|분식)/.test(category);
    return hasMoodTag || hasHangoverCategory;
  }
  if (mood === 'executive') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('executive');
    const isUpscale = r.ribbon || (r.budget && Array.isArray(r.budget) && r.budget.includes('expensive'));
    const category = r.category || '';
    const isCasual = /(순대|분식|떡볶이|김밥|국밥|백반|푸드코트|해장국)/.test(category);
    return hasMoodTag || (isUpscale && !isCasual);
  }
  if (mood === 'team') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('team');
    const supportsGroup = r.people && Array.isArray(r.people) && 
      (r.people.includes('large') || r.people.includes('medium'));
    return hasMoodTag || supportsGroup;
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
  return r.mood && Array.isArray(r.mood) && r.mood.includes(mood);
}

function matchDiet(r, diet) {
  if (!diet || diet === 'nodiet') return true;
  if (!r.diet || !Array.isArray(r.diet)) return false;
  if (diet === 'vegetarian') return r.diet.includes('vegetarian');
  if (diet === 'diet') return r.diet.includes('diet') || r.diet.includes('light');
  if (diet === 'light') return r.diet.includes('light') || r.diet.includes('diet');
  return false;
}

function matchPeople(r, peopleCategory) {
  if (!r.people || !Array.isArray(r.people)) return false;
  if (r.people.includes(peopleCategory)) return true;
  if (peopleCategory === 'solo') return false;
  const categoryMap = { 'solo': 0, 'small': 1, 'medium': 2, 'large': 3 };
  const userCat = categoryMap[peopleCategory];
  return r.people.some(p => {
    const restCat = categoryMap[p];
    return restCat !== undefined && Math.abs(restCat - userCat) <= 1;
  });
}

// 핵심 필터 조합별 부적절 추천 검사
const criticalScenarios = [
  { name: '채식주의자', diet: 'vegetarian', weather: 'mild', mood: 'safe', people: 'small' },
  { name: '다이어트', diet: 'diet', weather: 'mild', mood: 'safe', people: 'small' },
  { name: '해장 필요', diet: 'nodiet', weather: 'cold', mood: 'hangover', people: 'small' },
  { name: '임원 식사', diet: 'nodiet', weather: 'mild', mood: 'executive', people: 'small' },
  { name: '대규모 팀점심', diet: 'nodiet', weather: 'mild', mood: 'team', people: 'large' },
  { name: '혼밥', diet: 'nodiet', weather: 'mild', mood: 'safe', people: 'solo' },
  { name: '더운 날 든든하게', diet: 'nodiet', weather: 'hot', mood: 'hearty', people: 'small' },
  { name: '비 오는 날 무난하게', diet: 'nodiet', weather: 'rainy', mood: 'safe', people: 'small' },
  { name: '추운 날 채식', diet: 'vegetarian', weather: 'cold', mood: 'safe', people: 'small' },
  { name: '가벼운 식사 혼밥', diet: 'light', weather: 'mild', mood: 'safe', people: 'solo' },
];

let scenarioIssues = 0;
criticalScenarios.forEach(scenario => {
  const matched = restaurantDB.filter(r => {
    const weatherMatch = matchWeather(r, scenario.weather);
    const moodMatch = matchMood(r, scenario.mood);
    const dietMatch = matchDiet(r, scenario.diet);
    const peopleMatch = matchPeople(r, scenario.people);
    return weatherMatch && moodMatch && dietMatch && peopleMatch;
  });
  
  if (matched.length === 0) {
    addIssue('CRITICAL', '-', 'scenario', `"${scenario.name}" 시나리오에서 매칭 식당 0개 — 사용자에게 빈 결과 표시됨!`);
    scenarioIssues++;
  } else if (matched.length < 3) {
    addIssue('WARNING', '-', 'scenario', `"${scenario.name}" 시나리오에서 매칭 식당 ${matched.length}개 — 추천 다양성 부족`);
    scenarioIssues++;
  }
  
  // 부적절한 식당이 추천되는지 검사
  matched.forEach(r => {
    const cat = r.category || '';
    // 채식인데 육류 식당
    if (scenario.diet === 'vegetarian' && /(삼겹|갈비|불고기|곱창|족발|보쌈|치킨|고기|한우|돈까스|카츠|스테이크|버거|햄버거)/.test(cat)) {
      addIssue('CRITICAL', r.name, 'scenario', `"${scenario.name}" 시나리오에서 육류 전문점 "${cat}"이(가) 매칭됨!`);
      scenarioIssues++;
    }
    // 해장인데 디저트/카페
    if (scenario.mood === 'hangover' && /(카페|디저트|브런치|팬케이크|베이커리|빵|샐러드|파스타|피자|초밥|오마카세)/.test(cat)) {
      addIssue('CRITICAL', r.name, 'scenario', `"${scenario.name}" 시나리오에서 "${cat}" 식당이 해장으로 매칭됨!`);
      scenarioIssues++;
    }
    // 임원 식사인데 분식/국밥
    if (scenario.mood === 'executive' && /(분식|떡볶이|김밥|국밥|백반|순대|라면)/.test(cat)) {
      addIssue('CRITICAL', r.name, 'scenario', `"${scenario.name}" 시나리오에서 "${cat}" 식당이 임원 식사로 매칭됨!`);
      scenarioIssues++;
    }
  });
  
  console.log(`  ${matched.length >= 3 ? '✅' : '⚠️'} "${scenario.name}": ${matched.length}개 식당 매칭`);
});
console.log();

// ═══════════════════════════════════════════════════
// 검증 6: 모든 식당이 최소 1개 이상의 시나리오에서 추천되는지
// ═══════════════════════════════════════════════════
console.log('── 검증 6: 사각지대 식당 (어떤 조합에서도 추천 안 됨) ──');

const weathers = ['hot', 'mild', 'cold', 'rainy'];
const moods = ['safe', 'hearty', 'executive', 'hangover', 'team', 'exciting', 'sad'];
const diets = ['nodiet', 'light', 'diet', 'vegetarian'];
const peoples = ['solo', 'small', 'medium', 'large'];

let orphanCount = 0;
const orphanRestaurants = [];

restaurantDB.forEach(r => {
  let matched = false;
  
  // 모든 주요 조합에서 한 번이라도 매칭되는지
  for (const w of weathers) {
    for (const m of moods) {
      for (const p of peoples) {
        const wm = matchWeather(r, w);
        const mm = matchMood(r, m);
        const pm = matchPeople(r, p);
        const dm = matchDiet(r, 'nodiet'); // nodiet은 항상 true
        if (wm && mm && pm && dm) {
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
    if (matched) break;
  }
  
  if (!matched) {
    orphanCount++;
    orphanRestaurants.push(r.name);
    addIssue('WARNING', r.name, 'orphan', `어떤 날씨+기분+인원 조합에서도 매칭되지 않음 — 추천 사각지대`);
  }
});

if (orphanCount === 0) {
  console.log(`  ✅ 모든 식당이 최소 1개 이상의 조합에서 추천됨`);
} else {
  console.log(`  ⚠️ ${orphanCount}개 식당이 사각지대: ${orphanRestaurants.join(', ')}`);
}
console.log();

// ═══════════════════════════════════════════════════
// 검증 7: 각 mood별 충분한 식당 풀 존재 여부
// ═══════════════════════════════════════════════════
console.log('── 검증 7: 기분(mood)별 추천 풀 크기 ──');

moods.forEach(mood => {
  const matched = restaurantDB.filter(r => matchMood(r, mood));
  const icon = matched.length >= 10 ? '✅' : matched.length >= 5 ? '🟡' : '🔴';
  console.log(`  ${icon} ${mood}: ${matched.length}개 식당`);
  if (matched.length < 5) {
    addIssue('WARNING', '-', 'pool', `${mood} 기분에 매칭되는 식당이 ${matched.length}개로 매우 적음`);
  }
});
console.log();

// ═══════════════════════════════════════════════════
// 검증 8: 각 weather별 충분한 식당 풀 존재
// ═══════════════════════════════════════════════════
console.log('── 검증 8: 날씨(weather)별 추천 풀 크기 ──');

weathers.forEach(w => {
  const matched = restaurantDB.filter(r => matchWeather(r, w));
  const icon = matched.length >= 20 ? '✅' : matched.length >= 10 ? '🟡' : '🔴';
  console.log(`  ${icon} ${w}: ${matched.length}개 식당`);
});
console.log();

// ═══════════════════════════════════════════════════
// 검증 9: 각 diet별 충분한 식당 풀 존재
// ═══════════════════════════════════════════════════
console.log('── 검증 9: 식단(diet)별 추천 풀 크기 ──');

diets.forEach(d => {
  const matched = restaurantDB.filter(r => matchDiet(r, d));
  const icon = d === 'nodiet' ? '✅' : matched.length >= 10 ? '✅' : matched.length >= 5 ? '🟡' : '🔴';
  console.log(`  ${icon} ${d}: ${matched.length}개 식당`);
  if (d !== 'nodiet' && matched.length < 5) {
    addIssue('WARNING', '-', 'pool', `${d} 식단에 매칭되는 식당이 ${matched.length}개로 매우 적음`);
  }
});
console.log();

// ═══════════════════════════════════════════════════
// 최종 결과
// ═══════════════════════════════════════════════════
console.log(`${'═'.repeat(70)}`);

if (issues.length > 0) {
  console.log(`\n📋 발견된 이슈 상세:\n`);
  
  const criticalIssues = issues.filter(i => i.level === 'CRITICAL');
  const warningIssues = issues.filter(i => i.level === 'WARNING');
  
  if (criticalIssues.length > 0) {
    console.log(`🔴 CRITICAL (${criticalIssues.length}건):`);
    criticalIssues.forEach(i => {
      console.log(`   [${i.category}] ${i.restaurant}: ${i.detail}`);
    });
    console.log();
  }
  
  if (warningIssues.length > 0) {
    console.log(`🟡 WARNING (${warningIssues.length}건):`);
    warningIssues.forEach(i => {
      console.log(`   [${i.category}] ${i.restaurant}: ${i.detail}`);
    });
    console.log();
  }
}

console.log(`${'═'.repeat(70)}`);
console.log(`  📊 최종 결과: ${criticals} CRITICAL / ${warnings} WARNING`);
console.log(`${'═'.repeat(70)}\n`);

if (criticals > 0) {
  console.log('🔴 크리티컬 이슈가 있습니다. 반드시 수정이 필요합니다.');
} else if (warnings > 0) {
  console.log('🟡 경고 이슈가 있습니다. 검토를 권장합니다.');
} else {
  console.log('✅ 모든 검증 통과! 태그 적합성 정상입니다.');
}
