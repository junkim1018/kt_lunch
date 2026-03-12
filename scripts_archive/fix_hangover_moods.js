const fs = require('fs');

// App.js 읽기
let content = fs.readFileSync('src/App.js', 'utf8');

console.log('\n🔧 누락된 hangover 태그를 수동으로 추가합니다...\n');

// 해장 식당들을 수동으로 확인하고 수정
const hangoverFixes = [
  {
    name: '광화문뚝감',
    oldMood: '["executive","safe","team"]',
    newMood: '["hangover","team"]'
  },
  {
    name: '광화문국밥',
    oldMood: '["executive","team"]',
    newMood: '["hangover","executive","team"]'
  },
  {
    name: '무교동북어국집',
    oldMood: '["tired","stressed"]',
    newMood: '["hangover","executive"]'
  }
];

hangoverFixes.forEach(fix => {
  const nameEscaped = fix.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `(name: "${nameEscaped}",[\\s\\S]{0,2000}mood: )\\[[^\\]]+\\]`,
    'g'
  );
  
  if (content.match(pattern)) {
    content = content.replace(pattern, `$1${fix.newMood}`);
    console.log(`  ✅ ${fix.name} → ${fix.newMood}`);
  } else {
    console.log(`  ❌ ${fix.name} - 찾을 수 없음`);
  }
});

// 저장
fs.writeFileSync('src/App.js', content, 'utf8');

console.log('\n✅ 수동 수정 완료!\n');
