/**
 * Custom hook for fetching and managing collection data
 */
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { collectionsApi } from '@/api-client';
import {
  Activity,
  QuizOption,
  QuizQuestion,
  MatchingPairOption,
} from '../components/types';
import { createEmptyQuestion } from '../utils/question-helpers';
import { mapActivityTypeToQuestionType } from '../utils/question-type-mapping';

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
        // Store the complete collection data
        setCollectionData(response.data.data);

        // If collection has activities, map and sort them
        if (
          response.data.data.activities &&
          response.data.data.activities.length > 0
        ) {
          const apiActivities = response.data.data.activities;

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
                typeof act.orderIndex === 'number'
                  ? act.orderIndex
                  : Number.MAX_SAFE_INTEGER,
              createdAt: act.createdAt,
              quiz: act.quiz,
              slide: act.slide,
            }))
            .sort(
              (a: { orderIndex: number }, b: { orderIndex: number }) =>
                a.orderIndex - b.orderIndex
            );

          console.log(
            'Activities after sorting by orderIndex:',
            mappedActivities.map(
              (a: {
                title: string;
                orderIndex: number;
                activity_type_id: string;
              }) =>
                `${a.title} (index: ${a.orderIndex}, type: ${a.activity_type_id})`
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
              (act: {
                quiz: any;
                activity_type_id: string;
                id: string;
                title?: string;
              }) => {
                // Map activity type to question type
                const questionType = mapActivityTypeToQuestionType(
                  act.activity_type_id
                );

                // Create base question
                const question: QuizQuestion = {
                  id: act.id, // Use activity ID as question ID
                  activity_id: act.id,
                  question_text: '',
                  question_type: questionType as any,
                  correct_answer_text: '',
                  options: [],
                };

                // Handle slides and info slides
                if (questionType === 'slide' || questionType === 'info_slide') {
                  // For slide types, use specific slide data or defaults
                  if (act.quiz) {
                    question.question_text = act.quiz.title || 'Slide';
                    question.slide_content = act.quiz.content || '';
                    question.slide_image = act.quiz.image || '';
                  } else {
                    question.question_text = act.title || 'Slide';
                    question.slide_content = 'Add content here...';
                  }
                  return question;
                }

                // Handle location questions
                if (act.activity_type_id === 'QUIZ_LOCATION') {
                  question.question_text =
                    act.quiz?.questionText ||
                    act.title ||
                    'Where is this location?';
                  question.question_type = 'location';
                  question.location_data = {
                    lat: 21.0285, // Default latitude, can be a center point or first point.
                    lng: 105.8048, // Default longitude
                    radius: 10,

                    pointType: act.quiz?.pointType || 'STANDARD',
                    quizLocationAnswers:
                      act.quiz?.quizLocationAnswers?.map((loc: any) => ({
                        quizLocationAnswerId: loc.quizLocationAnswerId,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        radius: loc.radius,
                      })) || [],
                  };

                  if (
                    question.location_data.quizLocationAnswers &&
                    question.location_data.quizLocationAnswers.length > 0
                  ) {
                    question.location_data.lat =
                      question.location_data.quizLocationAnswers[0].latitude;
                    question.location_data.lng =
                      question.location_data.quizLocationAnswers[0].longitude;
                  }

                  console.log(
                    'Mapped location question with data:',
                    question.location_data
                  );
                  return question;
                }

                // Handle matching pair questions - UPDATED TO USE API DATA
                if (act.activity_type_id === 'QUIZ_MATCHING_PAIRS') {
                  question.question_type = 'matching_pair';
                  question.question_text =
                    act.quiz?.questionText || act.title || 'Match the pairs';
                  question.time_limit_seconds = act.quiz?.timeLimitSeconds;
                  question.pointType = act.quiz?.pointType;

                  // Use the actual matching pair data from API
                  if (act.quiz?.quizMatchingPairAnswer) {
                    const matchingData = act.quiz.quizMatchingPairAnswer;
                    question.matching_data = matchingData;

                    // Convert API structure to the expected options format
                    const options: MatchingPairOption[] = [];

                    // Process left column items
                    matchingData.items
                      .filter((item: MatchingPairOption) => item.isLeftColumn)
                      .forEach((item: MatchingPairOption) => {
                        options.push({
                          id: item.quizMatchingPairItemId,
                          quizMatchingPairItemId: item.quizMatchingPairItemId,
                          content: item.content,

                          isLeftColumn: true,
                          display_order: item.display_order,
                        });
                      });

                    // Process right column items
                    matchingData.items
                      .filter((item: MatchingPairOption) => !item.isLeftColumn)
                      .forEach((item: MatchingPairOption) => {
                        options.push({
                          id: item.quizMatchingPairItemId,
                          quizMatchingPairItemId: item.quizMatchingPairItemId,
                          content: item.content,

                          isLeftColumn: false,
                          display_order: item.display_order,
                        });
                      });

                    // Sort options by display order
                    options.sort((a, b) => a.display_order - b.display_order);

                    console.log('Processed matching pair data from API:', {
                      leftColumnName: matchingData.leftColumnName,
                      rightColumnName: matchingData.rightColumnName,
                      itemsCount: matchingData.items.length,
                      connectionsCount: matchingData.connections.length,
                      optionsCount: options.length,
                    });
                  } else {
                    // Fallback: create empty matching pair structure
                    question.question_text = act.title || 'Match the pairs';
                    question.options = [];
                    question.matching_data = {
                      quizMatchingPairAnswerId: '',
                      leftColumnName: 'Left Column',
                      rightColumnName: 'Right Column',
                      items: [],
                      connections: [],
                    };
                    console.log(
                      'No matching pair data found, created empty structure'
                    );
                  }

                  return question;
                }

                // If the activity has quiz data, use it for other question types
                if (act.quiz) {
                  const quizData = act.quiz;
                  question.question_text =
                    quizData.questionText || 'Default question';

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
                        explanation: answer.explanation || '',
                      })
                    );
                  } else if (
                    act.activity_type_id === 'QUIZ_TYPE_ANSWER' &&
                    quizData.correctAnswer
                  ) {
                    question.correct_answer_text = quizData.correctAnswer;
                    console.log(
                      'Found text answer question with answer:',
                      quizData.correctAnswer
                    );
                  }

                  return question;
                } else {
                  // Create default question if no quiz data
                  return createEmptyQuestion(act.id, questionType as any);
                }
              }
            );

            setActivities(mappedActivities);

            setQuestions(allQuestions);

            // Find index of the first question if we have questions
            if (allQuestions.length > 0) {
              // If we have an activity ID in params, select that activity
              if (activityId) {
                const targetActivity = mappedActivities.find(
                  (a: { id: string }) => a.id === activityId
                );
                if (targetActivity) {
                  setActivity(targetActivity);
                  const targetIndex = allQuestions.findIndex(
                    (q: { activity_id: string }) =>
                      q.activity_id === targetActivity.id
                  );
                  setActiveQuestionIndex(targetIndex >= 0 ? targetIndex : 0);
                } else {
                  // If no matching activity, select first
                  setActivity(mappedActivities[0]);
                  setActiveQuestionIndex(0);
                }
              } else {
                // No specific activity in URL, use first
                setActivity(mappedActivities[0]);
                setActiveQuestionIndex(0);
              }
            }
          } else {
            toast({
              title: 'Info',
              description:
                'No activities found in this collection. Add one to get started.',
            });
          }
        } else {
          // No activities in collection
          console.log('No activities found in the collection');
          toast({
            title: 'Info',
            description:
              'This collection has no activities yet. Add one to get started.',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching collection:', error);
      toast({
        title: 'Error',
        description: 'Failed to load collection data',
        variant: 'destructive',
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
          'Syncing activity state with active question:',
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
