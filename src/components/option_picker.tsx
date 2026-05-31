import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../styles/theme';
import { ScreeningScale } from '../types/screening';

type OptionPickerProps = {
  disabled?: boolean;
  onNext: () => void;
  onSelect: (value: string) => void;
  scale: ScreeningScale;
  selectedValue?: string;
};

export function OptionPicker({ disabled, onNext, onSelect, scale, selectedValue }: OptionPickerProps) {
  const canContinue = Boolean(selectedValue) && !disabled;

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
                  {selected && <Text style={styles.optionMarkText}>✓</Text>}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !canContinue }}
        disabled={!canContinue}
        onPress={onNext}
        style={({ pressed }) => [
          styles.nextButton,
          canContinue && styles.nextButtonReady,
          !canContinue && styles.nextButtonDisabled,
          pressed && canContinue && styles.nextButtonPressed,
        ]}
      >
        <Text style={[styles.nextButtonText, canContinue && styles.nextButtonTextReady]}>
          Tiếp theo
        </Text>
      </Pressable>
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
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  optionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    shadowColor: colors.clay,
    shadowOffset: { height: 1, width: 1 },
    shadowOpacity: 0.18,
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
    backgroundColor: colors.onPrimary,
    borderColor: colors.onPrimary,
  },
  optionIndexText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
  optionIndexTextSelected: {
    color: colors.accent,
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
  optionMarkSelected: {
    backgroundColor: colors.onPrimary,
    borderColor: colors.onPrimary,
  },
  optionMarkText: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: '900',
    lineHeight: 12,
  },
  optionText: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  optionTextSelected: {
    color: colors.onPrimary,
    fontWeight: '900',
  },
  optionWrap: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  nextButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  nextButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
    opacity: 0.72,
  },
  nextButtonPressed: {
    opacity: 0.9,
    transform: [{ translateY: 1 }],
  },
  nextButtonReady: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  nextButtonText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  nextButtonTextReady: {
    color: colors.onPrimary,
  },
});
