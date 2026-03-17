const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'restaurantData.js');
let data = fs.readFileSync(filePath, 'utf-8');

function fixCoords(name, newLat, newLng) {
  const searchName = 'name: "' + name + '"';
  const nameIdx = data.indexOf(searchName);
  if (nameIdx === -1) { console.log('NOT FOUND: ' + name); return; }
  const chunk = data.substring(nameIdx, nameIdx + 800);
  const coordsMatch = chunk.match(/coords: \{ lat: [\d.]+, lng: [\d.]+ \}/);
  if (!coordsMatch) { console.log('NO COORDS: ' + name); return; }
  const oldCoords = coordsMatch[0];
  const newCoords = 'coords: { lat: ' + newLat + ', lng: ' + newLng + ' }';
  if (oldCoords === newCoords) { console.log('ALREADY OK: ' + name); return; }
  const startPos = nameIdx + chunk.indexOf(oldCoords);
  data = data.substring(0, startPos) + newCoords + data.substring(startPos + oldCoords.length);
  console.log('FIXED: ' + name + '  ' + oldCoords + ' → ' + newCoords);
}

function fixWalk(name, newWalk) {
  const searchName = 'name: "' + name + '"';
  const nameIdx = data.indexOf(searchName);
  if (nameIdx === -1) return;
  const chunk = data.substring(nameIdx, nameIdx + 800);
  const walkMatch = chunk.match(/walk: "([^"]+)"/);
  if (!walkMatch) return;
  const oldWalk = walkMatch[0];
  const newWalkStr = 'walk: "' + newWalk + '"';
  if (oldWalk === newWalkStr) return;
  const startPos = nameIdx + chunk.indexOf(oldWalk);
  data = data.substring(0, startPos) + newWalkStr + data.substring(startPos + oldWalk.length);
  console.log('  WALK: ' + oldWalk + ' → ' + newWalkStr);
}

// Fix coordinates and walk times
fixCoords('카페이마', '37.5699', '126.9776');
fixWalk('카페이마', '도보 3분 (세종대로 152, 일민미술관 1층)');

fixCoords('광화문나폴리', '37.5709', '126.9759');
fixWalk('광화문나폴리', '도보 4분 (새문안로9길 24-4)');

fixCoords('가봉루', '37.5716', '126.9737');
fixWalk('가봉루', '도보 6분 (세종대로23길 3)');

fixCoords('웰믹스 광화문점', '37.5718', '126.9735');
fixWalk('웰믹스 광화문점', '도보 6분 (세종대로23길 54)');

fixCoords('라멘 시미즈', '37.5713', '126.9729');
fixWalk('라멘 시미즈', '도보 7분 (새문안로3길 12 신문로아파트 지하1층)');

fixCoords('샐러드로우앤트라타 광화문점', '37.5729', '126.9743');
fixWalk('샐러드로우앤트라타 광화문점', '도보 5분 (새문안로5길 31)');

fixCoords('울프강 스테이크하우스 광화문점', '37.5695', '126.9757');
fixWalk('울프강 스테이크하우스 광화문점', '도보 5분 (세종대로21길 40 2층)');

fs.writeFileSync(filePath, data, 'utf-8');
console.log('\n✅ Done');
