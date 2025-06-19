/**
 * Custom hook for managing question options
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { activitiesApi } from '@/api-client';
import { Activity, QuizQuestion } from '../components/types';
import { reorderOptions } from '../utils/question-helpers';

export function useOptionOperations(
  questions: QuizQuestion[],
  setQuestions: (questions: QuizQuestion[]) => void,
  activeQuestionIndex: number,
  activity: Activity | null,
  timeLimit: number
) {
  /**
   * Handle option text/value changes
   */
  const handleOptionChange = async (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: any
  ) => {
    if (!activity) return;

    console.log(`Changing option ${optionIndex}, field ${field} to:`, value);

    // Create deep copies to avoid reference issues
    const updatedQuestions = JSON.parse(JSON.stringify(questions));
    const activeQuestion = updatedQuestions[questionIndex];

    // Skip updates for INFO_SLIDE type as they don't have options
    if (activity.activity_type_id === 'INFO_SLIDE') {
      console.log(
        `Updating INFO_SLIDE with options:`,
        activeQuestion.options || []
      );
      // Still update local state if needed
      setQuestions(updatedQuestions);
      return;
    }

    // Check if options array exists and has the required index
    if (
      !activeQuestion.options ||
      !Array.isArray(activeQuestion.options) ||
      activeQuestion.options.length <= optionIndex
    ) {
      console.error(`Option at index ${optionIndex} does not exist`);
      return;
    }

    // Special handling for multiple_choice and true_false questions - only one correct answer allowed
    if (
      field === 'is_correct' &&
      value === true &&
      (activeQuestion.question_type === 'multiple_choice' ||
        activeQuestion.question_type === 'true_false')
    ) {
      // First set all options to incorrect
      activeQuestion.options.forEach((opt: any) => {
        opt.is_correct = false;
      });
      // Then set just the selected one to correct
      activeQuestion.options[optionIndex][field] = value;
    } else {
      // For other question types or fields, just update normally
      activeQuestion.options[optionIndex][field] = value;
    }

    // Update local state
    setQuestions(updatedQuestions);

    try {
      const options = activeQuestion.options;
      console.log(
        `Updating ${activity.activity_type_id} with options:`,
        options
      );

      // Now handle API update based on question type
      switch (activity.activity_type_id) {
        case 'QUIZ_BUTTONS':
        case 'QUIZ_CHECKBOXES':
          await activitiesApi.updateCheckboxesQuiz(activity.id, {
            type: 'CHOICE',
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            answers: options.map(
              (opt: {
                option_text: string;
                is_correct: boolean;
                explanation: string;
              }) => ({
                answerText: opt.option_text,
                isCorrect: opt.is_correct,
                explanation: opt.explanation || '',
              })
            ),
          });
          console.log('API update successful for CHOICE question');
          break;

        case 'QUIZ_TRUE_OR_FALSE':
          const correctOption = options.find(
            (opt: { is_correct: boolean }) => opt.is_correct
          );
          await activitiesApi.updateTrueFalseQuiz(activity.id, {
            type: 'TRUE_FALSE',
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctAnswer: correctOption?.option_text.toLowerCase() === 'true',
          });
          console.log('API update successful for TRUE_FALSE question');
          break;

        case 'QUIZ_TYPE_ANSWER':
          // For text answer questions, use option_text as the correctAnswer
          const answerText = activeQuestion.options[0]?.option_text || 'Answer';
          await activitiesApi.updateTypeAnswerQuiz(activity.id, {
            type: 'TYPE_ANSWER',
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctAnswer: answerText,
          });
          console.log('API update successful for TYPE_ANSWER question');
          break;

        case 'QUIZ_REORDER':
          // For reorder questions, update with the current order
          await activitiesApi.updateReorderQuiz(activity.id, {
            type: 'REORDER',
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctOrder: options.map(
              (opt: { option_text: any }) => opt.option_text
            ),
          });
          console.log('API update successful for REORDER question');
          break;
      }

      console.log('Answer text updated successfully');
    } catch (error) {
      console.error('Error updating answer text:', error);
    }
  };

  /**
   * Handle reordering of options (specifically for reorder question type)
   */
  const handleReorderOptions = async (
    sourceIndex: number,
    destinationIndex: number
  ) => {
    if (!activity || activity.activity_type_id !== 'QUIZ_REORDER') return;

    const updatedQuestions = [...questions];
    const activeQuestion = updatedQuestions[activeQuestionIndex];

    // Use the reorderOptions utility to get the updated options
    const reorderedOptions = reorderOptions(
      activeQuestion.options,
      sourceIndex,
      destinationIndex
    );

    // Update the question with the new options array
    updatedQuestions[activeQuestionIndex] = {
      ...activeQuestion,
      options: reorderedOptions,
    };

    // Update state
    setQuestions(updatedQuestions);

    try {
      console.log('Updating reorder quiz with data:', {
        type: 'REORDER',
        questionText: activeQuestion.question_text,
        timeLimitSeconds: timeLimit,
        pointType: 'STANDARD',
        correctOrder: reorderedOptions.map((opt) => opt.option_text ?? ''),
      });

      const response = await activitiesApi.updateReorderQuiz(activity.id, {
        type: 'REORDER',
        questionText: activeQuestion.question_text,
        timeLimitSeconds: timeLimit,
        pointType: 'STANDARD',
        correctOrder: reorderedOptions.map((opt) => opt.option_text ?? ''),
      });

      console.log('Reorder update response:', response);
      console.log('Reorder steps updated successfully');
    } catch (error) {
      console.error('Error updating reorder steps:', error);
    }
  };

  /**
   * Add a new option to the current question
   */
  const handleAddOption = async () => {
    if (!activity) return;

    const updatedQuestions = [...questions];
    const activeQuestion = updatedQuestions[activeQuestionIndex];

    // Don't allow more than 8 options
    if (activeQuestion.options.length >= 8) {
      console.log("Maximum options reached: You can't add more than 8 options");

      return;
    }

    const newOptionIndex = activeQuestion.options.length;
    const newOption = {
      option_text: `Option ${newOptionIndex + 1}`,
      is_correct: false,
      display_order: newOptionIndex,
      explanation: '',
    };

    // Add the new option
    const updatedOptions = [...activeQuestion.options, newOption];
    updatedQuestions[activeQuestionIndex] = {
      ...activeQuestion,
      options: updatedOptions,
    };

    // Update state
    setQuestions(updatedQuestions);

    // Update API
    try {
      switch (activity.activity_type_id) {
        case 'QUIZ_BUTTONS':
          await activitiesApi.updateButtonsQuiz(activity.id, {
            type: 'CHOICE',
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            answers: updatedOptions.map((opt) => ({
              answerText: opt.option_text ?? '',
              isCorrect: opt.is_correct ?? false,
              explanation: opt.explanation || '',
            })),
          });
          break;

        case 'QUIZ_CHECKBOXES':
          await activitiesApi.updateCheckboxesQuiz(activity.id, {
            type: 'CHOICE',
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            answers: updatedOptions.map((opt) => ({
              answerText: opt.option_text ?? '',
              isCorrect: opt.is_correct ?? false,
              explanation: opt.explanation || '',
            })),
          });
          break;

        case 'QUIZ_REORDER':
          await activitiesApi.updateReorderQuiz(activity.id, {
            type: 'REORDER',
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctOrder: updatedOptions.map((opt) => opt.option_text ?? ''),
          });
          break;
      }

      console.log('New option added successfully');
    } catch (error) {
      console.error('Error adding option:', error);
    }
  };

  /**
   * Delete an option from the current question
   */
  const handleDeleteOption = async (optionIndex: number) => {
    if (!activity) return;

    const updatedQuestions = [...questions];
    const activeQuestion = updatedQuestions[activeQuestionIndex];

    // Don't allow fewer than 2 options for multiple choice questions
    if (
      activeQuestion.options.length <= 2 &&
      (activeQuestion.question_type === 'multiple_choice' ||
        activeQuestion.question_type === 'multiple_response')
    ) {
      console.log(
        'Minimum options required: You need at least 2 options for this question type'
      );

      return;
    }

    // Remove the option
    const updatedOptions = activeQuestion.options.filter(
      (_, idx) => idx !== optionIndex
    );

    // Ensure at least one option is marked as correct for multiple choice
    if (
      activeQuestion.question_type === 'multiple_choice' &&
      !updatedOptions.some((opt) => opt.is_correct)
    ) {
      updatedOptions[0] = { ...updatedOptions[0], is_correct: true };
    }

    // Update display order
    updatedOptions.forEach((opt, idx) => {
      updatedOptions[idx] = { ...opt, display_order: idx };
    });

    updatedQuestions[activeQuestionIndex] = {
      ...activeQuestion,
      options: updatedOptions,
    };

    // Update state
    setQuestions(updatedQuestions);

    // Update API
    try {
      switch (activity.activity_type_id) {
        case 'QUIZ_BUTTONS':
          await activitiesApi.updateButtonsQuiz(activity.id, {
            type: 'CHOICE',
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            answers: updatedOptions.map((opt) => ({
              answerText: opt.option_text ?? '',
              isCorrect: opt.is_correct ?? false,
              explanation: opt.explanation || '',
            })),
          });
          break;

        case 'QUIZ_CHECKBOXES':
          await activitiesApi.updateCheckboxesQuiz(activity.id, {
            type: 'CHOICE',
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            answers: updatedOptions.map((opt) => ({
              answerText: opt.option_text ?? '',
              isCorrect: opt.is_correct ?? false,
              explanation: opt.explanation || '',
            })),
          });
          break;

        case 'QUIZ_REORDER':
          await activitiesApi.updateReorderQuiz(activity.id, {
            type: 'REORDER',
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctOrder: updatedOptions.map((opt) => opt.option_text ?? ''),
          });
          break;
      }

      console.log('Option deleted successfully');
    } catch (error) {
      console.error('Error deleting option:', error);
    }
  };

  /**
   * Update the correct answer text (for text answer questions)
   */
  const handleCorrectAnswerChange = async (value: string) => {
    if (!activity) return;

    console.log('Updating correct answer text to:', value);

    // Create a deep copy of the questions array
    const updatedQuestions = JSON.parse(JSON.stringify(questions));

    // Update the correct_answer_text for the active question
    updatedQuestions[activeQuestionIndex].correct_answer_text = value;

    // Update the local state immediately
    setQuestions(updatedQuestions);

    try {
      // Call API to update the answer
      if (activity.activity_type_id === 'QUIZ_TYPE_ANSWER') {
        const response = await activitiesApi.updateTypeAnswerQuiz(activity.id, {
          type: 'TYPE_ANSWER',
          questionText: updatedQuestions[activeQuestionIndex].question_text,
          timeLimitSeconds: timeLimit,
          pointType: 'STANDARD',
          correctAnswer: value,
        });

        console.log('Successfully updated text answer question:', response);
      }
    } catch (error) {
      console.error('Error updating correct answer:', error);
    }
  };

  /**
   * Update content of a reorder option
   */
  const updateReorderOptionContent = async (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    if (!activity || activity.activity_type_id !== 'QUIZ_REORDER') return;

    // First update local state
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex].option_text = value;
    setQuestions(updatedQuestions);

    try {
      const activeQuestion = updatedQuestions[questionIndex];

      await activitiesApi.updateReorderQuiz(activity.id, {
        type: 'REORDER',
        questionText: activeQuestion.question_text,
        timeLimitSeconds: timeLimit,
        pointType: 'STANDARD',
        correctOrder: activeQuestion.options.map(
          (opt) => opt.option_text ?? ''
        ),
      });

      console.log('API update successful for REORDER question option');
    } catch (error) {
      console.error('Error updating reorder option:', error);
    }
  };

  return {
    handleOptionChange,
    handleReorderOptions,
    handleAddOption,
    handleDeleteOption,
    handleCorrectAnswerChange,
    updateReorderOptionContent,
  };
}
