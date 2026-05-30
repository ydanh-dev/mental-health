import type { ScoreResult } from "../hooks/use_scoring";
import { sendMessage } from "./groq";

export type AIChatMessage = {
  content: string;
  id: string;
  role: "assistant" | "user";
};

export type AIChatResponse = {
  message: string;
  refused: boolean;
  riskLevel: "low" | "medium" | "high" | "crisis";
  safetyMessage?: string;
};

export async function requestAIChat(
  messages: AIChatMessage[],
  scores?: ScoreResult | null,
): Promise<AIChatResponse> {
  if (!scores) {
    throw new Error("Bạn cần hoàn thành phần check-in trước khi trò chuyện.");
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
    riskLevel: scores.isCrisis
      ? "crisis"
      : scores.needsDeepScreen
        ? "medium"
        : "low",
    safetyMessage: scores.isCrisis
      ? "Nếu bạn đang cảm thấy quá tải hoặc kiệt sức, hãy thử dành vài phút hít thở sâu, đi dạo nhẹ nhàng hoặc nhắn tin chia sẻ cùng một người bạn thân thiết nhé."
      : undefined,
  };
}
