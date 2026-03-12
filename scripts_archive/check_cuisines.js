const fs = require('fs');

const content = fs.readFileSync('src/App.js', 'utf8');
const match = content.match(/const restaurantDB = \[([\s\S]*?)\];\s*const OPTIONS/);

if (!match) {
  console.log('ERROR: Could not find restaurantDB');
  process.exit(1);
}

const dbStr = '[' + match[1] + ']';
const db = eval(dbStr);

const cuisines = {};
db.forEach(r => {
  cuisines[r.cuisine] = (cuisines[r.cuisine] || 0) + 1;
});

console.log('Cuisine distribution:');
Object.entries(cuisines).sort((a,b) => b[1] - a[1]).forEach(([c, count]) => {
  console.log(`  ${c}: ${count}`);
});
console.log(`\nTotal: ${db.length} restaurants`);

const asian = db.filter(r => r.cuisine === 'asian');
console.log(`\nAsian restaurants (${asian.length}):`);
asian.forEach(r => console.log(`  - ${r.name}`));

const mexican = db.filter(r => r.cuisine === 'mexican');
console.log(`\nMexican restaurants (${mexican.length}):`);
mexican.forEach(r => console.log(`  - ${r.name}`));

const indian = db.filter(r => r.cuisine === 'indian');
console.log(`\nIndian restaurants (${indian.length}):`);
indian.forEach(r => console.log(`  - ${r.name}`));
