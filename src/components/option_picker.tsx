import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../styles/theme';
import { ScreeningScale } from '../types/screening';

type OptionPickerProps = {
  disabled?: boolean;
  onSelect: (value: string) => void;
  scale: ScreeningScale;
  selectedValue?: string;
};

export function OptionPicker({ disabled, onSelect, scale, selectedValue }: OptionPickerProps) {
  return (
    <View style={styles.optionWrap}>
      <Text style={styles.helperText}>Cái nào gần nhất với lúc này?</Text>
      <View style={styles.optionColumn}>
        {scale.options.map((option, index) => {
          const selected = selectedValue === option.value;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled, selected }}
              disabled={disabled}
              key={option.value}
              onPress={() => onSelect(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                pressed && !disabled && styles.optionPressed,
                disabled && !selected && styles.optionDisabled,
              ]}
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionIndex, selected && styles.optionIndexSelected]}>
                  <Text style={[styles.optionIndexText, selected && styles.optionIndexTextSelected]}>
                    {index + 1}
                  </Text>
                </View>
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
                <View style={[styles.optionMark, selected && styles.optionMarkSelected]}>
                  {selected && <View style={styles.optionMarkDot} />}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  helperText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
    paddingHorizontal: spacing.xs,
  },
  option: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  optionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderStrong,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 2, width: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  optionDisabled: {
    opacity: 0.58,
  },
  optionPressed: {
    opacity: 0.85,
    transform: [{ translateY: 1 }],
  },
  optionColumn: {
    gap: spacing.xs,
  },
  optionContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 28,
  },
  optionIndex: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: 6,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  optionIndexSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.borderStrong,
  },
  optionIndexText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
  optionIndexTextSelected: {
    color: colors.onPrimary,
  },
  optionMark: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 7,
    borderWidth: 1.5,
    height: 14,
    justifyContent: 'center',
    width: 14,
  },
  optionMarkDot: {
    backgroundColor: colors.accent,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  optionMarkSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
  },
  optionText: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  optionTextSelected: {
    color: colors.textPrimary,
    fontWeight: '900',
  },
  optionWrap: {
    gap: spacing.xs,
    marginTop: spacing.md,
  },
});
