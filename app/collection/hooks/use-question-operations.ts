/**
 * Custom hook for question operations
 */

import { useState } from 'react';
import { activitiesApi } from '@/api-client';
import { Activity, QuizQuestion } from '../components/types';
import { createEmptyQuestion } from '../utils/question-helpers';
import { mapQuestionTypeToActivityType } from '../utils/question-type-mapping';
import { CollectionService } from '../services/collection-service';
import type { ActivityType } from '@/api-client/activities-api';

// Define activity type constants instead of using enum
export const ACTIVITY_TYPES = {
  QUIZ_BUTTONS: 'QUIZ_BUTTONS',
  QUIZ_CHECKBOXES: 'QUIZ_CHECKBOXES',
  QUIZ_TRUE_OR_FALSE: 'QUIZ_TRUE_OR_FALSE',
  QUIZ_TYPE_ANSWER: 'QUIZ_TYPE_ANSWER',
  QUIZ_REORDER: 'QUIZ_REORDER',
  INFO_SLIDE: 'INFO_SLIDE',
  INFO_SLIDE_INTERACTIVE: 'INFO_SLIDE_INTERACTIVE',
  QUIZ_LOCATION: 'QUIZ_LOCATION',
} as const;

export function useQuestionOperations(
  collectionId: string,
  activities: Activity[],
  setActivities: (activities: Activity[]) => void,
  questions: QuizQuestion[],
  setQuestions: (questions: QuizQuestion[]) => void,
  activeQuestionIndex: number,
  setActiveQuestionIndex: (index: number) => void,
  activity: Activity | null,
  setActivity: (activity: Activity | null) => void,
  refreshCollectionData: () => Promise<void>,
  refreshMatchingPairData?: (activityId: string) => Promise<void>
) {
  const [timeLimit, setTimeLimit] = useState(30); // seconds

  /**
   * Add a new question to the collection
   */
  const handleAddQuestion = async (
    questionType: QuizQuestion['question_type'] = 'multiple_choice'
  ) => {
    try {
      // Find highest orderIndex to determine new activity's position
      const highestOrderIndex = activities.reduce((max, act) => {
        const orderIndex =
          typeof act.orderIndex === 'number' ? act.orderIndex : 0;
        return Math.max(max, orderIndex);
      }, -1);

      // Prepare payload
      const payload = {
        collectionId: collectionId,

        activityType:
          questionType === 'matching_pair'
            ? ('QUIZ_MATCHING_PAIRS' as ActivityType)
            : (ACTIVITY_TYPES.QUIZ_BUTTONS as ActivityType),
        title: 'New Question',
        description: 'This is a new question',

        isPublished: true,
        orderIndex: highestOrderIndex + 1,
      };

      let response;
      if (questionType === 'matching_pair') {
        response = await CollectionService.createMatchingPairActivity(payload);
      } else {
        response = await activitiesApi.createActivity(payload);
      }

      if (response && response.data && response.data.data) {
        const newActivityData = response.data.data;
        // Fetch full activity detail for matching pair
        let activityDetail = newActivityData;
        if (questionType === 'matching_pair') {
          const detailRes = await activitiesApi.getActivityById(
            newActivityData.activityId
          );
          if (detailRes && detailRes.data && detailRes.data.data) {
            activityDetail = detailRes.data.data;
          }
        }
        // Add the new activity to our local state
        const newActivity: Activity = {
          id: activityDetail.activityId,
          title: activityDetail.title,
          collection_id: collectionId,

          description: activityDetail.description,
          is_published: activityDetail.isPublished,
          activity_type_id: activityDetail.activityType,
          orderIndex: activityDetail.orderIndex || highestOrderIndex + 1,
          createdAt: activityDetail.createdAt,
          updatedAt: activityDetail.updatedAt,
          createdBy: activityDetail.createdBy || '',
          quiz: activityDetail.quiz,
        };
        const updatedActivities = [...activities, newActivity];
        setActivities(updatedActivities);
        // Map activity to question (follow use-collection-data.ts logic)
        let newQuestion: QuizQuestion;
        if (
          questionType === 'matching_pair' &&
          activityDetail.quiz?.quizMatchingPairAnswer
        ) {
          const matchingData = activityDetail.quiz.quizMatchingPairAnswer;
          newQuestion = {
            id: activityDetail.activityId,
            activity_id: activityDetail.activityId,
            question_text:
              activityDetail.quiz.questionText || activityDetail.title || '',
            question_type: 'matching_pair',
            correct_answer_text: '',
            options: (matchingData.items || []).map((item: any) => ({
              id: item.quizMatchingPairItemId,
              quizMatchingPairItemId: item.quizMatchingPairItemId,
              content: item.content,
              isLeftColumn: item.isLeftColumn,
              display_order: item.displayOrder || 0,
            })),
            matching_data: matchingData,
            quizMatchingPairAnswer: matchingData,
            time_limit_seconds: activityDetail.quiz.timeLimitSeconds,
            pointType: activityDetail.quiz.pointType || 'STANDARD',
          };
        } else {
          newQuestion = createEmptyQuestion(
            activityDetail.activityId,
            questionType
          );
        }
        const updatedQuestions: QuizQuestion[] = [...questions, newQuestion];
        setQuestions(updatedQuestions);
        setActivity(newActivity);
        setActiveQuestionIndex(updatedQuestions.length - 1);

        // Update API with default quiz data
        await activitiesApi.updateButtonsQuiz(newActivityData.activityId, {
          type: 'CHOICE',
          questionText: 'Default question',
          timeLimitSeconds: 30,
          pointType: 'STANDARD',
          answers: [
            { answerText: 'Option 1', isCorrect: true, explanation: 'Correct' },
            {
              answerText: 'Option 2',
              isCorrect: false,
              explanation: 'Incorrect',
            },
            {
              answerText: 'Option 3',
              isCorrect: false,
              explanation: 'Incorrect',
            },
            {
              answerText: 'Option 4',
              isCorrect: false,
              explanation: 'Incorrect',
            },
          ],
        });

        // Remove the call to refreshCollectionData to prevent page reload
        // This is not needed since we've already updated our local state
      }
    } catch (error) {
      console.error('Error adding question:', error);
    }
  };

  /**
   * Delete a question from the collection
   */
  const handleDeleteQuestion = async (index: number) => {
    if (!activity || questions.length <= 1) {
      return;
    }

    try {
      const activityIdToDelete = questions[index].activity_id;
      await activitiesApi.deleteActivity(activityIdToDelete);

      // Update local state
      const updatedQuestions = [...questions];
      updatedQuestions.splice(index, 1);
      setQuestions(updatedQuestions);

      // Update activities state to remove the deleted activity
      setActivities(activities.filter((a) => a.id !== activityIdToDelete));

      // Clear the current activity if it was deleted
      if (activity && activity.id === activityIdToDelete) {
        setActivity(null);
      }

      // If we deleted the active question, adjust the active index
      if (activeQuestionIndex >= updatedQuestions.length) {
        setActiveQuestionIndex(Math.max(0, updatedQuestions.length - 1));
      } else if (index === activeQuestionIndex && index > 0) {
        setActiveQuestionIndex(index - 1);
      }

      // Use immediate async function to ensure state updates before refresh
      (async () => {
        // Wait a short moment for state updates to propagate
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Refresh collection data to ensure UI is updated correctly
        refreshCollectionData();
      })();
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  // Add to the hook's return value
  const handleQuestionLocationChange = (
    questionIndex: number,
    locationData: any
  ) => {
    if (questionIndex < 0 || questionIndex >= questions.length) return;

    const existingQuestion = questions[questionIndex];

    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      location_data: {
        ...(updatedQuestions[questionIndex].location_data || {
          lat: 0,
          lng: 0,
          radius: 0,
        }),
        quizLocationAnswers: Array.isArray(locationData)
          ? locationData
          : [locationData],
      },
    };
    setQuestions(updatedQuestions);

    const questionActivityId = existingQuestion.activity_id || activity?.id;

    if (questionActivityId) {
      if (typeof window !== 'undefined') {
        if (window.updateQuestionTimer) {
          clearTimeout(window.updateQuestionTimer);
        }
        window.updateQuestionTimer = setTimeout(() => {
          // Preserve existing radius from the question's current location data during drag and drop
          const locationAnswers = Array.isArray(locationData)
            ? locationData.map((location, index) => {
                console.log(
                  `🔧 [useQuestionOps] Processing location ${index}:`,
                  location
                );

                // Debug existing question data
                const existingLocation =
                  existingQuestion.location_data?.quizLocationAnswers?.[index];
                console.log(
                  `🔧 [useQuestionOps] Existing location ${index}:`,
                  existingLocation
                );
                console.log(
                  `🔧 [useQuestionOps] All existing locations:`,
                  existingQuestion.location_data?.quizLocationAnswers
                );

                // Use the radius from locationData if it exists, otherwise fallback to existing data
                let finalRadius = 10; // default fallback

                if (
                  typeof location.radius === 'number' &&
                  location.radius > 0
                ) {
                  // Use the radius from the incoming location data
                  finalRadius = location.radius;
                  console.log(
                    `🔧 [useQuestionOps] Using incoming radius: ${finalRadius}`
                  );
                } else {
                  // Try to preserve from existing question state
                  if (
                    existingLocation &&
                    typeof existingLocation.radius === 'number' &&
                    existingLocation.radius > 0
                  ) {
                    finalRadius = existingLocation.radius;
                    console.log(
                      `🔧 [useQuestionOps] Preserving existing radius: ${finalRadius}`
                    );
                  } else {
                    console.log(
                      `🔧 [useQuestionOps] No existing radius found, using default: ${finalRadius}`
                    );
                  }
                }

                console.log(
                  `🔧 [useQuestionOps] Location ${index} radius: ${location.radius} -> ${finalRadius}`
                );

                return {
                  longitude: location.longitude,
                  latitude: location.latitude,
                  radius: finalRadius,
                };
              })
            : [
                {
                  longitude: locationData.lng || locationData.longitude || 0,
                  latitude: locationData.lat || locationData.latitude || 0,
                  radius:
                    locationData.radius !== undefined
                      ? locationData.radius
                      : (function () {
                          const existingRadius =
                            existingQuestion.location_data
                              ?.quizLocationAnswers?.[0]?.radius;
                          return typeof existingRadius === 'number' &&
                            existingRadius > 0
                            ? existingRadius
                            : 10;
                        })(),
                },
              ];

          console.log(`🔧 [useQuestionOps] Sending to API:`, locationAnswers);

          activitiesApi
            .updateLocationQuiz(questionActivityId, {
              type: 'LOCATION',
              questionText:
                existingQuestion.question_text || 'Location question',
              timeLimitSeconds: timeLimit,
              pointType:
                (locationData.pointType as any) ||
                existingQuestion.location_data?.pointType ||
                'STANDARD',
              locationAnswers,
            })
            .catch((error) => {
              console.error('Error updating location quiz:', error);
            });
        }, 500);
      }
    }
  };

  /**
   * Delete an activity by ID
   */
  const handleDeleteActivity = async (activityId: string) => {
    try {
      await activitiesApi.deleteActivity(activityId);

      // Update local state
      setActivities(activities.filter((a) => a.id !== activityId));

      // Refresh collection data
      refreshCollectionData();
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  /**
   * Handle changing the question type
   */
  const handleQuestionTypeChange = async (
    value: QuizQuestion['question_type'],
    questionIndex: number
  ) => {
    try {
      console.log(
        '🔄 Changing question type to:',
        value,
        'for question:',
        questionIndex
      );

      const targetActivity = activities.find(
        (act) => act.id === questions[questionIndex].activity_id
      );

      if (!targetActivity) {
        console.error('❌ No activity found for question:', questionIndex);
        return;
      }

      // Make sure we're working with the correct activity
      if (!activity || activity.id !== targetActivity.id) {
        setActivity(targetActivity);
        // Wait briefly for state to update before proceeding
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      // Map our internal question type to API activity type
      const activityType = mapQuestionTypeToActivityType(value);

      // Update the activity type in the API
      await activitiesApi.updateActivity(targetActivity.id, {
        activityType: activityType as ActivityType,
      });

      // Update local state for the activity
      const updatedActivities = activities.map((act) =>
        act.id === targetActivity.id
          ? { ...act, activity_type_id: activityType }
          : act
      );
      setActivities(updatedActivities);

      // Update the question type in local state
      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        question_type: value,
      };

      // Handle specific question type conversions
      switch (value) {
        case 'multiple_choice':
        case 'multiple_response':
          // Ensure we have at least 2 options for multiple choice
          if (
            !updatedQuestions[questionIndex].options ||
            updatedQuestions[questionIndex].options.length < 2
          ) {
            updatedQuestions[questionIndex].options = [
              {
                option_text: 'Option 1',
                is_correct: true,
                display_order: 0,
                explanation: '',
              },
              {
                option_text: 'Option 2',
                is_correct: false,
                display_order: 1,
                explanation: '',
              },
            ];
          }
          // Ensure exactly one option is correct for multiple choice
          if (value === 'multiple_choice') {
            updatedQuestions[questionIndex].options.forEach((opt, idx) => {
              opt.is_correct = idx === 0; // First option is correct by default
            });
          }
          break;

        case 'true_false':
          // Set up true/false options
          updatedQuestions[questionIndex].options = [
            {
              option_text: 'True',
              is_correct: true,
              display_order: 0,
              explanation: '',
            },
            {
              option_text: 'False',
              is_correct: false,
              display_order: 1,
              explanation: '',
            },
          ];
          break;

        case 'text_answer':
          // Set up text answer question
          updatedQuestions[questionIndex].options = [
            {
              option_text: 'Answer',
              is_correct: true,
              display_order: 0,
              explanation: '',
            },
          ];
          updatedQuestions[questionIndex].correct_answer_text = 'Answer';
          break;

        case 'reorder':
          // Set up reorder question with default options
          updatedQuestions[questionIndex].options = [
            {
              option_text: 'First',
              is_correct: false,
              display_order: 0,
              explanation: '',
            },
            {
              option_text: 'Second',
              is_correct: false,
              display_order: 1,
              explanation: '',
            },
            {
              option_text: 'Third',
              is_correct: false,
              display_order: 2,
              explanation: '',
            },
          ];
          break;

        case 'matching_pair':
          // Set up matching pair question
          updatedQuestions[questionIndex].quizMatchingPairAnswer = {
            quizMatchingPairAnswerId: '',
            leftColumnName: 'Column A',
            rightColumnName: 'Column B',
            items: [
              {
                quizMatchingPairItemId: '',
                content: 'Item 1',
                isLeftColumn: true,
                displayOrder: 0,
              },
              {
                quizMatchingPairItemId: '',
                content: 'Item 2',
                isLeftColumn: true,
                displayOrder: 1,
              },
              {
                quizMatchingPairItemId: '',
                content: 'Match 1',
                isLeftColumn: false,
                displayOrder: 0,
              },
              {
                quizMatchingPairItemId: '',
                content: 'Match 2',
                isLeftColumn: false,
                displayOrder: 1,
              },
            ],
            connections: [],
          };
          break;

        case 'location':
          // Set up location question
          updatedQuestions[questionIndex].location_data = {
            lat: 21.0285,
            lng: 105.8048,
            radius: 10,
            quizLocationAnswers: [
              {
                quizLocationAnswerId: '',
                longitude: 105.8048,
                latitude: 21.0285,
                radius: 10,
              },
            ],
          };
          break;

        case 'info_slide':
          // Clear options for info slide
          updatedQuestions[questionIndex].options = [];
          updatedQuestions[questionIndex].slide_content =
            'Enter your content here';
          break;
      }

      // Update the questions state
      setQuestions(updatedQuestions);

      // Update the active question index if needed
      if (questionIndex === activeQuestionIndex) {
        setActiveQuestionIndex(questionIndex);
      }

      // Update the API with the new question data based on type
      const currentQuestion = updatedQuestions[questionIndex];

      switch (activityType) {
        case 'QUIZ_BUTTONS':
          await activitiesApi.updateButtonsQuiz(targetActivity.id, {
            type: 'CHOICE',
            questionText: currentQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            answers: currentQuestion.options.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || '',
            })),
          });
          break;

        case 'QUIZ_CHECKBOXES':
          await activitiesApi.updateCheckboxesQuiz(targetActivity.id, {
            type: 'CHOICE',
            questionText: currentQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            answers: currentQuestion.options.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || '',
            })),
          });
          break;

        case 'QUIZ_TRUE_OR_FALSE':
          const correctOption = currentQuestion.options.find(
            (opt) => opt.is_correct
          );
          await activitiesApi.updateTrueFalseQuiz(targetActivity.id, {
            type: 'TRUE_FALSE',
            questionText: currentQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctAnswer: correctOption?.option_text.toLowerCase() === 'true',
          });
          break;

        case 'QUIZ_TYPE_ANSWER':
          await activitiesApi.updateTypeAnswerQuiz(targetActivity.id, {
            type: 'TYPE_ANSWER',
            questionText: currentQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctAnswer: currentQuestion.correct_answer_text || 'Answer',
          });
          break;

        case 'QUIZ_REORDER':
          await activitiesApi.updateReorderQuiz(targetActivity.id, {
            type: 'REORDER',
            questionText: currentQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctOrder: currentQuestion.options.map((opt) => opt.option_text),
          });
          break;

        case 'QUIZ_MATCHING_PAIRS':
          if (currentQuestion.quizMatchingPairAnswer) {
            await activitiesApi.updateMatchingPairQuiz(targetActivity.id, {
              type: 'MATCHING_PAIRS',
              questionText: currentQuestion.question_text,
              timeLimitSeconds: timeLimit,
              pointType: 'STANDARD',
              leftColumnName:
                currentQuestion.quizMatchingPairAnswer.leftColumnName,
              rightColumnName:
                currentQuestion.quizMatchingPairAnswer.rightColumnName,
              quizMatchingPairAnswer: currentQuestion.quizMatchingPairAnswer,
            });
          }
          break;

        case 'QUIZ_LOCATION':
          if (currentQuestion.location_data?.quizLocationAnswers) {
            await activitiesApi.updateLocationQuiz(targetActivity.id, {
              type: 'LOCATION',
              questionText: currentQuestion.question_text,
              timeLimitSeconds: timeLimit,
              pointType: 'STANDARD',
              locationAnswers:
                currentQuestion.location_data.quizLocationAnswers.map(
                  (answer) => ({
                    longitude: answer.longitude,
                    latitude: answer.latitude,
                    radius: answer.radius,
                  })
                ),
            });
          }
          break;
      }

      console.log('✅ Question type changed successfully to:', value);
    } catch (error) {
      console.error('Error updating question type:', error);
    }
  };

  /**
   * Change the text of a question
   */
  const handleQuestionTextChange = async (
    value: string,
    questionIndex: number,
    isTyping: boolean = false
  ) => {
    if (!activity) return;

    // Get the actual activity ID from the questions array to ensure accuracy
    const targetActivityId = questions[questionIndex].activity_id;

    // Make sure we're updating the right activity
    if (targetActivityId !== activity.id) {
      // Find the correct activity from the activities array
      const correctActivity = activities.find((a) => a.id === targetActivityId);
      if (!correctActivity) {
        console.error('Activity not found in activities array');
        return;
      }
      // Update activity reference to ensure we're working with the right activity
      setActivity(correctActivity);
    }

    // Update local state
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      question_text: value,
    };
    setQuestions(updatedQuestions);

    // If not the active index, don't update API
    if (questionIndex !== activeQuestionIndex) return;

    if (isTyping) return;

    try {
      const activityType = activity.activity_type_id;
      const activeQuestion = updatedQuestions[activeQuestionIndex];

      switch (activityType) {
        case 'QUIZ_BUTTONS':
          await activitiesApi.updateButtonsQuiz(activity.id, {
            type: 'CHOICE',
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            answers: activeQuestion.options.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || '',
            })),
          });
          break;

        case 'QUIZ_CHECKBOXES':
          await activitiesApi.updateCheckboxesQuiz(activity.id, {
            type: 'CHOICE',
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            answers: activeQuestion.options.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || '',
            })),
          });
          break;

        case 'QUIZ_TRUE_OR_FALSE':
          const correctOption = activeQuestion.options.find(
            (opt) => opt.is_correct
          );
          await activitiesApi.updateTrueFalseQuiz(activity.id, {
            type: 'TRUE_FALSE',
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctAnswer: correctOption?.option_text.toLowerCase() === 'true',
          });
          break;

        case 'QUIZ_TYPE_ANSWER':
          await activitiesApi.updateTypeAnswerQuiz(activity.id, {
            type: 'TYPE_ANSWER',
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctAnswer: activeQuestion.correct_answer_text || 'Answer',
          });
          break;

        case 'QUIZ_REORDER':
          await activitiesApi.updateReorderQuiz(activity.id, {
            type: 'REORDER',
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctOrder: activeQuestion.options.map((opt) => opt.option_text),
          });
          break;
      }
    } catch (error) {
      console.error('Error updating question text:', error);
    }
  };

  // Update the time limit for the current question
  const handleTimeLimitChange = (value: number) => {
    const questionIndex = activeQuestionIndex;
    if (questionIndex < 0 || !questions[questionIndex]) return;

    // Update the local timeLimit state
    setTimeLimit(value);

    // Clone the questions array to avoid direct state mutation
    const updatedQuestions = [...questions];
    const updatedQuestion = { ...questions[questionIndex], time_limit: value };
    updatedQuestions[questionIndex] = updatedQuestion;

    // Update the local state
    setQuestions(updatedQuestions);

    // Call API to update the time limit
    const questionId = questions[questionIndex].id;
    if (questionId && !questionId.startsWith('temp-') && activity) {
      // Debounce API calls for time limit changes
      if (window.updateQuestionTimer) {
        clearTimeout(window.updateQuestionTimer);
      }

      window.updateQuestionTimer = setTimeout(async () => {
        try {
          // Call API to update the question based on its type
          const activeQuestion = updatedQuestion;
          const activityType = activity.activity_type_id;

          // Selectively call the appropriate API method
          switch (activityType) {
            case 'QUIZ_BUTTONS':
              await activitiesApi.updateButtonsQuiz(activity.id, {
                type: 'CHOICE',
                questionText: activeQuestion.question_text,
                timeLimitSeconds: value,
                pointType: 'STANDARD',
                answers: activeQuestion.options.map((opt) => ({
                  answerText: opt.option_text,
                  isCorrect: opt.is_correct,
                  explanation: opt.explanation || '',
                })),
              });
              break;
            case 'QUIZ_CHECKBOXES':
              await activitiesApi.updateCheckboxesQuiz(activity.id, {
                type: 'CHOICE',
                questionText: activeQuestion.question_text,
                timeLimitSeconds: value,
                pointType: 'STANDARD',
                answers: activeQuestion.options.map((opt) => ({
                  answerText: opt.option_text,
                  isCorrect: opt.is_correct,
                  explanation: opt.explanation || '',
                })),
              });
              break;
            case 'QUIZ_TRUE_OR_FALSE':
              const correctOption = activeQuestion.options.find(
                (opt) => opt.is_correct
              );
              await activitiesApi.updateTrueFalseQuiz(activity.id, {
                type: 'TRUE_FALSE',
                questionText: activeQuestion.question_text,
                timeLimitSeconds: value,
                pointType: 'STANDARD',
                correctAnswer:
                  correctOption?.option_text.toLowerCase() === 'true',
              });
              break;
            case 'QUIZ_TYPE_ANSWER':
              await activitiesApi.updateTypeAnswerQuiz(activity.id, {
                type: 'TYPE_ANSWER',
                questionText: activeQuestion.question_text,
                timeLimitSeconds: value,
                pointType: 'STANDARD',
                correctAnswer: activeQuestion.correct_answer_text || '',
              });
              break;
            case 'QUIZ_REORDER':
              await activitiesApi.updateReorderQuiz(activity.id, {
                type: 'REORDER',
                questionText: activeQuestion.question_text,
                timeLimitSeconds: value,
                pointType: 'STANDARD',
                correctOrder: activeQuestion.options.map(
                  (opt) => opt.option_text
                ),
              });
              break;
            case 'QUIZ_LOCATION':
              if (activeQuestion.location_data || activity?.quiz) {
                // Debug: Log available data sources
                console.log('🔍 Location data sources for time limit update:');
                console.log(
                  '- activity.quiz.quizLocationAnswers:',
                  activity?.quiz?.quizLocationAnswers
                );
                console.log(
                  '- activeQuestion.location_data.quizLocationAnswers:',
                  activeQuestion.location_data?.quizLocationAnswers
                );
                console.log(
                  '- activeQuestion.location_data:',
                  activeQuestion.location_data
                );
                console.log('- questions array:', questions);
                console.log('- activeQuestionIndex:', activeQuestionIndex);

                // Helper function to get the most reliable location data
                const getLocationAnswers = () => {
                  // 1. Try from activity.quiz (API response data)
                  if (
                    activity?.quiz?.quizLocationAnswers &&
                    activity.quiz.quizLocationAnswers.length > 0
                  ) {
                    console.log('✅ Found location answers in activity.quiz');
                    return activity.quiz.quizLocationAnswers.map(
                      (answer: any) => ({
                        longitude: answer.longitude,
                        latitude: answer.latitude,
                        radius: answer.radius,
                      })
                    );
                  }

                  // 2. Try from activeQuestion.location_data
                  if (
                    activeQuestion.location_data?.quizLocationAnswers &&
                    activeQuestion.location_data.quizLocationAnswers.length > 0
                  ) {
                    console.log(
                      '✅ Found location answers in activeQuestion.location_data'
                    );
                    return activeQuestion.location_data.quizLocationAnswers.map(
                      (answer: any) => ({
                        longitude: answer.longitude,
                        latitude: answer.latitude,
                        radius: answer.radius,
                      })
                    );
                  }

                  // 3. Try from questions array (most current UI state)
                  if (
                    questions &&
                    questions[activeQuestionIndex] &&
                    questions[activeQuestionIndex].location_data
                      ?.quizLocationAnswers
                  ) {
                    const currentQuestion = questions[activeQuestionIndex];
                    if (
                      currentQuestion.location_data &&
                      currentQuestion.location_data.quizLocationAnswers &&
                      currentQuestion.location_data.quizLocationAnswers.length >
                        0
                    ) {
                      console.log(
                        '✅ Found location answers in questions array'
                      );
                      return currentQuestion.location_data.quizLocationAnswers.map(
                        (answer: any) => ({
                          longitude: answer.longitude,
                          latitude: answer.latitude,
                          radius: answer.radius,
                        })
                      );
                    }
                  }

                  // 4. Last resort - create single fallback location
                  console.warn(
                    '❌ No existing location answers found anywhere, creating fallback'
                  );
                  return [
                    {
                      longitude:
                        activeQuestion.location_data?.lng ||
                        activity?.quiz?.longitude ||
                        105.804817,
                      latitude:
                        activeQuestion.location_data?.lat ||
                        activity?.quiz?.latitude ||
                        21.028511,
                      radius:
                        activeQuestion.location_data?.radius ||
                        activity?.quiz?.radius ||
                        10,
                    },
                  ];
                };

                const locationAnswers = getLocationAnswers();
                console.log(
                  '🚀 Final location answers for API:',
                  locationAnswers
                );

                await activitiesApi.updateLocationQuiz(activity.id, {
                  type: 'LOCATION',
                  questionText:
                    activeQuestion.question_text || 'Location question',
                  timeLimitSeconds: value,
                  pointType:
                    (activeQuestion.location_data?.pointType as
                      | 'STANDARD'
                      | 'NO_POINTS'
                      | 'DOUBLE_POINTS') || 'STANDARD',
                  locationAnswers,
                });
              }
              break;
            default:
              // For other activity types like slides, we can't set time directly in the API
              // So just update the local state and log a message
              break;
          }
        } catch (error) {
          console.error('Error updating question time limit:', error);
        }
      }, 500);
    }
  };

  /**
   * Add a new location question to the collection
   */
  const handleAddLocationQuestion = async (pointType: string = 'STANDARD') => {
    try {
      // Find highest orderIndex to determine new activity's position
      const highestOrderIndex = activities.reduce((max, act) => {
        const orderIndex =
          typeof act.orderIndex === 'number' ? act.orderIndex : 0;
        return Math.max(max, orderIndex);
      }, -1);

      // Create a new location activity in the collection
      const payload = {
        collectionId: collectionId,
        activityType: ACTIVITY_TYPES.QUIZ_LOCATION,
        title: 'New Location Quiz',
        description: 'Find the location on the map',
        isPublished: true,
        backgroundColor: '#FFFFFF',
        orderIndex: highestOrderIndex + 1,
      };

      // Create the activity first
      const response = await CollectionService.createLocationQuizActivity(
        payload
      );

      if (response && response.data && response.data.data) {
        // Get the new activity data
        const newActivityData = response.data.data;

        // Add the new activity to our local state
        const newActivity: Activity = {
          id: newActivityData.activityId,
          title: newActivityData.title,
          collection_id: collectionId,
          description: newActivityData.description,
          is_published: newActivityData.isPublished,
          activity_type_id: newActivityData.activityType,
          backgroundColor: newActivityData.backgroundColor || '#FFFFFF',
          orderIndex: newActivityData.orderIndex || highestOrderIndex + 1,
          createdAt: newActivityData.createdAt,
          updatedAt: newActivityData.createdAt,
          createdBy: newActivityData.createdBy || '',
        };

        // Update activities array
        const updatedActivities = [...activities, newActivity];
        setActivities(updatedActivities);

        // Create a default location in the center of the map
        const defaultLocationData = {
          lat: 21.0285, // Default latitude (Hanoi)
          lng: 105.8048, // Default longitude
          radius: 10, // Default radius in km
          hint: 'Find this location on the map',
          pointType: pointType, // Add pointType
        };

        // Create a new question for this activity
        const newQuestion: QuizQuestion = {
          id: newActivityData.activityId,
          activity_id: newActivityData.activityId,
          question_text: 'Where is this location?',
          question_type: 'location',
          correct_answer_text: '',
          options: [],
          location_data: defaultLocationData,
        };

        // Add the new question at the end of the questions array
        const updatedQuestions = [...questions, newQuestion];
        setQuestions(updatedQuestions);

        // Set this as current activity
        setActivity(newActivity);

        // Set the active question index to the new question
        setActiveQuestionIndex(updatedQuestions.length - 1);

        // Update API with the location data
        await activitiesApi.updateLocationQuiz(newActivityData.activityId, {
          type: 'LOCATION',
          questionText: 'Where is this location?',
          timeLimitSeconds: timeLimit,
          pointType: pointType as 'STANDARD' | 'NO_POINTS' | 'DOUBLE_POINTS',
          locationAnswers: [
            {
              longitude: defaultLocationData.lng,
              latitude: defaultLocationData.lat,
              radius: defaultLocationData.radius,
            },
          ],
        });
      }
    } catch (error) {
      console.error('Error adding location question:', error);
    }
  };

  const handleMatchingPairChange = async (
    questionIndex: number,
    newMatchingData: {
      leftColumnName?: string;
      rightColumnName?: string;
      items?: any[];
      connections?: any[];
    }
  ) => {
    const question = questions[questionIndex];
    const activityId = question.activity_id;
    console.log(activityId);
    if (!activityId) return;

    // Gọi API để cập nhật matching pair
    try {
      const response = await activitiesApi.updateMatchingPairQuiz(activityId, {
        type: 'MATCHING_PAIRS',
        questionText: question.question_text || 'Matching pair question',
        timeLimitSeconds: timeLimit,
        pointType: 'STANDARD',
        leftColumnName:
          newMatchingData.leftColumnName ||
          question.matching_data?.leftColumnName ||
          'Left Column',
        rightColumnName:
          newMatchingData.rightColumnName ||
          question.matching_data?.rightColumnName ||
          'Right Column',
      });

      // Lấy dữ liệu mới từ API (nếu có)
      const updatedMatchingData = response?.data?.quizMatchingPairAnswer
        ? response.data.quizMatchingPairAnswer
        : {
            ...question.matching_data,
            ...newMatchingData,
          };

      // Cập nhật lại state
      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        matching_data: updatedMatchingData,
      };
      setQuestions(updatedQuestions);

      // Refresh matching pair data to ensure consistency
      if (refreshMatchingPairData) {
        await refreshMatchingPairData(activityId);
      }
    } catch (error) {
      console.error('Error updating matching pair:', error);
    }
  };

  return {
    timeLimit,
    setTimeLimit,
    handleAddQuestion,
    handleDeleteQuestion,
    handleDeleteActivity,
    handleQuestionTypeChange,
    handleQuestionLocationChange,
    handleQuestionTextChange,
    handleTimeLimitChange,
    handleAddLocationQuestion,
    handleMatchingPairChange,
  };
}
