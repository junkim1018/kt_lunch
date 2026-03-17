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

    const restaurantCount = top3.length;
    const restaurantDescriptions = top3.map((r, i) => {
      return `${i + 1}. ${r.name}(${r.category}) ${(r.menus || []).slice(0, 2).join('·')} ${r.priceNote || ''}`;
    }).join(' / ');

    const prompt = `광화문 점심추천. 조건: ${weatherText},${moodText},${peopleText},${dietText}. 식당: ${restaurantDescriptions}. 각 식당별 추천이유를 이모지1개+한문장(30자이내)으로 JSON응답: {"reasons":["이유1","이유2","이유3"]}`;

    const url = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
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
    });

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

    // JSON 파싱 (```json ... ``` 래핑 제거)
    const jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('LLM JSON parse error:', jsonStr.substring(0, 200));
      return res.status(502).json({ error: 'LLM 응답 형식 오류' });
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
