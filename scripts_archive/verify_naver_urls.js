const fs = require('fs');

// App.js 파일 읽기
const content = fs.readFileSync('src/App.js', 'utf8');

// restaurantDB 추출
const match = content.match(/const restaurantDB = \[([\s\S]*?)\];\s*const OPTIONS/);
if (!match) {
  console.log('❌ restaurantDB를 찾을 수 없습니다.');
  process.exit(1);
}

const dbStr = '[' + match[1] + ']';
let restaurantDB;
try {
  restaurantDB = eval(dbStr);
} catch (e) {
  console.log('❌ restaurantDB 파싱 실패:', e.message);
  process.exit(1);
}

console.log(`\n📋 총 ${restaurantDB.length}개 식당 네이버 지도 URL 검증\n`);
console.log('='.repeat(80));

let issues = [];
let okCount = 0;

restaurantDB.forEach((r, idx) => {
  const name = r.name;
  const naverUrl = r.naver;
  
  if (!naverUrl) {
    issues.push({
      index: idx + 1,
      name,
      issue: '❌ 네이버 URL 없음'
    });
    return;
  }

  // 네이버 지도 URL 형식 검증
  if (!naverUrl.includes('map.naver.com')) {
    issues.push({
      index: idx + 1,
      name,
      issue: '⚠️ 네이버 지도 URL이 아님',
      url: naverUrl
    });
    return;
  }

  // URL에서 검색어 추출
  let searchTerm = '';
  try {
    if (naverUrl.includes('/search/')) {
      const urlObj = new URL(naverUrl);
      const parts = urlObj.pathname.split('/search/');
      if (parts.length > 1) {
        searchTerm = decodeURIComponent(parts[1]);
      }
    } else if (naverUrl.includes('query=')) {
      const urlObj = new URL(naverUrl);
      searchTerm = decodeURIComponent(urlObj.searchParams.get('query') || '');
    }
  } catch (e) {
    issues.push({
      index: idx + 1,
      name,
      issue: '⚠️ URL 파싱 오류',
      url: naverUrl
    });
    return;
  }

  // 식당명과 검색어 비교 (유사도 체크)
  const cleanName = name.replace(/\s*(광화문점|디타워점|SFC점|종각점|본점|지점|1호점|2호점|3호점|광화문|디타워|SFC|종각)\s*/g, '').trim();
  const cleanSearch = searchTerm.replace(/\s*(광화문점|디타워점|SFC점|종각점|본점|지점|1호점|2호점|3호점|광화문|디타워|SFC|종각)\s*/g, '').trim();

  // 기본 단어가 포함되어 있는지 확인
  const nameWords = cleanName.split(/\s+/);
  const searchWords = cleanSearch.split(/\s+/);
  
  let matchFound = false;
  for (const word of nameWords) {
    if (word.length >= 2 && cleanSearch.includes(word)) {
      matchFound = true;
      break;
    }
  }

  if (!matchFound) {
    // 반대로도 확인
    for (const word of searchWords) {
      if (word.length >= 2 && cleanName.includes(word)) {
        matchFound = true;
        break;
      }
    }
  }

  if (!matchFound) {
    issues.push({
      index: idx + 1,
      name,
      issue: '❓ 식당명과 URL 검색어 불일치',
      searchTerm,
      url: naverUrl
    });
  } else {
    okCount++;
  }
});

// 결과 출력
console.log(`\n✅ 정상: ${okCount}개`);
console.log(`⚠️ 문제: ${issues.length}개\n`);

if (issues.length > 0) {
  console.log('='.repeat(80));
  console.log('🔍 상세 문제 목록:\n');
  
  issues.forEach(item => {
    console.log(`[${item.index}] ${item.name}`);
    console.log(`    ${item.issue}`);
    if (item.searchTerm) {
      console.log(`    검색어: "${item.searchTerm}"`);
    }
    if (item.url) {
      console.log(`    URL: ${item.url}`);
    }
    console.log('');
  });

  console.log('='.repeat(80));
  console.log('\n💡 수정이 필요한 식당들입니다. 네이버 지도에서 정확한 식당을 검색한 후 URL을 업데이트하세요.\n');
} else {
  console.log('✨ 모든 식당의 네이버 지도 URL이 정상입니다!\n');
}

// 수정 스크립트 생성 제안
if (issues.length > 0) {
  console.log('\n📝 수정 참고:');
  console.log('- 네이버 지도(https://map.naver.com)에서 식당을 검색');
  console.log('- 정확한 위치의 식당을 찾아 URL 복사');
  console.log('- /search/ 형식 또는 /place/ 형식 모두 사용 가능');
  console.log('- 예: https://map.naver.com/v5/search/식당명+광화문');
  console.log('');
}
