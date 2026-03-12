---
name: integration-test-debug
description: 'KT 점심 추천기 통합 테스트 및 디버깅. Use when: 추천 알고리즘 검증, 식단 필터 테스트, 재추천 로직 테스트, 매칭 시뮬레이션, 점수 계산 확인, 엣지케이스 디버깅, 추천 결과 정확도 검증. Triggers: 테스트, 디버깅, 시뮬레이션, 검증, 확인, 추천이 이상해요, 잘못 추천'
argument-hint: '테스트할 시나리오 (예: 채식 추천, 다이어트 재추천, 비오는날 혼밥)'
---

# 통합 테스트 실행 및 디버깅

KT 광화문 점심 추천기의 추천 알고리즘, 필터 로직, 재추천 메커니즘을 체계적으로 검증하고 버그를 발견·수정하는 워크플로우.

## When to Use

- 추천 알고리즘 변경 후 정확도 검증
- 특정 조건(채식/다이어트/해장 등)의 추천 결과 확인
- "다른 맛집 추천받기" 재추천 로직 테스트
- 점수 계산 로직(scoring) 밸런스 점검
- 사용자가 "추천이 이상해요" 신고 시 원인 분석
- 새 식당 데이터 추가 후 태그 정합성 검증

## Procedure

### Phase 1: 코드 분석 (Explore 서브에이전트)

Explore 서브에이전트를 사용하여 현재 알고리즘 상태를 파악합니다.

```
서브에이전트 호출 예시:
- "App.js의 matchDiet, matchWeather, matchMood 함수 분석해줘"
- "scoring 로직에서 totalScore 계산 과정 전체 분석"
- "recentSeen 메커니즘과 재추천 흐름 분석"
```

**확인 항목:**
1. 매칭 함수들 (matchWeather, matchMood, matchPeople, matchDiet, matchBudget)
2. 점수 계산 (totalScore 보너스/패널티 항목별 가중치)
3. 티어 필터링 (tier1/2/3 → 글로벌 정렬)
4. MMR 다양성 알고리즘 (lambda, similarity 계산)
5. recentSeen 제외 로직과 소진 시 폴백

### Phase 2: 시뮬레이션 테스트

[시뮬레이션 스크립트](./scripts/simulate-recommendations.js)를 실행하여 다양한 시나리오를 자동 검증합니다.

```bash
node .github/skills/integration-test-debug/scripts/simulate-recommendations.js
```

**필수 테스트 시나리오:**

| # | 시나리오 | 조건 | 검증 포인트 |
|---|---------|------|------------|
| 1 | 채식 추천 | vegetarian, mild, safe, solo, 15000 | 비채식 식당 미포함 확인 |
| 2 | 다이어트 추천 | diet, hot, safe, solo, 12000 | 고칼로리 식당 순위 낮은지 확인 |
| 3 | 가볍게 추천 | light, mild, safe, small, 13000 | seafood 미포함 확인 |
| 4 | 혼밥 추천 | nodiet, mild, safe, solo, 10000 | solo/small 태그 식당만 |
| 5 | 단체 추천 | nodiet, mild, team, large, 20000 | medium/large 태그 식당 |
| 6 | 해장 추천 | nodiet, cold, hangover, small, 12000 | 국밥/탕 카테고리 우선 |
| 7 | 비오는 날 | nodiet, rainy, safe, small, 15000 | 근거리 + 국물 메뉴 우선 |
| 8 | 재추천 연속 | 위 시나리오에서 3회 연속 | 중복 없음, 소진 시 초기화 |
| 9 | 예산 극단 | nodiet, mild, safe, solo, 8000 | cheap 태그 식당 최우선 |
| 10 | 격식있는 | nodiet, mild, executive, medium, 30000 | ribbon/expensive 우선 |

### Phase 3: 결과 검증

각 시나리오에 대해 다음을 확인합니다:

**3-1. 필수 필터 검증 (Hard Filter)**
```
✅ 식단 필터: vegetarian/diet/light 선택 시 해당 태그 없는 식당 완전 제외
✅ 티어 필터: matchCount >= 2인 식당만 후보
✅ 재추천: recentSeen에 있는 식당 완전 제외
```

**3-2. 점수 밸런스 검증 (Soft Score)**
```
- matchCount * 20: 조건당 20점 (최대 100점)
- rating * 2: 평점 보너스 (최대 10점)
- ribbon: 블루리본 +10점
- budgetProximity: -10 ~ +8점
- dietCalorie: -3 ~ +6점
- timeContext: 가변 (피크타임/요일/날씨/계절/거리)
- feedback: ±25점
- personalization: -15 ~ +8점
```

**3-3. 다양성 검증**
```
- Top 10에 같은 cuisine이 5개 이상이면 ⚠️
- 같은 브랜드 중복 없는지 확인
- MMR이 가격대/카테고리/거리를 다양화하는지 확인
```

### Phase 4: 버그 수정

문제 발견 시 다음 절차를 따릅니다:

1. **문제 재현**: 정확한 조건(weather/mood/people/diet/budget)으로 시뮬레이션
2. **근본 원인 분석**: 매칭 함수? 점수 계산? 필터링? 데이터?
3. **수정 적용**: `multi_replace_string_in_file`로 일괄 수정
4. **빌드 검증**: `npx react-scripts build`로 컴파일 오류 확인
5. **회귀 테스트**: 시뮬레이션 전체 재실행으로 다른 시나리오 영향 없음 확인

### Phase 5: 데이터 정합성 점검

식당 데이터(restaurantDB)의 태그 품질을 검증합니다:

```
확인 항목:
- 저칼로리인데 vegetarian 태그 없는 샐러드/포케 식당
- 해산물인데 seafood 태그 없는 식당  
- 혼밥 가능한데 solo 태그 없는 식당
- 가격 파싱 실패하는 price 포맷 ("~만원", "1.5~2만원" 등)
- coords 누락으로 거리 계산 불가능한 식당
```

## 핵심 디버깅 체크리스트

```
□ matchDiet에서 vegetarian 선택 시 diet/light 태그만 있는 식당이 빠지지 않나?
□ matchBudget의 tolerance가 너무 느슨/엄격하지 않나?
□ getFeedbackScore의 가중치가 대칭적인가? (like/dislike)
□ getTimeContextScore가 현재 시간/요일/계절에 맞게 동작하나?
□ recentSeen 초기화 로직이 handleReset에서 동작하나?
□ 후보 < 3개 시 제외 목록 자동 초기화되나?
□ recycleNotice 메시지가 사용자에게 표시되나?
□ parsePriceRange가 "1.5~2만원" 포맷을 처리하나?
□ MMR lambda가 후보 수에 따라 동적 조정되나?
□ 글로벌 정렬에서 tierBonus가 적절히 적용되나?
```

## 빈출 버그 패턴

| 패턴 | 증상 | 원인 | 해결 |
|------|------|------|------|
| 필수 필터 우회 | 채식인데 고기집 추천 | diet 필수 필터 없이 matchCount만으로 티어링 | `dietMatched` 플래그로 사전 필터 |
| 비대칭 가중치 | 싫어요가 좋아요보다 강력 | like +20 vs dislike -30 | ±25로 정규화 |
| 소진 막힘 | 재추천 시 빈 결과 | recentSeen이 모든 후보 제거 | 후보 < 3 시 자동 초기화 |
| 리셋 불완전 | 처음으로 눌러도 이전 식당 제외 | handleReset에서 recentSeen 미초기화 | `recentSeen.current = []` 추가 |
| 파싱 실패 | 예산 매칭 0개 | "1.5~2만원" 미지원 | 만원 범위 regex 추가 |
