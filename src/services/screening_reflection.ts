import screeningJson from '../data/screening.json';
import type { ScoreResult } from '../hooks/use_scoring';
import type { ScreeningData } from '../types/screening';
import { requestGroqChatCompletion } from './groq';

const screeningData = screeningJson as unknown as ScreeningData;

export async function requestScreeningReflection(
  answers: Record<string, string>,
  scores: ScoreResult,
) {
  try {
    return await requestGroqChatCompletion({
      maxTokens: 220,
      messages: [
        {
          content: buildReflectionPrompt(answers, scores),
          role: 'system',
        },
      ],
      responseFormat: 'text',
      temperature: 0.45,
    });
  } catch {
    return buildFallbackReflection(scores);
  }
}

function buildReflectionPrompt(answers: Record<string, string>, scores: ScoreResult) {
  const answeredItems = formatAnswers(answers);
  const wellbeing =
    scores.who5_pct >= 72
      ? 'khá nhẹ'
      : scores.who5_pct >= 50
        ? 'tương đối ổn nhưng vẫn có vài điểm đáng để ý'
        : 'khá nặng và cần được đi chậm';

  return `
Bạn viết một đoạn nhìn lại ngắn bằng tiếng Việt cho app Solen sau khi user vừa hoàn thành check-in.
Không dùng giọng bác sĩ. Không nhắc tên thang đo, không nhắc điểm số, không gắn nhãn, không đưa lời khuyên mạnh.
Tránh ngôn ngữ y khoa, nhãn bệnh, hotline, bài thở, từ gợi tai nạn, hoặc cách nói giống thu thập dữ liệu.

Ngữ cảnh:
- Nền cảm xúc đang: ${wellbeing}.
- Các lựa chọn nổi bật: ${answeredItems || 'không có lựa chọn nổi bật rõ ràng'}.
- Nếu có phần rất nặng, chỉ phản ánh nhẹ rằng "có điều gì đó đang rất khó ở bên trong", không đưa hotline trong đoạn này.

Viết 2-3 câu, tự nhiên, ấm, cụ thể. Kết thúc bằng một câu mời user có thể kể tiếp ở chat, nhưng không ép.
`.trim();
}

function formatAnswers(answers: Record<string, string>) {
  const instruments = screeningData.instruments;

  return Object.entries(answers)
    .map(([questionId, answerValue]) => {
      const instrument = instruments.find((item) =>
        item.questions.some((question) => question.id === questionId),
      );
      const question = instrument?.questions.find((item) => item.id === questionId);
      const option = question ? screeningData.scales[question.scale].options.find((item) => item.value === answerValue) : undefined;

      if (!question || !option) {
        return '';
      }

      return `${question.text} → ${option.label}`;
    })
    .filter(Boolean)
    .slice(0, 8)
    .join('; ');
}

function buildFallbackReflection(scores: ScoreResult) {
  if (scores.who5_pct >= 72) {
    return 'Phần bạn vừa chọn cho thấy hôm nay vẫn còn vài điểm tựa khá rõ. Nếu vẫn có điều gì khiến bạn mở Solen lúc này, bạn có thể kể tiếp từ phần đang nổi lên nhất.';
  }

  if (scores.who5_pct >= 50) {
    return 'Có vẻ hôm nay không hẳn là quá nặng, nhưng cũng không hoàn toàn nhẹ. Một vài cảm giác đang cần được nhìn lại chậm hơn, và bạn có thể kể tiếp nếu muốn giữ nhịp này.';
  }

  return 'Phần bạn vừa chọn cho thấy có điều gì đó đang khá nặng ở bên trong. Không cần gọi tên thật chính xác ngay; chỉ cần bắt đầu từ điều đang chiếm nhiều chỗ nhất lúc này.';
}
