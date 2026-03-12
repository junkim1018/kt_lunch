const fs = require('fs');

const content = fs.readFileSync('src/App.js', 'utf8');
const match = content.match(/const restaurantDB = \[([\s\S]*?)\];\s*const OPTIONS/);

if (!match) {
  console.log('ERROR: Could not find restaurantDB');
  process.exit(1);
}

const dbStr = '[' + match[1] + ']';
const db = eval(dbStr);

console.log(`Total restaurants: ${db.length}\n`);

// 각 필드별로 체크
const requiredFields = ['name', 'category', 'cuisine', 'weather', 'mood', 'people', 'diet', 'budget'];

let hasError = false;

db.forEach((r, idx) => {
  const missing = [];
  const notArray = [];
  
  requiredFields.forEach(field => {
    if (!r[field]) {
      missing.push(field);
      hasError = true;
    } else if (field !== 'name' && field !== 'category' && field !== 'cuisine') {
      // weather, mood, people, diet, budget는 배열이어야 함
      if (!Array.isArray(r[field])) {
        notArray.push(field);
        hasError = true;
      } else if (r[field].length === 0) {
        missing.push(field + ' (empty array)');
        hasError = true;
      }
    }
  });
  
  if (missing.length > 0 || notArray.length > 0) {
    console.log(`[${idx + 1}] ${r.name || 'NO NAME'}`);
    if (missing.length > 0) {
      console.log(`  ❌ Missing or empty: ${missing.join(', ')}`);
    }
    if (notArray.length > 0) {
      console.log(`  ❌ Not array: ${notArray.join(', ')}`);
      notArray.forEach(field => {
        console.log(`     ${field} type: ${typeof r[field]}, value: ${JSON.stringify(r[field])}`);
      });
    }
    console.log('');
  }
});

if (!hasError) {
  console.log('✅ All restaurants have all required fields as arrays!');
} else {
  console.log('\n❌ Some restaurants have issues. Please fix them.');
}
