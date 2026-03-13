import { useState, useEffect, useRef } from "react";
import { restaurantDB } from "./data/restaurantData";
import { OPTIONS, LABELS, QUICK_PRESETS } from "./data/constants";
import { getDistance } from "./utils/distance";
import { getTimeContextScore, calculateMMRScore } from "./services/ScoringService";
import { saveFeedback, getFeedbackScore } from "./services/FeedbackService";
import { saveVisit, getPersonalizationScore } from "./services/PersonalizationService";

// ✅ KT East 빌딩 기준 좌표 (종로3길 33)
const KT_EAST_COORDS = { lat: 37.5703, lng: 126.9835 };

const RECENT_SEEN_KEY = 'kt-lunch-recent-seen';
const RECENT_SEEN_EXPIRY_MS = 3 * 60 * 60 * 1000; // 3시간

function loadRecentSeen() {
  try {
    const raw = localStorage.getItem(RECENT_SEEN_KEY);
    if (!raw) return [];
    const { names, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > RECENT_SEEN_EXPIRY_MS) {
      localStorage.removeItem(RECENT_SEEN_KEY);
      return [];
    }
    return Array.isArray(names) ? names : [];
  } catch {
    return [];
  }
}

function saveRecentSeen(names) {
  try {
    localStorage.setItem(RECENT_SEEN_KEY, JSON.stringify({ names, timestamp: Date.now() }));
  } catch { /* quota exceeded 등 무시 */ }
}

export default function LunchRecommender() {
  const [selections, setSelections] = useState({ weather: 'hot', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000 });
  const [results, setResults] = useState({ list: [], relaxedMsg: null });
  const [showAll, setShowAll] = useState(false);
  const [expandedCard, setExpandedCard] = useState(null);
  const recentSeen = useRef(loadRecentSeen());
  const resultsTopRef = useRef(null);
  const pageTopRef = useRef(null);
  const [time, setTime] = useState("");
  const [step, setStep] = useState("form");
  const [loadingDot, setLoadingDot] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [quickPresets, setQuickPresets] = useState([]);
  const [toast, setToast] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState({});

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  // 빠른 추천 버튼을 섞는 함수 (현재 시간/계절에 맞게 필터링)
  const shuffleQuickPresets = () => {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1;

    // 현재 계절에 맞는 날씨 판단
    let currentWeather = 'mild';
    if (month >= 6 && month <= 8) currentWeather = 'hot';
    else if (month >= 12 || month <= 2) currentWeather = 'cold';

    // 프리셋의 날씨를 현재 날씨로 덮어쓰기 (비/해장 등 날씨 고정 프리셋 제외)
    const weatherFixed = new Set(['rainy']);
    const adjusted = QUICK_PRESETS.map(p => {
      if (weatherFixed.has(p.settings.weather)) return p;
      return { ...p, settings: { ...p.settings, weather: currentWeather } };
    });

    // 현재 시간대에 어울리는 프리셋 우선 (점심피크: 든든, 오후: 가볍게)
    const preferred = new Set();
    if (hour >= 11 && hour < 13) {
      preferred.add('hearty'); preferred.add('team');
    } else if (hour >= 14) {
      preferred.add('safe'); preferred.add('sad');
    }
    if (currentWeather === 'hot') preferred.add('safe');
    if (currentWeather === 'cold') preferred.add('hearty');

    // 우선 프리셋과 나머지를 분리
    const priority = adjusted.filter(p => preferred.has(p.settings.mood));
    const rest = adjusted.filter(p => !preferred.has(p.settings.mood));

    // 각각 셔플
    const shuffle = (arr) => {
      const a = [...arr];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    // 우선 프리셋에서 2개, 나머지에서 2개 선택 (부족하면 나머지에서 채움)
    const picked = [...shuffle(priority).slice(0, 2), ...shuffle(rest).slice(0, 2)];
    if (picked.length < 4) {
      const extra = shuffle(rest).filter(p => !picked.includes(p));
      picked.push(...extra.slice(0, 4 - picked.length));
    }
    setQuickPresets(shuffle(picked).slice(0, 4));
  };

  // 컴포넌트 마운트 시 빠른 추천 버튼 랜덤 선택
  useEffect(() => {
    shuffleQuickPresets();
    
    // 탭 복귀 시 프리셋 새로고침 (오래된 날씨 프리셋 방지)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        shuffleQuickPresets();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // 토스트 자동 닫기
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  // ⚡ 빠른 추천: 현재 날씨와 시간대를 고려한 자동 추천
  const handleQuickRecommend = () => {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth() + 1; // 0-based

    // 시간대 기반 기분 설정
    let mood = 'safe';
    if (hour >= 11 && hour < 13) {
      mood = 'hearty'; // 점심 피크타임: 든든한 식사
    } else if (hour >= 13 && hour < 14) {
      mood = 'safe'; // 늦은 점심: 안전한 선택
    } else if (hour >= 14) {
      mood = 'safe'; // 늦은 시간: 간단한 식사
    }

    // 계절 기반 날씨 설정
    let weather = 'mild';
    if (month >= 6 && month <= 8) {
      weather = 'hot'; // 여름
    } else if (month >= 12 || month <= 2) {
      weather = 'cold'; // 겨울
    } else if (month === 3 || month === 9 || month === 10 || month === 11) {
      weather = 'mild'; // 봄/가을
    }

    // 빠른 추천 설정 적용
    const quickSettings = {
      weather,
      mood,
      people: 2,
      diet: 'nodiet',
      budget: 15000,
    };

    setSelections(quickSettings);

    // 바로 추천 실행
    setTimeout(() => {
      handleRecommend();
    }, 100);
  };

  useEffect(() => {
    if (step !== "loading") return;
    const interval = setInterval(() => setLoadingDot(d => (d + 1) % 3), 150);
    const timeout = setTimeout(async () => {
      try {
        // 🎯 새로운 알고리즘: 조건 교집합 기반 3단계 필터링
        const recentSet = new Set(recentSeen.current);
        const peopleNum = selections.people || 2;
        const budgetNum = selections.budget || 15000;
        
        let peopleCategory;
        if (peopleNum === 1) peopleCategory = 'solo';
        else if (peopleNum <= 3) peopleCategory = 'small';
        else if (peopleNum <= 6) peopleCategory = 'medium';
        else peopleCategory = 'large';

        // ✅ 조건 매칭 함수들
        const matchWeather = (r) => {
          if (!selections.weather) return false;
          const hasTag = r.weather && Array.isArray(r.weather) && r.weather.includes(selections.weather);
          if (hasTag) return true;
          // 태그 없어도 메뉴/카테고리로 매칭
          const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
          if (selections.weather === 'hot') return /냉면|콩국수|물회|냉모밀|빙수|샐러드|냉채/.test(text);
          if (selections.weather === 'cold') return /국밥|탕|찌개|전골|라멘|설렁탕|갈비탕|부대/.test(text);
          if (selections.weather === 'rainy') return /파전|해물전|녹두전|감자전|부침|수제비|칼국수|국밥|짬뽕/.test(text);
          if (selections.weather === 'mild') return true;
          return false;
        };

        const matchMood = (r) => {
          if (!selections.mood) return false;
          
          // 해장: mood에 'hangover'가 있거나 카테고리에 국밥/해장/탕 등 포함
          if (selections.mood === 'hangover') {
            const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('hangover');
            const hasHangoverCategory = r.category && 
              /(국밥|순대국|해장국|해장|육개장|감자탕|뼈다귀|곰탕|설렁탕|갈비탕|닭볶음탕|매운탕|추어탕|삼계탕|찌개)/.test(r.category);
            return hasMoodTag || hasHangoverCategory;
          }
          
          // 격식: mood에 'executive'가 있거나 블루리본/expensive (캐주얼 제외)
          if (selections.mood === 'executive') {
            const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('executive');
            const isUpscale = r.ribbon || (r.budget && Array.isArray(r.budget) && r.budget.includes('expensive'));
            const category = r.category || '';
            const isCasual = /(순대|분식|떡볶이|김밥|국밥|백반|푸드코트)/.test(category);
            return hasMoodTag || (isUpscale && !isCasual);
          }
          
          // 팀: mood에 'team'이 있거나 중/대규모 가능
          if (selections.mood === 'team') {
            const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('team');
            const supportsGroup = r.people && Array.isArray(r.people) && 
              (r.people.includes('large') || r.people.includes('medium'));
            return hasMoodTag || supportsGroup;
          }
          
          // 우울: mood에 'sad'가 있거나, 디저트/특별한 음식/분위기 좋은 곳
          if (selections.mood === 'sad') {
            const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('sad');
            const isComfortFood = r.mood && Array.isArray(r.mood) && 
              (r.mood.includes('great') || r.mood.includes('exciting'));
            const category = r.category || '';
            const hasComfortCategory = category.includes('디저트') || category.includes('카페') || 
              category.includes('빵') || category.includes('떡볶이') || category.includes('치킨') ||
              category.includes('파스타') || category.includes('라멘');
            return hasMoodTag || isComfortFood || hasComfortCategory;
          }
          
          // 특별하게/신나게: mood에 'exciting'이 있거나, 이색/프리미엄 식당
          if (selections.mood === 'exciting') {
            const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('exciting');
            const isSpecial = r.ribbon || 
              (r.mood && Array.isArray(r.mood) && r.mood.includes('great'));
            const category = r.category || '';
            const hasExcitingCategory = category.includes('오마카세') || category.includes('코스') ||
              category.includes('프리미엄') || category.includes('스테이크');
            return hasMoodTag || isSpecial || hasExcitingCategory;
          }
          
          // 든든하게: mood에 'hearty'가 있거나, 고칼로리/구이/육류 메뉴 (카페/디저트/브런치 제외)
          if (selections.mood === 'hearty') {
            const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('hearty');
            const category = r.category || '';
            const isHearty = category.includes('구이') || category.includes('갈비') || 
              category.includes('삼겹') || category.includes('돈까스') || category.includes('카츠') ||
              category.includes('육') || category.includes('불고기') || category.includes('곱창');
            const isHighCal = r.calorie && r.calorie.label === '고칼로리';
            const isCafeOrBrunch = /(카페|디저트|브런치|팬케이크|베이커리|빵)/.test(category);
            return hasMoodTag || isHearty || (isHighCal && !isCafeOrBrunch);
          }
          
          // 스트레스: mood에 'stressed'가 있거나, 매운음식/고기 (자극적 음식)
          if (selections.mood === 'stressed') {
            const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('stressed');
            const category = r.category || '';
            const menuText = (r.menus || []).join(' ');
            const isStressRelief = category.includes('구이') || category.includes('매운') ||
              category.includes('불') || category.includes('마라') ||
              category.includes('떡볶이') || category.includes('닭갈비') ||
              category.includes('곱창') || category.includes('삼겹');
            const hasSpicyMenu = /매운|불닭|마라|떡볶이|쭈꾸미|닭발|엽기/.test(menuText);
            return hasMoodTag || isStressRelief || hasSpicyMenu;
          }
          
          // 나머지 mood: 직접 매칭
          return r.mood && Array.isArray(r.mood) && r.mood.includes(selections.mood);
        };

        const matchPeople = (r) => {
          if (!r.people || !Array.isArray(r.people)) return false;
          
          // 정확히 매칭되거나
          if (r.people.includes(peopleCategory)) return true;
          
          // 양방향 인접 카테고리 매칭 (1단계 차이까지 허용)
          const categoryMap = { 'solo': 0, 'small': 1, 'medium': 2, 'large': 3 };
          const userCat = categoryMap[peopleCategory];
          return r.people.some(p => {
            const restCat = categoryMap[p];
            return restCat !== undefined && Math.abs(restCat - userCat) <= 1;
          });
        };

        const matchDiet = (r) => {
          if (!selections.diet || selections.diet === 'nodiet') return true;
          if (!r.diet || !Array.isArray(r.diet)) return false;
          
          if (selections.diet === 'vegetarian') {
            return r.diet.includes('vegetarian');
          } else if (selections.diet === 'diet') {
            return r.diet.includes('diet') || r.diet.includes('light');
          } else if (selections.diet === 'light') {
            return r.diet.includes('light') || r.diet.includes('diet');
          }
          
          return false;
        };

        // 🎯 가격 파싱 헬퍼 (매칭 + 근접도 점수 공용)
        const parsePriceRange = (r) => {
          const priceStr = r.price || r.priceNote || '';
          
          // 가격 범위: "10,000~15,000원"
          const rangeMatch = priceStr.match(/(\d{1,3}(?:,?\d{3})*)\s*[~-]\s*(\d{1,3}(?:,?\d{3})*)/);
          if (rangeMatch) {
            return {
              min: parseInt(rangeMatch[1].replace(/,/g, '')),
              max: parseInt(rangeMatch[2].replace(/,/g, ''))
            };
          }
          
          // "1.5~2만원" (만원 단위 범위)
          const manRangeMatch = priceStr.match(/(\d+\.?\d*)\s*[~-]\s*(\d+\.?\d*)\s*만원/);
          if (manRangeMatch) {
            return {
              min: Math.round(parseFloat(manRangeMatch[1]) * 10000),
              max: Math.round(parseFloat(manRangeMatch[2]) * 10000)
            };
          }
          
          // "1.5만원"
          const manwonMatch = priceStr.match(/(\d+\.?\d*)\s*만원/);
          if (manwonMatch) {
            const price = Math.round(parseFloat(manwonMatch[1]) * 10000);
            return { min: price, max: price };
          }
          
          // "15,000원"
          const singleMatch = priceStr.match(/(\d{1,3}(?:,?\d{3})*)\s*원/);
          if (singleMatch) {
            const price = parseInt(singleMatch[1].replace(/,/g, ''));
            return { min: price, max: price };
          }
          
          return null;
        };

        const matchBudget = (r) => {
          const parsed = parsePriceRange(r);
          if (!parsed) return false;
          
          const { min, max } = parsed;
          
          // 예산이 최소값 이상이면 매칭 (최소값 메뉴는 먹을 수 있음)
          if (budgetNum >= min) return true;
          
          // 예산이 최소값보다 약간 부족해도 허용 (2,000원 또는 예산의 15% 중 큰 값)
          const tolerance = Math.max(2000, budgetNum * 0.15);
          if (min - budgetNum <= tolerance) return true;
          
          return false;
        };

        // 📋 모든 식당에 조건 매칭 개수 계산
        const withMatches = restaurantDB.map(r => {
          const matches = [
            matchWeather(r),
            matchMood(r),
            matchPeople(r),
            matchDiet(r),
            matchBudget(r)
          ];
          
          const matchCount = matches.filter(Boolean).length;
          const isRecent = recentSet.has(r.name);
          const rating = parseFloat(r.rating) || 0;

          // 🎯 Phase B: 종합 점수 계산
          let totalScore = matchCount * 20; // 기본 점수 (조건 1개당 20점)
          
          // 평점 점수 (최대 10점)
          totalScore += rating * 2;
          
          // 블루리본 보너스 (10점)
          if (r.ribbon) {
            totalScore += 10;
          }
          
          // 💰 예산 근접도 보너스 (최대 8점) - 예산과의 거리 기반 계단식 점수
          const parsed = parsePriceRange(r);
          if (parsed && matches[4]) { // 예산 매칭된 경우만
            const { min } = parsed;
            const comparablePrice = min; // 최소가(실제 이용가능 가격) 기준
            const budgetDiff = Math.abs(comparablePrice - budgetNum);
            
            if (comparablePrice <= budgetNum) {
              // 예산 이하: 차이가 적을수록 고점수
              if (budgetDiff < 2000) totalScore += 8;      // 거의 딱 맞음
              else if (budgetDiff < 5000) totalScore += 5;  // 적당히 여유
              else totalScore += 2;                         // 지나치게 저렴
            } else {
              // 예산 초과: 초과분에 비례해 감점
              if (budgetDiff < 2000) totalScore += 3;       // 약간 초과, 허용
              else if (budgetDiff < 5000) totalScore -= 3;  // 부담스러운 초과
              else totalScore -= Math.min(Math.round(budgetDiff / 1000), 10); // 최대 -10점
            }
          }
          
          // 🥗 다이어트/채식-칼로리 시너지 보너스 (최대 6점)
          if (selections.diet === 'diet' || selections.diet === 'light' || selections.diet === 'vegetarian') {
            if (r.calorie && r.calorie.label === '저칼로리') {
              totalScore += 6; // 다이어트/채식 선택 + 저칼로리 식당 = 최적
            } else if (r.calorie && r.calorie.label === '보통칼로리') {
              totalScore += 2;
            } else if (r.calorie && r.calorie.label === '고칼로리') {
              totalScore -= 3; // 다이어트인데 고칼로리면 감점
            }
          }
          
          // ⏰ 시간/요일 컨텍스트 점수
          totalScore += getTimeContextScore(r, selections);
          
          // 👍👎 사용자 피드백 점수
          totalScore += getFeedbackScore(r.name);
          
          // 📊 개인화 점수 (방문 이력 기반)
          totalScore += getPersonalizationScore(r);

          // 📝 추천 이유 동적 생성
          const reasons = [];
          
          if (matches[0]) { // weather
            if (selections.weather === 'hot') reasons.push('🌡️ 더운 날 딱 맞는 메뉴');
            else if (selections.weather === 'cold') reasons.push('❄️ 추운 날 몸 녹이기 좋은 메뉴');
            else if (selections.weather === 'rainy') reasons.push('☔ 비 오는 날 생각나는 메뉴');
            else if (selections.weather === 'mild') reasons.push('🌤️ 선선한 날씨에 제격');
          }
          
          if (matches[1]) { // mood
            if (selections.mood === 'hangover') reasons.push('💊 해장에 최고');
            else if (selections.mood === 'executive') reasons.push('🤵 격식있는 자리에 적합');
            else if (selections.mood === 'team') reasons.push('👥 팀 점심으로 추천');
            else if (selections.mood === 'hearty') reasons.push('🍖 든든하게 배부르게');
            else if (selections.mood === 'exciting') reasons.push('🎉 특별한 날 분위기 좋음');
            else if (selections.mood === 'sad') reasons.push('😌 기분 전환에 좋은 맛');
            else if (selections.mood === 'safe') reasons.push('😊 무난하고 안전한 선택');
          }
          
          if (matches[2]) { // people
            if (peopleCategory === 'solo') reasons.push('🧍 혼밥하기 편한 곳');
            else if (peopleCategory === 'small') reasons.push('👫 소수 인원 최적');
            else if (peopleCategory === 'medium') reasons.push('👨‍👨‍👦‍👦 중간 규모 모임에 좋음');
            else if (peopleCategory === 'large') reasons.push('👨‍👩‍👧‍👦 단체 손님 환영');
          }
          
          if (matches[3] && selections.diet !== 'nodiet') { // diet
            if (selections.diet === 'vegetarian') reasons.push('🥗 채식 메뉴 가능');
            else if (selections.diet === 'diet') reasons.push('🏃 다이어트 추천');
            else if (selections.diet === 'light') reasons.push('🍃 가볍게 먹기 좋음');
          }
          
          if (matches[4]) { // budget
            if (budgetNum <= 10000) {
              reasons.push(`💰 ${(budgetNum/1000).toFixed(0)}천원대 가성비 최고`);
            } else if (budgetNum <= 13000) {
              reasons.push('💵 만원 초반 합리적 가격');
            } else if (budgetNum <= 17000) {
              reasons.push(`💳 ${(budgetNum/1000).toFixed(0)}천원대 적정 가격`);
            } else if (budgetNum <= 22000) {
              reasons.push('💎 2만원 이하 알뜰 선택');
            } else {
              reasons.push('👑 특별한 날 프리미엄 맛집');
            }
          }
          
          // 특별한 특징
          if (r.ribbon) reasons.push('🏅 블루리본 인증');
          if (rating >= 4.7) reasons.push(`⭐ 평점 ${r.rating}★`);
          
          // 거리 정보
          if (r.coords) {
            const dist = getDistance(KT_EAST_COORDS.lat, KT_EAST_COORDS.lng, r.coords.lat, r.coords.lng);
            if (dist < 150) reasons.push('🚶 도보 2분 이내');
            else if (dist < 250) reasons.push('🚶 도보 5분 이내');
          }
          
          // 대기/칼로리 정보
          if (!r.waiting) reasons.push('✅ 대기 없이 바로');
          if ((selections.diet === 'diet' || selections.diet === 'light' || selections.diet === 'vegetarian') && r.calorie && r.calorie.label === '저칼로리') {
            reasons.push('🥬 저칼로리 인증');
          }
          
          // 계절 추천
          const curMonth = new Date().getMonth() + 1;
          const seasonText = (r.category || '') + ' ' + (r.menus || []).join(' ');
          if (curMonth >= 3 && curMonth <= 5 && /샐러드|회|비빔|파스타/.test(seasonText)) {
            reasons.push('🌸 봄 시즌 추천');
          } else if (curMonth >= 6 && curMonth <= 8 && /냉면|콩국수|물회/.test(seasonText)) {
            reasons.push('🌊 여름 시즌 추천');
          } else if (curMonth >= 9 && curMonth <= 11 && /갈비|구이|전골|보쌈/.test(seasonText)) {
            reasons.push('🍂 가을 시즌 추천');
          } else if ((curMonth >= 12 || curMonth <= 2) && /찌개|탕|전골|라멘|국밥/.test(seasonText)) {
            reasons.push('❄️ 겨울 시즌 추천');
          }

          const recommendReason = reasons.length > 0 
            ? reasons.slice(0, 3).join(' · ') 
            : r.reason || '추천 맛집';

          return { 
            ...r, 
            matchCount, 
            isRecent, 
            rating,
            dietMatched: matches[3], // 식단 매칭 여부 (필수 필터용)
            score: totalScore, // 🎯 Phase B: 종합 점수 추가
            recommendReason 
          };
        });

        // 🎯 3단계 필터링
        // 식단 조건 설정 시(채식/다이어트/가볍게), diet 미매칭 식당은 반드시 제외
        const hasDietFilter = selections.diet && selections.diet !== 'nodiet';
        const candidates = hasDietFilter
          ? withMatches.filter(r => r.dietMatched)
          : withMatches;
        
        // 1단계: 모든 조건 만족 (5개)
        let tier1 = candidates.filter(r => r.matchCount === 5);
        // 2단계: 3개 이상 만족
        let tier2 = candidates.filter(r => r.matchCount >= 3 && r.matchCount < 5);
        // 3단계: 2개 이상 만족
        let tier3 = candidates.filter(r => r.matchCount >= 2 && r.matchCount < 3);

        // 🎯 Phase B: 글로벌 점수 기반 정렬 (티어 간 경계 제거)
        // Tier2 고점수가 Tier1 저점수보다 우선되도록 글로벌 정렬
        let allCandidates = [...tier1, ...tier2, ...tier3];
        
        // 🎲 랜덤 가중치: 동점대 식당 순서를 매번 다르게 (±8점 범위 셔플)
        allCandidates.forEach(r => { r._jitter = (Math.random() - 0.5) * 16; });
        
        allCandidates.sort((a, b) => {
          // 매칭 수 가중치 + 점수 통합 정렬
          const tierBonusA = a.matchCount >= 5 ? 15 : a.matchCount >= 3 ? 5 : 0;
          const tierBonusB = b.matchCount >= 5 ? 15 : b.matchCount >= 3 ? 5 : 0;
          const scoreA = a.score + tierBonusA + a._jitter;
          const scoreB = b.score + tierBonusB + b._jitter;
          if (a.isRecent !== b.isRecent) return a.isRecent ? 1 : -1;
          return scoreB - scoreA;
        });

        // 🚫 최근 본 식당 제외 (다른 맛집 추천을 위해)
        const beforeFilterCount = allCandidates.length;
        const filteredCandidates = allCandidates.filter(r => !r.isRecent);
        
        if (beforeFilterCount !== filteredCandidates.length) {
          // 최근 본 식당 제외됨
        }
        
        // 🔄 후보가 부족하면 제외 목록 초기화 후 재시도
        if (filteredCandidates.length < 3 && recentSeen.current.length > 0) {
          recentSeen.current = [];
          saveRecentSeen([]);
          allCandidates = [...allCandidates]; // 원본 유지 (제외 없이)
          // 사용자에게 순환 안내
          var recycleNotice = "🔄 추천 가능한 식당을 모두 보여드렸어요! 처음부터 다시 추천합니다.";
        } else {
          allCandidates = filteredCandidates;
          var recycleNotice = null;
        }

        // 🎯 Phase B: MMR 다양성 알고리즘 적용
        const selectedRestaurants = [];
        const remainingCandidates = [...allCandidates];

        // 첫 번째는 점수가 가장 높은 것 선택
        if (remainingCandidates.length > 0) {
          selectedRestaurants.push(remainingCandidates[0]);
          remainingCandidates.splice(0, 1);
        }

        // 나머지 9개는 MMR로 선택
        while (selectedRestaurants.length < 10 && remainingCandidates.length > 0) {
          let bestIdx = 0;
          let bestMMRScore = -Infinity;
          
          for (let i = 0; i < remainingCandidates.length; i++) {
            const candidate = remainingCandidates[i];
            const mmrScore = calculateMMRScore(
              candidate, 
              selectedRestaurants, 
              candidate.score
            );
            
            if (mmrScore > bestMMRScore) {
              bestMMRScore = mmrScore;
              bestIdx = i;
            }
          }
          
          selectedRestaurants.push(remainingCandidates[bestIdx]);
          remainingCandidates.splice(bestIdx, 1);
        }

        // 브랜드 중복 최종 필터링
        const final = [];
        const seenBrands = new Set();

        for (const restaurant of selectedRestaurants) {
          let brand = restaurant.name;
          const suffixes = ['광화문점', '디타워점', 'SFC점', '종각점', '본점', '지점'];
          suffixes.forEach(suffix => {
            if (brand.includes(suffix)) {
              brand = brand.replace(suffix, '').trim();
            }
          });
          brand = brand.replace(/\s*\([^)]*\)\s*/g, '').trim();

          if (!seenBrands.has(brand)) {
            final.push(restaurant);
            seenBrands.add(brand);
          }
          
          if (final.length >= 10) break;
        }

        // 부족하면 채우기
        if (final.length < 10) {
          for (const r of allCandidates) {
            if (!final.find(f => f.name === r.name)) {
              final.push(r);
              if (final.length >= 10) break;
            }
          }
        }

        if (final.length === 0) {
          setResults({ 
            list: [], 
            relaxedMsg: "😢 조건에 맞는 식당이 없어요. 다른 조건을 선택해보세요!" 
          });
        } else {
          // TOP 3 + 4~10위 즉시 표시
          const finalList = final.slice(0, 10);

          // 점수를 100점 만점으로 정규화
          const maxScore = Math.max(...finalList.map(r => r.score || 0), 1);
          const normalizedList = finalList.map(r => ({
            ...r,
            score100: Math.min(100, Math.round(((r.score || 0) / maxScore) * 100))
          }));

          setShowAll(false);
          setFeedbackGiven({});

          setResults({ 
            list: normalizedList, 
            relaxedMsg: recycleNotice || (final.length < 5 ? "💡 조건에 맞는 식당이 적어요. 다른 조건을 선택해보세요!" : null)
          });

          // 4~10위는 1초 후 공개
          setTimeout(() => setShowAll(true), 1000);

          // 최근 본 식당 기록 (DB 소진 시까지 중복 방지)
          const newNames = final.slice(0, 10).map(r => r.name);
          recentSeen.current = [...newNames, ...recentSeen.current].slice(0, restaurantDB.length);
          saveRecentSeen(recentSeen.current);
        }

      } catch(e) {
        setResults({ 
          list: [], 
          relaxedMsg: "⚠️ 추천 중 오류가 발생했어요. 조건을 변경하거나 다시 시도해주세요." 
        });
      }
      setStep("results");
      setTimeout(() => {
        resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }, 900);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [step, selections]);

  const handleSelect = (group, value) => {
    setSelections(prev => ({ ...prev, [group]: value }));
    setShowAlert(false);
  };

  const handleRecommend = () => {
    const requiredFields = ['weather', 'mood', 'diet', 'people', 'budget'];
    const allSelected = requiredFields.every(field => {
      const value = selections[field];
      return value !== null && value !== undefined && value !== '';
    });
    if (!allSelected) { 
      setShowAlert(true); 
      return; 
    }
    setStep("loading");
  };

  const handleRecommendAgain = () => {
    // 현재 추천 결과를 recentSeen에 추가하여 다음 추천에서 제외
    if (results.list && results.list.length > 0) {
      const currentNames = results.list.map(r => r.name);
      recentSeen.current = [...currentNames, ...recentSeen.current].slice(0, restaurantDB.length);
      saveRecentSeen(recentSeen.current);
    }
    // 다시 추천 실행
    setStep("loading");
  };

  const handleReset = () => {
    setSelections({ weather: 'hot', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000 });
    setResults({ list: [], relaxedMsg: null });
    recentSeen.current = []; // 제외 목록 초기화
    saveRecentSeen([]);
    shuffleQuickPresets(); // 빠른 추천 버튼도 다시 섞기
    setStep("form");
    setTimeout(() => {
      pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div ref={pageTopRef} style={{ fontFamily: "'Noto Sans KR', sans-serif", background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)", minHeight: "100vh", color: "#0a0a0a" }}>
      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontWeight: 900, fontSize: 24, color: "#E3001B", letterSpacing: 2 }}>KT</span>
          <div style={{ width: 2, height: 24, background: "#E3001B" }} />
          <span style={{ color: "#e0e0e0", fontSize: 14, fontWeight: 400 }}>광화문 점심 추천기</span>
        </div>
        <span style={{ color: "#999", fontSize: 12, fontWeight: 300 }}>{time}</span>
      </div>

      {/* HERO */}
      <div style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 50%, #4338CA 100%)", backgroundSize: "200% 200%", animation: "gradientShift 15s ease infinite", padding: "40px 32px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, background: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)", pointerEvents: "none", animation: "float 6s ease-in-out infinite" }} />
        <div style={{ fontSize: "clamp(32px, 6vw, 48px)", fontWeight: 900, color: "white", letterSpacing: -0.5, lineHeight: 1.2, marginBottom: 8, textShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>
          오늘 뭐 먹지? 🍽️
        </div>
        <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, fontWeight: 400, letterSpacing: 0.3, marginBottom: 20 }}>
          KT 광화문 주변 {restaurantDB.length}개 맛집 · AI 맞춤 추천
        </div>
        
        {/* ⚡ 빠른 추천 버튼 */}
        <button
          className="quick-recommend-btn"
          onClick={handleQuickRecommend}
          style={{
            background: "white",
            color: "#6366F1",
            border: "none",
            borderRadius: 50,
            padding: "14px 40px",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            letterSpacing: 0.3,
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.03)";
            e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 0, 0, 0.3)";
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
          }}
        >
          ⚡ 바로 추천받기
        </button>
        <div style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 12, fontWeight: 400, marginTop: 10, letterSpacing: 0.3 }}>
          현재 날씨·시간 기반 자동 추천
        </div>
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* FORM */}
        {step === "form" && (
          <div>
            {/* 메인 폼 카드 */}
            <div style={{ background: "white", borderRadius: 24, padding: "28px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)", marginBottom: 16 }}>

              {/* 날씨 섹션 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  ☀️ 오늘 날씨가 어때요?
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {OPTIONS.weather.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect('weather', opt.value)}
                      aria-pressed={selections.weather === opt.value}
                      aria-label={`날씨: ${opt.label}`}
                      style={{
                        background: selections.weather === opt.value ? "#6366F1" : "#f8fafc",
                        color: selections.weather === opt.value ? "white" : "#475569",
                        border: selections.weather === opt.value ? "2px solid #6366F1" : "2px solid #e2e8f0",
                        borderRadius: 50,
                        padding: "8px 18px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transform: selections.weather === opt.value ? "scale(1.03)" : "scale(1)",
                        boxShadow: selections.weather === opt.value ? "0 2px 8px rgba(99,102,241,0.25)" : "none",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 기분 섹션 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  😊 오늘 기분은요?
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {OPTIONS.mood.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect('mood', opt.value)}
                      aria-pressed={selections.mood === opt.value}
                      aria-label={`기분: ${opt.label}`}
                      style={{
                        background: selections.mood === opt.value ? "#6366F1" : "#f8fafc",
                        color: selections.mood === opt.value ? "white" : "#475569",
                        border: selections.mood === opt.value ? "2px solid #6366F1" : "2px solid #e2e8f0",
                        borderRadius: 50,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transform: selections.mood === opt.value ? "scale(1.03)" : "scale(1)",
                        boxShadow: selections.mood === opt.value ? "0 2px 8px rgba(99,102,241,0.25)" : "none",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 식단 섹션 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                  🥗 식단 관리 중이에요?
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {OPTIONS.diet.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect('diet', opt.value)}
                      aria-pressed={selections.diet === opt.value}
                      aria-label={`식단: ${opt.label}`}
                      style={{
                        background: selections.diet === opt.value ? "#6366F1" : "#f8fafc",
                        color: selections.diet === opt.value ? "white" : "#475569",
                        border: selections.diet === opt.value ? "2px solid #6366F1" : "2px solid #e2e8f0",
                        borderRadius: 50,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transform: selections.diet === opt.value ? "scale(1.03)" : "scale(1)",
                        boxShadow: selections.diet === opt.value ? "0 2px 8px rgba(99,102,241,0.25)" : "none",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
                {/* 부족 카테고리 사전 안내 */}
                {selections.diet && selections.diet !== 'nodiet' && (() => {
                  const dietPoolCount = selections.diet === 'vegetarian'
                    ? restaurantDB.filter(r => r.diet && r.diet.includes('vegetarian')).length
                    : selections.diet === 'diet' || selections.diet === 'light'
                      ? restaurantDB.filter(r => r.diet && (r.diet.includes('diet') || r.diet.includes('light'))).length
                      : 0;
                  if (dietPoolCount && dietPoolCount <= 15) {
                    return (
                      <div style={{ marginTop: 8, padding: "8px 12px", background: "#FFFBEB", borderRadius: 10, border: "1px solid #FDE68A", fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                        💡 추천 가능한 식당이 <b>{dietPoolCount}곳</b>으로 제한적이에요
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* 인원 슬라이더 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>👥 인원 수</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#6366F1" }}>{(selections.people || 2) >= 8 ? '8명+' : `${selections.people || 2}명`}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={selections.people || 2}
                  onChange={(e) => handleSelect('people', parseInt(e.target.value))}
                  aria-label="인원 수 선택"
                  aria-valuemin={1}
                  aria-valuemax={8}
                  aria-valuenow={selections.people || 2}
                  aria-valuetext={`${(selections.people || 2) >= 8 ? '8명 이상' : `${selections.people || 2}명`}`}
                  style={{ width: "100%", accentColor: "#6366F1", cursor: "pointer", height: 6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  <span>혼밥</span>
                  <span>8명+</span>
                </div>
              </div>

              {/* 예산 슬라이더 */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>💰 1인 예산</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#6366F1" }}>{(selections.budget || 15000) >= 30000 ? '30,000원+' : `${(selections.budget || 15000).toLocaleString()}원`}</span>
                </div>
                <input
                  type="range"
                  min="8000"
                  max="30000"
                  step="1000"
                  value={selections.budget || 15000}
                  onChange={(e) => handleSelect('budget', parseInt(e.target.value))}
                  aria-label="1인 예산 선택"
                  aria-valuemin={8000}
                  aria-valuemax={30000}
                  aria-valuenow={selections.budget || 15000}
                  aria-valuetext={`${(selections.budget || 15000) >= 30000 ? '3만원 이상' : `${(selections.budget || 15000).toLocaleString()}원`}`}
                  style={{ width: "100%", accentColor: "#6366F1", cursor: "pointer", height: 6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  <span>8,000원</span>
                  <span>30,000원+</span>
                </div>
              </div>

              {/* 추천받기 버튼 */}
              <button
                className="btn-primary"
                onClick={handleRecommend}
                style={{
                  width: "100%",
                  background: "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: 16,
                  padding: "16px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
                  letterSpacing: 0.3,
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.4)";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(99, 102, 241, 0.3)";
                }}
              >
                🍽️ AI 점심 추천받기
              </button>
              {showAlert && (
                <div style={{ marginTop: 12, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "#3730A3", textAlign: "center" }}>
                  ⚠️ 모든 항목을 선택해 주세요!
                </div>
              )}
            </div>

            {/* 빠른 추천 프리셋 */}
            <div style={{ background: "white", borderRadius: 24, padding: "20px 24px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#0f172a", display: "flex", alignItems: "center", gap: 6 }}>
                ⚡ 빠른 추천
                <span style={{ fontSize: 11, fontWeight: 500, color: "#64748b" }}>탭 한번으로 조건 자동 설정</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {quickPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelections(preset.settings);
                    }}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 50,
                      padding: "8px 14px",
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      whiteSpace: "nowrap",
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = "#6366F1"; e.currentTarget.style.color = "white"; e.currentTarget.style.borderColor = "#6366F1"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#475569"; e.currentTarget.style.borderColor = "#e2e8f0"; }}
                  >
                    {preset.emoji} {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div role="status" aria-label="추천 결과 로딩 중" style={{ background: "white", borderRadius: 24, padding: "80px 40px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 28 }}>
              {[0,1,2].map(i => (
                <div key={i} className="loading-dot" style={{
                  width: 14, height: 14,
                  background: "#6366F1",
                  borderRadius: "50%",
                  opacity: loadingDot === i ? 1 : 0.2,
                  transform: loadingDot === i ? "scale(1.3)" : "scale(0.9)",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }} />
              ))}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
              광화문 맛집 데이터를 분석하고 있어요...
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              블루리본 · 네이버 평점 · 카카오맵 참고 중
            </div>
          </div>
        )}

        {/* RESULTS */}
        {step === "results" && (
          <div ref={resultsTopRef} aria-live="polite" aria-label="추천 결과">
            {/* 결과 헤더 */}
            <div style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", borderRadius: 20, padding: "20px 24px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, color: "rgba(255,255,255,0.8)" }}>
                  ✨ AI 추천 결과
                </div>
                <button
                  onClick={handleReset}
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: 50,
                    padding: "5px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    color: "rgba(255,255,255,0.9)",
                    letterSpacing: 0.3,
                    whiteSpace: "nowrap",
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.15)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  🏠 처음으로
                </button>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "white", lineHeight: 1.4 }}>
                {LABELS.mood[selections.mood]}인 오늘, 맛집 TOP 10
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                {Object.entries(selections).filter(([k,v]) => k !== 'cuisine' || v !== 'all').map(([k, v]) => {
                  let displayLabel = LABELS[k]?.[v] ?? v;
                  if (k === 'people') displayLabel = v >= 8 ? '8명+' : `${v}명`;
                  if (k === 'budget') displayLabel = v >= 30000 ? '30,000원+' : `${v.toLocaleString()}원`;
                  return (
                    <span key={k} style={{ background: "rgba(255,255,255,0.2)", color: "white", fontSize: 11, padding: "3px 10px", borderRadius: 50, fontWeight: 500 }}>
                      {displayLabel}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 조건 완화 안내 배너 */}
            {results.relaxedMsg && (
              <div style={{ background: "rgb(255, 251, 240)", border: "1px solid rgb(255, 224, 130)", borderRadius: 16, padding: "12px 18px", marginBottom: 16, fontSize: 13, color: "rgb(122, 92, 0)", display: "flex", alignItems: "center", gap: 8 }}>
                {results.relaxedMsg}
              </div>
            )}

            {/* 결과 없음 */}
            {results.list.length === 0 && (
              <div style={{ background: "white", border: "2px dashed rgb(226, 232, 240)", borderRadius: 24, padding: 40, textAlign: "center", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>😅</div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10, color: "rgb(15, 23, 42)" }}>조건에 맞는 식당이 없어요</div>
                <div style={{ fontSize: 14, color: "rgb(100, 116, 139)", lineHeight: 1.7 }}>
                  선택하신 조건이 현재 DB의 식당과 맞지 않아요.<br/>
                  식단 조건을 바꾸거나, 조건을 완화해 다시 시도해보세요!
                </div>
              </div>
            )}

            {/* 결과 부족 안내 */}
            {results.list.length > 0 && results.list.length < 5 && (
              <div style={{ background: "#FFFBEB", borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: "#92400E", border: "1px solid #FDE68A", display: "flex", alignItems: "center", gap: 6, lineHeight: 1.5 }}>
                💡 조건에 맞는 식당이 <b>{results.list.length}곳</b>만 있어요. 더 많은 결과를 원하시면 식단이나 예산 조건을 완화해보세요!
              </div>
            )}

            {/* 맛집 카드 */}
            {results.list.length > 0 && (
              <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>
                🏆 TOP 3 추천
              </div>
            )}
            {results.list.map((r, i) => {
              const isTop3 = i < 3;
              if (!isTop3 && !showAll) return null;
              const rankColors = ['#6366F1', '#F59E0B', '#14B8A6'];
              const rankColor = rankColors[i] || '#e2e8f0';
              const rankTextColor = i < 3 ? 'white' : '#64748b';

              // TOP 3: 풀 디테일 카드
              if (isTop3) return (
              <div key={r.name} className="card-hover" style={{
                background: "white",
                borderRadius: 20,
                padding: 24,
                marginBottom: i === 2 ? 24 : 12,
                boxShadow: i === 0 ? "0 4px 20px rgba(99,102,241,0.15)" : "0 2px 8px rgba(0,0,0,0.06)",
                border: `2px solid ${rankColor}`,
                position: "relative",
                transition: "all 0.2s ease",
              }}>
                {/* 순위 + 이름 + 평점 */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ 
                    minWidth: 36, height: 36, 
                    background: rankColor,
                    color: "white",
                    borderRadius: 10, 
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800,
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#0f172a" }}>
                        {r.name}
                      </h3>
                      {r.ribbon && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 50, background: "#FFF3E0", color: "#C2410C" }}>
                          🌟 블루리본
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {r.category} · ⭐ {r.rating} · {r.walk || r.priceNote}
                    </div>
                  </div>
                  {r.score100 != null && (
                    <div style={{ fontSize: 13, fontWeight: 800, color: rankColor }}>
                      {r.score100}점
                    </div>
                  )}
                </div>

                {/* 매칭 배지 (최대 3개) */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {(() => {
                    const badges = [];
                    if (r.weather && Array.isArray(r.weather) && r.weather.includes(selections.weather))
                      badges.push(<span key="w" style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#FFFDE7", color: "#B45309" }}>{OPTIONS.weather.find(o=>o.value===selections.weather)?.emoji} 날씨 딱</span>);
                    if (r.mood && Array.isArray(r.mood) && (() => {
                      const moodMapping = { 'great': ['exciting', 'executive'], 'normal': ['safe'], 'tired': ['hearty', 'hangover'], 'stressed': ['sad', 'hearty'] };
                      let mapped = [...r.mood];
                      for (let mood in moodMapping) { if (r.mood.includes(mood)) mapped = [...mapped, ...moodMapping[mood]]; }
                      if (r.people && Array.isArray(r.people) && r.people.includes('large')) mapped.push('team');
                      if (r.category && (r.category.includes('국밥') || r.category.includes('해장') || r.category.includes('탕'))) mapped.push('hangover');
                      if (r.ribbon && r.budget && Array.isArray(r.budget) && r.budget.includes('expensive')) mapped.push('executive');
                      return mapped.includes(selections.mood);
                    })())
                      badges.push(<span key="m" style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#EDE9FE", color: "#6D28D9" }}>{OPTIONS.mood.find(o=>o.value===selections.mood)?.emoji} 기분 맞춤</span>);
                    if (r.people && Array.isArray(r.people) && r.people.some(p => { const peopleMap = { 1: 'solo', 2: 'small', 3: 'small', 4: 'medium', 5: 'medium', 6: 'medium', 7: 'large', 8: 'large' }; return p === peopleMap[selections.people]; }))
                      badges.push(<span key="p" style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#E8EAF6", color: "#283593" }}>👥 인원 적합</span>);
                    if (parseFloat(r.rating) >= 4.5)
                      badges.push(<span key="r" style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#FFF3E0", color: "#C2410C" }}>🔥 인기</span>);
                    if (r.diet && Array.isArray(r.diet) && r.diet.includes("vegetarian"))
                      badges.push(<span key="v" style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#E8F5E9", color: "#2E7D32" }}>🌿 채식가능</span>);
                    if (r.diet && Array.isArray(r.diet) && r.diet.includes("diet"))
                      badges.push(<span key="d" style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#E3F2FD", color: "#1565C0" }}>💪 다이어트</span>);
                    return badges.slice(0, 3);
                  })()}
                </div>

                {/* 대표메뉴 + 가격 */}
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 10, lineHeight: 1.6 }}>
                  🍽️ {r.menus && Array.isArray(r.menus) ? r.menus.join(", ") : '-'}
                  {r.priceNote && r.walk && <span style={{ color: "#64748b" }}> · 💰 {r.priceNote}</span>}
                </div>

                {/* 추천 이유 */}
                {r.recommendReason && (
                  <div style={{ background: "#EEF2FF", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#0f172a", lineHeight: 1.6, borderLeft: `3px solid ${rankColor}`, fontWeight: 500 }}>
                    {r.recommendReason}
                  </div>
                )}

                {/* 예약/지도 링크 */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {r.reservation && Array.isArray(r.reservation) && r.reservation.map((res) => (
                    <a key={res.url} href={res.url} target="_blank" rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, background: res.color, color: "white", textDecoration: "none", fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 50, transition: "opacity 0.2s" }}
                      onMouseOver={e => e.currentTarget.style.opacity = "0.85"} onMouseOut={e => e.currentTarget.style.opacity = "1"}
                    >{res.label === "캐치테이블" ? "🪑" : "📅"} {res.label}</a>
                  ))}
                  {r.reservation && typeof r.reservation === 'boolean' && r.reservation && (
                    <span style={{ fontSize: 11, color: "#22c55e", padding: "6px 0", display: "flex", alignItems: "center", gap: 4 }}>📅 예약 가능</span>
                  )}
                  {(!r.reservation || (Array.isArray(r.reservation) && r.reservation.length === 0)) && (
                    <span style={{ fontSize: 11, color: "#64748b", padding: "6px 0", display: "flex", alignItems: "center", gap: 4 }}>✅ 예약 불필요 · 바로 방문</span>
                  )}
                  <a href={r.naver} target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f8fafc", color: "#475569", textDecoration: "none", fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 50, border: "1px solid #e2e8f0", transition: "all 0.2s" }}
                    onMouseOver={e => e.currentTarget.style.background = "#e2e8f0"} onMouseOut={e => e.currentTarget.style.background = "#f8fafc"}
                  >🗺️ 네이버 지도</a>
                </div>

                {/* 피드백 버튼 */}
                <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                  <button onClick={() => { if (feedbackGiven[r.name]) return; const ok = saveFeedback(r.name, 'like', { weather: selections.weather, mood: selections.mood, people: selections.people, diet: selections.diet, budget: selections.budget }); if (ok) { setFeedbackGiven(prev => ({...prev, [r.name]: 'like'})); setToast({ message: `👍 "${r.name}" 좋아요! 다음 추천에 반영됩니다.`, type: 'like' }); saveVisit(r.name, r.category, r.cuisine); } }}
                    aria-label={`${r.name} 좋아요`}
                    style={{ flex: 1, background: feedbackGiven[r.name] === 'like' ? "#dcfce7" : feedbackGiven[r.name] ? "#f1f5f9" : "#f0fdf4", color: feedbackGiven[r.name] === 'like' ? "#15803d" : feedbackGiven[r.name] ? "#cbd5e1" : "#16a34a", border: feedbackGiven[r.name] === 'like' ? "1.5px solid #86efac" : "1px solid #bbf7d0", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 600, cursor: feedbackGiven[r.name] ? "default" : "pointer", transition: "all 0.15s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, opacity: feedbackGiven[r.name] && feedbackGiven[r.name] !== 'like' ? 0.5 : 1 }}
                    onMouseOver={e => { if (!feedbackGiven[r.name]) e.currentTarget.style.background = "#dcfce7"; }} onMouseOut={e => { if (!feedbackGiven[r.name]) e.currentTarget.style.background = "#f0fdf4"; }}
                  >{feedbackGiven[r.name] === 'like' ? '✅ 좋아요' : '👍 좋아요'}</button>
                  <button onClick={() => { if (feedbackGiven[r.name]) return; const ok = saveFeedback(r.name, 'dislike', { weather: selections.weather, mood: selections.mood, people: selections.people, diet: selections.diet, budget: selections.budget }); if (ok) { setFeedbackGiven(prev => ({...prev, [r.name]: 'dislike'})); setToast({ message: `👎 "${r.name}" 별로예요. 다음 추천에 반영됩니다.`, type: 'dislike' }); } }}
                    aria-label={`${r.name} 별로예요`}
                    style={{ flex: 1, background: feedbackGiven[r.name] === 'dislike' ? "#fee2e2" : feedbackGiven[r.name] ? "#f1f5f9" : "#f8fafc", color: feedbackGiven[r.name] === 'dislike' ? "#dc2626" : feedbackGiven[r.name] ? "#cbd5e1" : "#64748b", border: feedbackGiven[r.name] === 'dislike' ? "1.5px solid #fca5a5" : "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 600, cursor: feedbackGiven[r.name] ? "default" : "pointer", transition: "all 0.15s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 4, opacity: feedbackGiven[r.name] && feedbackGiven[r.name] !== 'dislike' ? 0.5 : 1 }}
                    onMouseOver={e => { if (!feedbackGiven[r.name]) e.currentTarget.style.background = "#f1f5f9"; }} onMouseOut={e => { if (!feedbackGiven[r.name]) e.currentTarget.style.background = "#f8fafc"; }}
                  >{feedbackGiven[r.name] === 'dislike' ? '✅ 별로예요' : '👎 별로예요'}</button>
                </div>
              </div>
              );

              // 4위~10위: 클릭 시 펼쳐지는 카드
              const isExpanded = expandedCard === r.name;
              return (
              <div key={r.name} style={{ animation: 'fadeIn 0.3s ease', animationDelay: `${(i - 3) * 0.08}s`, animationFillMode: 'both' }}>
                {i === 3 && (
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 8, marginTop: 4, letterSpacing: 0.5 }}>
                    📋 그 외 추천
                  </div>
                )}
                <div className="card-hover" style={{
                  background: "white",
                  borderRadius: isExpanded ? 16 : 14,
                  padding: isExpanded ? "18px" : "14px 18px",
                  marginBottom: 8,
                  boxShadow: isExpanded ? "0 2px 8px rgba(0,0,0,0.06)" : "0 1px 3px rgba(0,0,0,0.04)",
                  border: isExpanded ? "1.5px solid #e2e8f0" : "1px solid #f1f5f9",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
                onClick={() => setExpandedCard(isExpanded ? null : r.name)}
                >
                  {/* 컴팩트 헤더 (항상 보임) */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ minWidth: 28, height: 28, background: "#f1f5f9", color: "#64748b", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                        {r.ribbon && <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 50, background: "#FFF3E0", color: "#C2410C", fontWeight: 700 }}>🌟</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.category} · ⭐ {r.rating} · {r.priceNote || r.price}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#6366F1" }}>{r.score100}점</span>
                      {r.weather && Array.isArray(r.weather) && r.weather.includes(selections.weather) && (
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 50, background: "#FFFDE7", color: "#B45309" }}>🌤️</span>
                      )}
                      {r.mood && Array.isArray(r.mood) && r.mood.includes(selections.mood) && (
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 50, background: "#EDE9FE", color: "#6D28D9" }}>😊</span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                  </div>

                  {/* 펼쳐진 상세 정보 */}
                  {isExpanded && (
                    <div style={{ marginTop: 12, borderTop: "1px solid #f1f5f9", paddingTop: 12, animation: "fadeIn 0.2s ease" }}>
                      {/* 매칭 배지 */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                        {r.weather && Array.isArray(r.weather) && r.weather.includes(selections.weather) && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#FFFDE7", color: "#B45309" }}>
                            {OPTIONS.weather.find(o=>o.value===selections.weather)?.emoji} 날씨 딱
                          </span>
                        )}
                        {r.people && Array.isArray(r.people) && r.people.some(p => {
                          const peopleMap = { 1: 'solo', 2: 'small', 3: 'small', 4: 'medium', 5: 'medium', 6: 'medium', 7: 'large', 8: 'large' };
                          return p === peopleMap[selections.people];
                        }) && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#E8EAF6", color: "#283593" }}>👥 인원 적합</span>
                        )}
                        {parseFloat(r.rating) >= 4.5 && (
                          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#FFF3E0", color: "#C2410C" }}>🔥 인기</span>
                        )}
                      </div>

                      {/* 대표메뉴 + 가격 */}
                      <div style={{ fontSize: 13, color: "#475569", marginBottom: 10, lineHeight: 1.6 }}>
                        🍽️ {r.menus && Array.isArray(r.menus) ? r.menus.join(", ") : '-'}
                        {r.priceNote && r.walk && <span style={{ color: "#64748b" }}> · 💰 {r.priceNote}</span>}
                      </div>

                      {/* 추천 이유 */}
                      {r.recommendReason && (
                        <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: "#0f172a", lineHeight: 1.6, borderLeft: "3px solid #e2e8f0", fontWeight: 500 }}>
                          {r.recommendReason}
                        </div>
                      )}

                      {/* 예약/지도 링크 */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {r.reservation && Array.isArray(r.reservation) && r.reservation.map((res) => (
                          <a key={res.url} href={res.url} target="_blank" rel="noreferrer"
                            onClick={e => e.stopPropagation()}
                            style={{ display: "inline-flex", alignItems: "center", gap: 4, background: res.color, color: "white", textDecoration: "none", fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 50, transition: "opacity 0.2s" }}
                            onMouseOver={e => e.currentTarget.style.opacity = "0.85"} onMouseOut={e => e.currentTarget.style.opacity = "1"}
                          >{res.label === "캐치테이블" ? "🪑" : "📅"} {res.label}</a>
                        ))}
                        <a href={r.naver} target="_blank" rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f8fafc", color: "#475569", textDecoration: "none", fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 50, border: "1px solid #e2e8f0", transition: "all 0.2s" }}
                          onMouseOver={e => e.currentTarget.style.background = "#e2e8f0"} onMouseOut={e => e.currentTarget.style.background = "#f8fafc"}
                        >🗺️ 네이버 지도</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              );
            })}

            {/* 나머지 로딩 중 표시 */}
            {!showAll && results.list.length > 3 && (
              <div style={{ textAlign: "center", padding: "16px 0", color: "#64748b", fontSize: 13, fontWeight: 500 }}>
                <span style={{ display: "inline-block", animation: "pulse 1.5s ease-in-out infinite" }}>✨ 나머지 추천도 곧 보여드릴게요...</span>
              </div>
            )}

            {/* 다시 추천받기 & 처음으로 버튼 */}
            <div style={{ textAlign: "center", marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <button
                className="btn-primary"
                onClick={handleRecommendAgain}
                style={{ 
                  background: "linear-gradient(135deg, #6366F1 0%, #818CF8 100%)", 
                  border: "none", 
                  borderRadius: 16, 
                  padding: "14px 40px", 
                  fontSize: 15, 
                  fontWeight: 700, 
                  cursor: "pointer", 
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", 
                  color: "white",
                  boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
                  letterSpacing: 0.3,
                  width: "100%",
                  maxWidth: 360,
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.4)";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(99, 102, 241, 0.3)";
                }}
              >
                🔄 다른 맛집 추천받기
              </button>
              <button
                onClick={handleReset}
                style={{ 
                  background: "none", 
                  border: "none", 
                  padding: "8px 16px", 
                  fontSize: 13, 
                  fontWeight: 500, 
                  cursor: "pointer", 
                  transition: "all 0.2s ease", 
                  color: "rgb(100, 116, 139)",
                  letterSpacing: 0.3,
                }}
                onMouseOver={e => {
                  e.currentTarget.style.color = "#6366F1";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.color = "rgb(100, 116, 139)";
                }}
              >
                🏠 처음부터 다시 선택하기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ background: "#1a1a2e", padding: "28px 20px", textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
        <div style={{ marginBottom: 6, fontWeight: 500, fontSize: 13, color: "rgba(255,255,255,0.9)" }}>
          📍 KT 광화문 West·East 빌딩 반경 700m 실제 맛집
        </div>
        <div>
          네이버 플레이스 평점 기반 · 블루리본 가이드 참고
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          background: toast.type === 'like' ? "#15803d" : "#475569",
          color: "white",
          padding: "12px 24px",
          borderRadius: 50,
          fontSize: 14,
          fontWeight: 600,
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          zIndex: 9999,
          animation: "fadeInUp 0.3s ease",
          maxWidth: "90vw",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Noto Sans KR', sans-serif; -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  );
}