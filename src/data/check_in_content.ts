export const checkInContent = {
  eyebrow: 'Nhìn lại',
  title: 'Dừng lại một chút. Xem trong lòng đang có gì.',
  description:
    'Không cần gọi tên chính xác. Cứ chọn thứ gần nhất với lúc này.',
  modes: [
    {
      label: 'Lắng nghe',
      description: 'Chọn thứ gần nhất với cảm giác của bạn lúc này.',
    },
    {
      label: 'Thở',
      description: 'Một hành động rất nhỏ để cơ thể bớt căng một chút.',
    },
    {
      label: 'Nhìn lại',
      description: 'Gom những gì đang có trong lòng thành một câu - không kết luận thay bạn.',
    },
  ],
  sections: [
    {
      label: 'Cơ thể',
      prompt: 'Cơ thể đang có cảm giác gì?',
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
      body: 'Đổi tư thế, thả lỏng vùng đang căng, hoặc đi vài bước ngắn để cơ thể bớt bị kẹt.',
      nextQuestion: 'Vùng nào trên cơ thể đang cần được chăm sóc trước?',
    },
  },
  reflectionPrompt: 'Nếu nhìn lại thật nhẹ: điều gì đang có mặt?',
  softQuestion: 'Năm phút tới có thể nhẹ hơn 5% bằng cách nào?',
  safetyNote:
    'Phần này giúp bạn nhận ra mình đang ở đâu - không chẩn đoán, không kết luận.',
  primaryAction: 'Chọn một bước nhỏ',
} as const;

export const conceptContent = {
  title: 'Cách app đọc cảm xúc',
  description:
    'Không kết luận từ một câu trả lời. App nên nhìn nhiều cảm giác cùng chiều, rồi viết lại bằng ngôn ngữ nhẹ.',
  productLayers: [
    {
      label: 'Tầng 1',
      title: 'Điểm vào',
      tone: 'Hôm nay bạn đang thế nào?',
      items: ['Hôm nay', 'Viết / nói tự do', 'Cơ thể'],
    },
    {
      label: 'Tầng 2',
      title: 'Hôm nay',
      tone: 'Đọc nhịp cảm xúc, không gắn nhãn',
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
  inference: 'Cần ít nhất 3 cảm giác cùng chiều trước khi viết lại một câu nhìn lại.',
  output: 'Có vẻ gần đây bạn đang mang nhiều thứ hơn bình thường.',
} as const;
