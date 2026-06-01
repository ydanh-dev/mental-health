import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { screeningContent } from '../data/screening_content';
import { calculateScores, type ScoreResult } from '../hooks/use_scoring';
import { useScreening } from '../hooks/use_screening';
import { requestScreeningReflection } from '../services/screening_reflection';
import { colors, radius, spacing } from '../styles/theme';
import { FadeInDownView } from './fade_in_down_view';
import { OptionPicker } from './option_picker';
import { TypingIndicator } from './typing_indicator';

type ScreeningScreenProps = {
  onComplete: (scores: ScoreResult | null) => void;
};

export function ScreeningScreen({ onComplete }: ScreeningScreenProps) {
  const {
    answerCurrent,
    answeredCount,
    currentItem,
    data,
    queue,
    reset,
    state,
    totalCount,
  } = useScreening();
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionRequestedAt, setReflectionRequestedAt] = useState<Date | undefined>();
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>();
  const [completedNotifiedAt, setCompletedNotifiedAt] = useState<Date | undefined>();
  const currentScale = currentItem ? data.scales[currentItem.question.scale] : undefined;

  useEffect(() => {
    if (!state.completedAt || completedNotifiedAt === state.completedAt) {
      return;
    }

    const nextScores = calculateScores(state.answers);

    setCompletedNotifiedAt(state.completedAt);
    onComplete(nextScores);

    if (reflectionRequestedAt !== state.completedAt) {
      setReflectionRequestedAt(state.completedAt);
      setReflectionText('');
      requestScreeningReflection(state.answers, nextScores)
        .then(setReflectionText)
        .catch(() => {
          setReflectionText('Mình đã ghi lại phần bạn vừa chọn. Nếu muốn, bạn có thể kể tiếp từ cảm giác đang rõ nhất lúc này.');
        });
    }
  }, [completedNotifiedAt, onComplete, reflectionRequestedAt, state]);

  useEffect(() => {
    setSelectedAnswer(undefined);
  }, [currentItem?.question.id]);

  const submitAnswer = () => {
    if (!currentItem || pendingQuestionId || !selectedAnswer) {
      return;
    }

    const isTransition = currentItem.instrument.id === 'who5' && currentItem.questionIndex === 4;
    const delay = isTransition ? 3000 : 400;

    setPendingQuestionId(currentItem.question.id);
    answerCurrent(selectedAnswer);

    setTimeout(() => {
      setPendingQuestionId(null);
    }, delay);
  };

  const restart = () => {
    reset();
    setPendingQuestionId(null);
    setReflectionRequestedAt(undefined);
    setReflectionText('');
    setSelectedAnswer(undefined);
    setCompletedNotifiedAt(undefined);
    onComplete(null);
  };
  const currentQuestionNumber = state.currentInstrument === 'done'
    ? totalCount
    : Math.min(answeredCount + 1, totalCount);
  const progressValue = totalCount > 0
    ? Math.min(state.currentInstrument === 'done' ? 1 : answeredCount / totalCount, 1)
    : 0;

  return (
    <View style={styles.container}>
      <View style={styles.titleBlock}>
        <Text style={styles.title}>{screeningContent.intro.title}</Text>
        <Text style={styles.description}>{screeningContent.intro.description}</Text>
        <View style={styles.progressBlock}>
          <View style={styles.progressMeta}>
            <Text style={styles.progressLabel}>Câu {currentQuestionNumber}/{totalCount}</Text>
            <Text style={styles.progressHint}>
              {state.currentInstrument === 'done' ? screeningContent.progress.done : `${answeredCount} đã qua`}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressValue * 100}%` }]} />
          </View>
        </View>
      </View>

      <View style={styles.stepContent}>
        {state.flags.needsDeepScreening && answeredCount >= 5 && state.currentInstrument !== 'done' && (
          <FadeInDownView distance={8} duration={300}>
            <View style={styles.transitionBubble}>
              <Text style={styles.transitionEmoji}>🌱</Text>
              <View style={styles.transitionTextContent}>
                <Text style={styles.transitionTitle}>Cảm ơn bạn đã ở lại đến đây.</Text>
                <Text style={styles.transitionBody}>
                  Mình sẽ hỏi thêm vài câu nữa. Cứ chọn thứ gần nhất với lúc này - không cần đúng hoàn toàn.
                </Text>
              </View>
            </View>
          </FadeInDownView>
        )}

        {currentItem && !pendingQuestionId && state.currentInstrument !== 'done' && (
          <FadeInDownView distance={10} duration={360} key={currentItem.question.id} style={styles.questionStep}>
            <QuestionBubble
              text={currentItem.question.text}
            />
            {currentScale && (
              <OptionPicker
                disabled={Boolean(pendingQuestionId)}
                onNext={submitAnswer}
                onSelect={setSelectedAnswer}
                scale={currentScale}
                selectedValue={selectedAnswer}
              />
            )}
          </FadeInDownView>
        )}

        {pendingQuestionId && state.currentInstrument !== 'done' && (
          <FadeInDownView distance={8} duration={220} style={styles.questionStep}>
            <View style={styles.loadingBubble}>
              <TypingIndicator />
            </View>
          </FadeInDownView>
        )}

        {state.currentInstrument === 'done' && (
          <FadeInDownView distance={10} duration={360} style={styles.questionStep}>
            <View style={styles.reflectionCard}>
              {reflectionText ? (
                <Text style={styles.reflectionText}>{reflectionText}</Text>
              ) : (
                <View style={styles.reflectionLoading}>
                  <TypingIndicator />
                  <Text style={styles.reflectionLoadingText}>Đang nhìn lại phần bạn vừa chọn...</Text>
                </View>
              )}
              <Pressable
                accessibilityRole="button"
                onPress={restart}
                style={({ pressed }) => [
                  styles.restartButton,
                  pressed && styles.restartButtonPressed,
                ]}
              >
                <Text style={styles.restartText}>{screeningContent.completion.action}</Text>
              </Pressable>
            </View>
          </FadeInDownView>
        )}
      </View>
    </View>
  );
}

type QuestionBubbleProps = {
  text: string;
};

function QuestionBubble({ text }: QuestionBubbleProps) {
  return (
    <View style={styles.questionRow}>
      <View style={styles.assistantAvatar}>
        <Text style={styles.assistantAvatarText}>A</Text>
      </View>
      <View style={styles.assistantBubble}>
        <Text style={styles.questionText}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  assistantBubble: {
    backgroundColor: colors.surface,
    borderColor: colors.lineSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.border,
    shadowOffset: { height: 1, width: 1 },
    shadowOpacity: 0.14,
    shadowRadius: 0,
  },
  assistantAvatar: {
    alignItems: 'center',
    backgroundColor: colors.teal,
    borderColor: colors.lineSoft,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    marginTop: 2,
    width: 32,
  },
  assistantAvatarText: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  container: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.lg,
    minHeight: 560,
    padding: spacing.lg,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  reflectionCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: spacing.sm,
    padding: spacing.lg,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
    marginBottom: spacing.xs,
    minHeight: 184,
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.lineSoft,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  reflectionLoading: {
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  reflectionLoadingText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  reflectionText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  questionText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 24,
  },
  questionRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  questionStep: {
    minHeight: 390,
  },
  stepContent: {
    gap: spacing.lg,
  },
  progressBlock: {
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  progressFill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: '100%',
  },
  progressHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  progressLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
  },
  progressMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressTrack: {
    backgroundColor: colors.lineSoft,
    borderRadius: 999,
    height: 7,
    overflow: 'hidden',
  },
  restartButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.borderStrong,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  restartButtonPressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    shadowOffset: { width: 1, height: 1 },
    elevation: 1,
  },
  restartText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0,
    lineHeight: 35,
  },
  titleBlock: {
    gap: spacing.sm,
  },
  transitionBubble: {
    backgroundColor: colors.surface,
    borderColor: '#DCD4C7',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderLeftWidth: 5,
    borderLeftColor: colors.accent,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  transitionEmoji: {
    fontSize: 20,
    marginTop: 1,
  },
  transitionTextContent: {
    flex: 1,
    gap: 4,
  },
  transitionTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
  },
  transitionBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
