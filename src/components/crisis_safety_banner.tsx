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
        <Text style={styles.title}>Đừng ở một mình với cảm giác này.</Text>
        <Text style={styles.body}>
          Nếu bạn đang nghĩ đến việc kết thúc mọi thứ hoặc khó giữ mình ổn, hãy gọi một nơi có người thật lắng nghe ngay lúc này.
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => Linking.openURL('tel:0963061414').catch(() => undefined)}
          style={({ pressed }) => [styles.primaryAction, pressed && styles.actionPressed]}
        >
          <Text style={styles.primaryActionText}>Gọi Ngày Mai</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => Linking.openURL('tel:111').catch(() => undefined)}
          style={({ pressed }) => [styles.secondaryAction, pressed && styles.actionPressed]}
        >
          <Text style={styles.secondaryActionText}>Gọi 111</Text>
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
