# 🤖 LLM 기반 추천 설정 가이드

## Azure OpenAI API 설정하기

### 1. Azure OpenAI 리소스 확인
1. [Azure Portal](https://portal.azure.com)에 접속
2. Azure OpenAI 리소스로 이동
3. **키 및 엔드포인트** 메뉴에서 API 키와 엔드포인트 복사
4. **모델 배포** 메뉴에서 배포(deployment) 이름 확인

### 2. .env 파일에 설정 추가
```bash
# .env 파일 열기 (프로젝트 루트)
SKIP_PREFLIGHT_CHECK=true
REACT_APP_AZURE_OPENAI_API_KEY=your-azure-api-key-here
REACT_APP_AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
REACT_APP_AZURE_OPENAI_API_VERSION=2025-04-01-preview
REACT_APP_AZURE_OPENAI_DEPLOYMENT=your-deployment-name
```

### 3. 서버 재시작
```bash
# 터미널에서 서버 중지 (Ctrl+C)
# 다시 시작
npm start
```

### 4. 확인
- 브라우저 콘솔(F12)에 `✅ Azure OpenAI LLM 추천 활성화` 메시지가 보이면 성공!
- 추천 실행 시 콘솔에 `🤖 [LLM] Azure OpenAI로 추천 이유 생성 중...` 로그 확인

## 📊 LLM vs 알고리즘 비교

### 🤖 LLM 추천 (Azure OpenAI 활성화 시)
- **장점**: 
  - 자연어로 친근한 추천 이유 제공 ("오늘같이 더운 날엔 시원한 냉면이 최고죠!")
  - 날씨/기분/상황을 연결한 설득력 있는 추천
  - 다양성을 고려한 재정렬

- **단점**:
  - API 비용 발생
  - 응답 시간 1-3초 (네트워크 필요)

### ⚙️ 기본 알고리즘 (API 키 없을 때)
- **장점**:
  - 무료, 즉시 응답 (0.1초)
  - 오프라인 가능

- **단점**:
  - 추천 이유가 규칙 기반 ("날씨 딱 · 기분 맞춤" 등)

## 🔄 동작 방식
1. 기본 알고리즘이 9개 요소로 점수를 계산하여 상위 10개 식당 선정
2. API 키가 설정되어 있으면 LLM에 상위 10개 후보를 전달
3. LLM이 상황에 맞는 자연스러운 추천 이유를 생성
4. LLM 호출 실패 시 자동으로 기본 알고리즘 결과 사용 (fallback)

## 🔒 보안 주의사항
- ⚠️ `.env` 파일은 절대 GitHub에 올리지 마세요!
- `.gitignore`에 `.env`가 포함되어 있는지 확인하세요
- API 키가 노출되면 Azure Portal에서 즉시 재발급받으세요

## ❓ 문제 해결

### LLM이 작동하지 않아요
- `.env` 파일 위치 확인: 프로젝트 루트 (`package.json`과 같은 위치)
- 환경 변수명 확인: `REACT_APP_AZURE_OPENAI_*` (접두사 필수)
- 서버 재시작: 환경 변수 변경 시 반드시 `npm start` 재시작
- 브라우저 콘솔에서 `ℹ️ Azure OpenAI 설정 없음` 메시지 확인

### 콘솔에 LLM 에러가 나와요
- Azure 리소스의 배포(deployment) 이름이 `.env`의 `REACT_APP_AZURE_OPENAI_DEPLOYMENT`와 일치하는지 확인
- API 키가 유효한지 Azure Portal에서 확인
- 엔드포인트 URL에 `/openai` 경로가 붙지 않은 기본 URL인지 확인

### 추천이 느려요
- LLM 응답 시간: 1-3초 정도 소요
- 인터넷 연결 상태 확인
- 속도가 중요하면 "기본 추천" 모드 사용

## 📞 지원
문제가 계속되면 터미널에서 에러 메시지를 확인하세요:
```bash
npm start
```
