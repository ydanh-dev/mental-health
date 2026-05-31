import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { screeningContent } from '../data/screening_content';
import { calculateScores, type ScoreResult } from '../hooks/use_scoring';
import { useScreening } from '../hooks/use_screening';
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
    onComplete(null);
  };

  return (
    <View style={styles.container}>
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
              text={item.question.text}
            />
          </FadeInDownView>
        ))}

        {state.flags.needsDeepScreening && answeredCount >= 5 && (
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
              text={currentItem.question.text}
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

              <Text style={styles.doneBody}>
                Mở chat ở góc dưới để kể tiếp nhé. Mình đã hiểu ngữ cảnh - không cần giải thích lại từ đầu.
              </Text>

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
  text: string;
};

function QuestionBubble({ answerLabel, text }: QuestionBubbleProps) {
  return (
    <View style={styles.bubbleBlock}>
      <View style={styles.assistantBubble}>
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

const styles = StyleSheet.create({
  answerBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primarySoft,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1.5,
    maxWidth: '78%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 2, width: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  answerText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    borderWidth: 1.5,
    flex: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: colors.borderStrong,
    shadowOffset: { height: 3, width: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  bubbleBlock: {
    gap: spacing.md,
  },
  chatList: {
    gap: spacing.lg,
    paddingBottom: spacing.sm,
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
  doneTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
  },
  questionText: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 24,
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
