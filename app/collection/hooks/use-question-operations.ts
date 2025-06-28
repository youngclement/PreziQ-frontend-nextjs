/**
 * Custom hook for question operations
 */
import { useState } from "react";
import { activitiesApi } from "@/api-client";
import { Activity, QuizQuestion } from "../components/types";
import { createEmptyQuestion } from "../utils/question-helpers";
import { mapQuestionTypeToActivityType } from "../utils/question-type-mapping";
import { CollectionService } from "../services/collection-service";

// Define activity type constants instead of using enum
export const ACTIVITY_TYPES = {
  QUIZ_BUTTONS: "QUIZ_BUTTONS",
  QUIZ_CHECKBOXES: "QUIZ_CHECKBOXES",
  QUIZ_TRUE_OR_FALSE: "QUIZ_TRUE_OR_FALSE",
  QUIZ_TYPE_ANSWER: "QUIZ_TYPE_ANSWER",
  QUIZ_REORDER: "QUIZ_REORDER",
  INFO_SLIDE: "INFO_SLIDE",
  INFO_SLIDE_INTERACTIVE: "INFO_SLIDE_INTERACTIVE",
  QUIZ_LOCATION: "QUIZ_LOCATION",
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
  refreshCollectionData: () => Promise<void>
) {
  const [timeLimit, setTimeLimit] = useState(30); // seconds

  /**
   * Add a new question to the collection
   */
  const handleAddQuestion = async () => {
    try {
      // Find highest orderIndex to determine new activity's position
      const highestOrderIndex = activities.reduce((max, act) => {
        const orderIndex =
          typeof act.orderIndex === "number" ? act.orderIndex : 0;
        return Math.max(max, orderIndex);
      }, -1);

      // Create a new activity in the collection with next orderIndex
      const payload = {
        collectionId: collectionId,
        activityType: ACTIVITY_TYPES.QUIZ_BUTTONS,
        title: "New Question",
        description: "This is a new question",
        isPublished: true,
        orderIndex: highestOrderIndex + 1, // Add next in sequence
      };

      const response = await activitiesApi.createActivity(payload);

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
          orderIndex: newActivityData.orderIndex || highestOrderIndex + 1,
          createdAt: newActivityData.createdAt,
          updatedAt: newActivityData.createdAt, // Using createdAt as default for updatedAt
          createdBy: "", // Adding empty string as default for createdBy
        };

        // Update activities array
        const updatedActivities = [...activities, newActivity];
        setActivities(updatedActivities);

        // Create a new question for this activity
        const newQuestion = createEmptyQuestion(newActivityData.activityId);

        // Add the new question at the end of the questions array
        const updatedQuestions = [...questions, newQuestion];
        setQuestions(updatedQuestions);

        // Set this as current activity
        setActivity(newActivity);

        // Set the active question index to the new question (which is now the last one)
        setActiveQuestionIndex(updatedQuestions.length - 1);

        // Update API with default quiz data
        await activitiesApi.updateButtonsQuiz(newActivityData.activityId, {
          type: "CHOICE",
          questionText: "Default question",
          timeLimitSeconds: 30,
          pointType: "STANDARD",
          answers: [
            { answerText: "Option 1", isCorrect: true, explanation: "Correct" },
            {
              answerText: "Option 2",
              isCorrect: false,
              explanation: "Incorrect",
            },
            {
              answerText: "Option 3",
              isCorrect: false,
              explanation: "Incorrect",
            },
            {
              answerText: "Option 4",
              isCorrect: false,
              explanation: "Incorrect",
            },
          ],
        });

        // Remove the call to refreshCollectionData to prevent page reload
        // This is not needed since we've already updated our local state
      }
    } catch (error) {
      console.error("Error adding question:", error);
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
      console.error("Error deleting question:", error);
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
      if (typeof window !== "undefined") {
        if (window.updateQuestionTimer) {
          clearTimeout(window.updateQuestionTimer);
        }
        window.updateQuestionTimer = setTimeout(() => {
          const locationAnswers = Array.isArray(locationData)
            ? locationData.map((location) => ({
                longitude: location.longitude,
                latitude: location.latitude,
                radius: location.radius || 10,
              }))
            : [
                {
                  longitude: locationData.lng || locationData.longitude || 0,
                  latitude: locationData.lat || locationData.latitude || 0,
                  radius: locationData.radius || 10,
                },
              ];

          activitiesApi
            .updateLocationQuiz(questionActivityId, {
              type: "LOCATION",
              questionText:
                existingQuestion.question_text || "Location question",
              timeLimitSeconds: timeLimit,
              pointType:
                (locationData.pointType as any) ||
                existingQuestion.location_data?.pointType ||
                "STANDARD",
              locationAnswers,
            })
            .catch((error) => {
              console.error("Error updating location quiz:", error);
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
      console.error("Error deleting activity:", error);
    }
  };

  /**
   * Handle changing the question type
   */
  const handleQuestionTypeChange = async (
    value: string,
    questionIndex: number
  ) => {
    // Get the activity ID directly from the active question
    const activeQuestionActivityId =
      questions[activeQuestionIndex]?.activity_id;
    if (!activeQuestionActivityId) return;

    // Find the correct activity for this question
    const targetActivity = activities.find(
      (a) => a.id === activeQuestionActivityId
    );
    if (!targetActivity) {
      console.error("Activity not found for the active question");
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

      // Chỉ gọi API update activity type nếu không phải matching pair
      // Chỉ gọi API update activity type nếu không phải matching pair
      if (value === "matching_pair") {
        // 1. Đảm bảo activity trên BE đã là QUIZ_MATCHING_PAIRS
        await activitiesApi.updateActivity(targetActivity.id, {
          activityType: "QUIZ_MATCHING_PAIRS",
        });

        // 2. Lấy tên cột từ state (nếu có) hoặc dùng default
        const existingMatchingData =
          questions[activeQuestionIndex].matching_data ||
          questions[activeQuestionIndex].quizMatchingPairAnswer;

        const leftColumnName =
          existingMatchingData?.leftColumnName || "Left Column";
        const rightColumnName =
          existingMatchingData?.rightColumnName || "Right Column";

        // 3. Gửi quiz data cho matching pair
        const response = await activitiesApi.updateMatchingPairQuiz(
          targetActivity.id,
          {
            type: "MATCHING_PAIRS",
            questionText:
              questions[activeQuestionIndex].question_text ||
              "Default matching pair question",
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            leftColumnName,
            rightColumnName,
          }
        );

        // Determine new matching data from API response or create a fallback
        let newMatchingData;
        if (response?.data?.quizMatchingPairAnswer) {
          newMatchingData = response.data.quizMatchingPairAnswer;
        } else {
          // Fallback: build the object if API does not return it
          newMatchingData = {
            ...existingMatchingData,
            quizMatchingPairAnswerId:
              existingMatchingData?.quizMatchingPairAnswerId || "",
            leftColumnName,
            rightColumnName,
            items: existingMatchingData?.items || [],
            connections: existingMatchingData?.connections || [],
          };
        }

        // Update the question state once
        const updatedQuestions = [...questions];
        updatedQuestions[activeQuestionIndex] = {
          ...updatedQuestions[activeQuestionIndex],
          matching_data: newMatchingData,
          options: [], // Matching pairs don't use standard options
        };
        setQuestions(updatedQuestions);
      } else {
        await activitiesApi.updateActivity(targetActivity.id, {
          activityType: activityType as any,
        });
      }

      // Update our local state
      setActivity({
        ...targetActivity,
        activity_type_id: activityType,
      });

      // Update the question in our local state
      const updatedQuestions = [...questions];
      const currentQuestion = updatedQuestions[activeQuestionIndex];
      let options = [...currentQuestion.options];
      const currentType = currentQuestion.question_type;
      let newMatchingData = currentQuestion.matching_data; // Giữ lại dữ liệu cũ
      if (value === "true_false") {
        options = [
          { option_text: "True", is_correct: true, display_order: 0 },
          { option_text: "False", is_correct: false, display_order: 1 },
        ];
        if (!activity) return;
        await activitiesApi.updateTrueFalseQuiz(activity.id, {
          type: "TRUE_FALSE",
          questionText:
            updatedQuestions[activeQuestionIndex].question_text ||
            "Default question",
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          correctAnswer: true,
        });
      } else if (value === "text_answer") {
        options = [];
        if (!activity) return;
        await activitiesApi.updateTypeAnswerQuiz(activity.id, {
          type: "TYPE_ANSWER",
          questionText:
            updatedQuestions[activeQuestionIndex].question_text ||
            "Default question",
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          correctAnswer: "Answer",
        });

        updatedQuestions[activeQuestionIndex].correct_answer_text = "Answer";
      } else if (value === "multiple_choice") {
        if (currentType === "true_false") {
          const hasTrueSelected = options.some(
            (opt) => opt.option_text.toLowerCase() === "true" && opt.is_correct
          );

          options = [
            {
              option_text: "Option 1",
              is_correct: hasTrueSelected,
              display_order: 0,
            },
            {
              option_text: "Option 2",
              is_correct: !hasTrueSelected,
              display_order: 1,
            },
            { option_text: "Option 3", is_correct: false, display_order: 2 },
            { option_text: "Option 4", is_correct: false, display_order: 3 },
          ];
        } else if (options.length < 2) {
          options = [
            { option_text: "Option 1", is_correct: true, display_order: 0 },
            { option_text: "Option 2", is_correct: false, display_order: 1 },
            { option_text: "Option 3", is_correct: false, display_order: 2 },
            { option_text: "Option 4", is_correct: false, display_order: 3 },
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
          type: "CHOICE",
          questionText:
            updatedQuestions[activeQuestionIndex].question_text ||
            "Default question",
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          answers: options.map((opt) => ({
            answerText: opt.option_text,
            isCorrect: opt.is_correct,
            explanation: "",
          })),
        });
      } else if (value === "multiple_response") {
        if (currentType === "true_false") {
          const hasTrueSelected = options.some(
            (opt) => opt.option_text.toLowerCase() === "true" && opt.is_correct
          );

          options = [
            {
              option_text: "Option 1",
              is_correct: hasTrueSelected,
              display_order: 0,
            },
            {
              option_text: "Option 2",
              is_correct: !hasTrueSelected,
              display_order: 1,
            },
            { option_text: "Option 3", is_correct: false, display_order: 2 },
            { option_text: "Option 4", is_correct: false, display_order: 3 },
          ];
        } else if (options.length < 2) {
          options = [
            { option_text: "Option 1", is_correct: true, display_order: 0 },
            { option_text: "Option 2", is_correct: true, display_order: 1 },
            { option_text: "Option 3", is_correct: false, display_order: 2 },
            { option_text: "Option 4", is_correct: false, display_order: 3 },
          ];
        }
        if (!activity) return;
        await activitiesApi.updateCheckboxesQuiz(activity.id, {
          type: "CHOICE",
          questionText:
            updatedQuestions[activeQuestionIndex].question_text ||
            "Default question",
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          answers: options.map((opt) => ({
            answerText: opt.option_text,
            isCorrect: opt.is_correct,
            explanation: "",
          })),
        });
      } else if (value === "reorder") {
        options = [
          { option_text: "Step 1", is_correct: false, display_order: 0 },
          { option_text: "Step 2", is_correct: false, display_order: 1 },
          { option_text: "Step 3", is_correct: false, display_order: 2 },
          { option_text: "Step 4", is_correct: false, display_order: 3 },
        ];
        if (!activity) return;
        await activitiesApi.updateReorderQuiz(activity.id, {
          type: "REORDER",
          questionText:
            updatedQuestions[activeQuestionIndex].question_text ||
            "Arrange in the correct order",
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          correctOrder: options.map((opt) => opt.option_text),
        });
      } else if (value === "slide" || value === "info_slide") {
        // Both slide types use empty options
        options = [];

        // Maintain any existing slide content when switching between slide types
        let slideContent = updatedQuestions[activeQuestionIndex].slide_content;
        let slideImage = updatedQuestions[activeQuestionIndex].slide_image;

        if (!slideContent) {
          if (currentType === "info_slide" || currentType === "slide") {
            // Keep existing content if switching between slide types
            slideContent = updatedQuestions[activeQuestionIndex].slide_content;
          } else {
            // Default content for new slides
            slideContent = "Add your slide content here...";
          }
        }

        // Update the API
        // Note: This would need to be implemented in the API backend
        if (!activity) return;

        // Add slide-specific update API call here when available
        // For now, just update the local state
      }

      // Update the question with new type and options
      updatedQuestions[activeQuestionIndex] = {
        ...updatedQuestions[activeQuestionIndex],
        question_type: value as
          | "multiple_choice"
          | "multiple_response"
          | "true_false"
          | "text_answer"
          | "slide"
          | "info_slide"
          | "location"
          | "reorder"
          | "matching_pair",
        options,
        matching_data: newMatchingData,
      };

      setQuestions(updatedQuestions);
    } catch (error) {
      console.error("Error updating question type:", error);
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
        console.error("Activity not found in activities array");
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
        case "QUIZ_BUTTONS":
          await activitiesApi.updateButtonsQuiz(activity.id, {
            type: "CHOICE",
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            answers: activeQuestion.options.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || "",
            })),
          });
          break;

        case "QUIZ_CHECKBOXES":
          await activitiesApi.updateCheckboxesQuiz(activity.id, {
            type: "CHOICE",
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            answers: activeQuestion.options.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || "",
            })),
          });
          break;

        case "QUIZ_TRUE_OR_FALSE":
          const correctOption = activeQuestion.options.find(
            (opt) => opt.is_correct
          );
          await activitiesApi.updateTrueFalseQuiz(activity.id, {
            type: "TRUE_FALSE",
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            correctAnswer: correctOption?.option_text.toLowerCase() === "true",
          });
          break;

        case "QUIZ_TYPE_ANSWER":
          await activitiesApi.updateTypeAnswerQuiz(activity.id, {
            type: "TYPE_ANSWER",
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            correctAnswer: activeQuestion.correct_answer_text || "Answer",
          });
          break;

        case "QUIZ_REORDER":
          await activitiesApi.updateReorderQuiz(activity.id, {
            type: "REORDER",
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            correctOrder: activeQuestion.options.map((opt) => opt.option_text),
          });
          break;
      }
    } catch (error) {
      console.error("Error updating question text:", error);
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
    if (questionId && !questionId.startsWith("temp-") && activity) {
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
            case "QUIZ_BUTTONS":
              await activitiesApi.updateButtonsQuiz(activity.id, {
                type: "CHOICE",
                questionText: activeQuestion.question_text,
                timeLimitSeconds: value,
                pointType: "STANDARD",
                answers: activeQuestion.options.map((opt) => ({
                  answerText: opt.option_text,
                  isCorrect: opt.is_correct,
                  explanation: opt.explanation || "",
                })),
              });
              break;
            case "QUIZ_CHECKBOXES":
              await activitiesApi.updateCheckboxesQuiz(activity.id, {
                type: "CHOICE",
                questionText: activeQuestion.question_text,
                timeLimitSeconds: value,
                pointType: "STANDARD",
                answers: activeQuestion.options.map((opt) => ({
                  answerText: opt.option_text,
                  isCorrect: opt.is_correct,
                  explanation: opt.explanation || "",
                })),
              });
              break;
            case "QUIZ_TRUE_OR_FALSE":
              const correctOption = activeQuestion.options.find(
                (opt) => opt.is_correct
              );
              await activitiesApi.updateTrueFalseQuiz(activity.id, {
                type: "TRUE_FALSE",
                questionText: activeQuestion.question_text,
                timeLimitSeconds: value,
                pointType: "STANDARD",
                correctAnswer:
                  correctOption?.option_text.toLowerCase() === "true",
              });
              break;
            case "QUIZ_TYPE_ANSWER":
              await activitiesApi.updateTypeAnswerQuiz(activity.id, {
                type: "TYPE_ANSWER",
                questionText: activeQuestion.question_text,
                timeLimitSeconds: value,
                pointType: "STANDARD",
                correctAnswer: activeQuestion.correct_answer_text || "",
              });
              break;
            case "QUIZ_REORDER":
              await activitiesApi.updateReorderQuiz(activity.id, {
                type: "REORDER",
                questionText: activeQuestion.question_text,
                timeLimitSeconds: value,
                pointType: "STANDARD",
                correctOrder: activeQuestion.options.map(
                  (opt) => opt.option_text
                ),
              });
              break;
            case "QUIZ_LOCATION":
              if (activeQuestion.location_data || activity?.quiz) {
                // Debug: Log available data sources
                console.log("🔍 Location data sources for time limit update:");
                console.log(
                  "- activity.quiz.quizLocationAnswers:",
                  activity?.quiz?.quizLocationAnswers
                );
                console.log(
                  "- activeQuestion.location_data.quizLocationAnswers:",
                  activeQuestion.location_data?.quizLocationAnswers
                );
                console.log(
                  "- activeQuestion.location_data:",
                  activeQuestion.location_data
                );
                console.log("- questions array:", questions);
                console.log("- activeQuestionIndex:", activeQuestionIndex);

                // Helper function to get the most reliable location data
                const getLocationAnswers = () => {
                  // 1. Try from activity.quiz (API response data)
                  if (
                    activity?.quiz?.quizLocationAnswers &&
                    activity.quiz.quizLocationAnswers.length > 0
                  ) {
                    console.log("✅ Found location answers in activity.quiz");
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
                      "✅ Found location answers in activeQuestion.location_data"
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
                        "✅ Found location answers in questions array"
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
                    "❌ No existing location answers found anywhere, creating fallback"
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
                  "🚀 Final location answers for API:",
                  locationAnswers
                );

                await activitiesApi.updateLocationQuiz(activity.id, {
                  type: "LOCATION",
                  questionText:
                    activeQuestion.question_text || "Location question",
                  timeLimitSeconds: value,
                  pointType:
                    (activeQuestion.location_data?.pointType as
                      | "STANDARD"
                      | "NO_POINTS"
                      | "DOUBLE_POINTS") || "STANDARD",
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
          console.error("Error updating question time limit:", error);
        }
      }, 500);
    }
  };

  /**
   * Add a new location question to the collection
   */
  const handleAddLocationQuestion = async (pointType: string = "STANDARD") => {
    try {
      // Find highest orderIndex to determine new activity's position
      const highestOrderIndex = activities.reduce((max, act) => {
        const orderIndex =
          typeof act.orderIndex === "number" ? act.orderIndex : 0;
        return Math.max(max, orderIndex);
      }, -1);

      // Create a new location activity in the collection
      const payload = {
        collectionId: collectionId,
        activityType: ACTIVITY_TYPES.QUIZ_LOCATION,
        title: "New Location Quiz",
        description: "Find the location on the map",
        isPublished: true,
        backgroundColor: "#FFFFFF",
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
          backgroundColor: newActivityData.backgroundColor || "#FFFFFF",
          orderIndex: newActivityData.orderIndex || highestOrderIndex + 1,
          createdAt: newActivityData.createdAt,
          updatedAt: newActivityData.createdAt,
          createdBy: newActivityData.createdBy || "",
        };

        // Update activities array
        const updatedActivities = [...activities, newActivity];
        setActivities(updatedActivities);

        // Create a default location in the center of the map
        const defaultLocationData = {
          lat: 21.0285, // Default latitude (Hanoi)
          lng: 105.8048, // Default longitude
          radius: 10, // Default radius in km
          hint: "Find this location on the map",
          pointType: pointType, // Add pointType
        };

        // Create a new question for this activity
        const newQuestion: QuizQuestion = {
          id: newActivityData.activityId,
          activity_id: newActivityData.activityId,
          question_text: "Where is this location?",
          question_type: "location",
          correct_answer_text: "",
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
          type: "LOCATION",
          questionText: "Where is this location?",
          timeLimitSeconds: timeLimit,
          pointType: pointType as "STANDARD" | "NO_POINTS" | "DOUBLE_POINTS",
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
      console.error("Error adding location question:", error);
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
        type: "MATCHING_PAIRS",
        questionText: question.question_text || "Matching pair question",
        timeLimitSeconds: timeLimit,
        pointType: "STANDARD",
        leftColumnName:
          newMatchingData.leftColumnName ||
          question.matching_data?.leftColumnName ||
          "Left Column",
        rightColumnName:
          newMatchingData.rightColumnName ||
          question.matching_data?.rightColumnName ||
          "Right Column",
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
    } catch (error) {
      console.error("Error updating matching pair:", error);
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
