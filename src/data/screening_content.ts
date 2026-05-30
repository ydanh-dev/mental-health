export const screeningContent = {
  intro: {
    eyebrow: 'Check-in',
    title: 'Khi thấy có gì đó không ổn',
    description:
      'Mình sẽ hỏi từng câu ngắn như một đoạn chat. Không có chẩn đoán, chỉ gom tín hiệu để hiểu bạn đang cần gì hơn lúc này.',
  },
  progress: {
    done: 'Đã đủ tín hiệu',
    lowWellbeing: 'Mình sẽ hỏi thêm vài câu để hiểu rõ hơn.',
    stableWellbeing: 'Có vẻ bạn vẫn còn điểm tựa. Mình sẽ chuyển sang lắng nghe thêm.',
  },
  completion: {
    title: 'Mình đã có đủ tín hiệu để trò chuyện tiếp.',
    body: 'Bạn có thể mở AI ở góc dưới để kể thêm. Mình sẽ dùng phần check-in này làm ngữ cảnh, không đọc điểm số ra thành nhãn.',
    action: 'Làm lại check-in',
  },
  crisis: {
    body:
      'Nếu bạn đang nghĩ đến việc tự làm hại bản thân, bạn không phải một mình. Đường dây hỗ trợ: 1800 599 920 (miễn phí)',
    action: 'Gọi ngay',
  },
  typingLabel: 'AI đang gõ',
} as const;
