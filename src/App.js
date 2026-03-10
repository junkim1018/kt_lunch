import { useState, useEffect } from "react";

// ✅ KT West(세종대로 178) & East(종로3길 33) 빌딩 반경 700m 실제 맛집 데이터
// 예산 기준: cheap=~1만원 / normal=1~2만원 / expensive=2만원 이상 (1인 기준)
const restaurantDB = [
  {
    name: "파이프그라운드 광화문점",
    category: "이탈리안 · 피자/파스타",
    cuisine: "western",
    menus: ["옥수수 피자 26,000원", "화이트 라구 파스타 25,000원", "시저샐러드 14,000원"],
    price: "21,000~45,000원",
    priceNote: "1인 평균 2~3만원",
    walk: "도보 5분 (KT West 지하 1층)",
    rating: "4.9",
    ribbon: true,
    diet: ["nodiet"],
    weather: ["mild","cold"],
    mood: ["great","normal"],
    people: ["solo","small","medium"],
    budget: ["expensive"],
    waiting: true,
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
    cuisine: "chinese",
    menus: ["스테이크 트러플 자장면 30,000원", "고추 유린기 40,000원", "마카롱 멘보샤 22,000원"],
    price: "22,000~40,000원",
    priceNote: "1인 평균 3~4만원",
    walk: "도보 3분 (광화문 인근)",
    rating: "4.9",
    ribbon: true,
    diet: ["nodiet"],
    weather: ["mild","cold","rainy"],
    mood: ["great","stressed"],
    people: ["solo","small","medium"],
    budget: ["expensive"],
    waiting: true,
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "블루리본·4.9★. 흑백요리사2 출연 셰프의 한우 트러플 자장면. 특별한 날이나 스트레스 풀기 최고.",
    naver: "https://map.naver.com/v5/search/무탄+광화문점",
    reservation: [
      { label: "캐치테이블", url: "https://app.catchtable.co.kr/ct/shop/mutan_gwanghwamoon", color: "#FF6B35" },
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/무탄+광화문점", color: "#03C75A" },
    ]
  },
  {
    name: "광화문석갈비 D타워점",
    category: "한식 · 갈비/구이",
    cuisine: "korean",
    menus: ["돼지 석갈비 18,000원", "냉면 13,000원", "갈비탕 15,000원"],
    price: "13,000~22,000원",
    priceNote: "1인 평균 1.5~2만원",
    walk: "도보 2분 (디타워 3층)",
    rating: "4.6",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["hot","mild","cold"],
    mood: ["great","stressed","normal"],
    people: ["small","medium","large"],
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
    cuisine: "japanese",
    menus: ["채끝 규카츠 19,000원", "안심 규카츠 23,000원", "미니카레 5,000원"],
    price: "19,000~23,000원",
    priceNote: "1인 평균 2만원",
    walk: "도보 3분 (르메이에르종로타운 지하1층)",
    rating: "4.9",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal"],
    people: ["solo","small"],
    budget: ["expensive"],
    waiting: true,
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
    cuisine: "japanese",
    menus: ["카이센동 18,000원", "연어덮밥 16,000원", "스시 세트 22,000원"],
    price: "16,000~22,000원",
    priceNote: "1인 평균 1.8만원",
    walk: "도보 3분 (르메이에르종로타운 B2)",
    rating: "5.0",
    ribbon: false,
    diet: ["light","diet","nodiet"],
    weather: ["hot","mild"],
    mood: ["great","normal"],
    people: ["solo","small"],
    budget: ["normal","expensive"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "네이버 만점 5.0★! 신선한 해산물 카이센동. 고단백 저칼로리라 다이어트 중에도 OK. 비교적 가볍고 맛있는 점심.",
    naver: "https://map.naver.com/v5/search/일품+광화문점",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/일품+광화문점", color: "#03C75A" },
    ]
  },
  {
    name: "쌤쌤쌤 광화문점",
    category: "양식 · 파스타/뇨끼/라자냐",
    cuisine: "western",
    menus: ["잠봉베르 파스타 26,000원", "라자냐 25,000원", "포르치니 뇨끼 23,000원"],
    price: "23,000~28,000원",
    priceNote: "1인 평균 2.5~3만원",
    walk: "도보 2분 (디타워 1층)",
    rating: "4.8",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold"],
    mood: ["great","normal"],
    people: ["solo","small","medium"],
    budget: ["expensive"],
    waiting: true,
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "서울 웨이팅 맛집 쌤쌤쌤이 광화문 디타워에 오픈! 4.8★. 감성 인테리어에 수준급 파스타·라자냐.",
    naver: "https://map.naver.com/v5/search/쌤쌤쌤+광화문점",
    reservation: [
      { label: "캐치테이블", url: "https://app.catchtable.co.kr/ct/shop/samsamsam_kr", color: "#FF6B35" },
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/쌤쌤쌤+광화문점", color: "#03C75A" },
    ]
  },
  {
    name: "광화문뚝감",
    category: "한식 · 감자탕/뼈해장국",
    cuisine: "korean",
    menus: ["감자탕(소) 13,000원", "뼈해장국 10,000원", "항정살 구이 15,000원"],
    price: "10,000~16,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 2분 (광화문 인근)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","normal"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "4.3★ 진한 뼈 육수로 피로 회복. 광화문 직장인 단골 속풀이 집. 뼈해장국 1만원으로 해결!",
    naver: "https://map.naver.com/v5/search/광화문뚝감",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/광화문뚝감", color: "#03C75A" },
    ]
  },
  // ⛔ 동경우동 광화문 — 폐업 확인으로 제거
  {
    name: "종로빈대떡 광화문점",
    category: "한식 · 전/막걸리",
    cuisine: "korean",
    menus: ["해물파전 13,000원", "녹두빈대떡 10,000원", "막걸리 4,000원"],
    price: "10,000~15,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 2분 (광화문 인근)",
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
    name: "우하나 종각역점",
    category: "한식 · 한우 오마카세",
    cuisine: "korean",
    menus: ["런치 오마카세 코스 45,000원~", "한우 육사시미", "와규 스테이크"],
    price: "45,000~65,000원",
    priceNote: "1인 평균 5만원~",
    walk: "도보 6분 (그랑서울 2층)",
    rating: "4.9",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold"],
    mood: ["great","normal"],
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
    name: "모던샤브하우스 광화문D타워점",
    category: "한식 · 프리미엄 샤브샤브/스키야키 무한리필",
    cuisine: "korean",
    menus: ["시그니처 코스(무한리필) 58,000원", "스페셜 코스 78,000원", "엑설런트 코스 88,000원"],
    price: "58,000~88,000원",
    priceNote: "1인 평균 6~9만원",
    walk: "도보 2분 (디타워 내)",
    rating: "4.6",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["mild","cold","rainy"],
    mood: ["great","normal"],
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
  // ⛔ 꼬소한 부뚜막 광화문광장점 — 검색 결과 없음, 실존 불확실. 제거.
  {
    name: "광화문국밥",
    category: "한식 · 돼지국밥/평양냉면",
    cuisine: "korean",
    menus: ["돼지국밥 9,500원", "돼지국밥 특 13,000원", "평양냉면 13,000원"],
    price: "9,500~16,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 2분 (세종대로21길)",
    rating: "4.5",
    ribbon: true,
    diet: ["nodiet"],
    weather: ["hot","cold","rainy"],
    mood: ["tired","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "🌟 미쉐린 빕구르망 4년 연속! 박찬일 셰프 운영. 맑고 깔끔한 돼지국밥 9,500원. 광화문 대표 가성비 명소.",
    naver: "https://map.naver.com/v5/search/광화문국밥",
    reservation: []
  },
  // ⛔ 광화문 한상 (사찰음식/건강한정식) — 실존 확인 불가. 제거.

  // ── 700m 확장 구역 ──────────────────────────────────────────────────────────

  {
    name: "무교동북어국집",
    category: "한식 · 북어해장국 (1968년 노포)",
    cuisine: "korean",
    menus: ["북어해장국 10,000원 (단일메뉴)", "밥·국 무한리필", "계란후라이 추가 500원"],
    price: "10,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 8분 (을지로1길 38)",
    rating: "4.8",
    ribbon: true,
    diet: ["nodiet"],
    weather: ["mild","cold","rainy"],
    mood: ["tired","stressed"],
    people: ["solo","small"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "🏛️ 1968년 노포·서울 미래유산·블루리본 13년 연속. 북어해장국 단일메뉴 1만원. 밥·국 무한리필. 속 풀고 싶은 날 1위.",
    naver: "https://map.naver.com/v5/search/무교동북어국집",
    reservation: []
  },

  {
    name: "서린낙지",
    category: "한식 · 낙지볶음/조개탕",
    cuisine: "korean",
    menus: ["낙지볶음 1인 15,000원", "베이컨소시지구이 12,000원", "조개탕 14,000원"],
    price: "13,000~18,000원",
    priceNote: "1인 평균 1.5만원",
    walk: "도보 4분 (르메이에르종로타운1)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["stressed","great"],
    people: ["small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "TV 방영 여러 번! 광화문·종각 대표 낙지볶음 노포. 매콤하고 중독성 있는 맛. 단골 직장인 많은 진짜 로컬 맛집.",
    naver: "https://map.naver.com/v5/search/서린낙지+종각",
    reservation: []
  },

  {
    name: "정원 백반",
    category: "한식 · 가정식 백반",
    cuisine: "korean",
    menus: ["백반 정식 (일 2~3가지 반찬+국) 9,000~10,000원", "제육볶음 정식 10,000원", "생선구이 정식 11,000원"],
    price: "9,000~12,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 4분 (도렴빌딩 지하)",
    rating: "4.2",
    ribbon: false,
    diet: ["light","diet","nodiet"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["tired","normal","stressed"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "광화문 10년 직장인들이 추천하는 오래된 백반집. 도렴빌딩 지하 위치. 매일 바뀌는 반찬에 집밥 같은 포근한 맛.",
    naver: "https://map.naver.com/v5/search/정원+백반+광화문",
    reservation: []
  },

  {
    name: "꼬꼬뚝닭",
    category: "한식 · 닭볶음탕",
    cuisine: "korean",
    menus: ["원조 닭볶음탕 (1인) 9,000원", "수제비 닭볶음탕 10,000원", "카레 닭볶음탕 10,000원"],
    price: "9,000~11,000원",
    priceNote: "1인 평균 9천~1만원",
    walk: "도보 4분 (도렴빌딩 지하 1층, 새문안로5길 37 B1)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["stressed","tired","normal"],
    people: ["solo","small"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "뚝배기에 자작자작 끓여 나오는 칼칼한 닭볶음탕 9천원. 업무지구에서 보기 힘든 대학로 감성 맛집. 스트레스 날리기 최고.",
    naver: "https://map.naver.com/v5/search/꼬꼬뚝닭+광화문",
    reservation: []
  },

  // ── 🥗 다이어트·채식 전문 구역 ─────────────────────────────────────────────

  {
    name: "그린앤그레인",
    category: "샐러드 · 슈퍼곡물 샐러드/포케",
    cuisine: "salad",
    menus: ["치킨 시저샐러드 13,000원", "연어 포케볼 14,000원", "퀴노아 그레인볼 12,000원"],
    price: "11,000~16,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 4분 (두산위브파빌리온 1층)",
    rating: "4.1",
    ribbon: false,
    diet: ["light","diet","nodiet"],
    weather: ["hot","mild"],
    mood: ["great","normal"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🥗 광화문 대표 슈퍼곡물 샐러드 전문점. 퀴노아·귀리·병아리콩 베이스로 진짜 건강한 한 끼. 외국인도 많이 찾는 찐 샐러드 맛집.",
    naver: "https://map.naver.com/v5/search/그린앤그레인+광화문",
    reservation: []
  },

  {
    name: "요지트 광화문점",
    category: "카페·디저트 · 그릭요거트/프로틴볼",
    cuisine: "salad",
    menus: ["그릭요거트 S 4,200원~", "그릭요거트+과일+그래놀라 M 8,000원~", "콩포트 그릭요거트 6,500원~"],
    price: "4,200~12,000원",
    priceNote: "1인 평균 7천~1만원",
    walk: "도보 3분 (르메이에르 종로타운 지하 1층)",
    rating: "4.3",
    ribbon: false,
    diet: ["diet","light","vegetarian"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal"],
    people: ["solo","small"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🍦 KT East 바로 인근! 꾸덕한 그릭요거트에 신선 과일·그래놀라 조합. 가볍고 건강한 점심 또는 브런치 대용으로 최적.",
    naver: "https://map.naver.com/v5/search/요지트+광화문",
    reservation: []
  },



  {
    name: "커피원",
    category: "카페·브런치 · 수제 샌드위치/베이커리",
    cuisine: "salad",
    menus: ["훈제오리 당근라페 샌드위치 8,000원", "수제 샌드위치 (종류 다양) 7,000~9,000원", "쫀득빵 3,500원", "커피 3,000~4,500원"],
    price: "7,000~13,000원",
    priceNote: "1인 평균 9천원",
    walk: "도보 3분 (새문안로3길 12 지하1층)",
    rating: "4.2",
    ribbon: false,
    diet: ["light"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "광화문 직장인 단골 수제 샌드위치 카페. 두툼하고 재료 꽉 찬 샌드위치로 유명. 쫀득빵도 인기. 테이크아웃 전문. 평일 07:00 오픈.",
    naver: "https://map.naver.com/v5/search/커피원+광화문",
    reservation: []
  },

  {
    name: "시래기담은",
    category: "한식 · 시래기 정식/채식 한식",
    cuisine: "korean",
    menus: ["시래기 된장 정식 12,000원", "시래기 비빔밥 11,000원", "나물 한정식 13,000원"],
    price: "11,000~15,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 7분",
    rating: "4.8",
    ribbon: false,
    diet: ["light","diet","vegetarian","nodiet"],
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
    cuisine: "salad",
    menus: ["클래식 연어 포케 12,500원", "블랙페퍼 치킨 보울 11,500원", "닭가슴살 에그 통밀 랩 7,900원"],
    price: "7,900~14,500원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 3분 (르메이에르 종로타운 1층)",
    rating: "4.3",
    ribbon: false,
    diet: ["diet","light","vegetarian","nodiet"],
    weather: ["hot","mild"],
    mood: ["great","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🐟 국내 1위 포케 프랜차이즈. 연어·참치·닭가슴살 중 선택해 나만의 포케 커스텀. 현미밥·샐러드볼 선택 가능. 다이어트 직장인 단골 맛집.",
    naver: "https://map.naver.com/v5/search/슬로우캘리+광화문",
    reservation: []
  },

  {
    name: "스윗샐러드",
    category: "샐러드 전문점 · 프리미엄 토핑 샐러드",
    cuisine: "salad",
    menus: ["된장남 샐러드(닭가슴살+연어+아보카도) 14,000원", "로스티드 버섯 샐러드 12,000원", "시저 치킨 샐러드 13,000원"],
    price: "11,000~16,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 3분 (케이트윈타워 B동 지하 1층)",
    rating: "4.4",
    ribbon: false,
    diet: ["diet","light"],
    weather: ["hot","mild"],
    mood: ["great","normal"],
    people: ["solo","small"],
    budget: ["normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🥗 세종문화회관 인근 직장인 샐러드 맛집. 된장남(닭가슴살·연어·아보카도) 시그니처. 오픈키친에서 눈앞에서 바로 조합해 주는 신선한 샐러드.",
    naver: "https://map.naver.com/v5/search/스윗샐러드+광화문",
    reservation: []
  },

  // ── 🆕 추가 확장 구역 ───────────────────────────────────────────────────────

  {
    name: "허니떡볶이",
    category: "분식 · 즉석떡볶이",
    cuisine: "korean",
    menus: ["즉석떡볶이 2인 16,000원", "볶음밥 추가 3,000원", "라면 추가 2,000원"],
    price: "8,000~12,000원",
    priceNote: "1인 평균 9천원",
    walk: "도보 2분 (일우빌딩 B1)",
    rating: "4.5",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["stressed","tired","normal"],
    people: ["small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "광화문 직장인 사이 입소문 자자한 즉석떡볶이. 당일 만든 쫄깃한 떡에 달콤매콤 양념이 일품. 마무리 볶음밥까지 배 터지게 먹는 가성비 끝판왕.",
    naver: "https://map.naver.com/v5/search/허니떡볶이+광화문",
    reservation: []
  },

  {
    name: "성가백암순대",
    category: "한식 · 순대국밥",
    cuisine: "korean",
    menus: ["순대국밥 10,000원", "순대 한 접시 12,000원", "머리고기 13,000원"],
    price: "10,000~14,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 4분 (두산위브파빌리온 1층)",
    rating: "4.4",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","stressed","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "광화문 현직 직장인들이 직접 추천한 진한 국물 순대국. 탱글탱글한 순대와 진한 육수의 조합. 추운 날 점심 속 확 풀어주는 진짜 노포 감성.",
    naver: "https://map.naver.com/v5/search/성가백암순대+광화문",
    reservation: []
  },

  {
    name: "진중 우육면관 광화문점",
    category: "중식 · 대만식 우육면",
    cuisine: "chinese",
    menus: ["우육면 14,000원", "반근 14,000원", "수제 군만두 7,000원"],
    price: "12,000~16,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 6분 (청진동 39)",
    rating: "4.6",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","stressed","normal"],
    people: ["solo","small"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "광화문 직장인 법무팀 차장이 극찬한 대만 본토 우육면. 진한 소고기 국물에 쫄깃한 면발. 뉴로미엔관과 함께 광화문 양대 우육면 맛집.",
    naver: "https://map.naver.com/v5/search/우육면관+광화문",
    reservation: []
  },

  {
    name: "금금 스타필드애비뉴 그랑서울점",
    category: "한식 · 한식 기반 솥밥/덮밥",
    cuisine: "korean",
    menus: ["소갈비 덮밥 18,000원", "보리된장 고기국수 14,000원", "계절 솥밥 정식 16,000원"],
    price: "14,000~20,000원",
    priceNote: "1인 평균 1.6만원",
    walk: "도보 7분 (스타필드 그랑서울 1층)",
    rating: "4.5",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold","rainy"],
    mood: ["great","normal"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "2025년 오픈 신상! 스타필드 그랑서울 1층 한식 맛집. 혼밥부터 단체석까지 완비. 통창으로 밝고 깔끔한 분위기. 직장인 점심 웨이팅 없으려면 11시대 방문 추천.",
    naver: "https://map.naver.com/v5/search/금금+그랑서울",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/금금+그랑서울", color: "#03C75A" },
    ]
  },

  {
    name: "양산도 광화문점",
    category: "일식 · 민물장어덮밥/히츠마부시",
    cuisine: "japanese",
    menus: ["히츠마부시(민물장어덮밥) 25,000원", "장어 정식 28,000원", "장어 샐러드 15,000원"],
    price: "22,000~30,000원",
    priceNote: "1인 평균 2.5만원",
    walk: "도보 4분 (로얄빌딩 B1)",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["hot","mild"],
    mood: ["tired","great","normal"],
    people: ["solo","small"],
    budget: ["expensive"],
    waiting: true,
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "더위 먹은 날 최고의 보양식! 광화문 민물장어덮밥 1위. 히츠마부시 방식으로 세 가지 방법으로 즐기는 일품 장어. 웨이팅 있으니 미리 방문 추천.",
    naver: "https://map.naver.com/v5/search/양산도+광화문점",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/양산도+광화문점", color: "#03C75A" },
    ]
  },

  {
    name: "강촌숯불닭갈비 종각",
    category: "한식 · 숯불 닭갈비",
    cuisine: "korean",
    menus: ["양념 숯불닭갈비 1인분 14,000원", "치즈 추가 2,000원", "볶음밥 3,000원"],
    price: "14,000~18,000원",
    priceNote: "1인 평균 1.5만원",
    walk: "도보 7분",
    rating: "4.4",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold"],
    mood: ["stressed","great","normal"],
    people: ["small","medium","large"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "달착지근하면서 쫀득한 숯불닭갈비. 광화문 직장인 극찬 — 춘천보다 맛있다는 후기 속출. 직화 숯불 향이 식욕 돋우는 광화문 숨은 맛집.",
    naver: "https://map.naver.com/v5/search/강촌숯불닭갈비+종각",
    reservation: []
  },



  {
    name: "진순대",
    category: "한식 · 순대국+라면",
    cuisine: "korean",
    menus: ["순대국+라면 9,000원", "순대국밥 8,000원", "라면 3,500원"],
    price: "8,000~10,000원",
    priceNote: "1인 평균 9천원",
    walk: "도보 3분 (청진동 48-2)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","stressed"],
    people: ["solo","small"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "생소하지만 필승조합! 순대국+라면 콤보. 추운 날 진한 국물과 라면으로 완벽한 해장. 점심시간 줄 서니 11시 30분 전에 가는 게 안전.",
    naver: "https://map.naver.com/v5/search/진순대+광화문+청진동",
    reservation: []
  },




  // ⛔ 명동교자 광화문 — 명동 직영점만 운영, 광화문/종각 지점 없음. 제거.

  {
    name: "코끼리초밥 광화문점",
    category: "일식 · 초밥 세트/런치",
    cuisine: "japanese",
    menus: ["런치 B세트(12P+우동) 28,000원", "연어 스페셜 세트 32,000원", "런치 단품 초밥 1,500원~"],
    price: "15,000~35,000원",
    priceNote: "1인 평균 2.5만원",
    walk: "도보 1분 (KT East 지하1층 직결)",
    rating: "4.5",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["hot","mild"],
    mood: ["great","normal"],
    people: ["solo","small","medium"],
    budget: ["expensive"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🏢 KT타워 지하1층 바로 연결! 초밥은 고단백 저칼로리 — 다이어트 중에도 맛있게. 런치 세트 가성비 좋고 신선한 초밥.",
    naver: "https://map.naver.com/v5/search/코끼리초밥+광화문",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/코끼리초밥+광화문", color: "#03C75A" },
    ]
  },

  {
    name: "덕후선생 광화문디타워점",
    category: "중식 · 북경오리/중화요리",
    cuisine: "chinese",
    menus: ["닭볶음탕 정식 13,000원", "청국장 정식 11,000원", "된장찌개 정식 10,000원"],
    price: "10,000~14,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 7분",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["normal","great"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "정갈한 반찬에 뚝배기 찌개까지. 엄마 손맛 같은 가정식 정식 맛집. 광화문 직장인 단골 중의 단골.",
    naver: "https://map.naver.com/v5/search/덕후선생+광화문",
    reservation: []
  },



  // ⛔ 광화문 참치 (다동) — 존재 확인 불가, 사용자 검색 결과 없음으로 제거

  {
    name: "VIP참치 광화문점",
    category: "일식 · 참치회/코스",
    cuisine: "japanese",
    menus: ["회덮밥 (점심) 12,000원", "참다랑어 정식 (점심) 29,000원", "참다랑어 특정식 (점심) 39,000원"],
    price: "12,000~39,000원",
    priceNote: "1인 평균 3만원 (점심코스)",
    walk: "도보 4분 (도렴빌딩 지하1층)",
    rating: "4.3",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal"],
    people: ["small","medium","large"],
    budget: ["expensive"],
    waiting: false,
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "100% 참다랑어 전문점. 전 좌석 프라이빗 룸으로 접대·회식에 딱. 점심 회덮밥 1.2만원부터 가성비 코스까지. 100% 예약제, 토·일 휴무 주의.",
    naver: "https://map.naver.com/v5/search/VIP참치+광화문점",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/VIP참치+광화문점", color: "#03C75A" },
    ]
  },

  {
    name: "VIP참치 종로구청점",
    category: "일식 · 참치회/코스",
    cuisine: "japanese",
    menus: ["일품 코스 38,000원", "특선 코스 (점심) 35,000원~", "참다랑어 정식 (점심) 25,000원"],
    price: "25,000~88,000원",
    priceNote: "1인 평균 3.5만원 (점심코스)",
    walk: "도보 3분 (신라스테이 광화문 지하1층, D타워 뒤편)",
    rating: "4.3",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal"],
    people: ["small","medium","large"],
    budget: ["expensive"],
    waiting: false,
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "100% 참다랑어 무한리필 룸 참치집. 신라스테이 지하라 깔끔하고 쾌적. 접대·미팅·소규모 회식 최적. 100% 예약제, 토·일 휴무 주의.",
    naver: "https://map.naver.com/v5/search/VIP참치+종로구청점",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/VIP참치+종로구청점", color: "#03C75A" },
    ]
  },

  // ── 🆕 2차 확장: 광화문·안국·경복궁·종각역 추가 맛집 ───────────────────────

  {
    name: "한일관 광화문점",
    category: "한식 · 한국 전통 불고기/갈비탕 (1939년 노포)",
    cuisine: "korean",
    menus: ["전통 갈비탕 19,000원", "등심불고기 (1인) 28,000원", "골동반(궁중비빔밥) 20,000원"],
    price: "19,000~40,000원",
    priceNote: "1인 평균 2~3만원",
    walk: "도보 3분 (더케이트윈타워 B1)",
    rating: "4.5",
    ribbon: true,
    diet: ["light","nodiet"],
    weather: ["mild","cold","rainy"],
    mood: ["great","normal"],
    people: ["solo","small","medium","large"],
    budget: ["expensive"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "🏛️ 1939년 창업 광화문 전통 한식 노포. 고 노무현·이명박 대통령 단골. 서울식 불고기 원조. 외국인 바이어 접대·격식 있는 점심 1순위. 광화문역 지하 직결!",
    naver: "https://map.naver.com/v5/search/한일관+광화문점",
    reservation: [
      { label: "캐치테이블", url: "https://app.catchtable.co.kr/ct/shop/hanilkwan_gwanghwamun", color: "#FF6B35" },
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/한일관+광화문점", color: "#03C75A" },
    ]
  },

  {
    name: "이문설렁탕 종각점",
    category: "한식 · 설렁탕/곰국수 (1904년 노포)",
    cuisine: "korean",
    menus: ["설렁탕 13,000원", "곰국수 13,000원", "수육 28,000원"],
    price: "13,000~30,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 8분",
    rating: "4.4",
    ribbon: true,
    diet: ["light","nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","normal"],
    people: ["solo","small","medium","large"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "🏛️ 1904년 창업 대한민국 최고 노포 설렁탕집. 미쉐린 가이드 선정. 120년 한결같은 맑고 깊은 사골 국물. 양 많고 고기 듬뿍. 추운 날 점심 전설.",
    naver: "https://map.naver.com/v5/search/이문설렁탕+종각",
    reservation: []
  },

  {
    name: "미도갈비",
    category: "한식 · 한돈 수제 돼지갈비/와규",
    cuisine: "korean",
    menus: ["수제 돼지갈비 1인 18,000원", "와규 갈비 1인 35,000원", "냉면 12,000원"],
    price: "18,000~40,000원",
    priceNote: "1인 평균 2~3만원",
    walk: "도보 9분",
    rating: "4.5",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["hot","mild","cold"],
    mood: ["great","stressed","normal"],
    people: ["small","medium","large"],
    budget: ["expensive"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "종각 대표 수제 돼지갈비 맛집. 직접 손질한 두툼한 갈비가 시그니처. 단체 회식·팀 점심으로 딱. 불판 앞에서 구워주는 서비스도 만족.",
    naver: "https://map.naver.com/v5/search/미도갈비+종각",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/미도갈비+종각", color: "#03C75A" },
    ]
  },

  {
    name: "동해도 광화문점",
    category: "일식 · 무한리필 회전초밥/오마카세",
    cuisine: "japanese",
    menus: ["회전초밥 무한리필 25,800원~", "사시미 오마카세 100,000원", "스시 오마카세 70,000원"],
    price: "25,000~100,000원",
    priceNote: "1인 평균 2.5만원~",
    walk: "도보 7분",
    rating: "4.4",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["hot","mild"],
    mood: ["great","normal"],
    people: ["solo","small","medium","large"],
    budget: ["expensive"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "종각 대표 회전초밥 맛집. 1시간 무한리필로 원하는 만큼! 오마카세도 운영. 단체 모임부터 혼밥까지 가능. 초밥은 고단백 저칼로리로 다이어트에도 OK.",
    naver: "https://map.naver.com/v5/search/동해도+광화문점",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/동해도+광화문점", color: "#03C75A" },
    ]
  },

  {
    name: "곰국시집 종각",
    category: "한식 · 곰국수/수육",
    cuisine: "korean",
    menus: ["곰국수 12,000원", "전골국수 14,000원", "수육 28,000원"],
    price: "12,000~30,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 7분",
    rating: "4.4",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["mild","cold","rainy"],
    mood: ["tired","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "구수한 사골 곰국수와 부드러운 수육 맛집. 전골국수·칼국수 모두 평점 높고 김치 맛도 일품. 조용히 든든하게 먹고 싶은 날 딱.",
    naver: "https://map.naver.com/v5/search/곰국시집+종각",
    reservation: []
  },

  {
    name: "카페이마",
    category: "양식·카페 · 함박스테이크/와플",
    cuisine: "salad",
    menus: ["클래식 함박스테이크 13,500원", "토마토 바질 페스토 함박 15,000원", "수제 와플 9,000원"],
    price: "9,000~16,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 2분 (세종대로 152, 일민미술관 1층)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","hot"],
    mood: ["great","normal"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "광화문 미술관 건물 속 운치 있는 레스토랑. 옛날식 두툼한 함박스테이크가 추억의 맛. 점심 런치 할인 2천원 적용. 날 좋은 날 분위기 있는 점심 원한다면 여기.",
    naver: "https://map.naver.com/v5/search/카페이마+일민미술관+광화문",
    reservation: []
  },

  // ── 🆕 3차 확장: 빠진 카테고리 보강 ─────────────────────────────────────────

  {
    name: "송백부대찌개",
    category: "한식 · 부대찌개",
    cuisine: "korean",
    menus: ["부대찌개 1인 11,000원", "라면 사리 1,000원", "치즈 사리 1,000원"],
    price: "11,000~14,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 4분 (도렴빌딩 지하 1층)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["stressed","tired","normal"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "광화문 직장인 추천 찐 부대찌개. 도렴빌딩 지하에 위치. 오독오독 씹히는 감자·당근이 킥. 즉석 해장 가능한 가성비 부대찌개 맛집.",
    naver: "https://map.naver.com/v5/search/송백부대찌개+광화문",
    reservation: []
  },

  {
    name: "오감부대",
    category: "한식 · 부대찌개/소시지전골",
    cuisine: "korean",
    menus: ["부대찌개 1인 12,000원", "소시지전골 1인 13,000원", "라면 사리 1,000원"],
    price: "12,000~15,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 2분 (광화문 인근)",
    rating: "4.4",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["stressed","tired","normal"],
    people: ["small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "광화문 직장인 전골 맛집. 칼칼하고 얼큰한 국물에 햄·소시지 가득. 추운 날 팀 점심으로 딱. 소시지전골도 인기 메뉴.",
    naver: "https://map.naver.com/v5/search/오감부대+광화문",
    reservation: []
  },





  {
    name: "도치피자 광화문",
    category: "이탈리안 · 화덕피자",
    cuisine: "western",
    menus: ["디아볼라 24,000원", "고르곤졸라 22,000원", "버팔로 뽀모도로 22,000원", "콰트로 포르마지 26,500원", "감베리 에 루꼴라 23,500원"],
    price: "22,000~27,000원",
    priceNote: "1인 평균 1.5~2만원 (2인 이상 나눠먹기)",
    walk: "도보 2분 (세종대로21길 67-2)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold","rainy"],
    mood: ["great","normal"],
    people: ["small","medium","large"],
    budget: ["normal","expensive"],
    tags: ["waiting"],
    waiting: true,
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "서울 3대 화덕피자로 불리는 도치피자의 광화문점. 나폴리 정통 화덕에서 구운 쫄깃한 도우가 특징. 점심 오픈런 필수일 정도로 직장인 인기가 높음. 1~2층 규모로 단체석도 있어 팀 회식에 적합.",
    naver: "https://map.naver.com/v5/search/도치피자+광화문",
    reservation: [
      { label: "캐치테이블", url: "https://app.catchtable.co.kr/ct/shop/Ikk0711", color: "#FF6B35" },
    ]
  },

  {
    name: "광화문나폴리",
    category: "이탈리안 · 화덕피자/파스타",
    cuisine: "western",
    menus: ["마르게리타 피자", "미트러버 피자", "백상합 봉골레 파스타", "알리오올리오", "베이컨 버섯 트러플 리조또"],
    price: "20,000~30,000원",
    priceNote: "1인 평균 2만원대",
    walk: "도보 3분 (새문안로9길 24-4)",
    rating: "4.5",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold","rainy"],
    mood: ["great","normal","birthday"],
    people: ["small","medium","large"],
    budget: ["normal","expensive"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "나폴리 피자협회(AVPN) 정통 교육을 수료한 오너셰프가 운영. 나폴리 화산석으로 만든 참나무 화덕 사용. 슴슴하고 담백한 정통 화덕피자 맛. 아기자기한 유럽풍 인테리어로 분위기 좋음. 월요일 휴무, 예약 권장.",
    naver: "https://map.naver.com/v5/search/광화문나폴리",
    reservation: [
      { label: "테이블링 예약", url: "https://www.tabling.co.kr/restaurant/8827", color: "#FF6B35" },
    ]
  },

  {
    name: "광화문집 (김치찌개/제육볶음)",
    category: "한식 · 김치찌개/제육볶음",
    cuisine: "korean",
    menus: ["김치찌개 9,000원", "제육볶음 정식 10,000원", "된장찌개 8,000원"],
    price: "8,000~11,000원",
    priceNote: "1인 평균 9천원",
    walk: "도보 1분 (광화문 중심)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold","rainy"],
    mood: ["tired","normal","stressed"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "오랜 전통의 광화문 한식 백반집. 감칠맛 나는 묵은지 김치찌개와 계란말이 조합. 호박볶음·나박김치 등 정갈한 반찬. 집밥 같은 포근한 맛으로 단골 직장인 다수.",
    naver: "https://map.naver.com/v5/search/광화문집+종로구",
    reservation: []
  },


  {
    name: "부산식당",
    category: "한식 · 생태탕/대구탕",
    cuisine: "korean",
    menus: ["생태탕 12,000원", "대구탕 13,000원", "황태해장국 10,000원"],
    price: "10,000~14,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 1분 (광화문 인근)",
    rating: "4.4",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","stressed","normal"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "삼표 직원이 '전날 과음하고 가면 천상의 맛'이라 극찬한 생태탕 맛집. 생대구·생태 모두 신선하고 갓 한 밥이 정말 맛있는 광화문 해장 명소.",
    naver: "https://map.naver.com/v5/search/부산식당+광화문+생태탕",
    reservation: []
  },

  // ── 🆕 4차 확장: 순대국/돌솥/곰탕/중식 보강 ─────────────────────────────

  {
    name: "화목순대국전문 광화문1호점",
    category: "한식 · 순대국/내장탕",
    cuisine: "korean",
    menus: ["순대국 11,000원", "순순대탕 12,000원", "내장탕 13,000원"],
    price: "11,000~14,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 3분",
    rating: "4.5",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["tired","stressed","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    waiting: true,
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "성시경 '먹을텐데' 방영! 광화문 순대국 1티어. 곱창까지 들어간 푸짐한 순대국이 압도적. 새우젓 넣으면 감칠맛 폭발. 대기 각오하고 가야 하는 광화문 순대국 레전드.",
    naver: "https://map.naver.com/v5/search/화목순대국+광화문",
    reservation: []
  },

  {
    name: "관북 순대국 (종각)",
    category: "한식 · 순대국/수육",
    cuisine: "korean",
    menus: ["순대국 11,000원", "항정순대국 13,000원", "관북순대국(비지) 15,000원", "모둠수육(소) 25,000원"],
    price: "11,000~16,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 6분 (종로5길 32-5)",
    rating: "4.6",
    ribbon: true,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["tired","stressed","normal"],
    people: ["solo","small","medium","large"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "2026 블루리본 수록! 함경도식 이북 순대국. 관북순대국은 비지 넣어 끓여 크리미하고 구수한 국물이 특징. 들기름 굼순대도 별미. 광화문 일대 요즘 가장 뜨는 순대국집.",
    naver: "https://map.naver.com/v5/search/관북+순대국+종각",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/관북+순대국+종각", color: "#03C75A" },
    ]
  },

  {
    name: "청진동 장터순대국",
    category: "한식 · 순대국/해장국",
    cuisine: "korean",
    menus: ["순대국 10,000원", "뼈해장국 11,000원", "순대 단품 9,000원"],
    price: "9,000~13,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 3분 (청진동 골목)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","stressed","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "종각역 아침식사 TOP 맛집. 이른 아침부터 운영하는 광화문 청진동 순대국집. 깔끔하고 진한 국물에 순대·고기 푸짐. 출근 전 아침 해장 명소로 직장인 단골.",
    naver: "https://map.naver.com/v5/search/청진동+장터순대국",
    reservation: []
  },

  {
    name: "청진옥",
    category: "한식 · 해장국/설렁탕",
    cuisine: "korean",
    menus: ["해장국 11,000원", "선지해장국 12,000원", "설렁탕 12,000원"],
    price: "11,000~14,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 5분 (청진동)",
    rating: "4.1",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","stressed","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "종각역 새벽부터 문 여는 노포 해장국집. 진한 선지해장국·설렁탕으로 유명. 이른 아침 출근 전 뜨끈한 해장 한 그릇 원할 때 최고. 수십 년 된 광화문 골목 터줏대감.",
    naver: "https://map.naver.com/v5/search/청진옥+종각",
    reservation: []
  },

  {
    name: "스모야 (종각·돌솥밥)",
    category: "한식 · 돌솥밥",
    cuisine: "korean",
    menus: ["제육돌솥밥 13,000원", "낙지돌솥밥 14,000원", "차돌된장돌솥밥 14,000원"],
    price: "12,000~16,000원",
    priceNote: "1인 평균 1.4만원",
    walk: "도보 6분 (센트로폴리스 B동 1층)",
    rating: "4.5",
    ribbon: false,
    diet: ["nodiet","light"],
    weather: ["cold","rainy","mild"],
    mood: ["normal","great","tired"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "종각 직장인 핫플 돌솥밥 전문점. 제육·낙지·차돌된장 등 다양한 종류를 취향껏. 뜨끈하게 눌은밥까지 긁어 먹는 재미. 가볍고 든든한 점심으로 딱.",
    naver: "https://map.naver.com/v5/search/스모야+종각",
    reservation: []
  },

  {
    name: "애성회관 (한우곰탕)",
    category: "한식 · 한우곰탕",
    cuisine: "korean",
    menus: ["한우곰탕 보통 12,000원", "한우곰탕 특 14,000원", "한우 수육 25,000원"],
    price: "12,000~25,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 9분 (중구 남대문로5길 23)",
    rating: "4.8",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","normal"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    waiting: true,
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "시청·광화문 근처 곰탕 최상위 맛집. 점심 대기가 생길 만큼 인기지만 회전 빠름. 맑고 깊은 한우 곰탕 국물이 피로 회복에 딱. 가격 대비 퀄리티 압도적.",
    naver: "https://map.naver.com/v5/search/애성회관+북창동+한우곰탕",
    reservation: []
  },

  {
    name: "가봉루",
    category: "중식 · 고기튀김/짜장면",
    cuisine: "chinese",
    menus: ["고기튀김(소) 20,000원", "간짜장 8,000원", "짬뽕 8,000원", "군만두 6,000원"],
    price: "8,000~25,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 2분 (세종대로23길 3)",
    rating: "4.2",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["great","normal","stressed"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "광화문역 92m! 화교가 운영하는 노포 중식당. 삼표 직원 극찬 겉바속촉 고기튀김 시그니처. 짜장면·짬뽕도 가격 착함. 점심 피크엔 2층이 꽉 참. 인천 차이나타운 안 가도 됨.",
    naver: "https://map.naver.com/v5/search/가봉루+광화문",
    reservation: []
  },

  {
    name: "차이니즈키친홍성원 본점",
    category: "중식 · 짜장면/탕수육",
    cuisine: "chinese",
    menus: ["간짜장 9,000원", "삼선간짜장 13,000원", "차돌짬뽕 14,000원", "탕수육(소) 22,000원"],
    price: "9,000~25,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 7분",
    rating: "4.4",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["normal","stressed","great"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "망고플레이트 4.4점, 4만명 방문 희망! 꾸덕꾸덕 진한 간짜장 소스가 킥. 삼선간짜장·차돌짬뽕 모두 추천. 탕수육은 잡내 없이 바삭. 종각 직장인 짜장 생각날 때 1순위.",
    naver: "https://map.naver.com/v5/search/홍성원+종각",
    reservation: []
  },

  {
    name: "신신원",
    category: "중식 · 부추짜장/중화요리",
    cuisine: "chinese",
    menus: ["부추짜장 12,000원", "짬뽕 13,000원", "볶음밥 12,000원"],
    price: "12,000~20,000원",
    priceNote: "1인 평균 1.3만원",
    walk: "도보 1분 (광화문 인근)",
    rating: "4.4",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["great","normal","stressed"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "삼표 직원이 '유명인도 종종 볼 수 있는 찐맛집'으로 극찬. 부추짜장이 시그니처로 남녀노소 누구나 호불호 없는 맛. 광화문 중식 중 개성 있는 메뉴로 꼭 한번 가봐야 할 집.",
    naver: "https://map.naver.com/v5/search/신신원+광화문+짜장",
    reservation: []
  },

  {
    name: "차알 광화문 디타워점",
    category: "중식 · 모던 중식/마라탕면",
    cuisine: "chinese",
    menus: ["차알 마라탕면 17,000원", "오렌지치킨 18,000원", "마파두부 15,000원"],
    price: "15,000~25,000원",
    priceNote: "1인 평균 1.8만원",
    walk: "도보 2분 (디타워 3층)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","stressed","normal"],
    people: ["small","medium","large"],
    budget: ["normal"],
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "디타워 3층 모던 미국식 중식 레스토랑. 차돌 듬뿍 차알 마라탕면이 시그니처. 넓은 홀·모던한 인테리어로 회식·데이트 최적. 줄 서서 먹는 광화문 중식 핫플.",
    naver: "https://map.naver.com/v5/search/차알+광화문+디타워",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/차알+광화문+디타워", color: "#03C75A" },
    ]
  },

  {
    name: "웰믹스 광화문점",
    category: "샐러드·비건 · 믹스볼 전문",
    cuisine: "salad",
    menus: ["트리플 버섯 불고기 믹스볼", "옥수수를 품은 오리 믹스볼", "후무스 비건 믹스볼", "과카몰리 믹스볼"],
    price: "10,000~15,000원",
    priceNote: "1인 평균 1.2만원~",
    walk: "도보 2분 (세종대로23길 54)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet", "vegetarian"],
    weather: ["mild", "hot", "rainy"],
    mood: ["diet", "light", "normal"],
    people: ["solo", "small"],
    budget: ["cheap", "normal"],
    tags: ["vegetarian", "vegan_option"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#4caf50" },
    reason: "신선한 야채와 다양한 토핑으로 구성된 믹스볼 전문점. 서브웨이처럼 재료를 직접 골라 나만의 볼을 완성. 후무스·과카몰리 비건 옵션과 트리플 버섯 불고기 등 개성 있는 메뉴, 푸짐한 양이 인기.",
    naver: "https://map.naver.com/v5/search/웰믹스+광화문점",
    reservation: []
  },

  {
    name: "점점점 샐러드",
    category: "샐러드 · 웜플레이트/샐러드볼 전문",
    cuisine: "salad",
    menus: ["닭다리살 아보 플레이트 9,000원", "연어 플레이트 10,500원", "웜볼 (밥 선택 가능) 8,500원~"],
    price: "8,000~11,000원",
    priceNote: "1인 평균 9천원",
    walk: "도보 3분 (르메이에르종로타운 B1)",
    rating: "4.4",
    ribbon: false,
    diet: ["light","diet","nodiet"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal","tired"],
    people: ["solo","small"],
    budget: ["cheap","normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🥗 KT East 르메이에르 지하 직장인 다이어트 성지! 익힌 양배추·구운 버섯·아보카도 웜플레이트로 따뜻한 식단관리 가능. 가격도 착하고 혼밥·포장·배달 모두 OK.",
    naver: "https://map.naver.com/v5/search/점점점샐러드+광화문",
    reservation: []
  },

  {
    name: "카페마마스 광화문점",
    category: "샐러드 · 리코타샐러드/파니니/브런치",
    cuisine: "salad",
    menus: ["리코타치즈 샐러드 15,800원", "소고기 가지 파니니 16,800원", "감자스프 6,500원~"],
    price: "6,500~17,000원",
    priceNote: "1인 평균 1.5만원",
    walk: "도보 3분 (종로1길 50 더케이트윈타워 1층)",
    rating: "4.3",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["hot","mild","cold","rainy"],
    mood: ["great","normal","stressed"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#FFA500" },
    reason: "☕ 광화문 브런치 클래식. 꾸덕꾸덕 리코타치즈 샐러드와 파니니의 조화. 청포도 주스도 유명. 2013년부터 이어온 직장인 단골 브런치 맛집. 파니니는 20분 이상 소요되니 여유 있을 때 방문 추천.",
    naver: "https://map.naver.com/v5/search/카페마마스+광화문",
    reservation: []
  },

  // ⛔ 피그인더가든 광화문 — 2024년 12월 31일 폐업 (SPC 오프라인 전점 철수)

  {
    name: "슬로우캘리 종각역",
    category: "샐러드 · 포케/샐러드볼/그릴보울",
    cuisine: "salad",
    menus: ["클래식 연어 포케 14,900원", "오리엔탈 두부 포케 9,500원 (비건)", "블랙페퍼 치킨보울 11,500원"],
    price: "9,500~15,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 6분 (센트로폴리스 1층)",
    rating: "4.3",
    ribbon: false,
    diet: ["light","diet","vegetarian","nodiet"],
    weather: ["hot","mild"],
    mood: ["great","normal"],
    people: ["solo","small"],
    budget: ["normal"],
    calorie: { emoji: "🟢", label: "저칼로리", color: "#03C75A" },
    reason: "🥗 국내 1위 포케 프랜차이즈. 비건 두부 포케부터 연어·참치 포케까지. 신선한 재료와 자체 개발 소스로 건강한 한 끼. 키오스크 주문·포장 가능.",
    naver: "https://map.naver.com/v5/search/슬로우캘리+종각역",
    reservation: []
  },

  // ──────────────────────────────────────────────
  // KT WEST 빌딩 (세종대로 178) 신규 추가
  // ──────────────────────────────────────────────
  {
    name: "광화문옥희",
    category: "일식/참치·해산물",
    cuisine: "japanese",
    menus: ["참치회덮밥 19,000원~", "카이센동 18,000원~", "알탕 16,000원~"],
    price: "16,000~25,000원",
    priceNote: "1인 평균 2만원",
    walk: "도보 5분 (KT West 지하 1층)",
    rating: "4.5",
    ribbon: false,
    diet: ["seafood","nodiet"],
    weather: ["mild","cold","rainy"],
    mood: ["great","normal","celebrate"],
    people: ["solo","small","medium"],
    budget: ["normal","expensive"],
    hot: true,
    waiting: true,
    calorie: { emoji: "🟢", label: "저칼로리", color: "#4CAF50" },
    reason: "🐟 이춘복참치 셰프의 새 브랜드! KT West 핫플 중 단연 화제. 참치회덮밥·카이센동 양 넉넉하고 신선도 최상. 웨이팅 필수라 캐치테이블 예약 강추.",
    naver: "https://map.naver.com/v5/search/광화문옥희",
    reservation: [
      { label: "캐치테이블 예약", url: "https://app.catchtable.co.kr/ct/shop/okhee_gwm", color: "#FF6B35" }
    ]
  },
  {
    name: "키보 아츠아츠 (KT West)",
    category: "일식/경양식·돈카츠",
    cuisine: "japanese",
    menus: ["돈카츠 세트 16,000원~", "새우튀김 세트 18,000원~", "나폴리탄 스파게티 14,000원~"],
    price: "14,000~20,000원",
    priceNote: "1인 평균 1.7만원",
    walk: "도보 5분 (KT West 지하 1층)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["normal","stressed","great"],
    people: ["solo","small"],
    budget: ["normal"],
    hot: true,
    calorie: { emoji: "🔴", label: "고칼로리", color: "#E53935" },
    reason: "🍱 일본 경양식 감성 맞집. 두툼한 돈카츠·새우튀김·나폴리탄 스파게티 한 세트에 해결. KT West 지하 인기 맛집 중 하나.",
    naver: "https://map.naver.com/v5/search/키보아츠아츠+광화문",
    reservation: []
  },
  {
    name: "난포 (KT West)",
    category: "한식/퓨전한식",
    cuisine: "korean",
    menus: ["강된장쌈밥 18,000원~", "전복들깨국수 17,000원~", "새우감자전 14,000원"],
    price: "14,000~22,000원",
    priceNote: "1인 평균 1.7만원",
    walk: "도보 5분 (KT West 지하 1층)",
    rating: "4.2",
    ribbon: false,
    diet: ["nodiet","light"],
    weather: ["mild","cold","rainy"],
    mood: ["normal","great"],
    people: ["solo","small","medium"],
    budget: ["normal"],
    hot: true,
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#FFA500" },
    reason: "🌿 성수 유명 퓨전한식집 난포가 KT West 입성! 강된장쌈밥·전복들깨국수·돌문어간장국수. 깔끔하고 건강한 한식, 나무 인테리어로 분위기도 굿.",
    naver: "https://map.naver.com/v5/search/난포+광화문",
    reservation: []
  },
  {
    name: "보보식당 (KT West)",
    category: "중식/마라·동파육",
    cuisine: "chinese",
    menus: ["동파육 19,000원~", "마라가지튀김 14,000원~", "마파두부 13,000원~"],
    price: "13,000~22,000원",
    priceNote: "1인 평균 1.8만원",
    walk: "도보 5분 (KT West 지하 1층)",
    rating: "4.6",
    ribbon: false,
    diet: ["spicy","nodiet"],
    weather: ["cold","mild","rainy"],
    mood: ["great","celebrate","normal"],
    people: ["small","medium"],
    budget: ["normal"],
    hot: true,
    waiting: true,
    calorie: { emoji: "🔴", label: "고칼로리", color: "#E53935" },
    reason: "🥢 압구정 맛집 보보식당이 KT West 입성! 동파육·마라가지튀김 폭발적 인기. 평점 4.6★ KT West 중식 대표주자.",
    naver: "https://map.naver.com/v5/search/보보식당+광화문",
    reservation: [
      { label: "캐치테이블 예약", url: "https://app.catchtable.co.kr/ct/shop/bobo", color: "#FF6B35" }
    ]
  },
  {
    name: "타코챔피언 (KT West)",
    category: "양식/멕시칸·타코",
    cuisine: "western",
    menus: ["타코 2개 세트 14,000원~", "부리또볼 13,000원~", "나초 7,000원"],
    price: "12,000~18,000원",
    priceNote: "1인 평균 1.4만원",
    walk: "도보 5분 (KT West 지하 1층)",
    rating: "4.2",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["hot","mild"],
    mood: ["normal","great"],
    people: ["solo","small"],
    budget: ["normal"],
    hot: true,
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#FFA500" },
    reason: "🌮 왕십리 안테나숍으로 먼저 검증된 타코 맛집! KT West에 정식 오픈. 직화 고기 타코·부리또볼 점심 가성비 굿.",
    naver: "https://map.naver.com/v5/search/타코챔피언+광화문",
    reservation: []
  },
  {
    name: "덴푸라 감춘 (KT West)",
    category: "일식/튀김·덴푸라",
    cuisine: "japanese",
    menus: ["덴푸라 정식 18,000원~", "새우덴푸라 세트 20,000원~", "덴동 17,000원~"],
    price: "17,000~25,000원",
    priceNote: "1인 평균 2만원",
    walk: "도보 5분 (KT West 지하 1층)",
    rating: "4.4",
    ribbon: false,
    diet: ["nodiet","seafood"],
    weather: ["cold","mild"],
    mood: ["great","celebrate"],
    people: ["solo","small","medium"],
    budget: ["normal","expensive"],
    hot: true,
    calorie: { emoji: "🔴", label: "고칼로리", color: "#E53935" },
    reason: "🍤 KT West 신비주의 전략으로 화제 된 덴푸라 전문점. 바삭한 새우·야채 튀김 정식. 스시 오마카세 셰프가 개발한 판초밥 코끼리초밥과 같은 라인.",
    naver: "https://map.naver.com/v5/search/덴푸라감춘+광화문",
    reservation: []
  },
  {
    name: "오리지널팬케이크하우스 다이너 광화문점",
    category: "양식/브런치·팬케이크",
    cuisine: "western",
    menus: ["버터밀크팬케이크 13,000원~", "계란+팬케이크 세트 15,000원~", "아메리칸 브런치 18,000원~"],
    price: "12,000~20,000원",
    priceNote: "1인 평균 1.5만원",
    walk: "도보 5분 (KT West 지하 1층)",
    rating: "4.4",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold"],
    mood: ["great","normal","date"],
    people: ["solo","small","couple"],
    budget: ["normal"],
    hot: true,
    calorie: { emoji: "🔴", label: "고칼로리", color: "#E53935" },
    reason: "🥞 미국 다이너 감성 그대로! 버터밀크팬케이크+메이플시럽 클래식 조합. 광화문에서 브런치 하고 싶은 날 1순위. 네온사인·미국 소품으로 포토스팟도.",
    naver: "https://map.naver.com/v5/search/오리지널팬케이크하우스+광화문",
    reservation: []
  },
  // ⛔ 파이프그라운드 (KT West) — 기존 "파이프 그라운드 광화문" 항목(블루리본·4.9★)과 중복으로 제외
  {
    name: "도우룸 (KT West 2층)",
    category: "양식/피자·카페",
    cuisine: "western",
    menus: ["피자 22,000원~", "리조또 19,000원~", "파스타 18,000원~"],
    price: "18,000~28,000원",
    priceNote: "광화문 뷰 레스토랑, 1인 평균 2만원+",
    walk: "도보 5분 (KT West 2층, 광화문광장 뷰)",
    rating: "4.4",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","hot"],
    mood: ["great","celebrate","date"],
    people: ["small","couple","medium"],
    budget: ["expensive"],
    hot: true,
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#FFA500" },
    reason: "🏛️ KT West 2층 광화문광장 뷰 레스토랑! 통창에서 광화문 풍경 보며 피자·파스타. 데이트·특별한 점심에 딱.",
    naver: "https://map.naver.com/v5/search/도우룸+광화문",
    reservation: []
  },

  // ──────────────────────────────────────────────
  // 디타워 (종로3길 17) 신규 추가
  // ──────────────────────────────────────────────
  {
    name: "야마야 광화문 디타워점",
    category: "일식/이자카야·모츠나베/정식",
    cuisine: "japanese",
    menus: ["[런치] 모츠나베정식 19,800원", "[런치] 명란풍미닭튀김정식 16,900원", "[런치] 고등어미소조림정식 14,900원", "명란젓·타카나 무한리필 제공"],
    price: "14,900~19,800원",
    priceNote: "점심 런치정식 전용 운영 (단품 주문 불가), 명란젓·타카나 무한리필",
    walk: "도보 2분 (디타워 내)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold"],
    mood: ["great","celebrate","normal"],
    people: ["small","medium"],
    budget: ["normal"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#FFA500" },
    reason: "🍢 이자카야 분위기에 야키토리·가라아게. 회식·소모임에 최적. 디타워 특유의 테라스 분위기에서 하이볼 한 잔.",
    naver: "https://map.naver.com/v5/search/야마야+광화문+디타워",
    reservation: [
      { label: "캐치테이블 예약", url: "https://app.catchtable.co.kr/ct/shop/yamaya_ghm", color: "#FF6B35" }
    ]
  },
  {
    name: "타마린드 디타워점",
    category: "아시안/베트남·태국",
    cuisine: "asian",
    menus: ["쌀국수 15,000원~", "베트남식 갈비 스테이크 28,000원~", "월남쌈 세트 22,000원~"],
    price: "15,000~32,000원",
    priceNote: "1인 평균 2만원, 모임·데이트 최적",
    walk: "도보 2분 (디타워 5층)",
    rating: "4.4",
    ribbon: false,
    diet: ["nodiet","seafood"],
    weather: ["hot","mild"],
    mood: ["great","celebrate","date"],
    people: ["small","medium","group"],
    budget: ["normal","expensive"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#FFA500" },
    reason: "🇻🇳 광화문 베트남·태국·인도네시아 정통 요리 1위. 디타워 5층 분위기 좋은 공간. 팀 점심·소개팅·가족 모임 모두 OK. 패밀리세트 코스도 인기.",
    naver: "https://map.naver.com/v5/search/타마린드+광화문+디타워",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/타마린드+광화문+디타워", color: "#03C75A" }
    ]
  },
  {
    name: "주유별장 광화문점",
    category: "한식/퓨전한식·전통주",
    cuisine: "korean",
    menus: ["전복 들기름 카펠리니 22,000원", "엘에이갈비 28,000원~", "치즈감자전 16,000원"],
    price: "16,000~30,000원",
    priceNote: "점심 런치도 운영, 1인 평균 2만원+",
    walk: "도보 2분 (디타워 내)",
    rating: "4.2",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","mild"],
    mood: ["great","celebrate","normal"],
    people: ["small","medium","group"],
    budget: ["expensive"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#FFA500" },
    reason: "🍶 디타워 유일 전통주 한식주점. 복순도가 등 프리미엄 전통주·퓨전한식 조합. 전복 카펠리니·갈비 회식 메뉴 인기. 넓은 홀·룸 완비.",
    naver: "https://map.naver.com/v5/search/주유별장+광화문+디타워",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/주유별장+광화문+디타워", color: "#03C75A" }
    ]
  },
  {
    name: "매드포갈릭 광화문D타워",
    category: "양식/이탈리안·갈릭",
    cuisine: "western",
    menus: ["마늘빵 12,000원", "갈릭 파스타 19,000원~", "갈릭 스테이크 32,000원~"],
    price: "18,000~35,000원",
    priceNote: "모임·단체 추천, 1인 평균 2.5만원",
    walk: "도보 2분 (디타워 내)",
    rating: "4.1",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","mild"],
    mood: ["celebrate","great","normal"],
    people: ["small","medium","group"],
    budget: ["expensive"],
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#FFA500" },
    reason: "🧄 마늘 특화 이탈리안 레스토랑. 마늘빵·갈릭 파스타·스테이크 풀코스 모임 장소로 인기. 디타워 분위기 좋은 공간에서 넉넉한 회식 가능.",
    naver: "https://map.naver.com/v5/search/매드포갈릭+광화문+디타워",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/매드포갈릭+광화문+디타워", color: "#03C75A" }
    ]
  },
  // ⛔ 후와후와 디타워점 — 폐업 확인으로 제외 (2025년 기준)
  {
    name: "브루클린더버거조인트 디타워점",
    category: "양식/수제버거",
    cuisine: "western",
    menus: ["클래식버거 16,000원~", "더블패티버거 19,000원~", "트러플 프라이즈 9,000원"],
    price: "15,000~22,000원",
    priceNote: "1인 평균 1.7만원",
    walk: "도보 2분 (디타워 1층)",
    rating: "4.2",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","hot"],
    mood: ["great","normal","stressed"],
    people: ["solo","small"],
    budget: ["normal"],
    hot: true,
    calorie: { emoji: "🔴", label: "고칼로리", color: "#E53935" },
    reason: "🍔 서래마을 본점 유명 수제버거 맛집의 디타워 지점. 두툼한 패티·트러플 프라이즈 조합 점심 가성비 굿. 11:00~21:30 영업.",
    naver: "https://map.naver.com/v5/search/브루클린더버거조인트+광화문+디타워",
    reservation: []
  },

  // ── 🆕 SFC몰 (서울파이낸스센터) 식당 ───────────────────────────────────────




  {
    name: "다운타우너 (SFC몰)",
    category: "양식 · 수제버거",
    cuisine: "western",
    menus: ["다운타우너(단품) 10,300원", "아보카도버거 12,700원", "더블치즈트러플 12,400원", "핫앤사워치킨아보카도 11,900원"],
    price: "10,000~16,000원",
    priceNote: "1인 평균 1~1.5만원",
    walk: "도보 3분 (서울파이낸스센터 지하 1층)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["hot","mild"],
    mood: ["great","normal","stressed"],
    people: ["solo","small"],
    budget: ["cheap","normal"],
    hot: true,
    calorie: { emoji: "🔴", label: "고칼로리", color: "#E53935" },
    reason: "🍔 서울 수제버거 명가 다운타우너의 SFC몰 직영점. 고소하고 담백한 국산 소고기 패티가 핵심. 탐욕버거·더블베이컨치즈버거 인기. 점심 가성비 최강. 바삭한 어니언링·고구마프라이도 추천.",
    naver: "https://map.naver.com/v5/search/다운타우너+광화문+SFC",
    reservation: []
  },

  {
    name: "라멘 시미즈",
    category: "일식 · 시오/쇼유라멘",
    cuisine: "japanese",
    menus: ["시오라멘(소금) 11,000원", "쇼유라멘(간장) 11,000원", "시오/쇼유 스페셜(오리차슈+맛계란) 14,000원", "차슈덮밥 3,500원"],
    price: "11,000~14,000원",
    priceNote: "1인 평균 1.2만원",
    walk: "도보 3분 (새문안로3길 12 신문로아파트 지하1층)",
    rating: "4.8",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["cold","rainy","mild"],
    mood: ["tired","normal","solo_ok"],
    people: ["solo","small"],
    budget: ["normal"],
    waiting: false,
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "광화문 라멘 라인 최강자. 닭육수로 뽑은 깔끔하고 깊은 시오라멘 전문. 오리차슈와 탱탱한 면발이 일품. 바 테이블 혼밥 최적. 다이닝코드 평점 4.8, 일요일 휴무.",
    naver: "https://map.naver.com/v5/search/라멘시미즈+광화문",
    reservation: []
  },

  {
    name: "아오리의행방불명 광화문센트럴점",
    category: "일식 · 돈코츠/미소라멘",
    cuisine: "japanese",
    menus: ["돈코츠라멘 11,000원", "미소라멘 11,000원", "마제멘 11,000원", "TKG(간장계란밥) 별도"],
    price: "11,000~13,000원",
    priceNote: "1인 평균 1.1만원",
    walk: "도보 6분 (종로 87-1 2층)",
    rating: "3.9",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["cold","rainy"],
    mood: ["tired","normal"],
    people: ["solo","small"],
    budget: ["normal"],
    waiting: false,
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "이치란라멘 스타일의 1인 터치스크린 주문 돈코츠라멘. 맵기·파·마늘을 취향껏 조절 가능. 혼밥에 최적화된 1인 좌석. 종각역 인근 접근성 좋음.",
    naver: "https://map.naver.com/v5/search/아오리+행방불명+광화문+센트럴",
    reservation: []
  },

  {
    name: "평가옥 (광화문점)",
    category: "한식 · 평양냉면/어복쟁반",
    cuisine: "korean",
    menus: ["평양냉면(물/비빔) 16,000원", "어복쟁반 소 82,000원", "만두전골 1인 29,000원", "국수전골 1인 27,000원", "녹두지짐 17,000원"],
    price: "16,000~35,000원",
    priceNote: "1인 평균 2만원",
    walk: "도보 4분 (로얄빌딩 1층)",
    rating: "4.2",
    ribbon: false,
    diet: ["light","nodiet"],
    weather: ["hot","mild","cold"],
    mood: ["great","normal","tired"],
    people: ["solo","small","medium","large"],
    budget: ["normal","expensive"],
    waiting: false,
    calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
    reason: "3대째 이어온 정통 평양음식 전문점. 수요미식회 출연으로 유명. 슴슴하고 깔끔한 평양냉면과 이북식 어복쟁반·만두전골이 시그니처. 로얄빌딩 1층, 회식 룸 있음.",
    naver: "https://map.naver.com/v5/search/평가옥+광화문점",
    reservation: [
      { label: "네이버 예약", url: "https://map.naver.com/v5/search/평가옥+광화문점", color: "#03C75A" }
    ]
  },

  {
    name: "후라토식당 경복궁 본점",
    category: "일식 · 규카츠/오므라이스",
    cuisine: "japanese",
    menus: ["규카츠 19,500원", "반숙 오므라이스 14,500원", "스테키 정식 19,500원", "야마가타 민치카레 14,500원", "우삼겹 덮밥 14,500원"],
    price: "14,500~20,000원",
    priceNote: "1인 평균 1.8만원",
    walk: "도보 4분 (로얄빌딩 지하1층)",
    rating: "4.3",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["mild","cold","rainy"],
    mood: ["great","normal","tired"],
    people: ["solo","small","medium"],
    budget: ["normal","expensive"],
    waiting: true,
    calorie: { emoji: "🔴", label: "고칼로리", color: "#ff4444" },
    reason: "광화문 최고 인기 규카츠 본점. 겉은 바삭하고 속은 촉촉한 소고기 규카츠와 부드러운 반숙 오므라이스가 시그니처. 저녁은 캐치테이블 예약 필수, 점심은 웨이팅 각오.",
    naver: "https://map.naver.com/v5/search/후라토식당+경복궁본점",
    reservation: [
      { label: "캐치테이블", url: "https://app.catchtable.co.kr/ct/shop/hurato", color: "#FF6B35" }
    ]
  },
  {
    name: "샐러드로우앤트라타 광화문점",
    category: "양식 · 샐러드/타코/부리또",
    cuisine: "western",
    menus: ["부리또볼 9,500원~11,000원", "크리스피 더블타코 약 10,000원", "트라타 부리또 약 10,000원", "퀘사디아", "샐러드"],
    price: "9,000~13,000원",
    priceNote: "1인 평균 1만원",
    walk: "도보 3분 (새문안로5길 31)",
    rating: "4.0",
    ribbon: false,
    diet: ["diet","vegetarian","nodiet"],
    weather: ["mild","hot"],
    mood: ["great","normal","tired"],
    people: ["solo","small","medium"],
    budget: ["cheap","normal"],
    waiting: false,
    calorie: { emoji: "🟢", label: "저칼로리", color: "#27ae60" },
    reason: "샐러드+멕시칸 조합으로 광화문 직장인에게 인기. 커스텀 부리또볼과 타코가 대표 메뉴. 고수 등 재료 조절 가능. 평일 아침 8:30부터 운영해 조찬 미팅도 OK. 넓은 내부, 주말에도 영업.",
    naver: "https://map.naver.com/v5/search/샐러드로우앤트라타+광화문",
    reservation: []
  },
  {
    name: "고우가 광화문점",
    category: "한식 · 한우 오마카세",
    cuisine: "korean",
    menus: ["런치 A코스 39,000원", "런치 B코스 59,000원", "런치 C코스 79,000원", "한우구이·코스요리"],
    price: "39,000~79,000원",
    priceNote: "전 좌석 프라이빗룸, 예약 필수",
    walk: "도보 3분 (SFC몰 지하2층 205호, 광화문역 5번 출구)",
    rating: "4.6",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["any"],
    mood: ["special", "business", "normal", "great"],
    people: ["small","medium","large"],
    budget: ["expensive"],
    waiting: false,
    calorie: { emoji: "🔴", label: "고칼로리", color: "#e74c3c" },
    reason: "SFC몰 지하 전 좌석 프라이빗룸 한우 오마카세. 런치 A코스부터 접대·기념일·비즈니스 미팅에 최적. 콜키지 프리, 기념일 서비스 제공.",
    naver: "https://map.naver.com/p/search/고우가%20광화문",
    reservation: true,
  },
  {
    name: "일품진진수라 광화문점",
    category: "한식 · 한정식",
    cuisine: "korean",
    menus: ["점심 C코스 39,000원", "점심 B코스 59,000원", "궁중구절판", "보리굴비", "불고기"],
    price: "39,000~80,000원",
    priceNote: "점심 코스 C 3.9만~A 7.9만, 전 좌석 룸",
    walk: "도보 5분 (종로구 종로5길 7 타워8빌딩 B2)",
    rating: "4.1",
    ribbon: false,
    diet: ["nodiet"],
    weather: ["any"],
    mood: ["special", "business", "normal", "great"],
    people: ["small","medium","large"],
    budget: ["expensive"],
    waiting: false,
    calorie: { emoji: "🟡", label: "보통", color: "#f39c12" },
    reason: "타워8빌딩 B2 고급 한정식. 전 좌석 룸으로 VIP 접대·상견례·비즈니스 런치에 최적. 궁중식 한상차림, 예약 권장.",
    naver: "https://map.naver.com/p/search/진진수라%20광화문",
    reservation: true,
  },
  {
    name: "울프강 스테이크하우스 광화문점",
    category: "양식 · 스테이크",
    cuisine: "western",
    menus: ["런치코스 9만원~", "드라이에이징 스테이크", "포터하우스", "필레미뇽"],
    price: "90,000~200,000원",
    priceNote: "런치코스 9만원~, 접대·기념일 추천, 예약 필수",
    walk: "도보 2분 (세종대로21길 40 2층)",
    rating: 4.5,
    ribbon: false,
    diet: ["nodiet"],
    weather: ["any"],
    mood: ["special", "business"],
    people: ["solo","small","medium"],
    budget: ["expensive"],
    waiting: false,
    calorie: { emoji: "🔴", label: "높음", color: "#e74c3c" },
    reason: "미국 3대 스테이크하우스 울프강의 광화문점. USDA 프라임 28일 드라이에이징 스테이크. 접대·기념일·특별한 날 최적. 런치코스 예약 필수.",
    naver: "https://map.naver.com/p/search/울프강스테이크하우스광화문",
    reservation: true,
  },
  {
    name: "친니",
    category: "중식 · 탕수육·코스",
    cuisine: "chinese",
    menus: ["탕수육", "깐풍기", "민물장어덮밥 28,000원", "해산물덮밥 20,000원", "매 코스 59,000원"],
    price: "20,000~59,000원",
    priceNote: "점심 단품 2만원대, 코스 5.9만원~, 수요미식회 탕수육 맛집",
    walk: "도보 3분 (세종문화회관 지하 1층)",
    rating: 4.2,
    ribbon: false,
    diet: ["nodiet"],
    weather: ["any"],
    mood: ["special", "business", "normal"],
    people: ["solo","small","medium","large"],
    budget: ["normal", "expensive"],
    waiting: true,
    calorie: { emoji: "🟡", label: "보통", color: "#f39c12" },
    reason: "세종문화회관 지하 중식당. 수요미식회·맛있는녀석들 출연 탕수육 맛집. 점심 단품 2만원대부터 코스까지 다양. 단체·접대·모임에 적합.",
    naver: "https://map.naver.com/p/search/친니광화문",
    reservation: true,
  },
  {
    name: "스시산원 궁",
    category: "일식 · 스시오마카세",
    cuisine: "japanese",
    menus: ["런치 오마카세 60,000원", "디너 오마카세 90,000원"],
    price: "60,000~90,000원",
    priceNote: "런치 오마카세 6만원, 예약 필수 (캐치테이블)",
    walk: "도보 3분 (케이트윈타워 B동 지하1층)",
    rating: 4.4,
    ribbon: false,
    diet: ["nodiet"],
    weather: ["any"],
    mood: ["special", "business"],
    people: ["solo","small"],
    budget: ["expensive"],
    waiting: false,
    calorie: { emoji: "🟡", label: "보통", color: "#f39c12" },
    reason: "스시산원 4번째 브랜드 광화문점. 산지 직송 자연산 수산물 오마카세. 런치 6만원으로 미들급 오마카세 중 가성비 우수. 다찌 좌석 구성.",
    naver: "https://map.naver.com/p/search/스시산원궁광화문",
    reservation: true,
  },
  {
    name: "라브리",
    category: "양식 · 프렌치",
    cuisine: "western",
    menus: ["런치 프렌치 코스 6~8만원", "꽃등심 스테이크", "바닷가재 메인", "프렌치 코스 풀코스"],
    price: "60,000~80,000원",
    priceNote: "런치 코스 6~8만원, 메인 선택에 따라 가격 상이. 예약 권장.",
    walk: "도보 4분 (교보빌딩 2층)",
    rating: 4.3,
    ribbon: false,
    diet: ["nodiet"],
    weather: ["any"],
    mood: ["special", "business"],
    people: ["solo","small"],
    budget: ["expensive"],
    waiting: false,
    calorie: { emoji: "🟡", label: "보통", color: "#f39c12" },
    reason: "광화문 교보빌딩 2층의 30년 전통 정통 프렌치 레스토랑. 대사관·외교부·대기업 임직원 단골 맛집. 런치 코스 6~8만원으로 프라이빗한 비즈니스 점심·기념일에 최적.",
    naver: "https://map.naver.com/p/search/라브리%20광화문",
    reservation: true,
  },
  {
    name: "신승관",
    category: "중식 · 정통중화요리",
    cuisine: "chinese",
    menus: ["사천꿔바로우 18,000원", "삼선볶음밥 15,000원", "해물짬뽕 16,000원", "코스요리 40,000원~"],
    price: "15,000~25,000원",
    priceNote: "단품 1.5~2만원대, 코스 4만원~8만원. 콜키지프리.",
    walk: "도보 5분 (르메이에르 2층)",
    rating: 4.2,
    ribbon: false,
    diet: ["nodiet"],
    weather: ["any"],
    mood: ["daily", "business"],
    people: ["solo","small","medium","large"],
    budget: ["normal"],
    waiting: false,
    calorie: { emoji: "🟡", label: "보통", color: "#f39c12" },
    reason: "화교 3대째 운영하는 60년 전통 정통 중화요리. 48시간 숙성 수제면, 직접 만든 소스가 특징. 룸 6개 완비로 회식·모임에 최적. 콜키지프리.",
    naver: "https://map.naver.com/p/search/신승관%20광화문",
    reservation: false,
  },
];

const CUISINE_TABS = [
  { value: "all", emoji: "🍽️", label: "전체" },
  { value: "korean", emoji: "🍲", label: "한식" },
  { value: "chinese", emoji: "🥢", label: "중식" },
  { value: "japanese", emoji: "🍣", label: "일식" },
  { value: "western", emoji: "🍕", label: "양식" },
  { value: "asian", emoji: "🍜", label: "아시안" },
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
  cuisine: { all:"전체", korean:"한식", chinese:"중식", japanese:"일식", western:"양식", salad:"샐러드/카페", asian:"아시안" },
};

const SECTION_TITLES = {
  weather: "오늘 날씨가 어때요?",
  mood: "오늘 기분은요?",
  people: "몇 명이서 먹어요?",
  diet: "식단 관리 중이에요?",
  budget: "1인 예산은요?",
  cuisine: "어떤 음식이 당겨요?",
};

// 예산 호환 테이블
// cheap(~1만원): cheap만
// normal(1~2만원): cheap, normal (저렴한 것도 허용)
// expensive(2만원+): expensive만 (1만원짜리는 보여주지 않음 — 목적이 다름)
const BUDGET_COMPAT = {
  cheap:     ["cheap"],
  normal:    ["cheap", "normal"],
  expensive: ["expensive"],
};

function scoreRestaurant(r, sel, recentNames = []) {
  let score = 0;

  // ⓪ 음식 종류 필터: 엄격 필터 (all이면 통과)
  if (sel.cuisine && sel.cuisine !== 'all') {
    if (r.cuisine !== sel.cuisine) return -999;
  }

  // ① 예산 조건: 엄격 필터링
  const compatBudgets = BUDGET_COMPAT[sel.budget] || [];
  const budgetMatch = r.budget.some(b => compatBudgets.includes(b));
  if (!budgetMatch) return -999;
  if (r.budget.includes(sel.budget)) score += 3; // 완벽 일치 보너스 (6→3으로 축소)
  else score += 1;

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
    score += 1;
  }

  // ③ 날씨
  if (r.weather.includes(sel.weather)) score += 8;
  else score -= 3;

  // ④ 기분
  if (r.mood.includes(sel.mood)) score += 7;
  else score -= 6; // 기분 불일치 패널티 강화: 스트레스날에 초밥/샐러드 뜨지 않도록

  // ⑤ 인원
  // large(단체)는 엄격 필터: 해당 식당이 large를 지원하지 않으면 제외
  if (sel.people === "large" && !r.people.includes("large")) return -999;
  if (r.people.includes(sel.people)) score += 6;
  else score -= 4;

  // ⑤-1 혼밥 시 웨이팅 긴 식당 패널티: 혼자 가서 오래 기다리긴 비효율
  if (sel.people === "solo" && r.waiting) score -= 8;

  // ⑥ 블루리본 + 평점 보너스 (블루리본 3→1.5로 축소, 영향력 줄임)
  if (r.ribbon) score += 1.5;
  score += (parseFloat(r.rating) - 4.0) * 1.5; // 평점 가중치도 소폭 축소

  // ⑦ 태그 광범위 패널티 강화: 날씨·기분 태그 많을수록 감점
  const tagCount = r.weather.length + r.mood.length;
  score -= (tagCount - 4) * 1.2; // 0.6→1.2로 강화

  // ⑧ 쿨다운 페널티: 최근에 추천됐던 식당일수록 감점 (최대 -8점)
  const recentIdx = recentNames.indexOf(r.name);
  if (recentIdx !== -1) {
    // 최근일수록 강한 페널티: 1번 전=-8, 2번 전=-6, ... 5번 이후=-2
    score -= Math.max(2, 8 - recentIdx * 1.5);
  }

  // ⑨ 랜덤: 충분히 크게 → 매번 다른 결과
  score += Math.random() * 5.0;
  return score;
}

export default function LunchRecommender() {
  const [selections, setSelections] = useState({ cuisine: 'all', weather: null, mood: null, people: null, diet: null, budget: null });
  const [step, setStep] = useState("form"); // form | loading | results
  const [results, setResults] = useState({ list: [], relaxedMsg: null });
  const recentSeen = React.useRef([]); // 최근 추천 기록 (쿨다운)
  const resultsTopRef = React.useRef(null); // 결과 최상단 ref
  const pageTopRef = React.useRef(null); // 페이지 최상단 ref (다시 추천받기용)
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
    const interval = setInterval(() => setLoadingDot(d => (d + 1) % 3), 150);
    const timeout = setTimeout(() => {
      try {
        const getResults = (dietOverride) => {
          const sel = dietOverride ? { ...selections, diet: dietOverride } : selections;
          const recent = recentSeen.current; // 최근 추천 기록 참조
          const scored = restaurantDB
            .map(r => ({ ...r, score: scoreRestaurant(r, sel, recent) }))
            .filter(r => r.score > -999);
          scored.sort((a, b) => b.score - a.score);

          // 다양성 로직: 소분류(category 뒷부분) 기준으로 같은 종류 최대 1개씩
          // 단, cuisine 대분류별로 최소 1개 보장 시도
          const diversified = [];
          const subCatCounts = {};  // 소분류 카운트 (국밥류, 순대국류 등 중복 방지)
          const cuisineCounts = {}; // 대분류 카운트

          for (const r of scored) {
            const subCat = (r.category || "").split("·").slice(1).join("·").trim() || r.cuisine;
            const cuisine = r.cuisine;
            subCatCounts[subCat] = (subCatCounts[subCat] || 0) + 1;
            cuisineCounts[cuisine] = (cuisineCounts[cuisine] || 0) + 1;
            // 소분류 최대 1개 (단, cuisine이 처음 나온 경우 1개 허용)
            if (subCatCounts[subCat] <= 1 || cuisineCounts[cuisine] === 1) {
              diversified.push(r);
            }
            if (diversified.length >= 10) break;
          }
          return diversified.length >= 3 ? diversified : scored.slice(0, 10);
        };

        let final = getResults(null);
        let relaxedMsg = null;

        // 결과가 5개 미만이면 식단 조건 자동 완화
        if (final.length < 5 && selections.diet === "diet") {
          final = getResults("light");
          if (final.length >= 3) relaxedMsg = "💡 다이어트 식당이 부족해서 저칼로리 메뉴도 포함했어요";
        }
        // vegetarian은 완화하지 않음 — 고기/생선 식당은 절대 포함하지 않음
        if (final.length < 5 && selections.diet !== "vegetarian") {
          final = getResults("nodiet");
          if (final.length >= 3) relaxedMsg = "💡 조건에 딱 맞는 식당이 적어서 비슷한 곳도 포함했어요";
        }

        setResults({ list: final, relaxedMsg });

        // 이번에 추천된 식당들을 최근 기록에 추가 (최대 20개 유지)
        const newNames = final.map(r => r.name);
        recentSeen.current = [...newNames, ...recentSeen.current].slice(0, 20);
      } catch(e) {
        console.error(e);
        setResults({ list: [], relaxedMsg: null });
      }
      setStep("results");
      setTimeout(() => {
        resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }, 600);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [step]);

  const handleSelect = (group, value) => {
    setSelections(prev => ({ ...prev, [group]: value }));
    setShowAlert(false);
  };

  const handleRecommend = () => {
    const allSelected = Object.entries(selections).filter(([k]) => k !== 'cuisine').every(([,v]) => v !== null);
    if (!allSelected) { setShowAlert(true); return; }
    setStep("loading");
  };

  const handleReset = () => {
    setSelections({ cuisine: 'all', weather: null, mood: null, people: null, diet: null, budget: null });
    setResults({ list: [], relaxedMsg: null });
    setStep("form");
    setTimeout(() => {
      pageTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  return (
    <div ref={pageTopRef} style={{ fontFamily: "'Noto Sans KR', sans-serif", background: "#fafafa", minHeight: "100vh", color: "#0a0a0a" }}>
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

            {/* ── 음식 종류 탭 (맨 위) ── */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <span style={{ color: "#E3001B", fontWeight: 900, fontSize: 12, letterSpacing: 1 }}>00</span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>어떤 음식이 당겨요?</span>
                <span style={{ fontSize: 11, color: "#aaa", marginLeft: 4 }}>선택 안 하면 전체 추천</span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CUISINE_TABS.map(tab => {
                  const selected = selections.cuisine === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => handleSelect('cuisine', tab.value)}
                      style={{
                        background: selected ? "#E3001B" : "white",
                        color: selected ? "white" : "#0a0a0a",
                        border: `2px solid ${selected ? "#E3001B" : "#e8e8e8"}`,
                        borderRadius: 50,
                        padding: "10px 18px",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.18s",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        boxShadow: selected ? "0 4px 14px rgba(227,0,27,0.25)" : "none",
                        transform: selected ? "translateY(-1px)" : "none",
                      }}
                    >
                      <span>{tab.emoji}</span>
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ height: 1, background: "#e8e8e8", margin: "0 0 36px" }} />

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
              <div style={{ marginTop: 10, fontSize: 12, color: "#aaa" }}>광화문 맛집 {restaurantDB.length}곳 데이터 기반으로 추천해 드려요</div>
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
          <div ref={resultsTopRef}>
            {/* 결과 헤더 */}
            <div style={{ background: "#0a0a0a", borderRadius: 20, padding: "26px 28px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, background: "radial-gradient(circle, rgba(227,0,27,0.3), transparent 70%)" }} />
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: "#E3001B", textTransform: "uppercase", marginBottom: 8 }}>AI 추천 결과</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "white", lineHeight: 1.4 }}>
                {LABELS.mood[selections.mood]}인 오늘, 광화문 맛집 TOP 10 🍽️
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                {Object.entries(selections).filter(([k,v]) => k !== 'cuisine' || v !== 'all').map(([k, v]) => (
                  <span key={k} style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", fontSize: 11, padding: "3px 11px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.15)" }}>
                    {LABELS[k]?.[v] ?? v}
                  </span>
                ))}
              </div>
            </div>

            {/* 조건 완화 안내 배너 */}
            {results.relaxedMsg && (
              <div style={{ background: "#fffbf0", border: "1px solid #ffe082", borderRadius: 14, padding: "12px 18px", marginBottom: 16, fontSize: 13, color: "#7a5c00", display: "flex", alignItems: "center", gap: 8 }}>
                {results.relaxedMsg}
              </div>
            )}

            {/* 결과 없음 (식단 조건이 너무 엄격할 때) */}
            {results.list.length === 0 && (
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
            {results.list.map((r, i) => (
              <div key={r.name} style={{
                background: "white",
                border: `2px solid ${i === 0 ? "#E3001B" : "#e8e8e8"}`,
                borderRadius: 20,
                padding: 24,
                marginBottom: 16,
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

                {/* 조건 매칭 배지 */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                  {r.weather.includes(selections.weather) && (
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#fffde7", color: "#f57f17", border: "1px solid #ffe082", fontWeight: 600 }}>
                      {OPTIONS.weather.find(o=>o.value===selections.weather)?.emoji} 오늘 날씨 딱
                    </span>
                  )}
                  {r.mood.includes(selections.mood) && (
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#fce4ec", color: "#c62828", border: "1px solid #f48fb1", fontWeight: 600 }}>
                      {OPTIONS.mood.find(o=>o.value===selections.mood)?.emoji} 오늘 기분 맞춤
                    </span>
                  )}
                  {r.people.includes(selections.people) && (
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: "#e8eaf6", color: "#283593", border: "1px solid #9fa8da", fontWeight: 600 }}>
                      {OPTIONS.people.find(o=>o.value===selections.people)?.emoji} 인원 최적
                    </span>
                  )}
                </div>
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