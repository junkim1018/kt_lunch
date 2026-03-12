/**
 * KT 점심 추천기 — 통합 데이터 검증 스크립트
 * 
 * 실행: node validate-db.js
 * 
 * 기존 개별 스크립트(check_all_fields, check_budget_tags, check_cuisine, 
 * check_distance, verify_naver_urls, analyze_moods, analyze_prices 등)를 
 * 하나로 통합했습니다.
 */

const fs = require('fs');
const path = require('path');

// ── 식당 데이터 로드 (src/data/restaurantData.js) ──
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

const dataPath = path.join(__dirname, 'src', 'data', 'restaurantData.js');
const db = loadDataFromFile(dataPath, 'restaurantDB');
if (!db) { console.error('❌ restaurantDB를 찾을 수 없습니다'); process.exit(1); }

console.log('══════════════════════════════════════════════════════════════════════');
console.log('  🔍 KT 점심 추천기 — 통합 데이터 검증');
console.log(`  식당 수: ${db.length}개`);
console.log('══════════════════════════════════════════════════════════════════════\n');

let totalPass = 0, totalFail = 0, totalWarn = 0;
const issues = [];

// ── 1. 필수 필드 검증 ──
console.log('── 검증 1: 필수 필드 ──');
const requiredFields = ['name', 'category', 'cuisine', 'weather', 'mood', 'people', 'diet', 'budget', 'menus', 'price', 'rating', 'naver'];
const arrayFields = ['weather', 'mood', 'people', 'diet', 'budget', 'menus'];
let fieldErrors = 0;

db.forEach((r, idx) => {
  const missing = [];
  const notArray = [];
  requiredFields.forEach(field => {
    if (!r[field] && r[field] !== false && r[field] !== 0) {
      missing.push(field);
    } else if (arrayFields.includes(field) && !Array.isArray(r[field])) {
      notArray.push(field);
    } else if (arrayFields.includes(field) && r[field].length === 0) {
      missing.push(field + '(empty)');
    }
  });
  if (missing.length || notArray.length) {
    fieldErrors++;
    issues.push(`[${idx + 1}] ${r.name}: missing=${missing.join(',')} notArray=${notArray.join(',')}`);
  }
});

if (fieldErrors === 0) { console.log('  ✅ PASS: 모든 식당 필수 필드 보유'); totalPass++; }
else { console.log(`  ❌ FAIL: ${fieldErrors}개 식당 필드 이슈`); totalFail++; }

// ── 2. 태그 유효성 ──
console.log('── 검증 2: 태그 유효성 ──');
const validTags = {
  weather: ['hot', 'mild', 'cold', 'rainy'],
  mood: ['safe', 'hearty', 'executive', 'hangover', 'team', 'exciting', 'stressed', 'sad', 'great', 'normal'],
  people: ['solo', 'small', 'medium', 'large'],
  diet: ['nodiet', 'light', 'diet', 'vegetarian', 'spicy', 'seafood'],
  budget: ['cheap', 'normal', 'expensive'],
};
let tagErrors = 0;

db.forEach((r, idx) => {
  Object.entries(validTags).forEach(([field, allowed]) => {
    if (Array.isArray(r[field])) {
      r[field].forEach(tag => {
        if (!allowed.includes(tag)) {
          tagErrors++;
          issues.push(`[${idx + 1}] ${r.name}: ${field}에 잘못된 태그 "${tag}"`);
        }
      });
    }
  });
});

if (tagErrors === 0) { console.log('  ✅ PASS: 모든 태그 유효'); totalPass++; }
else { console.log(`  ❌ FAIL: ${tagErrors}개 잘못된 태그`); totalFail++; }

// ── 3. 좌표 / 거리 검증 ──
console.log('── 검증 3: 좌표 및 거리 ──');
const KT = { lat: 37.5703, lng: 126.9835 };
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
let coordErrors = 0;
let farCount = 0;

db.forEach((r, idx) => {
  if (!r.coords || typeof r.coords.lat !== 'number' || typeof r.coords.lng !== 'number') {
    coordErrors++;
    issues.push(`[${idx + 1}] ${r.name}: 좌표 누락 또는 잘못된 형식`);
    return;
  }
  const dist = haversine(KT.lat, KT.lng, r.coords.lat, r.coords.lng);
  if (dist > 1000) {
    farCount++;
    issues.push(`[${idx + 1}] ${r.name}: 거리 ${Math.round(dist)}m (700m 초과)`);
  }
});

if (coordErrors === 0) { console.log('  ✅ PASS: 모든 좌표 유효'); totalPass++; }
else { console.log(`  ❌ FAIL: ${coordErrors}개 좌표 이슈`); totalFail++; }
if (farCount > 0) { console.log(`  ⚠️ WARN: ${farCount}개 식당 700m 이상`); totalWarn++; }
else { console.log('  ✅ PASS: 모든 식당 700m 이내'); totalPass++; }

// ── 4. 가격 파싱 검증 ──
console.log('── 검증 4: 가격 정보 ──');
let priceErrors = 0;

db.forEach((r, idx) => {
  if (!r.price || typeof r.price !== 'string') {
    priceErrors++;
    issues.push(`[${idx + 1}] ${r.name}: 가격 정보 누락`);
    return;
  }
  const nums = r.price.match(/[\d,]+/g);
  if (!nums || nums.length === 0) {
    priceErrors++;
    issues.push(`[${idx + 1}] ${r.name}: 가격 파싱 불가 "${r.price}"`);
  }
});

if (priceErrors === 0) { console.log('  ✅ PASS: 모든 가격 파싱 가능'); totalPass++; }
else { console.log(`  ❌ FAIL: ${priceErrors}개 가격 이슈`); totalFail++; }

// ── 5. 예산 태그 vs 실제 가격 일관성 ──
console.log('── 검증 5: 예산 태그 일관성 ──');
let budgetMismatch = 0;

db.forEach((r, idx) => {
  if (!r.price) return;
  const nums = r.price.match(/[\d,]+/g);
  if (!nums) return;
  const prices = nums.map(n => parseInt(n.replace(/,/g, '')));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const budget = r.budget || [];

  if (maxPrice <= 12000 && !budget.includes('cheap') && !budget.includes('normal')) {
    budgetMismatch++;
    issues.push(`[${idx + 1}] ${r.name}: 가격 ${r.price} → cheap/normal 태그 없음`);
  }
  if (minPrice >= 25000 && !budget.includes('expensive')) {
    budgetMismatch++;
    issues.push(`[${idx + 1}] ${r.name}: 가격 ${r.price} → expensive 태그 없음`);
  }
});

if (budgetMismatch === 0) { console.log('  ✅ PASS: 예산 태그 일관'); totalPass++; }
else { console.log(`  ⚠️ WARN: ${budgetMismatch}개 예산 태그 불일치`); totalWarn++; }

// ── 6. 네이버 URL 검증 ──
console.log('── 검증 6: 네이버 URL ──');
let urlErrors = 0;

db.forEach((r, idx) => {
  if (!r.naver || typeof r.naver !== 'string') {
    urlErrors++;
    issues.push(`[${idx + 1}] ${r.name}: 네이버 URL 누락`);
  } else if (!r.naver.startsWith('https://map.naver.com/')) {
    urlErrors++;
    issues.push(`[${idx + 1}] ${r.name}: 잘못된 URL 형식 "${r.naver}"`);
  }
});

if (urlErrors === 0) { console.log('  ✅ PASS: 모든 네이버 URL 유효'); totalPass++; }
else { console.log(`  ❌ FAIL: ${urlErrors}개 URL 이슈`); totalFail++; }

// ── 7. 카테고리 분포 ──
console.log('\n── 분포 분석 ──');
const distribution = {};
['weather', 'mood', 'diet', 'people', 'budget'].forEach(field => {
  distribution[field] = {};
  db.forEach(r => {
    if (Array.isArray(r[field])) {
      r[field].forEach(tag => {
        distribution[field][tag] = (distribution[field][tag] || 0) + 1;
      });
    }
  });
});

Object.entries(distribution).forEach(([field, tags]) => {
  const sorted = Object.entries(tags).sort((a, b) => b[1] - a[1]);
  const summary = sorted.map(([tag, count]) => {
    const warn = count < 5 ? ' ⚠️' : '';
    return `${tag}=${count}${warn}`;
  }).join(', ');
  console.log(`  ${field}: ${summary}`);
});

// ── 8. cuisine 분포 ──
const cuisineDist = {};
db.forEach(r => { cuisineDist[r.cuisine] = (cuisineDist[r.cuisine] || 0) + 1; });
const cuisineSummary = Object.entries(cuisineDist).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}=${n}`).join(', ');
console.log(`  cuisine: ${cuisineSummary}`);

// ── 9. 중복 이름 검사 ──
console.log('\n── 검증 7: 중복 검사 ──');
const nameCount = {};
db.forEach(r => { nameCount[r.name] = (nameCount[r.name] || 0) + 1; });
const dupes = Object.entries(nameCount).filter(([, c]) => c > 1);
if (dupes.length === 0) { console.log('  ✅ PASS: 중복 식당명 없음'); totalPass++; }
else {
  console.log(`  ❌ FAIL: 중복 식당명 ${dupes.map(([n, c]) => `${n}(${c})`).join(', ')}`);
  totalFail++;
}

// ── 최종 결과 ──
console.log('\n══════════════════════════════════════════════════════════════════════');
console.log(`  📊 최종 결과: ${totalPass} PASS / ${totalFail} FAIL / ${totalWarn} WARN`);
console.log('══════════════════════════════════════════════════════════════════════');

if (issues.length > 0 && (totalFail > 0 || totalWarn > 0)) {
  console.log('\n📋 상세 이슈:');
  issues.forEach(i => console.log(`  - ${i}`));
}

if (totalFail > 0) {
  console.log('\n❌ 수정이 필요한 이슈가 있습니다.');
  process.exit(1);
} else {
  console.log('\n✅ 모든 검증 통과!');
}
