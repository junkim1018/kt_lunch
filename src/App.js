import { useState, useEffect, useRef } from "react";
import { restaurantDB } from "./data/restaurantData";
import { OPTIONS, LABELS, SECTION_TITLES, BUDGET_COMPAT, QUICK_PRESETS } from "./data/constants";
import { AzureOpenAI } from "openai";

// Azure OpenAI 클라이언트 초기화
let openai = null;
try {
  const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
  const endpoint = process.env.REACT_APP_AZURE_OPENAI_ENDPOINT;
  const apiVersion = process.env.REACT_APP_AZURE_OPENAI_API_VERSION || "2025-04-01-preview";

  if (apiKey && endpoint) {
    openai = new AzureOpenAI({
      apiKey,
      endpoint,
      apiVersion,
      dangerouslyAllowBrowser: true // 클라이언트 사이드 사용 (프로덕션에서는 서버 사용 권장)
    });
    console.log("✅ Azure OpenAI LLM 추천 활성화");
  } else {
    console.log("ℹ️ Azure OpenAI 설정 없음 - 기본 알고리즘 사용");
  }
} catch (error) {
  console.error("Azure OpenAI 초기화 실패:", error);
  openai = null;
}

// ✅ KT East 빌딩 기준 좌표 (종로3길 33)
const KT_EAST_COORDS = { lat: 37.5703, lng: 126.9835 };

// 두 좌표 간 거리 계산 (Haversine formula, 단위: 미터)
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

// 거리를 도보 시간으로 변환 (평균 도보 속도: 80m/분, 실제 경로는 직선거리 x 1.3배)
function getWalkTime(distanceInMeters) {
  const actualDistance = distanceInMeters * 1.3; // 실제 도보 경로는 직선거리보다 30% 더 김
  const minutes = Math.round(actualDistance / 80);
  return Math.max(1, minutes); // 최소 1분
}

// ============================================================
// Phase B: 알고리즘 강화 - Helper Functions
// ============================================================

// 📅 시간/요일 기반 컨텍스트 점수 계산
function getTimeContextScore(restaurant, selections) {
  let score = 0;
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayOfWeek = now.getDay(); // 0=일요일, 1=월요일, ..., 5=금요일
  
  // 🕐 피크타임 (11:30-12:30) 점수 조정
  const isPeakTime = (hour === 11 && minute >= 30) || (hour === 12 && minute <= 30);
  // 점심시간 전후 (11:00~13:30) 거리·대기 가중
  const isLunchWindow = hour >= 11 && (hour < 13 || (hour === 13 && minute <= 30));
  
  if (isPeakTime) {
    // large 인원은 피크타임에 감점 (자리 구하기 어려움)
    const peopleNum = selections.people || 2;
    if (peopleNum > 6 && restaurant.people && Array.isArray(restaurant.people) && restaurant.people.includes('large')) {
      score -= 10;
    }
    
    // 🕐 대기 있는 식당은 피크타임에 감점
    if (restaurant.waiting) {
      score -= 8;
    }
    
    // 300m 이상 원거리는 피크타임에 감점 (시간 부족)
    if (restaurant.coords) {
      const distance = getDistance(
        37.5716, 126.9769,
        restaurant.coords.lat, 
        restaurant.coords.lng
      );
      if (distance > 400) {
        score -= 8;
      } else if (distance > 300) {
        score -= 5;
      } else if (distance < 100) {
        score += 10; // 초근거리 보너스
      } else if (distance < 200) {
        score += 5; // 가까운 거리 보너스
      }
    }
  } else if (isLunchWindow) {
    // 점심 전후 시간: 대기 식당 약한 감점
    if (restaurant.waiting) {
      score -= 4;
    }
  }
  
  // 📆 요일별 점수 조정
  if (dayOfWeek === 5) { // 금요일
    // expensive 식당 보너스 (주말 전, 특별한 점심)
    if (restaurant.budget && Array.isArray(restaurant.budget) && 
        restaurant.budget.includes('expensive')) {
      score += 10;
    }
  }
  
  if (dayOfWeek === 1) { // 월요일
    // safe mood 보너스 (주초 안정적인 선택)
    if (restaurant.mood && Array.isArray(restaurant.mood) && 
        (restaurant.mood.includes('safe') || restaurant.mood.includes('normal'))) {
      score += 8;
    }
    
    // 높은 평점 식당 보너스 (확실한 선택)
    const rating = parseFloat(restaurant.rating) || 0;
    if (rating >= 4.7) {
      score += 5;
    }
  }
  
  if (dayOfWeek === 3) { // 수요일 - 주중 중간, 새로운 도전
    // 평소 안 가본 타입의 식당에 보너스
    if (restaurant.cuisine && (restaurant.cuisine === 'japanese' || restaurant.cuisine === 'western' || restaurant.cuisine === 'chinese')) {
      score += 4;
    }
  }
  
  if (dayOfWeek === 4) { // 목요일 - 금요일 전날, 살짝 특별하게
    if (restaurant.ribbon) {
      score += 5;
    }
  }
  
  // 🌤️ 날씨별 메뉴 타입 점수 조정 (category + menus 모두 검사)
  const category = restaurant.category || '';
  const menuText = (restaurant.menus || []).join(' ');
  const searchText = category + ' ' + menuText;
  
  if (selections.weather === 'hot') {
    // 더운 날: 시원한/가벼운 메뉴 보너스
    if (/냉면|회|샐러드|초밥|카이센동|냉모밀|냉소바|물냉|비빔냉|메밀|아이스|콩국수|물회/.test(searchText)) {
      score += 12;
    }
    // 뜨거운/무거운 음식 감점
    if (/찌개|탕|국밥|전골|뚝배기|설렁탕|곰탕/.test(category)) {
      score -= 8;
    }
    // 더운 날 먼 거리 추가 감점
    if (restaurant.coords) {
      const dist = getDistance(37.5716, 126.9769, restaurant.coords.lat, restaurant.coords.lng);
      if (dist > 400) score -= 3; // 더운 날 먼 거리는 더 힘듦
    }
  }
  
  if (selections.weather === 'cold') {
    // 추운 날: 따뜻한 국물 보너스
    if (/찌개|탕|국밥|전골|국|라멘|우동|설렁탕|갈비탕|샤브|곰탕|순대국|감자탕/.test(searchText)) {
      score += 12;
    }
    // 찬 음식 감점
    if (/냉면|회|샐러드|냉모밀|물회|콩국수/.test(searchText)) {
      score -= 5;
    }
  }
  
  if (selections.weather === 'rainy') {
    // 비 오는 날: 찌개, 전, 국물 특별 보너스 (가장 높은 보너스)
    if (/찌개|전|국밥|파전|부침|수제비|칼국수|라멘|순대국/.test(searchText)) {
      score += 15;
    }
    // 비 오는 날 먼 거리 감점 (우산 들고 이동 힘듦)
    if (restaurant.coords) {
      const dist = getDistance(37.5716, 126.9769, restaurant.coords.lat, restaurant.coords.lng);
      if (dist > 300) score -= 5;
    }
  }
  
  if (selections.weather === 'mild') {
    // 선선한 날: 다양한 선택 가능, 야외 가능한 곳 보너스
    if (/파스타|브런치|샌드위치|버거|비빔/.test(searchText)) {
      score += 5;
    }
  }
  
  // 🌿 계절 보너스 (4계절)
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) {
    // 봄: 가벼운 메뉴, 샐러드, 회, 신선한 음식
    if (/샐러드|회|초밥|비빔|봄|냉면|파스타|브런치/.test(searchText)) {
      score += 5;
    }
  } else if (month >= 6 && month <= 8) {
    // 여름: 냉면, 콩국수, 회 등 시원한 메뉴
    if (/냉면|콩국수|물회|냉모밀|냉소바|샐러드|빙수|아이스/.test(searchText)) {
      score += 5;
    }
  } else if (month >= 9 && month <= 11) {
    // 가을: 보양식, 든든한 메뉴
    if (/갈비|구이|삼겹|보쌈|삼계탕|추어|전골/.test(searchText)) {
      score += 5;
    }
  } else {
    // 겨울 (12~2월): 따뜻한 국물, 전골
    if (/찌개|탕|전골|국밥|라멘|우동|설렁탕|곰탕|순대국|감자탕|샤브/.test(searchText)) {
      score += 5;
    }
  }
  
  // 🚶 거리 점수 (비피크 시간대에도 항상 적용)
  if (!isPeakTime && restaurant.coords) {
    const distance = getDistance(
      37.5716, 126.9769,
      restaurant.coords.lat, 
      restaurant.coords.lng
    );
    if (distance < 100) {
      score += 7; // 초근거리 (도보 1~2분)
    } else if (distance < 200) {
      score += 4; // 가까움 (도보 3~4분)
    } else if (distance < 350) {
      score += 2; // 적당 (도보 5~6분)
    } else if (distance > 600) {
      score -= 5; // 먼 거리 (도보 10분+)
    } else if (distance > 450) {
      score -= 2; // 다소 먼 거리 (도보 7~8분)
    }
  }
  
  return score;
}

// 🎯 MMR (Maximal Marginal Relevance) 다양성 점수 계산
function calculateMMRScore(restaurant, selectedRestaurants, relevanceScore) {
  if (selectedRestaurants.length === 0) {
    return relevanceScore; // 첫 번째는 그대로
  }
  
  // 이미 선택된 식당들과의 유사도 계산
  let maxSimilarity = 0;
  
  for (const selected of selectedRestaurants) {
    let similarity = 0;
    
    // 1. 카테고리 유사도 (+0.4)
    if (restaurant.category === selected.category) {
      similarity += 0.4;
    } else {
      // 같은 cuisine이면 +0.2
      if (restaurant.cuisine === selected.cuisine) {
        similarity += 0.2;
      }
    }
    
    // 2. 브랜드 유사도 (+0.5) - 같은 브랜드면 높은 패널티
    const getBrand = (name) => {
      const suffixes = ['광화문점', '디타워점', 'SFC점', '종각점', '본점', '지점'];
      let brand = name;
      suffixes.forEach(suffix => {
        if (brand.includes(suffix)) {
          brand = brand.replace(suffix, '').trim();
        }
      });
      return brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
    };
    
    if (getBrand(restaurant.name) === getBrand(selected.name)) {
      similarity += 0.5;
    }
    
    // 3. 가격 유사도 (+0.2)
    const getPriceRange = (r) => {
      if (!r.price) return 15000;
      const match = r.price.match(/(\d{1,3}(?:,?\d{3})*)/);
      return match ? parseInt(match[1].replace(/,/g, '')) : 15000;
    };
    
    const price1 = getPriceRange(restaurant);
    const price2 = getPriceRange(selected);
    const priceDiff = Math.abs(price1 - price2);
    
    if (priceDiff < 5000) {
      similarity += 0.2;
    } else if (priceDiff < 10000) {
      similarity += 0.1;
    }
    
    // 4. 거리 유사도 (+0.1)
    if (restaurant.coords && selected.coords) {
      const dist1 = getDistance(37.5716, 126.9769, restaurant.coords.lat, restaurant.coords.lng);
      const dist2 = getDistance(37.5716, 126.9769, selected.coords.lat, selected.coords.lng);
      const distDiff = Math.abs(dist1 - dist2);
      
      if (distDiff < 100) {
        similarity += 0.1;
      }
    }
    
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }
  
  // MMR 공식: λ * Relevance - (1-λ) * MaxSimilarity
  // λ를 후보 수에 따라 동적 조정 (후보 많으면 관련성 중시, 적으면 다양성 강화)
  const poolSize = selectedRestaurants.length;
  const lambda = Math.min(0.9, 0.5 + poolSize / 20);
  const mmrScore = lambda * relevanceScore - (1 - lambda) * maxSimilarity * 100;
  
  return mmrScore;
}

// 💾 사용자 피드백 저장/조회
function getUserFeedback() {
  try {
    const feedback = localStorage.getItem('kt-lunch-feedback');
    return feedback ? JSON.parse(feedback) : [];
  } catch (e) {
    console.error('피드백 로드 실패:', e);
    return [];
  }
}

function saveFeedback(restaurantName, feedbackType, context) {
  try {
    const allFeedback = getUserFeedback();
    const newFeedback = {
      restaurantId: restaurantName,
      feedback: feedbackType, // 'like' or 'dislike'
      timestamp: new Date().toISOString(),
      context: context // 어떤 조건으로 추천받았는지
    };
    
    // 중복 제거 (같은 식당의 최신 피드백만 유지)
    const filtered = allFeedback.filter(f => f.restaurantId !== restaurantName);
    filtered.push(newFeedback);
    
    localStorage.setItem('kt-lunch-feedback', JSON.stringify(filtered));
    console.log('✅ 피드백 저장:', newFeedback);
    return true;
  } catch (e) {
    console.error('피드백 저장 실패:', e);
    return false;
  }
}

function getFeedbackScore(restaurantName) {
  const allFeedback = getUserFeedback();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // 최근 30일 피드백만 고려
  const recentFeedback = allFeedback.filter(f => {
    const feedbackDate = new Date(f.timestamp);
    return f.restaurantId === restaurantName && feedbackDate > thirtyDaysAgo;
  });
  
  if (recentFeedback.length === 0) return 0;
  
  // 좋아요/싫어요 비율 기반 점수 (단일 클릭 노이즈 방지)
  const likes = recentFeedback.filter(f => f.feedback === 'like').length;
  const dislikes = recentFeedback.filter(f => f.feedback === 'dislike').length;
  const total = likes + dislikes;
  const ratio = likes / total;
  
  if (ratio > 0.66) return 25;      // 대체로 긍정 → +25
  else if (ratio < 0.33) return -25; // 대체로 부정 → -25
  else return 0;                     // 엇갈린 피드백 → 중립
}

// 📊 방문 이력 관리
function getVisitHistory() {
  try {
    const history = localStorage.getItem('kt-lunch-visits');
    return history ? JSON.parse(history) : [];
  } catch (e) {
    console.error('방문 이력 로드 실패:', e);
    return [];
  }
}

function saveVisit(restaurantName, category, cuisine) {
  try {
    const history = getVisitHistory();
    const newVisit = {
      restaurantName,
      category,
      cuisine,
      timestamp: new Date().toISOString()
    };
    
    history.push(newVisit);
    
    // 최근 100개만 유지
    const trimmed = history.slice(-100);
    localStorage.setItem('kt-lunch-visits', JSON.stringify(trimmed));
    console.log('✅ 방문 기록:', newVisit);
    return true;
  } catch (e) {
    console.error('방문 기록 실패:', e);
    return false;
  }
}

function getPersonalizationScore(restaurant) {
  const history = getVisitHistory();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  // 최근 30일 이력만
  const recentHistory = history.filter(v => {
    const visitDate = new Date(v.timestamp);
    return visitDate > thirtyDaysAgo;
  });
  
  if (recentHistory.length === 0) return 0;
  
  let score = 0;
  
  // 1. 자주 가는 카테고리 보너스 (+5점)
  const cuisineCounts = {};
  recentHistory.forEach(v => {
    cuisineCounts[v.cuisine] = (cuisineCounts[v.cuisine] || 0) + 1;
  });
  
  const mostVisitedCuisine = Object.keys(cuisineCounts).reduce((a, b) => 
    cuisineCounts[a] > cuisineCounts[b] ? a : b, ''
  );
  
  if (restaurant.cuisine === mostVisitedCuisine && cuisineCounts[mostVisitedCuisine] >= 3) {
    score += 5;
  }
  
  // 2. 한 번도 안 간 카테고리는 새로운 경험 보너스 (+3점)
  const visitedCuisines = new Set(recentHistory.map(v => v.cuisine));
  if (!visitedCuisines.has(restaurant.cuisine)) {
    score += 3;
  }
  
  // 3. 최근 3일 내 방문한 식당은 반복 방지 감점 (-15점)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const veryRecentVisit = recentHistory.find(v => {
    const visitDate = new Date(v.timestamp);
    return v.restaurantName === restaurant.name && visitDate > threeDaysAgo;
  });
  
  if (veryRecentVisit) {
    score -= 15;
  }
  
  return score;
}


function extractBrand(restaurantName) {
  // 점포 접미사 패턴 제거
  const suffixes = [
    '광화문점', '디타워점', 'SFC점', '서린점', '시청점', '종로점',
    '광화문', '디타워', '본점', '지점', '1호점', '2호점', '3호점'
  ];
  
  let brand = restaurantName;
  for (const suffix of suffixes) {
    if (brand.endsWith(suffix)) {
      brand = brand.slice(0, -suffix.length).trim();
      break;
    }
  }
  
  return brand;
}

function scoreRestaurant(r, sel, recentNames = []) {
  let score = 100; // 기본 점수 100점에서 시작

  // ============================================================
  // 1️⃣ CUISINE 필터 (HARD FILTER - 완전 제외)
  // ============================================================
  if (sel.cuisine && sel.cuisine !== 'all') {
    const mainCuisines = ['korean', 'chinese', 'japanese', 'western', 'asian'];
    const isOtherCategory = !mainCuisines.includes(r.cuisine);
    
    if (sel.cuisine === 'other') {
      // '기타' 선택: salad, mexican, indian만 허용
      if (!isOtherCategory) {
        return -999; // 메인 카테고리는 제외
      }
      score += 20; // 기타 카테고리 매칭 보너스
    } else {
      // 특정 카테고리 선택: 해당 카테고리만 허용
      if (r.cuisine !== sel.cuisine) {
        return -999; // 다른 카테고리는 제외
      }
      score += 20; // 카테고리 매칭 보너스
    }
  }

  // ============================================================
  // 2️⃣ 식단 필터 (HARD FILTER)
  // ============================================================
  if (sel.diet === 'vegetarian') {
    // 채식: vegetarian 태그가 있는 식당만 허용 (샐러드/포케 전문점)
    const hasDietArray = Array.isArray(r.diet);
    const hasVegetarianTag = hasDietArray && r.diet.includes('vegetarian');
    
    if (!hasVegetarianTag) {
      console.log(`🚫 [채식 제외] ${r.name} - diet: ${hasDietArray ? r.diet.join(', ') : 'undefined'}`);
      return -999;
    }
    console.log(`✅ [채식 포함] ${r.name}`);
    score += 100;  // 채식 선호 식당에 매우 높은 점수
  } else if (sel.diet === 'diet') {
    // 다이어트: diet 또는 light 포함
    if (!r.diet.includes('diet') && !r.diet.includes('light')) {
      return -999;
    }
    
    // 다이어트 모드: 특정 카테고리 완전 제외 (더 포괄적으로)
    const category = r.category || '';
    const excludeKeywords = [
      '국밥', '국', '탕', '전골', '찌개', '뚝배기',  // 국물 요리
      '덮밥', '돈부리', '돌솥밥',  // 밥류
      '튀김', '치킨', '돈까스', '카츠', '텐동', '가라아게', '크리스피', '프라이',  // 튀김류
      '분식', '떡볶이', '순대', '김밥',  // 분식류
      '라멘', '라면', '우동', '소바',  // 면류 (국물 면)
      '갈비', '구이', '석갈비', '삼겹살', '목살', '항정살',  // 고칼로리 육류 구이
      '피자', '파스타',  // 고칼로리 양식
      '햄버거', '버거',  // 패스트푸드
      '곰탕', '설렁탕', '육개장'  // 기타 국물 요리
    ];
    
    for (const keyword of excludeKeywords) {
      if (category.includes(keyword)) {
        return -999;  // 다이어트 중에는 완전 제외
      }
    }
    
    score += 20;
  } else if (sel.diet === 'light') {
    // 가벼운 식사: light, diet, seafood 포함
    if (!r.diet.includes('light') && !r.diet.includes('diet') && !r.diet.includes('seafood')) {
      score -= 10;
    } else {
      score += 15;
    }
  }
  // nodiet은 모든 식당 허용

  // ============================================================
  // 3️⃣ 날씨 매칭 (SOFT FILTER) - 높은 가중치 적용
  // ============================================================
  if (sel.weather && r.weather.includes(sel.weather)) {
    score += 50; // 25 → 50 증가 (날씨 매칭 시 확실한 보너스)
  } else if (sel.weather) {
    score -= 15; // 5 → 15 증가 (날씨 불일치 시 감점 강화)
  }

  // ============================================================
  // 4️⃣ 기분 매칭 (SOFT FILTER) - 높은 가중치 적용
  // ============================================================
  // 기분 매핑 로직
  const restaurantMoods = new Set(r.mood);
  
  // 식당 특성에 따라 추가 mood 부여
  if (r.people.includes('large') || r.people.includes('medium')) {
    restaurantMoods.add('team');
  }
  if (r.category && (r.category.includes('국밥') || r.category.includes('해장') || 
                     r.category.includes('탕') || r.category.includes('국'))) {
    restaurantMoods.add('hangover');
  }
  if (r.ribbon || (r.budget.includes('expensive') && parseFloat(r.rating) >= 4.3)) {
    restaurantMoods.add('executive');
  }

  if (sel.mood && restaurantMoods.has(sel.mood)) {
    score += 60; // 30 → 60 증가 (기분 매칭 시 최고 보너스)
  } else if (sel.mood) {
    score -= 15; // 5 → 15 증가 (기분 불일치 시 감점 강화)
  }

  // 해장 모드일 때: 피자, 파스타 메뉴 제외
  if (sel.mood === 'hangover') {
    const category = r.category || '';
    const excludeKeywords = ['피자', '파스타', '파이프', '이탈리안'];
    
    for (const keyword of excludeKeywords) {
      if (category.includes(keyword)) {
        return -999;  // 해장에는 피자/파스타 완전 제외
      }
    }
  }

  // ============================================================
  // 5️⃣ 인원 매칭 (SOFT FILTER)
  // ============================================================
  if (sel.people) {
    if (r.people.includes(sel.people)) {
      score += 20;
    } else {
      // 유연한 매칭
      if (sel.people === 'small' && (r.people.includes('solo') || r.people.includes('medium'))) {
        score += 10;
      } else if (sel.people === 'medium' && (r.people.includes('small') || r.people.includes('large'))) {
        score += 10;
      } else if (sel.people === 'large' && r.people.includes('medium')) {
        score += 5;
      } else {
        score -= 10;
      }
    }
  }

  // 혼밥 시 웨이팅 긴 식당 감점
  if (sel.people === 'solo' && r.waiting) {
    score -= 15;
  }

  // ============================================================
  // 6️⃣ 예산 매칭 (SOFT FILTER)
  // ============================================================
  if (sel.budget) {
    const budgetMatch = r.budget.some(b => {
      if (sel.budget === 'cheap') return b === 'cheap';
      if (sel.budget === 'normal') return b === 'cheap' || b === 'normal';
      if (sel.budget === 'expensive') return b === 'normal' || b === 'expensive';
      return false;
    });

    if (budgetMatch) {
      score += 15;
      // 정확히 일치하면 추가 보너스
      if (r.budget.includes(sel.budget)) {
        score += 10;
      }
    } else {
      score -= 15;
    }
  }

  // ============================================================
  // 7️⃣ 평점/블루리본 보너스
  // ============================================================
  if (r.ribbon) {
    score += 10;
  }
  if (r.rating) {
    const rating = parseFloat(r.rating);
    score += (rating - 4.0) * 5; // 4.0 기준으로 0.1당 0.5점
  }

  // ============================================================
  // 8️⃣ 최근 방문 패널티
  // ============================================================
  const recentIdx = recentNames.indexOf(r.name);
  if (recentIdx !== -1) {
    score -= (20 - recentIdx * 1); // 최근일수록 큰 감점 (10→20 강화)
  }

  // ============================================================
  // 9️⃣ 다양성을 위한 랜덤 점수
  // ============================================================
  score += Math.random() * 50; // 30 → 50 증가 (더 다양한 추천)

  return score;
}

// ============================================================
// 🤖 LLM 기반 추천 함수
// ============================================================
async function getLLMRecommendations(candidates, userConditions, recentNames) {
  if (!openai) {
    console.warn("OpenAI API key not found. Falling back to algorithm.");
    return null;
  }

  try {
    const prompt = `당신은 광화문 지역 점심 식당 추천 전문가입니다.
아래 조건에 맞는 식당 10곳을 추천하고, 각 식당마다 친근하고 설득력 있는 추천 이유를 작성해주세요.

## 사용자 조건
- 음식 종류: ${userConditions.cuisine === 'all' ? '전체' : userConditions.cuisine}
- 날씨: ${userConditions.weather}
- 기분: ${userConditions.mood}
- 인원: ${userConditions.people}명
- 식단: ${userConditions.diet}
- 예산: ${userConditions.budget}원

## 후보 식당 목록 (상위 ${candidates.length}개)
${JSON.stringify(candidates.map(r => ({
  name: r.name,
  category: r.category,
  rating: r.rating,
  ribbon: r.ribbon,
  menus: r.menus,
  priceNote: r.priceNote,
  walk: r.walk,
  cuisine: r.cuisine,
  weather: r.weather,
  mood: r.mood,
  people: r.people,
  diet: r.diet,
  budget: r.budget
})), null, 2)}

## 최근 추천한 식당 (가능하면 피해주세요)
${recentNames.slice(0, 10).join(', ')}

## 출력 형식
다음 JSON 형식으로 정확히 반환해주세요:
{
  "recommendations": [
    {
      "name": "식당명",
      "reason": "추천 이유 (2-3문장, 친근하고 설득력 있게. 날씨/기분/상황과 연결지어 설명. '~해요', '~거예요' 같은 친근한 말투 사용)"
    }
  ]
}

예시:
{
  "recommendations": [
    {
      "name": "일품 광화문",
      "reason": "오늘같이 더운 날엔 시원한 냉면이 최고죠! 평점 4.6에 블루리본까지 받은 곳이라 맛은 보장되어 있어요. 2명이서 가기 딱 좋은 분위기예요."
    }
  ]
}

꼭 10개를 선택하되, 다양성을 고려해서 같은 종류 음식만 추천하지 마세요. 후보 목록에 있는 식당명을 정확히 사용해주세요.`;

    const deployment = process.env.REACT_APP_AZURE_OPENAI_DEPLOYMENT || "gpt-5.2";
    const response = await openai.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content: "당신은 광화문 지역 점심 식당 추천 전문가입니다. 친근하고 설득력 있는 추천을 제공합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const llmResult = JSON.parse(content);
    
    // LLM 응답을 기존 식당 데이터와 매칭
    const recommendations = llmResult.recommendations || [];
    const final = [];
    
    for (const rec of recommendations) {
      const restaurant = candidates.find(r => r.name === rec.name);
      if (restaurant) {
        final.push({
          ...restaurant,
          reason: rec.reason
        });
      }
    }
    
    return final.slice(0, 10);
  } catch (error) {
    console.error("LLM API Error:", error);
    return null;
  }
}


export default function LunchRecommender() {
  const [selections, setSelections] = useState({ weather: 'hot', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000 });
  const [results, setResults] = useState({ list: [], relaxedMsg: null });
  const recentSeen = useRef([]);
  const resultsTopRef = useRef(null);
  const pageTopRef = useRef(null);
  const [time, setTime] = useState("");
  const [step, setStep] = useState("form");
  const [loadingDot, setLoadingDot] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [quickPresets, setQuickPresets] = useState([]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  // 빠른 추천 버튼을 섞는 함수
  const shuffleQuickPresets = () => {
    const shuffled = [...QUICK_PRESETS];
    // Fisher-Yates shuffle 알고리즘
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const selected = shuffled.slice(0, 4);
    setQuickPresets(selected);
    console.log('🎲 [빠른 추천 버튼]', selected.map(p => p.label));
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
      diet: selections.diet !== 'nodiet' ? selections.diet : 'nodiet',
      budget: 15000,
    };

    setSelections(quickSettings);
    console.log('⚡ [빠른 추천]', { hour, month, weather, mood });

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
        console.log('🎯 [추천 시작]', selections);
        console.log('📝 [최근 방문] 최근 30개:', recentSeen.current.slice(0, 30));

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
          if (selections.weather === 'rainy') return /전|파전|수제비|칼국수|국밥|짬뽕/.test(text);
          return false;
        };

        const matchMood = (r) => {
          if (!selections.mood) return false;
          
          // 해장: mood에 'hangover'가 있거나 카테고리에 국밥/해장/탕/국 포함
          if (selections.mood === 'hangover') {
            const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('hangover');
            const hasHangoverCategory = r.category && 
              (r.category.includes('국밥') || r.category.includes('해장') || 
               r.category.includes('탕') || r.category.includes('찌개') || r.category.includes('국'));
            return hasMoodTag || hasHangoverCategory;
          }
          
          // 격식: mood에 'executive'가 있거나 블루리본/expensive
          if (selections.mood === 'executive') {
            const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('executive');
            const isUpscale = r.ribbon || (r.budget && Array.isArray(r.budget) && r.budget.includes('expensive'));
            return hasMoodTag || isUpscale;
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
          
          // 든든하게: mood에 'hearty'가 있거나, 고칼로리/구이/육류 메뉴
          if (selections.mood === 'hearty') {
            const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('hearty');
            const category = r.category || '';
            const isHearty = category.includes('구이') || category.includes('갈비') || 
              category.includes('삼겹') || category.includes('돈까스') || category.includes('카츠') ||
              category.includes('육') || category.includes('불고기') || category.includes('곱창');
            const isHighCal = r.calorie && r.calorie.label === '고칼로리';
            return hasMoodTag || isHearty || isHighCal;
          }
          
          // 스트레스: mood에 'stressed'가 있거나, 매운음식/고기/특별한 음식
          if (selections.mood === 'stressed') {
            const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('stressed');
            const category = r.category || '';
            const menuText = (r.menus || []).join(' ');
            const isStressRelief = category.includes('구이') || category.includes('매운') ||
              category.includes('불') || category.includes('마라') ||
              category.includes('떡볶이') || category.includes('닭갈비') ||
              category.includes('곱창') || category.includes('삼겹');
            const hasSpicyMenu = /매운|불닭|마라|떡볶이|쭈꾸미|닭발|엽기/.test(menuText);
            const isComfort = r.mood && Array.isArray(r.mood) && 
              (r.mood.includes('hearty') || r.mood.includes('great'));
            return hasMoodTag || isStressRelief || hasSpicyMenu || isComfort;
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
            ? reasons.slice(0, 5).join(' · ') 
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

        console.log(`📊 [필터링 결과]`);
        console.log(`   1단계 (5개 만족): ${tier1.length}개`);
        console.log(`   2단계 (3-4개 만족): ${tier2.length}개`);
        console.log(`   3단계 (2개 만족): ${tier3.length}개`);

        // 🎯 Phase B: 글로벌 점수 기반 정렬 (티어 간 경계 제거)
        // Tier2 고점수가 Tier1 저점수보다 우선되도록 글로벌 정렬
        let allCandidates = [...tier1, ...tier2, ...tier3];
        allCandidates.sort((a, b) => {
          // 매칭 수 가중치 + 점수 통합 정렬
          const tierBonusA = a.matchCount >= 5 ? 15 : a.matchCount >= 3 ? 5 : 0;
          const tierBonusB = b.matchCount >= 5 ? 15 : b.matchCount >= 3 ? 5 : 0;
          const scoreA = a.score + tierBonusA;
          const scoreB = b.score + tierBonusB;
          if (a.isRecent !== b.isRecent) return a.isRecent ? 1 : -1;
          return scoreB - scoreA;
        });

        // 🚫 최근 본 식당 제외 (다른 맛집 추천을 위해)
        const beforeFilterCount = allCandidates.length;
        const filteredCandidates = allCandidates.filter(r => !r.isRecent);
        
        if (beforeFilterCount !== filteredCandidates.length) {
          console.log(`🚫 [최근 본 식당 제외] ${beforeFilterCount - filteredCandidates.length}개 제외, ${filteredCandidates.length}개 남음`);
        }
        
        // 🔄 후보가 부족하면 제외 목록 초기화 후 재시도
        if (filteredCandidates.length < 3 && recentSeen.current.length > 0) {
          console.log(`⚠️ [후보 부족] ${filteredCandidates.length}개만 남음. 제외 목록 초기화 후 전체에서 다시 추천`);
          recentSeen.current = [];
          allCandidates = [...allCandidates]; // 원본 유지 (제외 없이)
          // 사용자에게 순환 안내
          var recycleNotice = "🔄 추천 가능한 식당을 모두 보여드렸어요! 처음부터 다시 추천합니다.";
        } else {
          allCandidates = filteredCandidates;
          var recycleNotice = null;
        }

        console.log(`✅ [정렬 완료] 상위 20개:`, allCandidates.slice(0, 20).map(r => 
          `${r.name} (점수: ${r.score?.toFixed(1) || 0}, ${r.matchCount}개 만족)`
        ));

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

        console.log(`🎉 [최종 결과] ${final.length}개:`, final.map(r => 
          `${r.name} (점수: ${r.score?.toFixed(1)}, ${r.matchCount}개 만족)`
        ));

        if (final.length === 0) {
          setResults({ 
            list: [], 
            relaxedMsg: "😢 조건에 맞는 식당이 없어요. 다른 조건을 선택해보세요!" 
          });
        } else {
          // LLM이 활성화되어 있으면 추천 이유를 LLM으로 생성
          let finalList = final.slice(0, 10);
          if (openai) {
            try {
              console.log('🤖 [LLM] Azure OpenAI로 추천 이유 생성 중...');
              const llmResults = await getLLMRecommendations(
                finalList,
                { cuisine: 'all', weather: selections.weather, mood: selections.mood, people: selections.people, diet: selections.diet, budget: selections.budget },
                recentSeen.current
              );
              if (llmResults && llmResults.length > 0) {
                // LLM 결과의 reason을 recommendReason에 매핑
                finalList = llmResults.map(lr => ({
                  ...lr,
                  recommendReason: lr.reason || lr.recommendReason
                }));
                // LLM이 반환하지 않은 식당도 채우기
                for (const r of final.slice(0, 10)) {
                  if (!finalList.find(f => f.name === r.name)) {
                    finalList.push(r);
                  }
                }
                finalList = finalList.slice(0, 10);
                console.log('✅ [LLM] 추천 이유 생성 완료');
              } else {
                console.log('ℹ️ [LLM] 응답 없음 - 기본 알고리즘 추천 이유 사용');
              }
            } catch (llmError) {
              console.warn('⚠️ [LLM] 호출 실패 - 기본 알고리즘 추천 이유 사용:', llmError.message);
            }
          }

          setResults({ 
            list: finalList, 
            relaxedMsg: recycleNotice || (final.length < 5 ? "💡 조건에 맞는 식당이 적어요. 다른 조건을 선택해보세요!" : null)
          });

          // 최근 본 식당 기록 (DB 소진 시까지 중복 방지)
          const newNames = final.slice(0, 10).map(r => r.name);
          recentSeen.current = [...newNames, ...recentSeen.current].slice(0, restaurantDB.length);
          console.log(`💾 [기록 업데이트] 총 ${recentSeen.current.length}개 식당 기록`);
        }

      } catch(e) {
        console.error('❌ [추천 오류]', e);
        setResults({ 
          list: restaurantDB.sort(() => Math.random() - 0.5).slice(0, 10), 
          relaxedMsg: "⚠️ 오류가 발생해 랜덤으로 보여드려요" 
        });
      }
      setStep("results");
      setTimeout(() => {
        resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }, 600);
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
      console.log(`🔄 [다시 추천] ${currentNames.length}개 식당 제외 목록에 추가`);
    }
    // 다시 추천 실행
    setStep("loading");
  };

  const handleReset = () => {
    setSelections({ weather: 'hot', mood: 'safe', people: 2, diet: 'nodiet', budget: 15000 });
    setResults({ list: [], relaxedMsg: null });
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
          {openai && (
            <span style={{ 
              background: "rgba(99, 102, 241, 0.2)", 
              color: "rgba(99, 102, 241, 1)", 
              fontSize: 10, 
              fontWeight: 700, 
              padding: "4px 10px", 
              borderRadius: 12, 
              marginLeft: 8,
              border: "1px solid rgba(99, 102, 241, 0.3)",
              letterSpacing: 0.5
            }}>
              🤖 AI
            </span>
          )}
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
                      style={{
                        background: selections.weather === opt.value ? "#6366F1" : "#f8fafc",
                        color: selections.weather === opt.value ? "white" : "#475569",
                        border: selections.weather === opt.value ? "2px solid #6366F1" : "2px solid #e2e8f0",
                        borderRadius: 50,
                        padding: "8px 18px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
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
                      style={{
                        background: selections.mood === opt.value ? "#6366F1" : "#f8fafc",
                        color: selections.mood === opt.value ? "white" : "#475569",
                        border: selections.mood === opt.value ? "2px solid #6366F1" : "2px solid #e2e8f0",
                        borderRadius: 50,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
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
                      style={{
                        background: selections.diet === opt.value ? "#6366F1" : "#f8fafc",
                        color: selections.diet === opt.value ? "white" : "#475569",
                        border: selections.diet === opt.value ? "2px solid #6366F1" : "2px solid #e2e8f0",
                        borderRadius: 50,
                        padding: "8px 16px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {opt.emoji} {opt.label}
                    </button>
                  ))}
                </div>
                {/* 부족 카테고리 사전 안내 */}
                {selections.diet && selections.diet !== 'nodiet' && (() => {
                  const dietCounts = {
                    vegetarian: restaurantDB.filter(r => r.diet && r.diet.includes('vegetarian')).length,
                    diet: restaurantDB.filter(r => r.diet && r.diet.includes('diet')).length,
                    light: restaurantDB.filter(r => r.diet && r.diet.includes('light')).length,
                  };
                  const count = dietCounts[selections.diet];
                  if (count && count <= 15) {
                    const dietLabel = OPTIONS.diet.find(o => o.value === selections.diet);
                    return (
                      <div style={{ marginTop: 8, padding: "8px 12px", background: "#FFFBEB", borderRadius: 10, border: "1px solid #FDE68A", fontSize: 12, color: "#92400E", display: "flex", alignItems: "center", gap: 6 }}>
                        💡 {dietLabel?.label || selections.diet} 가능 식당은 현재 <b>{count}곳</b> 등록되어 있어요
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
                  style={{ width: "100%", accentColor: "#6366F1", cursor: "pointer", height: 6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
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
                  style={{ width: "100%", accentColor: "#6366F1", cursor: "pointer", height: 6 }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
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
                <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8" }}>탭 한번으로 조건 자동 설정</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {quickPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      const newSettings = {
                        ...preset.settings,
                        diet: selections.diet !== 'nodiet' ? selections.diet : preset.settings.diet,
                      };
                      setSelections(newSettings);
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
          <div style={{ background: "white", borderRadius: 24, padding: "80px 40px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.06)" }}>
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
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              블루리본 · 네이버 평점 · 카카오맵 참고 중
            </div>
          </div>
        )}

        {/* RESULTS */}
        {step === "results" && (
          <div ref={resultsTopRef}>
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
              <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8, letterSpacing: 0.5 }}>
                🏆 TOP 3 추천
              </div>
            )}
            {results.list.map((r, i) => {
              const isTop3 = i < 3;
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
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 50, background: "#FFF3E0", color: "#E65100" }}>
                          🌟 블루리본
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                      {r.category} · ⭐ {r.rating} · {r.walk || r.priceNote}
                    </div>
                  </div>
                  {r.score && (
                    <div style={{ fontSize: 13, fontWeight: 800, color: rankColor }}>
                      {Math.round(r.score || 0)}점
                    </div>
                  )}
                </div>

                {/* 매칭 배지 */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {r.weather && Array.isArray(r.weather) && r.weather.includes(selections.weather) && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#FFFDE7", color: "#F57F17" }}>
                      {OPTIONS.weather.find(o=>o.value===selections.weather)?.emoji} 날씨 딱
                    </span>
                  )}
                  {r.mood && Array.isArray(r.mood) && (() => {
                    const moodMapping = { 'great': ['exciting', 'executive'], 'normal': ['safe'], 'tired': ['hearty', 'hangover'], 'stressed': ['sad', 'hearty'] };
                    let mapped = [...r.mood];
                    for (let mood in moodMapping) { if (r.mood.includes(mood)) mapped = [...mapped, ...moodMapping[mood]]; }
                    if (r.people && Array.isArray(r.people) && r.people.includes('large')) mapped.push('team');
                    if (r.category && (r.category.includes('국밥') || r.category.includes('해장') || r.category.includes('탕'))) mapped.push('hangover');
                    if (r.ribbon && r.budget && Array.isArray(r.budget) && r.budget.includes('expensive')) mapped.push('executive');
                    return mapped.includes(selections.mood);
                  })() && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#EDE9FE", color: "#6D28D9" }}>
                      {OPTIONS.mood.find(o=>o.value===selections.mood)?.emoji} 기분 맞춤
                    </span>
                  )}
                  {r.people && Array.isArray(r.people) && r.people.some(p => {
                    const peopleMap = { 1: 'solo', 2: 'small', 3: 'small', 4: 'medium', 5: 'medium', 6: 'medium', 7: 'large', 8: 'large' };
                    return p === peopleMap[selections.people];
                  }) && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#E8EAF6", color: "#283593" }}>
                      👥 인원 적합
                    </span>
                  )}
                  {parseFloat(r.rating) >= 4.5 && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#FFF3E0", color: "#E65100" }}>🔥 인기</span>
                  )}
                  {r.diet && Array.isArray(r.diet) && r.diet.includes("vegetarian") && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#E8F5E9", color: "#2E7D32" }}>🌿 채식가능</span>
                  )}
                  {r.diet && Array.isArray(r.diet) && r.diet.includes("diet") && (
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 50, background: "#E3F2FD", color: "#1565C0" }}>💪 다이어트</span>
                  )}
                </div>

                {/* 대표메뉴 + 가격 */}
                <div style={{ fontSize: 13, color: "#475569", marginBottom: 10, lineHeight: 1.6 }}>
                  🍽️ {r.menus && Array.isArray(r.menus) ? r.menus.join(", ") : '-'}
                  {r.priceNote && r.walk && <span style={{ color: "#94a3b8" }}> · 💰 {r.priceNote}</span>}
                </div>

                {/* 추천 이유 */}
                {r.recommendReason && (
                  <div style={{ background: "#EEF2FF", borderRadius: 10, padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#0f172a", lineHeight: 1.6, borderLeft: `3px solid ${rankColor}`, fontWeight: 500 }}>
                    {r.recommendReason}
                  </div>
                )}

                {/* 예약/지도 링크 */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {r.reservation && Array.isArray(r.reservation) && r.reservation.map((res, ri) => (
                    <a key={ri} href={res.url} target="_blank" rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 4, background: res.color, color: "white", textDecoration: "none", fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 50, transition: "opacity 0.2s" }}
                      onMouseOver={e => e.currentTarget.style.opacity = "0.85"} onMouseOut={e => e.currentTarget.style.opacity = "1"}
                    >{res.label === "캐치테이블" ? "🪑" : "📅"} {res.label}</a>
                  ))}
                  {r.reservation && typeof r.reservation === 'boolean' && r.reservation && (
                    <span style={{ fontSize: 11, color: "#22c55e", padding: "6px 0", display: "flex", alignItems: "center", gap: 4 }}>📅 예약 가능</span>
                  )}
                  {(!r.reservation || (Array.isArray(r.reservation) && r.reservation.length === 0)) && (
                    <span style={{ fontSize: 11, color: "#94a3b8", padding: "6px 0", display: "flex", alignItems: "center", gap: 4 }}>✅ 예약 불필요 · 바로 방문</span>
                  )}
                  <a href={r.naver} target="_blank" rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#f8fafc", color: "#475569", textDecoration: "none", fontSize: 11, fontWeight: 600, padding: "6px 12px", borderRadius: 50, border: "1px solid #e2e8f0", transition: "all 0.2s" }}
                    onMouseOver={e => e.currentTarget.style.background = "#e2e8f0"} onMouseOut={e => e.currentTarget.style.background = "#f8fafc"}
                  >🗺️ 네이버 지도</a>
                </div>

                {/* 피드백 버튼 */}
                <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                  <button onClick={() => { const ok = saveFeedback(r.name, 'like', { weather: selections.weather, mood: selections.mood, people: selections.people, diet: selections.diet, budget: selections.budget }); if (ok) { alert(`👍 "${r.name}"을(를) 좋아요 했어요! 다음 추천에 반영됩니다.`); saveVisit(r.name, r.category, r.cuisine); } }}
                    style={{ flex: 1, background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                    onMouseOver={e => { e.currentTarget.style.background = "#dcfce7"; }} onMouseOut={e => { e.currentTarget.style.background = "#f0fdf4"; }}
                  >👍 좋아요</button>
                  <button onClick={() => { const ok = saveFeedback(r.name, 'dislike', { weather: selections.weather, mood: selections.mood, people: selections.people, diet: selections.diet, budget: selections.budget }); if (ok) { alert(`👎 "${r.name}"을(를) 별로예요 했어요. 다음 추천에 반영됩니다.`); } }}
                    style={{ flex: 1, background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                    onMouseOver={e => { e.currentTarget.style.background = "#f1f5f9"; }} onMouseOut={e => { e.currentTarget.style.background = "#f8fafc"; }}
                  >👎 별로예요</button>
                </div>
              </div>
              );

              // 4위~10위: 컴팩트 카드
              return (
              <div key={r.name}>
                {i === 3 && (
                  <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600, marginBottom: 8, marginTop: 4, letterSpacing: 0.5 }}>
                    📋 그 외 추천
                  </div>
                )}
                <div className="card-hover" style={{
                  background: "white",
                  borderRadius: 14,
                  padding: "14px 18px",
                  marginBottom: 8,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  border: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onClick={() => window.open(r.naver, '_blank')}
                >
                  <div style={{ minWidth: 28, height: 28, background: "#f1f5f9", color: "#94a3b8", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</span>
                      {r.ribbon && <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 50, background: "#FFF3E0", color: "#E65100", fontWeight: 700 }}>🌟</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.category} · ⭐ {r.rating} · {r.priceNote || r.price}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {r.weather && Array.isArray(r.weather) && r.weather.includes(selections.weather) && (
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 50, background: "#FFFDE7", color: "#F57F17" }}>🌤️</span>
                    )}
                    {r.mood && Array.isArray(r.mood) && r.mood.includes(selections.mood) && (
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 50, background: "#EDE9FE", color: "#6D28D9" }}>😊</span>
                    )}
                  </div>
                  <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>🗺️</span>
                </div>
              </div>
              );
            })}

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
        <div style={{ marginBottom: 6, fontWeight: 500, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
          📍 KT 광화문 West·East 빌딩 반경 700m 실제 맛집
        </div>
        <div>
          네이버 플레이스 평점 기반 · 블루리본 가이드 참고
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Noto Sans KR', sans-serif; -webkit-font-smoothing: antialiased; }
      `}</style>
    </div>
  );
}