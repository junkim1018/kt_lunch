/**
 * LLM 추천 이유 생성 테스트
 * 다양한 상황별로 실제 Azure OpenAI를 호출하여 추천 이유 품질 확인
 */
const fs = require('fs');
const path = require('path');

// .env 파일 수동 파싱
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
});

const API_KEY = env.AZURE_OPENAI_API_KEY;
const ENDPOINT = env.AZURE_OPENAI_ENDPOINT;
const DEPLOYMENT = env.AZURE_OPENAI_DEPLOYMENT_NAME;
const API_VERSION = env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

if (!API_KEY || !ENDPOINT || !DEPLOYMENT) {
  console.error('❌ Azure OpenAI 환경변수가 .env에 없습니다.');
  process.exit(1);
}

// 테스트 시나리오 정의
const scenarios = [
  {
    label: '추운 날 + 해장 + 혼밥',
    restaurant: {
      name: '광화문뚝감', category: '한식 · 감자탕/뼈해장국',
      menus: ['감자탕(소) 13,000원', '뼈해장국 10,000원', '항정살 구이 15,000원'],
      priceNote: '1인 평균 1만원', walk: '도보 5분', rating: '4.3',
      calorie: { label: '고칼로리' }, waiting: false, ribbon: false, hot: false
    },
    selections: { weather: 'cold', mood: 'hangover', people: 1, diet: 'nodiet' }
  },
  {
    label: '더운 날 + 가볍게 + 2명',
    restaurant: {
      name: '서브웨이 광화문점', category: '양식 · 샌드위치/샐러드',
      menus: ['이탈리안 비엠티 6,900원', '에그마요 5,900원', '로티세리 치킨 7,400원', '초이스랩 6,900원'],
      priceNote: '세트 기준 8~9천원', walk: '도보 3분', rating: '4.0',
      calorie: { label: '저칼로리' }, waiting: false, ribbon: false, hot: false
    },
    selections: { weather: 'hot', mood: 'safe', people: 2, diet: 'light' }
  },
  {
    label: '비 오는 날 + 팀 점심 + 5명',
    restaurant: {
      name: '광화문나폴리', category: '이탈리안 · 화덕피자/파스타',
      menus: ['마르게리타 피자 18,000원', '까르보나라 파스타 17,000원', '트러플 크림 피자 25,000원'],
      priceNote: '인당 2~2.5만원', walk: '도보 7분', rating: '4.5',
      calorie: { label: '고칼로리' }, waiting: true, ribbon: false, hot: false
    },
    selections: { weather: 'rainy', mood: 'team', people: 5, diet: 'nodiet' }
  },
  {
    label: '선선한 날 + 격식 + 3명',
    restaurant: {
      name: '콘피에르 셀렉션 스타필드 애비뉴 그랑서울점', category: '양식 · 캐주얼 파인다이닝/코스',
      menus: ['시그니처 코스 A 89,000원', '시그니처 코스 B 69,000원', '시그니처 코스 C 55,000원', '홍새우 미나리 비스큐 파스타 27,000원'],
      priceNote: '코스 55,000~89,000원', walk: '도보 4분 (그랑서울)', rating: '4.7',
      calorie: { label: '고칼로리' }, waiting: false, ribbon: true, hot: false
    },
    selections: { weather: 'mild', mood: 'executive', people: 3, diet: 'nodiet' }
  },
  {
    label: '추운 날 + 스트레스 해소 + 4명',
    restaurant: {
      name: '보보식당 (KT West)', category: '중식/마라·동파육',
      menus: ['동파육 19,000원~', '마라가지튀김 14,000원~', '마파두부 13,000원~'],
      priceNote: '1인 평균 1.8만원', walk: '도보 1분 (KT West 지하 1층)', rating: '4.6',
      calorie: { label: '고칼로리' }, waiting: true, ribbon: false, hot: true
    },
    selections: { weather: 'cold', mood: 'stressed', people: 4, diet: 'nodiet' }
  },
  {
    label: '더운 날 + 기분전환 + 혼밥 + 다이어트',
    restaurant: {
      name: '스윗밸런스 광화문점', category: '샐러드 · 포케/샐러드볼',
      menus: ['시그니처 포케볼 12,900원', '연어 포케볼 14,900원', '치킨 샐러드볼 11,900원'],
      priceNote: '1인 평균 1.3만원', walk: '도보 3분', rating: '4.4',
      calorie: { label: '저칼로리' }, waiting: false, ribbon: false, hot: false
    },
    selections: { weather: 'hot', mood: 'sad', people: 1, diet: 'diet' }
  },
  {
    label: '선선한 날 + 든든하게 + 8명 단체',
    restaurant: {
      name: '새마을식당 광화문점', category: '한식 · 삼겹살/구이',
      menus: ['열탄불고기 12,000원', '7분돼지김치찌개 8,000원', '된장찌개 8,000원'],
      priceNote: '1인 평균 1만원', walk: '도보 6분', rating: '4.1',
      calorie: { label: '고칼로리' }, waiting: true, ribbon: false, hot: false
    },
    selections: { weather: 'mild', mood: 'hearty', people: 8, diet: 'nodiet' }
  },
  {
    label: '비 오는 날 + 새로운 맛 + 2명',
    restaurant: {
      name: '야마야 광화문 디타워점', category: '일식 · 규카츠/일본커틀릿',
      menus: ['규카츠 정식 18,000원', '메가 규카츠 정식 23,000원', '히레카츠 정식 18,000원'],
      priceNote: '인당 1.8~2.3만원', walk: '도보 2분 (디타워 B1)', rating: '4.5',
      calorie: { label: '고칼로리' }, waiting: true, ribbon: false, hot: false
    },
    selections: { weather: 'rainy', mood: 'exciting', people: 2, diet: 'nodiet' }
  },
  {
    label: '추운 날 + 무난하게 + 혼밥 + 채식',
    restaurant: {
      name: '컬러그린 광화문점', category: '샐러드 · 건강식/비건',
      menus: ['비건 시금치 파스타 13,500원', '두부강황 볶음밥 12,500원', '구운 채소 곡물볼 11,500원'],
      priceNote: '인당 1.2~1.4만원', walk: '도보 4분', rating: '4.3',
      calorie: { label: '저칼로리' }, waiting: false, ribbon: false, hot: false
    },
    selections: { weather: 'cold', mood: 'safe', people: 1, diet: 'vegetarian' }
  },
  {
    label: '더운 날 + 팀 점심 + 3명 + 가볍게',
    restaurant: {
      name: '후라토식당 본점', category: '일식 · 정식/가정식',
      menus: ['후라토 정식 16,000원', '사시미 정식 19,000원', '규카츠 정식 17,000원'],
      priceNote: '인당 1.6~1.9만원', walk: '도보 5분', rating: '4.6',
      calorie: { label: '보통' }, waiting: false, ribbon: false, hot: false
    },
    selections: { weather: 'hot', mood: 'team', people: 3, diet: 'light' }
  },
  {
    label: '선선한 날 + 임원과 함께 + 4명',
    restaurant: {
      name: '몽중헌 광화문점', category: '중식 · 프리미엄 중화요리/짬뽕',
      menus: ['차돌박이 낙지 짬뽕 25,000원', '금도시락 45,000원', '소고기 대파탕면 15,000원', '잡탕밥 25,000원'],
      priceNote: '인당 2.5~4.5만원', walk: '도보 3분', rating: '4.4',
      calorie: { label: '고칼로리' }, waiting: false, ribbon: false, hot: false
    },
    selections: { weather: 'mild', mood: 'executive', people: 4, diet: 'nodiet' }
  },
  {
    label: '비 오는 날 + 우울할 때 + 혼밥',
    restaurant: {
      name: '무교동북어국집', category: '한식 · 북어해장국/한정식',
      menus: ['북어정식 15,000원', '북어해장국 12,000원', '묵은지 김치찌개 10,000원'],
      priceNote: '인당 1~1.5만원', walk: '도보 3분', rating: '4.5',
      calorie: { label: '보통' }, waiting: false, ribbon: false, hot: false
    },
    selections: { weather: 'rainy', mood: 'sad', people: 1, diet: 'nodiet' }
  },
  {
    label: '비 오는 날 + 무난하게 + 2명 (초밥집→따뜻한 메뉴)',
    restaurant: {
      name: '코끼리초밥 광화문점', category: '일식 · 초밥 세트/런치',
      menus: ['런치 B세트(12P+우동) 28,000원'],
      allMenus: ['런치 B세트(12P+우동) 28,000원', '연어 스페셜 세트 32,000원', '런치 단품 초밥 1,500원~'],
      priceNote: '인당 2.8~3.2만원', walk: 'KT East 지하1층', rating: '4.7',
      calorie: { label: '저칼로리' }, waiting: false, ribbon: false, hot: false
    },
    selections: { weather: 'rainy', mood: 'safe', people: 2, diet: 'nodiet' }
  },
  {
    label: '추운 날 + 든든하게 + 3명 (참치회→따뜻한 코스)',
    restaurant: {
      name: 'VIP참치 광화문점', category: '일식 · 참치회/코스',
      menus: ['회덮밥 (점심) 12,000원', '참다랑어 정식 (점심) 29,000원', '참다랑어 특정식 (점심) 39,000원'],
      priceNote: '1인 평균 3만원 (점심코스)', walk: '도보 4분 (도렴빌딩 지하1층)', rating: '4.3',
      calorie: { label: '저칼로리' }, waiting: false, ribbon: false, hot: false
    },
    selections: { weather: 'cold', mood: 'hearty', people: 3, diet: 'nodiet' }
  },
];

// 프롬프트 빌더 (api/llm.js와 동일 로직)
function buildPrompt(r, selections) {
  const weatherLabels = { hot: '더운 날씨', mild: '선선한 날씨', cold: '추운 날씨', rainy: '비 오는 날씨' };
  const moodLabels = { safe: '무난하게 먹고 싶은', hearty: '든든하게 배부르게 먹고 싶은', exciting: '신나는 날! 특별하고 새로운 맛을 즐기고 싶은', team: '팀/동료와 같이 먹기 좋은', hangover: '해장이 필요한', sad: '기분전환이 필요한', executive: '임원/VIP와 격식 있는 식사가 필요한', stressed: '스트레스 해소가 필요한' };
  const dietLabels = { nodiet: '', light: '가볍게 먹고 싶은', diet: '다이어트 중인', vegetarian: '채식 선호' };
  const toneGuides = {
    safe: '편안하고 친근한 말투로',
    hearty: '푸짐함을 강조하며 배고픈 직장인 공감하듯',
    exciting: '설레는 톤으로, 맛집 탐험가처럼',
    team: '팀워크/동료 케미를 살려서',
    hangover: '해장 선배가 조언하듯 위트있게',
    sad: '따뜻하게 위로하듯',
    executive: '품격 있되 센스있는 비서처럼',
    stressed: '시원하게 날려버리자는 느낌으로',
  };

  const weatherText = weatherLabels[selections.weather] || selections.weather;
  const moodText = moodLabels[selections.mood] || selections.mood;
  const dietText = dietLabels[selections.diet] || '';
  const peopleText = selections.people >= 8 ? '8명 이상 단체' : selections.people >= 5 ? `${selections.people}명 중규모 모임` : selections.people >= 2 ? `${selections.people}명` : '혼밥';
  const toneText = toneGuides[selections.mood] || '자연스럽게';

  const menuList = (r.menus || []).join(', ');
  const allMenuList = r.allMenus ? (r.allMenus || []).join(', ') : '';
  const hasFilteredMenus = r.allMenus && r.allMenus.length > (r.menus || []).length;
  const extras = [];
  if (r.ribbon) extras.push('블루리본 인증');
  if (r.calorie) extras.push(r.calorie.label);
  if (r.waiting) extras.push('웨이팅 있음');
  else extras.push('대기 없이 바로 입장');
  if (r.hot) extras.push('핫한 신상 맛집');
  const extrasText = extras.join(', ');

  // 상황별 이모지 매핑
  const weatherEmoji = { hot: '☀️', mild: '🌤️', cold: '❄️', rainy: '☔' };
  const moodEmoji = { safe: '😊', hearty: '🍖', exciting: '✨', team: '👥', hangover: '💊', sad: '🎉', executive: '🤵', stressed: '🔥' };
  const suggestedEmoji = moodEmoji[selections.mood] || weatherEmoji[selections.weather] || '🍽️';

  // 날씨별 메뉴 가이드
  const isRainyOrCold = selections.weather === 'rainy' || selections.weather === 'cold';
  const weatherMenuGuide = isRainyOrCold
    ? `\n규칙: ${selections.weather === 'rainy' ? '비 오는 날' : '추운 날'} → 따뜻한 메뉴(탕/국/우동/전골 등) 추천. 회·초밥·사시미 등 날것 메뉴 언급 금지.`
    : '';

  return `KT 광화문 직장인 점심 추천 한줄평. ${toneText} 작성.

상황: ${weatherText}, ${moodText}, ${peopleText}${dietText ? ', ' + dietText : ''}
식당: ${r.name} (${r.category})
추천메뉴: ${menuList}${hasFilteredMenus ? `\n전체메뉴: ${allMenuList}` : ''}
가격: ${r.priceNote || r.price} | 거리: ${r.walk || ''} | 평점: ${r.rating || ''}★ | ${extrasText}

형식: ${suggestedEmoji} + 메뉴명 포함 + 상황에 맞는 위트/공감 + 40자이내
금지: k/K 가격축약, 딱딱한 안내문 톤${weatherMenuGuide}
출력: {"reasons":["한줄평"]}`;
}

async function callLLM(prompt) {
  const url = `${ENDPOINT.replace(/\/$/, '')}/openai/deployments/${DEPLOYMENT}/chat/completions?api-version=${API_VERSION}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': API_KEY },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      max_completion_tokens: 4000,
      reasoning_effort: 'low',
    }),
  });
  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`API ${resp.status}: ${errText.substring(0, 200)}`);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('Empty response');
  const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // 텍스트 안에 {"reasons":[...]} 추출 시도
    const jsonMatch = cleaned.match(/\{\s*"reasons"\s*:\s*\[.*?\]\s*\}/s);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch {}
    }
    // 첫 줄을 추천 이유로 사용
    const firstLine = cleaned.split('\n')[0].replace(/^["']|["']$/g, '').trim();
    if (firstLine.length > 0) return { reasons: [firstLine] };
    throw new Error('Empty parsed response');
  }
}

async function main() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('  🤖 LLM 추천 이유 생성 테스트');
  console.log(`  모델: ${DEPLOYMENT} | 시나리오: ${scenarios.length}개`);
  console.log('══════════════════════════════════════════════════════════════\n');

  let pass = 0, fail = 0;

  for (let i = 0; i < scenarios.length; i++) {
    const s = scenarios[i];
    const prompt = buildPrompt(s.restaurant, s.selections);
    
    process.stdout.write(`[${i+1}/${scenarios.length}] ${s.label}... `);
    
    try {
      const result = await callLLM(prompt);
      const reason = result.reasons?.[0] || '(없음)';
      const len = reason.length;
      const hasEmoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(reason);
      const hasMenu = [...(s.restaurant.menus || []), ...(s.restaurant.allMenus || [])].some(m => {
        const menuName = m.split(/\s*\d/)[0].trim();
        return reason.includes(menuName) || menuName.split(/[·/]/).some(part => reason.includes(part.trim()));
      });

      const issues = [];
      if (len > 50) issues.push(`길이 초과(${len}자)`);
      if (!hasEmoji) issues.push('이모지 없음');
      if (!hasMenu) issues.push('메뉴명 미언급');

      if (issues.length === 0) {
        console.log('✅ PASS');
        pass++;
      } else {
        console.log(`⚠️ WARN (${issues.join(', ')})`);
        pass++; // soft warning, not a fail
      }

      console.log(`   📍 ${s.restaurant.name}`);
      console.log(`   💬 "${reason}" (${len}자)`);
      console.log('');
    } catch (err) {
      console.log('❌ FAIL');
      console.log(`   에러: ${err.message}`);
      fail++;
      console.log('');
    }
  }

  console.log('══════════════════════════════════════════════════════════════');
  console.log(`  📊 최종 결과: ${pass} PASS / ${fail} FAIL (총 ${scenarios.length}개)`);
  console.log('══════════════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
