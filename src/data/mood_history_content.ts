import type { MoodEntry } from "../types/mood_history";

export const moodHistoryContent = {
  clear: {
    cancel: "Giữ lại",
    confirm: "Xoá",
    message:
      "Toàn bộ lịch sử sẽ bị xoá khỏi thiết bị này và tài khoản của bạn. Không thể khôi phục.",
    title: "Xoá toàn bộ lịch sử?",
  },
  history: {
    close: "×",
    title: "Lịch sử",
  },
  insight: {
    action: "Xem thêm",
    title: "Gần đây",
  },
  progress: {
    empty: "Cần thêm vài lần nhìn lại để thấy xu hướng rõ hơn.",
    title: "Xu hướng theo tuần",
  },
  pixel: {
    title: "Pixel Mood",
  },
} as const;

export function buildMoodInsight(entries: MoodEntry[]) {
  const sortedEntries = sortEntries(entries);
  const recentEntries = sortedEntries.slice(0, 3);

  if (sortedEntries.length < 3) {
    return sortedEntries.length === 1
      ? "Mình đã ghi lại lần nhìn lại đầu tiên của bạn."
      : `Mình đã ghi lại ${sortedEntries.length} lần bạn dừng lại lắng nghe chính mình.`;
  }

  if (
    recentEntries.length === 3 &&
    recentEntries.every((entry) => entry.who5_pct < 50)
  ) {
    return "Mấy ngày gần đây có vẻ khá nặng. Không cần vội - cứ từng ngày thôi.";
  }

  const sevenDaysAgo = startOfDay(addDays(new Date(), -6));
  const recentLateNightCount = sortedEntries.filter(
    (entry) =>
      new Date(entry.timestamp) >= sevenDaysAgo &&
      entry.timePeriod === "late_night",
  ).length;

  if (recentLateNightCount >= 2) {
    return "Gần đây bạn hay mở Solen lúc đêm khuya. Có điều gì đang khó ngủ không?";
  }

  if (sortedEntries[0]?.highItems.includes("phq9_3")) {
    return "Giấc ngủ đang bị ảnh hưởng thời điểm này.";
  }

  const thisWeekAverage = getWeekAverage(sortedEntries, 0);
  const previousWeekAverage = getWeekAverage(sortedEntries, -1);

  if (thisWeekAverage !== null && previousWeekAverage !== null) {
    if (thisWeekAverage - previousWeekAverage >= 20) {
      return "Tuần này có vẻ nhẹ hơn tuần trước một chút.";
    }

    if (previousWeekAverage - thisWeekAverage >= 20) {
      return "Tuần này có vẻ nặng hơn bình thường.";
    }
  }

  const thirtyDaysAgo = startOfDay(addDays(new Date(), -29));
  const count = sortedEntries.filter(
    (entry) => new Date(entry.timestamp) >= thirtyDaysAgo,
  ).length;

  return `Bạn đã dừng lại để lắng nghe bản thân ${count} lần gần đây.`;
}

export function buildWeekSummary(entries: MoodEntry[], weekOffset: number) {
  const weekEntries = getEntriesForWeek(entries, weekOffset);

  if (weekEntries.length === 0) {
    return "";
  }

  return buildMoodInsight(weekEntries);
}

export function buildMoodLevel(who5Pct: number) {
  if (who5Pct >= 72) {
    return "Cảm xúc khá nhẹ nhàng";
  }

  if (who5Pct >= 50) {
    return "Cảm xúc tương đối tốt";
  }

  return "Cảm xúc khá nặng nề";
}

export function buildWeeklyProgress(entries: MoodEntry[], weekCount = 5) {
  return Array.from({ length: weekCount }, (_, index) => {
    const weekOffset = index - (weekCount - 1);
    const weekEntries = getEntriesForWeek(entries, weekOffset);
    const average =
      weekEntries.length > 0
        ? Math.round(
            weekEntries.reduce((total, entry) => total + entry.who5_pct, 0) /
              weekEntries.length,
          )
        : null;
    const { end, start } = getWeekRange(weekOffset);

    let label = "";
    if (weekOffset === 0) {
      label = "T.này";
    } else if (weekOffset === -1) {
      label = "T.trước";
    } else {
      label = `${Math.abs(weekOffset)}t trước`;
    }

    return {
      average,
      count: weekEntries.length,
      label,
      range: `${formatDayMonth(start)} - ${formatDayMonth(end)}`,
      weekOffset,
    };
  });
}

export function buildWeeklyTrendText(entries: MoodEntry[]) {
  const progress = buildWeeklyProgress(entries);
  const weeksWithData = progress.filter((week) => week.average !== null);

  if (weeksWithData.length < 2) {
    return moodHistoryContent.progress.empty;
  }

  const latestWeek = weeksWithData[weeksWithData.length - 1];
  const previousWeek = weeksWithData[weeksWithData.length - 2];
  const difference = (latestWeek.average ?? 0) - (previousWeek.average ?? 0);

  if (difference >= 12) {
    return "Tuần này đang nhẹ hơn tuần trước.";
  }

  if (difference <= -12) {
    return "Tuần này có vẻ nặng hơn tuần trước.";
  }

  return "Mấy tuần gần đây khá ổn định.";
}

export function getEntriesForWeek(entries: MoodEntry[], weekOffset: number) {
  const { end, start } = getWeekRange(weekOffset);

  return sortEntries(
    entries.filter((entry) => {
      const date = new Date(entry.timestamp);

      return date >= start && date <= end;
    }),
  );
}

export function getEntriesForMonth(entries: MoodEntry[], monthOffset: number) {
  const { end, start } = getMonthRange(monthOffset);

  return sortEntries(
    entries.filter((entry) => {
      const date = new Date(entry.timestamp);

      return date >= start && date <= end;
    }),
  );
}

export function getWeekRange(weekOffset: number) {
  const today = startOfDay(new Date());
  const monday = addDays(today, -getMondayBasedDayIndex(today));
  const start = addDays(monday, weekOffset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { end, start };
}

export function getMonthRange(monthOffset: number) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);

  return { end, start };
}

function getWeekAverage(entries: MoodEntry[], weekOffset: number) {
  const weekEntries = getEntriesForWeek(entries, weekOffset);

  if (weekEntries.length === 0) {
    return null;
  }

  return (
    weekEntries.reduce((total, entry) => total + entry.who5_pct, 0) /
    weekEntries.length
  );
}

function sortEntries(entries: MoodEntry[]) {
  return [...entries].sort(
    (first, second) =>
      new Date(second.timestamp).getTime() -
      new Date(first.timestamp).getTime(),
  );
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + amount);

  return nextDate;
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);

  return nextDate;
}

function getMondayBasedDayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

function formatDayMonth(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}
