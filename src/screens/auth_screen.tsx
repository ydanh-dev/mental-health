import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { useAuth } from '../hooks/use_auth';
import { colors, radius, spacing } from '../styles/theme';

export function AuthScreen() {
  const {
    error,
    isConfigured,
    isLoading,
    signInWithApple,
    signInWithGoogle,
  } = useAuth();
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    AppleAuthentication.isAvailableAsync()
      .then(setIsAppleAvailable)
      .catch(() => setIsAppleAvailable(false));
  }, []);

  return (
    <View style={styles.container}>
      {/* Background organic circular shapes matching the screenshot */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />
      <View style={styles.circleBottomRight} />

      <View style={styles.content}>
        {/* Center Green Rounded Logo Card */}
        <View style={styles.logoCard}>
          {/* Concentric vector arches representing the rainbow/wellness sun */}
          <View style={styles.logoArchOuter} />
          <View style={styles.logoArchMiddle} />
          <View style={styles.logoArchInner} />
          <View style={styles.logoDot} />
        </View>

        {/* Serif Headings & Soft Copys */}
        <View style={styles.headingContainer}>
          <Text style={styles.titleSerif}>Không gian</Text>
          <Text style={styles.titleSerifItalic}>của riêng bạn.</Text>
          <Text style={styles.description}>
            Chỉ bạn mới thấy những gì{"\n"}bạn chia sẻ ở đây.
          </Text>
        </View>

        {/* Subtle center line separator */}
        <View style={styles.divider} />

        {/* Elegant Frosted Action Buttons */}
        <View style={styles.actions}>
          {!isConfigured && (
            <View style={styles.configBox}>
              <Text style={styles.configTitle}>Chưa cấu hình Supabase</Text>
              <Text style={styles.configText}>
                Thêm `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_ANON_KEY` vào `.env` để tiếp tục.
              </Text>
            </View>
          )}

          {isAppleAvailable && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tiếp tục với Apple"
              disabled={!isConfigured || isLoading}
              onPress={signInWithApple}
              style={({ pressed }) => [
                styles.oauthButton,
                pressed && styles.oauthButtonPressed,
                (!isConfigured || isLoading) && styles.disabledButton,
              ]}
            >
              <View style={styles.oauthInner}>
                <View style={styles.appleLogoBox}>
                  <Text style={styles.appleLogoIcon}></Text>
                </View>
                <Text style={styles.oauthText}>Tiếp tục với Apple</Text>
              </View>
            </Pressable>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tiếp tục với Google"
            disabled={!isConfigured || isLoading}
            onPress={signInWithGoogle}
            style={({ pressed }) => [
              styles.oauthButton,
              pressed && styles.oauthButtonPressed,
              (!isConfigured || isLoading) && styles.disabledButton,
            ]}
          >
            <View style={styles.oauthInner}>
              <GoogleLogo />
              <Text style={styles.oauthText}>
                {isLoading ? 'Đang xử lý...' : 'Tiếp tục với Google'}
              </Text>
            </View>
          </Pressable>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}

function GoogleLogo() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background, // Elegant sand-beige color (#F7F2E8)
  },
  // Background organic circles matching Vela's screen
  circleTopRight: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    top: -100,
    right: -80,
    backgroundColor: '#ECE6DD', // Slightly darker warm cream for subtle elevation contrast
    opacity: 0.95,
  },
  circleBottomLeft: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    bottom: -100,
    left: -120,
    backgroundColor: '#ECE6DD',
    opacity: 0.7,
  },
  circleBottomRight: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    bottom: 140,
    right: -60,
    backgroundColor: '#ECE6DD',
    opacity: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    zIndex: 1,
  },
  // Center Green Rounded Logo Card
  logoCard: {
    width: 92,
    height: 92,
    borderRadius: 24,
    backgroundColor: '#345B4B', // Forest green color from image
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    // Elegant soft drop shadow
    shadowColor: 'rgba(52, 91, 75, 0.12)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  // Pure Concentric Vector Arches matching Vela logo
  logoArchOuter: {
    width: 44,
    height: 22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1.8,
    borderBottomWidth: 0,
    borderColor: '#FAF7F2',
    position: 'absolute',
    bottom: 24,
  },
  logoArchMiddle: {
    width: 30,
    height: 15,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    borderWidth: 1.8,
    borderBottomWidth: 0,
    borderColor: '#FAF7F2',
    position: 'absolute',
    bottom: 24,
  },
  logoArchInner: {
    width: 16,
    height: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.8,
    borderBottomWidth: 0,
    borderColor: '#FAF7F2',
    position: 'absolute',
    bottom: 24,
  },
  logoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FAF7F2',
    position: 'absolute',
    bottom: 48,
  },
  // Headings
  headingContainer: {
    alignItems: 'center',
    marginTop: 44,
    width: '100%',
  },
  titleSerif: {
    color: '#1D1B18',
    fontSize: 33,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
  },
  titleSerifItalic: {
    color: '#345B4B', // Elegant forest green
    fontSize: 33,
    fontWeight: '900',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    textAlign: 'center',
    marginTop: 2,
  },
  description: {
    color: '#736B60',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
  divider: {
    width: 48,
    height: 1.2,
    backgroundColor: '#D8D0C2',
    marginVertical: 36,
  },
  actions: {
    gap: spacing.md,
    width: '100%',
    maxWidth: 320,
  },
  // High-fidelity Neubrutalist buttons matching Anthropic front-end design guidelines
  oauthButton: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface, // Clean cream surface
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    // 2D solid offset shadow with zero blur
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  oauthButtonPressed: {
    transform: [{ translateX: 1.5 }, { translateY: 1.5 }],
    shadowOffset: { width: 1.5, height: 1.5 },
    elevation: 1,
  },
  oauthInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  appleLogoBox: {
    alignItems: 'center',
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  appleLogoIcon: {
    color: '#000000',
    fontFamily: Platform.select({ ios: 'Helvetica Neue', default: 'sans-serif' }),
    fontSize: 23,
    fontWeight: '900',
    includeFontPadding: false,
    lineHeight: 24,
  },
  oauthText: {
    color: colors.textPrimary, // Dark charcoal high-contrast text
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontFamily: Platform.select({ android: 'sans-serif-medium', ios: 'Helvetica Neue', default: 'sans-serif' }),
  },
  disabledButton: {
    opacity: 0.5,
  },
  errorText: {
    color: colors.clay,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 12,
  },
  configBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
    width: '100%',
    marginBottom: spacing.xs,
  },
  configText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  configTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
});
