// Extending Window interface to include our custom properties
declare global {
  interface Window {
    updateQuestionTimer: ReturnType<typeof setTimeout>;
    updateCorrectAnswerTimer: ReturnType<typeof setTimeout>;
    scrollSyncTimer: ReturnType<typeof setTimeout>;
  }
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, CheckCircle, XCircle, Monitor, Share2, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import components
import { QuestionList } from "./components/question-editor/question-list";
import { QuestionPreview } from "./components/question-editor/question-preview";
import { QuestionSettings } from "./components/question-editor/question-settings";

// Import types and mock data
import { Activity, QuizQuestion } from "./components/types";
import { MOCK_ACTIVITIES, MOCK_QUESTIONS } from "./components/mock-data";
import { activitiesApi, collectionsApi } from "@/api-client";
import { useToast } from "@/hooks/use-toast";

export default function QuestionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const activityId = params.id;

  // Hard-coded collection ID as requested
  const COLLECTION_ID = "fb71c154-3eeb-472e-a592-b76120257f1a";

  // State for storing activities and collection data
  const [activities, setActivities] = useState<Activity[]>([]);
  const [collectionData, setCollectionData] = useState<any>(null);

  // State for active question/activity
  const [activity, setActivity] = useState<Activity | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("content");
  const [timeLimit, setTimeLimit] = useState(30); // seconds
  const [backgroundImage, setBackgroundImage] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Define icon and label mappings for question types
  const questionTypeIcons = {
    multiple_choice: "ButtonsIcon",
    multiple_response: "CheckboxesIcon",
    true_false: "TrueFalseIcon",
    text_answer: "TypeAnswerIcon",
    reorder: "ReorderIcon",
    slide: "SlideIcon"
  };

  const questionTypeLabels = {
    multiple_choice: "Multiple Choice",
    multiple_response: "Multiple Response",
    true_false: "True/False",
    text_answer: "Text Answer",
    reorder: "Reorder",
    slide: "Information Slide"
  };

  // Fetch collection and map activities on component mount
  useEffect(() => {
    const fetchCollectionData = async () => {
      setIsLoading(true);
      try {
        console.log(`Fetching collection with ID: ${COLLECTION_ID}`);
        const response = await collectionsApi.getCollectionById(COLLECTION_ID);

        if (response && response.data) {
          console.log("Collection data loaded:", response.data);

          // Store the complete collection data
          setCollectionData(response.data.data);

          // If collection has activities, map and sort them
          if (response.data.data.activities && response.data.data.activities.length > 0) {
            const apiActivities = response.data.data.activities;
            console.log(`Found ${apiActivities.length} activities in collection:`, apiActivities);

            // Ensure orderIndex is treated as a number and properly sorted
            const mappedActivities = apiActivities
              .map((act: any) => ({
                id: act.activityId,
                title: act.title,
                collection_id: COLLECTION_ID,
                description: act.description,
                is_published: act.isPublished,
                activity_type_id: act.activityType,
                backgroundColor: act.backgroundColor,
                backgroundImage: act.backgroundImage,
                customBackgroundMusic: act.customBackgroundMusic,
                // Ensure orderIndex is a number (default to 0 if undefined)
                orderIndex: typeof act.orderIndex === 'number' ? act.orderIndex : 0,
                createdAt: act.createdAt,
                quiz: act.quiz
              }))
              .sort((a, b) => a.orderIndex - b.orderIndex);

            console.log("Sorted activities by orderIndex:", mappedActivities.map(a => `${a.title} (index: ${a.orderIndex})`));
            setActivities(mappedActivities);
            // If we have an activity ID in params, select that activity
            // Otherwise select the first activity
            const targetActivity = activityId
              ? mappedActivities.find(a => a.id === activityId)
              : mappedActivities[0];

            if (mappedActivities.length > 0) {
              // First, set the target activity
              if (targetActivity) {
                setActivity(targetActivity);
              }

              // Map ALL activities to questions, not just the selected one
              const allQuestions = mappedActivities.map(act => {
                // If the activity has quiz data, use it
                if (act.quiz) {
                  const quizData = act.quiz;
                  const questionType = mapActivityTypeToQuestionType(act.activity_type_id);

                  // Create question from quiz data
                  const question: QuizQuestion = {
                    activity_id: act.id,
                    question_text: quizData.questionText || "Default question",
                    question_type: questionType,
                    correct_answer_text: "",
                    options: []
                  };

                  // Map answers based on activity type
                  if (quizData.quizAnswers && Array.isArray(quizData.quizAnswers)) {
                    question.options = quizData.quizAnswers.map((answer: any, index: number) => ({
                      option_text: answer.answerText,
                      is_correct: answer.isCorrect,
                      display_order: answer.orderIndex || index,
                      explanation: answer.explanation || ""
                    }));
                  } else if (act.activity_type_id === "QUIZ_TYPE_ANSWER" && quizData.correctAnswer) {
                    question.correct_answer_text = quizData.correctAnswer;
                  }

                  return question;
                } else {
                  // Create default question if no quiz data
                  return createEmptyQuestion(act.id);
                }
              });

              // Set all questions
              setQuestions(allQuestions);

              // Set the active question index based on the selected activity
              if (targetActivity) {
                const targetIndex = mappedActivities.findIndex(a => a.id === targetActivity.id);
                setActiveQuestionIndex(targetIndex >= 0 ? targetIndex : 0);
              }
            } else {
              toast({
                title: "Info",
                description: "No activities found in this collection. Add one to get started.",
              });
            }
          } else {
            // No activities in collection
            console.log("No activities found in the collection");
            toast({
              title: "Info",
              description: "This collection has no activities yet. Add one to get started."
            });
          }
        }
      } catch (error) {
        console.error("Error fetching collection:", error);
        toast({
          title: "Error",
          description: "Failed to load collection data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollectionData();
  }, [COLLECTION_ID, activityId, toast]);

  // Helper function to create an empty question
  const createEmptyQuestion = (actId: string): QuizQuestion => ({
    activity_id: actId,
    question_text: "Default question",
    question_type: "multiple_choice",
    correct_answer_text: "",
    options: [
      { option_text: "Option 1", is_correct: true, display_order: 0 },
      { option_text: "Option 2", is_correct: false, display_order: 1 },
      { option_text: "Option 3", is_correct: false, display_order: 2 },
      { option_text: "Option 4", is_correct: false, display_order: 3 }
    ]
  });
  // Add this function to page.tsx
  const handleDeleteActivity = async (activityId: string) => {
    try {
      // Call the API to delete the activity
      await activitiesApi.deleteActivity(activityId);

      // Update local state by filtering out the deleted activity
      setActivities(activities.filter(a => a.id !== activityId));

      toast({
        title: "Success",
        description: "Activity deleted successfully"
      });

      // Refresh collection data
      refreshCollectionData();
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast({
        title: "Error",
        description: "Failed to delete activity",
        variant: "destructive"
      });
    }
  };
  // Create a new activity and add it to the collection
  const handleAddQuestion = async () => {
    try {
      // Find highest orderIndex to determine new activity's position
      const highestOrderIndex = activities.reduce((max, act) => {
        const orderIndex = typeof act.orderIndex === 'number' ? act.orderIndex : 0;
        return Math.max(max, orderIndex);
      }, -1);

      // Create a new activity in the collection with next orderIndex
      const payload = {
        collectionId: COLLECTION_ID,
        activityType: "QUIZ_BUTTONS", // Default type
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
        const newActivity = {
          id: newActivityData.activityId,
          title: newActivityData.title,
          collection_id: COLLECTION_ID,
          description: newActivityData.description,
          is_published: newActivityData.isPublished,
          activity_type_id: newActivityData.activityType
        };

        // Update activities array
        setActivities(prev => [...prev, newActivity]);

        // Create a new question for this activity
        const newQuestion = createEmptyQuestion(newActivityData.activityId);

        // Update the questions array - add the new question instead of replacing it
        setQuestions(prev => [...prev, newQuestion]);

        // Set this as current activity
        setActivity(newActivity);
        // Set the active question index to the new question
        setActiveQuestionIndex(questions.length); // Will point to the new question

        // Update API with default quiz data
        await activitiesApi.updateButtonsQuiz(newActivityData.activityId, {
          type: "CHOICE",
          questionText: "Default question",
          timeLimitSeconds: 30,
          pointType: "STANDARD",
          answers: [
            { answerText: "Option 1", isCorrect: true, explanation: "Correct" },
            { answerText: "Option 2", isCorrect: false, explanation: "Incorrect" },
            { answerText: "Option 3", isCorrect: false, explanation: "Incorrect" },
            { answerText: "Option 4", isCorrect: false, explanation: "Incorrect" }
          ]
        });

        toast({
          title: "Success",
          description: "New question added successfully",
        });

        // Refresh collection data to include new activity
        refreshCollectionData();
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
  // Add this to your main component in page.tsx
  const handleReorderOptions = async (sourceIndex: number, destinationIndex: number) => {
    if (!activity) return;

    const updatedQuestions = [...questions];
    const activeQuestion = updatedQuestions[activeQuestionIndex];
    const options = [...activeQuestion.options];

    // Remove the element from source and add at destination
    const [removed] = options.splice(sourceIndex, 1);
    options.splice(destinationIndex, 0, removed);

    // Update display order
    options.forEach((opt, idx) => {
      options[idx] = { ...opt, display_order: idx };
    });

    updatedQuestions[activeQuestionIndex] = {
      ...activeQuestion,
      options
    };

    // Update state
    setQuestions(updatedQuestions);

    // Update API for reorder type
    try {
      if (activity.activity_type_id === "QUIZ_REORDER") {
        console.log("Updating reorder quiz with data:", {
          type: "REORDER",
          questionText: activeQuestion.question_text,
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          correctOrder: options.map(opt => opt.option_text)
        });

        const response = await activitiesApi.updateReorderQuiz(activity.id, {
          type: "REORDER",
          questionText: activeQuestion.question_text,
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          correctOrder: options.map(opt => opt.option_text)
        });

        console.log("Reorder update response:", response);

        toast({
          title: "Success",
          description: "Reorder steps updated successfully"
        });
      }
    } catch (error) {
      console.error("Error updating reorder steps:", error);
      toast({
        title: "Error",
        description: "Failed to update reorder steps",
        variant: "destructive"
      });
    }
  };
  // Function to handle deleting a question
  const handleDeleteQuestion = async (index: number) => {
    if (!activity || questions.length <= 1) {
      // Don't allow deleting the only question
      toast({
        title: "Cannot delete question",
        description: "Activities must have at least one question",
        variant: "destructive"
      });
      return;
    }

    try {
      // In the current implementation, each activity has one question
      // So deleting a question means deleting the activity
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
        description: "Question deleted successfully"
      });

      // Refresh collection data
      refreshCollectionData();
    } catch (error) {
      console.error("Error deleting question:", error);
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive"
      });
    }
  };
  const refreshQuestionData = async () => {
    if (!activity) return;

    try {
      console.log("Refreshing question data for activity:", activity.id);

      // Fetch the specific activity data
      const response = await activitiesApi.getActivityById(activity.id);
      console.log("API response for activity refresh:", response);

      if (response && response.data && response.data.data) {
        const actData = response.data.data;

        // Update our local activity state
        setActivity({
          ...activity,
          quiz: actData.quiz
        });

        // Update the question in our local state
        if (actData.quiz) {
          const updatedQuestions = [...questions];
          const questionType = mapActivityTypeToQuestionType(activity.activity_type_id);

          const updatedQuestion: QuizQuestion = {
            activity_id: activity.id,
            question_text: actData.quiz.questionText || "Default question",
            question_type: questionType,
            correct_answer_text: "",
            options: []
          };

          // Map answers based on activity type
          if (actData.quiz.quizAnswers && Array.isArray(actData.quiz.quizAnswers)) {
            console.log("Mapping quiz answers from API:", actData.quiz.quizAnswers);

            updatedQuestion.options = actData.quiz.quizAnswers.map((answer: any, index: number) => {
              console.log(`Answer ${index}:`, answer);
              return {
                option_text: answer.answerText,
                is_correct: answer.isCorrect,
                display_order: answer.orderIndex || index,
                explanation: answer.explanation || ""
              };
            });
          } else if (activity.activity_type_id === "QUIZ_TYPE_ANSWER" && actData.quiz.correctAnswer) {
            updatedQuestion.correct_answer_text = actData.quiz.correctAnswer;
          }

          console.log("Updated question after refresh:", updatedQuestion);
          updatedQuestions[activeQuestionIndex] = updatedQuestion;
          setQuestions(updatedQuestions);
        }
      }
    } catch (error) {
      console.error("Error refreshing question data:", error);

      // Handle the specific error case where getActivityById is not available
      if (error instanceof TypeError && error.message.includes('getActivityById is not a function')) {
        // Alternative approach: use the existing activity data we have
        console.log("Falling back to manual state update without API refresh");

        // We'll just keep the state as is and show a notification
        toast({
          title: "Note",
          description: "Using local state for answer update. Refresh page to sync with server.",
          duration: 3000,
        });
      } else {
        // For other errors, show the standard error toast
        toast({
          title: "Error",
          description: "Failed to refresh data",
          variant: "destructive"
        });
      }
    }
  };
  // Refresh collection data after changes
  const refreshCollectionData = async () => {
    try {
      const response = await collectionsApi.getCollectionById(COLLECTION_ID);
      if (response && response.data) {
        setCollectionData(response.data.data);

        // Update activities list
        if (response.data.data.activities && response.data.data.activities.length > 0) {
          const apiActivities = response.data.data.activities;
          console.log(`Found ${apiActivities.length} activities in collection:`, apiActivities);
          console.log("Activities with orderIndex:", apiActivities.map(a => `${a.title} (index: ${a.orderIndex})`));

          // Map API activities to our Activity type with consistent orderIndex handling
          const mappedActivities = apiActivities
            .map((act: any) => ({
              id: act.activityId,
              title: act.title,
              collection_id: COLLECTION_ID,
              description: act.description,
              is_published: act.isPublished,
              activity_type_id: act.activityType,
              backgroundColor: act.backgroundColor,
              backgroundImage: act.backgroundImage,
              customBackgroundMusic: act.customBackgroundMusic,
              // Ensure orderIndex is a number (default to 0 if undefined)
              orderIndex: typeof act.orderIndex === 'number' ? act.orderIndex : 0,
              createdAt: act.createdAt,
              quiz: act.quiz
            }))
            .sort((a, b) => a.orderIndex - b.orderIndex);

          console.log("Refreshed activities sorted by orderIndex:", mappedActivities.map(a => `${a.title} (index: ${a.orderIndex})`));
          setActivities(mappedActivities);

          // Map ALL activities to questions
          const allQuestions = mappedActivities.map(act => {
            // If the activity has quiz data, use it
            if (act.quiz) {
              const quizData = act.quiz;
              const questionType = mapActivityTypeToQuestionType(act.activity_type_id);

              // Create question from quiz data
              const question: QuizQuestion = {
                activity_id: act.id,
                question_text: quizData.questionText || "Default question",
                question_type: questionType,
                correct_answer_text: "",
                options: []
              };

              // Map answers based on activity type
              if (quizData.quizAnswers && Array.isArray(quizData.quizAnswers)) {
                question.options = quizData.quizAnswers.map((answer: any, index: number) => ({
                  option_text: answer.answerText,
                  is_correct: answer.isCorrect,
                  display_order: answer.orderIndex || index,
                  explanation: answer.explanation || ""
                }));
              } else if (act.activity_type_id === "QUIZ_TYPE_ANSWER" && quizData.correctAnswer) {
                question.correct_answer_text = quizData.correctAnswer;
              }

              return question;
            } else {
              // Create default question if no quiz data
              return createEmptyQuestion(act.id);
            }
          });

          // Preserve current active question if possible
          setQuestions(allQuestions);
        }
      }
    } catch (error) {
      console.error("Error refreshing collection data:", error);
    }
  };

  // Helper functions to map between UI question types and API activity types
  const mapQuestionTypeToActivityType = (questionType: string): string => {
    switch (questionType) {
      case "multiple_choice":
        return "QUIZ_BUTTONS";
      case "multiple_response":
        return "QUIZ_CHECKBOXES";
      case "true_false":
        return "QUIZ_TRUE_OR_FALSE";
      case "text_answer":
        return "QUIZ_TYPE_ANSWER";
      case "reorder":
        return "QUIZ_REORDER";
      case "slide":
        return "INFO_SLIDE";
      default:
        return "QUIZ_BUTTONS";
    }
  };

  const mapActivityTypeToQuestionType = (activityType: string): string => {
    switch (activityType) {
      case "QUIZ_BUTTONS":
        return "multiple_choice";
      case "QUIZ_CHECKBOXES":
        return "multiple_response";
      case "QUIZ_TRUE_OR_FALSE":
        return "true_false";
      case "QUIZ_TYPE_ANSWER":
        return "text_answer";
      case "QUIZ_REORDER":
        return "reorder";
      case "INFO_SLIDE":
        return "slide";
      default:
        return "multiple_choice";
    }
  };

  // Handler for question type changes
  const handleQuestionTypeChange = async (value: string) => {
    if (!activity) return;

    // Map our internal question type to API activity type
    const activityType = mapQuestionTypeToActivityType(value);

    try {
      // Update the activity type in the API
      await activitiesApi.updateActivity(activity.id, {
        activityType: activityType
      });

      // Update our local state
      setActivity({
        ...activity,
        activity_type_id: activityType
      });

      // Update the question in our local state
      const updatedQuestions = [...questions];
      let options = [...updatedQuestions[activeQuestionIndex].options];

      // Adjust options based on question type
      if (value === "true_false") {
        options = [
          { option_text: "True", is_correct: true, display_order: 0 },
          { option_text: "False", is_correct: false, display_order: 1 }
        ];

        // Update the true/false quiz in the API
        await activitiesApi.updateTrueFalseQuiz(activity.id, {
          type: "TRUE_FALSE",
          questionText: updatedQuestions[activeQuestionIndex].question_text || "Default question",
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          correctAnswer: true // Default to "True" being correct
        });

      } else if (value === "text_answer") {
        options = [];

        // Update the type answer quiz in the API
        await activitiesApi.updateTypeAnswerQuiz(activity.id, {
          type: "TYPE_ANSWER",
          questionText: updatedQuestions[activeQuestionIndex].question_text || "Default question",
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          correctAnswer: "Answer" // Default correct answer
        });

        // Update correct answer text in our state
        updatedQuestions[activeQuestionIndex].correct_answer_text = "Answer";

      } else if (value === "multiple_choice") {
        // Ensure options exist
        if (options.length < 2) {
          options = [
            { option_text: "Option 1", is_correct: true, display_order: 0 },
            { option_text: "Option 2", is_correct: false, display_order: 1 },
            { option_text: "Option 3", is_correct: false, display_order: 2 },
            { option_text: "Option 4", is_correct: false, display_order: 3 }
          ];
        } else if (updatedQuestions[activeQuestionIndex].question_type === "multiple_response") {
          // When switching from multiple response to single choice,
          // ensure only one option is marked as correct
          let hasCorrect = false;
          options = options.map((option, idx) => {
            if (option.is_correct && !hasCorrect) {
              hasCorrect = true;
              return option;
            }
            return { ...option, is_correct: false };
          });
        }

        // Update buttons quiz in API
        await activitiesApi.updateButtonsQuiz(activity.id, {
          type: "CHOICE",
          questionText: updatedQuestions[activeQuestionIndex].question_text || "Default question",
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          answers: options.map(opt => ({
            answerText: opt.option_text,
            isCorrect: opt.is_correct,
            explanation: ""
          }))
        });

      } else if (value === "multiple_response") {
        // Ensure options exist
        if (options.length < 2) {
          options = [
            { option_text: "Option 1", is_correct: true, display_order: 0 },
            { option_text: "Option 2", is_correct: true, display_order: 1 },
            { option_text: "Option 3", is_correct: false, display_order: 2 },
            { option_text: "Option 4", is_correct: false, display_order: 3 }
          ];
        }

        // Update checkboxes quiz in API
        await activitiesApi.updateCheckboxesQuiz(activity.id, {
          type: "CHOICE",
          questionText: updatedQuestions[activeQuestionIndex].question_text || "Default question",
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          answers: options.map(opt => ({
            answerText: opt.option_text,
            isCorrect: opt.is_correct,
            explanation: ""
          }))
        });
      } else if (value === "reorder") {
        // Create default reorder options
        options = [
          { option_text: "Step 1", is_correct: false, display_order: 0 },
          { option_text: "Step 2", is_correct: false, display_order: 1 },
          { option_text: "Step 3", is_correct: false, display_order: 2 },
          { option_text: "Step 4", is_correct: false, display_order: 3 }
        ];

        // Update the reorder quiz in the API
        await activitiesApi.updateReorderQuiz(activity.id, {
          type: "REORDER",
          questionText: updatedQuestions[activeQuestionIndex].question_text || "Arrange in the correct order",
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          correctOrder: options.map(opt => opt.option_text)
        });
      }

      updatedQuestions[activeQuestionIndex] = {
        ...updatedQuestions[activeQuestionIndex],
        question_type: value,
        options
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

  // Update handleQuestionTextChange to immediately call API
  const handleQuestionTextChange = async (value: string, questionIndex: number) => {
    if (!activity) return;

    // Update local state
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex] = {
      ...updatedQuestions[questionIndex],
      question_text: value
    };
    setQuestions(updatedQuestions);

    // If not the active index, don't update API
    if (questionIndex !== activeQuestionIndex) return;

    // Use immediate API update instead of debouncing for reliability
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
            answers: activeQuestion.options.map(opt => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || ""
            }))
          });
          console.log("Updated buttons quiz question text");
          break;

        case "QUIZ_CHECKBOXES":
          await activitiesApi.updateCheckboxesQuiz(activity.id, {
            type: "CHOICE",
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            answers: activeQuestion.options.map(opt => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || ""
            }))
          });
          console.log("Updated checkboxes quiz question text");
          break;

        case "QUIZ_TRUE_OR_FALSE":
          const correctOption = activeQuestion.options.find(opt => opt.is_correct);
          await activitiesApi.updateTrueFalseQuiz(activity.id, {
            type: "TRUE_FALSE",
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            correctAnswer: correctOption?.option_text.toLowerCase() === "true"
          });
          console.log("Updated true/false quiz question text");
          break;

        case "QUIZ_TYPE_ANSWER":
          await activitiesApi.updateTypeAnswerQuiz(activity.id, {
            type: "TYPE_ANSWER",
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            correctAnswer: activeQuestion.correct_answer_text || "Answer"
          });
          console.log("Updated type answer quiz question text");
          break;

        case "QUIZ_REORDER":
          await activitiesApi.updateReorderQuiz(activity.id, {
            type: "REORDER",
            questionText: value,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            correctOrder: activeQuestion.options.map(opt => opt.option_text)
          });
          console.log("Updated reorder quiz question text");
          break;
      }
    } catch (error) {
      console.error("Error updating question text:", error);
      toast({
        title: "Error",
        description: "Failed to update question text",
        variant: "destructive"
      });
    }
  };
  // Update handleOptionChange to properly update options and sync with backend
  const handleOptionChange = async (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: any
  ) => {
    if (!activity) return;

    console.log(`Changing option ${optionIndex}, field ${field} to:`, value);

    // Create deep copies to avoid reference issues
    const updatedQuestions = [...questions];
    const activeQuestion = { ...updatedQuestions[questionIndex] };
    const options = [...activeQuestion.options];

    // Handle option text changes
    if (field === "option_text") {
      options[optionIndex] = {
        ...options[optionIndex],
        option_text: value
      };
    }
    // Handle correct answer changes
    else if (field === "is_correct") {
      // For multiple choice, only one option can be correct
      if (activeQuestion.question_type === "multiple_choice") {
        // Only one correct answer allowed
        options.forEach((opt, idx) => {
          options[idx] = { ...opt, is_correct: false };
        });
        options[optionIndex] = {
          ...options[optionIndex],
          is_correct: true
        };
      } else {
        // Toggle for multiple response
        options[optionIndex] = {
          ...options[optionIndex],
          is_correct: value
        };
      }
    }

    // Update the question with new options
    activeQuestion.options = options;
    updatedQuestions[questionIndex] = activeQuestion;

    // Update local state
    setQuestions(updatedQuestions);

    // Now handle API update
    try {
      console.log(`Updating ${activity.activity_type_id} with options:`, options);

      let payload: any;

      if (activity.activity_type_id === "QUIZ_BUTTONS" || activity.activity_type_id === "QUIZ_CHECKBOXES") {
        payload = {
          type: "CHOICE",
          questionText: activeQuestion.question_text,
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          answers: options.map(opt => ({
            answerText: opt.option_text,
            isCorrect: opt.is_correct,
            explanation: opt.explanation || ""
          }))
        };

        console.log(`Sending ${activity.activity_type_id} quiz update with payload:`, JSON.stringify(payload, null, 2));

        if (activity.activity_type_id === "QUIZ_BUTTONS") {
          await activitiesApi.updateButtonsQuiz(activity.id, payload);
        } else {
          await activitiesApi.updateCheckboxesQuiz(activity.id, payload);
        }
      } else if (activity.activity_type_id === "QUIZ_TRUE_OR_FALSE") {
        const correctOption = options.find(opt => opt.is_correct);
        const correctAnswer = correctOption?.option_text.toLowerCase() === "true";

        payload = {
          type: "TRUE_FALSE",
          questionText: activeQuestion.question_text,
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          correctAnswer
        };

        console.log("Sending TRUE/FALSE quiz update with payload:", JSON.stringify(payload, null, 2));
        await activitiesApi.updateTrueFalseQuiz(activity.id, payload);
      }

      // Try to refresh data, but handle gracefully if it fails
      try {
        if (typeof activitiesApi.getActivityById === 'function') {
          await refreshQuestionData();
        } else {
          console.log("getActivityById not available, skipping refresh");
          // Just show a success message
          toast({
            title: "Success",
            description: "Option updated successfully",
            variant: "default",
            duration: 2000
          });
        }
      } catch (refreshError) {
        console.error("Error refreshing question data:", refreshError);
        // Still show success for the update since that worked
        toast({
          title: "Success",
          description: "Option updated successfully (refresh skipped)",
          variant: "default",
          duration: 2000
        });
      }
    } catch (error) {
      console.error("Error updating option:", error);
      toast({
        title: "Error",
        description: "Failed to update option",
        variant: "destructive"
      });
    }
  };


  // Add new option to a question
  const handleAddOption = async () => {
    if (!activity) return;

    const updatedQuestions = [...questions];
    const activeQuestion = updatedQuestions[activeQuestionIndex];

    // Don't allow more than 8 options
    if (activeQuestion.options.length >= 8) {
      toast({
        title: "Maximum options reached",
        description: "You can't add more than 8 options",
        variant: "destructive"
      });
      return;
    }

    const newOptionIndex = activeQuestion.options.length;
    const newOption = {
      option_text: `Option ${newOptionIndex + 1}`,
      is_correct: false,
      display_order: newOptionIndex
    };

    // Add the new option
    const updatedOptions = [...activeQuestion.options, newOption];
    updatedQuestions[activeQuestionIndex] = {
      ...activeQuestion,
      options: updatedOptions
    };

    // Update state
    setQuestions(updatedQuestions);

    // Update API
    try {
      switch (activity.activity_type_id) {
        case "QUIZ_BUTTONS":
          await activitiesApi.updateButtonsQuiz(activity.id, {
            type: "CHOICE",
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            answers: updatedOptions.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || ""
            }))
          });
          break;

        case "QUIZ_CHECKBOXES":
          await activitiesApi.updateCheckboxesQuiz(activity.id, {
            type: "CHOICE",
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            answers: updatedOptions.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || ""
            }))
          });
          break;
      }
    } catch (error) {
      console.error("Error adding option:", error);
      toast({
        title: "Error",
        description: "Failed to add option",
        variant: "destructive"
      });
    }
  };

  // Delete an option from a question
  const handleDeleteOption = async (optionIndex: number) => {
    if (!activity) return;

    const updatedQuestions = [...questions];
    const activeQuestion = updatedQuestions[activeQuestionIndex];

    // Don't allow fewer than 2 options for multiple choice questions
    if (activeQuestion.options.length <= 2 &&
      (activeQuestion.question_type === "multiple_choice" ||
        activeQuestion.question_type === "multiple_response")) {
      toast({
        title: "Minimum options required",
        description: "You need at least 2 options for this question type",
        variant: "destructive"
      });
      return;
    }

    // Remove the option
    const updatedOptions = activeQuestion.options.filter((_, idx) => idx !== optionIndex);

    // Ensure at least one option is marked as correct for multiple choice
    if (activeQuestion.question_type === "multiple_choice" &&
      !updatedOptions.some(opt => opt.is_correct)) {
      updatedOptions[0] = { ...updatedOptions[0], is_correct: true };
    }

    // Update display order
    updatedOptions.forEach((opt, idx) => {
      updatedOptions[idx] = { ...opt, display_order: idx };
    });

    updatedQuestions[activeQuestionIndex] = {
      ...activeQuestion,
      options: updatedOptions
    };

    // Update state
    setQuestions(updatedQuestions);

    // Update API
    try {
      switch (activity.activity_type_id) {
        case "QUIZ_BUTTONS":
          await activitiesApi.updateButtonsQuiz(activity.id, {
            type: "CHOICE",
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            answers: updatedOptions.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || ""
            }))
          });
          break;

        case "QUIZ_CHECKBOXES":
          await activitiesApi.updateCheckboxesQuiz(activity.id, {
            type: "CHOICE",
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            answers: updatedOptions.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || ""
            }))
          });
          break;
      }
    } catch (error) {
      console.error("Error deleting option:", error);
      toast({
        title: "Error",
        description: "Failed to delete option",
        variant: "destructive"
      });
    }
  };

  // Update handleCorrectAnswerChange to use debouncing
  // Update handleCorrectAnswerChange to use debouncing and handle updates better
  const handleCorrectAnswerChange = async (value: string) => {
    if (!activity) return;

    // Update local state immediately
    const updatedQuestions = [...questions];
    updatedQuestions[activeQuestionIndex] = {
      ...updatedQuestions[activeQuestionIndex],
      correct_answer_text: value
    };
    setQuestions(updatedQuestions);

    // Use debouncing for API calls to avoid excessive requests
    if (window.updateCorrectAnswerTimer) {
      clearTimeout(window.updateCorrectAnswerTimer);
    }

    // Set a flag to indicate we're waiting for the timeout
    const currentInputValue = value;

    window.updateCorrectAnswerTimer = setTimeout(async () => {
      try {
        // Only update if this is still the current value
        if (currentInputValue === updatedQuestions[activeQuestionIndex].correct_answer_text) {
          if (activity.activity_type_id === "QUIZ_TYPE_ANSWER") {
            console.log("Updating text answer with correct answer:", value);

            const response = await activitiesApi.updateTypeAnswerQuiz(activity.id, {
              type: "TYPE_ANSWER",
              questionText: updatedQuestions[activeQuestionIndex].question_text,
              timeLimitSeconds: timeLimit,
              pointType: "STANDARD",
              correctAnswer: value
            });

            console.log("Text answer update response:", response);

            toast({
              title: "Updated",
              description: "Correct answer updated",
              duration: 2000,
            });

            // After successful update, refresh the data to ensure UI is in sync
            await refreshQuestionData();
          }
        }
      } catch (error) {
        console.error("Error updating correct answer:", error);
        toast({
          title: "Error",
          description: "Failed to update correct answer",
          variant: "destructive"
        });
      }
    }, 500); // Reduced to 500ms for more responsive feel but still debounced
  };

  // Handle slide content change for info slides
  const handleSlideContentChange = async (value: string) => {
    if (!activity) return;

    // Update local state
    const updatedQuestions = [...questions];
    updatedQuestions[activeQuestionIndex] = {
      ...updatedQuestions[activeQuestionIndex],
      slide_content: value
    };
    setQuestions(updatedQuestions);

    // For now, API doesn't support separate slide content updates
  };

  // Handle slide image change for info slides
  const handleSlideImageChange = async (value: string) => {
    if (!activity) return;

    // Update local state
    const updatedQuestions = [...questions];
    updatedQuestions[activeQuestionIndex] = {
      ...updatedQuestions[activeQuestionIndex],
      slide_image: value
    };
    setQuestions(updatedQuestions);

    // For now, API doesn't support separate slide image updates
  };

  // Save all changes
  const handleSave = async () => {
    if (!activity) return;

    try {
      toast({
        title: "Saving...",
        description: "Saving your changes"
      });

      // Most changes are already saved incrementally, but we can update the activity title, etc.
      await activitiesApi.updateActivity(activity.id, {
        title: activity.title,
        description: activity.description,
        isPublished: activity.is_published
      });

      toast({
        title: "Success",
        description: "All changes saved successfully"
      });

      // Refresh collection data
      refreshCollectionData();
    } catch (error) {
      console.error("Error saving changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive"
      });
    }
  };

  // Get the currently active question
  const activeQuestion = questions[activeQuestionIndex];

  // UI display logic
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">Loading collection data...</p>
        </div>
      </div>
    );
  }

  // Display activities list if we have them and no specific activity is selected
  if (activities.length > 0 && !activity) {
    // First, ensure activities are sorted by orderIndex
    const sortedActivities = [...activities].sort((a, b) => {
      // Ensure we have proper number comparison for orderIndex
      const orderA = typeof a.orderIndex === 'number' ? a.orderIndex : 0;
      const orderB = typeof b.orderIndex === 'number' ? b.orderIndex : 0;
      return orderA - orderB;
    });

    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Collection Activities</h1>
          <Button onClick={handleAddQuestion} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-none">
            + Add New Activity
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sortedActivities.map((act) => {
            // Find quiz data if available
            const quizData = act.quiz;

            return (
              <div
                key={act.id}
                className="border rounded-lg p-4 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <div className="flex justify-between items-center">
                  {/* Existing content */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${act.activity_type_id === "QUIZ_BUTTONS" ? "bg-blue-100 text-blue-800" :
                        act.activity_type_id === "QUIZ_CHECKBOXES" ? "bg-green-100 text-green-800" :
                          act.activity_type_id === "QUIZ_TRUE_OR_FALSE" ? "bg-yellow-100 text-yellow-800" :
                            act.activity_type_id === "QUIZ_TYPE_ANSWER" ? "bg-purple-100 text-purple-800" :
                              act.activity_type_id === "QUIZ_REORDER" ? "bg-orange-100 text-orange-800" :
                                "bg-gray-100 text-gray-800"
                        }`}>
                        {act.orderIndex !== undefined ? act.orderIndex + 1 : "?"}
                      </span>
                      <h3 className="font-semibold text-lg">{act.title}</h3>
                      {act.is_published && <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Published</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{act.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {act.activity_type_id.replace("QUIZ_", "").replace("_", " ")}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent opening the activity
                        if (confirm('Are you sure you want to delete this activity?')) {
                          handleDeleteActivity(act.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        setActivity(act);
                        // Load question data for this activity
                        const actData = collectionData.activities.find(
                          (a: any) => a.activityId === act.id
                        );
                        if (actData && actData.quiz) {
                          // Create question from quiz data
                          const question: QuizQuestion = {
                            activity_id: act.id,
                            question_text: actData.quiz.questionText || "Default question",
                            question_type: mapActivityTypeToQuestionType(act.activity_type_id),
                            correct_answer_text: "",
                            options: []
                          };

                          // Map answers based on activity type
                          if (actData.quiz.quizAnswers) {
                            question.options = actData.quiz.quizAnswers.map((ans: any, idx: number) => ({
                              option_text: ans.answerText,
                              is_correct: ans.isCorrect,
                              display_order: ans.orderIndex || idx,
                              explanation: ans.explanation || ""
                            }));
                          }

                          setQuestions([question]);
                        } else {
                          setQuestions([createEmptyQuestion(act.id)]);
                        }
                      }}
                    >
                      Edit
                    </Button>
                  </div>
                </div>

                {quizData && (
                  <div className="mt-3 border-t pt-3">
                    <p className="text-sm font-medium">{quizData.questionText}</p>
                    {quizData.quizAnswers && quizData.quizAnswers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {quizData.quizAnswers.map((answer: any, idx: number) => (
                          <span
                            key={answer.quizAnswerId}
                            className={`text-xs px-2 py-1 rounded ${answer.isCorrect
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-gray-100 text-gray-700 border border-gray-200"
                              }`}
                          >
                            {answer.answerText}
                            {answer.isCorrect && " ✓"}
                          </span>
                        ))}
                      </div>
                    )}
                    {act.activity_type_id === "QUIZ_TYPE_ANSWER" && quizData.correctAnswer && (
                      <div className="mt-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">
                          Answer: {quizData.correctAnswer}
                        </span>
                      </div>
                    )}
                    {act.activity_type_id === "QUIZ_TRUE_OR_FALSE" && quizData.correctAnswer !== undefined && (
                      <div className="mt-2">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">
                          Correct answer: {quizData.correctAnswer ? "True" : "False"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-3 flex justify-between text-xs text-muted-foreground">
                  <span>Time limit: {quizData?.timeLimitSeconds || 30}s</span>
                  <span>Created: {new Date(act.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return activity ? (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-4 bg-card p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              router.push(`/collections/${activity.collection_id}`)
            }
            className="mr-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{activity.title}</h1>
            <p className="text-sm text-muted-foreground">
              Question {activeQuestionIndex + 1} of {questions.length}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Share quiz with others</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Monitor className="mr-2 h-4 w-4" />{' '}
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>

          <Button
            onClick={handleSave}
            className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-none"
          >
            <Save className="mr-2 h-4 w-4" /> Save Questions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left sidebar - Questions list - make smaller */}
        <div className="col-span-12 md:col-span-2">
          <QuestionList
            questions={questions}
            activeQuestionIndex={activeQuestionIndex}
            onQuestionSelect={setActiveQuestionIndex}
            onAddQuestion={handleAddQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        </div>

        {/* Main content area - make larger */}
        <div className="col-span-12 md:col-span-8">
          {activeQuestion && (
            <QuestionPreview
              questions={questions}
              activeQuestionIndex={activeQuestionIndex}
              timeLimit={timeLimit}
              backgroundImage={backgroundImage}
              previewMode={previewMode}
              onQuestionTextChange={handleQuestionTextChange}
              onOptionChange={handleOptionChange}
              onChangeQuestion={setActiveQuestionIndex}
              onSlideImageChange={handleSlideImageChange}
              onReorderOptions={handleReorderOptions}
              onAddOption={handleAddOption}
            />
          )}
        </div>

        {/* Right sidebar - Settings - make smaller */}
        <div className="col-span-12 md:col-span-2">
          <QuestionSettings
            activeQuestion={activeQuestion}
            activeQuestionIndex={activeQuestionIndex}
            activeTab={activeTab}
            timeLimit={timeLimit}
            backgroundImage={backgroundImage}
            questionTypeIcons={questionTypeIcons}
            questionTypeLabels={questionTypeLabels}
            onTabChange={setActiveTab}
            onQuestionTypeChange={handleQuestionTypeChange}
            onTimeLimitChange={setTimeLimit}
            onBackgroundImageChange={(value) => setBackgroundImage(value)}
            onClearBackground={() => setBackgroundImage('')}
            onAddOption={handleAddOption}
            onOptionChange={handleOptionChange}
            onDeleteOption={handleDeleteOption}
            onCorrectAnswerChange={handleCorrectAnswerChange}
            onSlideContentChange={handleSlideContentChange}
            onSlideImageChange={handleSlideImageChange}
            onReorderOptions={handleReorderOptions}
          />
        </div>
      </div>
    </div>
  ) : (
    <div className="container mx-auto py-8 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl mb-4">No collection data available</h2>
        <Button onClick={refreshCollectionData}>Refresh Data</Button>
      </div>
    </div>
  );
}