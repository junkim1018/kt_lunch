const fs = require('fs');

// App.js 읽기
const appContent = fs.readFileSync('./src/App.js', 'utf8');

// executive mood 태그가 있는 식당 추출
const restaurants = [];
const lines = appContent.split('\n');
let currentRestaurant = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // name 찾기
  const nameMatch = line.match(/name:\s*"([^"]+)"/);
  if (nameMatch && !line.includes('//')) {
    if (currentRestaurant && currentRestaurant.hasExecutive) {
      restaurants.push(currentRestaurant);
    }
    currentRestaurant = { 
      name: nameMatch[1], 
      category: '',
      price: '',
      priceNote: '',
      mood: [],
      hasExecutive: false,
      avgPrice: null
    };
  }
  
  if (currentRestaurant) {
    // category 찾기
    const categoryMatch = line.match(/category:\s*"([^"]+)"/);
    if (categoryMatch) {
      currentRestaurant.category = categoryMatch[1];
    }
    
    // price 찾기
    const priceMatch = line.match(/price:\s*"([^"]*)"/);
    if (priceMatch) {
      currentRestaurant.price = priceMatch[1];
    }
    
    const priceNoteMatch = line.match(/priceNote:\s*"([^"]*)"/);
    if (priceNoteMatch) {
      currentRestaurant.priceNote = priceNoteMatch[1];
    }
    
    // mood 찾기
    const moodMatch = line.match(/mood:\s*\[(.*?)\]/);
    if (moodMatch) {
      const tags = moodMatch[1].match(/"(\w+)"/g);
      if (tags) {
        currentRestaurant.mood = tags.map(t => t.replace(/"/g, ''));
        currentRestaurant.hasExecutive = currentRestaurant.mood.includes('executive');
      }
    }
  }
}

if (currentRestaurant && currentRestaurant.hasExecutive) {
  restaurants.push(currentRestaurant);
}

// 가격 파싱 함수
function parsePrice(priceStr) {
  if (!priceStr) return null;
  
  // "15,000~20,000원" 형태
  const rangeMatch = priceStr.match(/(\d{1,3}(?:,?\d{3})*)\s*[~-]\s*(\d{1,3}(?:,?\d{3})*)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1].replace(/,/g, ''));
    const max = parseInt(rangeMatch[2].replace(/,/g, ''));
    return Math.round((min + max) / 2);
  }
  
  // "1.5만원" 형태
  const manwonMatch = priceStr.match(/(\d+\.?\d*)\s*만원/);
  if (manwonMatch) {
    return Math.round(parseFloat(manwonMatch[1]) * 10000);
  }
  
  // "15,000원" 형태
  const singleMatch = priceStr.match(/(\d{1,3}(?:,?\d{3})*)\s*원/);
  if (singleMatch) {
    return parseInt(singleMatch[1].replace(/,/g, ''));
  }
  
  return null;
}

// 평균 가격 계산
restaurants.forEach(r => {
  r.avgPrice = parsePrice(r.price) || parsePrice(r.priceNote);
});

// 가격순 정렬
restaurants.sort((a, b) => (a.avgPrice || 0) - (b.avgPrice || 0));

console.log(`\n📊 Executive 태그가 있는 식당: ${restaurants.length}개\n`);

console.log('='.repeat(90));
console.log('⚠️  가격 검증 (executive는 보통 2만원 이상이어야 함)');
console.log('='.repeat(90));

restaurants.forEach(r => {
  const priceStr = r.price || r.priceNote || '가격 정보 없음';
  let flag = '✅';
  let comment = '';
  
  if (!r.avgPrice) {
    flag = '⚠️';
    comment = ' (가격 정보 없음)';
  } else if (r.avgPrice < 15000) {
    flag = '❌';
    comment = ' (너무 저렴 - executive 부적합!)';
  } else if (r.avgPrice < 20000) {
    flag = '⚠️';
    comment = ' (경계선 - 검토 필요)';
  }
  
  const avgPriceStr = r.avgPrice ? `${r.avgPrice.toLocaleString()}원` : '???';
  
  console.log(`${flag} ${r.name.padEnd(35)} ${avgPriceStr.padStart(10)} ${comment}`);
  console.log(`   ${r.category}`);
  console.log(`   가격: ${priceStr}`);
  console.log('');
});

console.log('='.repeat(90));
console.log('📌 Executive 기준');
console.log('='.repeat(90));
console.log('✅ 적합: 2만원 이상 + 격식있는 분위기 (한정식, 프리미엄 일식/중식, 스테이크 등)');
console.log('❌ 부적합: 2만원 미만 또는 대중적 메뉴 (국밥, 해장국, 설렁탕, 찌개, 일반 백반 등)');
console.log('⚠️  경계선: 1.5~2만원 사이 - 분위기와 메뉴에 따라 판단');
