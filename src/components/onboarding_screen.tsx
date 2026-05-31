import { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  onboardingContent,
  onboardingGoals,
  onboardingSleepHabits,
  onboardingTriggers,
} from '../data/onboarding_content';
import { colors, spacing } from '../styles/theme';
import type {
  OnboardingGoal,
  OnboardingProfile,
  OnboardingTrigger,
  SleepHabit,
} from '../types/onboarding';

type OnboardingScreenProps = {
  onComplete: (profile: OnboardingProfile) => void;
  onSkip: () => void;
};

const finalStepIndex = onboardingContent.steps.length - 1;

export function OnboardingScreen({ onComplete, onSkip }: OnboardingScreenProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [goals, setGoals] = useState<OnboardingGoal[]>([]);
  const [triggers, setTriggers] = useState<OnboardingTrigger[]>([]);
  const [sleepHabit, setSleepHabit] = useState<SleepHabit | null>(null);
  const currentStep = onboardingContent.steps[stepIndex];
  const progress = (stepIndex + 1) / onboardingContent.steps.length;
  const canContinue = useMemo(() => {
    if (currentStep.key === 'goals') {
      return goals.length > 0;
    }

    if (currentStep.key === 'triggers') {
      return triggers.length > 0;
    }

    return Boolean(sleepHabit);
  }, [currentStep.key, goals.length, sleepHabit, triggers.length]);

  const finish = () => {
    onComplete({
      completedAt: new Date().toISOString(),
      goals,
      sleepHabit,
      triggers,
    });
  };

  const goNext = () => {
    if (!canContinue) {
      return;
    }

    if (stepIndex === finalStepIndex) {
      finish();
      return;
    }

    setStepIndex((current) => current + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRule} />
      <View style={styles.sideRule} />

      <View style={styles.layoutWrapper}>
        {/* Pinned Header */}
        <View style={styles.headerBlock}>
          <View style={styles.progressBlock}>
            <View style={styles.progressHeader}>
              <Text style={styles.eyebrow}>{onboardingContent.intro.eyebrow}</Text>
              <Text style={styles.progressLabel}>
                {stepIndex + 1}/{onboardingContent.steps.length}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
          </View>

          <View style={styles.questionHeader}>
            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepDescription}>{currentStep.description}</Text>
          </View>
        </View>

        {/* Center Options Area (Scrolls locally only if the viewport is extremely small) */}
        <ScrollView
          style={styles.centerContent}
          contentContainerStyle={styles.optionsList}
          showsVerticalScrollIndicator={false}
        >
          {currentStep.key === 'goals' && (
            <View style={styles.options}>
              {onboardingGoals.map((option) => (
                <ChoiceRow
                  body={option.body}
                  isSelected={goals.includes(option.id)}
                  key={option.id}
                  onPress={() =>
                    setGoals((current) =>
                      current.includes(option.id)
                        ? current.filter((item) => item !== option.id)
                        : [...current, option.id].slice(-2),
                    )
                  }
                  title={option.title}
                />
              ))}
            </View>
          )}

          {currentStep.key === 'triggers' && (
            <View style={styles.options}>
              {onboardingTriggers.map((option) => (
                <ChoiceRow
                  body={option.body}
                  isSelected={triggers.includes(option.id)}
                  key={option.id}
                  onPress={() =>
                    setTriggers((current) =>
                      current.includes(option.id)
                        ? current.filter((item) => item !== option.id)
                        : [...current, option.id].slice(-3),
                    )
                  }
                  title={option.title}
                />
              ))}
            </View>
          )}

          {currentStep.key === 'sleep' && (
            <View style={styles.options}>
              {onboardingSleepHabits.map((option) => (
                <ChoiceRow
                  body={option.body}
                  isSelected={sleepHabit === option.id}
                  key={option.id}
                  onPress={() => setSleepHabit(option.id)}
                  title={option.title}
                />
              ))}
            </View>
          )}
        </ScrollView>

        {/* Pinned Footer Actions */}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={stepIndex === 0 ? onSkip : () => setStepIndex((current) => current - 1)}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.secondaryButtonText}>
              {stepIndex === 0 ? onboardingContent.action.skip : onboardingContent.action.back}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!canContinue}
            onPress={goNext}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
              !canContinue && styles.primaryButtonDisabled,
            ]}
          >
            <Text style={styles.primaryButtonText}>
              {stepIndex === finalStepIndex
                ? onboardingContent.action.finish
                : onboardingContent.action.next}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

type ChoiceRowProps = {
  body: string;
  isSelected: boolean;
  onPress: () => void;
  title: string;
};

function ChoiceRow({ body, isSelected, onPress, title }: ChoiceRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        isSelected && styles.choiceSelected,
        pressed && styles.choicePressed,
      ]}
    >
      <View style={[styles.choiceMark, isSelected && styles.choiceMarkSelected]}>
        {isSelected ? <Text style={styles.choiceMarkText}>✓</Text> : null}
      </View>
      <View style={styles.choiceCopy}>
        <Text style={[styles.choiceTitle, isSelected && styles.choiceTitleSelected]}>
          {title}
        </Text>
        <Text style={[styles.choiceBody, isSelected && styles.choiceBodySelected]}>
          {body}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
  },
  layoutWrapper: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    justifyContent: 'space-between',
  },
  headerBlock: {
    paddingTop: Platform.OS === 'ios' ? 70 : 45,
    gap: spacing.md,
  },
  progressBlock: {
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    backgroundColor: colors.lineSoft,
    borderRadius: 999,
    height: 4,
    width: '100%',
  },
  progressFill: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    height: '100%',
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 16,
  },
  questionHeader: {
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 30,
  },
  stepDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  centerContent: {
    flex: 1,
    marginTop: spacing.md,
  },
  optionsList: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingBottom: spacing.lg,
  },
  options: {
    gap: spacing.sm,
  },
  choice: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1.2,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    shadowColor: '#524C43',
    shadowOffset: { height: 1, width: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  choiceSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.accent,
    borderWidth: 1.5,
    shadowOpacity: 0.02,
  },
  choicePressed: {
    opacity: 0.85,
  },
  choiceMark: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderRadius: 11,
    borderWidth: 1.5,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  choiceMarkSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  choiceMarkText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '900',
  },
  choiceCopy: {
    flex: 1,
    gap: 2,
  },
  choiceTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  choiceTitleSelected: {
    color: colors.textPrimary,
  },
  choiceBody: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  choiceBodySelected: {
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginBottom: Platform.OS === 'ios' ? 12 : 8,
  },
  buttonPressed: {
    transform: [{ translateY: 1 }],
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    flex: 1,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  primaryButtonDisabled: {
    opacity: 0.25,
  },
  primaryButtonText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1.2,
    justifyContent: 'center',
    minHeight: 52,
    minWidth: 112,
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  topRule: {
    backgroundColor: colors.lineSoft,
    height: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: Platform.OS === 'ios' ? 58 : 34,
  },
  sideRule: {
    backgroundColor: colors.lineSoft,
    bottom: 0,
    left: 58,
    position: 'absolute',
    top: 0,
    width: 1,
  },
});
