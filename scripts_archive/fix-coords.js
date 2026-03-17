/**
 * 좌표 개별 수정 스크립트
 * 이름을 앵커로 사용하여 각 식당의 좌표를 정확하게 수정
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'data', 'restaurantData.js');
let data = fs.readFileSync(filePath, 'utf-8');

function fixCoords(name, newLat, newLng) {
  const searchName = 'name: "' + name + '"';
  const nameIdx = data.indexOf(searchName);
  if (nameIdx === -1) {
    console.log('NOT FOUND: ' + name);
    return false;
  }
  const chunk = data.substring(nameIdx, nameIdx + 800);
  const coordsMatch = chunk.match(/coords: \{ lat: [\d.]+, lng: [\d.]+ \}/);
  if (!coordsMatch) {
    console.log('NO COORDS: ' + name);
    return false;
  }
  const oldCoords = coordsMatch[0];
  const newCoords = 'coords: { lat: ' + newLat + ', lng: ' + newLng + ' }';
  if (oldCoords === newCoords) {
    console.log('ALREADY OK: ' + name);
    return true;
  }
  const startPos = nameIdx + chunk.indexOf(oldCoords);
  data = data.substring(0, startPos) + newCoords + data.substring(startPos + oldCoords.length);
  console.log('FIXED: ' + name + '  ' + oldCoords + ' → ' + newCoords);
  return true;
}

// === Individual coordinate fixes ===

// KT East 지하1층 식당
fixCoords('코끼리초밥 광화문점', '37.5720', '126.9788');

// D타워 식당 (개별)
fixCoords('온더보더 광화문D타워점', '37.5710', '126.9789');

// KT West (세종대로 178)
fixCoords('타코챔피언 광화문', '37.5722', '126.9779');

// 새문안로 82 S타워
fixCoords('쿠차라 광화문점', '37.5698', '126.9740');

// SFC 서울파이낸스센터 (세종대로 136)
fixCoords('쿠차라 SFC점', '37.5685', '126.9783');

// 새문안로 103 갤러리광화
fixCoords('옴레스토랑 광화문점', '37.5705', '126.9761');

// 르메이에르종로타운 (종로 19)
fixCoords('두르가 광화문점', '37.5710', '126.9820');

// SFC 서울파이낸스센터 B동
fixCoords('강가 무교점', '37.5685', '126.9783');

// 삼봉로 95 대성스카이렉스
fixCoords('차이니즈키친홍성원 본점', '37.5723', '126.9825');

// 무교로 24 무교동
fixCoords('곰국시집 종각', '37.5680', '126.9795');

// 타워8빌딩 (종로5길 7)
fixCoords('일품진진수라 광화문점', '37.5707', '126.9805');

// 종로9길 18 인사동
fixCoords('강촌숯불닭갈비 종각', '37.5711', '126.9846');

// 우정국로 38-13 견지동
fixCoords('이문설렁탕 종각점', '37.5727', '126.9839');

// 우정국로 56 템플스테이
fixCoords('발우공양', '37.5738', '126.9832');

// 신라스테이 광화문 (삼봉로 71)
fixCoords('VIP참치 종로구청점', '37.5726', '126.9811');

fs.writeFileSync(filePath, data, 'utf-8');
console.log('\n✅ All individual fixes applied and saved.');
