import { useState, useEffect } from "react";

// ✅ KT West(세종대로 178) & East(종로3길 33) 빌딩 반경 700m 실제 맛집 데이터
// 예산 기준: cheap=~1만원 / normal=1~2만원 / expensive=2만원 이상 (1인 기준)
const restaurantDB = [
  {
    name: "파이프 그라운드 광화문",
    category: "이탈리안 · 피자/파스타",
    menus: ["옥수수 피자 26,000원", "화이트 라구 파스타 25,000원", "시저샐러드 14,000원"],
    price: "21,000~45,000원",
    priceNote: "1인 평균 2~3만원",
    walk: "KT West 지하 1층 (도보 1분)",
    rating: "4.9",
    ribbon: true,
    diet: ["nodiet"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal","tired"],
    people: ["solo","small","medium"],
    budget: ["expensive"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "KT West 건물 지하 바로! 블루리본·네이버 4.9. 옥수수피자 시그니처. 점심엔 웨이팅 필수.",
    naver: "https://map.naver.com/v5/search/파이프그라운드+광화문",
    reservation: [
      { label: "캐치테이블", url: "https://app.catchtable.co.kr/ct/shop/maison_pipeground", color: "#FF6B35" },
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/파이프그라운드+광화문", color: "#03C75A" },
    ]
  },
  {
    name: "무탄 광화문점",
    category: "중식 · 프리미엄 짜장/유린기",
    menus: ["스테이크 트러플 자장면 30,000원", "고추 유린기 40,000원", "마카롱 멘보샤 22,000원"],
    price: "22,000~40,000원",
    priceNote: "1인 평균 3~4만원",
    walk: "도보 5분",
    rating: "4.9",
    ribbon: true,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild","hot"],
    mood: ["great","stressed","normal"],
    people: ["solo","small","medium"],
    budget: ["expensive"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "블루리본·4.9★. 흑백요리사2 출연 셰프의 한우 트러플 자장면. 특별한 날이나 스트레스 풀기 최고.",
    naver: "https://map.naver.com/v5/search/무탄+광화문점",
    reservation: [
      { label: "캐치테이블", url: "https://app.catchtable.co.kr/ct/shop/mutan_gwanghwamoon", color: "#FF6B35" },
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/무탄+광화문점", color: "#03C75A" },
    ]
  },
  {
    name: "뉴로미엔관 광화문점",
    category: "중식 · 우육면/만두",
    menus: ["우육면 13,000원", "군만두 8,000원", "탕면 13,000원"],
    price: "13,000~18,000원",
    priceNote: "1인 평균 1.5만원",
    walk: "도보 6분",
    rating: "4.7",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","stressed","normal"],
    people: ["solo","small"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "4.7★ 진한 소고기 육수 우육면 전문점. 추운 날 국물 생각날 때 딱. 군만두 같이 주문 필수.",
    naver: "https://map.naver.com/v5/search/뉴로미엔관+광화문",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/뉴로미엔관+광화문", color: "#03C75A" },
    ]
  },
  {
    name: "광화문 석갈비 디타워점",
    category: "한식 · 갈비/구이",
    menus: ["돼지 석갈비 18,000원", "냉면 13,000원", "갈비탕 15,000원"],
    price: "13,000~22,000원",
    priceNote: "1인 평균 1.5~2만원",
    walk: "KT East 인접 디타워 3층 (도보 2분)",
    rating: "4.6",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold","rainy","hot"],
    mood: ["great","normal","stressed"],
    people: ["small","medium"],
    budget: ["normal","expensive"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "KT East 바로 옆 디타워! 4.6★ 광화문 직장인 단골 갈비집. 회식 때 무조건 인정받는 곳.",
    naver: "https://map.naver.com/v5/search/광화문석갈비+디타워",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/광화문석갈비+디타워", color: "#03C75A" },
    ]
  },
  {
    name: "이치규 광화문점",
    category: "일식 · 규카츠",
    menus: ["채끝 규카츠 19,000원", "안심 규카츠 23,000원", "미니카레 5,000원"],
    price: "19,000~23,000원",
    priceNote: "1인 평균 2만원",
    walk: "도보 5분 (르메이에르종로타운 지하1층)",
    rating: "4.9",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold","rainy","hot"],
    mood: ["great","normal","tired"],
    people: ["solo","small"],
    budget: ["expensive"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "4.9★ 1인 1화로 직화 규카츠 전문점. 채끝 19,000·안심 23,000원. 점심 피크 웨이팅 필수.",
    naver: "https://map.naver.com/v5/search/이치규+광화문점",
    reservation: [
      { label: "캐치테이블", url: "https://app.catchtable.co.kr/ct/shop/ichigyu_gwanghwamun", color: "#FF6B35" },
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/이치규+광화문점", color: "#03C75A" },
    ]
  },
  {
    name: "일품 광화문점",
    category: "일식 · 카이센동/스시",
    menus: ["카이센동 18,000원", "연어덮밥 16,000원", "스시 세트 22,000원"],
    price: "16,000~22,000원",
    priceNote: "1인 평균 1.8만원",
    walk: "도보 5분 (르메이에르종로타운 B2)",
    rating: "5.0",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal"],
    people: ["solo","small"],
    budget: ["normal","expensive"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "네이버 만점 5.0★! 신선한 해산물 카이센동. 비교적 가볍고 맛있는 점심. 다이어트 중에도 OK.",
    naver: "https://map.naver.com/v5/search/일품+광화문점",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/일품+광화문점", color: "#03C75A" },
    ]
  },
  {
    name: "쌤쌤쌤 광화문점",
    category: "양식 · 파스타/뇨끼/라자냐",
    menus: ["잠봉베르 파스타 26,000원", "라자냐 25,000원", "포르치니 뇨끼 23,000원"],
    price: "23,000~28,000원",
    priceNote: "1인 평균 2.5~3만원",
    walk: "도보 2분 (디타워 1층)",
    rating: "4.8",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","hot","cold","rainy"],
    mood: ["great","normal"],
    people: ["solo","small"],
    budget: ["expensive"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "서울 웨이팅 맛집 쌤쌤쌤이 광화문 디타워에 오픈! 4.8★. 감성 인테리어에 수준급 파스타·라자냐.",
    naver: "https://map.naver.com/v5/search/쌤쌤쌤+광화문점",
    reservation: [
      { label: "캐치테이블", url: "https://app.catchtable.co.kr/ct/shop/samsamsam_kr", color: "#FF6B35" },
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/쌤쌤쌤+광화문점", color: "#03C75A" },
    ]
  },
  {
    name: "광화문 뚝감",
    category: "한식 · 감자탕/뼈해장국",
    menus: ["감자탕(소) 13,000원", "뼈해장국 10,000원", "항정살 구이 15,000원"],
    price: "10,000~16,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 4분",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","stressed","normal"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "4.3★ 진한 뼈 육수로 피로 회복. 광화문 직장인 단골 속풀이 집. 뼈해장국 1만원으로 해결!",
    naver: "https://map.naver.com/v5/search/광화문뚝감",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/광화문뚝감", color: "#03C75A" },
    ]
  },
  {
    name: "동경우동 광화문",
    category: "일식 · 우동/돈카츠",
    menus: ["새우 우동 12,000원", "돈카츠 13,000원", "생선회 비빔밥 14,000원"],
    price: "12,000~15,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 4분",
    rating: "3.9",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["normal","tired"],
    people: ["solo","small"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "빠르고 부담없는 우동·돈카츠. 점심 시간 빠르게 해결할 때 추천. 합리적인 가격대.",
    naver: "https://map.naver.com/v5/search/동경우동+광화문",
    reservation: []
  },
  {
    name: "종로빈대떡 광화문점",
    category: "한식 · 전/막걸리",
    menus: ["해물파전 13,000원", "녹두빈대떡 10,000원", "막걸리 4,000원"],
    price: "10,000~15,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 4분",
    rating: "3.9",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["rainy","cold"],
    mood: ["great","stressed","normal"],
    people: ["small","medium","large"],
    budget: ["normal"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "비 오는 날엔 파전+막걸리 조합이 진리! 단체 인원도 부담없이 즐기는 전통 맛집.",
    naver: "https://map.naver.com/v5/search/종로빈대떡+광화문점",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/종로빈대떡+광화문점", color: "#03C75A" },
    ]
  },
  {
    name: "우라 레스토랑",
    category: "한식 · 한우 파인다이닝",
    menus: ["런치 한우 코스 45,000원~", "한우 육회 28,000원", "한우 안심구이 35,000원"],
    price: "35,000~70,000원",
    priceNote: "1인 평균 5만원~",
    walk: "도보 5분",
    rating: "5.0",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","hot","cold","rainy"],
    mood: ["great"],
    people: ["small"],
    budget: ["expensive"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "네이버 만점 5.0★! 광화문 파인다이닝. VIP 접대·특별 기념일 점심. 반드시 예약 필수.",
    naver: "https://map.naver.com/v5/search/우라+레스토랑+광화문",
    reservation: [
      { label: "캐치테이블", url: "https://app.catchtable.co.kr/ct/shop/woora", color: "#FF6B35" },
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/우라+레스토랑+광화문", color: "#03C75A" },
    ]
  },
  {
    name: "우하나 종각점",
    category: "한식 · 한우 오마카세",
    menus: ["런치 오마카세 코스 45,000원~", "한우 육사시미", "와규 스테이크"],
    price: "45,000~65,000원",
    priceNote: "1인 평균 5만원~",
    walk: "도보 7분 (그랑서울 2층)",
    rating: "4.9",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","hot","cold","rainy"],
    mood: ["great"],
    people: ["small","medium"],
    budget: ["expensive"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "4.9★ 그랑서울 한우 오마카세. 중요한 비즈니스 미팅·특별한 팀 점심에 완벽.",
    naver: "https://map.naver.com/v5/search/우하나+종각점",
    reservation: [
      { label: "캐치테이블", url: "https://app.catchtable.co.kr/ct/shop/woohana_jonggak", color: "#FF6B35" },
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/우하나+종각점", color: "#03C75A" },
    ]
  },
  {
    name: "광화문 미진",
    category: "한식 · 메밀국수/냉면",
    menus: ["메밀국수 12,000원", "비빔냉면 13,000원", "메밀전병 8,000원"],
    price: "8,000~16,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 3분 (디타워 내)",
    rating: "4.3",
    ribbon: false,
    diet: ["light","diet","vegetarian"],
    weather: ["hot","mild"],
    mood: ["normal","tired","great"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "저GI 메밀국수로 가볍고 건강하게! 다이어트 중에도 맛있게. 광화문 직장인 사랑받는 건강식.",
    naver: "https://map.naver.com/v5/search/미진+광화문",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/미진+광화문", color: "#03C75A" },
    ]
  },
  {
    name: "토속촌 삼계탕",
    category: "한식 · 삼계탕/보양식",
    menus: ["삼계탕 20,000원", "오골계 삼계탕 25,000원", "옻계탕 20,000원"],
    price: "20,000~30,000원",
    priceNote: "1인 평균 2만원",
    walk: "도보 10분 (경복궁역 인근)",
    rating: "4.5",
    ribbon: true,
    diet: ["nodiet"],
    weather: ["hot","cold","mild","rainy"],
    mood: ["tired","normal","stressed"],
    people: ["solo","small","medium"],
    budget: ["expensive"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🌟 미쉐린 빕구르망·노무현 대통령 단골집. 삼계탕 2만원. 피로 회복·보양 점심 1위. 여름·겨울 웨이팅 필수.",
    naver: "https://map.naver.com/v5/search/토속촌삼계탕",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/토속촌삼계탕", color: "#03C75A" },
    ]
  },
  {
    name: "모던샤브하우스 광화문",
    category: "한식 · 프리미엄 샤브샤브/스키야키 무한리필",
    menus: ["시그니처 코스(무한리필) 58,000원", "스페셜 코스 78,000원", "엑설런트 코스 88,000원"],
    price: "58,000~88,000원",
    priceNote: "1인 평균 6~9만원",
    walk: "도보 2분 (디타워 내)",
    rating: "4.6",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild","hot"],
    mood: ["great"],
    people: ["small","medium","large"],
    budget: ["expensive"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "4.6★ 소·돼지 고기 무한리필 프리미엄 샤브샤브. 광화문 뷰가 보이는 럭셔리 단체 회식·특별 모임 추천.",
    naver: "https://map.naver.com/v5/search/모던샤브하우스+광화문디타워",
    reservation: [
      { label: "캐치테이블", url: "https://app.catchtable.co.kr/ct/shop/msh_dtower", color: "#FF6B35" },
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/모던샤브하우스+광화문디타워", color: "#03C75A" },
    ]
  },
  {
    name: "꼬소한 부뚜막 광화문광장점",
    category: "한식 · 분식/김밥",
    menus: ["참치김밥 5,500원", "라면 5,000원", "떡볶이 6,000원"],
    price: "5,000~10,000원",
    priceNote: "1인 평균 8,000원",
    walk: "도보 3분",
    rating: "4.4",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold","rainy","hot"],
    mood: ["normal","tired","stressed"],
    people: ["solo","small"],
    budget: ["cheap"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "1만원 이하로 해결하는 가성비 분식! 혼밥러의 든든한 선택. 예약 불필요, 빠르게 해결.",
    naver: "https://map.naver.com/v5/search/꼬소한부뚜막+광화문광장점",
    reservation: []
  },
  {
    name: "광화문 국밥",
    category: "한식 · 돼지국밥/평양냉면",
    menus: ["돼지국밥 9,500원", "돼지국밥 특 13,000원", "평양냉면 13,000원"],
    price: "9,500~16,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 5분 (세종대로21길)",
    rating: "4.5",
    ribbon: true,
    diet: ["nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","stressed","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "🌟 미쉐린 빕구르망 4년 연속! 박찬일 셰프 운영. 맑고 깔끔한 돼지국밥 9,500원. 광화문 대표 가성비 명소.",
    naver: "https://map.naver.com/v5/search/광화문국밥",
    reservation: []
  },
  {
    name: "광화문 한상",
    category: "한식 · 건강 한정식",
    menus: ["건강 정식 (1인) 18,000원", "사찰음식 정식 20,000원", "연어 정식 22,000원"],
    price: "18,000~25,000원",
    priceNote: "1인 평균 2만원",
    walk: "도보 5분",
    rating: "4.5",
    ribbon: false,
    diet: ["light","diet","vegetarian"],
    weather: ["mild","cold","rainy","hot"],
    mood: ["great","normal","tired"],
    people: ["solo","small","medium"],
    budget: ["normal","expensive"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "제철 재료로 만든 건강 한정식. 채식·다이어트 메뉴 충실. 균형 잡힌 영양 한 끼.",
    naver: "https://map.naver.com/v5/search/광화문한상",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/광화문한상", color: "#03C75A" },
    ]
  },

  // ── 700m 확장 구역 ──────────────────────────────────────────────────────────

  {
    name: "무교동 북어국집",
    category: "한식 · 북어해장국 (1968년 노포)",
    menus: ["북어해장국 10,000원 (단일메뉴)", "밥·국 무한리필", "계란후라이 추가 500원"],
    price: "10,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 7분 (을지로1길 38)",
    rating: "4.8",
    ribbon: true,
    diet: ["light","nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","stressed","normal"],
    people: ["solo","small"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🏛️ 1968년 노포·서울 미래유산·블루리본 13년 연속. 북어해장국 단일메뉴 1만원. 밥·국 무한리필. 속 풀고 싶은 날 1위.",
    naver: "https://map.naver.com/v5/search/무교동북어국집",
    reservation: []
  },

  {
    name: "도마 인사동점",
    category: "한식 · 솥밥 정식/마약된장찌개",
    menus: ["이베리코 목살 솥밥정식 26,000원", "고등어 숯불구이 정식 16,000원", "육회비빔밥 정식 18,000원"],
    price: "16,000~26,000원",
    priceNote: "1인 평균 1.8~2.6만원",
    walk: "도보 7분 (관훈동 15-1, 인사동 인근)",
    rating: "4.4",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold","rainy","hot"],
    mood: ["great","normal"],
    people: ["solo","small","medium"],
    budget: ["normal","expensive"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "〈맛있는 녀석들〉 방영 맛집. 솥밥+마약된장찌개 조합. 인사동 인근 한식 솥밥 맛집. 웨이팅 있으니 일찍 방문 추천.",
    naver: "https://map.naver.com/v5/search/도마+인사동",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/도마+인사동", color: "#03C75A" },
    ]
  },

  {
    name: "서린낙지",
    category: "한식 · 낙지볶음/조개탕",
    menus: ["낙지볶음 1인 15,000원", "베이컨소시지구이 12,000원", "조개탕 14,000원"],
    price: "13,000~18,000원",
    priceNote: "1인 평균 1.5만원",
    walk: "도보 7분 (종각역 인근)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["great","stressed","normal"],
    people: ["small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "TV 방영 여러 번! 광화문·종각 대표 낙지볶음 노포. 매콤하고 중독성 있는 맛. 단골 직장인 많은 진짜 로컬 맛집.",
    naver: "https://map.naver.com/v5/search/서린낙지+종각",
    reservation: []
  },

  {
    name: "인사동 수제비",
    category: "한식 · 수제비/칼국수",
    menus: ["수제비 10,000원", "칼국수 10,000원", "비빔국수 10,000원"],
    price: "10,000~12,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 8분 (인사동 인근)",
    rating: "4.6",
    ribbon: false,
    diet: ["vegetarian","light","nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","stressed","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "다이닝코드 4.6★. 직접 반죽한 쫀득한 수제비. 1만원에 따뜻하고 든든한 한 끼. 비오는 날 최강 선택지.",
    naver: "https://map.naver.com/v5/search/인사동수제비",
    reservation: []
  },

  {
    name: "정원 백반",
    category: "한식 · 가정식 백반",
    menus: ["백반 정식 (일 2~3가지 반찬+국) 9,000~10,000원", "제육볶음 정식 10,000원", "생선구이 정식 11,000원"],
    price: "9,000~12,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 5분 (도렴빌딩 지하)",
    rating: "4.2",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["mild","cold","rainy","hot"],
    mood: ["tired","normal","stressed"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "광화문 10년 직장인들이 추천하는 오래된 백반집. 도렴빌딩 지하 위치. 매일 바뀌는 반찬에 집밥 같은 포근한 맛.",
    naver: "https://map.naver.com/v5/search/정원+백반+광화문",
    reservation: []
  },

  {
    name: "하노이 쌀국수",
    category: "아시안 · 베트남 쌀국수/분짜",
    menus: ["소고기 쌀국수 10,000원", "분짜 11,000원", "월남쌈 13,000원"],
    price: "10,000~14,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 5분 (도렴빌딩 인근)",
    rating: "4.1",
    ribbon: false,
    diet: ["light","diet","nodiet"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["normal","tired"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "광화문 직장인 단골 쌀국수집. 담백하고 가벼운 한 끼. 더운 날도, 추운 날도 부담없이 먹을 수 있는 가성비 맛집.",
    naver: "https://map.naver.com/v5/search/하노이쌀국수+광화문",
    reservation: []
  },

  {
    name: "꼬꼬뚝닭",
    category: "한식 · 닭볶음탕",
    menus: ["원조 닭볶음탕 (1인) 9,000원", "수제비 닭볶음탕 10,000원", "카레 닭볶음탕 10,000원"],
    price: "9,000~11,000원",
    priceNote: "1인 평균 9천~1만원",
    walk: "도보 7분 (도렴빌딩 인근 골목)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["stressed","tired","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "뚝배기에 자작자작 끓여 나오는 칼칼한 닭볶음탕 9천원. 업무지구에서 보기 힘든 대학로 감성 맛집. 스트레스 날리기 최고.",
    naver: "https://map.naver.com/v5/search/꼬꼬뚝닭+광화문",
    reservation: []
  },

  // ── 🥗 다이어트·채식 전문 구역 ─────────────────────────────────────────────

  {
    name: "그린앤그레인 광화문",
    category: "샐러드 · 슈퍼곡물 샐러드/포케",
    menus: ["치킨 시저샐러드 13,000원", "연어 포케볼 14,000원", "퀴노아 그레인볼 12,000원"],
    price: "11,000~16,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 5분 (두산위브파빌리온 1층)",
    rating: "4.1",
    ribbon: false,
    diet: ["diet","light","vegetarian"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal","tired"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🥗 광화문 대표 슈퍼곡물 샐러드 전문점. 퀴노아·귀리·병아리콩 베이스로 진짜 건강한 한 끼. 외국인도 많이 찾는 찐 샐러드 맛집.",
    naver: "https://map.naver.com/v5/search/그린앤그레인+광화문",
    reservation: []
  },

  {
    name: "요지트 광화문",
    category: "카페·디저트 · 그릭요거트/프로틴볼",
    menus: ["그릭요거트 S 4,200원~", "그릭요거트+과일+그래놀라 M 8,000원~", "콩포트 그릭요거트 6,500원~"],
    price: "4,200~12,000원",
    priceNote: "1인 평균 7천~1만원",
    walk: "도보 4분 (르메이에르 종로타운 지하 1층)",
    rating: "4.3",
    ribbon: false,
    diet: ["diet","light","vegetarian"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal","tired"],
    people: ["solo","small"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🍦 KT East 바로 인근! 꾸덕한 그릭요거트에 신선 과일·그래놀라 조합. 가볍고 건강한 점심 또는 브런치 대용으로 최적.",
    naver: "https://map.naver.com/v5/search/요지트+광화문",
    reservation: []
  },

  {
    name: "달죽 종각점",
    category: "한식 · 건강죽 전문점",
    menus: ["전복죽 10,000원", "야채죽 8,000원", "버섯야채죽 9,000원"],
    price: "8,000~12,000원",
    priceNote: "1인 평균 9천원",
    walk: "도보 5분 (두산위브파빌리온 1층)",
    rating: "4.0",
    ribbon: false,
    diet: ["diet","light","vegetarian"],
    weather: ["cold","rainy"],
    mood: ["tired","stressed"],
    people: ["solo","small"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "속이 안 좋거나 가볍게 먹고 싶은 날 최고. 가정식 느낌의 건강죽 전문점. 야채죽은 채식 가능. 포장·배달 가능.",
    naver: "https://map.naver.com/v5/search/달죽+종각",
    reservation: []
  },

  {
    name: "커피원 광화문",
    category: "카페·브런치 · 치아바타 샌드위치/샐러드",
    menus: ["훈제오리 치아바타 9,500원", "리코타치즈 치아바타 9,000원", "사이드 샐러드 5,000원"],
    price: "8,500~13,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 6분 (신문로1가, 광화문 인근)",
    rating: "4.2",
    ribbon: false,
    diet: ["light","diet"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "광화문 직장인 단골 샌드위치 카페. 치아바타에 꽉 찬 다양한 재료. 날 좋은 날 테이크아웃 후 광화문 광장에서 먹기 딱!",
    naver: "https://map.naver.com/v5/search/커피원+광화문",
    reservation: []
  },

  {
    name: "시래기담은 광화문",
    category: "한식 · 시래기 정식/채식 한식",
    menus: ["시래기 된장 정식 12,000원", "시래기 비빔밥 11,000원", "나물 한정식 13,000원"],
    price: "11,000~15,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 7분 (종각역 인근)",
    rating: "4.8",
    ribbon: false,
    diet: ["diet","light","vegetarian"],
    weather: ["cold","rainy","mild"],
    mood: ["tired","normal","great"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🌿 다이닝코드 4.8★ 종각 최고 채식 한식. 시래기·나물·된장 중심 건강 정식. 칼로리 걱정 없이 든든한 진짜 건강식 맛집.",
    naver: "https://map.naver.com/v5/search/시래기담은+종각",
    reservation: []
  },

  {
    name: "슬로우캘리 광화문",
    category: "샐러드·포케 · 하와이안 포케볼/샐러드랩",
    menus: ["클래식 연어 포케 12,500원", "블랙페퍼 치킨 보울 11,500원", "닭가슴살 에그 통밀 랩 7,900원"],
    price: "7,900~14,500원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 4분 (르메이에르 종로타운 1층, 요지트 바로 옆)",
    rating: "4.3",
    ribbon: false,
    diet: ["diet","light"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal","tired"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🐟 국내 1위 포케 프랜차이즈. 연어·참치·닭가슴살 중 선택해 나만의 포케 커스텀. 현미밥·샐러드볼 선택 가능. 다이어트 직장인 단골 맛집.",
    naver: "https://map.naver.com/v5/search/슬로우캘리+광화문",
    reservation: []
  },

  {
    name: "스윗밸런스 광화문",
    category: "샐러드 전문점 · 프리미엄 토핑 샐러드",
    menus: ["된장남 샐러드(닭가슴살+연어+아보카도) 14,000원", "로스티드 버섯 샐러드 12,000원", "시저 치킨 샐러드 13,000원"],
    price: "11,000~16,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 5분 (케이트윈타워 B동 지하 1층)",
    rating: "4.4",
    ribbon: false,
    diet: ["diet","light"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal","tired"],
    people: ["solo","small"],
    budget: ["normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🥗 세종문화회관 인근 직장인 샐러드 맛집. 된장남(닭가슴살·연어·아보카도) 시그니처. 오픈키친에서 눈앞에서 바로 조합해 주는 신선한 샐러드.",
    naver: "https://map.naver.com/v5/search/스윗밸런스+광화문",
    reservation: []
  }
];

const OPTIONS = {
  weather: [
    { value: "hot", emoji: "☀️", label: "더워요", sub: "25°C 이상" },
    { value: "mild", emoji: "🌤️", label: "선선해요", sub: "15~24°C" },
    { value: "cold", emoji: "🥶", label: "추워요", sub: "14°C 이하" },
    { value: "rainy", emoji: "🌧️", label: "비 와요", sub: "우중충한 날" },
  ],
  mood: [
    { value: "great", emoji: "😄", label: "최고예요", sub: "기념할 일 있어요" },
    { value: "normal", emoji: "😊", label: "보통이에요", sub: "평범한 하루" },
    { value: "tired", emoji: "😩", label: "피곤해요", sub: "힘을 내야 해요" },
    { value: "stressed", emoji: "🤯", label: "스트레스", sub: "매운 게 당겨요" },
  ],
  people: [
    { value: "solo", emoji: "🙋", label: "혼밥", sub: "나 혼자" },
    { value: "small", emoji: "👫", label: "2~3명", sub: "소수 정예" },
    { value: "medium", emoji: "👥", label: "4~6명", sub: "팀 점심" },
    { value: "large", emoji: "🎉", label: "7명 이상", sub: "단체 회식" },
  ],
  diet: [
    { value: "nodiet", emoji: "🍖", label: "아니요", sub: "다 먹어요" },
    { value: "light", emoji: "🥗", label: "가볍게", sub: "칼로리 신경써요" },
    { value: "diet", emoji: "💪", label: "다이어트 중", sub: "저칼로리만요" },
    { value: "vegetarian", emoji: "🌿", label: "채식 선호", sub: "고기 안 먹어요" },
  ],
  budget: [
    { value: "cheap", emoji: "💸", label: "~1만원", sub: "가성비 최고" },
    { value: "normal", emoji: "💳", label: "1~2만원", sub: "보통 수준" },
    { value: "expensive", emoji: "💎", label: "2만원 이상", sub: "특별하게" },
  ],
};

const LABELS = {
  weather: { hot:"더운 날씨", mild:"선선한 날", cold:"추운 날", rainy:"비 오는 날" },
  mood: { great:"기분 최고", normal:"평범한 하루", tired:"피곤한 날", stressed:"스트레스 날" },
  people: { solo:"혼밥", small:"2~3명", medium:"4~6명", large:"7명 이상" },
  diet: { nodiet:"식단 자유", light:"가볍게", diet:"다이어트 중", vegetarian:"채식 선호" },
  budget: { cheap:"1만원 이하", normal:"1~2만원", expensive:"2만원 이상" },
};

const SECTION_TITLES = {
  weather: "오늘 날씨가 어때요?",
  mood: "오늘 기분은요?",
  people: "몇 명이서 먹어요?",
  diet: "식단 관리 중이에요?",
  budget: "1인 예산은요?",
};

// 예산 호환 테이블: 선택한 예산에서 볼 수 있는 식당 범위
// cheap(~1만원): cheap만 / normal(1~2만원): cheap, normal / expensive(2만원+): normal, expensive
const BUDGET_COMPAT = {
  cheap:     ["cheap"],
  normal:    ["cheap", "normal"],
  expensive: ["normal", "expensive"],
};

function scoreRestaurant(r, sel) {
  let score = 0;

  // ① 예산 조건: 엄격 필터링 — 선택 예산 범위 밖이면 완전 제외
  const compatBudgets = BUDGET_COMPAT[sel.budget] || [];
  const budgetMatch = r.budget.some(b => compatBudgets.includes(b));
  if (!budgetMatch) return -999;
  // 완벽히 일치 시 보너스
  if (r.budget.includes(sel.budget)) score += 4;
  else score += 1; // 범위 내 근접

  // ② 식단 조건: 엄격 필터링
  if (sel.diet === "diet") {
    if (!r.diet.includes("diet")) return -999;
    score += 5;
  } else if (sel.diet === "light") {
    if (!r.diet.includes("light") && !r.diet.includes("diet")) return -999;
    score += 4;
  } else if (sel.diet === "vegetarian") {
    if (!r.diet.includes("vegetarian")) return -999;
    score += 5;
  } else {
    score += 3; // nodiet: 제한 없음
  }

  if (r.weather.includes(sel.weather)) score += 3;
  if (r.mood.includes(sel.mood)) score += 3;
  if (r.people.includes(sel.people)) score += 3;
  if (r.ribbon) score += 1;
  score += parseFloat(r.rating) * 0.3;
  score += Math.random() * 1.5;
  return score;
}

export default function LunchRecommender() {
  const [selections, setSelections] = useState({ weather: null, mood: null, people: null, diet: null, budget: null });
  const [step, setStep] = useState("form"); // form | loading | results
  const [results, setResults] = useState([]);
  const [showAlert, setShowAlert] = useState(false);
  const [time, setTime] = useState("");
  const [loadingDot, setLoadingDot] = useState(0);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
    };
    tick();
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (step !== "loading") return;
    const interval = setInterval(() => setLoadingDot(d => (d + 1) % 3), 500);
    const timeout = setTimeout(() => {
      const scored = restaurantDB
        .map(r => ({ ...r, score: scoreRestaurant(r, selections) }))
        .filter(r => r.score > -999);
      scored.sort((a, b) => b.score - a.score);
      setResults(scored.slice(0, 10));
      setStep("results");
    }, 2200);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [step]);

  const handleSelect = (group, value) => {
    setSelections(prev => ({ ...prev, [group]: value }));
    setShowAlert(false);
  };

  const handleRecommend = () => {
    const allSelected = Object.values(selections).every(v => v !== null);
    if (!allSelected) { setShowAlert(true); return; }
    setStep("loading");
  };

  const handleReset = () => {
    setSelections({ weather: null, mood: null, people: null, diet: null, budget: null });
    setResults([]);
    setStep("form");
  };

  return (
    <div style={{ fontFamily: "'Noto Sans KR', sans-serif", background: "#fafafa", minHeight: "100vh", color: "#0a0a0a" }}>
      {/* HEADER */}
      <div style={{ background: "#0a0a0a", padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: 900, fontSize: 22, color: "#E3001B", letterSpacing: 2 }}>KT</span>
          <div style={{ width: 2, height: 20, background: "#333" }} />
          <span style={{ color: "#aaa", fontSize: 13, fontWeight: 300 }}>광화문 점심 추천기</span>
        </div>
        <span style={{ color: "#666", fontSize: 12 }}>{time}</span>
      </div>

      {/* HERO */}
      <div style={{ background: "#0a0a0a", padding: "50px 28px 64px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-30%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, background: "radial-gradient(circle, rgba(227,0,27,0.18) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "inline-block", background: "#E3001B", color: "white", fontSize: 10, fontWeight: 700, letterSpacing: 2, padding: "5px 14px", borderRadius: 20, marginBottom: 20, textTransform: "uppercase" }}>
          🤖 AI Powered Lunch
        </div>
        <div style={{ fontSize: "clamp(44px, 8vw, 72px)", fontWeight: 900, color: "white", letterSpacing: 2, lineHeight: 1, marginBottom: 14 }}>
          오늘 뭐 <span style={{ color: "#E3001B" }}>먹지?</span>
        </div>
        <div style={{ color: "#777", fontSize: 14, fontWeight: 300 }}>
          광화문 맛집 데이터 기반 · 나만의 맞춤 추천
        </div>
      </div>

      {/* MAIN */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 80px" }}>

        {/* FORM */}
        {step === "form" && (
          <div>
            {Object.entries(OPTIONS).map(([group, opts], gi) => (
              <div key={group}>
                <div style={{ marginBottom: 36 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <span style={{ color: "#E3001B", fontWeight: 900, fontSize: 12, letterSpacing: 1 }}>0{gi+1}</span>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{SECTION_TITLES[group]}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
                    {opts.map(opt => {
                      const selected = selections[group] === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleSelect(group, opt.value)}
                          style={{
                            background: selected ? "#fff5f5" : "white",
                            border: `2px solid ${selected ? "#E3001B" : "#e8e8e8"}`,
                            borderRadius: 14,
                            padding: "16px 10px",
                            textAlign: "center",
                            cursor: "pointer",
                            transition: "all 0.18s",
                            position: "relative",
                            boxShadow: selected ? "0 4px 16px rgba(227,0,27,0.12)" : "none",
                            transform: selected ? "translateY(-2px)" : "none",
                          }}
                        >
                          {selected && <span style={{ position: "absolute", top: 7, right: 9, fontSize: 10, color: "#E3001B", fontWeight: 700 }}>✓</span>}
                          <div style={{ fontSize: 26, marginBottom: 7 }}>{opt.emoji}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a" }}>{opt.label}</div>
                          <div style={{ fontSize: 11, color: "#999", marginTop: 3 }}>{opt.sub}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {gi < Object.keys(OPTIONS).length - 1 && (
                  <div style={{ height: 1, background: "#e8e8e8", margin: "0 0 36px" }} />
                )}
              </div>
            ))}

            {/* CTA */}
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <button
                onClick={handleRecommend}
                style={{
                  background: "#E3001B",
                  color: "white",
                  border: "none",
                  borderRadius: 50,
                  padding: "18px 52px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(227,0,27,0.3)",
                  letterSpacing: 0.5,
                  transition: "all 0.2s",
                }}
                onMouseOver={e => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseOut={e => e.currentTarget.style.transform = "none"}
              >
                🍽️ AI 점심 추천받기
              </button>
              <div style={{ marginTop: 10, fontSize: 12, color: "#aaa" }}>광화문 맛집 데이터 기반으로 추천해 드려요</div>
              {showAlert && (
                <div style={{ marginTop: 14, background: "#fff5f5", border: "1px solid #ffcccc", borderRadius: 10, padding: "12px 20px", fontSize: 13, color: "#E3001B" }}>
                  ⚠️ 모든 항목을 선택해 주세요!
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 28 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 13, height: 13,
                  background: "#E3001B",
                  borderRadius: "50%",
                  opacity: loadingDot === i ? 1 : 0.3,
                  transform: loadingDot === i ? "scale(1.3)" : "scale(0.8)",
                  transition: "all 0.3s",
                }} />
              ))}
            </div>
            <div style={{ fontSize: 15, color: "#666", fontWeight: 300 }}>광화문 맛집 데이터를 분석하고 있어요...</div>
            <div style={{ fontSize: 12, color: "#aaa", marginTop: 8 }}>블루리본 · 네이버 평점 · 카카오맵 참고 중</div>
          </div>
        )}

        {/* RESULTS */}
        {step === "results" && (
          <div>
            {/* 결과 헤더 */}
            <div style={{ background: "#0a0a0a", borderRadius: 20, padding: "26px 28px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, background: "radial-gradient(circle, rgba(227,0,27,0.3), transparent 70%)" }} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#E3001B", textTransform: "uppercase", marginBottom: 8 }}>AI 추천 결과</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "white", lineHeight: 1.4 }}>
                {LABELS.mood[selections.mood]}인 오늘, 광화문 맛집 TOP 10 🍽️
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                {Object.entries(selections).map(([k, v]) => (
                  <span key={k} style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 11, padding: "3px 11px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.15)" }}>
                    {LABELS[k][v]}
                  </span>
                ))}
              </div>
            </div>

            {/* 결과 없음 (식단 조건이 너무 엄격할 때) */}
            {results.length === 0 && (
              <div style={{ background: "white", border: "2px dashed #e8e8e8", borderRadius: 20, padding: 32, textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>😅</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>조건에 맞는 식당이 없어요</div>
                <div style={{ fontSize: 13, color: "#999", lineHeight: 1.6 }}>
                  선택하신 식단 조건이 현재 DB의 식당과 맞지 않아요.<br/>
                  식단 조건을 바꾸거나, 조건을 완화해 다시 시도해보세요!
                </div>
              </div>
            )}

            {/* 맛집 카드 */}
            {results.map((r, i) => (
              <div key={r.name} style={{
                background: "white",
                border: `2px solid ${i === 0 ? "#E3001B" : "#e8e8e8"}`,
                borderRadius: 20,
                padding: 24,
                marginBottom: 16,
                animation: "fadeUp 0.4s ease forwards",
                boxShadow: i === 0 ? "0 8px 32px rgba(227,0,27,0.1)" : "0 2px 12px rgba(0,0,0,0.05)",
              }}>
                {/* 상단 */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <span style={{ fontWeight: 900, fontSize: 40, color: i === 0 ? "rgba(227,0,27,0.25)" : "#eee", lineHeight: 1 }}>0{i+1}</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {r.ribbon && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "#fff3e0", color: "#e65100" }}>🎀 블루리본</span>}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "#e8f5e9", color: "#2e7d32" }}>⭐ {r.rating}</span>
                    {parseFloat(r.rating) >= 4.5 && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "#fce4ec", color: "#c62828" }}>🔥 인기</span>}
                    {r.calorie && <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: r.calorie.color + "22", color: r.calorie.color }}>{r.calorie.emoji} {r.calorie.label}</span>}
                    {r.diet.includes("vegetarian") && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "#e8f5e9", color: "#2e7d32" }}>🌿 채식 가능</span>
                    )}
                    {r.diet.includes("diet") && !r.diet.includes("vegetarian") && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "#e3f2fd", color: "#1565c0" }}>💪 다이어트</span>
                    )}
                    {r.diet.includes("light") && !r.diet.includes("diet") && !r.diet.includes("vegetarian") && (
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: "#f3e5f5", color: "#6a1b9a" }}>🥗 저칼로리</span>
                    )}
                  </div>
                </div>

                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 3 }}>{r.name}</div>
                <div style={{ fontSize: 13, color: "#999", marginBottom: 12 }}>{r.category}</div>

                {/* 메타 */}
                <div style={{ display: "flex", gap: 18, marginBottom: 14, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, color: "#555" }}>🚶 {r.walk}</span>
                  <span style={{ fontSize: 13, color: "#E3001B", fontWeight: 700 }}>👤 {r.priceNote}</span>
                </div>

                {/* 메뉴 */}
                <div style={{ background: "#f4f4f4", borderRadius: 12, padding: "11px 15px", marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#aaa", letterSpacing: 1, textTransform: "uppercase", marginBottom: 5 }}>추천 메뉴</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.menus.join(" · ")}</div>
                </div>

                {/* 추천 이유 */}
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.6, borderLeft: "3px solid #E3001B", paddingLeft: 12, marginBottom: 14 }}>
                  {r.reason}
                </div>

                {/* 지도 버튼 */}
                {/* 예약 & 지도 버튼 */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  {r.reservation && r.reservation.map((res, ri) => (
                    <a
                      key={ri}
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, background: res.color, color: "white", textDecoration: "none", fontSize: 12, fontWeight: 700, padding: "9px 16px", borderRadius: 20 }}
                    >
                      {res.label === "캐치테이블" ? "🪑" : "📅"} {res.label}
                    </a>
                  ))}
                  {r.reservation && r.reservation.length === 0 && (
                    <span style={{ fontSize: 12, color: "#aaa", padding: "9px 0", display: "flex", alignItems: "center", gap: 4 }}>
                      ✅ 예약 불필요 · 바로 방문
                    </span>
                  )}
                  <a
                    href={r.naver}
                    target="_blank"
                    rel="noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#f4f4f4", color: "#555", textDecoration: "none", fontSize: 12, fontWeight: 600, padding: "9px 16px", borderRadius: 20 }}
                  >
                    🗺️ 네이버 지도
                  </a>
                </div>
              </div>
            ))}

            {/* 다시 추천받기 */}
            <div style={{ textAlign: "center", marginTop: 32 }}>
              <button
                onClick={handleReset}
                style={{ background: "transparent", border: "2px solid #0a0a0a", borderRadius: 50, padding: "14px 40px", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
                onMouseOver={e => { e.currentTarget.style.background = "#0a0a0a"; e.currentTarget.style.color = "white"; }}
                onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#0a0a0a"; }}
              >
                🔄 다시 추천받기
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ background: "#0a0a0a", padding: "22px", textAlign: "center", color: "#555", fontSize: 12 }}>
        📍 KT 광화문 West·East 빌딩 반경 700m 실제 맛집 · 네이버 플레이스 평점 기반
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700;900&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
