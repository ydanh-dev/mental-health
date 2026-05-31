import { Pressable, StyleSheet, Text, View } from 'react-native';

import { buildMoodInsight, moodHistoryContent } from '../data/mood_history_content';
import { colors, radius, spacing } from '../styles/theme';
import type { MoodEntry } from '../types/mood_history';
import { FadeInDownView } from './fade_in_down_view';
import { MoodHeatmap } from './mood_heatmap';

type InsightCardProps = {
  entries: MoodEntry[];
  onViewMore: () => void;
};

export function InsightCard({ entries, onViewMore }: InsightCardProps) {
  if (entries.length < 1) {
    return null;
  }

  return (
    <FadeInDownView distance={8} duration={280}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{moodHistoryContent.insight.title}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onViewMore}
            style={({ pressed }) => [
              styles.action,
              pressed && styles.actionPressed,
            ]}
          >
            <Text style={styles.actionText}>{moodHistoryContent.insight.action}</Text>
          </Pressable>
        </View>
        <MoodHeatmap entries={entries} />
        <Text style={styles.insightText}>{buildMoodInsight(entries)}</Text>
      </View>
    </FadeInDownView>
  );
}

const styles = StyleSheet.create({
  action: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  actionPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    shadowOffset: { width: 1, height: 1 },
    elevation: 1,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.md,
    padding: spacing.md,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    marginBottom: spacing.xs,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
  },
});
