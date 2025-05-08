/**
 * Custom hook for question operations
 */
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { activitiesApi } from "@/api-client";
import { Activity, QuizQuestion } from "../components/types";
import { createEmptyQuestion } from "../utils/question-helpers";
import { mapQuestionTypeToActivityType } from "../utils/question-type-mapping";

// Define activity type constants instead of using enum
export const ACTIVITY_TYPES = {
  QUIZ_BUTTONS: "QUIZ_BUTTONS",
  QUIZ_CHECKBOXES: "QUIZ_CHECKBOXES",
  QUIZ_TRUE_OR_FALSE: "QUIZ_TRUE_OR_FALSE",
  QUIZ_TYPE_ANSWER: "QUIZ_TYPE_ANSWER",
  QUIZ_REORDER: "QUIZ_REORDER",
  INFO_SLIDE: "INFO_SLIDE",
  INFO_SLIDE_INTERACTIVE: "INFO_SLIDE_INTERACTIVE",
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
  const { toast } = useToast();
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

      console.log(
        "Adding new activity with orderIndex:",
        highestOrderIndex + 1
      );
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
        console.log("Created activity:", response.data);

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

        toast({
          title: "Success",
          description: "New question added successfully",
        });

        // Remove the call to refreshCollectionData to prevent page reload
        // This is not needed since we've already updated our local state
      }
    } catch (error) {
      console.error("Error adding question:", error);
      toast({
        title: "Error",
        description: "Failed to add new question",
        variant: "destructive",
      });
    }
  };

  /**
   * Delete a question from the collection
   */
  const handleDeleteQuestion = async (index: number) => {
    if (!activity || questions.length <= 1) {
      toast({
        title: "Cannot delete question",
        description: "Activities must have at least one question",
        variant: "destructive",
      });
      return;
    }

    try {
      await activitiesApi.deleteActivity(questions[index].activity_id);

      // Update local state
      const updatedQuestions = [...questions];
      updatedQuestions.splice(index, 1);
      setQuestions(updatedQuestions);

      // If we deleted the active question, adjust the active index
      if (activeQuestionIndex >= updatedQuestions.length) {
        setActiveQuestionIndex(Math.max(0, updatedQuestions.length - 1));
      } else if (index === activeQuestionIndex && index > 0) {
        setActiveQuestionIndex(index - 1);
      }

      toast({
        title: "Success",
        description: "Question deleted successfully",
      });

      // Remove the refreshCollectionData call to prevent page reload
      // Local state is already updated correctly
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };
  // Add to the hook's return value
  const handleQuestionLocationChange = (
    questionIndex: number,
    locationData: any
  ) => {
    if (questionIndex < 0 || questionIndex >= questions.length) return;

    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      location_data: locationData,
    };

    setQuestions(updatedQuestions);

    // Debounce update to API
    if (window.updateQuestionTimer) {
      clearTimeout(window.updateQuestionTimer);
    }

    window.updateQuestionTimer = setTimeout(async () => {
      try {
        // Send to API when implemented
        console.log("Updating question location data:", locationData);
        // In a real implementation, you would call your API here
      } catch (error) {
        console.error("Error updating question location:", error);
      }
    }, 1000);
  };

  // Add handleQuestionLocationChange to the return object
  /**
   * Delete an activity by ID
   */
  const handleDeleteActivity = async (activityId: string) => {
    try {
      await activitiesApi.deleteActivity(activityId);

      // Update local state
      setActivities(activities.filter((a) => a.id !== activityId));

      toast({
        title: "Success",
        description: "Activity deleted successfully",
      });

      // Refresh collection data
      refreshCollectionData();
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive",
      });
    }
  };

  /**
   * Handle changing the question type
   */
  const handleQuestionTypeChange = async (
    value:
      | "true_false"
      | "text_answer"
      | "multiple_choice"
      | "multiple_response"
      | "reorder"
      | "slide"
      | "info_slide"
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
      console.log(
        `Updating activity type for ${targetActivity.id} to ${activityType}`
      );
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
      const currentQuestion = updatedQuestions[activeQuestionIndex];
      let options = [...currentQuestion.options];
      const currentType = currentQuestion.question_type;

      // Handle option structure based on the new question type
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
        question_type: value,
        options,
      };

      setQuestions(updatedQuestions);

      toast({
        title: "Success",
        description: "Question type updated successfully",
      });
    } catch (error) {
      console.error("Error updating question type:", error);
      toast({
        title: "Error",
        description: "Failed to update question type",
        variant: "destructive",
      });
    }
  };

  /**
   * Change the text of a question
   */
  const handleQuestionTextChange = async (
    value: string,
    questionIndex: number
  ) => {
    if (!activity) return;

    // Get the actual activity ID from the questions array to ensure accuracy
    const targetActivityId = questions[questionIndex].activity_id;

    // Make sure we're updating the right activity
    if (targetActivityId !== activity.id) {
      console.log("Warning: Activity ID mismatch detected - fixing reference");
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
      toast({
        title: "Error",
        description: "Failed to update question text",
        variant: "destructive",
      });
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
  };
}
