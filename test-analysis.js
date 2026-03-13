const { restaurantDB } = require('./src/data/restaurantData');

console.log('Total restaurants:', restaurantDB.length);

// === 1. Tag Coverage ===
console.log('\n=== TAG COVERAGE ===');
const fields = ['weather','mood','people','diet','budget'];
fields.forEach(f => {
  const hasField = restaurantDB.filter(r => r[f] && Array.isArray(r[f]) && r[f].length > 0).length;
  const missing = restaurantDB.filter(r => !r[f] || !Array.isArray(r[f]) || r[f].length === 0);
  console.log(`${f}: ${hasField}/${restaurantDB.length} have tags`);
  if (missing.length > 0 && missing.length <= 20) {
    console.log('  Missing:', missing.map(r => r.name).join(', '));
  } else if (missing.length > 20) {
    console.log(`  Missing: ${missing.length} restaurants`);
  }
});

// === 2. Weather tag distribution ===
console.log('\n=== WEATHER TAG DISTRIBUTION ===');
['hot','cold','rainy','mild'].forEach(w => {
  const count = restaurantDB.filter(r => r.weather && r.weather.includes(w)).length;
  console.log(`  ${w}: ${count} restaurants`);
});

// === 3. Mood tag distribution ===
console.log('\n=== MOOD TAG DISTRIBUTION ===');
['hangover','executive','team','hearty','stressed','sad','exciting','safe','great','normal'].forEach(m => {
  const count = restaurantDB.filter(r => r.mood && r.mood.includes(m)).length;
  console.log(`  ${m}: ${count} restaurants`);
});

// === 4. Diet tag distribution ===
console.log('\n=== DIET TAG DISTRIBUTION ===');
['nodiet','vegetarian','diet','light'].forEach(d => {
  const count = restaurantDB.filter(r => r.diet && r.diet.includes(d)).length;
  console.log(`  ${d}: ${count} restaurants`);
});

// === 5. matchWeather('mild') analysis - restaurants WITHOUT mild tag ===
console.log('\n=== MILD WEATHER BUG ANALYSIS ===');
const withMild = restaurantDB.filter(r => r.weather && r.weather.includes('mild'));
const withoutMild = restaurantDB.filter(r => !r.weather || !r.weather.includes('mild'));
console.log(`With mild tag: ${withMild.length}`);
console.log(`Without mild tag: ${withoutMild.length}`);
console.log('Without mild:', withoutMild.map(r => `${r.name} (weather: ${JSON.stringify(r.weather)})`).join('\n  '));

// === 6. matchWeather simulation ===
console.log('\n=== matchWeather SIMULATION ===');
function matchWeather(r, weatherVal) {
  if (!weatherVal) return false;
  const hasTag = r.weather && Array.isArray(r.weather) && r.weather.includes(weatherVal);
  if (hasTag) return true;
  const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
  if (weatherVal === 'hot') return /냉면|콩국수|물회|냉모밀|빙수|샐러드|냉채/.test(text);
  if (weatherVal === 'cold') return /국밥|탕|찌개|전골|라멘|설렁탕|갈비탕|부대/.test(text);
  if (weatherVal === 'rainy') return /파전|해물전|녹두전|감자전|부침|수제비|칼국수|국밥|짬뽕/.test(text);
  return false;
}

['hot','cold','rainy','mild'].forEach(w => {
  const matched = restaurantDB.filter(r => matchWeather(r, w));
  console.log(`weather=${w}: ${matched.length} matched`);
});

// === 7. Hangover mood analysis ===
console.log('\n=== HANGOVER MOOD ANALYSIS ===');
function matchMood(r, moodVal) {
  if (!moodVal) return false;
  if (moodVal === 'hangover') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('hangover');
    const hasHangoverCategory = r.category && /(국밥|순대국|해장국|해장|육개장|감자탕|뼈다귀|곰탕|설렁탕|탕|찌개)/.test(r.category);
    return hasMoodTag || hasHangoverCategory;
  }
  if (moodVal === 'executive') {
    const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('executive');
    const isUpscale = r.ribbon || (r.budget && Array.isArray(r.budget) && r.budget.includes('expensive'));
    const category = r.category || '';
    const isCasual = /(순대|분식|떡볶이|김밥|국밥|백반|푸드코트)/.test(category);
    return hasMoodTag || (isUpscale && !isCasual);
  }
  return false;
}

const hangoverMatched = restaurantDB.filter(r => matchMood(r, 'hangover'));
console.log(`Hangover matched: ${hangoverMatched.length}`);
hangoverMatched.forEach(r => {
  const byTag = r.mood && r.mood.includes('hangover');
  const byCategory = r.category && /(국밥|순대국|해장국|해장|육개장|감자탕|뼈다귀|곰탕|설렁탕|탕|찌개)/.test(r.category);
  console.log(`  ${r.name} (cat: ${r.category}) [tag:${byTag}, catMatch:${byCategory}]`);
});

// Check for hangover mismatches - restaurants that match via category but are NOT hangover foods
console.log('\n=== HANGOVER FALSE POSITIVES (category regex too broad?) ===');
hangoverMatched.forEach(r => {
  const byTag = r.mood && r.mood.includes('hangover');
  if (!byTag) {
    console.log(`  NO hangover tag but matched: ${r.name} (category: ${r.category})`);
  }
});

// === 8. Executive mood analysis ===
console.log('\n=== EXECUTIVE MOOD ANALYSIS ===');
const executiveMatched = restaurantDB.filter(r => matchMood(r, 'executive'));
console.log(`Executive matched: ${executiveMatched.length}`);
executiveMatched.forEach(r => {
  const byTag = r.mood && r.mood.includes('executive');
  const isUpscale = r.ribbon || (r.budget && r.budget.includes('expensive'));
  const category = r.category || '';
  const isCasual = /(순대|분식|떡볶이|김밥|국밥|백반|푸드코트)/.test(category);
  console.log(`  ${r.name} (${category}) [tag:${byTag}, upscale:${isUpscale}, casual:${isCasual}]`);
});

// === 9. Budget matchBudget analysis ===
console.log('\n=== BUDGET TOLERANCE ANALYSIS ===');
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
  if (min - budgetNum <= tolerance) return true;
  return false;
}

// Test: budget=8000, what expensive restaurants pass?
console.log('\nBudget=8000 matched restaurants:');
const budget8k = restaurantDB.filter(r => matchBudget(r, 8000));
budget8k.forEach(r => {
  const p = parsePriceRange(r);
  console.log(`  ${r.name}: price=${r.price} parsed_min=${p?.min} parsed_max=${p?.max}`);
});

console.log(`\nBudget=8000: ${budget8k.length} restaurants matched`);

// Test: budget=10000  
console.log('\nBudget=10000 matched restaurants (showing expensive ones):');
const budget10k = restaurantDB.filter(r => matchBudget(r, 10000));
const expensive10k = budget10k.filter(r => {
  const p = parsePriceRange(r);
  return p && p.min > 10000;
});
expensive10k.forEach(r => {
  const p = parsePriceRange(r);
  const tolerance = Math.max(2000, 10000 * 0.15);
  console.log(`  ${r.name}: min=${p.min}, over_budget_by=${p.min-10000}, tolerance=${tolerance}`);
});

// === 10. Vegetarian diet analysis ===
console.log('\n=== VEGETARIAN DIET ANALYSIS ===');
const vegMatched = restaurantDB.filter(r => r.diet && r.diet.includes('vegetarian'));
console.log(`Vegetarian tagged: ${vegMatched.length}`);
vegMatched.forEach(r => {
  console.log(`  ${r.name} (${r.category}) diet:${JSON.stringify(r.diet)}`);
});

// Check meat restaurants with vegetarian tag
console.log('\nVegetarian tagged but suspicious (meat/구이/갈비/삼겹 in category):');
vegMatched.forEach(r => {
  if (/(구이|갈비|삼겹|곱창|불고기|고기|돈까스|카츠|치킨|육|탕수육)/.test(r.category)) {
    console.log(`  BUG: ${r.name} (${r.category}) has vegetarian tag!`);
  }
});

// === 11. Price parsing failures ===
console.log('\n=== PRICE PARSING FAILURES ===');
const noPriceParsed = restaurantDB.filter(r => !parsePriceRange(r));
console.log(`No parseable price: ${noPriceParsed.length}`);
noPriceParsed.forEach(r => {
  console.log(`  ${r.name}: price="${r.price}" priceNote="${r.priceNote}"`);
});

// === 12. COMPLEX SCENARIO: rainy + hangover + budget 10000 ===
console.log('\n=== SCENARIO: rainy + hangover + solo + nodiet + budget 10000 ===');
const scenario1 = restaurantDB.filter(r => {
  const w = matchWeather(r, 'rainy');
  const m = matchMood(r, 'hangover');
  const p = r.people && r.people.includes('solo') || (r.people && r.people.includes('small'));
  const d = true; // nodiet
  const b = matchBudget(r, 10000);
  return w && m && p && d && b;
});
console.log(`Perfect match (all 5): ${scenario1.length}`);
scenario1.forEach(r => console.log(`  ${r.name} (${r.category}) price:${r.price}`));

// === 13. COMPLEX SCENARIO: hot + vegetarian + budget 8000 ===
console.log('\n=== SCENARIO: hot + safe + solo + vegetarian + budget 8000 ===');
const scenario2 = restaurantDB.filter(r => {
  const w = matchWeather(r, 'hot');
  const m = r.mood && r.mood.includes('safe');
  const p = r.people && (r.people.includes('solo') || r.people.includes('small'));
  const d = r.diet && r.diet.includes('vegetarian');
  const b = matchBudget(r, 8000);
  return w && m && p && d && b;
});
console.log(`Perfect match (all 5): ${scenario2.length}`);
scenario2.forEach(r => console.log(`  ${r.name} (${r.category}) price:${r.price}`));

// With relaxed (any 3+):
const scenario2relaxed = restaurantDB.filter(r => {
  const w = matchWeather(r, 'hot');
  const m = r.mood && r.mood.includes('safe');
  const p = r.people && (r.people.includes('solo') || r.people.includes('small'));
  const d = r.diet && r.diet.includes('vegetarian');
  const b = matchBudget(r, 8000);
  return [w,m,p,d,b].filter(Boolean).length >= 3;
});
console.log(`3+ matches: ${scenario2relaxed.length}`);
scenario2relaxed.forEach(r => {
  const w = matchWeather(r, 'hot');
  const m = r.mood && r.mood.includes('safe');
  const p = r.people && (r.people.includes('solo') || r.people.includes('small'));
  const d = r.diet && r.diet.includes('vegetarian');
  const b = matchBudget(r, 8000);
  console.log(`  ${r.name} [w:${w} m:${m} p:${p} d:${d} b:${b}]`);
});

// === 14. COMPLEX SCENARIO: cold + executive + large + budget 30000 ===
console.log('\n=== SCENARIO: cold + executive + large(8명) + nodiet + budget 30000 ===');
const scenario3 = restaurantDB.filter(r => {
  const w = matchWeather(r, 'cold');
  const m = matchMood(r, 'executive');
  const p = r.people && r.people.includes('large');
  const d = true;
  const b = matchBudget(r, 30000);
  return [w,m,p,d,b].filter(Boolean).length >= 3;
});
console.log(`3+ matches: ${scenario3.length}`);
scenario3.forEach(r => {
  const w = matchWeather(r, 'cold');
  const m = matchMood(r, 'executive');
  const p = r.people && r.people.includes('large');
  const b = matchBudget(r, 30000);
  console.log(`  ${r.name} (${r.category}) [w:${w} m:${m} p:${p} b:${b}]`);
});

// === 15. Stressed mood - check for false positives ===
console.log('\n=== STRESSED MOOD - FULL MATCH LIST ===');
function matchMoodStressed(r) {
  const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('stressed');
  const category = r.category || '';
  const menuText = (r.menus || []).join(' ');
  const isStressRelief = category.includes('구이') || category.includes('매운') ||
    category.includes('불') || category.includes('마라') ||
    category.includes('떡볶이') || category.includes('닭갈비') ||
    category.includes('곱창') || category.includes('삼겹');
  const hasSpicyMenu = /매운|불닭|마라|떡볶이|쭈꾸미|닭발|엽기/.test(menuText);
  return { matched: hasMoodTag || isStressRelief || hasSpicyMenu, byTag: hasMoodTag, byCat: isStressRelief, byMenu: hasSpicyMenu };
}

const stressedAll = restaurantDB.map(r => ({ ...r, ...matchMoodStressed(r) })).filter(r => r.matched);
console.log(`Stressed matched: ${stressedAll.length}`);
stressedAll.forEach(r => {
  console.log(`  ${r.name} (${r.category}) [tag:${r.byTag} cat:${r.byCat} menu:${r.byMenu}]`);
});

// Check for false positives - stressed matching non-stress foods
console.log('\nStressed false positives (불 in category but not spicy):');
stressedAll.filter(r => !r.byTag && r.byCat).forEach(r => {
  if (/불고기/.test(r.category)) {
    console.log(`  POTENTIAL: ${r.name} (${r.category}) - 불고기 is not stress food`);
  }
});

// === 16. Categories with 탕 that are NOT hangover ===
console.log('\n=== 탕 IN CATEGORY BUT NOT HANGOVER FOOD ===');
const tangRestaurants = restaurantDB.filter(r => r.category && /탕/.test(r.category));
tangRestaurants.forEach(r => {
  const isHangover = r.mood && r.mood.includes('hangover');
  const catDetail = r.category;
  // Check if it's actually hangover-appropriate
  const reallyHangover = /(해장|국밥|순대국|감자탕|뼈|곰탕|설렁탕|생태탕|대구탕|북어|탕수육)/.test(catDetail);
  if (!reallyHangover) {
    console.log(`  NOT hangover but has 탕: ${r.name} (${catDetail}) hangover_tag:${isHangover}`);
  }
});

// === 17. 탕수육 matches hangover regex? ===
console.log('\n=== 탕수육 MATCHES HANGOVER TEST ===');
const tangsuRestaurants = restaurantDB.filter(r => r.category && /탕수육/.test(r.category));
tangsuRestaurants.forEach(r => {
  const matchesHangoverRegex = /(국밥|순대국|해장국|해장|육개장|감자탕|뼈다귀|곰탕|설렁탕|탕|찌개)/.test(r.category);
  console.log(`  ${r.name} (${r.category}): matches hangover regex=${matchesHangoverRegex}`);
});

// === 18. 불고기 matches stressed regex? ===
console.log('\n=== 불고기 IN STRESSED REGEX ===');
const bulgogi = restaurantDB.filter(r => r.category && /불고기/.test(r.category));
bulgogi.forEach(r => {
  const matchesStressed = (r.category || '').includes('불');
  console.log(`  ${r.name} (${r.category}): stressed cat match via 불=${matchesStressed}`);
});
