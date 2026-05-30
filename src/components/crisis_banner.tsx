import { DeviceEventEmitter, Pressable, StyleSheet, Text, View } from 'react-native';

import { screeningContent } from '../data/screening_content';
import { colors, radius, spacing } from '../styles/theme';

export function CrisisBanner() {
  const startChat = () => {
    DeviceEventEmitter.emit('open_ai_chat');
  };

  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>💬</Text>
      <Text style={styles.body}>{screeningContent.crisis.body}</Text>
      <Pressable accessibilityRole="button" onPress={startChat} style={styles.action}>
        <Text style={styles.actionText}>{screeningContent.crisis.action}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  action: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actionText: {
    color: colors.onPrimary,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
  },
  banner: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.clay,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  body: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
  },
  icon: {
    color: colors.clay,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
});
