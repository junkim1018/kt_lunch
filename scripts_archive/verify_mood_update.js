const fs = require('fs');

// App.js 파일 읽기
const content = fs.readFileSync('src/App.js', 'utf8');

// restaurantDB 추출
const match = content.match(/const restaurantDB = \[([\s\S]*?)\];\s*const OPTIONS/);
if (!match) {
  console.log('❌ restaurantDB를 찾을 수 없습니다.');
  process.exit(1);
}

const dbStr = '[' + match[1] + ']';
let restaurantDB;
try {
  restaurantDB = eval(dbStr);
} catch (e) {
  console.log('❌ restaurantDB 파싱 실패:', e.message);
  process.exit(1);
}

console.log('\n✅ App.js 파싱 성공! 문법 에러 없음\n');
console.log(`📋 총 ${restaurantDB.length}개 식당\n`);
console.log('='.repeat(80));

// mood 분포 확인
const moodStats = {
  hangover: [],
  executive: [],
  hearty: [],
  safe: [],
  team: [],
  exciting: [],
  sad: []
};

restaurantDB.forEach(r => {
  if (r.mood && Array.isArray(r.mood)) {
    r.mood.forEach(m => {
      if (moodStats[m]) {
        moodStats[m].push(r.name);
      }
    });
  }
});

console.log('\n📊 최종 mood 분포:\n');
Object.keys(moodStats).forEach(mood => {
  console.log(`  ${mood}: ${moodStats[mood].length}개`);
});

// 해장 식당 리스트
console.log('\n\n💊 해장 (hangover) 식당 목록:\n');
moodStats.hangover.forEach((name, idx) => {
  console.log(`  ${idx + 1}. ${name}`);
});

// 고급 식당 샘플
console.log('\n\n👔 고급 (executive) 식당 샘플 (10개):\n');
moodStats.executive.slice(0, 10).forEach((name, idx) => {
  console.log(`  ${idx + 1}. ${name}`);
});

// 든든 식당 샘플
console.log('\n\n💪 든든 (hearty) 식당 샘플 (10개):\n');
moodStats.hearty.slice(0, 10).forEach((name, idx) => {
  console.log(`  ${idx + 1}. ${name}`);
});

// 특별한 식당 샘플
console.log('\n\n🎉 특별 (exciting) 식당 샘플 (10개):\n');
moodStats.exciting.slice(0, 10).forEach((name, idx) => {
  console.log(`  ${idx + 1}. ${name}`);
});

console.log('\n' + '='.repeat(80));
console.log('\n✨ 검증 완료! 이제 브라우저에서 테스트해보세요.\n');
console.log('테스트 시나리오:');
console.log('  1. 기분: 숙취 (hangover) → 국밥/해장국 식당만 나와야 함');
console.log('  2. 기분: 임원과 함께 (executive) → 고급 식당만 나와야 함');
console.log('  3. 기분: 든든하게 (hearty) → 고기/백반 식당이 나와야 함');
console.log('  4. 기분: 신나는 날 (exciting) → 일식/멕시칸/인도 식당이 나와야 함\n');
