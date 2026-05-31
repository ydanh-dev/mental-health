export type TimePeriod =
  | 'late_night'
  | 'early_morning'
  | 'morning'
  | 'midday'
  | 'afternoon'
  | 'evening'
  | 'night';

export interface TimeContext {
  hour: number;
  period: TimePeriod;
  note: string;
  isOffHours: boolean;
}

const timeNotes: Record<TimePeriod, string> = {
  afternoon:
    'User mở Solen buổi chiều - có thể đang mệt mỏi tích lũy trong ngày',
  early_morning:
    'User mở Solen sáng sớm - có thể lo lắng trước ngày mới, cần tone bình tĩnh và tiếp thêm sức',
  evening:
    'User mở Solen buổi tối - đang reflect sau một ngày dài, cần không gian để kể',
  late_night:
    'User mở Solen lúc đêm khuya - có thể đang mất ngủ hoặc rất bứt rứt, cần tone nhẹ nhàng và không hỏi dồn',
  midday:
    'User mở Solen giữa trưa - có thể kiệt sức hoặc cần lấy lại năng lượng',
  morning:
    'User mở Solen buổi sáng - tỉnh táo, có thể đang xử lý cảm xúc từ hôm qua',
  night:
    'User mở Solen đêm muộn - có thể cô đơn hoặc khó buông bỏ suy nghĩ',
};

export function getTimeContext(): TimeContext {
  const now = new Date();
  const hour = now.getHours();
  let period: TimePeriod;

  if (hour >= 0 && hour < 5) {
    period = 'late_night';
  } else if (hour >= 5 && hour < 9) {
    period = 'early_morning';
  } else if (hour >= 9 && hour < 12) {
    period = 'morning';
  } else if (hour >= 12 && hour < 14) {
    period = 'midday';
  } else if (hour >= 14 && hour < 18) {
    period = 'afternoon';
  } else if (hour >= 18 && hour < 22) {
    period = 'evening';
  } else {
    period = 'night';
  }

  return {
    hour,
    isOffHours: hour < 7 || hour >= 22,
    note: timeNotes[period],
    period,
  };
}
