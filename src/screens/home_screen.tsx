import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';

import { AIChatFab } from '../components/ai_chat_fab';
import { CrisisSafetyBanner } from '../components/crisis_safety_banner';
import { FadeInDownView } from '../components/fade_in_down_view';
import { HistorySheet } from '../components/history_sheet';
import { InsightCard } from '../components/insight_card';
import { OnboardingScreen } from '../components/onboarding_screen';
import { ScreeningScreen } from '../components/screening_screen';
import { useAuth } from '../hooks/use_auth';
import { useMoodHistory } from '../hooks/use_mood_history';
import { useOnboardingProfile } from '../hooks/use_onboarding_profile';
import type { ScoreResult } from '../hooks/use_scoring';
import { moodHistoryContent } from '../data/mood_history_content';
import { colors, spacing } from '../styles/theme';

function getStringMetadataValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function HomeScreen() {
  const { signOut, user } = useAuth();
  const { addEntry, clearAll, entries } = useMoodHistory();
  const {
    complete: completeOnboarding,
    isLoaded: isOnboardingLoaded,
    profile: onboardingProfile,
    skip: skipOnboarding,
  } = useOnboardingProfile(user?.id);
  const [scores, setScores] = useState<ScoreResult | null>(null);
  const [isHistorySheetOpen, setIsHistorySheetOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [screeningResetKey, setScreeningResetKey] = useState(0);

  const displayName = useMemo(() => {
    if (!user) return '';

    const metadata = user.user_metadata ?? {};
    const fullName =
      getStringMetadataValue(metadata.full_name) ||
      getStringMetadataValue(metadata.name);
    if (fullName) return fullName;

    const givenName = getStringMetadataValue(metadata.given_name);
    if (givenName) return givenName;

    return '';
  }, [user]);

  const displayInitial = useMemo(() => {
    const firstChar = displayName.trim().charAt(0);
    return firstChar ? firstChar.toUpperCase() : 'S';
  }, [displayName]);

  const hasDisplayName = Boolean(displayName);

  const closeProfileAndSignOut = () => {
    setIsProfileOpen(false);
    signOut();
  };
  const handleScreeningComplete = (nextScores: ScoreResult | null) => {
    setScores(nextScores);

    if (nextScores) {
      addEntry(nextScores).catch(() => undefined);
    }
  };
  const confirmClearHistory = () => {
    Alert.alert(
      moodHistoryContent.clear.title,
      moodHistoryContent.clear.message,
      [
        { style: 'cancel', text: moodHistoryContent.clear.cancel },
        {
          onPress: () => {
            clearAll().catch(() => undefined);
            setScores(null);
            setIsHistorySheetOpen(false);
            setIsProfileOpen(false);
            setScreeningResetKey((current) => current + 1);
          },
          style: 'destructive',
          text: moodHistoryContent.clear.confirm,
        },
      ],
    );
  };

  if (!isOnboardingLoaded) {
    return null;
  }

  if (!onboardingProfile) {
    return (
      <OnboardingScreen
        onComplete={(nextProfile) => {
          completeOnboarding(nextProfile).catch(() => undefined);
        }}
        onSkip={() => {
          skipOnboarding().catch(() => undefined);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRule} />
      <View style={styles.sideRule} />
      <View style={styles.accentBlock} />

      {isProfileOpen && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng tài khoản"
          onPress={() => setIsProfileOpen(false)}
          style={styles.profileBackdrop}
        />
      )}

      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mở tài khoản"
          onPress={() => setIsProfileOpen((current) => !current)}
          style={({ pressed }) => [
            styles.identityPill,
            pressed && styles.identityPillPressed,
          ]}
        >
          <View style={styles.avatarBadge}>
            <Text style={styles.avatarText}>{displayInitial}</Text>
          </View>
          <View style={styles.identityCopy}>
            {hasDisplayName ? (
              <>
                <Text style={styles.greetingLabel}>Xin chào</Text>
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.greetingName}>
                  {displayName}
                </Text>
              </>
            ) : (
              <Text style={styles.greetingName}>Xin chào</Text>
            )}
          </View>
        </Pressable>
      </View>

      {isProfileOpen && (
        <View style={styles.profileMenu}>
          <View style={styles.profileMenuHeader}>
            <View style={styles.profileMenuAvatar}>
              <Text style={styles.profileMenuAvatarText}>{displayInitial}</Text>
            </View>
            <View style={styles.profileMenuCopy}>
              <Text style={styles.profileMenuLabel}>Tài khoản</Text>
              {hasDisplayName ? (
                <Text numberOfLines={1} ellipsizeMode="tail" style={styles.profileMenuName}>
                  {displayName}
                </Text>
              ) : (
                <Text style={styles.profileMenuName}>Ẩn danh</Text>
              )}
              {user?.email && (
                <Text numberOfLines={1} ellipsizeMode="middle" style={styles.profileMenuEmail}>
                  {user.email}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.profileMenuDivider} />
          <Pressable
            accessibilityRole="button"
            onPress={confirmClearHistory}
            style={({ pressed }) => [
              styles.profileMenuAction,
              pressed && styles.profileMenuActionPressed,
            ]}
          >
            <Text style={styles.profileMenuActionText}>Xoá toàn bộ lịch sử</Text>
            <Text style={styles.profileMenuActionArrow}>×</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={closeProfileAndSignOut}
            style={({ pressed }) => [
              styles.profileMenuAction,
              pressed && styles.profileMenuActionPressed,
            ]}
          >
            <Text style={styles.profileMenuActionText}>Rời khỏi thiết bị này</Text>
            <Text style={styles.profileMenuActionArrow}>→</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <FadeInDownView style={styles.panelWrap}>
          <ScreeningScreen key={screeningResetKey} onComplete={handleScreeningComplete} />
        </FadeInDownView>
        <CrisisSafetyBanner isVisible={scores?.isCrisis === true} />
        {entries.length >= 1 && (
          <View style={styles.insightWrap}>
            <InsightCard
              entries={entries}
              onViewMore={() => setIsHistorySheetOpen(true)}
            />
          </View>
        )}
      </ScrollView>
      <HistorySheet
        entries={entries}
        isOpen={isHistorySheetOpen}
        onClose={() => setIsHistorySheetOpen(false)}
      />
      {scores ? <AIChatFab onboardingProfile={onboardingProfile} scores={scores} /> : null}
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
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xxl,
    paddingTop: Platform.OS === 'ios' ? 74 : 58,
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
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    height: 52,
    justifyContent: 'space-between',
    left: 48,
    position: 'absolute',
    right: spacing.md,
    top: Platform.OS === 'ios' ? 60 : 36,
    zIndex: 4,
  },
  avatarBadge: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1.5,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  avatarText: {
    color: colors.onPrimary,
    fontFamily: Platform.select({ android: 'sans-serif-medium', ios: 'Helvetica Neue', default: 'sans-serif' }),
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  greetingLabel: {
    color: colors.textMuted,
    fontFamily: Platform.select({ android: 'sans-serif-medium', ios: 'Helvetica Neue', default: 'sans-serif' }),
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
    lineHeight: 12,
    textTransform: 'uppercase',
  },
  greetingName: {
    color: colors.textPrimary,
    fontFamily: Platform.select({ android: 'sans-serif-medium', ios: 'Helvetica Neue', default: 'sans-serif' }),
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 19,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
  },
  identityPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 46,
    maxWidth: 280,
    minWidth: 0,
    paddingHorizontal: spacing.sm,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 3, width: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  identityPillPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    shadowOffset: { height: 2, width: 2 },
  },
  insightWrap: {
    alignSelf: 'center',
    maxWidth: 560,
    paddingTop: spacing.md,
    width: '100%',
  },
  profileMenu: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1.5,
    gap: spacing.sm,
    left: 48,
    maxWidth: 280,
    minWidth: 252,
    padding: spacing.md,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 114 : 90,
    zIndex: 5,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 4, width: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  profileBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 3,
  },
  profileMenuAction: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  profileMenuActionPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },
  profileMenuActionArrow: {
    color: colors.accent,
    fontFamily: Platform.select({ android: 'sans-serif-medium', ios: 'Helvetica Neue', default: 'sans-serif' }),
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  profileMenuActionText: {
    color: colors.textPrimary,
    fontFamily: Platform.select({ android: 'sans-serif-medium', ios: 'Helvetica Neue', default: 'sans-serif' }),
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
  },
  profileMenuAvatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1.5,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  profileMenuAvatarText: {
    color: colors.accent,
    fontFamily: Platform.select({ android: 'sans-serif-medium', ios: 'Helvetica Neue', default: 'sans-serif' }),
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 18,
  },
  profileMenuCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileMenuDivider: {
    backgroundColor: colors.border,
    height: 1,
    width: '100%',
  },
  profileMenuEmail: {
    color: colors.textMuted,
    fontFamily: Platform.select({ android: 'sans-serif-medium', ios: 'Helvetica Neue', default: 'sans-serif' }),
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  profileMenuHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  profileMenuLabel: {
    color: colors.textMuted,
    fontFamily: Platform.select({ android: 'sans-serif-medium', ios: 'Helvetica Neue', default: 'sans-serif' }),
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
    lineHeight: 12,
    textTransform: 'uppercase',
  },
  profileMenuName: {
    color: colors.textPrimary,
    fontFamily: Platform.select({ android: 'sans-serif-medium', ios: 'Helvetica Neue', default: 'sans-serif' }),
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
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
