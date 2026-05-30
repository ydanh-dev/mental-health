import { useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { AIChatFab } from '../components/ai_chat_fab';
import { FadeInDownView } from '../components/fade_in_down_view';
import { ScreeningScreen } from '../components/screening_screen';
import { useAuth } from '../hooks/use_auth';
import type { ScoreResult } from '../hooks/use_scoring';
import { colors, spacing } from '../styles/theme';

export function HomeScreen() {
  const { signOut, user } = useAuth();
  const [scores, setScores] = useState<ScoreResult | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRule} />
      <View style={styles.sideRule} />
      <View style={styles.accentBlock} />
      <Pressable accessibilityRole="button" onPress={signOut} style={styles.signOutButton}>
        <Text numberOfLines={1} style={styles.signOutText}>
          {user?.email ? 'Đăng xuất' : 'Thoát'}
        </Text>
      </Pressable>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FadeInDownView style={styles.panelWrap}>
          <ScreeningScreen onComplete={setScores} />
        </FadeInDownView>
      </ScrollView>
      <AIChatFab scores={scores} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  accentBlock: {
    backgroundColor: colors.accent,
    height: 72,
    left: 24,
    position: 'absolute',
    top: 24,
    width: 12,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.lg,
  },
  panelWrap: {
    alignSelf: 'center',
    maxWidth: 560,
    width: '100%',
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 6, width: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    borderRadius: 8,
    backgroundColor: colors.surfaceMuted,
  },
  sideRule: {
    backgroundColor: colors.lineSoft,
    bottom: 0,
    left: 58,
    position: 'absolute',
    top: 0,
    width: 1,
  },
  signOutButton: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 104,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    zIndex: 2,
  },
  signOutText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
  },
  topRule: {
    backgroundColor: colors.lineSoft,
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 120,
  },
});
