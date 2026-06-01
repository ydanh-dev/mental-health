import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  buildMoodLevel,
  buildWeekSummary,
  getEntriesForWeek,
  getWeekRange,
  moodHistoryContent,
} from '../data/mood_history_content';
import { colors, radius, spacing } from '../styles/theme';
import type { MoodEntry } from '../types/mood_history';
import { MoodHeatmap } from './mood_heatmap';
import { PixelMoodCalendar } from './pixel_mood_calendar';
import { ProgressDashboard } from './progress_dashboard';

type HistorySheetProps = {
  entries: MoodEntry[];
  isOpen: boolean;
  onClose: () => void;
};

type HistoryTab = 'month' | 'progress' | 'weeks';

function getMoodColorLight(pct: number) {
  if (pct >= 72) return '#EAF2EF';
  if (pct >= 50) return '#E0EFEA';
  return '#ECE6DD';
}

function getMoodColorDark(pct: number) {
  if (pct >= 72) return '#0E6B59';
  if (pct >= 50) return '#0E6B59';
  return '#736B60';
}

export function HistorySheet({ entries, isOpen, onClose }: HistorySheetProps) {
  const [activeTab, setActiveTab] = useState<HistoryTab>('weeks');
  const [visibleWeekCount, setVisibleWeekCount] = useState(4);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});
  const weekOffsets = useMemo(
    () => Array.from({ length: visibleWeekCount }, (_, index) => -index),
    [visibleWeekCount],
  );

  const slideAnim = useRef(new Animated.Value(getTabIndex(activeTab))).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: getTabIndex(activeTab),
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [activeTab]);

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={isOpen}
    >
      <View style={styles.sheet}>
        <View style={styles.header}>
          <Text style={styles.title}>{moodHistoryContent.history.title}</Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>{moodHistoryContent.history.close}</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          <Animated.View
            style={[
              styles.slidingIndicator,
              {
                left: slideAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: ['0.5%', '33.8%', '67.1%'],
                }),
              },
            ]}
          />
          <TabButton
            isSelected={activeTab === 'weeks'}
            label="Theo tuần"
            onPress={() => setActiveTab('weeks')}
          />
          <TabButton
            isSelected={activeTab === 'month'}
            label="Tháng"
            onPress={() => setActiveTab('month')}
          />
          <TabButton
            isSelected={activeTab === 'progress'}
            label="Xu hướng"
            onPress={() => setActiveTab('progress')}
          />
        </View>

        {activeTab === 'progress' ? (
          <View style={styles.contentPane}>
            <View style={styles.progressWrap}>
              <ProgressDashboard entries={entries} />
            </View>
          </View>
        ) : activeTab === 'month' ? (
          <View style={styles.contentPane}>
            <View style={styles.progressWrap}>
              <PixelMoodCalendar entries={entries} />
            </View>
          </View>
        ) : (
          <View style={styles.contentPane}>
            <FlatList
              contentContainerStyle={styles.weekList}
              data={weekOffsets}
              keyExtractor={(weekOffset) => String(weekOffset)}
              onEndReached={() => setVisibleWeekCount((current) => current + 4)}
              renderItem={({ item: weekOffset }) => {
                const expanded = Boolean(expandedWeeks[weekOffset]);
                const weekEntries = getEntriesForWeek(entries, weekOffset);
                const weekSummary = buildWeekSummary(entries, weekOffset);
                const hasEntries = weekEntries.length > 0;

                return (
                  <Pressable
                    accessibilityRole="button"
                    disabled={!hasEntries}
                    onPress={() =>
                      setExpandedWeeks((current) => ({
                        ...current,
                        [weekOffset]: !expanded,
                      }))
                    }
                    style={styles.weekRow}
                  >
                    <View style={styles.weekHeader}>
                      <View style={styles.weekTitleGroup}>
                        <Text style={styles.weekTitle}>{formatWeekTitle(weekOffset)}</Text>
                        <Text style={styles.weekRange}>{formatWeekRange(weekOffset)}</Text>
                      </View>
                      {hasEntries ? (
                        <Text style={styles.weekAction}>
                          {expanded ? 'Thu gọn' : 'Xem ngày'}
                        </Text>
                      ) : null}
                    </View>
                    <MoodHeatmap entries={entries} weekOffset={weekOffset} />
                    {weekSummary ? <Text style={styles.weekSummary}>{weekSummary}</Text> : null}
                    {expanded && <WeekDetails entries={weekEntries} />}
                  </Pressable>
                );
              }}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

function getTabIndex(tab: HistoryTab) {
  if (tab === 'weeks') {
    return 0;
  }

  if (tab === 'month') {
    return 1;
  }

  return 2;
}

function TabButton({
  isSelected,
  label,
  onPress,
}: {
  isSelected: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={styles.tabButton}
    >
      <Text style={[styles.tabText, isSelected && styles.tabTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function WeekDetails({ entries }: { entries: MoodEntry[] }) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={styles.details}>
      {entries.map((entry) => (
        <View key={entry.id} style={styles.detailRow}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailDate}>
              {formatEntryDate(entry.timestamp)}
              <Text style={styles.detailDivider}> • </Text>
              <Text style={styles.detailTime}>
                {formatEntryTime(entry.timestamp)}
              </Text>
            </Text>
            {isToday(entry.timestamp) ? <Text style={styles.todayPill}>Hôm nay</Text> : null}
          </View>
          <View style={styles.detailFooter}>
            <Text style={styles.detailMood}>{buildMoodLevel(entry.who5_pct)}</Text>
            <View style={[styles.moodBadge, { backgroundColor: getMoodColorLight(entry.who5_pct) }]}>
              <Text style={[styles.moodBadgeText, { color: getMoodColorDark(entry.who5_pct) }]}>
                {entry.who5_pct}%
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

function formatWeekTitle(weekOffset: number) {
  if (weekOffset === 0) {
    return 'Tuần này';
  }

  if (weekOffset === -1) {
    return 'Tuần trước';
  }

  if (weekOffset < -1) {
    return `${Math.abs(weekOffset)} tuần trước`;
  }

  return `${weekOffset} tuần tới`;
}

const WEEKDAYS_VI = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy',
];

function formatWeekRange(weekOffset: number) {
  const { end, start } = getWeekRange(weekOffset);

  return `${formatShortDate(start)} - ${formatShortDate(end)}`;
}

function formatEntryDate(timestamp: string) {
  const date = new Date(timestamp);
  const weekday = WEEKDAYS_VI[date.getDay()];
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

function isToday(timestamp: string) {
  const date = new Date(timestamp);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatShortDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1.5,
    height: 36,
    justifyContent: 'center',
    width: 36,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  closeText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 18,
  },
  contentPane: {
    backgroundColor: colors.background,
    flex: 1,
    overflow: 'hidden',
    paddingTop: spacing.xs,
  },
  detailDate: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 18,
  },
  detailDivider: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  detailTime: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  detailHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  detailMood: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  detailRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  detailFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xxs,
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
  detailText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  details: {
    borderTopColor: colors.lineSoft,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheet: {
    backgroundColor: colors.background,
    flex: 1,
    gap: spacing.md,
    padding: spacing.lg,
  },
  progressWrap: {
    flex: 1,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
  },
  slidingIndicator: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '32.4%',
    backgroundColor: colors.primary,
    borderRadius: 9,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 2,
    zIndex: 1,
  },
  tabs: {
    backgroundColor: '#EFE9DE',
    borderColor: colors.borderStrong,
    borderRadius: 12,
    borderWidth: 1.5,
    flexDirection: 'row',
    padding: 3,
    position: 'relative',
    height: 46,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginHorizontal: 4,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
  },
  tabTextSelected: {
    color: colors.onPrimary,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 28,
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
  weekList: {
    gap: spacing.md,
    paddingHorizontal: 4,
    paddingBottom: spacing.xxl,
  },
  weekAction: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },
  weekHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  weekRange: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  weekRow: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: spacing.sm,
    padding: spacing.md,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  weekSummary: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 17,
  },
  weekTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
  },
  weekTitleGroup: {
    flex: 1,
    gap: 2,
  },
});
