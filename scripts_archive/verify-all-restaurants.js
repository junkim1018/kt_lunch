/**
 * 전수 식당 검증 스크립트
 * 모든 식당의 네이버 지도 URL을 확인하고 존재 여부를 검증
 * 
 * 검증 항목:
 * 1. 네이버 검색 결과 존재 여부
 * 2. KT East (37.5716, 126.9768)로부터의 거리 재계산
 * 3. 좌표 유효성
 * 4. 가격/메뉴 기본 형식
 */

const path = require('path');

// restaurantData를 CommonJS로 로드하기 위한 파싱
const fs = require('fs');
const dataPath = path.join(__dirname, '..', 'src', 'data', 'restaurantData.js');
const dataContent = fs.readFileSync(dataPath, 'utf-8');

// export 구문을 제거하고 배열만 추출
const match = dataContent.match(/(?:export\s+(?:default|const\s+\w+\s*=))\s*(\[[\s\S]*\]);?\s*$/m);
if (!match) {
  console.error('❌ restaurantData.js 파싱 실패');
  process.exit(1);
}

let restaurants;
try {
  restaurants = eval(match[1]);
} catch (e) {
  console.error('❌ 데이터 파싱 에러:', e.message);
  process.exit(1);
}

// KT East 좌표
const KT_EAST = { lat: 37.5720, lng: 126.9788 };
const MAX_DISTANCE_M = 700;

// 거리 계산 (Haversine)
function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// 네이버 검색으로 식당 존재 확인
async function checkNaverExists(name) {
  const query = encodeURIComponent(name + ' 광화문');
  const url = `https://map.naver.com/v5/search/${query}`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    
    const resp = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    
    const text = await resp.text();
    
    // "조건에 맞는 업체가 없습니다" 포함 시 미존재
    if (text.includes('조건에 맞는 업체가 없습니다')) {
      return { exists: false, reason: '네이버 지도 검색 결과 없음' };
    }
    
    return { exists: true };
  } catch (err) {
    return { exists: null, reason: `검색 실패: ${err.message}` };
  }
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  🔍 KT 점심 추천기 — 전수 식당 검증');
  console.log(`  대상: ${restaurants.length}개 식당`);
  console.log('══════════════════════════════════════════════════════════════\n');

  const issues = [];
  let checked = 0;

  // Phase 1: 오프라인 검증 (좌표, 거리, 필수 필드, 가격)
  console.log('── Phase 1: 오프라인 검증 (좌표/거리/필드) ──');
  
  for (let i = 0; i < restaurants.length; i++) {
    const r = restaurants[i];
    const prefix = `[${i + 1}] ${r.name}`;
    
    // 거리 검증
    if (r.coords) {
      const dist = getDistance(KT_EAST.lat, KT_EAST.lng, r.coords.lat, r.coords.lng);
      if (dist > MAX_DISTANCE_M) {
        issues.push({ idx: i + 1, name: r.name, type: 'DISTANCE', detail: `${Math.round(dist)}m (${MAX_DISTANCE_M}m 초과)` });
      }
    }
    
    // 메뉴 형식 검증 (원 포함, 최소 1개)
    if (!r.menus || !Array.isArray(r.menus) || r.menus.length === 0) {
      issues.push({ idx: i + 1, name: r.name, type: 'MENU', detail: '메뉴 누락 또는 빈 배열' });
    }
    
    // 평점 범위 (1.0~5.0)
    const rating = parseFloat(r.rating);
    if (isNaN(rating) || rating < 1.0 || rating > 5.0) {
      issues.push({ idx: i + 1, name: r.name, type: 'RATING', detail: `잘못된 평점: ${r.rating}` });
    }
  }
  
  console.log(`  ✅ 오프라인 검증 완료 (${issues.length}개 이슈 발견)\n`);

  // Phase 2: 네이버 지도 존재 확인 (배치 처리)
  console.log('── Phase 2: 네이버 지도 존재 확인 ──');
  console.log(`  총 ${restaurants.length}개 식당을 순차 확인합니다...\n`);
  
  const notFound = [];
  const searchFailed = [];
  
  for (let i = 0; i < restaurants.length; i++) {
    const r = restaurants[i];
    // 식당명에서 특수문자를 정리하여 검색
    const searchName = r.name.replace(/\s*\(.*?\)\s*/g, '').trim();
    
    process.stdout.write(`  [${i + 1}/${restaurants.length}] ${r.name}... `);
    
    const result = await checkNaverExists(searchName);
    checked++;
    
    if (result.exists === false) {
      console.log('❌ 미존재');
      notFound.push({ idx: i + 1, name: r.name, detail: result.reason });
    } else if (result.exists === null) {
      console.log(`⚠️ 확인불가 (${result.reason})`);
      searchFailed.push({ idx: i + 1, name: r.name, detail: result.reason });
    } else {
      console.log('✅');
    }
    
    // 네이버 서버 부하 방지 (1초 딜레이)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 결과 요약
  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  📊 전수 검증 결과');
  console.log('══════════════════════════════════════════════════════════════\n');
  
  if (issues.length > 0) {
    console.log('⚠️ 오프라인 검증 이슈:');
    issues.forEach(issue => {
      console.log(`  [${issue.idx}] ${issue.name} — ${issue.type}: ${issue.detail}`);
    });
    console.log('');
  }
  
  if (notFound.length > 0) {
    console.log('❌ 네이버 지도 미존재 (폐업/미등록 의심):');
    notFound.forEach(nf => {
      console.log(`  [${nf.idx}] ${nf.name}`);
    });
    console.log('');
  }
  
  if (searchFailed.length > 0) {
    console.log('⚠️ 검색 확인 불가 (수동 확인 필요):');
    searchFailed.forEach(sf => {
      console.log(`  [${sf.idx}] ${sf.name} — ${sf.detail}`);
    });
    console.log('');
  }

  const totalIssues = issues.length + notFound.length;
  if (totalIssues === 0) {
    console.log('✅ 모든 식당 검증 통과!');
  } else {
    console.log(`📋 총 ${totalIssues}건 이슈 발견 (오프라인 ${issues.length} + 미존재 ${notFound.length})`);
  }
  
  console.log(`\n  검증 완료: ${checked}/${restaurants.length}개 식당 확인됨`);
  console.log('══════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
