export const screeningContent = {
  intro: {
    title: "Hôm nay bạn đang thế nào?",
    description:
      "Không có câu trả lời đúng hay sai. Cứ chọn thứ gần nhất với cảm giác của bạn lúc này.",
  },
  progress: {
    done: "Đã đủ tín hiệu",
    lowWellbeing: "Mình sẽ hỏi thêm vài câu để hiểu rõ hơn.",
    stableWellbeing:
      "Có vẻ bạn vẫn còn điểm tựa. Mình sẽ chuyển sang lắng nghe thêm.",
  },
  completion: {
    title: "Mình đã có đủ tín hiệu để trò chuyện tiếp.",
    body: "Bạn có thể mở AI ở góc dưới để kể thêm. Mình sẽ dùng phần check-in này làm ngữ cảnh, không đọc điểm số ra thành nhãn.",
    action: "Làm lại check-in",
  },
  crisis: {
    body: "Nếu bạn cần hỗ trợ, hãy nhắn tin trực tiếp với chatbot của chúng tôi ở góc dưới màn hình nhé.",
    action: "Chat ngay",
  },
  typingLabel: "AI đang gõ",
} as const;
