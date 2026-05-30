import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreeningScale } from '../types/screening';
import { colors, spacing } from '../styles/theme';

type OptionPickerProps = {
  disabled?: boolean;
  onSelect: (value: string) => void;
  scale: ScreeningScale;
  selectedValue?: string;
};

export function OptionPicker({ disabled, onSelect, scale, selectedValue }: OptionPickerProps) {
  return (
    <View style={styles.optionColumn}>
      {scale.options.map((option) => {
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
              <View style={[
                styles.bulletCircle,
                selected && styles.bulletCircleSelected,
              ]}>
                {selected && <View style={styles.bulletDotInner} />}
              </View>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    backgroundColor: colors.surface,
    borderColor: '#DCD4C7',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    width: '100%',
  },
  optionSelected: {
    backgroundColor: '#EFE7DA',
    borderColor: '#A89E8F',
  },
  optionDisabled: {
    opacity: 0.58,
  },
  optionPressed: {
    opacity: 0.85,
    transform: [{ translateY: 1 }],
  },
  optionColumn: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bulletCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#C2B8A8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  bulletCircleSelected: {
    borderColor: '#8C7E6A',
  },
  bulletDotInner: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#8C7E6A',
  },
  optionText: {
    color: '#3A352E',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
    flex: 1,
  },
  optionTextSelected: {
    color: '#28231C',
    fontWeight: '800',
  },
});
