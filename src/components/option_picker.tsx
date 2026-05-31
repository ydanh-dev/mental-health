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
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  optionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.borderStrong,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  optionDisabled: {
    opacity: 0.58,
  },
  optionPressed: {
    opacity: 0.85,
    transform: [{ translateX: 1 }, { translateY: 1 }],
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
    borderRadius: 8,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  nextButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
    opacity: 0.72,
  },
  nextButtonPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
  nextButtonReady: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1.5,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  nextButtonText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  nextButtonTextReady: {
    color: colors.textPrimary,
  },
});
