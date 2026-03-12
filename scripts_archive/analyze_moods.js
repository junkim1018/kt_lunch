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

console.log(`\n📋 총 ${restaurantDB.length}개 식당 mood 재분류\n`);
console.log('='.repeat(100));

// 새로운 mood 체계:
// - hangover: 국밥/해장/탕/찌개/국물
// - executive: 고급/블루리본/비싼 식당
// - hearty: 든든한 고기/백반/한정식
// - safe: 가볍고 무난한 (샐러드/브런치/면류/덮밥)
// - team: 단체 가능 (medium/large people 태그)
// - exciting: 특별한/이색적 (일식/이탈리안/멕시칸/인도)
// - sad: 위로되는 집밥/찌개/국물

const moodSuggestions = restaurantDB.map((r, idx) => {
  const moods = new Set();
  const cat = r.category.toLowerCase();
  const name = r.name.toLowerCase();
  const cuisine = r.cuisine;
  const budget = r.budget || [];
  const people = r.people || [];
  const ribbon = r.ribbon;

  // hangover: 국밥/해장/탕/찌개/국물
  if (cat.includes('국밥') || cat.includes('해장') || cat.includes('순대국') || 
      cat.includes('설렁탕') || cat.includes('갈비탕') || cat.includes('삼계탕') ||
      cat.includes('곰탕') || cat.includes('뼈해장국') || cat.includes('콩나물국밥') ||
      name.includes('국밥') || name.includes('해장') || name.includes('순대국')) {
    moods.add('hangover');
  }

  // executive: 고급/블루리본/expensive
  if (ribbon || budget.includes('expensive') || 
      cat.includes('한정식') || cat.includes('프렌치') || cat.includes('스테이크') ||
      cat.includes('오마카세') || cat.includes('코스') || cat.includes('이자카야') ||
      name.includes('하정식') || name.includes('스테이크')) {
    moods.add('executive');
  }

  // hearty: 든든한 고기/백반/중식
  if (cat.includes('고기') || cat.includes('삼겹살') || cat.includes('갈비') || 
      cat.includes('족발') || cat.includes('백반') || cat.includes('정식') ||
      cat.includes('중국집') || cat.includes('짜장면') || cat.includes('짬뽕') ||
      cat.includes('돈까스') || cat.includes('덮밥') ||
      cuisine === 'chinese' || cuisine === 'korean' && cat.includes('백반')) {
    moods.add('hearty');
  }

  // safe: 가볍고 무난한
  if (cat.includes('샐러드') || cat.includes('샌드위치') || cat.includes('브런치') ||
      cat.includes('파스타') || cat.includes('리조또') || cat.includes('피자') ||
      cat.includes('카페') || cat.includes('베이커리') ||
      cuisine === 'salad' || (cuisine === 'western' && !cat.includes('스테이크'))) {
    moods.add('safe');
  }

  // team: 단체 가능 (large/medium people)
  if (people.includes('large') || people.includes('medium')) {
    moods.add('team');
  }

  // exciting: 특별한/이색적
  if (cuisine === 'japanese' || cuisine === 'mexican' || cuisine === 'indian' ||
      cat.includes('멕시칸') || cat.includes('타코') || cat.includes('커리') ||
      cat.includes('초밥') || cat.includes('우동') || cat.includes('라멘') ||
      cat.includes('돈부리') || cat.includes('이자카야') || cat.includes('오므라이스')) {
    moods.add('exciting');
  }

  // sad: 위로되는 집밥/찌개/국물
  if (cat.includes('찌개') || cat.includes('된장') || cat.includes('김치찌개') ||
      cat.includes('부대찌개') || cat.includes('순두부') || cat.includes('제육') ||
      cat.includes('비빔밥') || cat.includes('백반') ||
      name.includes('집밥') || name.includes('할머니')) {
    moods.add('sad');
  }

  // 최소 1개는 있어야 함 - 없으면 safe 추가
  if (moods.size === 0) {
    moods.add('safe');
  }

  return {
    index: idx + 1,
    name: r.name,
    category: r.category,
    cuisine: r.cuisine,
    oldMood: r.mood,
    newMood: Array.from(moods),
    change: JSON.stringify(r.mood) !== JSON.stringify(Array.from(moods))
  };
});

// 통계
const stats = {
  hangover: 0,
  executive: 0,
  hearty: 0,
  safe: 0,
  team: 0,
  exciting: 0,
  sad: 0
};

moodSuggestions.forEach(item => {
  item.newMood.forEach(mood => {
    stats[mood]++;
  });
});

console.log('\n📊 새로운 mood 분포:\n');
console.log(`  hangover (해장):      ${stats.hangover}개`);
console.log(`  executive (고급):     ${stats.executive}개`);
console.log(`  hearty (든든):        ${stats.hearty}개`);
console.log(`  safe (무난):          ${stats.safe}개`);
console.log(`  team (단체):          ${stats.team}개`);
console.log(`  exciting (특별):      ${stats.exciting}개`);
console.log(`  sad (위로):           ${stats.sad}개`);

// 변경된 식당만 출력
const changed = moodSuggestions.filter(item => item.change);
console.log(`\n\n🔄 mood가 변경될 식당: ${changed.length}개\n`);
console.log('='.repeat(100));

changed.forEach(item => {
  console.log(`\n[${item.index}] ${item.name}`);
  console.log(`    카테고리: ${item.category}`);
  console.log(`    OLD: [${item.oldMood.map(m => `"${m}"`).join(', ')}]`);
  console.log(`    NEW: [${item.newMood.map(m => `"${m}"`).join(', ')}]`);
});

// JSON 파일로 저장
fs.writeFileSync('mood_updates.json', JSON.stringify(moodSuggestions, null, 2), 'utf8');
console.log('\n\n✅ mood_updates.json 파일에 전체 분석 결과를 저장했습니다.\n');
