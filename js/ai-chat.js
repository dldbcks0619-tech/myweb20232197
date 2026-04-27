// AI Chatbot Logic
// 이중 구조: 1. Supabase (ai_knowledge) 로컬 캐싱 검색 -> 2. 없으면 Vercel Serverless (/api/chat) 호출

// Supabase 클라이언트 초기화 (features.js와 동일한 공개 키 사용)
const SUPABASE_URL = 'https://cvpujqfudfkcdqbbfvwu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_OPaTzO9-C1NcTtZ7bAN-Gw_sJHJNv2B';
const aiSupabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let cachedKnowledge = [];

// 챗봇 스크립트가 로드되면 즉시 Supabase에서 지식 베이스를 가져와 캐싱
async function prefetchKnowledgeBase() {
    try {
        const { data, error } = await aiSupabase
            .from('ai_knowledge')
            .select('content, keywords');
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            cachedKnowledge = data;
            console.log("Supabase ai_knowledge 로드 완료:", cachedKnowledge.length, "건");
        }
    } catch (e) {
        console.warn("Supabase ai_knowledge 테이블을 불러오는 중 오류 발생 (테이블이 없거나 권한 오류일 수 있습니다):", e);
    }
}

// 스크립트 로드 시 1회 실행
prefetchKnowledgeBase();

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    // 1. 사용자 메시지 UI에 추가
    appendMessage(message, 'user');
    input.value = '';

    // 2. 초기 로딩 상태 표시
    const loadingId = appendLoading('내 자료 검색 중...');

    try {
        // 3. 캐싱된 Supabase 자료 우선 검색
        const localAnswer = searchLocalKnowledge(message);

        if (localAnswer) {
            // 로컬에 답변이 있을 경우
            setTimeout(() => {
                removeLoading(loadingId);
                appendMessage(localAnswer, 'bot');
            }, 600); // 자연스러운 딜레이
        } else {
            // 4. 로컬에 없을 경우 외부 API(Gemini / Supabase Edge Function) 호출
            const externalAnswer = await fetchFromAIAPI(message);
            removeLoading(loadingId);
            appendMessage(externalAnswer, 'bot');
        }
    } catch (error) {
        console.error('Chat error:', error);
        removeLoading(loadingId);
        appendMessage('오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'bot');
    }
}

function appendMessage(text, sender) {
    const container = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    // DB에서 들어온 순수 문자열 '\n'을 실제 줄바꿈 문자로 변환
    contentDiv.textContent = text.replace(/\\n/g, '\n');
    contentDiv.style.whiteSpace = 'pre-wrap'; // 줄바꿈(엔터) 렌더링 지원
    
    msgDiv.appendChild(contentDiv);
    container.appendChild(msgDiv);
    
    // 자동 스크롤
    container.scrollTop = container.scrollHeight;
}

function appendLoading() {
    const container = document.getElementById('chat-messages');
    const msgDiv = document.createElement('div');
    const id = 'loading-' + Date.now();
    msgDiv.id = id;
    msgDiv.className = `message bot-message`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = '<span style="opacity:0.6;">답변을 탐색 중입니다...</span>';
    
    msgDiv.appendChild(contentDiv);
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
    
    return id;
}

function removeLoading(id) {
    const loadingEl = document.getElementById(id);
    if (loadingEl) loadingEl.remove();
}

function searchLocalKnowledge(query) {
    // 띄어쓰기 무시하고 형태소 단순화
    const normalizedQuery = query.toLowerCase().replace(/\s+/g, '');
    
    let bestMatch = null;
    let maxScore = 0;

    for (const item of cachedKnowledge) {
        let score = 0;
        
        // Ensure keywords is an array (Supabase text[] returns an array)
        let keywordsArray = Array.isArray(item.keywords) ? item.keywords : [];
        if (typeof item.keywords === 'string') {
            try {
                keywordsArray = JSON.parse(item.keywords);
            } catch (e) {
                // If it's a comma-separated string
                keywordsArray = item.keywords.split(',').map(k => k.trim());
            }
        }
        
        for (const kw of keywordsArray) {
            const normalizedKw = kw.toLowerCase().replace(/\s+/g, '');
            // 입력 문장에 키워드가 포함되어 있으면 가중치 부여
            if (normalizedQuery.includes(normalizedKw)) {
                score += normalizedKw.length; 
            }
        }
        
        if (score > maxScore) {
            maxScore = score;
            bestMatch = item.content; // Use item.content instead of item.answer
        }
    }
    
    // 점수가 2 이상이면 유의미한 매칭으로 간주하고 답변 반환
    if (maxScore >= 2) {
        return bestMatch;
    }
    
    return null; // 로컬에 매칭 내용이 충분하지 않으면 null 반환 (외부 API 연동으로 위임)
}

// ⚠️ 로컬 테스트용: 아래 API 키를 입력하면 로컬(파일 더블클릭)에서도 동작합니다.
// 배포(Vercel)에서는 환경변수를 통해 서버에서 호출하므로 여기서 키를 설정하지 않아도 됩니다.
// 로컬 테스트가 끝나면 키를 다시 비워두는 것을 권장합니다.
const LOCAL_GEMINI_KEY = ''; // 여기에 API 키를 입력하세요 (로컬 테스트 전용)
const GEMINI_MODEL = 'gemini-1.5-flash';

async function fetchFromAIAPI(query) {
    // 로컬 파일 환경이고 LOCAL_GEMINI_KEY가 설정된 경우 직접 API 호출
    if (window.location.protocol === 'file:' && LOCAL_GEMINI_KEY) {
        return await fetchDirectGeminiAPI(query, LOCAL_GEMINI_KEY);
    }

    // Vercel 배포 환경: 서버리스 함수(/api/chat) 호출
    const url = '/api/chat';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: query })
        });

        const data = await response.json();
        
        if (!response.ok) {
            return `[서버 통신 오류] ${data.error || response.statusText}`;
        }
        
        if (data.answer) {
            return data.answer;
        } else {
            return `[응답 오류] 알 수 없는 데이터 구조입니다.`;
        }
    } catch (error) {
        if (window.location.protocol === 'file:') {
            return `[테스트 환경 안내] 로컬 파일로 실행 중입니다.\nVercel에 배포된 주소에서 테스트하거나,\nai-chat.js 파일의 LOCAL_GEMINI_KEY에 API 키를 입력하면 로컬에서도 테스트할 수 있습니다.`;
        }
        return `[네트워크 오류] 서버와 연결할 수 없습니다. (${error.message})`;
    }
}

async function fetchDirectGeminiAPI(query, apiKey) {
    // 로컬 테스트 전용: 브라우저에서 Gemini API 직접 호출
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            return `[Gemini API 오류] ${data.error.message}`;
        }
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        }
        return `[응답 오류] 예상치 못한 API 응답 구조: ${JSON.stringify(data).slice(0, 200)}`;
    } catch (error) {
        return `[직접 API 호출 오류] ${error.message}`;
    }
}
