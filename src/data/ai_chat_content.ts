import type { ScoreResult } from "../hooks/use_scoring";
import type { AIChatMessage } from "../services/ai_chat";
import { describeOnboardingProfile } from "./onboarding_content";
import type { OnboardingProfile } from "../types/onboarding";

export const aiChatContent = {
  initialMessages: [
    {
      content:
        "Mình ở đây để cùng bạn gỡ cảm xúc thành từng bước nhỏ. Hôm nay trong lòng bạn đang có gì?",
      id: "welcome",
      role: "assistant",
    },
  ] satisfies AIChatMessage[],
  errors: {
    load: "Không đọc được đoạn chat đã lưu.",
    save: "Không lưu được đoạn chat trên thiết bị.",
    send: "Không gửi được tin nhắn.",
    reset: "Không xoá được đoạn chat đã lưu.",
  },
  header: {
    eyebrow: "Bạn đồng hành AI",
    title: "Trò chuyện",
    savedStatus: "Đã lưu trên thiết bị",
    emptyStatus: "Ở đây để lắng nghe bạn",
    newChat: "Đoạn chat mới",
    chatListLabel: "Các đoạn chat",
    untitledChat: "Đoạn chat mới",
  },
  composer: {
    continuePlaceholder: "Viết tiếp từ đoạn này...",
    startPlaceholder: "Hôm nay trong lòng bạn đang có gì?",
    sendLabel: "Gửi",
  },
} as const;

export function buildInitialAIChatMessages(
  scores?: ScoreResult | null,
  onboardingProfile?: OnboardingProfile | null,
): AIChatMessage[] {
  return [
    {
      content: buildInitialAIChatMessage(scores, onboardingProfile),
      id: "welcome",
      role: "assistant",
    },
  ];
}

function buildInitialAIChatMessage(
  scores?: ScoreResult | null,
  onboardingProfile?: OnboardingProfile | null,
) {
  const hasOnboardingContext = Boolean(describeOnboardingProfile(onboardingProfile));

  if (!scores) {
    return "Mình ở đây để lắng nghe. Khi bạn hoàn thành phần câu hỏi, mình sẽ hiểu hơn để đi cùng bạn.";
  }

  if (scores.needsDeepScreen) {
    const mixedPattern = scores.phq9 > 9 && scores.gad7 > 9;

    const contextLine = hasOnboardingContext
      ? "Mình cũng sẽ nhớ những điều bạn đã chọn lúc bắt đầu, để không hỏi lại quá nhiều."
      : "";

    return mixedPattern
      ? `Mình đã đọc phần vừa rồi. Có vẻ gần đây bạn đang vừa mệt, vừa phải giữ nhiều thứ cùng lúc. ${contextLine} Cứ kể thứ nào đang nặng nhất - không cần theo thứ tự gì cả.`.replace(/\s+/g, " ").trim()
      : `Mình đã đọc phần vừa rồi. Gần đây có vẻ bạn đang không được nhẹ lắm. ${contextLine} Mình sẽ đi chậm cùng bạn - không vội đâu.`.replace(/\s+/g, " ").trim();
  }

  if (scores.who5_pct <= 72) {
    return "Mình đã đọc phần vừa rồi. Có vẻ bạn vẫn còn điểm tựa, nhưng hôm nay cũng có điều gì đó đang muốn được nói ra. Cứ bắt đầu từ thứ đang nổi lên nhất.";
  }

  return "Mình đã đọc phần vừa rồi. Nhìn chung bạn đang ổn - nhưng hẳn có lý do để mở cuộc trò chuyện này. Điều gì đang có trong đầu bạn lúc này?";
}
