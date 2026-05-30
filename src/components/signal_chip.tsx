import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius } from '../styles/theme';

type SignalChipProps = {
  label: string;
  onPress: () => void;
  selected: boolean;
};

export function SignalChip({ label, onPress, selected }: SignalChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        selected && styles.containerSelected,
        pressed && styles.containerPressed,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  containerPressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },
  containerSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0,
  },
  labelSelected: {
    color: colors.onPrimary,
  },
});
