/**
 * KT 점심 추천기 — 추천 정확도 심층 검증 스크립트
 * 
 * 동적 가중치 + 네거티브 어피니티 적용 후 
 * 7대 핵심 시나리오의 TOP5가 실제로 적합한 식당인지 검증
 * 
 * 실행: node scripts_archive/test-accuracy.js
 */

const fs = require('fs');
const path = require('path');

// ── 데이터 로드 ──
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

const dataPath = path.join(__dirname, '../src/data/restaurantData.js');
const restaurantDB = loadDataFromFile(dataPath, 'restaurantDB');
console.log(`✅ 식당 데이터 로드: ${restaurantDB.length}개\n`);

// ── 동적 가중치 프로필 (scoring.js와 동일) ──
const WEIGHT_PROFILES = {
  default:   { weather: 20, mood: 20, people: 20, diet: 20, budget: 20 },
  hangover:  { weather: 10, mood: 40, people: 10, diet: 10, budget: 30 },
  executive: { weather: 5,  mood: 35, people: 20, diet: 10, budget: 30 },
  team:      { weather: 15, mood: 20, people: 30, diet: 15, budget: 20 },
  hearty:    { weather: 15, mood: 30, people: 15, diet: 15, budget: 25 },
  exciting:  { weather: 10, mood: 30, people: 15, diet: 10, budget: 35 },
  sad:       { weather: 15, mood: 35, people: 15, diet: 15, budget: 20 },
  rainy:     { weather: 35, mood: 20, people: 15, diet: 15, budget: 15 },
  hot:       { weather: 30, mood: 20, people: 15, diet: 15, budget: 20 },
  cold:      { weather: 25, mood: 20, people: 15, diet: 20, budget: 20 },
  diet:      { weather: 15, mood: 15, people: 15, diet: 35, budget: 20 },
};

function getWeightProfile(selections) {
  if (selections.diet && selections.diet !== 'nodiet') return WEIGHT_PROFILES.diet;
  if (selections.mood && WEIGHT_PROFILES[selections.mood]) return WEIGHT_PROFILES[selections.mood];
  if (selections.weather && ['rainy', 'hot', 'cold'].includes(selections.weather)) return WEIGHT_PROFILES[selections.weather];
  return WEIGHT_PROFILES.default;
}

// ── 네거티브 어피니티 (scoring.js와 동일) ──
function getNegativeAffinityPenalty(restaurant, selections) {
  let penalty = 0;
  const category = (restaurant.category || '').toLowerCase();
  const cuisine = restaurant.cuisine || '';
  
  if (selections.mood === 'hangover') {
    if (cuisine === 'western') penalty -= 15;
    if (cuisine === 'japanese' && !/라멘|우동/.test(category)) penalty -= 10;
    if (cuisine === 'mexican' || cuisine === 'indian') penalty -= 12;
  }
  if (selections.mood === 'executive') {
    if (/포차|주점|선술집|편의점/.test(category)) penalty -= 20;
    if (/분식|떡볶이|김밥천국/.test(category)) penalty -= 20;
  }
  if (selections.mood === 'hearty') {
    if (restaurant.calorie && restaurant.calorie.label === '저칼로리') penalty -= 10;
    if (/샐러드|포케|요거트|그릭요거트/.test(category)) penalty -= 15;
  }
  if (selections.mood === 'sad') {
    if (/백반|구내식당/.test(category)) penalty -= 8;
  }
  if (selections.weather === 'hot') {
    if (/전골|부대찌개|샤브샤브/.test(category)) penalty -= 8;
  }
  if (selections.weather === 'cold') {
    if (/냉면|물회|콩국수|빙수/.test(category)) penalty -= 15;
  }
  return penalty;
}

// ── 매칭 함수 (App.js와 동일) ──
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
    const hasHangoverCategory = r.category && /(국밥|순대국|해장국|해장|육개장|감자탕|뼈다귀|곰탕|설렁탕|탕|찌개)/.test(r.category);
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
    const isComfortFood = r.mood && Array.isArray(r.mood) && (r.mood.includes('great') || r.mood.includes('exciting'));
    const category = r.category || '';
    const hasComfortCategory = category.includes('디저트') || category.includes('카페') || category.includes('빵') || category.includes('떡볶이') || category.includes('치킨') || category.includes('파스타') || category.includes('라멘');
    return hasMoodTag || isComfortFood || hasComfortCategory;
  }
  if (mood === 'exciting') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('exciting');
    const isSpecial = r.ribbon || (r.mood && Array.isArray(r.mood) && r.mood.includes('great'));
    const category = r.category || '';
    const hasExcitingCategory = category.includes('오마카세') || category.includes('코스') || category.includes('프리미엄') || category.includes('스테이크');
    return hasMoodTag || isSpecial || hasExcitingCategory;
  }
  if (mood === 'hearty') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('hearty');
    const category = r.category || '';
    const isHearty = category.includes('구이') || category.includes('갈비') || category.includes('삼겹') || category.includes('돈까스') || category.includes('카츠') || category.includes('육') || category.includes('불고기') || category.includes('곱창');
    const isHighCal = r.calorie && r.calorie.label === '고칼로리';
    const isCafeOrBrunch = /(카페|디저트|브런치|팬케이크|베이커리|빵)/.test(category);
    return hasMoodTag || isHearty || (isHighCal && !isCafeOrBrunch);
  }
  if (mood === 'stressed') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('stressed');
    const category = r.category || '';
    const menuText = (r.menus || []).join(' ');
    const isStressRelief = category.includes('구이') || category.includes('매운') || category.includes('불') || category.includes('마라') || category.includes('떡볶이') || category.includes('닭갈비') || category.includes('곱창') || category.includes('삼겹');
    const hasSpicyMenu = /매운|불닭|마라|떡볶이|쭈꾸미|닭발|엽기/.test(menuText);
    return hasMoodTag || isStressRelief || hasSpicyMenu;
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
  const tolerance = Math.max(2000, budgetNum * 0.20);
  return min - budgetNum <= tolerance;
}

// ── 종합 점수 계산 (App.js와 동일 로직) ──
function calculateFullScore(r, selections, budgetNum) {
  const matches = [
    matchWeather(r, selections.weather),
    matchMood(r, selections.mood),
    matchPeople(r, selections.people),
    matchDiet(r, selections.diet),
    matchBudget(r, budgetNum)
  ];
  const matchCount = matches.filter(Boolean).length;
  
  // 동적 가중치
  const weights = getWeightProfile(selections);
  let totalScore = 
    (matches[0] ? weights.weather : 0) +
    (matches[1] ? weights.mood : 0) +
    (matches[2] ? weights.people : 0) +
    (matches[3] ? weights.diet : 0) +
    (matches[4] ? weights.budget : 0);
    
  const rating = parseFloat(r.rating) || 0;
  totalScore += rating * 2;
  if (r.ribbon) totalScore += 10;
  
  // 예산 근접도
  const parsed = parsePriceRange(r);
  if (parsed) {
    const { min } = parsed;
    const budgetDiff = Math.abs(min - budgetNum);
    if (matches[4]) {
      if (min <= budgetNum) {
        if (budgetDiff < 2000) totalScore += 8;
        else if (budgetDiff < 5000) totalScore += 5;
        else totalScore += 2;
      } else {
        if (budgetDiff < 2000) totalScore += 3;
        else totalScore -= 3;
      }
    } else {
      if (budgetDiff < 5000) totalScore -= 10;
      else if (budgetDiff < 10000) totalScore -= 20;
      else totalScore -= 30;
    }
  }
  
  // 칼로리 시너지
  if (selections.diet === 'diet' || selections.diet === 'light' || selections.diet === 'vegetarian') {
    if (r.calorie && r.calorie.label === '저칼로리') totalScore += 6;
    else if (r.calorie && r.calorie.label === '보통칼로리') totalScore += 2;
    else if (r.calorie && r.calorie.label === '고칼로리') totalScore -= 15;
  }
  
  // mood 핵심 미매칭 감점
  if (['hangover', 'executive'].includes(selections.mood) && !matches[1]) {
    totalScore -= 25;
  }
  
  // 네거티브 어피니티
  totalScore += getNegativeAffinityPenalty(r, selections);
  
  return { totalScore, matches, matchCount, weights, negPenalty: getNegativeAffinityPenalty(r, selections) };
}

// ══════════════════════════════════════════════════════════════════
//  7대 핵심 시나리오 정확도 검증
// ══════════════════════════════════════════════════════════════════

const scenarios = [
  {
    name: '🍜 시나리오 1: 해장 (숙취 해소)',
    selections: { weather: 'cold', mood: 'hangover', people: 'small', diet: 'nodiet', budget: '12000' },
    expectedKeywords: ['국밥', '설렁탕', '탕', '해장', '순대국', '감자탕', '곰탕', '뼈다귀', '찌개', '순대'],
    unexpectedKeywords: ['파스타', '스테이크', '샐러드', '오마카세'],
    description: 'TOP3에 국밥/탕류가 상위에 있어야 함',
  },
  {
    name: '🤵 시나리오 2: 격식있는 임원 접대',
    selections: { weather: 'mild', mood: 'executive', people: 'medium', diet: 'nodiet', budget: '30000' },
    expectedKeywords: ['오마카세', '코스', '스테이크', '한정식', '한우', '프리미엄'],
    unexpectedKeywords: ['분식', '떡볶이', '김밥', '국밥', '백반', '순대'],
    ribbonPreferred: true,
    description: 'TOP3에 고급 식당/블루리본이 상위에 있어야 함',
  },
  {
    name: '🌧️ 시나리오 3: 비오는 날 혼밥',
    selections: { weather: 'rainy', mood: 'safe', people: 'solo', diet: 'nodiet', budget: '12000' },
    expectedKeywords: ['칼국수', '짬뽕', '국밥', '수제비', '파전', '전'],
    description: 'TOP3에 국물/전 메뉴가 상위에 있어야 함',
  },
  {
    name: '🥗 시나리오 4: 다이어트 (식단관리)',
    selections: { weather: 'mild', mood: 'safe', people: 'solo', diet: 'diet', budget: '12000' },
    expectedKeywords: ['샐러드', '포케', '그릭', '저칼로리', '다이어트'],
    unexpectedKeywords: ['삼겹', '갈비', '고칼로리', '곱창'],
    description: 'TOP3에 저칼로리/샐러드 식당이 상위에 있어야 함',
  },
  {
    name: '👥 시나리오 5: 팀 회식 (6인 이상)',
    selections: { weather: 'mild', mood: 'team', people: 'large', diet: 'nodiet', budget: '20000' },
    peopleTagRequired: ['large', 'medium'],
    description: 'TOP3에 단체석 가능한 식당이 있어야 함',
  },
  {
    name: '💪 시나리오 6: 든든하게 먹고 싶어',
    selections: { weather: 'mild', mood: 'hearty', people: 'small', diet: 'nodiet', budget: '15000' },
    expectedKeywords: ['구이', '갈비', '삼겹', '돈까스', '카츠', '불고기', '육', '곱창'],
    unexpectedKeywords: ['샐러드', '포케', '요거트'],
    description: 'TOP3에 고기/돈까스 등 든든한 식당이 상위에 있어야 함',
  },
  {
    name: '🔥 시나리오 7: 더운 날 시원하게',
    selections: { weather: 'hot', mood: 'safe', people: 'solo', diet: 'nodiet', budget: '12000' },
    expectedKeywords: ['냉면', '콩국수', '물회', '냉모밀', '샐러드', '냉채'],
    description: 'TOP3에 시원한 메뉴가 상위에 있어야 함',
  },
];

// ── 비교 기준: 구 방식 (matchCount * 20) ──
function calculateOldScore(r, selections, budgetNum) {
  const matches = [
    matchWeather(r, selections.weather),
    matchMood(r, selections.mood),
    matchPeople(r, selections.people),
    matchDiet(r, selections.diet),
    matchBudget(r, budgetNum)
  ];
  const matchCount = matches.filter(Boolean).length;
  let totalScore = matchCount * 20;
  
  const isMoodCritical = ['hangover', 'executive'].includes(selections.mood);
  const isDietCritical = selections.diet && selections.diet !== 'nodiet';
  if (isMoodCritical && matches[1]) totalScore += 30;
  if (isDietCritical && matches[3]) totalScore += 20;
  
  const rating = parseFloat(r.rating) || 0;
  totalScore += rating * 2;
  if (r.ribbon) totalScore += 10;
  
  const parsed = parsePriceRange(r);
  if (parsed) {
    const { min } = parsed;
    const budgetDiff = Math.abs(min - budgetNum);
    if (matches[4]) {
      if (min <= budgetNum) {
        if (budgetDiff < 2000) totalScore += 8;
        else if (budgetDiff < 5000) totalScore += 5;
        else totalScore += 2;
      } else {
        if (budgetDiff < 2000) totalScore += 3;
        else totalScore -= 3;
      }
    } else {
      if (budgetDiff < 5000) totalScore -= 10;
      else if (budgetDiff < 10000) totalScore -= 20;
      else totalScore -= 30;
    }
  }
  
  if (selections.diet === 'diet' || selections.diet === 'light' || selections.diet === 'vegetarian') {
    if (r.calorie && r.calorie.label === '저칼로리') totalScore += 6;
    else if (r.calorie && r.calorie.label === '보통칼로리') totalScore += 2;
    else if (r.calorie && r.calorie.label === '고칼로리') totalScore -= 15;
  }
  
  if (['hangover', 'executive'].includes(selections.mood) && !matches[1]) {
    totalScore -= 25;
  }
  
  return { totalScore, matches, matchCount };
}

// ══════════════════════════════════════════════════════════════════
//  테스트 실행
// ══════════════════════════════════════════════════════════════════

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  KT 점심 추천기 — 추천 정확도 심층 검증');
console.log('  동적 가중치 + 네거티브 어피니티 적용 결과 vs 구 방식 비교');
console.log('══════════════════════════════════════════════════════════════════════\n');

let totalTests = 0;
let passCount = 0;
let warnCount = 0;
let failCount = 0;

scenarios.forEach((scenario, idx) => {
  const { selections } = scenario;
  const budgetNum = parseInt(selections.budget);
  const profile = getWeightProfile(selections);
  
  // 신규 점수로 전체 식당 평가
  const scored = restaurantDB.map(r => ({
    ...r,
    ...calculateFullScore(r, selections, budgetNum),
  })).sort((a, b) => b.totalScore - a.totalScore);
  
  // 구 방식으로 전체 식당 평가
  const oldScored = restaurantDB.map(r => ({
    ...r,
    ...calculateOldScore(r, selections, budgetNum),
  })).sort((a, b) => b.totalScore - a.totalScore);
  
  const top5 = scored.slice(0, 5);
  const oldTop5 = oldScored.slice(0, 5);
  
  console.log(`${'─'.repeat(70)}`);
  console.log(`${scenario.name}`);
  console.log(`   조건: weather=${selections.weather}, mood=${selections.mood}, people=${selections.people}, diet=${selections.diet}, budget=${selections.budget}원`);
  console.log(`   적용 프로필: ${JSON.stringify(profile)}`);
  console.log(`   ${scenario.description}`);
  console.log();
  
  // TOP5 출력 (신규)
  console.log('   📊 신규 방식 (동적 가중치) TOP5:');
  top5.forEach((r, i) => {
    const matchStr = r.matches.map((m, j) => {
      const labels = ['W', 'M', 'P', 'D', 'B'];
      return m ? `${labels[j]}✅` : `${labels[j]}❌`;
    }).join(' ');
    const negStr = r.negPenalty < 0 ? ` neg:${r.negPenalty}` : '';
    console.log(`     ${i+1}. ${r.name} (score:${r.totalScore}, match:${r.matchCount}) [${matchStr}]${negStr}`);
    console.log(`        카테고리: ${r.category || '-'} | 가격: ${r.price || '-'} | 평점: ${r.rating || '-'}${r.ribbon ? ' 🏅블루리본' : ''}`);
  });
  console.log();
  
  // TOP5 출력 (구 방식)
  console.log('   📈 구 방식 (matchCount×20) TOP5:');
  oldTop5.forEach((r, i) => {
    const matchStr = r.matches.map((m, j) => {
      const labels = ['W', 'M', 'P', 'D', 'B'];
      return m ? `${labels[j]}✅` : `${labels[j]}❌`;
    }).join(' ');
    console.log(`     ${i+1}. ${r.name} (score:${r.totalScore}, match:${r.matchCount}) [${matchStr}]`);
  });
  console.log();
  
  // ── 정확도 검증 ──
  let scenarioPass = true;
  
  // 검증 1: 기대 키워드 매칭
  if (scenario.expectedKeywords) {
    const top3Categories = top5.slice(0, 3).map(r => (r.category || '').toLowerCase());
    const top3Menus = top5.slice(0, 3).flatMap(r => (r.menus || []).map(m => m.toLowerCase()));
    const top3Text = [...top3Categories, ...top3Menus].join(' ');
    
    const matchedKeywords = scenario.expectedKeywords.filter(kw => top3Text.includes(kw.toLowerCase()));
    const keywordMatchRate = matchedKeywords.length / scenario.expectedKeywords.length;
    
    if (matchedKeywords.length > 0) {
      console.log(`   ✅ 기대 키워드 매칭: ${matchedKeywords.join(', ')} (${matchedKeywords.length}/${scenario.expectedKeywords.length})`);
      passCount++;
    } else {
      console.log(`   ❌ 기대 키워드 미매칭! TOP3에 ${scenario.expectedKeywords.join('/')} 없음`);
      failCount++;
      scenarioPass = false;
    }
    totalTests++;
  }
  
  // 검증 2: 부적합 키워드 제외
  if (scenario.unexpectedKeywords) {
    const top3Categories = top5.slice(0, 3).map(r => (r.category || '').toLowerCase());
    const top3Text = top3Categories.join(' ');
    
    const foundUnexpected = scenario.unexpectedKeywords.filter(kw => top3Text.includes(kw.toLowerCase()));
    if (foundUnexpected.length === 0) {
      console.log(`   ✅ 부적합 키워드 없음 (TOP3에 ${scenario.unexpectedKeywords.join('/')} 미포함)`);
      passCount++;
    } else {
      console.log(`   ⚠️ 부적합 키워드 발견: ${foundUnexpected.join(', ')}`);
      warnCount++;
      scenarioPass = false;
    }
    totalTests++;
  }
  
  // 검증 3: 블루리본 우대 (격식)
  if (scenario.ribbonPreferred) {
    const ribbonInTop3 = top5.slice(0, 3).filter(r => r.ribbon).length;
    if (ribbonInTop3 >= 1) {
      console.log(`   ✅ 블루리본 식당 TOP3에 ${ribbonInTop3}개 포함`);
      passCount++;
    } else {
      console.log(`   ⚠️ TOP3에 블루리본 식당 없음`);
      warnCount++;
    }
    totalTests++;
  }
  
  // 검증 4: 인원 태그 (팀)
  if (scenario.peopleTagRequired) {
    const top3WithTag = top5.slice(0, 3).filter(r => 
      r.people && scenario.peopleTagRequired.some(tag => r.people.includes(tag))
    );
    if (top3WithTag.length >= 2) {
      console.log(`   ✅ TOP3 중 ${top3WithTag.length}개가 단체석 가능 (${scenario.peopleTagRequired.join('/')} 태그)`);
      passCount++;
    } else {
      console.log(`   ⚠️ TOP3 중 단체석 가능 식당 ${top3WithTag.length}개 (부족)`);
      warnCount++;
    }
    totalTests++;
  }
  
  // 검증 5: 신규 vs 구 방식 점수 차이 (변별력)
  const newTop1Score = top5[0].totalScore;
  const newTop5Score = top5[4].totalScore;
  const oldTop1Score = oldTop5[0].totalScore;
  const oldTop5Score = oldTop5[4].totalScore;
  const newSpread = newTop1Score - newTop5Score;
  const oldSpread = oldTop1Score - oldTop5Score;
  
  console.log(`   📏 점수 분포: 신규 TOP1=${newTop1Score} TOP5=${newTop5Score} (편차=${newSpread.toFixed(1)}) | 구 TOP1=${oldTop1Score} TOP5=${oldTop5Score} (편차=${oldSpread.toFixed(1)})`);
  
  // 검증 6: mood 매칭 - 핵심 mood 시나리오에서 TOP3가 mood 매칭인지
  if (['hangover', 'executive', 'hearty'].includes(selections.mood)) {
    const moodMatchedInTop3 = top5.slice(0, 3).filter(r => r.matches[1]).length;
    if (moodMatchedInTop3 >= 2) {
      console.log(`   ✅ TOP3 중 ${moodMatchedInTop3}개 mood 매칭 (${selections.mood})`);
      passCount++;
    } else {
      console.log(`   ❌ TOP3 중 mood 매칭 ${moodMatchedInTop3}개 — ${selections.mood}에 부적합한 추천`);
      failCount++;
      scenarioPass = false;
    }
    totalTests++;
  }
  
  // 검증 7: 전체 5개 조건 매칭률
  const avgMatchCount = top5.reduce((sum, r) => sum + r.matchCount, 0) / 5;
  if (avgMatchCount >= 3.5) {
    console.log(`   ✅ TOP5 평균 매칭 조건: ${avgMatchCount.toFixed(1)}개 / 5개`);
    passCount++;
  } else if (avgMatchCount >= 2.5) {
    console.log(`   ⚠️ TOP5 평균 매칭 조건: ${avgMatchCount.toFixed(1)}개 / 5개 (개선 필요)`);
    warnCount++;
  } else {
    console.log(`   ❌ TOP5 평균 매칭 조건: ${avgMatchCount.toFixed(1)}개 / 5개 (매우 낮음)`);
    failCount++;
  }
  totalTests++;
  
  // 검증 8: 순위 변동 분석 (구 → 신)
  const newTop3Names = top5.slice(0, 3).map(r => r.name);
  const oldTop3Names = oldTop5.slice(0, 3).map(r => r.name);
  const stayedInTop3 = newTop3Names.filter(n => oldTop3Names.includes(n));
  const newEntries = newTop3Names.filter(n => !oldTop3Names.includes(n));
  const droppedEntries = oldTop3Names.filter(n => !newTop3Names.includes(n));
  
  if (newEntries.length > 0 || droppedEntries.length > 0) {
    console.log(`   🔄 순위 변동: 유지=${stayedInTop3.length}, 신규진입=${newEntries.length}, 탈락=${droppedEntries.length}`);
    if (newEntries.length > 0) console.log(`      ↑ 신규진입: ${newEntries.join(', ')}`);
    if (droppedEntries.length > 0) console.log(`      ↓ 탈락: ${droppedEntries.join(', ')}`);
  } else {
    console.log(`   ℹ️ 순위 변동 없음 (TOP3 동일)`);
  }
  
  console.log();
});

// ══════════════════════════════════════════════════════════════════
//  추가 검증: 네거티브 어피니티 효과 확인
// ══════════════════════════════════════════════════════════════════
console.log(`${'─'.repeat(70)}`);
console.log('🔍 네거티브 어피니티 효과 검증\n');

// 해장 시나리오에서 양식/일식(라멘 제외) 감점 확인
const hangoverSel = { weather: 'cold', mood: 'hangover', people: 'small', diet: 'nodiet', budget: '12000' };
const hangoverBudget = 12000;
const westernInHangover = restaurantDB.filter(r => {
  const matches = [
    matchWeather(r, hangoverSel.weather),
    matchMood(r, hangoverSel.mood),
    matchPeople(r, hangoverSel.people),
    matchDiet(r, hangoverSel.diet),
    matchBudget(r, hangoverBudget)
  ];
  return matches[1] && (r.cuisine === 'western' || (r.cuisine === 'japanese' && !/라멘|우동/.test(r.category || '')));
});
if (westernInHangover.length > 0) {
  console.log(`   해장 mood 매칭 + 양식/일식 감점 대상: ${westernInHangover.length}개`);
  westernInHangover.forEach(r => {
    const penalty = getNegativeAffinityPenalty(r, hangoverSel);
    console.log(`     - ${r.name} (${r.cuisine || '-'}, ${r.category || '-'}): 감점 ${penalty}`);
  });
  if (westernInHangover.every(r => getNegativeAffinityPenalty(r, hangoverSel) < 0)) {
    console.log(`   ✅ 모든 양식/일식(라멘제외) 식당에 감점 적용됨`);
    passCount++;
  } else {
    console.log(`   ❌ 일부 식당에 감점 미적용`);
    failCount++;
  }
} else {
  console.log(`   ℹ️ 해장 + 양식/일식 해당 식당 없음 (감점 대상 없음)`);
  passCount++;
}
totalTests++;

// 격식 시나리오에서 분식/캐주얼 감점 확인
const execSel = { weather: 'mild', mood: 'executive', people: 'medium', diet: 'nodiet', budget: '30000' };
const casualInExec = restaurantDB.filter(r => {
  return matchMood(r, 'executive') && /분식|떡볶이|김밥천국|포차|주점/.test(r.category || '');
});
console.log(`\n   격식 mood 매칭 + 캐주얼 감점 대상: ${casualInExec.length}개`);
if (casualInExec.length > 0) {
  casualInExec.forEach(r => {
    const penalty = getNegativeAffinityPenalty(r, execSel);
    console.log(`     - ${r.name} (${r.category || '-'}): 감점 ${penalty}`);
  });
}
totalTests++;
passCount++; // informational

console.log();

// ══════════════════════════════════════════════════════════════════
//  가중치 프로필 검증 — 올바른 프로필이 선택되는지
// ══════════════════════════════════════════════════════════════════
console.log(`${'─'.repeat(70)}`);
console.log('🔧 가중치 프로필 선택 검증\n');

const profileTests = [
  { sel: { mood: 'hangover', diet: 'nodiet', weather: 'cold' }, expected: 'hangover' },
  { sel: { mood: 'executive', diet: 'nodiet', weather: 'mild' }, expected: 'executive' },
  { sel: { mood: 'team', diet: 'nodiet', weather: 'mild' }, expected: 'team' },
  { sel: { mood: 'safe', diet: 'diet', weather: 'mild' }, expected: 'diet' },
  { sel: { mood: 'safe', diet: 'vegetarian', weather: 'mild' }, expected: 'diet' },
  { sel: { mood: 'safe', diet: 'nodiet', weather: 'rainy' }, expected: 'rainy' },
  { sel: { mood: 'safe', diet: 'nodiet', weather: 'hot' }, expected: 'hot' },
  { sel: { mood: 'safe', diet: 'nodiet', weather: 'cold' }, expected: 'cold' },
  { sel: { mood: 'safe', diet: 'nodiet', weather: 'mild' }, expected: 'default' },
  { sel: { mood: 'hearty', diet: 'nodiet', weather: 'mild' }, expected: 'hearty' },
  { sel: { mood: 'sad', diet: 'nodiet', weather: 'mild' }, expected: 'sad' },
  { sel: { mood: 'exciting', diet: 'nodiet', weather: 'mild' }, expected: 'exciting' },
  // 우선순위 테스트: diet > mood > weather
  { sel: { mood: 'hangover', diet: 'diet', weather: 'rainy' }, expected: 'diet', note: 'diet가 mood보다 우선' },
  { sel: { mood: 'hearty', diet: 'nodiet', weather: 'rainy' }, expected: 'hearty', note: 'mood가 weather보다 우선' },
];

let profilePass = 0;
profileTests.forEach(({ sel, expected, note }) => {
  const profile = getWeightProfile(sel);
  const expectedProfile = WEIGHT_PROFILES[expected];
  const match = JSON.stringify(profile) === JSON.stringify(expectedProfile);
  if (match) {
    profilePass++;
    passCount++;
  } else {
    failCount++;
  }
  const icon = match ? '✅' : '❌';
  const noteStr = note ? ` (${note})` : '';
  console.log(`   ${icon} mood=${sel.mood}, diet=${sel.diet}, weather=${sel.weather} → ${expected}${noteStr}`);
  totalTests++;
});

console.log(`\n   프로필 선택 정확도: ${profilePass}/${profileTests.length}\n`);

// ══════════════════════════════════════════════════════════════════
//  최종 결과
// ══════════════════════════════════════════════════════════════════
console.log('══════════════════════════════════════════════════════════════════════');
console.log(`  📊 최종 결과: ${passCount} PASS / ${failCount} FAIL / ${warnCount} WARN (총 ${totalTests}개)`);
console.log('══════════════════════════════════════════════════════════════════════');

if (failCount === 0) {
  console.log('\n✅ 추천 정확도 검증 통과! 동적 가중치 + 네거티브 어피니티가 정상 작동합니다.\n');
} else {
  console.log(`\n⚠️ ${failCount}개 항목에서 정확도 문제 발견. 위 결과를 확인하세요.\n`);
}

process.exit(failCount > 0 ? 1 : 0);
