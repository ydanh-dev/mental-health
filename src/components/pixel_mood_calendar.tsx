import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  buildMoodLevel,
  getEntriesForMonth,
  getMonthRange,
  moodHistoryContent,
} from '../data/mood_history_content';
import { colors, radius, spacing } from '../styles/theme';
import type { MoodEntry } from '../types/mood_history';

type PixelMoodCalendarProps = {
  entries: MoodEntry[];
};

const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function PixelMoodCalendar({ entries }: PixelMoodCalendarProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const monthEntries = getEntriesForMonth(entries, monthOffset);
  const days = useMemo(() => buildMonthDays(monthOffset), [monthOffset]);
  const weeks = useMemo(() => {
    const chunked: Array<Array<Date | null>> = [];
    for (let i = 0; i < days.length; i += 7) {
      chunked.push(days.slice(i, i + 7));
    }
    return chunked;
  }, [days]);
  const entriesByDate = useMemo(() => groupEntriesByDate(monthEntries), [monthEntries]);
  const selectedEntry = selectedDateKey ? entriesByDate.get(selectedDateKey)?.[0] ?? null : null;
  const { start } = getMonthRange(monthOffset);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{moodHistoryContent.pixel.title}</Text>
          <Text style={styles.monthLabel}>{formatMonthLabel(start)}</Text>
        </View>
        <View style={styles.monthActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setSelectedDateKey(null);
              setMonthOffset((current) => current - 1);
            }}
            style={styles.monthButton}
          >
            <Text style={styles.monthButtonText}>‹</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={monthOffset === 0}
            onPress={() => {
              setSelectedDateKey(null);
              setMonthOffset((current) => Math.min(current + 1, 0));
            }}
            style={[styles.monthButton, monthOffset === 0 && styles.monthButtonDisabled]}
          >
            <Text style={styles.monthButtonText}>›</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.weekdayRow}>
        {weekdayLabels.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>{label}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {weeks.map((week, weekIndex) => (
          <View key={`week-${weekIndex}`} style={styles.weekRow}>
            {week.map((day, dayIndex) => {
              if (!day) {
                return <View key={`empty-${dayIndex}`} style={styles.dayCellEmptySpace} />;
              }

              const dateKey = getDateKey(day);
              const dayEntries = entriesByDate.get(dateKey) ?? [];
              const entry = dayEntries[0] ?? null;
              const isSelected = selectedDateKey === dateKey;
              const isTodayCell = isSameDay(day, new Date());

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${day.getDate()} ${entry ? buildMoodLevel(entry.who5_pct) : 'chưa có ghi chép'}`}
                  key={dateKey}
                  onPress={() => setSelectedDateKey(entry ? dateKey : null)}
                  style={[
                    styles.dayCell,
                    { backgroundColor: getPixelColor(entry?.who5_pct ?? null) },
                    entry && styles.dayCellActive,
                    isSelected && styles.dayCellSelected,
                    isTodayCell && styles.dayCellToday,
                  ]}
                >
                  <Text style={[styles.dayText, entry && styles.dayTextActive]}>
                    {day.getDate()}
                  </Text>
                  {isTodayCell && <View style={styles.todayDot} />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        <LegendItem color="#3D6B5E" label="Nặng" />
        <LegendItem color="#A8D0C5" label="Ổn" />
        <LegendItem color="#EAF2EF" label="Nhẹ" />
        <LegendItem color="#F3ECE1" label="Trống" />
      </View>

      {selectedEntry ? (
        <View style={styles.detailCard}>
          <Text style={styles.detailDate}>{formatDetailDate(selectedEntry.timestamp)}</Text>
          <View style={styles.detailFooter}>
            <Text style={styles.detailMood}>{buildMoodLevel(selectedEntry.who5_pct)}</Text>
            <Text style={styles.detailScore}>{selectedEntry.who5_pct}%</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.emptyHint}>Chạm vào một ô có màu để xem ngày đó.</Text>
      )}
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendSwatch, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function buildMonthDays(monthOffset: number) {
  const { end, start } = getMonthRange(monthOffset);
  const leadingEmptyCount = (start.getDay() + 6) % 7;
  const days: Array<Date | null> = Array.from({ length: leadingEmptyCount }, () => null);

  for (let day = 1; day <= end.getDate(); day += 1) {
    days.push(new Date(start.getFullYear(), start.getMonth(), day));
  }

  const trailingEmptyCount = (7 - (days.length % 7)) % 7;
  for (let index = 0; index < trailingEmptyCount; index += 1) {
    days.push(null);
  }

  return days;
}

function groupEntriesByDate(entries: MoodEntry[]) {
  const map = new Map<string, MoodEntry[]>();

  for (const entry of entries) {
    const key = getDateKey(new Date(entry.timestamp));
    const currentEntries = map.get(key) ?? [];
    currentEntries.push(entry);
    map.set(key, currentEntries);
  }

  return map;
}

function getPixelColor(who5Pct: number | null) {
  if (who5Pct === null) {
    return '#F3ECE1';
  }

  if (who5Pct >= 72) {
    return '#EAF2EF';
  }

  if (who5Pct >= 50) {
    return '#A8D0C5';
  }

  return '#3D6B5E';
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });
}

function formatDetailDate(timestamp: string) {
  return new Date(timestamp).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    weekday: 'long',
    year: 'numeric',
  });
}

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.md,
    padding: spacing.md,
  },
  dayCell: {
    alignItems: 'center',
    aspectRatio: 1,
    borderColor: colors.lineSoft,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'center',
    position: 'relative',
  },
  dayCellActive: {
    borderColor: colors.borderStrong,
  },
  dayCellEmptySpace: {
    aspectRatio: 1,
    flex: 1,
  },
  dayCellSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  dayCellToday: {
    borderColor: colors.accent,
    borderWidth: 1.5,
  },
  todayDot: {
    backgroundColor: colors.accent,
    borderRadius: 2,
    bottom: 4,
    height: 4,
    position: 'absolute',
    width: 4,
  },
  dayText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  dayTextActive: {
    color: colors.textPrimary,
    fontWeight: '900',
  },
  detailCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.sm,
  },
  detailDate: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
    textTransform: 'capitalize',
  },
  detailFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailMood: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  detailScore: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  emptyHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
  grid: {
    gap: spacing.xs,
  },
  weekRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xxs,
  },
  legendSwatch: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 12,
    width: 12,
  },
  legendText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 14,
  },
  monthActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  monthButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  monthButtonDisabled: {
    opacity: 0.35,
  },
  monthButtonText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 24,
  },
  monthLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    textTransform: 'capitalize',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  titleGroup: {
    gap: spacing.xxs,
  },
  weekdayLabel: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 13,
    textAlign: 'center',
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
});
