/**
 * Helper utilities for question management
 */
import { QuizQuestion } from "../components/types";

/**
 * Creates an empty question with default options
 */
export const createEmptyQuestion = (actId: string): QuizQuestion => ({
  activity_id: actId,
  question_text: "Default question",
  question_type: "multiple_choice",
  correct_answer_text: "",
  options: [
    { option_text: "Option 1", is_correct: true, display_order: 0 },
    { option_text: "Option 2", is_correct: false, display_order: 1 },
    { option_text: "Option 3", is_correct: false, display_order: 2 },
    { option_text: "Option 4", is_correct: false, display_order: 3 },
  ],
});

/**
 * Declare global type extension for window
 */
declare global {
  interface Window {
    scrollSyncTimer: NodeJS.Timeout | undefined;
  }
}

/**
 * Clears timers to prevent memory leaks
 */
export const clearScrollTimers = () => {
  if (window.scrollSyncTimer) {
    clearTimeout(window.scrollSyncTimer);
    window.scrollSyncTimer = undefined;
  }
};

/**
 * Updates option display order after reordering
 */
export const reorderOptions = (
  options: any[],
  sourceIndex: number,
  destinationIndex: number
) => {
  const result = [...options];
  const [removed] = result.splice(sourceIndex, 1);
  result.splice(destinationIndex, 0, removed);

  // Update display order indices
  return result.map((item, index) => ({
    ...item,
    display_order: index,
  }));
};
