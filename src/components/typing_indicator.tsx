import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../styles/theme';

export function TypingIndicator() {
  return (
    <View accessibilityLabel="AI đang gõ" style={styles.row}>
      <View style={styles.dot} />
      <View style={styles.dot} />
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    backgroundColor: colors.textMuted,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
  },
});
