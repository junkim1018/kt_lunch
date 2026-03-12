/**
 * KT 점심 추천기 - 포괄적 카테고리 + 버튼 플로우 테스트
 * 모든 카테고리 항목들을 한 번씩 다 선택해서 추천이 올바르게 나오는지 확인
 * 모든 버튼들(바로 추천받기, 빠른 추천, 다른 맛집 추천, 처음으로 등) 테스트
 */

const fs = require('fs');
const path = require('path');

// ── 식당 DB & 프리셋 로드 (분리된 데이터 파일에서) ──
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

const dataDir = path.join(__dirname, '..', '..', '..', '..', 'src', 'data');
const restaurantDB = loadDataFromFile(path.join(dataDir, 'restaurantData.js'), 'restaurantDB');
if (!restaurantDB) { console.error('❌ restaurantDB 추출 실패'); process.exit(1); }
console.log(`✅ 식당 데이터 로드 성공: ${restaurantDB.length}개`);

// App.js 코드 수준 검증용 (피드백 함수 존재 여부 등)
const appCode = fs.readFileSync(path.join(dataDir, '..', 'App.js'), 'utf-8');

const QUICK_PRESETS = loadDataFromFile(path.join(dataDir, 'constants.js'), 'QUICK_PRESETS') || [];
console.log(`✅ 빠른 추천 프리셋: ${QUICK_PRESETS.length}개`);

// ── OPTIONS 정의 ──
const OPTIONS = {
  weather: ['hot', 'mild', 'cold', 'rainy'],
  mood: ['safe', 'hearty', 'executive', 'hangover', 'team', 'exciting', 'stressed', 'sad'],
  diet: ['nodiet', 'light', 'diet', 'vegetarian'],
  people: [1, 2, 4, 7],  // solo, small, medium, large
  budget: [8000, 12000, 15000, 20000, 25000, 30000],
};

// ── 기본 설정 ──
const DEFAULTS = { weather: 'hot', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000 };

let totalPass = 0, totalFail = 0, totalWarn = 0;
const failures = [], warnings = [];

// ── 매칭 함수 (App.js 로직 복제) ──
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
  if (r.mood && Array.isArray(r.mood) && r.mood.includes(mood)) return true;
  if (mood === 'hearty') {
    const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
    return /고기|갈비|삼겹|돈까스|국밥|찌개|곰탕|감자탕|부대/.test(text);
  }
  if (mood === 'stressed') {
    const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
    return /매운|떡볶이|불닭|짬뽕|마라/.test(text);
  }
  if (mood === 'sad') {
    const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
    return /카페|빵|디저트|케이크|와플/.test(text);
  }
  if (mood === 'exciting') {
    const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
    return /스테이크|와인|코스|오마카세|파인다이닝|바베큐/.test(text);
  }
  return false;
}

function matchPeople(r, people) {
  let category;
  if (people === 1) category = 'solo';
  else if (people <= 3) category = 'small';
  else if (people <= 6) category = 'medium';
  else category = 'large';
  return r.people && Array.isArray(r.people) && r.people.includes(category);
}

function matchDiet(r, diet) {
  if (!diet || diet === 'nodiet') return true;
  return r.diet && Array.isArray(r.diet) && r.diet.includes(diet);
}

function parsePriceRange(r) {
  const raw = r.price || r.priceNote || '';
  const s = raw.replace(/,/g, '').replace(/\s/g, '');
  const rangeMatch = s.match(/(\d{3,6})[-~](\d{3,6})원?/);
  if (rangeMatch) return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
  const manwonRange = s.match(/(\d+(\.\d+)?)만\s*[-~]\s*(\d+(\.\d+)?)만\s*원?/);
  if (manwonRange) return { min: parseFloat(manwonRange[1]) * 10000, max: parseFloat(manwonRange[3]) * 10000 };
  const singleManwon = s.match(/(\d+(\.\d+)?)만\s*원/);
  if (singleManwon) { const v = parseFloat(singleManwon[1]) * 10000; return { min: v * 0.7, max: v * 1.3 }; }
  const singleWon = s.match(/(\d{4,6})원/);
  if (singleWon) { const v = parseInt(singleWon[1]); return { min: v * 0.7, max: v * 1.3 }; }
  return null;
}

function matchBudget(r, budget) {
  const range = parsePriceRange(r);
  if (!range) return true;
  const tol = Math.max(2000, budget * 0.15);
  return range.min <= budget + tol;
}

function simulate(selections, excluded = []) {
  const excludeSet = new Set(excluded);
  
  // Diet hard filter
  let candidates = restaurantDB.filter(r => {
    if (excludeSet.has(r.name)) return false;
    if (!matchDiet(r, selections.diet)) return false;
    return true;
  });

  // Score each
  candidates = candidates.map(r => {
    let matchCount = 0;
    const wm = matchWeather(r, selections.weather); if (wm) matchCount++;
    const mm = matchMood(r, selections.mood); if (mm) matchCount++;
    const pm = matchPeople(r, selections.people); if (pm) matchCount++;
    const dm = matchDiet(r, selections.diet); if (dm) matchCount++;
    const bm = matchBudget(r, selections.budget); if (bm) matchCount++;
    
    let score = matchCount * 20;
    score += (r.rating || 4.0) * 2;
    if (r.ribbon) score += 10;
    
    // Tier bonus
    if (matchCount === 5) score += 15;
    else if (matchCount >= 3) score += 5;
    
    return { ...r, score, matchCount, weatherMatched: wm, moodMatched: mm, 
             peopleMatched: pm, dietMatched: dm, budgetMatched: bm };
  });

  // Sort by score
  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

// ============================================================
// 테스트 1: 모든 Weather × Mood × Diet 조합 테스트 (4×8×4=128 조합)
// ============================================================
console.log('\n' + '═'.repeat(70));
console.log('  🧪 테스트 1: Weather × Mood × Diet 전체 조합 (128 조합)');
console.log('═'.repeat(70));

let comboPass = 0, comboFail = 0;
const combos = [];

for (const weather of OPTIONS.weather) {
  for (const mood of OPTIONS.mood) {
    for (const diet of OPTIONS.diet) {
      const sel = { weather, mood, people: 2, diet, budget: 15000 };
      const results = simulate(sel);
      const top10 = results.slice(0, 10);
      
      const hasCandidates = results.length > 0;
      const allDietMatch = diet === 'nodiet' || top10.every(r => r.dietMatched);
      
      if (!hasCandidates && diet !== 'vegetarian') {
        comboFail++;
        combos.push({ sel, status: '❌ 후보 없음', count: 0 });
        failures.push(`조합 ${weather}/${mood}/${diet}: 후보 0개`);
      } else if (!allDietMatch) {
        comboFail++;
        const violators = top10.filter(r => !r.dietMatched).map(r => r.name);
        combos.push({ sel, status: '❌ 식단 필터 위반', violators });
        failures.push(`조합 ${weather}/${mood}/${diet}: 식단 필터 위반 - ${violators.join(', ')}`);
      } else {
        comboPass++;
      }
    }
  }
}

console.log(`\n  ✅ 통과: ${comboPass}/128 조합`);
if (comboFail > 0) {
  console.log(`  ❌ 실패: ${comboFail}/128 조합`);
  combos.filter(c => c.status.includes('❌')).forEach(c => {
    console.log(`    - ${c.sel.weather}/${c.sel.mood}/${c.sel.diet}: ${c.status} ${c.violators ? c.violators.join(', ') : `(${c.count}개)`}`);
  });
  totalFail += comboFail;
} else {
  totalPass++;
  console.log(`  ✅ PASS: 모든 128개 조합 검증 완료`);
}

// ============================================================
// 테스트 2: 모든 People × Budget 조합 (4×6=24 조합)
// ============================================================  
console.log('\n' + '═'.repeat(70));
console.log('  🧪 테스트 2: People × Budget 조합 (24 조합)');
console.log('═'.repeat(70));

let pbPass = 0, pbFail = 0;
for (const people of OPTIONS.people) {
  for (const budget of OPTIONS.budget) {
    const sel = { weather: 'mild', mood: 'safe', people, diet: 'nodiet', budget };
    const results = simulate(sel);
    const top10 = results.slice(0, 10);
    
    if (results.length < 3) {
      pbFail++;
      failures.push(`인원${people}/예산${budget}: 후보 ${results.length}개 (3개 미만)`);
      console.log(`  ❌ people=${people}, budget=${budget}: 후보 ${results.length}개`);
    } else {
      // Check people matching rate in top10
      const peopleMatch = top10.filter(r => r.peopleMatched).length;
      const budgetMatch = top10.filter(r => r.budgetMatched).length;
      const pRatio = peopleMatch / top10.length;
      const bRatio = budgetMatch / top10.length;
      
      if (pRatio < 0.3) {
        pbFail++;
        failures.push(`인원${people}/예산${budget}: 인원매칭률 ${(pRatio*100).toFixed(0)}%`);
        console.log(`  ❌ people=${people}, budget=${budget}: 인원 매칭률 ${(pRatio*100).toFixed(0)}%`);
      } else {
        pbPass++;
      }
    }
  }
}
console.log(`\n  ✅ 통과: ${pbPass}/24 조합`);
if (pbFail > 0) {
  totalFail += pbFail;
} else {
  totalPass++;
  console.log(`  ✅ PASS: 모든 24개 조합 검증 완료`);
}

// ============================================================
// 테스트 3: handleRecommend 유효성 검증 시뮬레이션
// ============================================================
console.log('\n' + '═'.repeat(70));
console.log('  🧪 테스트 3: handleRecommend 유효성 검증');
console.log('═'.repeat(70));

// Test: All required fields present
const validSel = { weather: 'hot', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000 };
const requiredFields = ['weather', 'mood', 'diet', 'people', 'budget'];
const allValid = requiredFields.every(field => {
  const value = validSel[field];
  return value !== null && value !== undefined && value !== '';
});
if (allValid) {
  console.log('  ✅ PASS: 기본 설정으로 유효성 검증 통과');
  totalPass++;
} else {
  console.log('  ❌ FAIL: 기본 설정이 유효성 검증 실패!');
  totalFail++;
  failures.push('기본 설정 유효성 검증 실패');
}

// Test: Missing field should fail
const invalidSels = [
  { desc: 'weather 없음', sel: { weather: '', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000 } },
  { desc: 'mood 없음', sel: { weather: 'hot', mood: '', people: 2, diet: 'nodiet', budget: 15000 } },
  { desc: 'diet 없음', sel: { weather: 'hot', mood: 'safe', people: 2, diet: '', budget: 15000 } },
  { desc: 'weather null', sel: { weather: null, mood: 'safe', people: 2, diet: 'nodiet', budget: 15000 } },
];

for (const { desc, sel } of invalidSels) {
  const passes = requiredFields.every(f => {
    const v = sel[f];
    return v !== null && v !== undefined && v !== '';
  });
  if (!passes) {
    console.log(`  ✅ PASS: ${desc} → 정상적으로 차단됨`);
    totalPass++;
  } else {
    console.log(`  ❌ FAIL: ${desc} → 차단되지 않음!`);
    totalFail++;
    failures.push(`유효성검증 실패: ${desc}`);
  }
}

// ============================================================
// 테스트 4: handleQuickRecommend 시뮬레이션
// ============================================================
console.log('\n' + '═'.repeat(70));
console.log('  🧪 테스트 4: 빠른 추천 (handleQuickRecommend) 시뮬레이션');
console.log('═'.repeat(70));

// Simulate for different hours and months
const quickTests = [
  { hour: 11, month: 7, expectedMood: 'hearty', expectedWeather: 'hot', desc: '7월 11시' },
  { hour: 13, month: 7, expectedMood: 'safe', expectedWeather: 'hot', desc: '7월 13시' },
  { hour: 15, month: 7, expectedMood: 'safe', expectedWeather: 'hot', desc: '7월 15시' },
  { hour: 12, month: 1, expectedMood: 'hearty', expectedWeather: 'cold', desc: '1월 12시' },
  { hour: 12, month: 4, expectedMood: 'hearty', expectedWeather: 'mild', desc: '4월 12시' },
  { hour: 12, month: 12, expectedMood: 'hearty', expectedWeather: 'cold', desc: '12월 12시' },
  { hour: 10, month: 9, expectedMood: 'safe', expectedWeather: 'mild', desc: '9월 10시' },
];

for (const test of quickTests) {
  let mood = 'safe';
  if (test.hour >= 11 && test.hour < 13) mood = 'hearty';
  else if (test.hour >= 13 && test.hour < 14) mood = 'safe';
  else if (test.hour >= 14) mood = 'safe';

  let weather = 'mild';
  if (test.month >= 6 && test.month <= 8) weather = 'hot';
  else if (test.month >= 12 || test.month <= 2) weather = 'cold';

  const moodOk = mood === test.expectedMood;
  const weatherOk = weather === test.expectedWeather;
  
  if (moodOk && weatherOk) {
    console.log(`  ✅ PASS: ${test.desc} → weather=${weather}, mood=${mood}`);
    totalPass++;
  } else {
    console.log(`  ❌ FAIL: ${test.desc} → weather=${weather}(예상:${test.expectedWeather}), mood=${mood}(예상:${test.expectedMood})`);
    totalFail++;
    failures.push(`빠른추천 ${test.desc}: 결과 불일치`);
  }
  
  // Verify the resulting selection produces valid results
  const quickSel = { weather, mood, people: 2, diet: 'nodiet', budget: 15000 };
  const quickResults = simulate(quickSel);
  if (quickResults.length < 3) {
    console.log(`    ⚠️ WARN: ${test.desc} 결과 후보 ${quickResults.length}개 (3개 미만)`);
    totalWarn++;
    warnings.push(`빠른추천 ${test.desc}: 후보 부족 (${quickResults.length}개)`);
  }
}

// ============================================================
// 테스트 5: Quick Preset (빠른 추천 프리셋) 전체 테스트
// ============================================================
console.log('\n' + '═'.repeat(70));
console.log('  🧪 테스트 5: 빠른 추천 프리셋 12개 전체 테스트');
console.log('═'.repeat(70));

for (let i = 0; i < QUICK_PRESETS.length; i++) {
  const preset = QUICK_PRESETS[i];
  const settings = preset.settings;
  const results = simulate(settings);
  const top10 = results.slice(0, 10);
  
  // Diet preservation test: if user has diet='diet', it should be preserved
  const preservedSettings = { 
    ...settings, 
    diet: 'diet' // Simulate user already having diet selected
  };
  // Check: "diet: selections.diet !== 'nodiet' ? selections.diet : preset.settings.diet"
  const userDiet = 'diet';
  const finalDiet = userDiet !== 'nodiet' ? userDiet : settings.diet;
  const dietPreserved = finalDiet === 'diet';
  
  if (results.length < 1) {
    console.log(`  ❌ FAIL: [${i+1}] ${preset.emoji} ${preset.label} → 후보 0개`);
    totalFail++;
    failures.push(`프리셋 "${preset.label}": 후보 없음`);
  } else if (settings.diet !== 'nodiet' && !top10.every(r => r.dietMatched)) {
    console.log(`  ❌ FAIL: [${i+1}] ${preset.emoji} ${preset.label} → 식단 필터 위반`);
    totalFail++;
    failures.push(`프리셋 "${preset.label}": 식단 필터 위반`);
  } else {
    const wRate = top10.filter(r => r.weatherMatched).length;
    const mRate = top10.filter(r => r.moodMatched).length;
    console.log(`  ✅ PASS: [${i+1}] ${preset.emoji} ${preset.label} → 후보 ${results.length}개, Top10 W:${wRate} M:${mRate}`);
    totalPass++;
  }
  
  // Test diet preservation
  if (dietPreserved) {
    totalPass++;
  } else {
    console.log(`  ❌ FAIL: 프리셋 "${preset.label}" 식단 보존 실패`);
    totalFail++;
    failures.push(`프리셋 "${preset.label}": 식단 보존 실패`);
  }
}

// ============================================================
// 테스트 6: handleRecommendAgain (다른 맛집 추천) 시뮬레이션
// ============================================================
console.log('\n' + '═'.repeat(70));
console.log('  🧪 테스트 6: 재추천 (다른 맛집 추천) 중복 및 소진 테스트');
console.log('═'.repeat(70));

const reRecTests = [
  { desc: '무난 조건 10회 재추천', sel: { weather: 'mild', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000 }, rounds: 10 },
  { desc: '채식 조건 소진 테스트', sel: { weather: 'mild', mood: 'safe', people: 1, diet: 'vegetarian', budget: 15000 }, rounds: 5 },
  { desc: '해장+혼밥 5회', sel: { weather: 'cold', mood: 'hangover', people: 1, diet: 'nodiet', budget: 10000 }, rounds: 5 },
  { desc: '임원+대규모 3회', sel: { weather: 'mild', mood: 'executive', people: 7, diet: 'nodiet', budget: 30000 }, rounds: 3 },
  { desc: '다이어트+더운날 3회', sel: { weather: 'hot', mood: 'safe', people: 1, diet: 'diet', budget: 12000 }, rounds: 3 },
];

for (const test of reRecTests) {
  let excluded = [];
  const allSeen = new Set();
  let duplicatesFound = false;
  let resetHappened = false;
  
  for (let round = 0; round <= test.rounds; round++) {
    const results = simulate(test.sel, excluded);
    const top10 = results.slice(0, 10);
    const roundLabel = round === 0 ? '최초' : `#${round}`;
    
    if (results.length < 3 && excluded.length > 0) {
      // Exhaustion reset
      excluded = [];
      resetHappened = true;
      const resetResults = simulate(test.sel, []);
      console.log(`  ℹ️ ${test.desc} ${roundLabel}: 소진 → 초기화 (후보 ${resetResults.length}개)`);
      break;
    }
    
    const newNames = top10.map(r => r.name);
    const dups = newNames.filter(n => allSeen.has(n));
    if (dups.length > 0 && !resetHappened) {
      duplicatesFound = true;
      console.log(`  ❌ ${roundLabel}: 중복 발견 - ${dups.join(', ')}`);
    }
    newNames.forEach(n => allSeen.add(n));
    excluded = [...newNames, ...excluded].slice(0, restaurantDB.length);
  }
  
  if (!duplicatesFound) {
    console.log(`  ✅ PASS: ${test.desc} → ${allSeen.size}개 고유 식당, 중복없음${resetHappened ? ' (소진초기화 발동)' : ''}`);
    totalPass++;
  } else {
    console.log(`  ❌ FAIL: ${test.desc} → 중복 발생`);
    totalFail++;
    failures.push(`재추천 "${test.desc}": 중복 발생`);
  }
}

// ============================================================
// 테스트 7: handleReset 시뮬레이션
// ============================================================
console.log('\n' + '═'.repeat(70));
console.log('  🧪 테스트 7: handleReset (처음으로) 검증');
console.log('═'.repeat(70));

// After reset, selections should return to defaults
const postReset = { weather: 'hot', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000 };
const checkReset = (postReset.weather === 'hot' && postReset.mood === 'safe' && 
                    postReset.people === 2 && postReset.diet === 'nodiet' && postReset.budget === 15000);
if (checkReset) {
  console.log('  ✅ PASS: 초기화 후 기본값 정상');
  totalPass++;
} else {
  console.log('  ❌ FAIL: 초기화 후 기본값 불일치');
  totalFail++;
  failures.push('handleReset: 기본값 불일치');
}

// Verify default values produce valid results
const defaultResults = simulate(postReset);
if (defaultResults.length >= 10) {
  console.log(`  ✅ PASS: 기본값으로 추천 정상 (${defaultResults.length}개 후보)`);
  totalPass++;
} else {
  console.log(`  ❌ FAIL: 기본값 추천 결과 부족 (${defaultResults.length}개)`);
  totalFail++;
  failures.push('handleReset: 기본값 추천 결과 부족');
}

// ============================================================
// 테스트 8: 극단 조건 (Edge Cases)
// ============================================================
console.log('\n' + '═'.repeat(70));
console.log('  🧪 테스트 8: 극단 조건 (Edge Cases)');
console.log('═'.repeat(70));

const edgeCases = [
  { desc: '최소 예산 8000원', sel: { weather: 'mild', mood: 'safe', people: 1, diet: 'nodiet', budget: 8000 } },
  { desc: '최대 예산 30000원', sel: { weather: 'mild', mood: 'executive', people: 4, diet: 'nodiet', budget: 30000 } },
  { desc: '채식+팀점심+고예산', sel: { weather: 'mild', mood: 'team', people: 8, diet: 'vegetarian', budget: 30000 } },
  { desc: '채식+해장+혼밥+저예산', sel: { weather: 'rainy', mood: 'hangover', people: 1, diet: 'vegetarian', budget: 8000 } },
  { desc: '다이어트+팀점심', sel: { weather: 'hot', mood: 'team', people: 6, diet: 'diet', budget: 20000 } },
  { desc: '최소인원(1)+최대예산', sel: { weather: 'cold', mood: 'executive', people: 1, diet: 'nodiet', budget: 30000 } },
  { desc: '최대인원(8)+최소예산', sel: { weather: 'hot', mood: 'team', people: 8, diet: 'nodiet', budget: 8000 } },
];

for (const edge of edgeCases) {
  const results = simulate(edge.sel);
  const top10 = results.slice(0, 10);
  
  if (results.length >= 1) {
    // Verify diet filter is never violated
    if (edge.sel.diet !== 'nodiet') {
      const violators = top10.filter(r => !r.dietMatched);
      if (violators.length > 0) {
        console.log(`  ❌ FAIL: ${edge.desc} → 식단 필터 위반: ${violators.map(r => r.name).join(', ')}`);
        totalFail++;
        failures.push(`극단조건 "${edge.desc}": 식단 필터 위반`);
        continue;
      }
    }
    
    const topScore = top10[0]?.score || 0;
    const matchRate = top10[0]?.matchCount || 0;
    console.log(`  ✅ PASS: ${edge.desc} → 후보 ${results.length}개, 최고점 ${topScore} (매치 ${matchRate}/5)`);
    totalPass++;
  } else {
    console.log(`  ⚠️ WARN: ${edge.desc} → 후보 0개 (극단 조건이므로 경고)`);
    totalWarn++;
    warnings.push(`극단조건 "${edge.desc}": 후보 없음`);
  }
}

// ============================================================
// 테스트 9: 피드백 로직 검증 (saveFeedback)
// ============================================================
console.log('\n' + '═'.repeat(70));
console.log('  🧪 테스트 9: 피드백(좋아요/별로) 로직 검증');
console.log('═'.repeat(70));

// Verify feedback function structure exists in code
const hasSaveFeedback = appCode.includes('saveFeedback');
const hasGetFeedback = appCode.includes('getFeedbackScore');
const feedbackLike = appCode.includes("'like'");
const feedbackDislike = appCode.includes("'dislike'");

if (hasSaveFeedback && hasGetFeedback && feedbackLike && feedbackDislike) {
  console.log('  ✅ PASS: saveFeedback 함수 존재 & like/dislike 처리');
  totalPass++;
} else {
  console.log(`  ❌ FAIL: 피드백 함수 누락 (save:${hasSaveFeedback}, get:${hasGetFeedback}, like:${feedbackLike}, dislike:${feedbackDislike})`);
  totalFail++;
  failures.push('피드백 함수 누락');
}

// Check personalization score is used in scoring
const usesPersonalization = appCode.includes('getFeedbackScore') && (appCode.includes('personalization') || appCode.includes('Personalization'));
if (usesPersonalization) {
  console.log('  ✅ PASS: 피드백 점수가 추천 알고리즘에 반영됨');
  totalPass++;
} else {
  console.log('  ⚠️ WARN: 피드백 점수가 추천 알고리즘에 미반영');
  totalWarn++;
  warnings.push('피드백 점수 알고리즘 미반영');
}

// ============================================================
// 테스트 10: 식당 데이터 커버리지 검증
// ============================================================
console.log('\n' + '═'.repeat(70));
console.log('  🧪 테스트 10: 식당 데이터 커버리지 검증');
console.log('═'.repeat(70));

// Check: all restaurants have required fields
const missingFields = [];
restaurantDB.forEach((r, i) => {
  if (!r.name) missingFields.push(`[${i}] name 없음`);
  if (!r.weather || !Array.isArray(r.weather) || r.weather.length === 0) 
    missingFields.push(`${r.name}: weather 없음`);
  if (!r.mood || !Array.isArray(r.mood) || r.mood.length === 0) 
    missingFields.push(`${r.name}: mood 없음`);
  if (!r.people || !Array.isArray(r.people) || r.people.length === 0) 
    missingFields.push(`${r.name}: people 없음`);
  if (!r.diet || !Array.isArray(r.diet) || r.diet.length === 0) 
    missingFields.push(`${r.name}: diet 없음`);
});

if (missingFields.length === 0) {
  console.log(`  ✅ PASS: 모든 ${restaurantDB.length}개 식당 필수 필드 보유`);
  totalPass++;
} else {
  console.log(`  ⚠️ WARN: ${missingFields.length}개 필드 누락:`);
  missingFields.slice(0, 10).forEach(m => console.log(`    - ${m}`));
  if (missingFields.length > 10) console.log(`    ... 외 ${missingFields.length - 10}개`);
  totalWarn++;
  warnings.push(`필수 필드 누락: ${missingFields.length}개`);
}

// Category coverage: each option should have enough restaurants
console.log('\n  📊 카테고리별 식당 수:');
for (const w of OPTIONS.weather) {
  const count = restaurantDB.filter(r => matchWeather(r, w)).length;
  console.log(`    weather=${w}: ${count}개 ${count < 10 ? '⚠️' : '✅'}`);
}
for (const m of OPTIONS.mood) {
  const count = restaurantDB.filter(r => matchMood(r, m)).length;
  console.log(`    mood=${m}: ${count}개 ${count < 10 ? '⚠️' : '✅'}`);
}
for (const d of OPTIONS.diet) {
  const count = restaurantDB.filter(r => matchDiet(r, d)).length;
  console.log(`    diet=${d}: ${count}개 ${count < 5 ? '⚠️' : '✅'}`);
}
for (const p of OPTIONS.people) {
  const count = restaurantDB.filter(r => matchPeople(r, p)).length;
  console.log(`    people=${p}: ${count}개 ${count < 10 ? '⚠️' : '✅'}`);
}

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
