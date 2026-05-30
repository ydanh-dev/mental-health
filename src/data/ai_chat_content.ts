import type { ScoreResult } from "../hooks/use_scoring";
import type { AIChatMessage } from "../services/ai_chat";

export const aiChatContent = {
  conversationsStorageKey: "mental-health.ai-chat.conversations.v1",
  storageKey: "mental-health.ai-chat.messages.v1",
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
    emptyStatus: "Chỉ trả lời về cảm xúc",
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
): AIChatMessage[] {
  return [
    {
      content: buildInitialAIChatMessage(scores),
      id: "welcome",
      role: "assistant",
    },
  ];
}

function buildInitialAIChatMessage(scores?: ScoreResult | null) {
  if (!scores) {
    return "Mình ở đây để cùng bạn gỡ cảm xúc thành từng bước nhỏ. Sau khi hoàn thành check-in, mình sẽ hiểu ngữ cảnh của bạn rõ hơn.";
  }

  if (scores.isCrisis) {
    return "Mình thấy phần check-in vừa rồi có tín hiệu cần ưu tiên sự an toàn của bạn. Trước khi nói sâu hơn, lúc này bạn có đang ở nơi an toàn không?";
  }

  if (scores.needsDeepScreen) {
    const mixedPattern = scores.phq9 > 9 && scores.gad7 > 9;

    return mixedPattern
      ? "Mình đã đọc phần check-in vừa rồi. Có vẻ gần đây bạn vừa xuống năng lượng, vừa phải giữ khá nhiều lo lắng cùng lúc. Nếu muốn, mình có thể cùng bạn gỡ phần đang nặng nhất trước."
      : "Mình đã đọc phần check-in vừa rồi. Có vẻ trạng thái gần đây đang thấp hơn bình thường, nên mình sẽ đi chậm và phản chiếu từng phần cùng bạn.";
  }

  if (scores.who5_pct <= 72) {
    return "Mình đã đọc phần check-in vừa rồi. Có vẻ bạn vẫn còn vài điểm tựa, nhưng cũng có điều gì đó đang cần được lắng nghe thêm.";
  }

  return "Mình đã đọc phần check-in vừa rồi. Có vẻ nền tảng hiện tại của bạn tương đối ổn, mình có thể lắng nghe thêm điều khiến bạn muốn mở cuộc trò chuyện này.";
}
