# 🍽️ KT 광화문 점심 추천기

KT 광화문 West와 East 빌딩 직원을 위한 AI 기반 맞춤형 점심 맛집 추천 서비스

🔗 **Live**: [kt-lunch.vercel.app](https://kt-lunch.vercel.app)

![React](https://img.shields.io/badge/React-19.2.4-blue)
![Azure OpenAI](https://img.shields.io/badge/Azure_OpenAI-gpt--5--nano-green)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)
![License](https://img.shields.io/badge/license-MIT-blue)

## ✨ 주요 기능

### 🎯 스마트 추천 시스템
- **날씨 기반 추천**: 더운 날엔 시원한 메뉴, 비 오는 날엔 따뜻한 국물 요리
- **기분 맞춤**: 숙취, 다이어트, 임원 동행 등 상황별 최적의 선택
- **인원 고려**: 혼밥부터 단체 회식까지 인원에 맞는 추천
- **식단 관리**: 채식, 다이어트, 가벼운 식사 옵션
- **예산 범위**: 1만원 이하부터 프리미엄 식사까지

### 🤖 AI 추천 이유 (Azure OpenAI)
- Azure OpenAI **gpt-5-nano** 기반 자연어 추천 이유 생성
- TOP3 식당별 이모지 + 한 줄 추천 이유 실시간 표시
- 병렬 요청 + 순서 보장 표시 (TOP1→2→3 stagger fade-in)
- Vercel Serverless Function으로 API 키 서버 측 보호

### 📍 위치 기반
- KT East/West 빌딩 기준 도보 시간 계산
- 700m 반경 내 **133개** 검증된 맛집 정보
- 실제 경로 반영 (직선거리 × 1.3배)

### 🎨 직관적 UI
- 빠른 추천 프리셋 12종 (비 오는 날, 다이어트, 팀점심 등)
- 최근 본 식당 제외 기능
- 상세한 식당 정보 및 예약 링크 제공
- shimmer 로딩 애니메이션

## 🚀 빠른 시작

### 설치

```bash
# 저장소 클론
git clone https://github.com/junkim1018/kt_lunch.git
cd kt-lunch

# 의존성 설치
pnpm install
```

### 환경 설정 (Azure OpenAI AI 추천 이유 사용 시)

```bash
# .env 파일 생성 (.env.example 참고)
cp .env.example .env
```

필요한 환경변수:
```
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_ENDPOINT=your-endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment
AZURE_OPENAI_API_VERSION=2024-12-01-preview
```

> **참고**: Azure OpenAI 설정이 없어도 기본 알고리즘 추천으로 정상 작동합니다. AI 추천 이유만 표시되지 않습니다.

### 실행

```bash
# 개발 서버 실행
pnpm start

# 브라우저가 자동으로 http://localhost:3000 열림
```

### 빌드

```bash
# 프로덕션 빌드
pnpm build

# build/ 폴더에 최적화된 파일 생성
```

## 📊 데이터 현황

- **총 식당 수**: 133개
- **카테고리**: 한식, 중식, 일식, 양식, 아시안, 샐러드, 멕시칸, 인도
- **가격대**: 8,000원 ~ 100,000원
- **평균 평점**: 4.3★ 이상
- **특별 맛집**: 미쉐린 빕구르망, 블루리본 선정 다수

## 🏗️ 프로젝트 구조

```
kt-lunch/
├── api/
│   └── llm.js              # Vercel Serverless — Azure OpenAI 프록시
├── public/                  # 정적 파일
├── src/
│   ├── App.js               # 메인 애플리케이션 (~1,600줄)
│   ├── App.css              # 스타일시트
│   ├── components/          # Presentation Layer
│   │   ├── common/
│   │   ├── filters/
│   │   ├── layout/
│   │   └── results/
│   ├── constants/           # 상수 정의
│   │   ├── options.js       # 필터 옵션
│   │   ├── presets.js       # 빠른 추천 프리셋
│   │   ├── config.js        # 앱 설정
│   │   └── scoring.js       # 점수 가중치
│   ├── data/                # Data Layer
│   │   ├── restaurantData.js  # 133개 식당 DB
│   │   ├── constants.js
│   │   ├── repositories/
│   │   │   └── RestaurantRepository.js
│   │   └── index.js
│   ├── hooks/               # Custom Hooks
│   │   ├── useRecommendation.js
│   │   ├── useRecentRestaurants.js
│   │   ├── useTime.js
│   │   └── index.js
│   ├── services/            # Business Logic Layer
│   │   ├── RecommendationService.js
│   │   ├── ScoringService.js
│   │   ├── FilterService.js
│   │   ├── LLMService.js
│   │   ├── FeedbackService.js
│   │   ├── PersonalizationService.js
│   │   └── index.js
│   ├── types/               # 타입 정의 (JSDoc)
│   │   ├── Restaurant.js
│   │   ├── Selection.js
│   │   ├── RecommendationResult.js
│   │   └── index.js
│   └── utils/               # 유틸리티 함수
│       ├── array.js
│       ├── budget.js
│       ├── distance.js
│       ├── string.js
│       └── index.js
├── .env.example             # 환경변수 템플릿
├── AGENTS.md                # 커스텀 AI 에이전트 정의
├── REFACTORING.md           # 리팩토링 가이드
└── README.md
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

### AI 추천 이유 (LLM)

TOP3 추천 결과에 대해 Azure OpenAI gpt-5-nano가 자연어 추천 이유를 생성합니다:
- Vercel Serverless Function (`api/llm.js`)이 Azure OpenAI API를 프록시
- 3개 식당에 대해 병렬 요청 후 순서대로 표시
- 각 추천 이유: 이모지 1개 + 한 문장 (30자 이내)
- LLM 미응답 시 기본 알고리즘 추천 이유로 폴백

## 🆕 새 식당 추가하기

`src/data/restaurantData.js`의 `restaurantDB` 배열에 다음 형식으로 추가:

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
  mood: ["safe", "hearty"], // 'safe'|'hearty'|'executive'|'hangover'|'team'|'exciting'|'sad'
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

추가 후 검증:
```bash
node validate-db.js
```

## 🤖 커스텀 AI 에이전트

프로젝트에는 세 가지 전문 AI 에이전트가 정의되어 있습니다:

### Planner Agent (계획 에이전트)
- 요구사항 분석 및 구체화
- 작업 분해 및 우선순위 설정
- 리스크 관리 및 대응 방안

### Developer Agent (개발자 에이전트)
- 클린 아키텍처 기반 코드 구현
- SOLID 원칙 준수
- 성능 최적화 및 리팩토링

### Designer Agent (디자이너 에이전트)
- UI/UX 디자인 분석 및 개선
- 반응형 레이아웃, 접근성
- 인터랙션 및 애니메이션 설계

자세한 내용은 [AGENTS.md](AGENTS.md) 참조

## 🧪 테스트

```bash
# 통합 시뮬레이션 테스트 (66개 시나리오)
node .github/skills/integration-test-debug/scripts/simulate-recommendations.js

# React 단위 테스트
pnpm test
```

## 🚀 배포

Vercel에 자동 배포됩니다:
- `main` 브랜치에 push → 자동 빌드 및 배포
- 환경변수는 Vercel 대시보드에서 설정 (Production 전용)

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
- 기술 스택: React, Azure OpenAI, Vercel
- 디자인 영감: 현대적이고 직관적인 UX

---

**Made with ❤️ for KT 광화문 직원들**

*마지막 업데이트: 2026-03-17*
