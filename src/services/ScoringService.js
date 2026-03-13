/**
 * ScoringService
 * 
 * 시간/요일 컨텍스트 점수, MMR 다양성 점수 계산
 */

import { getDistance } from '../utils/distance.js';

const KT_BASE_LAT = 37.5716;
const KT_BASE_LNG = 126.9769;

/**
 * 시간/요일 기반 컨텍스트 점수 계산
 * @param {Object} restaurant - 식당 객체
 * @param {Object} selections - 사용자 선택 조건
 * @returns {number} 컨텍스트 점수
 */
export function getTimeContextScore(restaurant, selections) {
  let score = 0;
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const dayOfWeek = now.getDay();
  
  const isPeakTime = (hour === 11 && minute >= 30) || (hour === 12 && minute <= 30);
  const isLunchWindow = hour >= 11 && (hour < 13 || (hour === 13 && minute <= 30));
  
  if (isPeakTime) {
    const peopleNum = selections.people || 2;
    if (peopleNum > 6 && restaurant.people && Array.isArray(restaurant.people) && restaurant.people.includes('large')) {
      score -= 10;
    }
    if (restaurant.waiting) {
      score -= 8;
    }
    if (restaurant.coords) {
      const distance = getDistance(KT_BASE_LAT, KT_BASE_LNG, restaurant.coords.lat, restaurant.coords.lng);
      if (distance > 400) score -= 8;
      else if (distance > 300) score -= 5;
      else if (distance < 100) score += 10;
      else if (distance < 200) score += 5;
    }
  } else if (isLunchWindow) {
    if (restaurant.waiting) {
      score -= 4;
    }
  }
  
  if (dayOfWeek === 5) {
    if (restaurant.budget && Array.isArray(restaurant.budget) && restaurant.budget.includes('expensive')) {
      score += 10;
    }
  }
  if (dayOfWeek === 1) {
    if (restaurant.mood && Array.isArray(restaurant.mood) && 
        (restaurant.mood.includes('safe') || restaurant.mood.includes('normal'))) {
      score += 8;
    }
    const rating = parseFloat(restaurant.rating) || 0;
    if (rating >= 4.7) score += 5;
  }
  if (dayOfWeek === 3) {
    if (restaurant.cuisine && (restaurant.cuisine === 'japanese' || restaurant.cuisine === 'western' || restaurant.cuisine === 'chinese')) {
      score += 4;
    }
  }
  if (dayOfWeek === 4) {
    if (restaurant.ribbon) score += 5;
  }
  
  const category = restaurant.category || '';
  const menuText = (restaurant.menus || []).join(' ');
  const searchText = category + ' ' + menuText;
  
  if (selections.weather === 'hot') {
    if (/냉면|회|샐러드|초밥|카이센동|냉모밀|냉소바|물냉|비빔냉|메밀|아이스|콩국수|물회/.test(searchText)) score += 12;
    if (/찌개|탕|국밥|전골|뚝배기|설렁탕|곰탕/.test(category)) score -= 8;
    if (restaurant.coords) {
      const dist = getDistance(KT_BASE_LAT, KT_BASE_LNG, restaurant.coords.lat, restaurant.coords.lng);
      if (dist > 400) score -= 3;
    }
  }
  if (selections.weather === 'cold') {
    if (/찌개|탕|국밥|전골|국|라멘|우동|설렁탕|갈비탕|샤브|곰탕|순대국|감자탕/.test(searchText)) score += 12;
    if (/냉면|회|샐러드|냉모밀|물회|콩국수/.test(searchText)) score -= 5;
  }
  if (selections.weather === 'rainy') {
    if (/찌개|전|국밥|파전|부침|수제비|칼국수|라멘|순대국/.test(searchText)) score += 15;
    if (restaurant.coords) {
      const dist = getDistance(KT_BASE_LAT, KT_BASE_LNG, restaurant.coords.lat, restaurant.coords.lng);
      if (dist > 300) score -= 5;
    }
  }
  if (selections.weather === 'mild') {
    if (/파스타|브런치|샌드위치|버거|비빔/.test(searchText)) score += 5;
  }
  
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) {
    if (/샐러드|회|초밥|비빔|봄|냉면|파스타|브런치/.test(searchText)) score += 5;
  } else if (month >= 6 && month <= 8) {
    if (/냉면|콩국수|물회|냉모밀|냉소바|샐러드|빙수|아이스/.test(searchText)) score += 5;
  } else if (month >= 9 && month <= 11) {
    if (/갈비|구이|삼겹|보쌈|삼계탕|추어|전골/.test(searchText)) score += 5;
  } else {
    if (/찌개|탕|전골|국밥|라멘|우동|설렁탕|곰탕|순대국|감자탕|샤브/.test(searchText)) score += 5;
  }
  
  if (!isPeakTime && restaurant.coords) {
    const distance = getDistance(KT_BASE_LAT, KT_BASE_LNG, restaurant.coords.lat, restaurant.coords.lng);
    if (distance < 100) score += 7;
    else if (distance < 200) score += 4;
    else if (distance < 350) score += 2;
    else if (distance > 600) score -= 5;
    else if (distance > 450) score -= 2;
  }
  
  return score;
}

/**
 * MMR (Maximal Marginal Relevance) 다양성 점수 계산
 * @param {Object} restaurant - 후보 식당
 * @param {Object[]} selectedRestaurants - 이미 선택된 식당들
 * @param {number} relevanceScore - 관련성 점수
 * @returns {number} MMR 점수
 */
export function calculateMMRScore(restaurant, selectedRestaurants, relevanceScore) {
  if (selectedRestaurants.length === 0) return relevanceScore;
  
  let maxSimilarity = 0;
  
  for (const selected of selectedRestaurants) {
    let similarity = 0;
    
    if (restaurant.category === selected.category) {
      similarity += 0.4;
    } else if (restaurant.cuisine === selected.cuisine) {
      similarity += 0.2;
    }
    
    const getBrand = (name) => {
      const suffixes = ['광화문점', '디타워점', 'SFC점', '종각점', '본점', '지점'];
      let brand = name;
      suffixes.forEach(suffix => {
        if (brand.includes(suffix)) brand = brand.replace(suffix, '').trim();
      });
      return brand.replace(/\s*\([^)]*\)\s*/g, '').trim();
    };
    
    if (getBrand(restaurant.name) === getBrand(selected.name)) {
      similarity += 0.5;
    }
    
    const getPriceRange = (r) => {
      if (!r.price) return 15000;
      const match = r.price.match(/(\d{1,3}(?:,?\d{3})*)/);
      return match ? parseInt(match[1].replace(/,/g, '')) : 15000;
    };
    
    const price1 = getPriceRange(restaurant);
    const price2 = getPriceRange(selected);
    const priceDiff = Math.abs(price1 - price2);
    
    if (priceDiff < 5000) similarity += 0.2;
    else if (priceDiff < 10000) similarity += 0.1;
    
    if (restaurant.coords && selected.coords) {
      const dist1 = getDistance(KT_BASE_LAT, KT_BASE_LNG, restaurant.coords.lat, restaurant.coords.lng);
      const dist2 = getDistance(KT_BASE_LAT, KT_BASE_LNG, selected.coords.lat, selected.coords.lng);
      if (Math.abs(dist1 - dist2) < 100) similarity += 0.1;
    }
    
    maxSimilarity = Math.max(maxSimilarity, similarity);
  }
  
  const poolSize = selectedRestaurants.length;
  const lambda = Math.min(0.9, 0.5 + poolSize / 20);
  return lambda * relevanceScore - (1 - lambda) * maxSimilarity * 100;
}
