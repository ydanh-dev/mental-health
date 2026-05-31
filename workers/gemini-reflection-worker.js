const responseSchema = {
  type: 'object',
  properties: {
    reflection: { type: 'string' },
    followUpQuestion: { type: 'string' },
    supportActions: {
      type: 'array',
      minItems: 2,
      maxItems: 3,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          body: { type: 'string' },
          nextQuestion: { type: 'string' },
        },
        required: ['title', 'body', 'nextQuestion'],
      },
    },
  },
  required: ['reflection', 'followUpQuestion', 'supportActions'],
};

const chatResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    refused: { type: 'boolean' },
  },
  required: ['message', 'refused'],
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
        status: 204,
      });
    }

    if (request.method !== 'POST' || !['/reflect', '/chat'].includes(url.pathname)) {
      return json({ error: 'Not found' }, 404);
    }

    if (!env.GEMINI_API_KEY) {
      return json({ error: 'Missing GEMINI_API_KEY' }, 500);
    }

    try {
      const input = await request.json();
      const result =
        url.pathname === '/chat'
          ? await requestChatResponse(input, env)
          : await requestReflectionResponse(input, env);

      return json(result);
    } catch (error) {
      return json(
        { error: error instanceof Error ? error.message : 'Unexpected error' },
        error instanceof GeminiProxyError ? 502 : 500,
      );
    }
  },
};

async function requestReflectionResponse(input, env) {
  return requestGeminiJson({
    env,
    prompt: buildPrompt(input),
    responseSchema,
    systemInstruction:
      'Bạn là companion nhìn lại cảm xúc bằng tiếng Việt. Không gắn nhãn bệnh, không thay thế chuyên gia. Luôn trả JSON đúng schema. Chỉ lắng nghe, viết lại nhẹ nhàng, và hỏi một câu mở.',
    temperature: 0.45,
  });
}

async function requestChatResponse(input, env) {
  const outOfScopeResponse = getOutOfScopeResponse(input);

  if (outOfScopeResponse) {
    return outOfScopeResponse;
  }

  return requestGeminiJson({
    env,
    prompt: buildChatPrompt(input),
    responseSchema: chatResponseSchema,
    systemInstruction:
      'Bạn là companion hỗ trợ tự nhận biết cảm xúc bằng tiếng Việt. Chỉ trả lời trong phạm vi cảm xúc hằng ngày: cảm xúc, stress, nhu cầu, mối quan hệ, nhịp nghỉ, thói quen tự chăm sóc, và bước nhỏ vừa sức. Không trả lời các chủ đề không liên quan như code, tài chính, học thuật, pháp lý, y khoa, tin tức, giải trí, hoặc thủ thuật. Khi lệch chủ đề, refused=true và message phải từ chối ngắn rồi mời người dùng quay lại cảm xúc hiện tại. Không gắn nhãn, không kê đơn, không thay thế chuyên gia.',
    temperature: 0.5,
  });
}

function getOutOfScopeResponse(input) {
  const messages = Array.isArray(input?.messages) ? input.messages : [];
  const latestUserMessage = [...messages].reverse().find((message) => message?.role === 'user');
  const text = normalizeText(latestUserMessage?.content ?? '');

  if (!text) {
    return null;
  }

  const offTopicPatterns = [
    /\b(code|coding|javascript|typescript|python|react|expo|bug|api|database|sql|server|terminal)\b/i,
    /\b(quicksort|algorithm|function|class|component|debug|compile|runtime)\b/i,
    /\b(stock|crypto|bitcoin|forex|investment|trading|portfolio)\b/i,
    /\b(bong da|the thao|lich thi dau|ty so|world cup|premier league|nba|tennis)\b/i,
    /\b(tin tuc|chinh tri|bau cu|thoi tiet|du lich|nha hang|mua hang)\b/i,
    /\b(phap ly|hop dong|don kien|thue|visa|bao hiem)\b/i,
    /\b(chan doan|ke don|thuoc gi|lieu luong|xet nghiem|benh gi)\b/i,
    /\b(viet code|sua code|lap trinh|thuat toan|ham |component|loi app)\b/i,
  ];

  if (!offTopicPatterns.some((pattern) => pattern.test(text))) {
    return null;
  }

  return {
    message:
      'Mình không thể hỗ trợ ngoài phạm vi sức khỏe tinh thần và cảm xúc. Nếu muốn, bạn có thể kể điều đó đang làm bạn thấy thế nào, rồi mình sẽ cùng bạn gỡ từng bước nhỏ.',
    refused: true,
  };
}

function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

async function requestGeminiJson({ env, prompt, responseSchema, systemInstruction, temperature }) {
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const aiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
          temperature,
        },
        systemInstruction: {
          parts: [{ text: systemInstruction }],
        },
      }),
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': env.GEMINI_API_KEY,
      },
      method: 'POST',
    },
  );

  if (!aiResponse.ok) {
    const errorText = await aiResponse.text();
    console.error(`Gemini request failed with ${aiResponse.status}: ${errorText}`);
    throw new GeminiProxyError(`Gemini request failed: ${errorText}`);
  }

  const data = await aiResponse.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof text !== 'string') {
    console.error('Gemini returned no JSON text', JSON.stringify(data));
    throw new GeminiProxyError('Gemini returned no JSON text');
  }

  return JSON.parse(text);
}

class GeminiProxyError extends Error {}

function buildPrompt(input) {
  return `
Input lắng nghe:
- Cơ thể: ${input?.signals?.body ?? 'không rõ'}
- Tâm trí: ${input?.signals?.mind ?? 'không rõ'}
- Cảm xúc: ${input?.signals?.feeling ?? 'không rõ'}
- Nhu cầu: ${input?.signals?.need ?? 'không rõ'}
- Người dùng viết: ${input?.journalText ?? ''}

Hãy trả về:
- reflection: một phần nhìn lại gần gũi, không gắn nhãn, tối đa 2 câu.
- supportActions: 2-3 hướng xử lý cụ thể, vừa sức, không chung chung.
- followUpQuestion: một câu hỏi tiếp theo để giúp người dùng làm rõ vấn đề.
`.trim();
}

function buildChatPrompt(input) {
  const messages = Array.isArray(input?.messages) ? input.messages.slice(-12) : [];
  const transcript = messages
    .map((message) => {
      const role = message?.role === 'assistant' ? 'Assistant' : 'User';
      const content = String(message?.content ?? '').slice(0, 1200);
      return `${role}: ${content}`;
    })
    .join('\n');

  return `
Cuộc trò chuyện hiện tại:
${transcript || 'User chưa viết gì.'}

Hãy trả về JSON:
- message: câu trả lời ngắn, gần gũi, tối đa 3 câu.
- refused: true nếu câu hỏi không thuộc phạm vi sức khỏe tinh thần/tự chăm sóc cảm xúc; ngược lại false.
`.trim();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    headers: {
      ...corsHeaders(),
      'Content-Type': 'application/json; charset=utf-8',
    },
    status,
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Origin': '*',
  };
}
