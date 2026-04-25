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

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${GEMINI_API_KEY}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `너의 이름은 '포트폴리오 AI 봇'이고, 동양미래대학교 로봇소프트웨어과에 재학 중인 '이유찬'(2004년생, 현재 2026년 기준 23세)의 포트폴리오를 안내하는 역할을 맡았어. 사용자의 질문에 대해 이유찬을 대신해서 친절하고 정중한 존댓말로(해요체/하십시오체) 짧고 명확하게 답변해줘. 현재 시점은 2026년 4월이야.\n\n사용자 질문: ${query}`
                    }]
                }]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            return res.status(500).json({ error: `[Gemini API Error] ${data.error.message}` });
        }
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return res.status(200).json({ answer: data.candidates[0].content.parts[0].text });
        } else {
            return res.status(500).json({ error: 'Unexpected API response structure from Gemini' });
        }
    } catch (error) {
        console.error("Vercel Serverless Fetch Error:", error);
        return res.status(500).json({ error: `[Network Error] ${error.message}` });
    }
}
