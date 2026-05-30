import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

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
      <View style={styles.panel}>
        <Text style={styles.eyebrow}>Đăng nhập</Text>
        <Text style={styles.title}>Giữ check-in của bạn an toàn hơn.</Text>
        <Text style={styles.description}>
          Trước mắt app chỉ dùng đăng nhập để nhận diện tài khoản. Dữ liệu cảm xúc nhạy cảm
          vẫn nên được đồng bộ sau khi có chính sách riêng tư rõ ràng.
        </Text>

        {!isConfigured && (
          <View style={styles.configBox}>
            <Text style={styles.configTitle}>Chưa cấu hình Supabase</Text>
            <Text style={styles.configText}>
              Thêm `EXPO_PUBLIC_SUPABASE_URL` và `EXPO_PUBLIC_SUPABASE_ANON_KEY` vào `.env`
              để bật đăng nhập.
            </Text>
          </View>
        )}

        <View style={styles.actions}>
          {isAppleAvailable && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              cornerRadius={8}
              onPress={() => {
                if (isConfigured && !isLoading) {
                  signInWithApple();
                }
              }}
              style={[styles.appleButton, (!isConfigured || isLoading) && styles.disabledButton]}
            />
          )}

          <Pressable
            accessibilityRole="button"
            disabled={!isConfigured || isLoading}
            onPress={signInWithGoogle}
            style={({ pressed }) => [
              styles.googleButton,
              pressed && styles.pressed,
              (!isConfigured || isLoading) && styles.disabledButton,
            ]}
          >
            <Text style={styles.googleMark}>G</Text>
            <Text style={styles.googleText}>
              {isLoading ? 'Đang xử lý...' : 'Tiếp tục với Google'}
            </Text>
          </Pressable>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    width: '100%',
  },
  appleButton: {
    height: 48,
    width: '100%',
  },
  configBox: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
    width: '100%',
  },
  configText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  configTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 18,
  },
  container: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.screen,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.45,
  },
  errorText: {
    color: colors.clay,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  googleButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  googleMark: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 20,
  },
  googleText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  panel: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    maxWidth: 420,
    padding: spacing.xl,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 6, width: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    width: '100%',
  },
  pressed: {
    opacity: 0.82,
    transform: [{ translateY: 1 }],
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 33,
    textAlign: 'center',
  },
});
