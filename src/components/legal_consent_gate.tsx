import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReactNode, useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../styles/theme';

const legalConsentStorageKey = 'solen/legal-consent-v1';

type LegalConsentGateProps = {
  children: ReactNode;
};

export function LegalConsentGate({ children }: LegalConsentGateProps) {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(legalConsentStorageKey)
      .then((value) => {
        if (active) {
          setHasAccepted(value === 'accepted');
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) {
          setIsLoaded(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const acceptTerms = async () => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      await AsyncStorage.setItem(legalConsentStorageKey, 'accepted');
      setHasAccepted(true);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) {
    return <SafeAreaView style={styles.loadingScreen} />;
  }

  if (hasAccepted) {
    return <>{children}</>;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.eyebrowPill}>
            <Text style={styles.eyebrowText}>Điều khoản sử dụng</Text>
          </View>
          <Text style={styles.title}>Trước khi bắt đầu</Text>
          <Text style={styles.subtitle}>
            Solen là một không gian để bạn nhìn lại cảm xúc và trò chuyện nhẹ nhàng hơn với chính mình.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>⚠️</Text>
            <Text style={styles.cardTitle}>Lưu ý quan trọng</Text>
          </View>
          <Text style={styles.legalText}>
            App không thay thế bác sĩ/chuyên gia tâm lý. Trong tình huống khẩn cấp, hãy gọi 115 hoặc đến cơ sở y tế gần nhất.
          </Text>
        </View>

        <View style={styles.list}>
          <View style={styles.listItem}>
            <View style={styles.listBullet}>
              <Text style={styles.listBulletText}>1</Text>
            </View>
            <Text style={styles.listText}>
              Nội dung trong app chỉ hỗ trợ tự nhìn lại, không phải kết luận y khoa hoặc chỉ dẫn điều trị.
            </Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.listBullet}>
              <Text style={styles.listBulletText}>2</Text>
            </View>
            <Text style={styles.listText}>
              Nếu cảm giác trở nên quá sức, hãy liên hệ người tin cậy hoặc dịch vụ y tế tại nơi bạn đang ở.
            </Text>
          </View>
          <View style={styles.listItem}>
            <View style={styles.listBullet}>
              <Text style={styles.listBulletText}>3</Text>
            </View>
            <Text style={styles.listText}>
              Bằng cách tiếp tục, bạn xác nhận đã đọc và đồng ý với điều khoản này.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Tôi hiểu và đồng ý"
          disabled={isSaving}
          onPress={acceptTerms}
          style={({ pressed }) => [
            styles.acceptButton,
            pressed ? styles.acceptButtonPressed : styles.acceptButtonShadow,
            isSaving && styles.acceptButtonDisabled,
          ]}
        >
          <Text style={styles.acceptButtonText}>
            {isSaving ? 'Đang lưu...' : 'Tôi hiểu và đồng ý'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  acceptButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  acceptButtonShadow: {
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  acceptButtonDisabled: {
    opacity: 0.62,
  },
  acceptButtonPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  acceptButtonText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.xs,
    padding: spacing.lg,
    shadowColor: colors.accent,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardIcon: {
    fontSize: 18,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 22,
  },
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    justifyContent: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xxl,
  },
  eyebrowPill: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.accent,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    shadowColor: colors.accent,
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
  eyebrowText: {
    color: colors.clay,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  footer: {
    backgroundColor: colors.background,
    borderTopColor: colors.lineSoft,
    borderTopWidth: 1,
    padding: spacing.screen,
    paddingTop: spacing.md,
  },
  header: {
    gap: spacing.sm,
  },
  legalText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21,
  },
  list: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  listBullet: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.accent,
    borderRadius: 8,
    borderWidth: 1.5,
    height: 26,
    justifyContent: 'center',
    width: 26,
    shadowColor: colors.accent,
    shadowOffset: { width: 1.5, height: 1.5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  listBulletText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  listItem: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listText: {
    color: colors.textSecondary,
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 21,
    paddingTop: 2,
  },
  loadingScreen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screen: {
    backgroundColor: colors.background,
    flex: 1,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 39,
  },
});
