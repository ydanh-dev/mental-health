import { StyleSheet, Text, View } from 'react-native';

import { conceptContent } from '../data/check_in_content';
import { colors, radius, spacing } from '../styles/theme';

const layerAccents = [colors.violet, colors.teal, colors.clay] as const;

export function ConceptFlowPanel() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Luồng cảm xúc</Text>
        <Text style={styles.title}>{conceptContent.title}</Text>
        <Text style={styles.description}>{conceptContent.description}</Text>
      </View>

      <View style={styles.layerStack}>
        {conceptContent.productLayers.map((layer, index) => (
          <View key={layer.title} style={[styles.layerCard, { borderLeftColor: layerAccents[index] }]}>
            <View style={styles.layerHeader}>
              <Text style={styles.layerLabel}>{layer.label}</Text>
              <Text style={styles.layerTone}>{layer.tone}</Text>
            </View>
            <Text style={styles.layerTitle}>{layer.title}</Text>
            <View style={styles.itemRow}>
              {layer.items.map((item) => (
                <Text key={item} style={styles.itemPill}>{item}</Text>
              ))}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.signalGrid}>
        {conceptContent.signalLayers.map((signal) => (
          <View key={signal.title} style={styles.signalCard}>
            <Text style={styles.signalTitle}>{signal.title}</Text>
            <Text style={styles.signalDetail}>{signal.detail}</Text>
          </View>
        ))}
      </View>

      <View style={styles.inferenceCard}>
        <Text style={styles.inferenceLabel}>Suy luận tổng hợp</Text>
        <Text style={styles.inferenceText}>{conceptContent.inference}</Text>
        <Text style={styles.outputText}>{conceptContent.output}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
    width: '100%',
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  header: {
    gap: spacing.sm,
  },
  inferenceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  inferenceLabel: {
    color: colors.accentLight,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  inferenceText: {
    color: colors.onPrimary,
    fontSize: 15,
    lineHeight: 23,
  },
  itemPill: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  layerCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderLeftWidth: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  layerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  layerLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  layerStack: {
    gap: spacing.md,
  },
  layerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0,
  },
  layerTone: {
    color: colors.textMuted,
    flex: 1,
    fontSize: 14,
    lineHeight: 17,
    textAlign: 'right',
  },
  outputText: {
    color: colors.accentLight,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 21,
  },
  signalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    gap: spacing.xs,
    minWidth: 150,
    padding: spacing.md,
  },
  signalDetail: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  signalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  signalTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 31,
  },
});
