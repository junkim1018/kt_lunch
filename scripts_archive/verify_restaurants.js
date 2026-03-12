const fs = require('fs');

// App.js 파일 읽기
const content = fs.readFileSync('src/App.js', 'utf8');

// restaurantDB 배열 영역만 추출
const dbStartIdx = content.indexOf('const restaurantDB = [');
const dbEndIdx = content.indexOf('];', dbStartIdx);
const dbContent = content.substring(dbStartIdx, dbEndIdx + 2);

// 식당 이름, cuisine, naver 링크 추출 (restaurantDB 내부에서만)
const namePattern = /name:\s*"([^"]+)"/g;
const cuisinePattern = /cuisine:\s*"([^"]+)"/g;
const naverPattern = /naver:\s*"([^"]+)"/g;

const names = [...dbContent.matchAll(namePattern)].map(m => m[1]);
const cuisines = [...dbContent.matchAll(cuisinePattern)].map(m => m[1]);
const navers = [...dbContent.matchAll(naverPattern)].map(m => m[1]);

console.log(`\n📊 총 식당 수: ${names.length}개\n`);

// 카테고리별 통계
const cuisineStats = {};
cuisines.forEach(c => {
  cuisineStats[c] = (cuisineStats[c] || 0) + 1;
});

console.log('📈 카테고리별 통계:');
Object.entries(cuisineStats)
  .sort((a, b) => b[1] - a[1])
  .forEach(([cuisine, count]) => {
    const emoji = {
      korean: '🍲',
      chinese: '🥢', 
      japanese: '🍣',
      western: '🍕',
      asian: '🍜',
      salad: '🥗',
      mexican: '🌮',
      indian: '🍛'
    }[cuisine] || '❓';
    console.log(`   ${emoji} ${cuisine.padEnd(10)} : ${count.toString().padStart(3)}개`);
  });

// 데이터 무결성 검증
console.log('\n🔍 데이터 무결성 검증:');

// 1. 필드 개수 일치 확인
const mismatch = [];
if (names.length !== cuisines.length) mismatch.push('cuisine');
if (names.length !== navers.length) mismatch.push('naver');

if (mismatch.length > 0) {
  console.log(`   ⚠️ 필드 개수 불일치: ${mismatch.join(', ')}`);
  console.log(`      name: ${names.length}, cuisine: ${cuisines.length}, naver: ${navers.length}`);
} else {
  console.log(`   ✅ 모든 식당에 필수 필드 존재 (${names.length}개)`);
}

// 2. cuisine 값 검증
const validCuisines = ['korean', 'chinese', 'japanese', 'western', 'asian', 'salad', 'mexican', 'indian'];
const invalidCuisines = cuisines.filter(c => !validCuisines.includes(c));
if (invalidCuisines.length > 0) {
  console.log(`   ⚠️ 잘못된 cuisine 값: ${[...new Set(invalidCuisines)].join(', ')}`);
} else {
  console.log('   ✅ 모든 cuisine 값이 유효함');
}

// 3. 중복 식당명 확인
const duplicates = names.filter((name, idx) => names.indexOf(name) !== idx);
if (duplicates.length > 0) {
  console.log(`   ⚠️ 중복된 식당명 (${duplicates.length}개):`);
  [...new Set(duplicates)].forEach(name => console.log(`      - ${name}`));
} else {
  console.log('   ✅ 중복된 식당명 없음');
}

console.log('\n✅ 검증 완료\n');
