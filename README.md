# 🍽️ KT 광화문 점심 추천기

KT 광화문 West와 East 빌딩 직원을 위한 AI 기반 맞춤형 점심 맛집 추천 서비스

![React](https://img.shields.io/badge/React-19.2.4-blue)
![OpenAI](https://img.shields.io/badge/OpenAI-gpt--4o--mini-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ 주요 기능

### 🎯 스마트 추천 시스템
- **날씨 기반 추천**: 더운 날엔 시원한 메뉴, 비 오는 날엔 따뜻한 국물 요리
- **기분 맞춤**: 숙취, 다이어트, 임원 동행 등 상황별 최적의 선택
- **인원 고려**: 혼밥부터 단체 회식까지 인원에 맞는 추천
- **식단 관리**: 채식, 다이어트, 가벼운 식사 옵션
- **예산 범위**: 1만원 이하부터 프리미엄 식사까지

### 🤖 AI 추천 (선택적)
- OpenAI GPT-4o-mini 기반 개인화 추천
- 최근 방문 이력 반영하여 새로운 맛집 발견
- 다양한 cuisine 타입 제공

### 📍 위치 기반
- KT East/West 빌딩 기준 도보 시간 계산
- 700m 반경 내 104개 검증된 맛집 정보
- 실제 경로 반영 (직선거리 × 1.3배)

### 🎨 직관적 UI
- 빠른 추천 프리셋 12종 (비 오는 날, 다이어트, 팀점심 등)
- 최근 본 식당 제외 기능
- 상세한 식당 정보 및 예약 링크 제공

## 🚀 빠른 시작

### 설치

```bash
# 저장소 클론
git clone <repository-url>
cd kt-lunch

# 의존성 설치
npm install
```

### 환경 설정 (선택적 - OpenAI 사용 시)

```bash
# .env 파일 생성
echo "REACT_APP_OPENAI_API_KEY=your-api-key-here" > .env
```

> **참고**: OpenAI API 키가 없어도 기본 알고리즘 추천으로 정상 작동합니다.

### 실행

```bash
# 개발 서버 실행
npm start

# 브라우저가 자동으로 http://localhost:3000 열림
```

### 빌드

```bash
# 프로덕션 빌드
npm run build

# build/ 폴더에 최적화된 파일 생성
```

## 📊 데이터 현황

- **총 식당 수**: 104개
- **카테고리**: 한식, 중식, 일식, 양식, 아시안, 샐러드, 멕시칸, 인도
- **가격대**: 8,000원 ~ 100,000원
- **평균 평점**: 4.3★ 이상
- **특별 맛집**: 미쉐린 빕구르망, 블루리본 선정 다수

## 🏗️ 프로젝트 구조

```
kt-lunch/
├── public/              # 정적 파일
├── src/
│   ├── App.js          # 메인 애플리케이션 (3,500줄)
│   ├── constants/      # 상수 정의 ✅
│   │   ├── options.js  # 필터 옵션
│   │   ├── presets.js  # 빠른 추천 프리셋
│   │   ├── config.js   # 앱 설정
│   │   └── scoring.js  # 점수 가중치
│   ├── types/          # 타입 정의 ✅
│   │   ├── Restaurant.js
│   │   ├── Selection.js
│   │   ├── RecommendationResult.js
│   │   └── index.js
│   └── (리팩토링 진행 중...)
├── AGENTS.md           # 커스텀 AI 에이전트
├── REFACTORING.md      # 리팩토링 가이드
└── README.md           # 이 파일
```

## 🎯 추천 알고리즘

### 점수 계산 시스템

각 식당에 대해 다음 기준으로 점수 부여:

```
총점 = 기본점수 
     + 날씨 매칭 (+50점)
     + 기분 매칭 (+60점)
     + 인원 매칭 (+20점)
     + 식단 매칭 (+100점, 채식 등)
     + 예산 매칭 (+15점)
     + 평점 보너스 (평점 × 5점)
     + 리본 맛집 (+10점)
     - 최근 방문 (-20점)
     + 무작위성 (0~50점)
```

### 필터링 우선순위

1. **필수 필터**: 식단 (채식, 다이어트)
2. **강력 추천**: 날씨, 기분
3. **참고 사항**: 인원, 예산
4. **다양성**: 브랜드 중복 제거, cuisine 다양화

## 🆕 새 식당 추가하기

`src/App.js`의 `restaurantDB` 배열에 다음 형식으로 추가:

```javascript
{
  name: "식당명",
  category: "카테고리 · 설명",
  cuisine: "korean", // 'korean'|'chinese'|'japanese'|'western'|'asian'|'salad'|'mexican'|'indian'
  coords: { lat: 37.5703, lng: 126.9835 },
  menus: ["메뉴1 10,000원", "메뉴2 12,000원"],
  price: "10,000~15,000원",
  priceNote: "1인 평균 1.2만원",
  walk: "도보 3분",
  rating: "4.5",
  ribbon: false,
  diet: ["nodiet"], // 'nodiet'|'light'|'diet'|'vegetarian'
  weather: ["hot", "mild"], // 'hot'|'mild'|'cold'|'rainy'
  mood: ["safe", "team"], // 'safe'|'hearty'|'executive'|'hangover'|'team'|'exciting'|'sad'
  people: ["solo", "small"], // 'solo'|'small'|'medium'|'large'
  budget: ["normal"], // 'cheap'|'normal'|'expensive'
  calorie: { emoji: "🟡", label: "보통칼로리", color: "#f5a623" },
  reason: "추천 이유",
  naver: "https://map.naver.com/...",
  reservation: [
    { label: "네이버 예약", url: "...", color: "#03C75A" }
  ]
}
```

## 🤖 커스텀 AI 에이전트

프로젝트에는 두 가지 전문 AI 에이전트가 정의되어 있습니다:

### Planner Agent (계획 에이전트)
- 요구사항 분석 및 구체화
- 작업 분해 및 우선순위 설정
- 리스크 관리 및 대응 방안
- 상세 계획 수립

### Developer Agent (개발자 에이전트)
- 클린 아키텍처 기반 코드 구현
- SOLID 원칙 준수
- 성능 최적화 및 리팩토링
- 테스트 가능한 코드 작성

자세한 내용은 [AGENTS.md](AGENTS.md) 참조

## 🔧 리팩토링 진행 상황

현재 Phase 1 진행 중 (37.5% 완료)

- ✅ **폴더 구조 생성**: 8개 디렉토리
- ✅ **상수 추출**: 4개 파일, 100+ 상수
- ✅ **타입 정의**: 4개 파일, 18개 typedef
- 🔄 **데이터 레이어**: Repository Pattern (예정)
- 🔄 **유틸리티 함수**: 거리 계산 등 (예정)
- 🔄 **서비스 레이어**: 추천 알고리즘 분리 (예정)
- 🔄 **Custom Hooks**: 비즈니스 로직 분리 (예정)
- 🔄 **컴포넌트 분리**: 15+ 컴포넌트 (예정)

상세 가이드: [REFACTORING.md](REFACTORING.md)

## 📈 성능 최적화

### 현재 성능
- **초기 로딩**: < 2초
- **추천 속도**: < 500ms (알고리즘), < 3초 (LLM)
- **번들 크기**: ~300KB (gzipped)

### 개선 계획
- 코드 스플리팅으로 30% 번들 감소
- 메모이제이션으로 50% 렌더링 개선
- 가상화로 긴 리스트 최적화

## 🧪 테스트

```bash
# 테스트 실행 (예정)
npm test

# 커버리지 (예정)
npm run test:coverage
```

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- 식당 정보: 네이버 지도, 블루리본, 미쉐린 가이드
- 기술 스택: React, OpenAI API
- 디자인 영감: 현대적이고 직관적인 UX

## 📞 Support

문제가 발생하거나 제안사항이 있으면 Issue를 열어주세요!

---

**Made with ❤️ for KT 광화문 직원들**

*마지막 업데이트: 2026-03-12*

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
