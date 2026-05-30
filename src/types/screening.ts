export type ScreeningInstrumentId = 'gad7' | 'phq9' | 'who5';
export type ScreeningFlowStatus = ScreeningInstrumentId | 'done';

export type ScreeningQuestion = {
  crisis_trigger?: boolean;
  id: string;
  scale: 'frequency' | 'frequency_4';
  sensitive?: boolean;
  text: string;
  weight: number;
};

export type ScreeningInstrument = {
  description: string;
  id: ScreeningInstrumentId;
  name: string;
  questions: ScreeningQuestion[];
  scoring: {
    max_raw: number;
    percentage_multiply?: number;
    scale_values: Record<string, number>;
    threshold_low?: number;
    thresholds?: Record<string, { label: string; range: [number, number] }>;
  };
  timeframe: string;
};

export type ScreeningScale = {
  options: Array<{
    label: string;
    value: string;
  }>;
};

export type ScreeningData = {
  instruments: ScreeningInstrument[];
  scales: Record<ScreeningQuestion['scale'], ScreeningScale>;
};

export interface ScreeningState {
  currentInstrument: ScreeningFlowStatus;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  scores: {
    who5?: number;
    phq9?: number;
    gad7?: number;
    who5_percentage?: number;
  };
  flags: {
    isCrisis: boolean;
    needsDeepScreening: boolean;
  };
  completedAt?: Date;
}

export type ScreeningQueueItem = {
  instrument: ScreeningInstrument;
  question: ScreeningQuestion;
  questionIndex: number;
};
