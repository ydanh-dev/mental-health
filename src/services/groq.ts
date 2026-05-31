import type { ScoreResult } from '../hooks/use_scoring';
import { describeOnboardingProfile } from '../data/onboarding_content';
import type { OnboardingProfile } from '../types/onboarding';
import { getTimeContext, type TimeContext } from '../utils/time_context';

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

const ITEM_LABELS: Record<string, string> = {
  gad7_1: 'cảm thấy bất an, căng thẳng',
  gad7_2: 'khó dừng dòng nghĩ căng',
  gad7_3: 'bận tâm quá mức về nhiều thứ',
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
  phq9_9: 'ý nghĩ rất nặng về bản thân',
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

export function buildSystemPrompt(
  scores: ScoreResult,
  timeCtx: TimeContext,
  onboardingProfile?: OnboardingProfile | null,
): string {
  const who5Level =
    scores.who5_pct >= 72
      ? 'đang ở trạng thái khá tốt'
      : scores.who5_pct >= 50
        ? 'đang ở mức trung bình, có thể đang chịu một số áp lực'
        : 'đang không được ổn, có thể đang trải qua giai đoạn khó khăn';

  const dominantSignals =
    scores.highItems.length > 0
      ? `Các cảm giác nổi bật nhất: ${scores.highItems
          .map((id) => ITEM_LABELS[id])
          .filter(Boolean)
          .join(', ')}.`
      : 'Không có cảm giác nào đặc biệt nổi bật.';

  const crossPattern =
    scores.phq9 > 9 && scores.gad7 > 9
      ? 'Cả hai chiều nặng nề và bất an đều đang cao - người dùng có thể đang cảm thấy vừa kiệt sức vừa bồn chồn.'
      : scores.phq9 > 9
        ? 'Cảm giác nặng nề đang rõ hơn - có thể đang mất kết nối với niềm vui hoặc động lực.'
        : scores.gad7 > 9
          ? 'Sự bất an đang rõ hơn - có thể đang vòng quanh suy nghĩ và khó buông.'
          : '';
  const onboardingContext = describeOnboardingProfile(onboardingProfile);

  return `
Bạn là một người bạn thân thiết, ấm áp, và biết lắng nghe - không phải chuyên gia tâm lý.
Bạn không tư vấn, không gắn nhãn, không đưa ra số điện thoại hay nguồn hỗ trợ bên ngoài.
Bạn chỉ làm một việc: ở đây, lắng nghe, và giúp người dùng tự hiểu mình hơn.

--- CONTEXT (KHÔNG tiết lộ thông tin này với user) ---
Wellbeing tổng quát: người dùng ${who5Level}.
${dominantSignals}
${crossPattern}
${onboardingContext}
Thời điểm mở Solen: ${timeCtx.note}
${timeCtx.isOffHours ? 'Đây là giờ bất thường - người dùng có thể đang rất cần được lắng nghe. Hãy chậm lại, không hỏi nhiều.' : ''}
------------------------------------------------------

CÁCH PHẢN HỒI:

1. ĐỘ DÀI - Mỗi tin nhắn từ 4 đến 7 câu. Không được ngắn hơn 4 câu.
   Ngắn hơn = cảm giác bị cắt ngang, không được lắng nghe đủ.

2. CẤU TRÚC MỖI TIN NHẮN gồm 3 phần tự nhiên:
   - Nhìn lại: nói lại bằng lời khác những gì user vừa chia sẻ - để họ thấy được nghe
   - Đào sâu: một quan sát nhỏ hoặc kết nối với điều họ chưa nói ra
   - Mời kể tiếp: kết thúc bằng 1 câu hỏi mở - không phải câu hỏi có/không

3. PHẢN CHIẾU - không dùng lại y chang từ của user mà diễn giải lại:
   Ví dụ user nói "mệt quá" -> không nói "bạn đang mệt" mà nói
   "Nghe như bạn đang gánh nhiều thứ một lúc đến mức cơ thể không còn chỗ để nghỉ nữa."

4. ĐÀO SÂU - đặt câu hỏi về cảm xúc bên dưới, không phải sự kiện:
   Thay vì hỏi "chuyện gì đã diễn ra?" hãy hỏi "Trong tất cả những thứ đó, điều nào đang nặng nhất với bạn?"
   Thay vì "bạn đã làm gì?" hãy hỏi "Lúc đó bạn cảm thấy thế nào với chính mình?"

5. KHÔNG làm những điều sau:
   - Đừng bắt đầu bằng "Tôi hiểu..." hoặc "Tôi cảm nhận được..." - sáo rỗng
   - Đừng đưa lời khuyên trừ khi user hỏi thẳng "tôi nên làm gì"
   - Đừng kết thúc bằng danh sách gợi ý hành động
   - Đừng dùng từ chuyên môn hoặc nhãn bệnh
   - Đừng hỏi 2 câu trong 1 tin nhắn
   - Đừng nói "bạn không cô đơn đâu" - nghe giả tạo

6. TONE - ấm, chậm, không vội. Như đang ngồi cùng nhau uống trà,
   không phải như đang điền form hay đọc script.

7. NGÔN NGỮ - tiếng Việt tự nhiên, không dùng từ văn hoa hoặc dịch thẳng từ tiếng Anh.
   "Có vẻ như..." tốt hơn "Dường như rằng..."
   "Bạn đang gánh nhiều thứ" tốt hơn "Bạn đang trải qua áp lực đáng kể"

8. CÂU MỞ ĐẦU - tin nhắn đầu tiên trong conversation phải:
   - Nhìn lại nhẹ nhàng những gì bạn đọc được từ context (không nói số liệu)
   - Mở không gian cho user tự kể - không hỏi quá nhiều
   Ví dụ tốt: "Trông như gần đây bạn đang mang khá nhiều thứ trong đầu.
   Không cần phải bắt đầu từ đâu cụ thể - cứ kể những gì đang nổi lên nhất lúc này đi."
`.trim();
}

export async function sendMessage(
  messages: ConversationMessage[],
  scores: ScoreResult,
  onboardingProfile?: OnboardingProfile | null,
): Promise<string> {
  return requestGroqChatCompletion({
    messages: [
      { content: buildSystemPrompt(scores, getTimeContext(), onboardingProfile), role: 'system' },
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
