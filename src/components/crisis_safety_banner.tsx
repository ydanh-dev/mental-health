import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../styles/theme';

type CrisisSafetyBannerProps = {
  isVisible: boolean;
};

export function CrisisSafetyBanner({ isVisible }: CrisisSafetyBannerProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <View style={styles.copy}>
        <Text style={styles.title}>Có vẻ lúc này rất nặng.</Text>
        <Text style={styles.body}>
          Nếu bạn có thể gặp nguy hiểm ngay lúc này, hãy gọi 115 hoặc nhờ một người gần bạn ở lại cùng. Nếu bạn đang ở Mỹ, gọi hoặc nhắn 988.
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => Linking.openURL('tel:115').catch(() => undefined)}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.actionPressed]}
        >
          <Text style={styles.primaryActionText}>Gọi 115</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => Linking.openURL('tel:988').catch(() => undefined)}
          style={({ pressed }) => [styles.secondaryAction, pressed && styles.actionPressed]}
        >
          <Text style={styles.secondaryActionText}>988</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionPressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  banner: {
    backgroundColor: '#FFF4EA',
    borderColor: colors.accent,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.md,
    padding: spacing.md,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  copy: {
    gap: spacing.xs,
  },
  primaryAction: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  primaryActionText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
  },
  secondaryAction: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 42,
    minWidth: 76,
    paddingHorizontal: spacing.md,
  },
  secondaryActionText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
});
