import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  buildMoodLevel,
  getEntriesForWeek,
  getWeekRange,
} from '../data/mood_history_content';
import { colors, radius, spacing } from '../styles/theme';
import type { MoodEntry } from '../types/mood_history';

type MoodHeatmapProps = {
  entries: MoodEntry[];
  onDayPress?: (entry: MoodEntry | null, date: Date) => void;
  weekOffset?: number;
};

const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function MoodHeatmap({ entries, onDayPress, weekOffset = 0 }: MoodHeatmapProps) {
  const weekEntries = getEntriesForWeek(entries, weekOffset);
  const { start } = getWeekRange(weekOffset);

  return (
    <View style={styles.wrap}>
      {dayLabels.map((label, index) => {
        const date = addDays(start, index);
        const dayNum = date.getDate();
        const entry = findEntryForDate(weekEntries, date);
        const hasEntry = Boolean(entry);
        const isToday = isSameDay(date, new Date());
        const moodStyle = entry ? getMoodStyle(entry.who5_pct) : null;
        const cellBg = moodStyle?.bg ?? '#F3ECE1';
        const weekdayColor = moodStyle?.muted ?? '#A1988B';
        const dateColor = moodStyle?.text ?? '#7E7467';

        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label} ngày ${dayNum}${
              entry
                ? `, đã lưu ghi chép, ${buildMoodLevel(entry.who5_pct)}`
                : ', chưa có ghi chép'
            }${isToday ? ', hôm nay' : ''}`}
            disabled={!onDayPress}
            key={label}
            onPress={() => onDayPress?.(entry, date)}
            style={({ pressed }) => [
              styles.dayCell,
              { backgroundColor: cellBg },
              hasEntry && styles.dayCellActive,
              !hasEntry && styles.dayCellEmpty,
              isToday && styles.dayCellToday,
              pressed && onDayPress && styles.dayCellPressed,
            ]}
          >
            <Text style={[styles.weekdayLabel, { color: weekdayColor }]}>
              {label}
            </Text>
            <Text style={[styles.dayNumber, { color: dateColor }]}>
              {dayNum}
            </Text>
            <View
              style={[
                styles.dayStatus,
                hasEntry
                  ? { backgroundColor: moodStyle?.text ?? colors.teal }
                  : styles.dayStatusEmpty,
              ]}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

function getMoodStyle(who5Pct: number) {
  if (who5Pct >= 72) {
    return {
      bg: '#EAF2EF',
      text: '#0E6B59',
      muted: '#5A9E8F',
    };
  }
  if (who5Pct >= 50) {
    return {
      bg: '#A8D0C5',
      text: '#0E6B59',
      muted: '#457D71',
    };
  }
  return {
    bg: '#3D6B5E',
    text: '#FAF8F5',
    muted: '#A5C1B8',
  };
}

function findEntryForDate(entries: MoodEntry[], date: Date) {
  return entries.find((entry) => {
    const entryDate = new Date(entry.timestamp);

    return isSameDay(entryDate, date);
  }) ?? null;
}

function isSameDay(firstDate: Date, secondDate: Date) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
}

function addDays(date: Date, amount: number) {
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + amount);

  return nextDate;
}

const styles = StyleSheet.create({
  dayCell: {
    alignItems: 'center',
    borderColor: colors.lineSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    height: 54,
    justifyContent: 'center',
    minWidth: 36,
    paddingVertical: spacing.xxs,
  },
  dayCellActive: {
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1.5,
  },
  dayCellEmpty: {
    borderColor: '#E4DBCD',
    borderStyle: 'dashed',
  },
  dayCellPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
  dayCellToday: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  weekdayLabel: {
    fontSize: 9,
    fontWeight: '900',
    lineHeight: 11,
    textTransform: 'uppercase',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 17,
    marginTop: 1,
  },
  dayStatus: {
    borderRadius: 999,
    height: 5,
    marginTop: 3,
    width: 18,
  },
  dayStatusEmpty: {
    backgroundColor: '#D8D0C2',
    opacity: 0.55,
  },
  wrap: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
