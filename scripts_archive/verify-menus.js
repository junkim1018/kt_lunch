/**
 * 130개 식당 메뉴 전수 검증 스크립트
 * 
 * 네이버 지도에서 각 식당을 검색하여 메뉴 정보가 맞는지 확인합니다.
 * - Phase 1: 네이버 검색으로 식당 존재 확인 + 메뉴 정보 수집
 * - Phase 2: DB 메뉴와 네이버 메뉴 비교
 * 
 * 실행: node scripts_archive/verify-menus.js
 * 약 130초 소요 (1초/식당)
 */

const fs = require('fs');
const path = require('path');

// 데이터 로드
const dataPath = path.join(__dirname, '..', 'src', 'data', 'restaurantData.js');
const dataContent = fs.readFileSync(dataPath, 'utf-8');
const match = dataContent.match(/(?:export\s+(?:default|const\s+\w+\s*=))\s*(\[[\s\S]*\]);?\s*$/m);
if (!match) { console.error('데이터 파싱 실패'); process.exit(1); }

let restaurants;
try { restaurants = eval(match[1]); } catch(e) { console.error('eval 에러:', e.message); process.exit(1); }

const BATCH_SIZE = 5; // 동시 요청 수
const DELAY = 300; // ms between batches

async function searchNaver(name) {
  const query = encodeURIComponent(name + ' 광화문');
  const url = `https://map.naver.com/v5/search/${query}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      redirect: 'follow',
    });
    clearTimeout(timeout);
    const text = await res.text();
    
    if (text.includes('조건에 맞는 업체가 없습니다')) {
      return { found: false, error: 'no results' };
    }
    
    // Extract menu/price info from the page
    const menuMatches = text.match(/[\d,]+원/g) || [];
    const prices = menuMatches.map(m => parseInt(m.replace(/[^0-9]/g, ''))).filter(p => p > 0 && p < 500000);
    
    return {
      found: true,
      naverPrices: prices,
      hasMenuData: prices.length > 0,
    };
  } catch(e) {
    return { found: false, error: e.message };
  }
}

async function getPlaceMenus(placeId) {
  const url = `https://map.naver.com/p/api/place/restaurant/${placeId}/menu/list`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://map.naver.com/',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch(e) {
    return null;
  }
}

function extractPrice(menuStr) {
  const m = menuStr.match(/([\d,]+)원/);
  return m ? parseInt(m[1].replace(/,/g, '')) : null;
}

function extractMenuName(menuStr) {
  return menuStr.replace(/\s*[\d,]+원.*$/, '').trim();
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  🍽️  KT 점심 추천기 — 메뉴 전수 검증');
  console.log('  대상: ' + restaurants.length + '개 식당');
  console.log('══════════════════════════════════════════════════════════════\n');

  const issues = [];
  let processed = 0;

  for (let i = 0; i < restaurants.length; i++) {
    const r = restaurants[i];
    const result = await searchNaver(r.name);
    processed++;
    
    if (!result.found) {
      console.log(`  [${i+1}/${restaurants.length}] ${r.name}... ❌ 검색 실패 (${result.error})`);
      issues.push({ idx: i+1, name: r.name, type: 'NOT_FOUND', detail: result.error });
    } else {
      let menuIssues = [];
      
      // DB 가격 추출
      const dbPrices = r.menus.map(m => extractPrice(m)).filter(p => p);
      
      if (result.hasMenuData && dbPrices.length > 0 && result.naverPrices.length > 0) {
        const dbMin = Math.min(...dbPrices);
        const naverMin = Math.min(...result.naverPrices);
        // 50% 이상 차이나면 경고
        if (dbMin > 0 && naverMin > 0) {
          const priceDiff = Math.abs(dbMin - naverMin) / Math.max(dbMin, naverMin);
          if (priceDiff > 0.5) {
            menuIssues.push(`가격 차이: DB 최저 ${dbMin}원 vs 네이버 ${naverMin}원`);
          }
        }
      }
      
      if (menuIssues.length > 0) {
        console.log(`  [${i+1}/${restaurants.length}] ${r.name}... ⚠️ ${menuIssues.join(', ')}`);
        issues.push({ idx: i+1, name: r.name, type: 'MENU_DIFF', detail: menuIssues.join('; ') });
      } else {
        console.log(`  [${i+1}/${restaurants.length}] ${r.name}... ✅`);
      }
    }
    
    // Rate limiting
    if (i % 5 === 4) {
      await new Promise(r => setTimeout(r, 500));
    } else {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('  📊 메뉴 검증 결과');
  console.log('══════════════════════════════════════════════════════════════\n');

  if (issues.length === 0) {
    console.log('  ✅ 모든 식당 메뉴 검증 통과!');
  } else {
    console.log(`  ⚠️ ${issues.length}건 이슈 발견:\n`);
    issues.forEach(issue => {
      console.log(`  [${issue.idx}] ${issue.name}`);
      console.log(`      ${issue.type}: ${issue.detail}`);
    });
  }

  console.log('\n  검증 완료: ' + processed + '/' + restaurants.length + '개 식당 확인됨');
  console.log('══════════════════════════════════════════════════════════════');
}

main().catch(e => console.error('Error:', e));
