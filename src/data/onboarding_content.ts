import type { OnboardingGoal, OnboardingTrigger, SleepHabit } from '../types/onboarding';

export const onboardingContent = {
  action: {
    back: 'Quay lại',
    finish: 'Xong rồi',
    next: 'Tiếp theo',
    skip: 'Để sau',
  },
  intro: {
    eyebrow: 'Bắt đầu nhẹ thôi',
    title: 'Để Solen hiểu bạn hơn một chút.',
    description:
      'Ba câu ngắn này giúp phần trò chuyện đi đúng nhịp với bạn hơn. Bạn có thể đổi sau.',
  },
  steps: [
    {
      description: 'Chọn tối đa 2 điều gần với bạn nhất lúc này.',
      key: 'goals',
      title: 'Bạn muốn Solen giúp gì trước?',
    },
    {
      description: 'Không cần chính xác tuyệt đối. Chọn những điều hay làm lòng bạn chùng xuống.',
      key: 'triggers',
      title: 'Điều gì thường chạm vào cảm xúc của bạn?',
    },
    {
      description: 'Chọn nhịp gần nhất trong thời gian này.',
      key: 'sleep',
      title: 'Giấc ngủ gần đây thế nào?',
    },
  ],
} as const;

export const onboardingGoals: Array<{
  body: string;
  id: OnboardingGoal;
  title: string;
}> = [
  {
    body: 'Nhận ra cảm giác trước khi nó thành một khối lớn.',
    id: 'understand_feelings',
    title: 'Hiểu cảm xúc hơn',
  },
  {
    body: 'Nhìn lại nhịp nghỉ, tối muộn và cảm giác khi thức dậy.',
    id: 'sleep_better',
    title: 'Ngủ nhẹ hơn',
  },
  {
    body: 'Tách bớt những thứ đang dồn vào cùng lúc.',
    id: 'reduce_overload',
    title: 'Bớt quá tải',
  },
  {
    body: 'Có một điểm dừng nhỏ đều đặn mỗi ngày.',
    id: 'build_rhythm',
    title: 'Tạo nhịp nhìn lại',
  },
];

export const onboardingTriggers: Array<{
  body: string;
  id: OnboardingTrigger;
  title: string;
}> = [
  {
    body: 'Deadline, việc học, việc làm, hoặc kỳ vọng phải theo kịp.',
    id: 'work_study',
    title: 'Công việc / học tập',
  },
  {
    body: 'Tin nhắn, khoảng cách, mâu thuẫn, hoặc cảm giác không được hiểu.',
    id: 'relationships',
    title: 'Mối quan hệ',
  },
  {
    body: 'Những điều chưa rõ, kế hoạch đổi liên tục, hoặc phải chờ đợi.',
    id: 'uncertainty',
    title: 'Sự mơ hồ',
  },
  {
    body: 'Cảm giác phải làm tốt hơn, nhanh hơn, đúng hơn.',
    id: 'self_pressure',
    title: 'Áp lực từ chính mình',
  },
  {
    body: 'Quá nhiều thông báo, nội dung, âm thanh, hoặc việc cần nhớ.',
    id: 'too_much_input',
    title: 'Quá nhiều đầu vào',
  },
];

export const onboardingSleepHabits: Array<{
  body: string;
  id: SleepHabit;
  title: string;
}> = [
  {
    body: 'Ngủ và thức dậy khá đều.',
    id: 'steady',
    title: 'Khá đều',
  },
  {
    body: 'Thường trễ hơn dự định.',
    id: 'late',
    title: 'Hay ngủ muộn',
  },
  {
    body: 'Dễ tỉnh giấc hoặc ngủ không liền mạch.',
    id: 'interrupted',
    title: 'Bị ngắt quãng',
  },
  {
    body: 'Thức dậy vẫn thấy chưa được nghỉ đủ.',
    id: 'tired_morning',
    title: 'Sáng vẫn mệt',
  },
  {
    body: 'Chưa nhìn ra nhịp rõ ràng.',
    id: 'not_sure',
    title: 'Chưa chắc',
  },
];

export function describeOnboardingProfile(
  profile: {
    goals: OnboardingGoal[];
    sleepHabit: SleepHabit | null;
    triggers: OnboardingTrigger[];
  } | null | undefined,
) {
  if (!profile) {
    return '';
  }

  const goals = profile.goals
    .map((goal) => onboardingGoals.find((item) => item.id === goal)?.title)
    .filter(Boolean)
    .join(', ');
  const triggers = profile.triggers
    .map((trigger) => onboardingTriggers.find((item) => item.id === trigger)?.title)
    .filter(Boolean)
    .join(', ');
  const sleepHabit = onboardingSleepHabits.find((item) => item.id === profile.sleepHabit)?.title;

  return [
    goals ? `Mục tiêu người dùng chọn: ${goals}.` : '',
    triggers ? `Những điều dễ chạm vào cảm xúc: ${triggers}.` : '',
    sleepHabit ? `Nhịp ngủ gần đây: ${sleepHabit}.` : '',
  ].filter(Boolean).join('\n');
}
