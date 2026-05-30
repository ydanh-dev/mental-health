import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { screeningContent } from '../data/screening_content';
import { calculateScores, getSeverityLabel, type ScoreResult } from '../hooks/use_scoring';
import { useScreening } from '../hooks/use_screening';
import { colors, radius, spacing } from '../styles/theme';
import { ScreeningState } from '../types/screening';
import { CrisisBanner } from './crisis_banner';
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
      {state.flags.isCrisis && <CrisisBanner />}

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
                <Text style={styles.transitionTitle}>Cảm ơn bạn đã hoàn thành phần đầu</Text>
                <Text style={styles.transitionBody}>
                  Mình xin hỏi thêm vài câu ngắn để hiểu rõ hơn điều bạn đang trải qua. Bạn vẫn chỉ cần chọn đáp án gần nhất với cảm giác hiện tại.
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

        {state.currentInstrument === 'done' && (() => {
          const scoreResult = calculateScores(state.answers);
          return (
            <FadeInDownView distance={10} duration={360}>
              <View style={styles.doneCard}>
                <Text style={styles.doneTitle}>{screeningContent.completion.title}</Text>

                <View style={styles.resultsDashboard}>
                  <Text style={styles.dashboardHeadline}>Kết quả đánh giá của bạn:</Text>

                  {/* WHO-5 Wellbeing */}
                  <View style={[styles.scoreRow, !scoreResult.needsDeepScreen && styles.scoreRowLast]}>
                    <View style={styles.scoreInfo}>
                      <Text style={styles.scoreLabel}>Chỉ số Sức khỏe Tinh thần (WHO-5)</Text>
                      <Text style={styles.scoreSub}>Phản ánh năng lượng sống và cảm giác bình yên</Text>
                    </View>
                    <View style={[styles.scoreBadge, scoreResult.who5_pct >= 50 ? styles.badgeGood : styles.badgeLow]}>
                      <Text style={styles.scoreValue}>{scoreResult.who5_pct}%</Text>
                    </View>
                  </View>

                  {scoreResult.needsDeepScreen && (
                    <>
                      {/* PHQ-9 Depression */}
                      <View style={styles.scoreRow}>
                        <View style={styles.scoreInfo}>
                          <Text style={styles.scoreLabel}>Mức độ Trầm cảm (PHQ-9)</Text>
                          <Text style={styles.scoreSub}>
                            {getSeverityLabel('phq9', scoreResult.phq9)} ({scoreResult.phq9}/27 điểm)
                          </Text>
                        </View>
                        <View style={[
                          styles.scoreBadge,
                          scoreResult.phq9 < 10 ? styles.badgeGood : scoreResult.phq9 < 15 ? styles.badgeWarning : styles.badgeDanger
                        ]}>
                          <Text style={styles.scoreValue}>{scoreResult.phq9}</Text>
                        </View>
                      </View>

                      {/* GAD-7 Anxiety */}
                      <View style={[styles.scoreRow, styles.scoreRowLast]}>
                        <View style={styles.scoreInfo}>
                          <Text style={styles.scoreLabel}>Mức độ Lo âu (GAD-7)</Text>
                          <Text style={styles.scoreSub}>
                            {getSeverityLabel('gad7', scoreResult.gad7)} ({scoreResult.gad7}/21 điểm)
                          </Text>
                        </View>
                        <View style={[
                          styles.scoreBadge,
                          scoreResult.gad7 < 10 ? styles.badgeGood : scoreResult.gad7 < 15 ? styles.badgeWarning : styles.badgeDanger
                        ]}>
                          <Text style={styles.scoreValue}>{scoreResult.gad7}</Text>
                        </View>
                      </View>
                    </>
                  )}
                </View>

                <Text style={styles.doneBody}>
                  Hôm nay bạn đã dũng cảm dừng lại và lắng nghe bản thân. Trợ lý AI sẵn sàng đồng hành nếu bạn muốn chia sẻ thêm.
                </Text>

                <View style={styles.doneFooter}>
                  <Pressable accessibilityRole="button" onPress={restart} style={styles.restartButton}>
                    <Text style={styles.restartText}>{screeningContent.completion.action}</Text>
                  </Pressable>
                </View>
              </View>
            </FadeInDownView>
          );
        })()}
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
  resultsDashboard: {
    marginVertical: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  dashboardHeadline: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scoreRowLast: {
    borderBottomWidth: 0,
  },
  scoreInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  scoreSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '800',
  },
  scoreBadge: {
    width: 48,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textPrimary,
  },
  badgeGood: {
    backgroundColor: '#E2F5EC',
    borderColor: colors.teal,
  },
  badgeLow: {
    backgroundColor: '#FDF2E9',
    borderColor: colors.accent,
  },
  badgeWarning: {
    backgroundColor: '#FFF9E6',
    borderColor: colors.clay,
  },
  badgeDanger: {
    backgroundColor: '#FCE8E6',
    borderColor: colors.clay,
  },
  doneFooter: {
    marginTop: spacing.sm,
  },
});
