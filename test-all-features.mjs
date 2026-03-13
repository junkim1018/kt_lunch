/**
 * KT 점심 추천기 — 전체 기능 테스트 (KT 직원 시뮬레이션)
 * 
 * 모든 선택 조합에 대해 추천 결과가 올바른지 검증합니다.
 * - 카테고리와 맞지 않는 추천 식별
 * - 필터 로직 버그 발견
 * - 엣지 케이스 확인
 */

// ESM import를 위해 dynamic import 사용
async function runTests() {
  // Restaurant data
  const { restaurantDB } = await import('./src/data/restaurantData.js');
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  KT 점심 추천기 — 전체 기능 테스트 (KT 직원 시뮬레이션)`);
  console.log(`  총 ${restaurantDB.length}개 식당 DB`);
  console.log(`${'='.repeat(70)}\n`);

  const bugs = [];
  const warnings = [];
  let passCount = 0;
  let failCount = 0;

  // ============================================================
  // 매칭 함수 복제 (App.js 로직 그대로)
  // ============================================================
  
  const matchWeather = (r, weather) => {
    if (!weather) return false;
    const hasTag = r.weather && Array.isArray(r.weather) && r.weather.includes(weather);
    if (hasTag) return true;
    const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
    if (weather === 'hot') return /냉면|콩국수|물회|냉모밀|빙수|샐러드|냉채/.test(text);
    if (weather === 'cold') return /국밥|탕|찌개|전골|라멘|설렁탕|갈비탕|부대/.test(text);
    if (weather === 'rainy') return /파전|해물전|녹두전|감자전|부침|수제비|칼국수|국밥|짬뽕/.test(text);
    return false;
  };

  const matchMood = (r, mood) => {
    if (!mood) return false;
    
    if (mood === 'hangover') {
      const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('hangover');
      const hasHangoverCategory = r.category && 
        /(국밥|순대국|해장국|해장|육개장|감자탕|뼈다귀|곰탕|설렁탕|탕|찌개)/.test(r.category);
      return hasMoodTag || hasHangoverCategory;
    }
    
    if (mood === 'executive') {
      const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('executive');
      const isUpscale = r.ribbon || (r.budget && Array.isArray(r.budget) && r.budget.includes('expensive'));
      const category = r.category || '';
      const isCasual = /(순대|분식|떡볶이|김밥|국밥|백반|푸드코트)/.test(category);
      return hasMoodTag || (isUpscale && !isCasual);
    }
    
    if (mood === 'team') {
      const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('team');
      const supportsGroup = r.people && Array.isArray(r.people) && 
        (r.people.includes('large') || r.people.includes('medium'));
      return hasMoodTag || supportsGroup;
    }
    
    if (mood === 'sad') {
      const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('sad');
      const isComfortFood = r.mood && Array.isArray(r.mood) && 
        (r.mood.includes('great') || r.mood.includes('exciting'));
      const category = r.category || '';
      const hasComfortCategory = category.includes('디저트') || category.includes('카페') || 
        category.includes('빵') || category.includes('떡볶이') || category.includes('치킨') ||
        category.includes('파스타') || category.includes('라멘');
      return hasMoodTag || isComfortFood || hasComfortCategory;
    }
    
    if (mood === 'exciting') {
      const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('exciting');
      const isSpecial = r.ribbon || 
        (r.mood && Array.isArray(r.mood) && r.mood.includes('great'));
      const category = r.category || '';
      const hasExcitingCategory = category.includes('오마카세') || category.includes('코스') ||
        category.includes('프리미엄') || category.includes('스테이크');
      return hasMoodTag || isSpecial || hasExcitingCategory;
    }
    
    if (mood === 'hearty') {
      const hasMoodTag = r.mood && Array.isArray(r.mood) && r.mood.includes('hearty');
      const category = r.category || '';
      const isHearty = category.includes('구이') || category.includes('갈비') || 
        category.includes('삼겹') || category.includes('돈까스') || category.includes('카츠') ||
        category.includes('육') || category.includes('불고기') || category.includes('곱창');
      const isHighCal = r.calorie && r.calorie.label === '고칼로리';
      const isCafeOrBrunch = /(카페|디저트|브런치|팬케이크|베이커리|빵)/.test(category);
      return hasMoodTag || isHearty || (isHighCal && !isCafeOrBrunch);
    }
    
    if (mood === 'stressed') {
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
    
    return r.mood && Array.isArray(r.mood) && r.mood.includes(mood);
  };

  const matchPeople = (r, peopleNum) => {
    let peopleCategory;
    if (peopleNum === 1) peopleCategory = 'solo';
    else if (peopleNum <= 3) peopleCategory = 'small';
    else if (peopleNum <= 6) peopleCategory = 'medium';
    else peopleCategory = 'large';

    if (!r.people || !Array.isArray(r.people)) return false;
    if (r.people.includes(peopleCategory)) return true;
    const categoryMap = { 'solo': 0, 'small': 1, 'medium': 2, 'large': 3 };
    const userCat = categoryMap[peopleCategory];
    return r.people.some(p => {
      const restCat = categoryMap[p];
      return restCat !== undefined && Math.abs(restCat - userCat) <= 1;
    });
  };

  const matchDiet = (r, diet) => {
    if (!diet || diet === 'nodiet') return true;
    if (!r.diet || !Array.isArray(r.diet)) return false;
    if (diet === 'vegetarian') return r.diet.includes('vegetarian');
    if (diet === 'diet') return r.diet.includes('diet') || r.diet.includes('light');
    if (diet === 'light') return r.diet.includes('light') || r.diet.includes('diet');
    return false;
  };

  const parsePriceRange = (r) => {
    const priceStr = r.price || r.priceNote || '';
    const rangeMatch = priceStr.match(/(\d{1,3}(?:,?\d{3})*)\s*[~-]\s*(\d{1,3}(?:,?\d{3})*)/);
    if (rangeMatch) {
      return { min: parseInt(rangeMatch[1].replace(/,/g, '')), max: parseInt(rangeMatch[2].replace(/,/g, '')) };
    }
    const manRangeMatch = priceStr.match(/(\d+\.?\d*)\s*[~-]\s*(\d+\.?\d*)\s*만원/);
    if (manRangeMatch) {
      return { min: Math.round(parseFloat(manRangeMatch[1]) * 10000), max: Math.round(parseFloat(manRangeMatch[2]) * 10000) };
    }
    const manwonMatch = priceStr.match(/(\d+\.?\d*)\s*만원/);
    if (manwonMatch) {
      const price = Math.round(parseFloat(manwonMatch[1]) * 10000);
      return { min: price, max: price };
    }
    const singleMatch = priceStr.match(/(\d{1,3}(?:,?\d{3})*)\s*원/);
    if (singleMatch) {
      const price = parseInt(singleMatch[1].replace(/,/g, ''));
      return { min: price, max: price };
    }
    return null;
  };

  const matchBudget = (r, budgetNum) => {
    const parsed = parsePriceRange(r);
    if (!parsed) return false;
    const { min } = parsed;
    if (budgetNum >= min) return true;
    const tolerance = Math.max(2000, budgetNum * 0.15);
    if (min - budgetNum <= tolerance) return true;
    return false;
  };

  // ============================================================
  // 통합 추천 시뮬레이션 함수
  // ============================================================
  function simulateRecommendation(selections) {
    const { weather, mood, diet, people, budget } = selections;
    const budgetNum = budget;
    
    let peopleCategory;
    if (people === 1) peopleCategory = 'solo';
    else if (people <= 3) peopleCategory = 'small';
    else if (people <= 6) peopleCategory = 'medium';
    else peopleCategory = 'large';

    const withMatches = restaurantDB.map(r => {
      const matches = [
        matchWeather(r, weather),
        matchMood(r, mood),
        matchPeople(r, people),
        matchDiet(r, diet),
        matchBudget(r, budgetNum)
      ];
      const matchCount = matches.filter(Boolean).length;
      const rating = parseFloat(r.rating) || 0;
      let totalScore = matchCount * 20 + rating * 2 + (r.ribbon ? 10 : 0);
      
      return { ...r, matchCount, rating, score: totalScore, matches, dietMatched: matches[3] };
    });

    const hasDietFilter = diet && diet !== 'nodiet';
    const candidates = hasDietFilter
      ? withMatches.filter(r => r.dietMatched)
      : withMatches;

    const tier1 = candidates.filter(r => r.matchCount === 5);
    const tier2 = candidates.filter(r => r.matchCount >= 3 && r.matchCount < 5);
    const tier3 = candidates.filter(r => r.matchCount >= 2 && r.matchCount < 3);

    let allCandidates = [...tier1, ...tier2, ...tier3];
    allCandidates.sort((a, b) => {
      const tierBonusA = a.matchCount >= 5 ? 15 : a.matchCount >= 3 ? 5 : 0;
      const tierBonusB = b.matchCount >= 5 ? 15 : b.matchCount >= 3 ? 5 : 0;
      return (b.score + tierBonusB) - (a.score + tierBonusA);
    });

    return {
      all: allCandidates,
      tier1,
      tier2,
      tier3,
      top10: allCandidates.slice(0, 10),
      totalCandidates: allCandidates.length
    };
  }

  // ============================================================
  // 테스트 1: 날씨 매칭 정확도
  // ============================================================
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📌 테스트 1: 날씨(Weather) 매칭 정확도`);
  console.log(`${'─'.repeat(60)}`);

  const weatherOptions = ['hot', 'mild', 'cold', 'rainy'];
  for (const weather of weatherOptions) {
    const matched = restaurantDB.filter(r => matchWeather(r, weather));
    console.log(`\n  🌤️ weather=${weather}: ${matched.length}개 매칭`);
    
    // 날씨 태그로 매칭된 식당 vs fallback으로 매칭된 식당
    const tagMatched = matched.filter(r => r.weather?.includes(weather));
    const fallbackMatched = matched.filter(r => !r.weather?.includes(weather));
    
    if (fallbackMatched.length > 0) {
      console.log(`     태그 매칭: ${tagMatched.length}개, Fallback 매칭: ${fallbackMatched.length}개`);
      // fallback 매칭 중 부적절한 것이 있는지 확인
      for (const r of fallbackMatched) {
        const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
        if (weather === 'rainy') {
          // '전' 이라는 한 글자 regex가 너무 광범위할 수 있음!
          if (/전/.test(text) && !/파전|해물전|녹두전|감자전|전골|전문|부전|전주|부침/.test(text)) {
            // '전'이 포함되어 있지만 파전이 아닌 경우
            const matchWord = text.match(/전/);
            if (text.includes('전골') || text.includes('전문') || text.includes('전주')) {
              // OK
            } else {
              // '전' 한글자로 잘못 매칭될 수 있음
              bugs.push({
                type: 'WEATHER_FALLBACK_FALSE_POSITIVE',
                severity: 'HIGH',
                detail: `비 오는 날(rainy) fallback에서 "${r.name}" (${r.category})이 '전' regex로 잘못 매칭됨. 
                  텍스트: "${text.substring(0, 80)}..."`,
                fix: "'전' 대신 더 구체적인 패턴 사용 필요 (예: /파전|부침|해물전/ 등)"
              });
              failCount++;
            }
          }
        }
      }
    }
    passCount++;
  }

  // ============================================================
  // 테스트 1b: rainy '전' regex 과대 매칭 심층 분석
  // ============================================================
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📌 테스트 1b: rainy '전' regex 과대매칭 분석`);
  console.log(`${'─'.repeat(60)}`);
  
  const rainyFallback = restaurantDB.filter(r => {
    if (r.weather?.includes('rainy')) return false;
    const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
    return /전/.test(text);
  });
  
  console.log(`  '전' 단일 글자로 fallback 매칭되는 식당 수: ${rainyFallback.length}개`);
  for (const r of rainyFallback) {
    const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
    // '전'이 실제로 '파전', '전골' 등의 일부인지 확인
    const isLegitimate = /파전|해물전|감자전|녹두전|부침전|전병/.test(text);
    const isFullWord = /전골|전문|전주|전통/.test(text);
    
    if (!isLegitimate && !isFullWord) {
      // 매운전, ~전 등 잘못된 매칭
      console.log(`  ⚠️  [의심] "${r.name}" (${r.category}) — '전' 불필요 매칭`);
      const matchContext = text.match(/.{0,5}전.{0,5}/g);
      if (matchContext) {
        console.log(`       컨텍스트: ${matchContext.join(', ')}`);
      }
    }
  }

  // ============================================================
  // 테스트 2: 기분(Mood) 매칭 정확도
  // ============================================================
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📌 테스트 2: 기분(Mood) 매칭 정확도`);
  console.log(`${'─'.repeat(60)}`);

  const moodOptions = ['safe', 'hearty', 'executive', 'hangover', 'team', 'exciting', 'sad', 'stressed'];
  
  for (const mood of moodOptions) {
    const matched = restaurantDB.filter(r => matchMood(r, mood));
    console.log(`\n  😊 mood=${mood}: ${matched.length}개 매칭`);
    
    // 각 mood별 의심스러운 매칭 확인
    if (mood === 'hangover') {
      // 해장 식당에 피자/파스타가 들어있으면 안 됨
      const suspicious = matched.filter(r => 
        r.category && (r.category.includes('피자') || r.category.includes('파스타') || 
        r.category.includes('이탈리안') || r.category.includes('스테이크'))
      );
      for (const r of suspicious) {
        bugs.push({
          type: 'MOOD_HANGOVER_MISMATCH',
          severity: 'HIGH',
          detail: `해장(hangover) 매칭에 부적절한 식당: "${r.name}" (${r.category})`,
          fix: '해장 모드에서 이탈리안/피자/파스타/스테이크 카테고리 제외 필요'
        });
        failCount++;
      }
      // '국' regex가 너무 광범위한지 확인
      const catMatchOnly = matched.filter(r => {
        const hasMoodTag = r.mood?.includes('hangover');
        if (hasMoodTag) return false;
        return r.category?.includes('국');
      });
      for (const r of catMatchOnly) {
        if (r.category && !r.category.includes('국밥') && !r.category.includes('순대국') && !r.category.includes('탕') && 
            !r.category.includes('찌개') && !r.category.includes('해장')) {
          // '국' 만으로 매칭된 것 확인
          console.log(`  ⚠️  [의심] hangover '국' 매칭: "${r.name}" (${r.category})`);
          const korCategory = r.category;
          if (korCategory.includes('육')) {
            // '육' 에 '국'이 포함되진 않지만 확인
          }
          // '국' 문자가 어디에서 매칭되는지
          if (korCategory.includes('국')) {
            const matches = korCategory.match(/.{0,3}국.{0,3}/g);
            console.log(`       카테고리에서 '국' 위치: ${matches?.join(', ')}`);
            if (!korCategory.includes('국밥') && !korCategory.includes('국물') && !korCategory.includes('순대국')) {
              bugs.push({
                type: 'MOOD_HANGOVER_BROAD_REGEX',
                severity: 'MEDIUM',
                detail: `해장(hangover) '국' 매칭 과대: "${r.name}" (${r.category}) — '국'이 해장 관련이 아닐 수 있음`,
                fix: "'국' 대신 '국밥|국물|해장국' 등 더 구체적 패턴 사용"
              });
              failCount++;
            }
          }
        }
      }
      passCount++;
    }

    if (mood === 'hearty') {
      // 든든하게: 고칼로리로 매칭되는 식당 중 카페/디저트 류가 있으면 부적절
      const calMatchOnly = matched.filter(r => {
        const hasMoodTag = r.mood?.includes('hearty');
        const category = r.category || '';
        const isHearty = category.includes('구이') || category.includes('갈비') || 
          category.includes('삼겹') || category.includes('돈까스') || category.includes('카츠') ||
          category.includes('육') || category.includes('불고기') || category.includes('곱창');
        return !hasMoodTag && !isHearty;
      });
      for (const r of calMatchOnly) {
        if (r.calorie?.label === '고칼로리') {
          const cat = r.category || '';
          // 카페, 빵집 등이 고칼로리인데 든든하게에 매칭되면 의심
          if (cat.includes('카페') || cat.includes('디저트') || cat.includes('빵') || cat.includes('케이크')) {
            bugs.push({
              type: 'MOOD_HEARTY_MISMATCH',
              severity: 'MEDIUM',
              detail: `든든하게(hearty) 매칭에 카페/디저트: "${r.name}" (${r.category}) — 고칼로리이지만 식사가 아닌 곳`,
              fix: '카페/디저트 카테고리는 고칼로리여도 hearty에서 제외 필요'
            });
            failCount++;
          }
        }
      }
      passCount++;
    }

    if (mood === 'stressed') {
      // 스트레스: mood=great/hearty fallback으로 너무 많은 식당이 매칭되는지 확인
      const tagOnly = matched.filter(r => r.mood?.includes('stressed'));
      const fallback = matched.filter(r => !r.mood?.includes('stressed'));
      console.log(`     태그 매칭: ${tagOnly.length}개, Fallback: ${fallback.length}개`);
      
      // fallback 중 스트레스 해소와 관련 없는 식당 확인
      const suspiciousStressed = fallback.filter(r => {
        const category = r.category || '';
        const menuText = (r.menus || []).join(' ');
        const isStressRelief = category.includes('구이') || category.includes('매운') ||
          category.includes('불') || category.includes('마라') ||
          category.includes('떡볶이') || category.includes('닭갈비') ||
          category.includes('곱창') || category.includes('삼겹');
        const hasSpicyMenu = /매운|불닭|마라|떡볶이|쭈꾸미|닭발|엽기/.test(menuText);
        // mood=great 이나 mood=hearty fallback으로만 매칭된 경우
        return !isStressRelief && !hasSpicyMenu;
      });
      
      if (suspiciousStressed.length > 10) {
        console.log(`  ⚠️  stressed fallback(great/hearty 포함)으로 ${suspiciousStressed.length}개 식당 추가 매칭`);
        // 이 중 실제로 스트레스 해소와 관련 없는 곳들 나열
        const sampledSuspicious = suspiciousStressed.slice(0, 5);
        for (const r of sampledSuspicious) {
          console.log(`       "${r.name}" (${r.category}) — mood: ${r.mood?.join(',')}`);
        }
        bugs.push({
          type: 'MOOD_STRESSED_TOO_BROAD', 
          severity: 'MEDIUM',
          detail: `스트레스(stressed) fallback이 너무 넓음: mood=great/hearty로 인해 ${suspiciousStressed.length}개 비관련 식당 포함 (예: ${sampledSuspicious.map(r => r.name).join(', ')})`,
          fix: 'stressed fallback에서 mood=great/hearty 조건을 제거하거나 더 엄격한 조건 추가'
        });
        failCount++;
      }
      passCount++;
    }

    if (mood === 'executive') {
      // 임원과 함께: budget=expensive 또는 ribbon으로 매칭되는 식당 확인
      // 분식, 떡볶이, 김밥 등이 포함되면 안 됨
      const casualFood = matched.filter(r => {
        const cat = r.category || '';
        return cat.includes('분식') || cat.includes('떡볶이') || cat.includes('김밥') ||
          cat.includes('순대') || cat.includes('라면') || cat.includes('토스트');
      });
      for (const r of casualFood) {
        bugs.push({
          type: 'MOOD_EXECUTIVE_MISMATCH',
          severity: 'HIGH',
          detail: `임원(executive) 매칭에 분식/캐주얼: "${r.name}" (${r.category})`,
          fix: '임원 모드에서 분식 카테고리 제외 필요'
        });
        failCount++;
      }
      passCount++;
    }

    if (mood === 'sad') {
      // 우울할 때: mood=great/exciting fallback 확인
      const tagOnly = matched.filter(r => r.mood?.includes('sad'));
      const comfortFallback = matched.filter(r => 
        !r.mood?.includes('sad') && (r.mood?.includes('great') || r.mood?.includes('exciting'))
      );
      const categoryFallback = matched.filter(r => {
        if (r.mood?.includes('sad') || r.mood?.includes('great') || r.mood?.includes('exciting')) return false;
        const cat = r.category || '';
        return cat.includes('디저트') || cat.includes('카페') || cat.includes('빵') ||
          cat.includes('떡볶이') || cat.includes('치킨') || cat.includes('파스타') || cat.includes('라멘');
      });
      console.log(`     태그: ${tagOnly.length}, great/exciting: ${comfortFallback.length}, 카테고리: ${categoryFallback.length}`);
      passCount++;
    }
  }

  // ============================================================
  // 테스트 3: 식단(Diet) 하드 필터 정확도
  // ============================================================
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📌 테스트 3: 식단(Diet) 하드필터 정확도`);
  console.log(`${'─'.repeat(60)}`);

  const dietOptions = ['nodiet', 'light', 'diet', 'vegetarian'];
  for (const diet of dietOptions) {
    const matched = restaurantDB.filter(r => matchDiet(r, diet));
    console.log(`\n  🥗 diet=${diet}: ${matched.length}개 매칭`);

    if (diet === 'vegetarian') {
      // 채식: diet 태그에 'vegetarian'이 있는 식당만 매칭되어야 함
      for (const r of matched) {
        if (!r.diet?.includes('vegetarian')) {
          bugs.push({
            type: 'DIET_VEGETARIAN_LEAK',
            severity: 'CRITICAL',
            detail: `채식(vegetarian) 필터에 비채식 식당 누출: "${r.name}" (diet: ${r.diet?.join(',')})`,
            fix: '하드필터 로직 확인 필요'
          });
          failCount++;
        }
        // 채식 태그가 있지만 실제 메뉴에 고기가 들어있는지 확인
        const menuText = (r.menus || []).join(' ');
        if (/삼겹|갈비|돈까스|치킨|소고기|한우|돼지|훈제오리|제육/.test(menuText)) {
          bugs.push({
            type: 'DIET_VEGETARIAN_DATA_ERROR',
            severity: 'HIGH',
            detail: `채식(vegetarian) 태그인데 고기 메뉴: "${r.name}" (메뉴: ${menuText.substring(0, 60)})`,
            fix: 'restaurantData.js에서 해당 식당 diet 태그 수정 필요'
          });
          failCount++;
        }
      }
      passCount++;
    }

    if (diet === 'diet') {
      // 다이어트: diet 또는 light 태그
      for (const r of matched) {
        if (!r.diet?.includes('diet') && !r.diet?.includes('light')) {
          bugs.push({
            type: 'DIET_FILTER_LEAK',
            severity: 'CRITICAL',
            detail: `다이어트(diet) 필터에 비매칭 식당: "${r.name}" (diet: ${r.diet?.join(',')})`,
            fix: '하드필터 로직 확인'
          });
          failCount++;
        }
        // 고칼로리인데 다이어트 태그가 있는 곳 확인
        if (r.calorie?.label === '고칼로리') {
          warnings.push(`⚠️ 다이어트 태그인데 고칼로리: "${r.name}" (${r.category})`);
        }
      }
      passCount++;
    }
  }

  // ============================================================
  // 테스트 4: 인원수(People) 매칭 정확도
  // ============================================================
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📌 테스트 4: 인원수(People) 매칭 정확도`);
  console.log(`${'─'.repeat(60)}`);

  const peopleOptions = [1, 2, 4, 7, 8];
  for (const people of peopleOptions) {
    const matched = restaurantDB.filter(r => matchPeople(r, people));
    let cat;
    if (people === 1) cat = 'solo';
    else if (people <= 3) cat = 'small';
    else if (people <= 6) cat = 'medium';
    else cat = 'large';
    console.log(`  👥 people=${people} (${cat}): ${matched.length}개 매칭`);
    
    // 7명 이상인데 solo만 지원하는 식당이 매칭되면 안 됨
    if (people >= 7) {
      const soloOnly = matched.filter(r => 
        r.people?.length === 1 && r.people[0] === 'solo'
      );
      for (const r of soloOnly) {
        bugs.push({
          type: 'PEOPLE_MISMATCH',
          severity: 'HIGH',
          detail: `7명+ 인원수에 혼밥 전용 식당 매칭: "${r.name}" (people: ${r.people?.join(',')})`,
          fix: 'matchPeople 인접 매칭이 너무 넓음'
        });
        failCount++;
      }
    }
    
    // 혼밥인데 large만 지원하는 식당이 매칭되면 의심
    if (people === 1) {
      const largeOnly = matched.filter(r => 
        r.people?.length === 1 && r.people[0] === 'large'
      );
      for (const r of largeOnly) {
        bugs.push({
          type: 'PEOPLE_MISMATCH',
          severity: 'HIGH',
          detail: `혼밥에 단체 전용 식당 매칭: "${r.name}" (people: ${r.people?.join(',')})`,
          fix: 'matchPeople 인접 매칭이 너무 넓음'
        });
        failCount++;
      }
    }
    passCount++;
  }

  // ============================================================
  // 테스트 5: 예산(Budget) 매칭 정확도
  // ============================================================
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📌 테스트 5: 예산(Budget) 매칭 정확도`);
  console.log(`${'─'.repeat(60)}`);

  const budgetOptions = [8000, 10000, 12000, 15000, 20000, 30000, 50000];
  for (const budget of budgetOptions) {
    const matched = restaurantDB.filter(r => matchBudget(r, budget));
    console.log(`  💰 budget=${budget.toLocaleString()}원: ${matched.length}개 매칭`);
    
    // 예산이 8000원인데 2만원+ 식당이 매칭되면 안 됨
    for (const r of matched) {
      const parsed = parsePriceRange(r);
      if (parsed) {
        const tolerance = Math.max(2000, budget * 0.15);
        if (parsed.min > budget + tolerance) {
          bugs.push({
            type: 'BUDGET_MISMATCH',
            severity: 'HIGH',
            detail: `예산 ${budget.toLocaleString()}원에 최소 ${parsed.min.toLocaleString()}원 식당 매칭: "${r.name}" (${r.price || r.priceNote}). tolerance=${tolerance}`,
            fix: 'matchBudget 로직 확인 필요'
          });
          failCount++;
        }
      }
    }
    
    // 가격 파싱 실패 식당 확인
    const unparsed = restaurantDB.filter(r => !parsePriceRange(r));
    if (budget === 15000 && unparsed.length > 0) {
      console.log(`\n  ⚠️ 가격 파싱 실패 식당: ${unparsed.length}개`);
      for (const r of unparsed) {
        bugs.push({
          type: 'PRICE_PARSE_FAIL',
          severity: 'MEDIUM',
          detail: `가격 파싱 불가: "${r.name}" (price: "${r.price}", priceNote: "${r.priceNote}")`,
          fix: '가격 형식 수정 또는 파서 보강 필요'
        });
        failCount++;
      }
    }
    passCount++;
  }

  // ============================================================
  // 테스트 6: 주요 시나리오별 통합 추천 시뮬레이션
  // ============================================================
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📌 테스트 6: KT 직원 시나리오별 통합 추천`);
  console.log(`${'─'.repeat(60)}`);

  const scenarios = [
    { name: "더운 날 + 혼밥 + 가벼운 식사", selections: { weather: 'hot', mood: 'safe', diet: 'light', people: 1, budget: 12000 } },
    { name: "추운 날 + 든든하게 + 팀점심", selections: { weather: 'cold', mood: 'hearty', diet: 'nodiet', people: 4, budget: 15000 } },
    { name: "비 오는 날 + 해장 + 2명", selections: { weather: 'rainy', mood: 'hangover', diet: 'nodiet', people: 2, budget: 10000 } },
    { name: "선선한 날 + 임원 접대 + 2만원+", selections: { weather: 'mild', mood: 'executive', diet: 'nodiet', people: 4, budget: 30000 } },
    { name: "더운 날 + 채식 선호 + 혼밥", selections: { weather: 'hot', mood: 'safe', diet: 'vegetarian', people: 1, budget: 15000 } },
    { name: "추운 날 + 스트레스 + 2명", selections: { weather: 'cold', mood: 'stressed', diet: 'nodiet', people: 2, budget: 15000 } },
    { name: "비 오는 날 + 우울해요 + 3명", selections: { weather: 'rainy', mood: 'sad', diet: 'nodiet', people: 3, budget: 15000 } },
    { name: "선선한 날 + 팀점심 7명 + 예산 제한", selections: { weather: 'mild', mood: 'team', diet: 'nodiet', people: 7, budget: 15000 } },
    { name: "더운 날 + 다이어트 + 1만원", selections: { weather: 'hot', mood: 'safe', diet: 'diet', people: 2, budget: 10000 } },
    { name: "추운 날 + 신나는 날 + 8명", selections: { weather: 'cold', mood: 'exciting', diet: 'nodiet', people: 8, budget: 20000 } },
    { name: "비 오는 날 + 가볍게 + 혼밥 + 8천원", selections: { weather: 'rainy', mood: 'safe', diet: 'light', people: 1, budget: 8000 } },
    { name: "더운 날 + 해장 + 채식", selections: { weather: 'hot', mood: 'hangover', diet: 'vegetarian', people: 2, budget: 15000 } },
    { name: "추운 날 + 든든하게 + 다이어트 (모순)", selections: { weather: 'cold', mood: 'hearty', diet: 'diet', people: 2, budget: 15000 } },
    { name: "선선한 날 + 무난하게 + 5만원 예산", selections: { weather: 'mild', mood: 'safe', diet: 'nodiet', people: 2, budget: 50000 } },
  ];

  for (const scenario of scenarios) {
    const result = simulateRecommendation(scenario.selections);
    const { weather, mood, diet, people, budget } = scenario.selections;
    
    console.log(`\n  🎯 "${scenario.name}"`);
    console.log(`     조건: W=${weather}, M=${mood}, D=${diet}, P=${people}, B=${budget.toLocaleString()}`);
    console.log(`     결과: tier1=${result.tier1.length}, tier2=${result.tier2.length}, tier3=${result.tier3.length}, 총=${result.totalCandidates}`);
    
    if (result.totalCandidates === 0) {
      bugs.push({
        type: 'NO_RESULTS',
        severity: 'HIGH',
        detail: `"${scenario.name}" — 결과 0개! 조건: W=${weather}, M=${mood}, D=${diet}, P=${people}, B=${budget}`,
        fix: '조건 조합에 대한 최소 매칭 보장 필요'
      });
      failCount++;
    } else if (result.totalCandidates < 3) {
      warnings.push(`⚠️ "${scenario.name}" — 결과 ${result.totalCandidates}개로 매우 적음`);
    }

    // TOP 10 분석
    if (result.top10.length > 0) {
      const top3 = result.top10.slice(0, 3);
      for (const r of top3) {
        // 각 조건 1매칭도 안 되면 매우 나쁜 추천
        if (r.matchCount <= 1) {
          bugs.push({
            type: 'LOW_MATCH_IN_TOP3',
            severity: 'HIGH',
            detail: `"${scenario.name}" TOP3에 ${r.matchCount}매칭 식당: "${r.name}" (${r.category})`,
            fix: '매칭 수가 너무 낮은 식당이 TOP3에 오면 안 됨'
          });
          failCount++;
        }
        
        // 식단 필터 위반 확인
        if (diet !== 'nodiet' && !r.dietMatched) {
          bugs.push({
            type: 'DIET_FILTER_VIOLATION',
            severity: 'CRITICAL',
            detail: `"${scenario.name}" TOP3에 식단 미매칭: "${r.name}" (diet=${diet}, 식당diet: ${r.diet?.join(',')})`,
            fix: '식단 하드필터가 제대로 동작하지 않음'
          });
          failCount++;
        }
      }
      
      // Top 10 식당 목록 (상위 5개만 표시)
      const top5 = result.top10.slice(0, 5);
      for (const r of top5) {
        const matchLabels = [];
        if (r.matches[0]) matchLabels.push('W');
        if (r.matches[1]) matchLabels.push('M');
        if (r.matches[2]) matchLabels.push('P');
        if (r.matches[3]) matchLabels.push('D');
        if (r.matches[4]) matchLabels.push('B');
        console.log(`     ${matchLabels.length === 5 ? '✅' : '⚠️'}  #${top5.indexOf(r)+1} "${r.name}" (${r.category}) — ${matchLabels.join('+')} [${r.matchCount}/5]`);
      }
    }
    passCount++;
  }

  // ============================================================
  // 테스트 7: 데이터 무결성
  // ============================================================
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📌 테스트 7: 식당 데이터 무결성 검사`);
  console.log(`${'─'.repeat(60)}`);

  for (const r of restaurantDB) {
    // 필수 필드 확인
    if (!r.name) { bugs.push({ type: 'DATA_MISSING_NAME', severity: 'CRITICAL', detail: `이름 없는 식당 발견` }); failCount++; }
    if (!r.category) { bugs.push({ type: 'DATA_MISSING_CATEGORY', severity: 'HIGH', detail: `${r.name}: category 없음` }); failCount++; }
    if (!r.weather || !Array.isArray(r.weather) || r.weather.length === 0) {
      bugs.push({ type: 'DATA_MISSING_WEATHER', severity: 'HIGH', detail: `${r.name}: weather 태그 없음` }); failCount++;
    }
    if (!r.mood || !Array.isArray(r.mood) || r.mood.length === 0) {
      bugs.push({ type: 'DATA_MISSING_MOOD', severity: 'HIGH', detail: `${r.name}: mood 태그 없음` }); failCount++;
    }
    if (!r.people || !Array.isArray(r.people) || r.people.length === 0) {
      bugs.push({ type: 'DATA_MISSING_PEOPLE', severity: 'HIGH', detail: `${r.name}: people 태그 없음` }); failCount++;
    }
    if (!r.diet || !Array.isArray(r.diet) || r.diet.length === 0) {
      bugs.push({ type: 'DATA_MISSING_DIET', severity: 'HIGH', detail: `${r.name}: diet 태그 없음` }); failCount++;
    }
    
    // rating 유효성
    const rating = parseFloat(r.rating);
    if (isNaN(rating) || rating < 0 || rating > 5) {
      bugs.push({ type: 'DATA_INVALID_RATING', severity: 'MEDIUM', detail: `${r.name}: 잘못된 rating "${r.rating}"` }); failCount++;
    }
    
    // 가격 파싱 가능 여부
    const parsed = parsePriceRange(r);
    if (!parsed) {
      bugs.push({ type: 'DATA_UNPARSEABLE_PRICE', severity: 'MEDIUM', detail: `${r.name}: 가격 파싱 불가 (price="${r.price}", priceNote="${r.priceNote}")` }); failCount++;
    }
    
    // mood 태그 유효값 확인
    const validMoods = ['safe', 'hearty', 'executive', 'hangover', 'team', 'exciting', 'sad', 'stressed', 'great'];
    if (r.mood) {
      for (const m of r.mood) {
        if (!validMoods.includes(m)) {
          bugs.push({ type: 'DATA_INVALID_MOOD', severity: 'MEDIUM', detail: `${r.name}: 유효하지 않은 mood 태그 "${m}"` }); failCount++;
        }
      }
    }
    
    // weather 태그 유효값 확인
    const validWeathers = ['hot', 'mild', 'cold', 'rainy'];
    if (r.weather) {
      for (const w of r.weather) {
        if (!validWeathers.includes(w)) {
          bugs.push({ type: 'DATA_INVALID_WEATHER', severity: 'MEDIUM', detail: `${r.name}: 유효하지 않은 weather 태그 "${w}"` }); failCount++;
        }
      }
    }
    
    // people 태그 유효값 확인
    const validPeople = ['solo', 'small', 'medium', 'large'];
    if (r.people) {
      for (const p of r.people) {
        if (!validPeople.includes(p)) {
          bugs.push({ type: 'DATA_INVALID_PEOPLE', severity: 'MEDIUM', detail: `${r.name}: 유효하지 않은 people 태그 "${p}"` }); failCount++;
        }
      }
    }
    
    // diet 태그 유효값 확인
    const validDiets = ['nodiet', 'light', 'diet', 'vegetarian'];
    if (r.diet) {
      for (const d of r.diet) {
        if (!validDiets.includes(d)) {
          bugs.push({ type: 'DATA_INVALID_DIET', severity: 'MEDIUM', detail: `${r.name}: 유효하지 않은 diet 태그 "${d}"` }); failCount++;
        }
      }
    }

    // budget 태그 유효값 확인
    const validBudgets = ['cheap', 'normal', 'expensive'];
    if (r.budget) {
      for (const b of r.budget) {
        if (!validBudgets.includes(b)) {
          bugs.push({ type: 'DATA_INVALID_BUDGET', severity: 'MEDIUM', detail: `${r.name}: 유효하지 않은 budget 태그 "${b}"` }); failCount++;
        }
      }
    }
  }
  console.log(`  ✅ ${restaurantDB.length}개 식당 데이터 무결성 검사 완료`);
  passCount++;

  // ============================================================
  // 테스트 8: 특정 의심 로직 테스트
  // ============================================================
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📌 테스트 8: 특정 의심 로직 테스트`);
  console.log(`${'─'.repeat(60)}`);

  // 8a: matchMood hangover에서 '국' 단일 글자 매칭 문제
  console.log(`\n  8a: hangover '국' 과대 매칭 테스트`);
  const hangoverMatched = restaurantDB.filter(r => matchMood(r, 'hangover'));
  const hangoverByCategory = hangoverMatched.filter(r => {
    const hasMoodTag = r.mood?.includes('hangover');
    if (hasMoodTag) return false;
    return r.category?.includes('국');
  });
  for (const r of hangoverByCategory) {
    // '국'이 들어가지만 실제로 국밥/해장국이 아닌 것들
    const cat = r.category;
    if (!cat.includes('국밥') && !cat.includes('국물') && !cat.includes('해장')) {
      // '왕국', '한국', '중국' 등의 식당명에도 '국'이 들어갈 수 있음
      console.log(`  ⚠️  hangover '국' 매칭 의심: "${r.name}" (${cat})`);
    }
  }
  passCount++;

  // 8b: matchWeather rainy에서 '전' 단일 글자 매칭 문제 (상세)
  console.log(`\n  8b: rainy '전' 과대 매칭 상세 테스트`);
  const rainyMatched = restaurantDB.filter(r => matchWeather(r, 'rainy'));
  const rainyNoTag = rainyMatched.filter(r => !r.weather?.includes('rainy'));
  for (const r of rainyNoTag) {
    const text = ((r.category || '') + ' ' + (r.menus || []).join(' ')).toLowerCase();
    // '전'으로 매칭됐는지 확인
    if (/전/.test(text) && !/파전|해물전|녹두전|감자전|전골|전문|전주|부침|수제비|칼국수|국밥|짬뽕|냉면|콩국수|물회|냉모밀|빙수|샐러드|냉채/.test(text)) {
      // 다른 패턴으로 매칭된 건 아닌지 확인
      const otherPatterns = /수제비|칼국수|국밥|짬뽕/.test(text);
      if (!otherPatterns) {
        console.log(`  🐛 rainy '전' 잘못 매칭: "${r.name}" (${r.category})`);
        const contextMatch = text.match(/.{0,8}전.{0,8}/g);
        console.log(`     컨텍스트: ${contextMatch?.join(' | ')}`);
      }
    }
  }
  passCount++;

  // 8c: stressed에서 mood=great/hearty fallback으로 너무 많은 식당 매칭
  console.log(`\n  8c: stressed=great/hearty fallback 범위 분석`);
  const stressedMatched = restaurantDB.filter(r => matchMood(r, 'stressed'));
  const stressedByComfort = stressedMatched.filter(r => {
    const hasMoodTag = r.mood?.includes('stressed');
    const category = r.category || '';
    const menuText = (r.menus || []).join(' ');
    const isStressRelief = category.includes('구이') || category.includes('매운') ||
      category.includes('불') || category.includes('마라') ||
      category.includes('떡볶이') || category.includes('닭갈비') ||
      category.includes('곱창') || category.includes('삼겹');
    const hasSpicyMenu = /매운|불닭|마라|떡볶이|쭈꾸미|닭발|엽기/.test(menuText);
    return !hasMoodTag && !isStressRelief && !hasSpicyMenu;
  });
  console.log(`  전체 stressed 매칭: ${stressedMatched.length}개`);
  console.log(`  태그 매칭: ${stressedMatched.filter(r => r.mood?.includes('stressed')).length}개`);
  console.log(`  great/hearty fallback: ${stressedByComfort.length}개`);
  if (stressedByComfort.length > 0) {
    console.log(`  fallback 식당 목록:`);
    for (const r of stressedByComfort) {
      console.log(`    - "${r.name}" (${r.category}) — mood: [${r.mood?.join(',')}]`);
    }
  }
  passCount++;

  // 8d: hearty에서 고칼로리로만 매칭되는 비식사 류 확인
  console.log(`\n  8d: hearty 고칼로리 fallback 중 비식사류 확인`);
  const heartyMatched = restaurantDB.filter(r => matchMood(r, 'hearty'));
  const heartyByCalorie = heartyMatched.filter(r => {
    const hasMoodTag = r.mood?.includes('hearty');
    const category = r.category || '';
    const isHearty = category.includes('구이') || category.includes('갈비') || 
      category.includes('삼겹') || category.includes('돈까스') || category.includes('카츠') ||
      category.includes('육') || category.includes('불고기') || category.includes('곱창');
    return !hasMoodTag && !isHearty && r.calorie?.label === '고칼로리';
  });
  if (heartyByCalorie.length > 0) {
    console.log(`  고칼로리로만 hearty 매칭된 식당: ${heartyByCalorie.length}개`);
    for (const r of heartyByCalorie) {
      console.log(`    - "${r.name}" (${r.category}) — calorie: ${r.calorie?.label}`);
    }
  }
  passCount++;

  // 8e: 'safe' mood에 매칭되는 식당 수 확인 (가장 기본적인 선택)
  console.log(`\n  8e: safe mood 매칭 분석`);
  const safeMatched = restaurantDB.filter(r => matchMood(r, 'safe'));
  console.log(`  safe 매칭: ${safeMatched.length}개 (mood 태그에 'safe' 포함)`);
  passCount++;

  // ============================================================
  // 테스트 9: 전체 조합 매트릭스 (간이)
  // ============================================================
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📌 테스트 9: Weather × Mood 전체 조합 결과 수`);
  console.log(`${'─'.repeat(60)}`);

  console.log(`\n  ${''.padEnd(12)}  ${weatherOptions.map(w => w.padEnd(8)).join('')}`);
  for (const mood of moodOptions) {
    const row = [mood.padEnd(12)];
    for (const weather of weatherOptions) {
      const result = simulateRecommendation({ weather, mood, diet: 'nodiet', people: 2, budget: 15000 });
      const count = result.totalCandidates;
      const marker = count === 0 ? '❌' : count < 5 ? '⚠️' : '✅';
      row.push(`${marker}${String(count).padStart(3)} `.padEnd(8));
    }
    console.log(`  ${row.join('')}`);
  }
  passCount++;

  // 채식 + 모든 mood
  console.log(`\n  📌 채식 필터 + 모든 mood 조합:`);
  for (const mood of moodOptions) {
    const result = simulateRecommendation({ weather: 'mild', mood, diet: 'vegetarian', people: 2, budget: 15000 });
    const marker = result.totalCandidates === 0 ? '❌' : result.totalCandidates < 3 ? '⚠️' : '✅';
    console.log(`  ${marker} vegetarian + ${mood}: ${result.totalCandidates}개 (tier1=${result.tier1.length})`);
    if (result.totalCandidates === 0) {
      bugs.push({
        type: 'ZERO_RESULTS_COMBO',
        severity: 'HIGH',
        detail: `채식 + ${mood} 조합에서 결과 0개 (weather=mild, people=2, budget=15000)`,
        fix: '채식 식당에 mood 태그 보강 또는 fallback 추가 필요'
      });
      failCount++;
    }
  }
  passCount++;

  // 다이어트 + 모든 mood
  console.log(`\n  📌 다이어트 필터 + 모든 mood 조합:`);
  for (const mood of moodOptions) {
    const result = simulateRecommendation({ weather: 'mild', mood, diet: 'diet', people: 2, budget: 15000 });
    const marker = result.totalCandidates === 0 ? '❌' : result.totalCandidates < 3 ? '⚠️' : '✅';
    console.log(`  ${marker} diet + ${mood}: ${result.totalCandidates}개 (tier1=${result.tier1.length})`);
    if (result.totalCandidates === 0) {
      bugs.push({
        type: 'ZERO_RESULTS_COMBO',
        severity: 'HIGH',
        detail: `다이어트 + ${mood} 조합에서 결과 0개`,
        fix: '다이어트 식당에 mood 태그 보강 필요'
      });
      failCount++;
    }
  }
  passCount++;

  // ============================================================
  // 테스트 10: 가격별 + 인원별 결과 확인
  // ============================================================
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📌 테스트 10: Budget × People 매트릭스`);
  console.log(`${'─'.repeat(60)}`);
  
  const budgetTest = [8000, 12000, 15000, 20000, 30000];
  const peopleTest = [1, 2, 4, 7];
  
  console.log(`\n  ${''.padEnd(10)}  ${budgetTest.map(b => `${(b/1000)}k`.padEnd(8)).join('')}`);
  for (const p of peopleTest) {
    const row = [`P=${p}`.padEnd(10)];
    for (const b of budgetTest) {
      const result = simulateRecommendation({ weather: 'mild', mood: 'safe', diet: 'nodiet', people: p, budget: b });
      const count = result.totalCandidates;
      const marker = count === 0 ? '❌' : count < 5 ? '⚠️' : '✅';
      row.push(`${marker}${String(count).padStart(3)} `.padEnd(8));
    }
    console.log(`  ${row.join('')}`);
  }
  passCount++;

  // ============================================================
  // 최종 결과
  // ============================================================
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  📊 최종 테스트 결과`);
  console.log(`${'='.repeat(70)}`);
  console.log(`\n  ✅ PASS: ${passCount}`);
  console.log(`  ❌ FAIL: ${failCount}`);
  console.log(`  ⚠️ WARN: ${warnings.length}`);
  
  if (bugs.length > 0) {
    console.log(`\n  ${'─'.repeat(60)}`);
    console.log(`  🐛 발견된 버그/문제점 목록 (${bugs.length}개)`);
    console.log(`  ${'─'.repeat(60)}`);
    
    // 심각도별 정렬
    const severityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    bugs.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));
    
    for (let i = 0; i < bugs.length; i++) {
      const bug = bugs[i];
      const icon = bug.severity === 'CRITICAL' ? '🔴' : bug.severity === 'HIGH' ? '🟠' : '🟡';
      console.log(`\n  ${icon} [${bug.severity}] ${bug.type}`);
      console.log(`     ${bug.detail}`);
      if (bug.fix) console.log(`     💡 수정: ${bug.fix}`);
    }
  }
  
  if (warnings.length > 0) {
    console.log(`\n  ${'─'.repeat(60)}`);
    console.log(`  ⚠️ 경고 목록 (${warnings.length}개)`);
    console.log(`  ${'─'.repeat(60)}`);
    for (const w of warnings) {
      console.log(`  ${w}`);
    }
  }

  console.log(`\n${'='.repeat(70)}\n`);
}

runTests().catch(console.error);
