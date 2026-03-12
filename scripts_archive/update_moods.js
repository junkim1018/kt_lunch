const fs = require('fs');

// mood_updates.json 읽기
const updates = JSON.parse(fs.readFileSync('mood_updates.json', 'utf8'));

// App.js 읽기
let content = fs.readFileSync('src/App.js', 'utf8');

console.log('\n🔧 App.js의 mood 태그를 일괄 업데이트합니다...\n');

let successCount = 0;
let failCount = 0;
const failed = [];

updates.forEach((item, idx) => {
  if (!item.change) return; // 변경 없으면 스킵

  const nameEscaped = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // OLD mood 배열을 찾아서 NEW mood 배열로 교체
  const oldMoodStr = `mood: [${item.oldMood.map(m => `"${m}"`).join(',')}]`;
  const newMoodStr = `mood: [${item.newMood.map(m => `"${m}"`).join(',')}]`;

  // 식당 블록 찾기 (name으로 검색)
  const namePattern = new RegExp(`name: "${nameEscaped}",[\\s\\S]{0,2000}mood: \\[[^\\]]+\\]`, 'g');
  
  if (content.match(namePattern)) {
    // mood 부분만 교체
    const moodPattern = new RegExp(`(name: "${nameEscaped}",[\\s\\S]{0,2000})mood: \\[[^\\]]+\\]`, 'g');
    content = content.replace(moodPattern, `$1${newMoodStr}`);
    successCount++;
    
    if ((idx + 1) % 10 === 0) {
      console.log(`  ✅ ${idx + 1}/108 완료...`);
    }
  } else {
    failCount++;
    failed.push(item.name);
    console.log(`  ❌ [${item.index}] ${item.name} - 찾을 수 없음`);
  }
});

// 백업 생성
fs.writeFileSync('src/App.js.backup', fs.readFileSync('src/App.js', 'utf8'));
console.log('\n💾 백업 파일 생성: src/App.js.backup');

// 수정된 내용 저장
fs.writeFileSync('src/App.js', content, 'utf8');

console.log(`\n✅ 업데이트 완료!`);
console.log(`   성공: ${successCount}개`);
console.log(`   실패: ${failCount}개`);

if (failed.length > 0) {
  console.log('\n❌ 실패한 식당들:');
  failed.forEach(name => console.log(`   - ${name}`));
}

console.log('\n🎉 108개 식당의 mood가 새로운 체계로 업데이트되었습니다!');
console.log('\n새로운 mood 체계:');
console.log('  • hangover: 해장 (국밥/탕/찌개)');
console.log('  • executive: 고급 (블루리본/비싼 식당)');
console.log('  • hearty: 든든 (고기/백반)');
console.log('  • safe: 무난 (샐러드/파스타)');
console.log('  • team: 단체 (중/대규모 가능)');
console.log('  • exciting: 특별 (일식/멕시칸/인도)');
console.log('  • sad: 위로 (집밥/찌개)\n');
