/**
 * Custom hook for fetching and managing collection data
 */
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { collectionsApi } from "@/api-client";
import { Activity, QuizQuestion } from "../components/types";
import { createEmptyQuestion } from "../utils/question-helpers";
import { mapActivityTypeToQuestionType } from "../utils/question-type-mapping";

export function useCollectionData(collectionId: string, activityId?: string) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [collectionData, setCollectionData] = useState<any>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Fetch collection data and initialize activities and questions
  const fetchCollectionData = async () => {
    setIsLoading(true);
    try {
      console.log(`Fetching collection with ID: ${collectionId}`);
      const response = await collectionsApi.getCollectionById(collectionId);

      if (response && response.data) {
        console.log("Collection data loaded:", response.data);

        // Store the complete collection data
        setCollectionData(response.data.data);

        // If collection has activities, map and sort them
        if (
          response.data.data.activities &&
          response.data.data.activities.length > 0
        ) {
          const apiActivities = response.data.data.activities;
          console.log(
            `Found ${apiActivities.length} activities in collection:`,
            apiActivities
          );

          // Ensure orderIndex is treated as a number and properly sorted
          const mappedActivities = apiActivities
            .map((act: any) => ({
              id: act.activityId,
              title: act.title,
              collection_id: collectionId,
              description: act.description,
              is_published: act.isPublished,
              activity_type_id: act.activityType,
              backgroundColor: act.backgroundColor,
              backgroundImage: act.backgroundImage,
              customBackgroundMusic: act.customBackgroundMusic,
              orderIndex:
                typeof act.orderIndex === "number"
                  ? act.orderIndex
                  : Number.MAX_SAFE_INTEGER,
              createdAt: act.createdAt,
              quiz: act.quiz,
            }))
            .sort(
              (a: { orderIndex: number }, b: { orderIndex: number }) =>
                a.orderIndex - b.orderIndex
            );

          console.log(
            "Activities after sorting by orderIndex:",
            mappedActivities.map(
              (a: { title: string; orderIndex: number }) =>
                `${a.title} (index: ${a.orderIndex})`
            )
          );

          setActivities(mappedActivities);

          // If we have an activity ID in params, select that activity
          // Otherwise select the first activity
          const targetActivity = activityId
            ? mappedActivities.find((a: { id: string }) => a.id === activityId)
            : mappedActivities[0];

          if (mappedActivities.length > 0) {
            // First, set the target activity
            if (targetActivity) {
              setActivity(targetActivity);
            }

            // Map ALL activities to questions
            const allQuestions = mappedActivities.map(
              (act: { quiz: any; activity_type_id: string; id: string }) => {
                // If the activity has quiz data, use it
                if (act.quiz) {
                  const quizData = act.quiz;
                  const questionType = mapActivityTypeToQuestionType(
                    act.activity_type_id
                  );

                  // Create question from quiz data
                  const question: QuizQuestion = {
                    activity_id: act.id,
                    question_text: quizData.questionText || "Default question",
                    question_type: questionType as any,
                    correct_answer_text: "",
                    options: [],
                  };

                  // Map answers based on activity type
                  if (
                    quizData.quizAnswers &&
                    Array.isArray(quizData.quizAnswers)
                  ) {
                    question.options = quizData.quizAnswers.map(
                      (answer: any, index: number) => ({
                        option_text: answer.answerText,
                        is_correct: answer.isCorrect,
                        display_order: answer.orderIndex || index,
                        explanation: answer.explanation || "",
                      })
                    );
                  } else if (
                    act.activity_type_id === "QUIZ_TYPE_ANSWER" &&
                    quizData.correctAnswer
                  ) {
                    question.correct_answer_text = quizData.correctAnswer;
                    console.log(
                      "Found text answer question with answer:",
                      quizData.correctAnswer
                    );
                  }

                  return question;
                } else {
                  // Create default question if no quiz data
                  return createEmptyQuestion(act.id);
                }
              }
            );

            // Set sorted questions
            setQuestions(allQuestions);

            // Set the active question index based on the selected activity
            if (targetActivity) {
              const targetIndex = allQuestions.findIndex(
                (q: { activity_id: string }) =>
                  q.activity_id === targetActivity.id
              );
              setActiveQuestionIndex(targetIndex >= 0 ? targetIndex : 0);
            }
          } else {
            toast({
              title: "Info",
              description:
                "No activities found in this collection. Add one to get started.",
            });
          }
        } else {
          // No activities in collection
          console.log("No activities found in the collection");
          toast({
            title: "Info",
            description:
              "This collection has no activities yet. Add one to get started.",
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

  // Sync activity state with active question
  const syncActivityWithActiveQuestion = () => {
    const activeQuestionActivityId =
      questions[activeQuestionIndex]?.activity_id;
    if (
      activeQuestionActivityId &&
      (!activity || activity.id !== activeQuestionActivityId)
    ) {
      const correctActivity = activities.find(
        (a) => a.id === activeQuestionActivityId
      );
      if (correctActivity) {
        console.log(
          "Syncing activity state with active question:",
          correctActivity.id
        );
        setActivity(correctActivity);
      }
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchCollectionData();
  }, [collectionId, activityId]);

  // Sync activity when active question changes
  useEffect(() => {
    syncActivityWithActiveQuestion();
  }, [activeQuestionIndex]);

  return {
    isLoading,
    activities,
    setActivities,
    collectionData,
    setCollectionData,
    questions,
    setQuestions,
    activity,
    setActivity,
    activeQuestionIndex,
    setActiveQuestionIndex,
    refreshCollectionData: fetchCollectionData,
  };
}
