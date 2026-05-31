import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";

import screeningJson from "../data/screening.json";
import {
  ScreeningData,
  ScreeningInstrument,
  ScreeningInstrumentId,
  ScreeningQueueItem,
  ScreeningState,
} from "../types/screening";
import { calculateScores } from "./use_scoring";

const screeningData = screeningJson as unknown as ScreeningData;

const initialState: ScreeningState = {
  answers: {},
  currentInstrument: "who5",
  currentQuestionIndex: 0,
  flags: {
    isCrisis: false,
    needsDeepScreening: false,
  },
  scores: {},
};

const SCREENING_STORAGE_KEY = "@screening_state_v1";

export function useScreening() {
  const [state, setState] = useState<ScreeningState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SCREENING_STORAGE_KEY)
      .then((value) => {
        if (value) {
          const parsed = JSON.parse(value);

          if (parsed.completedAt || parsed.currentInstrument === "done") {
            setState(initialState);
            AsyncStorage.removeItem(SCREENING_STORAGE_KEY).catch(() => undefined);
            return;
          }

          setState(parsed);
        }
      })
      .catch((err) => console.log("Error loading screening state:", err))
      .finally(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (state.completedAt || state.currentInstrument === "done") {
      AsyncStorage.removeItem(SCREENING_STORAGE_KEY).catch(
        (err) => console.log("Error clearing completed screening state:", err),
      );
      return;
    }

    AsyncStorage.setItem(SCREENING_STORAGE_KEY, JSON.stringify(state)).catch(
      (err) => console.log("Error saving screening state:", err),
    );
  }, [state, isLoaded]);
  const instruments = useMemo(
    () =>
      Object.fromEntries(
        screeningData.instruments.map((instrument) => [
          instrument.id,
          instrument,
        ]),
      ) as Record<ScreeningInstrumentId, ScreeningInstrument>,
    [],
  );

  const queue = useMemo(
    () => buildQueue(instruments, state),
    [instruments, state],
  );
  const answeredCount = useMemo(
    () => queue.filter((item) => state.answers[item.question.id]).length,
    [queue, state.answers],
  );
  const currentItem = queue.find((item) => !state.answers[item.question.id]);
  const totalCount = queue.length;

  const answerCurrent = (value: string) => {
    if (!currentItem || state.currentInstrument === "done") {
      return;
    }

    setState((current) => {
      const answers = {
        ...current.answers,
        [currentItem.question.id]: value,
      };
      const scoreResult = calculateScores(answers);
      const scores = {
        gad7: scoreResult.gad7,
        phq9: scoreResult.phq9,
        who5: scoreResult.who5_raw,
        who5_percentage: scoreResult.who5_pct,
      };
      const needsDeepScreening = scoreResult.needsDeepScreen;
      const isCrisis = scoreResult.isCrisis;
      const nextState: ScreeningState = {
        ...current,
        answers,
        flags: {
          isCrisis,
          needsDeepScreening,
        },
        scores,
      };
      const nextQueue = buildQueue(instruments, nextState);
      const nextItem = nextQueue.find((item) => !answers[item.question.id]);

      if (!nextItem) {
        return {
          ...nextState,
          completedAt: new Date(),
          currentInstrument: "done",
          currentQuestionIndex: nextQueue.length,
        };
      }

      return {
        ...nextState,
        currentInstrument: nextItem.instrument.id,
        currentQuestionIndex: nextItem.questionIndex,
      };
    });
  };

  const reset = () => {
    setState(initialState);
  };

  return {
    answerCurrent,
    answeredCount,
    currentItem,
    data: screeningData,
    queue,
    reset,
    state,
    totalCount,
  };
}

function buildQueue(
  instruments: Record<ScreeningInstrumentId, ScreeningInstrument>,
  state: ScreeningState,
): ScreeningQueueItem[] {
  const who5Items = instruments.who5.questions.map(
    (question, questionIndex) => ({
      instrument: instruments.who5,
      question,
      questionIndex,
    }),
  );

  if (who5Items.some((item) => !state.answers[item.question.id])) {
    return who5Items;
  }

  const needsDeepScreening = calculateScores(state.answers).needsDeepScreen;

  if (!needsDeepScreening) {
    return who5Items;
  }

  const deepItems: ScreeningQueueItem[] = [];
  const maxLength = Math.max(
    instruments.phq9.questions.length,
    instruments.gad7.questions.length,
  );

  for (let index = 0; index < maxLength; index += 1) {
    const phqQuestion = instruments.phq9.questions[index];
    const gadQuestion = instruments.gad7.questions[index];

    if (phqQuestion) {
      deepItems.push({
        instrument: instruments.phq9,
        question: phqQuestion,
        questionIndex: index,
      });
    }

    if (gadQuestion) {
      deepItems.push({
        instrument: instruments.gad7,
        question: gadQuestion,
        questionIndex: index,
      });
    }
  }

  return [...who5Items, ...deepItems];
}
