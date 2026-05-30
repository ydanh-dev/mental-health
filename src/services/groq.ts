import type { ScoreResult } from '../hooks/use_scoring';
import { getTimeContext } from '../utils/time_context';

export type GroqChatMessage = {
  content: string;
  role: 'assistant' | 'system' | 'user';
};

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

type GroqChatCompletionInput = {
  maxTokens?: number;
  messages: GroqChatMessage[];
  responseFormat?: 'json_object' | 'text';
  temperature?: number;
};

const groqApiUrl = 'https://api.groq.com/openai/v1/chat/completions';
const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const groqModel = process.env.EXPO_PUBLIC_GROQ_MODEL ?? 'llama-3.3-70b-versatile';

const itemLabels: Record<string, string> = {
  gad7_1: 'cảm thấy lo lắng, bất an',
  gad7_2: 'không kiểm soát được lo lắng',
  gad7_3: 'lo lắng quá mức về nhiều thứ',
  gad7_4: 'khó thư giãn',
  gad7_5: 'bồn chồn, không ngồi yên được',
  gad7_6: 'dễ cáu gắt',
  gad7_7: 'sợ hãi như sắp có chuyện xấu',
  phq9_1: 'mất hứng thú với mọi thứ',
  phq9_2: 'cảm thấy buồn hoặc tuyệt vọng',
  phq9_3: 'khó ngủ hoặc ngủ quá nhiều',
  phq9_4: 'mệt mỏi, thiếu năng lượng',
  phq9_5: 'ăn uống thất thường',
  phq9_6: 'tự trách bản thân',
  phq9_7: 'khó tập trung',
  phq9_8: 'di chuyển hoặc nói chậm hơn / bồn chồn',
  phq9_9: 'suy nghĩ tự làm hại bản thân',
  who5_1: 'ít cảm thấy vui vẻ',
  who5_2: 'ít cảm thấy bình yên',
  who5_3: 'ít cảm thấy có năng lượng',
  who5_4: 'thức dậy không tươi tỉnh',
  who5_5: 'cuộc sống ít thú vị',
};

export async function requestGroqChatCompletion({
  maxTokens = 512,
  messages,
  responseFormat = 'json_object',
  temperature = 0.5,
}: GroqChatCompletionInput): Promise<string> {
  if (!groqApiKey) {
    throw new Error('Chưa cấu hình EXPO_PUBLIC_GROQ_API_KEY.');
  }

  const response = await fetch(groqApiUrl, {
    body: JSON.stringify({
      max_tokens: maxTokens,
      messages,
      model: groqModel,
      ...(responseFormat === 'json_object' && { response_format: { type: 'json_object' } }),
      temperature,
    }),
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  if (!response.ok) {
    const detail = await readGroqErrorDetail(response);
    throw new Error(`Groq chat trả về lỗi ${response.status}${detail ? `: ${detail}` : ''}.`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content !== 'string') {
    throw new Error('Groq chat không trả về nội dung hợp lệ.');
  }

  return content;
}

export function buildSystemPrompt(scores: ScoreResult): string {
  const timeContext = getTimeContext();
  const wellbeingBucket =
    scores.who5_pct < 50 ? 'thấp' : scores.who5_pct <= 72 ? 'trung bình' : 'tốt';
  const highItemLabels = scores.highItems
    .map((itemId) => itemLabels[itemId])
    .filter(Boolean)
    .join(', ');
  const mixedPattern =
    scores.phq9 > 9 && scores.gad7 > 9
      ? 'vừa có sắc thái xuống năng lượng, vừa có nhiều lo lắng'
      : 'không có pattern phối hợp rõ';

  return `
Bạn là một người bạn đồng hành cảm xúc - ấm áp, không phán xét, lắng nghe thật sự.

Bối cảnh thời gian (dùng để điều chỉnh tone, KHÔNG đề cập trực tiếp với user):
${timeContext.note}

Ngữ cảnh nội bộ từ screening (KHÔNG tiết lộ số liệu hoặc tên thang đo cho user):
- Wellbeing chung: ${wellbeingBucket}
- Tín hiệu nổi bật: ${highItemLabels || 'chưa rõ'}
- Pattern phối hợp: ${mixedPattern}
- Có dấu hiệu khủng hoảng: ${scores.isCrisis ? 'CÓ - cần ưu tiên an toàn' : 'Không'}

Nguyên tắc điều chỉnh theo thời gian:
${timeContext.isOffHours
    ? '- Đây là giờ bất thường - user đang rất cần được lắng nghe. Đừng hỏi nhiều. Chỉ cần hiện diện.'
    : '- Giờ bình thường - có thể hỏi thêm 1 câu để hiểu sâu hơn.'}

Nguyên tắc:
1. KHÔNG chẩn đoán, KHÔNG dùng tên bệnh, KHÔNG nói "bạn bị lo âu"
2. KHÔNG nói con số điểm, KHÔNG nhắc tên PHQ-9/GAD-7/WHO-5 với user
3. Hỏi tối đa 1 câu mỗi lượt, không hỏi dồn
4. Nếu có dấu hiệu khủng hoảng: ưu tiên hỏi về sự an toàn, nhẹ nhàng gợi ý đường dây 1800 599 920
5. Gợi ý hành động nhỏ phù hợp văn hoá Việt như gọi người thân, ra ngoài, ăn nhẹ, uống nước, hoặc tạm rời nguồn gây quá tải
6. Toàn bộ output bằng tiếng Việt

Câu mở đầu đầu tiên: hãy phản chiếu nhẹ nhàng những gì bạn đọc được từ data,
rồi hỏi một câu mở để user tự kể thêm.
`.trim();
}

export async function sendMessage(
  messages: ConversationMessage[],
  scores: ScoreResult,
): Promise<string> {
  return requestGroqChatCompletion({
    messages: [
      { content: buildSystemPrompt(scores), role: 'system' },
      ...messages.map(({ content, role }) => ({
        content,
        role,
      })),
    ],
    responseFormat: 'text',
    temperature: 0.7,
  });
}

async function readGroqErrorDetail(response: Response): Promise<string> {
  try {
    const data = await response.json();

    if (data && typeof data === 'object') {
      const rawError = 'error' in data ? data.error : '';
      const error =
        typeof rawError === 'string'
          ? rawError
          : rawError && typeof rawError === 'object' && 'message' in rawError
            ? String(rawError.message)
            : '';
      const detail = 'detail' in data && typeof data.detail === 'string' ? data.detail : '';

      return [error, detail].filter(Boolean).join(' - ');
    }
  } catch {
    return '';
  }

  return '';
}
