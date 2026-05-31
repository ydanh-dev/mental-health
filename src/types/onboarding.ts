export type OnboardingGoal =
  | 'understand_feelings'
  | 'sleep_better'
  | 'reduce_overload'
  | 'build_rhythm';

export type OnboardingTrigger =
  | 'work_study'
  | 'relationships'
  | 'uncertainty'
  | 'self_pressure'
  | 'too_much_input';

export type SleepHabit =
  | 'steady'
  | 'late'
  | 'interrupted'
  | 'tired_morning'
  | 'not_sure';

export type OnboardingProfile = {
  completedAt: string;
  goals: OnboardingGoal[];
  sleepHabit: SleepHabit | null;
  triggers: OnboardingTrigger[];
};
