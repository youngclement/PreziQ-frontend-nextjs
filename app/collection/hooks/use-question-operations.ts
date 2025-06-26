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
          const locationAnswers = Array.isArray(locationData)
            ? locationData.map((location) => ({
                longitude: location.longitude,
                latitude: location.latitude,
                radius: location.radius || 10,
                hint: location.hint || '',
              }))
            : [
                {
                  longitude: locationData.lng || locationData.longitude || 0,
                  latitude: locationData.lat || locationData.latitude || 0,
                  radius: locationData.radius || 10,
                  hint: locationData.hint || '',
                },
              ];

          activitiesApi
            .updateLocationQuiz(questionActivityId, {
              type: 'LOCATION',
              questionText:
                existingQuestion.question_text || 'Location question',
              timeLimitSeconds: existingQuestion.time_limit_seconds || 30,
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

    try {
      // Update the activity type in the API

      // Xử lý đặc biệt cho matching pair
      if (value === 'matching_pair') {
        console.log('🎯 Converting to matching pair...');

        // 1. Đảm bảo activity trên BE đã là QUIZ_MATCHING_PAIRS
        await activitiesApi.updateActivity(targetActivity.id, {
          activityType: 'QUIZ_MATCHING_PAIRS',
        });

        // 2. Lấy tên cột từ state (nếu có) hoặc để BE tự tạo
        const existingMatchingData =
          questions[questionIndex].matching_data ||
          questions[questionIndex].quizMatchingPairAnswer;
        const leftColumnName =
          existingMatchingData?.leftColumnName || 'Left Column';
        const rightColumnName =
          existingMatchingData?.rightColumnName || 'Right Column';

        // 3. Gửi quiz data cho matching pair và để BE trả về dữ liệu hoàn chỉnh
        const response = await activitiesApi.updateMatchingPairQuiz(
          targetActivity.id,
          {
            type: 'MATCHING_PAIRS',
            questionText:
              questions[questionIndex].question_text ||
              'Match the items in the left column with the correct items in the right column',
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            leftColumnName,
            rightColumnName,
          }
        );

        console.log('✅ Matching pair API response:', response);

        // 4. Sử dụng dữ liệu hoàn chỉnh từ BE thay vì hard code
        let newMatchingData;
        if (response?.data?.quizMatchingPairAnswer) {
          newMatchingData = response.data.quizMatchingPairAnswer;
          console.log('📊 Using BE data:', newMatchingData);
        } else {
          // Fallback chỉ khi BE không trả về dữ liệu
          console.warn(
            '⚠️ BE did not return matching pair data, using fallback'
          );
          newMatchingData = {
            quizMatchingPairAnswerId: '',
            leftColumnName,
            rightColumnName,
            items: [],
            connections: [],
          };
        }

        // 5. Cập nhật question state với dữ liệu từ BE
        const updatedQuestions: QuizQuestion[] = [...questions];
        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          question_type: 'matching_pair',
          question_text:
            response?.data?.quizMatchingPairAnswer?.questionText ||
            questions[questionIndex].question_text ||
            'Match the items in the left column with the correct items in the right column',
          matching_data: newMatchingData,
          quizMatchingPairAnswer: newMatchingData,
          options: [], // Matching pairs don't use standard options
        };
        setQuestions(updatedQuestions);

        // 6. Cập nhật activity state
        setActivity({
          ...targetActivity,
          activity_type_id: 'QUIZ_MATCHING_PAIRS',
        });

        // After updating, fetch the latest activity detail and update state
        const detailRes = await activitiesApi.getActivityById(
          targetActivity.id
        );
        if (detailRes && detailRes.data && detailRes.data.data) {
          const activityDetail = detailRes.data.data;
          const matchingData = activityDetail.quiz?.quizMatchingPairAnswer;
          const updatedQuestions: QuizQuestion[] = [...questions];
          updatedQuestions[questionIndex] = {
            id: activityDetail.activityId,
            activity_id: activityDetail.activityId,
            question_text:
              activityDetail.quiz?.questionText || activityDetail.title || '',
            question_type: 'matching_pair',
            correct_answer_text: '',
            options: (matchingData?.items || []).map((item: any) => ({
              id: item.quizMatchingPairItemId,
              quizMatchingPairItemId: item.quizMatchingPairItemId,
              content: item.content,
              isLeftColumn: item.isLeftColumn,
              display_order: item.displayOrder || 0,
            })),
            matching_data: matchingData,
            quizMatchingPairAnswer: matchingData,
            time_limit_seconds: activityDetail.quiz?.timeLimitSeconds,
            pointType: activityDetail.quiz?.pointType || 'STANDARD',
          };
          setQuestions(updatedQuestions);
          setActivity({
            ...targetActivity,
            activity_type_id: 'QUIZ_MATCHING_PAIRS',
            quiz: activityDetail.quiz,
          });
        }

        console.log('✅ Matching pair conversion completed');
        return;
      } else {
        // Xử lý các loại question khác như cũ
        await activitiesApi.updateActivity(targetActivity.id, {
          activityType: activityType as any,
        });

        // Update our local state
        setActivity({
          ...targetActivity,
          activity_type_id: activityType,
        });

        // Update the question in our local state
        const updatedQuestions = [...questions];
        const currentQuestion = updatedQuestions[questionIndex];
        let options = [...currentQuestion.options];
        const currentType = currentQuestion.question_type;
        let newMatchingData = currentQuestion.matching_data; // Giữ lại dữ liệu cũ
        if (value === 'true_false') {
          options = [
            { option_text: 'True', is_correct: true, display_order: 0 },
            { option_text: 'False', is_correct: false, display_order: 1 },
          ];
          if (!activity) return;
          await activitiesApi.updateTrueFalseQuiz(activity.id, {
            type: 'TRUE_FALSE',
            questionText:
              updatedQuestions[questionIndex].question_text ||
              'Default question',
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctAnswer: true,
          });
        } else if (value === 'text_answer') {
          options = [];
          if (!activity) return;
          await activitiesApi.updateTypeAnswerQuiz(activity.id, {
            type: 'TYPE_ANSWER',
            questionText:
              updatedQuestions[questionIndex].question_text ||
              'Default question',
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctAnswer: 'Answer',
          });

          updatedQuestions[questionIndex].correct_answer_text = 'Answer';
        } else if (value === 'multiple_choice') {
          if (currentType === 'true_false') {
            const hasTrueSelected = options.some(
              (opt) =>
                opt.option_text.toLowerCase() === 'true' && opt.is_correct
            );

            options = [
              {
                option_text: 'Option 1',
                is_correct: hasTrueSelected,
                display_order: 0,
              },
              {
                option_text: 'Option 2',
                is_correct: !hasTrueSelected,
                display_order: 1,
              },
              { option_text: 'Option 3', is_correct: false, display_order: 2 },
              { option_text: 'Option 4', is_correct: false, display_order: 3 },
            ];
          } else if (options.length < 2) {
            options = [
              { option_text: 'Option 1', is_correct: true, display_order: 0 },
              { option_text: 'Option 2', is_correct: false, display_order: 1 },
              { option_text: 'Option 3', is_correct: false, display_order: 2 },
              { option_text: 'Option 4', is_correct: false, display_order: 3 },
            ];
          } else {
            let hasCorrect = false;
            options = options.map((option, idx) => {
              if (option.is_correct && !hasCorrect) {
                hasCorrect = true;
                return option;
              }
              return { ...option, is_correct: false };
            });

            if (!hasCorrect && options.length > 0) {
              options[0] = { ...options[0], is_correct: true };
            }
          }

          if (!activity) return;

          await activitiesApi.updateButtonsQuiz(activity.id, {
            type: 'CHOICE',
            questionText:
              updatedQuestions[questionIndex].question_text ||
              'Default question',
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            answers: options.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: '',
            })),
          });
        } else if (value === 'multiple_response') {
          if (currentType === 'true_false') {
            const hasTrueSelected = options.some(
              (opt) =>
                opt.option_text.toLowerCase() === 'true' && opt.is_correct
            );

            options = [
              {
                option_text: 'Option 1',
                is_correct: hasTrueSelected,
                display_order: 0,
              },
              {
                option_text: 'Option 2',
                is_correct: !hasTrueSelected,
                display_order: 1,
              },
              { option_text: 'Option 3', is_correct: false, display_order: 2 },
              { option_text: 'Option 4', is_correct: false, display_order: 3 },
            ];
          } else if (options.length < 2) {
            options = [
              { option_text: 'Option 1', is_correct: true, display_order: 0 },
              { option_text: 'Option 2', is_correct: true, display_order: 1 },
              { option_text: 'Option 3', is_correct: false, display_order: 2 },
              { option_text: 'Option 4', is_correct: false, display_order: 3 },
            ];
          }
          if (!activity) return;
          await activitiesApi.updateCheckboxesQuiz(activity.id, {
            type: 'CHOICE',
            questionText:
              updatedQuestions[questionIndex].question_text ||
              'Default question',
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            answers: options.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: '',
            })),
          });
        } else if (value === 'reorder') {
          options = [
            { option_text: 'Step 1', is_correct: false, display_order: 0 },
            { option_text: 'Step 2', is_correct: false, display_order: 1 },
            { option_text: 'Step 3', is_correct: false, display_order: 2 },
            { option_text: 'Step 4', is_correct: false, display_order: 3 },
          ];
          if (!activity) return;
          await activitiesApi.updateReorderQuiz(activity.id, {
            type: 'REORDER',
            questionText:
              updatedQuestions[questionIndex].question_text ||
              'Arrange in the correct order',
            timeLimitSeconds: timeLimit,
            pointType: 'STANDARD',
            correctOrder: options.map((opt) => opt.option_text),
          });
        } else if (value === 'slide' || value === 'info_slide') {
          // Both slide types use empty options
          options = [];

          // Maintain any existing slide content when switching between slide types
          let slideContent = updatedQuestions[questionIndex].slide_content;
          let slideImage = updatedQuestions[questionIndex].slide_image;

          if (!slideContent) {
            if (currentType === 'info_slide' || currentType === 'slide') {
              // Keep existing content if switching between slide types
              slideContent = updatedQuestions[questionIndex].slide_content;
            } else {
              // Default content for new slides
              slideContent = 'Add your slide content here...';
            }
          }

          // Update the API
          // Note: This would need to be implemented in the API backend
          if (!activity) return;

          // Add slide-specific update API call here when available
          // For now, just update the local state
        }

        // Update the question with new type and options
        updatedQuestions[questionIndex] = {
          ...updatedQuestions[questionIndex],
          question_type: value as
            | 'multiple_choice'
            | 'multiple_response'
            | 'true_false'
            | 'text_answer'
            | 'slide'
            | 'info_slide'
            | 'location'
            | 'reorder'
            | 'matching_pair',
          options,
          matching_data: newMatchingData,
        };

        setQuestions(updatedQuestions);
      }
    } catch (error) {
      console.error('❌ Error changing question type:', error);
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
          timeLimitSeconds: 60,
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
        timeLimitSeconds: question.time_limit_seconds || 30,
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
