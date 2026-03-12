const fs = require('fs');

// 제거할 식당 목록 (executive 태그 부적합)
const removeExecutive = [
  '진순대',
  '광화문집 (김치찌개/제육볶음)',
  '정원 백반',
  '샐러드로우앤트라타 광화문점',
  '카페이마',
  '청진옥',
  '오감부대',
  '서린낙지',
  '성산옥',
  '필경재 종각점',
  '키보 아츠아츠 (KT West)',
  '온더보더 광화문D타워점',
  '브루클린더버거조인트 디타워점',
  '일품 광화문점', // 19,000원 카이센동 - 경계선이지만 제거
  '야마야 광화문 디타워점', // 17,350원 이자카야 - 경계선이지만 제거
  '광화문석갈비 D타워점', // 17,500원 - 경계선이지만 제거
];

// App.js 읽기
let content = fs.readFileSync('./src/App.js', 'utf8');
const lines = content.split('\n');

let modified = 0;
let restaurantName = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // 식당 이름 찾기
  const nameMatch = line.match(/name:\s*"([^"]+)"/);
  if (nameMatch) {
    restaurantName = nameMatch[1];
  }
  
  // 이 식당이 제거 대상이고, mood 라인이면
  if (restaurantName && removeExecutive.includes(restaurantName)) {
    const moodMatch = line.match(/mood:\s*\[(.*?)\]/);
    if (moodMatch) {
      const moodsStr = moodMatch[1];
      
      // executive 제거
      const newMoodsStr = moodsStr.replace(/"executive",?/g, '').replace(/,\s*,/g, ',').replace(/\[\s*,/g, '[').replace(/,\s*\]/g, ']');
      
      if (moodsStr !== newMoodsStr) {
        lines[i] = line.replace(moodsStr, newMoodsStr);
        console.log(`✅ ${restaurantName}`);
        console.log(`   before: mood: [${moodsStr}]`);
        console.log(`   after:  mood: [${newMoodsStr}]`);
        console.log('');
        modified++;
      }
    }
  }
}

// 파일 저장
fs.writeFileSync('./src/App.js', lines.join('\n'));

console.log(`\n총 ${modified}개 식당의 executive 태그 제거 완료!`);
