import type { ScoreResult } from "../hooks/use_scoring";
import type { OnboardingProfile } from "../types/onboarding";
import { sendMessage } from "./groq";

export type AIChatMessage = {
  content: string;
  id: string;
  role: "assistant" | "user";
};

export type AIChatResponse = {
  message: string;
  refused: boolean;
};

export async function requestAIChat(
  messages: AIChatMessage[],
  scores?: ScoreResult | null,
  onboardingProfile?: OnboardingProfile | null,
): Promise<AIChatResponse> {
  if (!scores) {
    throw new Error("Bạn cần hoàn thành phần câu hỏi trước khi trò chuyện.");
  }

  const message = await sendMessage(
    messages.slice(-12).map(({ content, role }) => ({
      content: content.slice(0, 1200),
      role,
    })),
    scores,
    onboardingProfile,
  );

  return {
    message,
    refused: false,
  };
}
