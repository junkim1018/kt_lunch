const fs = require('fs');

// KT East 좌표
const KT_EAST_COORDS = { lat: 37.5703, lng: 126.9835 };

// 거리 계산 함수 (Haversine formula)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 지구 반지름 (미터)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// App.js 읽기
const appContent = fs.readFileSync('./src/App.js', 'utf8');

// 각 식당의 name과 coords 추출
const restaurants = [];
const lines = appContent.split('\n');
let currentRestaurant = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // name 찾기
  const nameMatch = line.match(/name:\s*"([^"]+)"/);
  if (nameMatch && !line.includes('//')) {
    if (currentRestaurant && currentRestaurant.coords) {
      restaurants.push(currentRestaurant);
    }
    currentRestaurant = { name: nameMatch[1], coords: null, distance: null };
  }
  
  // coords 찾기
  if (currentRestaurant) {
    const coordsMatch = line.match(/coords:\s*\{\s*lat:\s*([\d.]+),\s*lng:\s*([\d.]+)\s*\}/);
    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lng = parseFloat(coordsMatch[2]);
      currentRestaurant.coords = { lat, lng };
      
      // 거리 계산
      currentRestaurant.distance = Math.round(
        getDistance(KT_EAST_COORDS.lat, KT_EAST_COORDS.lng, lat, lng)
      );
    }
  }
}

if (currentRestaurant && currentRestaurant.coords) {
  restaurants.push(currentRestaurant);
}

console.log(`\n📍 KT 광화문 East (${KT_EAST_COORDS.lat}, ${KT_EAST_COORDS.lng})에서 거리 분석\n`);
console.log(`총 ${restaurants.length}개 식당\n`);

// 거리순 정렬
restaurants.sort((a, b) => a.distance - b.distance);

// 750m 이상인 식당들
const farRestaurants = restaurants.filter(r => r.distance >= 750);

console.log('='.repeat(80));
console.log(`🔴 750m 이상인 식당: ${farRestaurants.length}개 (삭제 대상)`);
console.log('='.repeat(80));
farRestaurants.forEach(r => {
  console.log(`❌ ${r.name.padEnd(40)} ${String(r.distance).padStart(5)}m`);
});

console.log('\n' + '='.repeat(80));
console.log(`🟢 750m 미만인 식당: ${restaurants.length - farRestaurants.length}개 (유지)`);
console.log('='.repeat(80));
restaurants.filter(r => r.distance < 750).forEach(r => {
  const flag = r.distance < 300 ? '✅' : r.distance < 500 ? '🟢' : '🟡';
  console.log(`${flag} ${r.name.padEnd(40)} ${String(r.distance).padStart(5)}m`);
});

console.log('\n' + '='.repeat(80));
console.log('📊 통계');
console.log('='.repeat(80));
console.log(`0~300m (초근거리):    ${restaurants.filter(r => r.distance < 300).length}개`);
console.log(`300~500m (가까움):    ${restaurants.filter(r => r.distance >= 300 && r.distance < 500).length}개`);
console.log(`500~750m (적당함):    ${restaurants.filter(r => r.distance >= 500 && r.distance < 750).length}개`);
console.log(`750m 이상 (멈):       ${farRestaurants.length}개 ⚠️ 삭제 대상`);

// 삭제할 식당 목록 파일로 저장
if (farRestaurants.length > 0) {
  console.log('\n' + '='.repeat(80));
  console.log('💾 far_restaurants.json 파일 생성');
  console.log('='.repeat(80));
  fs.writeFileSync('./far_restaurants.json', JSON.stringify(farRestaurants, null, 2));
  console.log(`${farRestaurants.length}개 식당 정보가 저장되었습니다.`);
}
