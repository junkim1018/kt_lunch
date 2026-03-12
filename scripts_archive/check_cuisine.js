const fs = require('fs');

// App.js 파일 읽기
const content = fs.readFileSync('src/App.js', 'utf8');

// restaurantDB 배열 영역만 추출
const dbStartIdx = content.indexOf('const restaurantDB = [');
const dbEndIdx = content.indexOf('];', dbStartIdx);
const dbContent = content.substring(dbStartIdx, dbEndIdx + 2);

// 모든 name과 cuisine 추출
const namePattern = /name:\s*"([^"]+)"/g;
const cuisinePattern = /cuisine:\s*"([^"]+)"/g;
const categoryPattern = /category:\s*"([^"]+)"/g;

const names = [...dbContent.matchAll(namePattern)].map(m => m[1]);
const cuisines = [...dbContent.matchAll(cuisinePattern)].map(m => m[1]);
const categories = [...dbContent.matchAll(categoryPattern)].map(m => m[1]);

console.log(`\n총 ${names.length}개 식당 검증\n`);

// 식당 리스트 생성
const restaurants = names.map((name, idx) => ({
  name,
  cuisine: cuisines[idx],
  category: categories[idx] || '(카테고리 없음)'
}));

// cuisine별 분류
const byCuisine = {
  korean: [],
  chinese: [],
  japanese: [],
  western: [],
  asian: [],
  salad: [],
  mexican: [],
  indian: []
};

restaurants.forEach(r => {
  if (byCuisine[r.cuisine]) {
    byCuisine[r.cuisine].push(r);
  }
});

// 각 cuisine별로 출력
console.log('=== Cuisine별 식당 목록 ===\n');

Object.entries(byCuisine).forEach(([cuisine, list]) => {
  const emoji = {
    korean: '🍲',
    chinese: '🥢', 
    japanese: '🍣',
    western: '🍕',
    asian: '🍜',
    salad: '🥗',
    mexican: '🌮',
    indian: '🍛'
  }[cuisine];
  
  console.log(`\n${emoji} ${cuisine.toUpperCase()} (${list.length}개):`);
  console.log('─'.repeat(60));
  
  list.forEach((r, idx) => {
    console.log(`${(idx + 1).toString().padStart(2)}. ${r.name}`);
    if (r.category !== '(카테고리 없음)') {
      console.log(`    └─ ${r.category}`);
    }
  });
});

// 의심스러운 매칭 찾기
console.log('\n\n=== ⚠️  확인이 필요한 매칭 ===\n');

const suspiciousPatterns = [
  { cuisine: 'salad', wrongKeywords: ['양식', '카페', '브런치', '함박', '와플', '샌드위치'], message: '→ western으로 변경 권장' },
  { cuisine: 'western', wrongKeywords: ['한식', '국밥', '순대', '김치'], message: '→ korean으로 변경 권장' },
  { cuisine: 'korean', wrongKeywords: ['이탈리안', '피자', '파스타', '스테이크'], message: '→ western으로 변경 권장' },
  { cuisine: 'korean', wrongKeywords: ['스시', '초밥', '라멘', '일식'], message: '→ japanese로 변경 권장' },
  { cuisine: 'japanese', wrongKeywords: ['한식', '갈비', '국밥'], message: '→ korean으로 변경 권장' },
];

let foundIssues = 0;

restaurants.forEach(r => {
  suspiciousPatterns.forEach(pattern => {
    if (r.cuisine === pattern.cuisine) {
      const hasWrongKeyword = pattern.wrongKeywords.some(keyword => 
        r.category.includes(keyword)
      );
      if (hasWrongKeyword) {
        console.log(`❗ ${r.name}`);
        console.log(`   현재: cuisine: "${r.cuisine}"`);
        console.log(`   Category: ${r.category}`);
        console.log(`   ${pattern.message}\n`);
        foundIssues++;
      }
    }
  });
});

if (foundIssues === 0) {
  console.log('✅ 의심스러운 매칭 없음\n');
}

console.log('\n=== 요약 ===');
console.log(`총 식당: ${restaurants.length}개`);
console.log(`카테고리 필드 있음: ${categories.length}개`);
console.log(`카테고리 필드 없음: ${restaurants.length - categories.length}개`);

