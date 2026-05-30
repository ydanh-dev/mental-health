import http from 'node:http';

const port = Number(process.env.PORT ?? 8787);
const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';

const responseSchema = {
  type: 'object',
  properties: {
    reflection: { type: 'string' },
    followUpQuestion: { type: 'string' },
    riskLevel: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'crisis'],
    },
    safetyMessage: { type: 'string' },
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
  required: ['reflection', 'followUpQuestion', 'riskLevel', 'supportActions'],
};

const chatResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string' },
    refused: { type: 'boolean' },
    riskLevel: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'crisis'],
    },
    safetyMessage: { type: 'string' },
  },
  required: ['message', 'refused', 'riskLevel'],
};

const server = http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method !== 'POST' || !['/reflect', '/chat'].includes(request.url ?? '')) {
    sendJson(response, 404, { error: 'Not found' });
    return;
  }

  if (!apiKey) {
    sendJson(response, 500, { error: 'Missing GEMINI_API_KEY' });
    return;
  }

  try {
    const input = JSON.parse(await readBody(request));
    const result =
      request.url === '/chat'
        ? await requestChatResponse(input)
        : await requestReflectionResponse(input);

    sendJson(response, 200, result);
  } catch (error) {
    sendJson(response, error instanceof GeminiProxyError ? 502 : 500, {
      error: error instanceof Error ? error.message : 'Unexpected error',
    });
  }
});

server.listen(port, () => {
  console.log(`Gemini reflection proxy listening on http://localhost:${port}/reflect`);
  console.log(`Gemini chat proxy listening on http://localhost:${port}/chat`);
});

async function requestReflectionResponse(input) {
  return requestGeminiJson({
    prompt: buildPrompt(input),
    responseSchema,
    systemInstruction:
      'Bạn là companion phản chiếu cảm xúc bằng tiếng Việt. Không chẩn đoán, không dùng nhãn bệnh, không thay thế chuyên gia. Luôn trả JSON đúng schema. Nếu có dấu hiệu tự hại, nguy hiểm tức thì, hoặc mất an toàn, riskLevel phải là crisis và safetyMessage phải khuyên liên hệ người tin cậy/dịch vụ khẩn cấp địa phương ngay.',
    temperature: 0.45,
  });
}

async function requestChatResponse(input) {
  const outOfScopeResponse = getOutOfScopeResponse(input);

  if (outOfScopeResponse) {
    return outOfScopeResponse;
  }

  return requestGeminiJson({
    prompt: buildChatPrompt(input),
    responseSchema: chatResponseSchema,
    systemInstruction:
      'Bạn là companion hỗ trợ tự nhận biết cảm xúc bằng tiếng Việt. Chỉ trả lời trong phạm vi sức khỏe tinh thần hằng ngày: cảm xúc, stress, nhu cầu, mối quan hệ, nghỉ ngơi, thói quen tự chăm sóc, và bước nhỏ an toàn. Không trả lời các chủ đề không liên quan như code, tài chính, học thuật, pháp lý, y khoa chẩn đoán, tin tức, giải trí, hoặc thủ thuật. Khi lệch chủ đề, refused=true và message phải từ chối ngắn rồi mời người dùng quay lại cảm xúc hiện tại. Không chẩn đoán, không kê đơn, không thay thế chuyên gia. Nếu có dấu hiệu tự hại, nguy hiểm tức thì, hoặc mất an toàn, riskLevel=crisis và safetyMessage khuyên liên hệ người tin cậy/dịch vụ khẩn cấp địa phương ngay.',
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
    riskLevel: 'low',
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

async function requestGeminiJson({ prompt, responseSchema, systemInstruction, temperature }) {
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
        'x-goog-api-key': apiKey,
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
Input check-in:
- Cơ thể: ${input?.signals?.body ?? 'không rõ'}
- Tâm trí: ${input?.signals?.mind ?? 'không rõ'}
- Cảm xúc: ${input?.signals?.feeling ?? 'không rõ'}
- Nhu cầu: ${input?.signals?.need ?? 'không rõ'}
- Người dùng viết: ${input?.journalText ?? ''}

Hãy trả về:
- reflection: một phản chiếu gần gũi, không chẩn đoán, tối đa 2 câu.
- supportActions: 2-3 hướng xử lý cụ thể, vừa sức, không chung chung kiểu chỉ "hít thở".
- followUpQuestion: một câu hỏi tiếp theo để giúp người dùng làm rõ vấn đề.
- riskLevel: low, medium, high, hoặc crisis.
- safetyMessage: chỉ thêm khi cần an toàn.
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
- riskLevel: low, medium, high, hoặc crisis.
- safetyMessage: chỉ thêm khi cần an toàn.
`.trim();
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}
