import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { checkInContent } from '../data/check_in_content';
import {
  AIReflectionResponse,
  requestAIReflection,
} from '../services/ai_reflection';
import { colors, radius, spacing } from '../styles/theme';
import { FadeInDownView } from './fade_in_down_view';
import { SignalChip } from './signal_chip';

export function CheckInPanel() {
  const [activeMode, setActiveMode] = useState<string>(checkInContent.modes[0].label);
  const [selectedSignals, setSelectedSignals] = useState<Record<string, string>>({});
  const [selectedSupport, setSelectedSupport] = useState<string | null>(null);
  const [aiError, setAIError] = useState<string | null>(null);
  const [aiReflection, setAIReflection] = useState<AIReflectionResponse | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [journalText, setJournalText] = useState('');
  const selectedValues = Object.values(selectedSignals).filter(Boolean);
  const selectedCount = selectedValues.length;
  const activeModeDescription = checkInContent.modes.find((mode) => mode.label === activeMode)?.description;
  const selectedSummary = selectedValues.join(' / ');
  const visibleSectionCount = Math.min(selectedCount + 1, checkInContent.sections.length);
  const visibleSections = checkInContent.sections.slice(0, visibleSectionCount);
  const hasCompletedSignals = selectedCount === checkInContent.sections.length;
  const hasJournalText = journalText.trim().length > 0;
  const bodySignal = selectedSignals['Cơ thể'];
  const mindSignal = selectedSignals['Tâm trí'];
  const feelingSignal = selectedSignals['Cảm xúc'];
  const needSignal = selectedSignals['Nhu cầu'];
  const supportActions = useMemo(() => {
    if (aiReflection?.supportActions.length) {
      return aiReflection.supportActions.map((action, index) => ({
        key: `ai-${index}`,
        recommended: index === 0,
        ...action,
      }));
    }

    const actions = checkInContent.supportActions;
    const recommendedKey = (() => {
      if (needSignal === 'Cần khoảng riêng') {
        return 'space';
      }

      if (needSignal === 'Cần rõ ràng' || mindSignal === 'Lặp lại kế hoạch') {
        return 'clarity';
      }

      if (needSignal === 'Cần được trấn an' || feelingSignal === 'Dễ tổn thương') {
        return 'reassurance';
      }

      if (mindSignal === 'Quá nhiều thông tin' || feelingSignal === 'Ngợp') {
        return 'reduceInput';
      }

      return 'bodyCare';
    })();
    const orderedKeys = [
      recommendedKey,
      'clarity',
      'space',
      'reduceInput',
      'reassurance',
      'bodyCare',
    ].filter((key, index, list) => list.indexOf(key) === index);

    return orderedKeys.slice(0, 3).map((key) => ({
      key,
      recommended: key === recommendedKey,
      ...actions[key as keyof typeof actions],
    }));
  }, [aiReflection, feelingSignal, mindSignal, needSignal]);
  const selectedSupportAction = supportActions.find((action) => action.key === selectedSupport);
  const reflection = useMemo(() => {
    if (!hasCompletedSignals) {
      return 'Mình sẽ đi từng phần một. Chỉ cần chọn điều gần đúng nhất ở bước hiện tại.';
    }

    if (!hasJournalText) {
      return `Có vài cảm giác đang hiện lên: ${selectedSummary}. Thêm một câu tự do sẽ giúp phần nhìn lại gần với bạn hơn.`;
    }

    return aiReflection?.reflection ?? `Có vẻ lúc này cơ thể đang nghiêng về "${bodySignal}", tâm trí có "${mindSignal}", cảm xúc gần với "${feelingSignal}", và bạn đang cần "${needSignal}". Câu bạn viết cho thấy trải nghiệm này có sắc thái riêng, nên mình chỉ nhìn lại thật nhẹ: có điều gì đó đang cần được nhìn thấy, không cần giải quyết hết ngay.`;
  }, [
    aiReflection,
    bodySignal,
    feelingSignal,
    hasCompletedSignals,
    hasJournalText,
    mindSignal,
    needSignal,
    selectedSummary,
  ]);

  const chooseSignal = (sectionLabel: string, signal: string) => {
    setSelectedSignals((current) => ({
      ...current,
      [sectionLabel]: current[sectionLabel] === signal ? '' : signal,
    }));
    setAIReflection(null);
    setAIError(null);
    setSelectedSupport(null);
  };

  const handleJournalChange = (value: string) => {
    setJournalText(value);
    setAIReflection(null);
    setAIError(null);
    setSelectedSupport(null);
  };

  const handleAIReflection = async () => {
    setAIError(null);
    setIsLoadingAI(true);
    setSelectedSupport(null);

    try {
      const result = await requestAIReflection({
        journalText,
        locale: 'vi-VN',
        signals: {
          body: bodySignal,
          feeling: feelingSignal,
          mind: mindSignal,
          need: needSignal,
        },
      });
      setAIReflection(result);
    } catch (error) {
      setAIError(error instanceof Error ? error.message : 'Không tạo được phần nhìn lại AI.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>{checkInContent.eyebrow}</Text>
        <Text style={styles.count}>{selectedCount}/{checkInContent.sections.length}</Text>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{checkInContent.title}</Text>
        <Text style={styles.description}>{checkInContent.description}</Text>
      </View>

      <View style={styles.modeRow}>
        {checkInContent.modes.map((mode) => {
          const selected = activeMode === mode.label;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={mode.label}
              onPress={() => setActiveMode(mode.label)}
              style={[styles.modeButton, selected && styles.modeButtonSelected]}
            >
              <Text style={[styles.modeLabel, selected && styles.modeLabelSelected]}>
                {mode.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.modeDescription}>{activeModeDescription}</Text>

      <View style={styles.card}>
        {visibleSections.map((section, index) => (
          <FadeInDownView
            delay={index === 0 ? 0 : 80}
            distance={10}
            duration={420}
            key={section.label}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>{section.label}</Text>
              <Text style={styles.sectionPrompt}>{section.prompt}</Text>
            </View>
            <View style={styles.signalGroup}>
              {section.signals.map((signal) => (
                <SignalChip
                  key={signal}
                  label={signal}
                  onPress={() => chooseSignal(section.label, signal)}
                  selected={selectedSignals[section.label] === signal}
                />
              ))}
            </View>
          </FadeInDownView>
        ))}
      </View>

      {hasCompletedSignals && (
        <FadeInDownView distance={10} duration={420}>
          <View style={styles.journalCard}>
            <Text style={styles.journalLabel}>{checkInContent.journalPrompt}</Text>
            <TextInput
              multiline
              onChangeText={handleJournalChange}
              placeholder={checkInContent.journalPlaceholder}
              placeholderTextColor={colors.textMuted}
              style={styles.journalInput}
              textAlignVertical="top"
              value={journalText}
            />
          </View>
        </FadeInDownView>
      )}

      {hasJournalText && (
        <FadeInDownView distance={10} duration={420}>
          <View style={styles.aiCard}>
            <Text style={styles.aiTitle}>Tạo phần nhìn lại bằng AI</Text>
            <Text style={styles.aiDescription}>
              AI sẽ dùng các cảm giác bạn chọn và câu bạn viết để gợi ý hướng xử lý cụ thể hơn.
            </Text>
            <Pressable
              disabled={isLoadingAI}
              onPress={handleAIReflection}
              style={({ pressed }) => [
                styles.aiButton,
                pressed && styles.primaryButtonPressed,
                isLoadingAI && styles.disabledButton,
              ]}
            >
              <Text style={styles.aiButtonText}>
                {isLoadingAI ? 'Đang nhìn lại...' : 'Tạo nhìn lại AI'}
              </Text>
            </Pressable>
            {aiError && <Text style={styles.aiError}>{aiError}</Text>}
          </View>
        </FadeInDownView>
      )}

      {(selectedCount > 0 || hasJournalText) && (
        <FadeInDownView distance={10} duration={420}>
          <View style={styles.reflectionCard}>
            <View style={styles.reflectionAccent} />
            <View style={styles.reflectionCopy}>
              <Text style={styles.reflectionLabel}>
                {selectedSummary || 'Tạm dừng ở đây'}
              </Text>
              <Text style={styles.reflectionPrompt}>{reflection}</Text>
              <Text style={styles.softQuestion}>
                {aiReflection?.followUpQuestion ?? checkInContent.softQuestion}
              </Text>
            </View>
          </View>
        </FadeInDownView>
      )}

      {hasJournalText && (
        <FadeInDownView distance={10} duration={420}>
          <View style={styles.supportCard}>
            <View style={styles.supportHeader}>
              <Text style={styles.supportTitle}>{checkInContent.supportTitle}</Text>
              <Text style={styles.supportDescription}>{checkInContent.supportDescription}</Text>
            </View>

            {supportActions.map((action) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: selectedSupport === action.key }}
                key={action.key}
                onPress={() => setSelectedSupport(action.key)}
                style={[
                  styles.supportAction,
                  selectedSupport === action.key && styles.supportActionSelected,
                ]}
              >
                <View style={styles.supportActionHeader}>
                  <Text style={styles.supportActionTitle}>{action.title}</Text>
                  {action.recommended && <Text style={styles.recommendedLabel}>Gợi ý</Text>}
                </View>
                <Text style={styles.supportActionBody}>{action.body}</Text>
              </Pressable>
            ))}

            {selectedSupportAction && (
              <FadeInDownView distance={8} duration={320}>
                <View style={styles.nextStepCard}>
                  <Text style={styles.nextStepLabel}>Bước tiếp theo</Text>
                  <Text style={styles.nextStepQuestion}>{selectedSupportAction.nextQuestion}</Text>
                  <TextInput
                    multiline
                    placeholder="Trả lời ngắn thôi cũng được..."
                    placeholderTextColor={colors.textMuted}
                    style={styles.nextStepInput}
                    textAlignVertical="top"
                  />
                </View>
              </FadeInDownView>
            )}
          </View>
        </FadeInDownView>
      )}

      {selectedSupportAction && (
        <FadeInDownView distance={10} duration={420}>
          <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
            <Text style={styles.primaryButtonText}>Lưu hướng xử lý này</Text>
          </Pressable>
        </FadeInDownView>
      )}

      <Text style={styles.safetyNote}>{checkInContent.safetyNote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xl,
    width: '100%',
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xl,
    padding: spacing.xl,
  },
  count: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 26,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  aiButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  aiButtonText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  aiCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  aiDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  aiError: {
    color: colors.clay,
    fontSize: 13,
    lineHeight: 19,
  },
  aiTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
  },
  disabledButton: {
    opacity: 0.7,
  },
  journalCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  journalInput: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 23,
    minHeight: 112,
    padding: 0,
  },
  journalLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 22,
  },
  modeButton: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  modeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  modeDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: -spacing.md,
  },
  modeLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
  modeLabelSelected: {
    color: colors.onPrimary,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  primaryButtonPressed: {
    opacity: 0.86,
    transform: [{ translateY: 1 }],
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
  },
  nextStepCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  nextStepInput: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 74,
    padding: 0,
  },
  nextStepLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  nextStepQuestion: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  recommendedLabel: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  reflectionAccent: {
    backgroundColor: colors.accent,
    width: 5,
  },
  reflectionCard: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  reflectionCopy: {
    flex: 1,
    gap: spacing.xxs,
  },
  reflectionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  reflectionPrompt: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  supportAction: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  supportActionBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  supportActionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  supportActionSelected: {
    borderColor: colors.borderStrong,
  },
  supportActionTitle: {
    color: colors.textPrimary,
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0,
  },
  supportCard: {
    gap: spacing.md,
  },
  supportDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  supportHeader: {
    gap: spacing.xs,
  },
  supportTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0,
  },
  safetyNote: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    gap: spacing.xxs,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  sectionPrompt: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  signalGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontFamily: Platform.select({ android: 'serif', ios: 'Georgia', default: 'serif' }),
    fontSize: 39,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 44,
  },
  titleBlock: {
    gap: spacing.md,
  },
  softQuestion: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
});
