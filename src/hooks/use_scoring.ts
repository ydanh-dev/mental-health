import screeningJson from "../data/screening.json";
import {
  ScreeningData,
  ScreeningInstrument,
  ScreeningInstrumentId,
} from "../types/screening";

type Phq9Severity =
  | "minimal"
  | "mild"
  | "moderate"
  | "moderately_severe"
  | "severe";
type Gad7Severity = "minimal" | "mild" | "moderate" | "severe";

export interface ScoreResult {
  who5_raw: number;
  who5_pct: number;
  phq9: number;
  gad7: number;
  isCrisis: boolean;
  needsDeepScreen: boolean;
  highItems: string[];
  severity: {
    phq9: Phq9Severity;
    gad7: Gad7Severity;
  };
}

const screeningData = screeningJson as unknown as ScreeningData;
const instruments = Object.fromEntries(
  screeningData.instruments.map((instrument) => [instrument.id, instrument]),
) as Record<ScreeningInstrumentId, ScreeningInstrument>;

export function calculateScores(answers: Record<string, string>): ScoreResult {
  const who5Raw = calculateInstrumentScore(instruments.who5, answers);
  const who5Pct = who5Raw * (instruments.who5.scoring.percentage_multiply ?? 1);
  const needsDeepScreen =
    who5Pct < (instruments.who5.scoring.threshold_low ?? 50);
  const phq9 = needsDeepScreen
    ? calculateInstrumentScore(instruments.phq9, answers)
    : 0;
  const gad7 = needsDeepScreen
    ? calculateInstrumentScore(instruments.gad7, answers)
    : 0;

  return {
    gad7,
    highItems: getHighItems(answers),
    isCrisis: Boolean(answers.phq9_9 && answers.phq9_9 !== "not_at_all"),
    needsDeepScreen,
    phq9,
    severity: {
      gad7: getSeverityKey("gad7", gad7) as Gad7Severity,
      phq9: getSeverityKey("phq9", phq9) as Phq9Severity,
    },
    who5_pct: who5Pct,
    who5_raw: who5Raw,
  };
}

export function getSeverityLabel(instrument: string, score: number): string {
  const severity = getSeverityEntry(instrument, score);

  return severity?.label ?? "Không rõ";
}

function calculateInstrumentScore(
  instrument: ScreeningInstrument,
  answers: Record<string, string>,
): number {
  return instrument.questions.reduce((total, question) => {
    const answerValue = answers[question.id];
    const scaleValue = answerValue
      ? (instrument.scoring.scale_values[answerValue] ?? 0)
      : 0;

    return total + scaleValue * (question.weight ?? 1);
  }, 0);
}

function getHighItems(answers: Record<string, string>) {
  return Object.entries(answers)
    .filter(
      ([, value]) => value === "nearly_every_day" || value === "most_of_time",
    )
    .map(([questionId]) => questionId);
}

function getSeverityKey(instrument: string, score: number) {
  const thresholds = getInstrument(instrument)?.scoring.thresholds;

  if (!thresholds) {
    return "minimal";
  }

  return (
    Object.entries(thresholds).find(([, threshold]) => {
      const [min, max] = threshold.range;

      return score >= min && score <= max;
    })?.[0] ?? "minimal"
  );
}

function getSeverityEntry(instrument: string, score: number) {
  const thresholds = getInstrument(instrument)?.scoring.thresholds;

  if (!thresholds) {
    return undefined;
  }

  return Object.values(thresholds).find((threshold) => {
    const [min, max] = threshold.range;

    return score >= min && score <= max;
  });
}

function getInstrument(instrument: string) {
  return screeningData.instruments.find((item) => item.id === instrument);
}
