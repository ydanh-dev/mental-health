export const checkInContent = {
  eyebrow: 'Phản chiếu',
  title: 'Chạm vào tín hiệu. Rồi hãy nhẹ nhàng gỡ nó ra.',
  description:
    'Không cần gọi tên cảm xúc ngay. Bắt đầu bằng những dấu hiệu nhỏ từ cơ thể, tâm trí, hành vi và bối cảnh.',
  modes: [
    {
      label: 'Check-in',
      description: 'Chọn hình, màu, từ hoặc một dấu hiệu gần nhất với lúc này.',
    },
    {
      label: 'Giải tỏa',
      description: 'Chọn một hành động rất nhỏ để cơ thể mềm xuống một chút.',
    },
    {
      label: 'Phản chiếu',
      description: 'Gom các tín hiệu thành một câu nhẹ nhàng, không kết luận thay bạn.',
    },
  ],
  sections: [
    {
      label: 'Cơ thể',
      prompt: 'Cơ thể đang gửi tín hiệu gì?',
      signals: ['Căng cơ', 'Nặng ngực', 'Bồn chồn', 'Mỏi mắt'],
    },
    {
      label: 'Tâm trí',
      prompt: 'Dòng suy nghĩ đang đi theo hướng nào?',
      signals: ['Suy nghĩ dồn dập', 'Mơ hồ', 'Lặp lại kế hoạch', 'Quá nhiều thông tin'],
    },
    {
      label: 'Cảm xúc',
      prompt: 'Tông cảm xúc nào gần nhất?',
      signals: ['Ngợp', 'Bất an', 'Mất kết nối', 'Dễ tổn thương'],
    },
    {
      label: 'Nhu cầu',
      prompt: 'Điều gì có thể giúp nhẹ hơn một bậc?',
      signals: ['Cần khoảng riêng', 'Cần rõ ràng', 'Cần được trấn an', 'Tạm ổn'],
    },
  ],
  journalPrompt: 'Nếu cảm giác này có một câu, nó sẽ nói gì?',
  journalPlaceholder: 'Viết một câu bất kỳ. Không cần đúng, không cần gọn...',
  supportTitle: 'Chọn một hướng xử lý',
  supportDescription:
    'Không cần “hết buồn” ngay. Chọn một việc nhỏ có thể làm cảm xúc bớt mắc kẹt.',
  supportActions: {
    space: {
      title: 'Tạo khoảng riêng',
      body: 'Tạm dừng phản hồi, rời khỏi nguồn gây quá tải, hoặc nói: “Mình cần 10 phút rồi quay lại.”',
      nextQuestion: 'Bạn muốn tạm cách khỏi điều gì trước?',
    },
    clarity: {
      title: 'Làm rõ một điểm',
      body: 'Viết ra đúng một điều đang mơ hồ. Tách “sự thật đã biết” khỏi “điều mình đang đoán”.',
      nextQuestion: 'Điều nào cần được làm rõ đầu tiên?',
    },
    reassurance: {
      title: 'Tìm điểm tựa',
      body: 'Chọn một người hoặc một câu tự trấn an có thật: “Mình đang khó chịu, nhưng mình không phải xử lý một mình.”',
      nextQuestion: 'Ai hoặc điều gì có thể làm bạn thấy được nâng đỡ hơn?',
    },
    reduceInput: {
      title: 'Giảm đầu vào',
      body: 'Đóng bớt một nguồn thông tin, hoãn một quyết định, và chỉ giữ lại việc cần làm trong 15 phút tới.',
      nextQuestion: 'Nguồn nào đang làm tâm trí ồn nhất?',
    },
    bodyCare: {
      title: 'Xử lý phần cơ thể',
      body: 'Đổi tư thế, uống nước, thả lỏng vùng đang căng, hoặc đi vài bước ngắn để cơ thể bớt bị kẹt.',
      nextQuestion: 'Vùng nào trên cơ thể đang cần được chăm sóc trước?',
    },
  },
  reflectionPrompt: 'Nếu phản chiếu lại thật nhẹ: điều gì đang có mặt?',
  softQuestion: 'Năm phút tới có thể nhẹ hơn 5% bằng cách nào?',
  safetyNote:
    'Phần này dùng để tự nhận biết và neo lại. Nó không chẩn đoán và không thay thế hỗ trợ chuyên môn.',
  primaryAction: 'Chọn một bước nhỏ',
} as const;

export const conceptContent = {
  title: 'Cách app đọc cảm xúc',
  description:
    'Không kết luận từ một câu trả lời. App nên gom nhiều tín hiệu cùng chiều, rồi phản chiếu lại bằng ngôn ngữ nhẹ.',
  productLayers: [
    {
      label: 'Tầng 1',
      title: 'Điểm vào',
      tone: 'Khi thấy có gì đó không ổn',
      items: ['Quick check-in', 'Viết / nói tự do', 'Body scan'],
    },
    {
      label: 'Tầng 2',
      title: 'Nhận diện',
      tone: 'Đọc pattern, không chẩn đoán',
      items: ['Pattern theo thời điểm', 'Mức độ & tông màu', 'Trigger mapping'],
    },
    {
      label: 'Tầng 3',
      title: 'Hỗ trợ',
      tone: 'Cá nhân hóa, không áp đặt',
      items: ['Micro-action', 'Chia sẻ ẩn danh', 'Kết nối chuyên gia khi cần'],
    },
  ],
  signalLayers: [
    {
      title: 'Hành vi',
      detail: 'Giờ mở app, tần suất, tốc độ viết, độ dài nhật ký.',
    },
    {
      title: 'Ngôn ngữ',
      detail: 'Từ ngữ được chọn, câu ngắn hay dài, phủ định lặp lại.',
    },
    {
      title: 'Sinh lý',
      detail: 'Dữ liệu opt-in như giấc ngủ, nhịp tim, bước chân.',
    },
    {
      title: 'Bối cảnh',
      detail: 'Thứ mấy, deadline, thời tiết, lịch sử riêng của người dùng.',
    },
  ],
  inference: 'Cần ít nhất 3 tín hiệu cùng chiều trước khi đưa ra một phản chiếu.',
  output: 'Có vẻ gần đây bạn đang chịu nhiều áp lực hơn thường lệ.',
} as const;
