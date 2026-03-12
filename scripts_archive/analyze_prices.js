const fs = require('fs');

// App.js에서 restaurantDB 추출 - 더 안전한 방법
const appContent = fs.readFileSync('./src/App.js', 'utf8');

// 각 식당 블록을 개별적으로 추출
const restaurantPattern = /\{\s*name:\s*"([^"]+)"[\s\S]*?price:\s*"([^"]*)"[\s\S]*?priceNote:\s*"([^"]*)"[\s\S]*?budget:\s*\[([^\]]+)\]/g;
const restaurants = [];
let match;

while ((match = restaurantPattern.exec(appContent)) !== null) {
  const name = match[1];
  const price = match[2] || match[3] || '';
  const budgetStr = match[4];
  const budget = budgetStr.match(/"(\w+)"/g)?.map(b => b.replace(/"/g, '')) || [];
  
  restaurants.push({ name, price, budget });
}

const restaurantDB = restaurants;

console.log(`\n📊 총 ${restaurantDB.length}개 식당 가격 분석\n`);

// 가격 범위 추출 함수
function extractPriceRange(restaurant) {
  const priceStr = restaurant.price || restaurant.priceNote || '';
  
  // "10,000~14,000원" 형태
  const rangeMatch = priceStr.match(/(\d{1,3}(?:,\d{3})*)\s*[~-]\s*(\d{1,3}(?:,\d{3})*)/);
  if (rangeMatch) {
    const min = parseInt(rangeMatch[1].replace(/,/g, ''));
    const max = parseInt(rangeMatch[2].replace(/,/g, ''));
    return { min, max, avg: Math.round((min + max) / 2) };
  }
  
  // "1.5만원" 형태
  const manwonMatch = priceStr.match(/(\d+\.?\d*)\s*만원/);
  if (manwonMatch) {
    const value = parseFloat(manwonMatch[1]) * 10000;
    return { min: value, max: value, avg: value };
  }
  
  // "15000원" 형태
  const singleMatch = priceStr.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
  if (singleMatch) {
    const value = parseInt(singleMatch[1].replace(/,/g, ''));
    return { min: value, max: value, avg: value };
  }
  
  return null;
}

// budget 태그에 따른 예상 가격 범위
const budgetRanges = {
  'cheap': { min: 0, max: 11000, label: '~1.1만원' },
  'normal': { min: 10000, max: 20000, label: '1만~2만원' },
  'expensive': { min: 20000, max: 100000, label: '2만원~' }
};

// 분석
const issues = [];
const byBudget = { cheap: [], normal: [], expensive: [] };

restaurantDB.forEach(r => {
  const priceRange = extractPriceRange(r);
  
  if (!priceRange) {
    issues.push({
      name: r.name,
      issue: '가격 정보 없음',
      price: r.price || r.priceNote || '정보 없음',
      budget: r.budget
    });
    return;
  }
  
  if (!r.budget || !Array.isArray(r.budget) || r.budget.length === 0) {
    issues.push({
      name: r.name,
      issue: 'budget 태그 없음',
      price: r.price,
      avg: priceRange.avg
    });
    return;
  }
  
  // budget 태그와 실제 가격 비교
  r.budget.forEach(tag => {
    const range = budgetRanges[tag];
    if (!range) return;
    
    byBudget[tag].push({
      name: r.name,
      min: priceRange.min,
      max: priceRange.max,
      avg: priceRange.avg,
      priceStr: r.price || r.priceNote
    });
    
    // 가격과 태그가 안 맞는 경우 체크
    if (priceRange.avg < range.min || priceRange.avg > range.max) {
      // 경계값은 유연하게
      const tolerance = 3000;
      if (Math.abs(priceRange.avg - range.min) > tolerance && 
          Math.abs(priceRange.avg - range.max) > tolerance) {
        issues.push({
          name: r.name,
          issue: `budget 태그 불일치`,
          tag: tag,
          tagRange: range.label,
          actualPrice: `${priceRange.avg.toLocaleString()}원`,
          price: r.price || r.priceNote
        });
      }
    }
  });
});

// 결과 출력
console.log('='.repeat(80));
console.log('💰 CHEAP (가성비/저렴) - ~1.1만원');
console.log('='.repeat(80));
byBudget.cheap.sort((a, b) => a.avg - b.avg).forEach(r => {
  const flag = r.avg > 11000 ? '⚠️' : '✅';
  console.log(`${flag} ${r.name.padEnd(30)} ${r.avg.toLocaleString().padStart(8)}원 (${r.priceStr})`);
});

console.log('\n' + '='.repeat(80));
console.log('💳 NORMAL (일반/보통) - 1만~2만원');
console.log('='.repeat(80));
byBudget.normal.sort((a, b) => a.avg - b.avg).forEach(r => {
  const flag = r.avg < 10000 || r.avg > 20000 ? '⚠️' : '✅';
  console.log(`${flag} ${r.name.padEnd(30)} ${r.avg.toLocaleString().padStart(8)}원 (${r.priceStr})`);
});

console.log('\n' + '='.repeat(80));
console.log('👑 EXPENSIVE (고급/비싼) - 2만원~');
console.log('='.repeat(80));
byBudget.expensive.sort((a, b) => a.avg - b.avg).forEach(r => {
  const flag = r.avg < 20000 ? '⚠️' : '✅';
  console.log(`${flag} ${r.name.padEnd(30)} ${r.avg.toLocaleString().padStart(8)}원 (${r.priceStr})`);
});

// 문제 있는 항목들
if (issues.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log(`⚠️  문제 발견: ${issues.length}개`);
  console.log('='.repeat(80));
  issues.forEach(issue => {
    console.log(`\n❌ ${issue.name}`);
    console.log(`   문제: ${issue.issue}`);
    if (issue.tag) console.log(`   태그: ${issue.tag} (${issue.tagRange})`);
    if (issue.actualPrice) console.log(`   실제: ${issue.actualPrice}`);
    if (issue.price) console.log(`   가격: ${issue.price}`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('📊 통계');
console.log('='.repeat(80));
console.log(`총 식당: ${restaurantDB.length}개`);
console.log(`cheap: ${byBudget.cheap.length}개`);
console.log(`normal: ${byBudget.normal.length}개`);
console.log(`expensive: ${byBudget.expensive.length}개`);
console.log(`문제: ${issues.length}개`);
