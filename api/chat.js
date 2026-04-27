export default async function handler(req, res) {
    // CORS headers for local testing (Vercel automatically handles this in production usually, but good to have)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { query } = req.body;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server (Vercel Environment Variables).' });
    }

    // 모델 우선순위: gemini-1.5-flash-latest -> gemini-1.5-pro-latest -> gemini-pro (과부하/미지원 시 fallback)
    const models = ['gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-pro'];

    const promptText = `너의 이름은 '포트폴리오 AI 봇'이고, 동양미래대학교 로봇소프트웨어과에 재학 중인 '이유찬'(2004년생, 현재 2026년 기준 23세)의 포트폴리오를 안내하는 역할을 맡았어. 사용자의 질문에 대해 이유찬을 대신해서 친절하고 정중한 존댓말로(해요체/하십시오체) 짧고 명확하게 답변해줘. 현재 시점은 2026년 4월이야.\n\n사용자 질문: ${query}`;

    let lastError = null;
    for (const model of models) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: promptText }] }]
                })
            });

            const data = await response.json();

            if (data.error) {
                const code = data.error.code || data.error.status;
                // 과부하(503, 429, RESOURCE_EXHAUSTED) 시 다음 모델로 시도
                if (code === 503 || code === 529 || code === 429 || data.error.status === 'RESOURCE_EXHAUSTED' || data.error.status === 'UNAVAILABLE') {
                    lastError = data.error.message;
                    console.warn(`Model ${model} overloaded, trying next...`);
                    continue;
                }
                return res.status(500).json({ error: `[Gemini API Error] ${data.error.message}` });
            }

            if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
                return res.status(200).json({ answer: data.candidates[0].content.parts[0].text });
            } else {
                return res.status(500).json({ error: 'Unexpected API response structure from Gemini' });
            }
        } catch (error) {
            console.error(`Fetch error with model ${model}:`, error);
            lastError = error.message;
        }
    }

    // 모든 모델 실패 시
    return res.status(503).json({ error: `[Gemini API Error] 현재 모든 모델이 과부하 상태입니다. 잠시 후 다시 시도해주세요. (${lastError})` });
}
