const fs = require('fs');

// App.js 읽기
let content = fs.readFileSync('src/App.js', 'utf8');

// restaurantDB 추출하여 샐러드 식당 찾기
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

console.log('\n🥗 샐러드 식당의 weather 태그 수정\n');
console.log('='.repeat(80));

// 샐러드 식당 찾기
const saladRestaurants = restaurantDB.filter(r => 
  r.cuisine === 'salad' || r.category.includes('샐러드') || r.category.includes('브런치')
);

console.log(`\n📋 총 ${saladRestaurants.length}개 샐러드/브런치 식당 발견\n`);

saladRestaurants.forEach(r => {
  console.log(`- ${r.name}: weather = [${r.weather.join(', ')}]`);
  
  // cold를 제거한 새로운 weather 배열
  const newWeather = r.weather.filter(w => w !== 'cold');
  
  if (newWeather.length !== r.weather.length) {
    console.log(`  ✅ "cold" 제거 → [${newWeather.join(', ')}]`);
    
    // 파일에서 해당 부분 찾아서 수정
    const nameEscaped = r.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const oldWeatherStr = `weather: [${r.weather.map(w => `"${w}"`).join(',')}]`;
    const newWeatherStr = `weather: [${newWeather.map(w => `"${w}"`).join(',')}]`;
    
    const pattern = new RegExp(
      `(name: "${nameEscaped}",[\\s\\S]{0,2000})${oldWeatherStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
      'g'
    );
    
    content = content.replace(pattern, `$1${newWeatherStr}`);
  } else {
    console.log(`  ⏭️  이미 "cold" 없음`);
  }
});

// 저장
fs.writeFileSync('src/App.js', content, 'utf8');

console.log('\n✅ 샐러드/브런치 식당의 weather 태그 수정 완료!\n');
console.log('💡 이제 "추워요"를 선택하면 샐러드가 추천되지 않습니다.\n');
