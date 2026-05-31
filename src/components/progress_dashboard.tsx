import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  buildMoodLevel,
  buildWeeklyProgress,
  buildWeeklyTrendText,
  getEntriesForWeek,
  moodHistoryContent,
} from '../data/mood_history_content';
import { colors, radius, spacing } from '../styles/theme';
import type { MoodEntry } from '../types/mood_history';

type ProgressDashboardProps = {
  entries: MoodEntry[];
};

const chartHeight = 120;
const WEEKDAYS_FULL = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

function getBarColor(pct: number | null, isSelected: boolean) {
  if (pct === null) return isSelected ? colors.borderStrong : colors.lineSoft;
  if (pct >= 72) return colors.teal;
  if (pct >= 50) return colors.accent;
  return colors.clay;
}

function getMoodColorLight(pct: number) {
  if (pct >= 72) return '#EAF2EF';
  if (pct >= 50) return '#E0EFEA';
  return '#ECE6DD';
}

function getMoodColorDark(pct: number) {
  if (pct >= 72) return colors.teal;
  if (pct >= 50) return colors.teal;
  return colors.textMuted;
}

function isToday(timestamp: string) {
  const date = new Date(timestamp);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatEntryDate(timestamp: string) {
  const date = new Date(timestamp);
  const weekday = WEEKDAYS_FULL[date.getDay()];
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${weekday}, ${day}/${month}`;
}

function formatEntryTime(timestamp: string) {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function ProgressDashboard({ entries }: ProgressDashboardProps) {
  const progress = buildWeeklyProgress(entries);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState<number>(0);
  const selectedWeek = progress.find((w) => w.weekOffset === selectedWeekOffset) ?? progress[progress.length - 1];
  const weekEntries = getEntriesForWeek(entries, selectedWeekOffset);
  const bestEntry = weekEntries.length > 0
    ? [...weekEntries].sort((a, b) => b.who5_pct - a.who5_pct)[0]
    : null;
  const worstEntry = weekEntries.length > 0
    ? [...weekEntries].sort((a, b) => a.who5_pct - b.who5_pct)[0]
    : null;

  const bestDayText = bestEntry
    ? `${WEEKDAYS_FULL[new Date(bestEntry.timestamp).getDay()]} (${bestEntry.who5_pct}%)`
    : '—';
  const worstDayText = worstEntry
    ? `${WEEKDAYS_FULL[new Date(worstEntry.timestamp).getDay()]} (${worstEntry.who5_pct}%)`
    : '—';

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <Text style={styles.insightCategory}>Xu hướng cảm xúc chung</Text>
          <View style={styles.statusDot} />
        </View>
        <Text style={styles.insightText}>{buildWeeklyTrendText(entries)}</Text>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>{moodHistoryContent.progress.title}</Text>
          <Text style={styles.chartSubtitle}>Chạm từng cột để xem dữ liệu</Text>
        </View>
        
        <View style={styles.chartWrapper}>
          <View style={styles.gridLinesContainer}>
            <View style={[styles.gridLine, { bottom: '100%' }]} />
            <View style={[styles.gridLine, { bottom: '75%' }]} />
            <View style={[styles.gridLine, { bottom: '50%' }]} />
            <View style={[styles.gridLine, { bottom: '25%' }]} />
            <View style={[styles.gridLine, { bottom: '0%' }]} />
          </View>

          <View style={styles.chart}>
            {progress.map((week) => {
              const isSelected = week.weekOffset === selectedWeekOffset;
              const fillHeight = week.average !== null
                ? Math.max(12, Math.round((week.average / 100) * chartHeight))
                : 6;
              const barColor = getBarColor(week.average, isSelected);

              return (
                <Pressable
                  key={week.weekOffset}
                  onPress={() => setSelectedWeekOffset(week.weekOffset)}
                  style={styles.barInteractiveArea}
                >
                  <Text 
                    style={[
                      styles.barValue, 
                      week.average === null && styles.barValueEmpty,
                      isSelected && styles.barValueSelected
                    ]}
                  >
                    {week.average !== null ? `${week.average}%` : '—'}
                  </Text>
                  
                  <View 
                    style={[
                      styles.barTrack,
                      isSelected && styles.barTrackSelected,
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        { 
                          height: fillHeight,
                          backgroundColor: barColor,
                          opacity: isSelected ? 1 : 0.8
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isSelected && styles.barLabelSelected]}>
                    {week.label}
                  </Text>
                  <Text numberOfLines={1} style={styles.barRange}>{week.range}</Text>
                  
                  {isSelected && <View style={styles.activeDot} />}
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Chi tiết: {selectedWeek.label} ({selectedWeek.range})
        </Text>
      </View>

      {weekEntries.length === 0 ? (
        <View style={styles.emptyDetailCard}>
          <Text style={styles.emptyDetailText}>
            Tuần này chưa ghi nhận ngày nào.
          </Text>
        </View>
      ) : (
        <View style={styles.detailsGroup}>
          <View style={styles.bentoGrid}>
            <View style={styles.bentoCard}>
              <Text style={styles.bentoLabel}>Điểm trung bình</Text>
              <Text style={styles.bentoValue}>
                {selectedWeek.average !== null ? `${selectedWeek.average}%` : '—'}
              </Text>
              <Text style={styles.bentoSubtext}>
                {selectedWeek.average !== null ? buildMoodLevel(selectedWeek.average) : '—'}
              </Text>
            </View>

            <View style={styles.bentoCard}>
              <Text style={styles.bentoLabel}>Số lần check-in</Text>
              <Text style={styles.bentoValue}>
                {selectedWeek.count} lần
              </Text>
              <Text style={styles.bentoSubtext}>
                Lắng nghe tinh thần
              </Text>
            </View>
          </View>

          <View style={styles.peaksCard}>
            <View style={styles.peakRow}>
              <View style={styles.peakBadgeGreen}>
                <Text style={styles.peakBadgeText}>TỐT NHẤT</Text>
              </View>
              <Text style={styles.peakValue}>{bestDayText}</Text>
            </View>
            <View style={styles.peakDivider} />
            <View style={styles.peakRow}>
              <View style={styles.peakBadgeAmber}>
                <Text style={styles.peakBadgeText}>NẶNG NHẤT</Text>
              </View>
              <Text style={styles.peakValue}>{worstDayText}</Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nhật ký chi tiết trong tuần</Text>
          </View>
          
          <View style={styles.entriesList}>
            {weekEntries.map((entry) => (
              <View key={entry.id} style={styles.entryRow}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryDate}>
                    {formatEntryDate(entry.timestamp)}
                    <Text style={styles.entryDivider}> • </Text>
                    <Text style={styles.entryTime}>
                      {formatEntryTime(entry.timestamp)}
                    </Text>
                  </Text>
                  {isToday(entry.timestamp) ? <Text style={styles.todayPill}>Hôm nay</Text> : null}
                </View>
                <View style={styles.entryFooter}>
                  <Text style={styles.entryMood}>{buildMoodLevel(entry.who5_pct)}</Text>
                  <View style={[styles.moodBadge, { backgroundColor: getMoodColorLight(entry.who5_pct) }]}>
                    <Text style={[styles.moodBadgeText, { color: getMoodColorDark(entry.who5_pct) }]}>
                      {entry.who5_pct}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'visible',
  },
  scrollContent: {
    gap: spacing.md,
    paddingHorizontal: 4, // Align pixel-perfectly with the tabbar edges!
    paddingBottom: spacing.xxl * 1.5,
  },
  insightCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: spacing.md,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  insightCategory: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
  },
  statusDot: {
    backgroundColor: colors.teal,
    borderRadius: 999,
    height: 6,
    width: 6,
  },
  insightText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  chartCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  chartHeader: {
    flexDirection: 'column',
    gap: 2,
    marginBottom: spacing.xs,
  },
  chartTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
  },
  chartSubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  chartWrapper: {
    height: chartHeight + 48,
    justifyContent: 'flex-end',
    position: 'relative',
    width: '100%',
  },
  gridLinesContainer: {
    bottom: 38,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 20,
  },
  gridLine: {
    borderBottomColor: colors.lineSoft,
    borderBottomWidth: 1,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: spacing.xs,
    zIndex: 1,
  },
  barInteractiveArea: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
    position: 'relative',
    paddingBottom: 8,
  },
  barValue: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
  barValueSelected: {
    color: colors.accent,
    fontWeight: '900',
  },
  barValueEmpty: {
    color: colors.textMuted,
  },
  barTrack: {
    backgroundColor: colors.surfaceMuted,
    borderColor: 'transparent',
    borderRadius: 999,
    borderWidth: 1.5,
    height: chartHeight,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 16,
  },
  barTrackSelected: {
    borderColor: colors.accent,
    borderWidth: 1.5,
    backgroundColor: colors.primarySoft,
  },
  barFill: {
    borderRadius: 999,
    width: '100%',
  },
  barLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
    marginTop: 2,
  },
  barLabelSelected: {
    color: colors.textPrimary,
    fontWeight: '900',
  },
  barRange: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
  activeDot: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    bottom: 0,
    height: 4,
    position: 'absolute',
    width: 4,
  },
  sectionHeader: {
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
  },
  detailsGroup: {
    gap: spacing.md,
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  bentoCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    borderWidth: 1.5,
    flex: 1,
    padding: spacing.md,
    gap: 2,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  bentoLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  bentoValue: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 26,
  },
  bentoSubtext: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  peaksCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  peakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  peakBadgeGreen: {
    backgroundColor: '#EAF2EF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  peakBadgeAmber: {
    backgroundColor: '#FAF0EB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  peakBadgeText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontWeight: '800',
    lineHeight: 14,
  },
  peakValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  peakDivider: {
    backgroundColor: colors.lineSoft,
    height: 1,
    width: '100%',
  },
  emptyDetailCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  emptyDetailText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 19,
  },
  entriesList: {
    gap: spacing.sm,
  },
  entryRow: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  entryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  entryDate: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  entryDivider: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  entryTime: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  todayPill: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.sm,
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 15,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xxs,
  },
  entryMood: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  moodBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moodBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
});
