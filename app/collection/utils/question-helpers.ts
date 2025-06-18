/**
 * Helper utilities for question management
 */
import { QuizQuestion } from '../components/types';

/**
 * Creates an empty question with default options
 */
export const createEmptyQuestion = (
  actId: string,
  questionType?: QuizQuestion['question_type']
): QuizQuestion => {
  // Create base question with common properties
  const baseQuestion: QuizQuestion = {
    id: actId, // Just use activity ID as question ID for simplicity
    activity_id: actId,
    question_text: '',
    question_type: questionType || 'multiple_choice',
    correct_answer_text: '',
    options: [],
  };

  // Set type-specific defaults
  switch (baseQuestion.question_type) {
    case 'slide':
      return {
        ...baseQuestion,
        // question_text: "Information Slide",
        // slide_content: "Add slide content here...",
        //options: [],
      };

    case 'info_slide':
      return {
        ...baseQuestion,
        // question_text: "Interactive Info Slide",
        // slide_content: "Add interactive content here...",
        //options: [],
      };

    case 'text_answer':
      return {
        ...baseQuestion,
        question_text: 'Text Question',
        correct_answer_text: 'Answer',
        options: [],
      };

    case 'true_false':
      return {
        ...baseQuestion,
        question_text: 'True/False Question',
        options: [
          { option_text: 'True', is_correct: true, display_order: 0 },
          { option_text: 'False', is_correct: false, display_order: 1 },
        ],
      };

    case 'reorder':
      return {
        ...baseQuestion,
        question_text: 'Order the steps correctly',
        options: [
          { option_text: 'Step 1', is_correct: false, display_order: 0 },
          { option_text: 'Step 2', is_correct: false, display_order: 1 },
          { option_text: 'Step 3', is_correct: false, display_order: 2 },
          { option_text: 'Step 4', is_correct: false, display_order: 3 },
        ],
      };

    case 'matching_pair':
      return {
        ...baseQuestion,
        question_type: 'MATCHING_PAIRS',
        question_text: 'Matching Pairs Question',
        options: [
          {
            id: 'pair-1',
            left_text: 'Left Item 1',
            right_text: 'Right Item 1',
            is_correct: true,
            pair_id: 'pair-1',
            display_order: 0,
            option_text: '',
          },
          {
            id: 'pair-2',
            left_text: 'Left Item 2',
            right_text: 'Right Item 2',
            is_correct: true,
            pair_id: 'pair-2',
            display_order: 1,
            option_text: '',
          },
        ],
      };

    default:
      return {
        ...baseQuestion,
        question_text: 'Multiple Choice Question',
        options: [
          { option_text: 'Option 1', is_correct: true, display_order: 0 },
          { option_text: 'Option 2', is_correct: false, display_order: 1 },
          { option_text: 'Option 3', is_correct: false, display_order: 2 },
          { option_text: 'Option 4', is_correct: false, display_order: 3 },
        ],
      };
  }
};

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
