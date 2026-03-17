const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'restaurantData.js');
let data = fs.readFileSync(filePath, 'utf-8');

const names = [
  '온더보더 광화문D타워점',
  '타코챔피언 광화문',
  '쿠차라 광화문점',
  '쿠차라 SFC점',
  '옴레스토랑 광화문점',
  '두르가 광화문점',
  '강가 무교점'
];

names.forEach(n => {
  const search = 'name: "' + n + '"';
  const pos = data.indexOf(search);
  if (pos === -1) { console.log(n + ': NOT FOUND'); return; }
  const chunk = data.substring(pos, pos + 500);
  const cm = chunk.match(/coords: \{ lat: ([\d.]+), lng: ([\d.]+) \}/);
  if (cm) console.log(n + ': (' + cm[1] + ', ' + cm[2] + ')');
  else console.log(n + ': NO COORDS MATCH');
});

// Check all remaining 37.5703 lines
console.log('\n=== Lines with 37.5703 ===');
const lines = data.split('\n');
lines.forEach((line, i) => {
  if (line.includes('37.5703')) {
    console.log((i+1) + ': ' + line.trim());
  }
});
