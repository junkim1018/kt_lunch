const fs = require('fs');

// App.js 읽기
const appContent = fs.readFileSync('./src/App.js', 'utf8');

// 각 식당의 name, price, priceNote, budget 추출
const restaurants = [];
const restaurantBlocks = appContent.match(/\{\s*name:[\s\S]*?\},\s*\{/g);

// 간단한 정규식으로 추출
const lines = appContent.split('\n');
let currentRestaurant = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // name 찾기
  const nameMatch = line.match(/name:\s*"([^"]+)"/);
  if (nameMatch && !line.includes('//')) {
    if (currentRestaurant) {
      restaurants.push(currentRestaurant);
    }
    currentRestaurant = { name: nameMatch[1], price: '', priceNote: '', budget: [] };
  }
  
  // price 찾기
  if (currentRestaurant) {
    const priceMatch = line.match(/price:\s*"([^"]*)"/);
    if (priceMatch) {
      currentRestaurant.price = priceMatch[1];
    }
    
    const priceNoteMatch = line.match(/priceNote:\s*"([^"]*)"/);
    if (priceNoteMatch) {
      currentRestaurant.priceNote = priceNoteMatch[1];
    }
    
    const budgetMatch = line.match(/budget:\s*\[(.*?)\]/);
    if (budgetMatch) {
      const tags = budgetMatch[1].match(/"(\w+)"/g);
      if (tags) {
        currentRestaurant.budget = tags.map(t => t.replace(/"/g, ''));
      }
    }
  }
}

if (currentRestaurant) {
  restaurants.push(currentRestaurant);
}

console.log(`\n총 ${restaurants.length}개 식당 분석\n`);

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
  
  // "15000원" 형태
  const singleMatch = priceStr.match(/(\d{1,3}(?:,?\d{3})*)\s*원/);
  if (singleMatch) {
    return parseInt(singleMatch[1].replace(/,/g, ''));
  }
  
  return null;
}

// 문제 있는 식당들 찾기
const issues = [];

restaurants.forEach(r => {
  const avgPrice = parsePrice(r.price) || parsePrice(r.priceNote);
  
  if (!avgPrice) {
    issues.push({ name: r.name, issue: '가격 정보 없음', budget: r.budget.join(',') });
    return;
  }
  
  if (r.budget.length === 0) {
    issues.push({ name: r.name, issue: 'budget 태그 없음', price: avgPrice });
    return;
  }
  
  // budget 태그 검증
  // cheap: ~11,000원
  // normal: 10,000~20,000원
  // expensive: 20,000원~
  
  r.budget.forEach(tag => {
    if (tag === 'cheap' && avgPrice > 11000) {
      issues.push({ 
        name: r.name, 
        issue: `cheap 태그인데 ${avgPrice.toLocaleString()}원`, 
        price: r.price || r.priceNote,
        budget: tag
      });
    }
    
    if (tag === 'normal' && (avgPrice < 10000 || avgPrice > 20000)) {
      issues.push({ 
        name: r.name, 
        issue: `normal 태그인데 ${avgPrice.toLocaleString()}원`, 
        price: r.price || r.priceNote,
        budget: tag
      });
    }
    
    if (tag === 'expensive' && avgPrice < 20000) {
      issues.push({ 
        name: r.name, 
        issue: `expensive 태그인데 ${avgPrice.toLocaleString()}원`, 
        price: r.price || r.priceNote,
        budget: tag
      });
    }
  });
});

// 15,000원에 매칭되는 식당들 (현재 로직)
console.log('='.repeat(80));
console.log('🔍 15,000원 예산에 매칭되는 식당 (normal 또는 cheap)');
console.log('='.repeat(80));

const budget15k = restaurants.filter(r => {
  return r.budget.includes('normal') || r.budget.includes('cheap');
}).map(r => {
  const avgPrice = parsePrice(r.price) || parsePrice(r.priceNote);
  return { ...r, avgPrice };
}).sort((a, b) => a.avgPrice - b.avgPrice);

budget15k.forEach(r => {
  const flag = r.avgPrice > 20000 ? '❌' : r.avgPrice > 18000 ? '⚠️' : '✅';
  console.log(`${flag} ${r.name.padEnd(35)} ${String(r.avgPrice).padStart(7)}원  [${r.budget.join(',')}]  ${r.price || r.priceNote}`);
});

// 문제 있는 식당들
if (issues.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log(`❌ budget 태그 문제: ${issues.length}개`);
  console.log('='.repeat(80));
  issues.slice(0, 30).forEach(issue => {
    console.log(`\n${issue.name}`);
    console.log(`  문제: ${issue.issue}`);
    if (issue.price) console.log(`  가격: ${issue.price}`);
    if (issue.budget) console.log(`  태그: ${issue.budget}`);
  });
}
