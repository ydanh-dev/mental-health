import type { ScoreResult } from '../hooks/use_scoring';
import { sendMessage } from './groq';

export type AIChatMessage = {
  content: string;
  id: string;
  role: 'assistant' | 'user';
};

export type AIChatResponse = {
  message: string;
  refused: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'crisis';
  safetyMessage?: string;
};

export async function requestAIChat(
  messages: AIChatMessage[],
  scores?: ScoreResult | null,
): Promise<AIChatResponse> {
  if (!scores) {
    throw new Error('Bạn cần hoàn thành phần check-in trước khi trò chuyện với AI.');
  }

  const message = await sendMessage(
    messages.slice(-12).map(({ content, role }) => ({
      content: content.slice(0, 1200),
      role,
    })),
    scores,
  );

  return {
    message,
    refused: false,
    riskLevel: scores.isCrisis ? 'crisis' : scores.needsDeepScreen ? 'medium' : 'low',
    safetyMessage: scores.isCrisis
      ? 'Nếu bạn đang nghĩ đến việc tự làm hại bản thân, hãy liên hệ ngay với người bạn tin cậy, dịch vụ khẩn cấp địa phương, hoặc đường dây 1800 599 920.'
      : undefined,
  };
}
