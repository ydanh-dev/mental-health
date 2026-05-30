import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { screeningContent } from '../data/screening_content';
import { calculateScores, type ScoreResult } from '../hooks/use_scoring';
import { useScreening } from '../hooks/use_screening';
import { colors, radius, spacing } from '../styles/theme';
import { ScreeningState } from '../types/screening';
import { CrisisBanner } from './crisis_banner';
import { FadeInDownView } from './fade_in_down_view';
import { OptionPicker } from './option_picker';
import { TypingIndicator } from './typing_indicator';

type ScreeningScreenProps = {
  onComplete: (scores: ScoreResult) => void;
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
  const scrollViewRef = useRef<ScrollView>(null);
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [visibleQuestionCount, setVisibleQuestionCount] = useState(1);
  const [completedNotifiedAt, setCompletedNotifiedAt] = useState<Date | undefined>();
  const answeredItems = useMemo(
    () => queue.filter((item) => state.answers[item.question.id]),
    [queue, state.answers],
  );
  const visibleAnsweredItems = answeredItems.slice(
    Math.max(0, answeredItems.length - Math.max(0, visibleQuestionCount - 1)),
  );
  const currentScale = currentItem ? data.scales[currentItem.question.scale] : undefined;
  const progressText =
    state.currentInstrument === 'done'
      ? screeningContent.progress.done
      : `${Math.min(answeredCount + 1, totalCount)} / ${totalCount}`;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);

    return () => clearTimeout(timeoutId);
  }, [answeredItems.length, currentItem?.question.id, pendingQuestionId, state.currentInstrument]);

  useEffect(() => {
    if (!state.completedAt || completedNotifiedAt === state.completedAt) {
      return;
    }

    setCompletedNotifiedAt(state.completedAt);
    onComplete(calculateScores(state.answers));
  }, [completedNotifiedAt, onComplete, state]);

  const chooseOption = (value: string) => {
    if (!currentItem || pendingQuestionId) {
      return;
    }

    const isTransition = currentItem.instrument.id === 'who5' && currentItem.questionIndex === 4;
    const delay = isTransition ? 3000 : 400;

    setPendingQuestionId(currentItem.question.id);
    answerCurrent(value);

    setTimeout(() => {
      setVisibleQuestionCount((current) => current + 1);
      setPendingQuestionId(null);
    }, delay);
  };

  const restart = () => {
    reset();
    setPendingQuestionId(null);
    setVisibleQuestionCount(1);
    setCompletedNotifiedAt(undefined);
  };

  return (
    <View style={styles.container}>
      {state.flags.isCrisis && <CrisisBanner />}

      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>{screeningContent.intro.eyebrow}</Text>
        <Text style={styles.progress}>{progressText}</Text>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.title}>{screeningContent.intro.title}</Text>
        <Text style={styles.description}>{screeningContent.intro.description}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.chatList}
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
      >
        {visibleAnsweredItems.map((item, index) => (
          <FadeInDownView
            delay={index === visibleAnsweredItems.length - 1 ? 60 : 0}
            distance={8}
            duration={320}
            key={item.question.id}
          >
            <QuestionBubble
              answerLabel={getAnswerLabel(data.scales[item.question.scale], state.answers[item.question.id])}
              instrumentLabel={item.instrument.id.toUpperCase()}
              text={item.question.text}
              timeframe={item.instrument.timeframe}
            />
          </FadeInDownView>
        ))}

        {state.flags.needsDeepScreening && answeredCount >= 5 && (
          <FadeInDownView distance={8} duration={300}>
            <View style={styles.transitionBubble}>
              <Text style={styles.transitionEmoji}>🌱</Text>
              <View style={styles.transitionTextContent}>
                <Text style={styles.transitionTitle}>Cảm ơn bạn đã hoàn thành phần đầu</Text>
                <Text style={styles.transitionBody}>
                  Dựa trên các câu trả lời ban đầu, chỉ số hạnh phúc tinh thần của bạn đang có dấu hiệu giảm sút. Mình xin phép hỏi thêm một số câu chuyên sâu về tình trạng lo âu, trầm cảm để hiểu rõ và đồng hành cùng bạn tốt nhất nhé.
                </Text>
              </View>
            </View>
          </FadeInDownView>
        )}

        {pendingQuestionId && (
          <FadeInDownView distance={8} duration={220}>
            <View style={styles.assistantBubble}>
              <TypingIndicator />
            </View>
          </FadeInDownView>
        )}

        {currentItem && !pendingQuestionId && state.currentInstrument !== 'done' && (
          <FadeInDownView distance={10} duration={360} key={currentItem.question.id}>
            <QuestionBubble
              instrumentLabel={currentItem.instrument.id.toUpperCase()}
              text={currentItem.question.text}
              timeframe={currentItem.instrument.timeframe}
            />
            {currentScale && (
              <OptionPicker
                disabled={Boolean(pendingQuestionId)}
                onSelect={chooseOption}
                scale={currentScale}
                selectedValue={state.answers[currentItem.question.id]}
              />
            )}
          </FadeInDownView>
        )}

        {state.currentInstrument === 'done' && (
          <FadeInDownView distance={10} duration={360}>
            <View style={styles.doneCard}>
              <Text style={styles.doneTitle}>{screeningContent.completion.title}</Text>
              <Text style={styles.doneBody}>{screeningContent.completion.body}</Text>
              <Text style={styles.doneSignal}>{getCompletionSummary(state)}</Text>
              <Pressable accessibilityRole="button" onPress={restart} style={styles.restartButton}>
                <Text style={styles.restartText}>{screeningContent.completion.action}</Text>
              </Pressable>
            </View>
          </FadeInDownView>
        )}
      </ScrollView>
    </View>
  );
}

type QuestionBubbleProps = {
  answerLabel?: string;
  instrumentLabel: string;
  text: string;
  timeframe: string;
};

function QuestionBubble({ answerLabel, instrumentLabel, text, timeframe }: QuestionBubbleProps) {
  return (
    <View style={styles.bubbleBlock}>
      <View style={styles.assistantBubble}>
        <View style={styles.badgeRow}>
          <Text style={styles.badge}>{instrumentLabel}</Text>
          <Text style={styles.timeframe}>{timeframe}</Text>
        </View>
        <Text style={styles.questionText}>{text}</Text>
      </View>
      {answerLabel && (
        <View style={styles.answerBubble}>
          <Text style={styles.answerText}>{answerLabel}</Text>
        </View>
      )}
    </View>
  );
}

function getAnswerLabel(
  scale: { options: Array<{ label: string; value: string }> },
  value: string,
) {
  return scale.options.find((option) => option.value === value)?.label ?? value;
}

function getCompletionSummary(state: ScreeningState) {
  if (state.flags.isCrisis) {
    return 'Mình sẽ ưu tiên sự an toàn của bạn trong phần trò chuyện tiếp theo.';
  }

  if (state.flags.needsDeepScreening) {
    return screeningContent.progress.lowWellbeing;
  }

  return screeningContent.progress.stableWellbeing;
}

const styles = StyleSheet.create({
  answerBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  answerText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  avatarText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 14,
  },
  badge: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
  },
  badgeRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  bubbleBlock: {
    gap: spacing.sm,
  },
  bubbleRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chatList: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  container: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.lg,
    maxHeight: 720,
    minHeight: 560,
    padding: spacing.lg,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  doneBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  doneCard: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  doneSignal: {
    color: colors.teal,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  doneTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progress: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  questionText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 21,
  },
  restartButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  restartText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 17,
  },
  timeframe: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 15,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
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
