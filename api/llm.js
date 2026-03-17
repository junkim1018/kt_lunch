// Vercel Serverless Function — Azure OpenAI 프록시
// API 키는 서버 측 환경변수에서만 접근 (클라이언트 노출 방지)

export default async function handler(req, res) {
  // CORS — 프로덕션 도메인만 허용
  const allowedOrigin = 'https://kt-lunch.vercel.app';
  const origin = req.headers.origin;
  if (origin === allowedOrigin || origin?.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = (process.env.AZURE_OPENAI_API_KEY || '').trim();
  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').trim();
  const deploymentName = (process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '').trim();
  const apiVersion = (process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview').trim();

  if (!apiKey || !endpoint || !deploymentName) {
    return res.status(500).json({ error: 'LLM 환경변수가 설정되지 않았습니다.' });
  }

  try {
    const { restaurants, selections } = req.body;

    if (!restaurants || !Array.isArray(restaurants) || restaurants.length === 0) {
      return res.status(400).json({ error: '식당 데이터가 필요합니다.' });
    }

    // TOP3만 허용 (과도한 사용 방지)
    const top3 = restaurants.slice(0, 3);

    const weatherLabels = { hot: '더운 날씨', mild: '선선한 날씨', cold: '추운 날씨', rainy: '비 오는 날씨' };
    const moodLabels = { safe: '무난하게 먹고 싶은', hearty: '든든하게 배부르게 먹고 싶은', exciting: '새로운 맛을 경험하고 싶은', team: '팀/동료와 같이 먹기 좋은', hangover: '해장이 필요한', sad: '기분전환이 필요한', executive: '격식 있는 자리가 필요한', stressed: '스트레스 해소가 필요한' };
    const dietLabels = { nodiet: '', light: '가볍게 먹고 싶은', diet: '다이어트 중인', vegetarian: '채식 선호' };

    const weatherText = weatherLabels[selections.weather] || selections.weather;
    const moodText = moodLabels[selections.mood] || selections.mood;
    const dietText = dietLabels[selections.diet] || '';
    const peopleText = selections.people >= 8 ? '8명 이상 단체' : selections.people >= 5 ? `${selections.people}명 중규모 모임` : selections.people >= 2 ? `${selections.people}명` : '혼밥';

    const r = top3[0]; // 단일 식당 (개별 호출)
    const menuList = (r.menus || []).join(', ');
    const extras = [];
    if (r.ribbon) extras.push('블루리본 인증');
    if (r.calorie) extras.push(r.calorie.label);
    if (r.waiting) extras.push('웨이팅 있음');
    else extras.push('대기 없이 바로 입장');
    if (r.hot) extras.push('핫한 신상 맛집');
    const extrasText = extras.length > 0 ? extras.join(', ') : '';

    // 상황별 이모지 매핑
    const weatherEmoji = { hot: '☀️', mild: '🌤️', cold: '❄️', rainy: '☔' };
    const moodEmoji = { safe: '😊', hearty: '🍖', exciting: '✨', team: '👥', hangover: '💊', sad: '🎉', executive: '🤵', stressed: '🔥' };
    const suggestedEmoji = moodEmoji[selections.mood] || weatherEmoji[selections.weather] || '🍽️';

    const prompt = `광화문 직장인 점심 추천 한줄평.

상황: ${weatherText}, ${moodText}, ${peopleText}${dietText ? ', ' + dietText : ''}
식당: ${r.name} (${r.category})
메뉴: ${menuList}
가격: ${r.priceNote || r.price} | 거리: ${r.walk || ''} | 평점: ${r.rating || ''}★ | ${extrasText}

형식: ${suggestedEmoji} + 메뉴명 포함 + 상황과 연결 + 40자이내
출력: {"reasons":["한줄평"]}`;

    const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    const fetchController = new AbortController();
    const fetchTimeout = setTimeout(() => fetchController.abort(), 12000);

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: prompt }
          ],
          max_completion_tokens: 4000,
          reasoning_effort: 'low',
        }),
        signal: fetchController.signal,
      });
    } catch (fetchErr) {
      clearTimeout(fetchTimeout);
      if (fetchErr.name === 'AbortError') {
        return res.status(504).json({ error: 'LLM API 응답 시간 초과' });
      }
      throw fetchErr;
    }
    clearTimeout(fetchTimeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error('Azure OpenAI error:', response.status, errText);
      return res.status(502).json({ error: 'LLM API 호출 실패' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.error('Empty LLM content. finish_reason:', data.choices?.[0]?.finish_reason, 'reasoning_tokens:', data.usage?.completion_tokens_details?.reasoning_tokens);
      return res.status(502).json({ error: 'LLM 응답이 비어있습니다.' });
    }

    // JSON 파싱 (```json ... ``` 래핑 제거 + 텍스트 중간 JSON 추출)
    const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    let parsed;
    // 1순위: 응답 전체가 JSON인 경우
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // 2순위: 텍스트 안에 {"reasons":[...]} 가 포함된 경우 추출
      const jsonMatch = cleaned.match(/\{\s*"reasons"\s*:\s*\[.*?\]\s*\}/s);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          parsed = null;
        }
      }
      // 3순위: JSON 없이 텍스트만 반환된 경우 — 첫 줄을 추천 이유로 사용
      if (!parsed) {
        const firstLine = cleaned.split('\n')[0].replace(/^["']|["']$/g, '').trim();
        if (firstLine.length > 0 && firstLine.length <= 80) {
          parsed = { reasons: [firstLine] };
        } else {
          console.error('LLM JSON parse error:', cleaned.substring(0, 200));
          return res.status(502).json({ error: 'LLM 응답 형식 오류' });
        }
      }
    }

    if (!parsed.reasons || !Array.isArray(parsed.reasons) || parsed.reasons.length < 1) {
      return res.status(502).json({ error: 'LLM 응답에 reasons 배열이 없습니다.' });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('LLM handler error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
