// Vercel Serverless Function — Azure OpenAI 프록시
// API 키는 서버 측 환경변수에서만 접근 (클라이언트 노출 방지)

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
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

    const weatherLabels = { hot: '더운 날', mild: '선선한 날', cold: '추운 날', rainy: '비 오는 날' };
    const moodLabels = { safe: '무난하게', hearty: '든든하게', exciting: '새로운 맛', team: '같이 먹기 좋은', hangover: '해장', sad: '기분전환', executive: '격식 있게' };
    const dietLabels = { nodiet: '상관없음', light: '가볍게', diet: '다이어트', vegetarian: '채식' };

    const weatherText = weatherLabels[selections.weather] || selections.weather;
    const moodText = moodLabels[selections.mood] || selections.mood;
    const dietText = dietLabels[selections.diet] || selections.diet;
    const peopleText = selections.people >= 8 ? '8명 이상' : `${selections.people}명`;

    const restaurantDescriptions = top3.map((r, i) => {
      return `${i + 1}위: ${r.name} (${r.category}) - 메뉴: ${(r.menus || []).slice(0, 3).join(', ')} / ${r.priceNote || r.price || ''} / ${r.walk || ''} / 매칭점수: ${r.score100}점`;
    }).join('\n');

    const prompt = `당신은 광화문 직장인 점심 추천 전문가입니다.
오늘 사용자의 조건: 날씨=${weatherText}, 기분=${moodText}, 인원=${peopleText}, 식단=${dietText}

아래 TOP 3 식당 각각에 대해 오늘 조건에 맞는 추천 이유를 자연스럽고 친근한 한국어로 1~2문장(50자 이내)으로 작성해주세요.
- 이모지 1개로 시작
- 오늘 날씨/기분/인원에 맞춰 왜 이 식당이 좋은지 구체적으로
- 메뉴나 특징을 언급하면 더 좋음
- 각 식당마다 다른 관점으로

${restaurantDescriptions}

반드시 아래 JSON 형식으로만 응답하세요:
{"reasons":["1위 추천이유","2위 추천이유","3위 추천이유"]}`;

    const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: '당신은 점심 메뉴 추천 도우미입니다. 항상 JSON 형식으로만 응답합니다.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Azure OpenAI error:', response.status, errText);
      return res.status(502).json({ error: 'LLM API 호출 실패' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    if (!content) {
      return res.status(502).json({ error: 'LLM 응답이 비어있습니다.' });
    }

    // JSON 파싱 (```json ... ``` 래핑 제거)
    const jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('LLM handler error:', error);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
}
