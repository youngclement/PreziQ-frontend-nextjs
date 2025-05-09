/**
 * Extending Window interface to include our custom properties
 */
declare global {
    interface Window {
        updateQuestionTimer: ReturnType<typeof setTimeout>;
        updateCorrectAnswerTimer: ReturnType<typeof setTimeout>;
        scrollSyncTimer: NodeJS.Timeout | undefined;
        lastQuestionClick?: number;
        lastActivityClick?: number;
        updateActivityBackground?: (activityId: string, properties: { backgroundImage?: string, backgroundColor?: string }) => void;
    }
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ArrowLeft, Monitor, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { activitiesApi } from "@/api-client/activities-api";

// Import components
import { QuestionList } from "./question-editor/question-list";
import { QuestionPreview } from "./question-editor/question-preview";
import { QuestionSettings } from "./question-editor/question-settings";

// Import custom hooks
import { useCollectionData } from "../hooks/use-collection-data";
import { useQuestionOperations } from "../hooks/use-question-operations";
import { useOptionOperations } from "../hooks/use-option-operations";
import { useSlideOperations } from "../hooks/use-slide-operations";

// Import utility functions and constants
import { clearScrollTimers } from "../utils/question-helpers";
import { questionTypeLabels, questionTypeIcons } from "../utils/question-type-mapping";
import { CollectionService } from "../services/collection-service";

export default function QuestionsPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Get collection ID from URL search parameters
    const collectionId = searchParams.get('collectionId') || '';
    const activityId = searchParams.get('activityId') || '';

    // Use collection data hook
    const {
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
        refreshCollectionData
    } = useCollectionData(collectionId, activityId);

    // State for UI
    const [activeTab, setActiveTab] = useState("content");
    const [backgroundImage, setBackgroundImage] = useState("");
    const [previewMode, setPreviewMode] = useState(false);
    const [isQuestionListCollapsed, setIsQuestionListCollapsed] = useState(false);

    // Use question operations hook
    const {
        timeLimit,
        setTimeLimit,
        handleAddQuestion,
        handleDeleteQuestion,
        handleDeleteActivity,
        handleQuestionTypeChange,
        handleQuestionLocationChange,
        handleQuestionTextChange
    } = useQuestionOperations(
        collectionId,
        activities,
        setActivities,
        questions,
        setQuestions,
        activeQuestionIndex,
        setActiveQuestionIndex,
        activity,
        setActivity,
        refreshCollectionData
    );

    // Use option operations hook
    const {
        handleOptionChange,
        handleReorderOptions,
        handleAddOption,
        handleDeleteOption,
        handleCorrectAnswerChange,
        updateReorderOptionContent
    } = useOptionOperations(
        questions,
        setQuestions,
        activeQuestionIndex,
        activity,
        timeLimit
    );

    // Use slide operations hook
    const {
        handleSlideContentChange,
        handleSlideImageChange,
        handleSave
    } = useSlideOperations(
        questions,
        setQuestions,
        activeQuestionIndex,
        activity,
        timeLimit
    );

    // Clean up timers when component unmounts
    useEffect(() => {
        return () => {
            clearScrollTimers();
        };
    }, []);

    // Redirect if no collection ID is provided
    useEffect(() => {
        if (!collectionId) {
            router.push('/collections');
        }
    }, [collectionId, router]);

    // Sincronizar o backgroundImage quando a atividade mudar
    useEffect(() => {
        if (activity?.backgroundImage) {
            setBackgroundImage(activity.backgroundImage);
        }
    }, [activity]);

    // Handle selecting a question from the list
    const handleQuestionSelect = (index: number) => {
        // Set the active question index
        setActiveQuestionIndex(index);

        // Get the activity ID for this question
        const activityId = questions[index]?.activity_id;
        if (activityId) {
            // Find the corresponding activity
            const selectedActivity = activities.find(a => a.id === activityId);
            if (selectedActivity) {
                // Update the activity state
                setActivity(selectedActivity);
            }
        }
    };

    // Centralized question text update function to ensure consistency
    const handleCentralizedQuestionTextChange = (value: string, questionIndex: number) => {
        // Update question text in local state
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex].question_text = value;
        setQuestions(updatedQuestions);

        // Call the API update function
        handleQuestionTextChange(value, questionIndex);

        // Also update activity title if this is a newly created question (title matches the default)
        if (activity && (activity.title === "New Question" || activity.title === "Default question")) {
            const updatedActivity = { ...activity, title: value };

            // Update activity in local state
            const updatedActivities = [...activities];
            const activityIndex = updatedActivities.findIndex(a => a.id === activity.id);
            if (activityIndex >= 0) {
                updatedActivities[activityIndex] = updatedActivity;
                setActivities(updatedActivities);
            }

            // Update current activity
            setActivity(updatedActivity);

            // Update in API
            try {
                activitiesApi.updateActivity(activity.id, { title: value });
            } catch (error) {
                console.error('Error updating activity title:', error);
            }
        }
    };

    // Centralized option change function to ensure consistency
    const handleCentralizedOptionChange = (questionIndex: number, optionIndex: number, field: string, value: any) => {
        // Make a copy of the current questions
        const updatedQuestions = [...questions];

        // Handle reorder options specially
        if (updatedQuestions[questionIndex].question_type === "reorder" && field === "option_text") {
            updateReorderOptionContent(questionIndex, optionIndex, value);
        } else {
            // Update option directly in local state first
            if (updatedQuestions[questionIndex].options[optionIndex]) {
                updatedQuestions[questionIndex].options[optionIndex] = {
                    ...updatedQuestions[questionIndex].options[optionIndex],
                    [field]: value
                };

                // For multiple choice, ensure only one option is selected
                if (field === "is_correct" && value === true &&
                    updatedQuestions[questionIndex].question_type === "multiple_choice") {
                    // If this is a single choice question and we're setting an option to correct,
                    // ensure other options are set to incorrect
                    updatedQuestions[questionIndex].options.forEach((opt, idx) => {
                        if (idx !== optionIndex) {
                            updatedQuestions[questionIndex].options[idx].is_correct = false;
                        }
                    });
                }

                // Update state
                setQuestions(updatedQuestions);
            }

            // Call the API update function
            handleOptionChange(questionIndex, optionIndex, field, value);
        }
    };

    // Centralized background image update function
    const handleBackgroundImageChange = (value: string) => {
        setBackgroundImage(value);

        // Se tivermos uma atividade atual, atualizar os dados da atividade também
        if (activity) {
            const updatedActivity = { ...activity, backgroundImage: value };

            // Atualizar estado local
            const updatedActivities = [...activities];
            const activityIndex = updatedActivities.findIndex(a => a.id === activity.id);
            if (activityIndex >= 0) {
                updatedActivities[activityIndex] = updatedActivity;
                setActivities(updatedActivities);
            }

            // Atualizar atividade atual
            setActivity(updatedActivity);

            // Use the immediate background update function if available
            if (typeof window !== 'undefined' && window.updateActivityBackground) {
                window.updateActivityBackground(activity.id, { backgroundImage: value });
            }
        }
    };

    // Function to set all activities backgrounds at once when collection is fetched
    const handleSetActivitiesBackgrounds = (setActivitiesBackgroundsFn: (activities: any[]) => void) => {
        // Store the function reference
        if (activities && activities.length > 0) {
            // Call the function with all activities to set backgrounds in bulk
            setActivitiesBackgroundsFn(activities);
        }
    };

    // Function to update activity background in real-time
    const handleUpdateActivityBackground = (
        updateFn: (activityId: string, properties: { backgroundImage?: string, backgroundColor?: string }) => void
    ) => {
        // Store the function for use in other components
        if (typeof window !== 'undefined') {
            window.updateActivityBackground = updateFn;
        }
    };

    // Handle reordering activities
    const handleReorderActivities = async (orderedIds: string[]) => {
        try {
            // Call the API to reorder activities
            await CollectionService.reorderActivities(collectionId, orderedIds);

            // Update the local state to reflect the new order
            if (activities) {
                // Create a map for quick lookup
                const activityMap = new Map(activities.map(a => [a.id, a]));

                // Create a new array with the updated order
                const reorderedActivities = orderedIds
                    .map(id => activityMap.get(id))
                    .filter(a => a !== undefined);

                // Update the state with the reordered activities
                setActivities(reorderedActivities as any);

                toast.success("Activities reordered successfully");
            }
        } catch (error) {
            console.error("Error reordering activities:", error);
            toast.error("Failed to reorder activities");
        }
    };

    // Handle reordering questions within an activity
    const handleReorderQuestions = async (orderedQuestionIds: string[]) => {
        if (!activity) return;

        try {
            // First, update the local state for immediate UI response
            const questionMap = new Map(questions.map(q => [q.id, q]));
            const reorderedQuestions = orderedQuestionIds
                .map(id => questionMap.get(id))
                .filter(q => q !== undefined) as typeof questions;

            setQuestions(reorderedQuestions);

            // Then call the API to persist the changes
            await CollectionService.reorderQuestions(activity.id, orderedQuestionIds);

            toast.success("Questions reordered successfully");
        } catch (error) {
            console.error("Error reordering questions:", error);
            toast.error("Failed to reorder questions");

            // If there was an error, refresh the data to ensure UI is in sync with server
            refreshCollectionData();
        }
    };

    // Display loading state
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

    // Display error state if no collection ID
    if (!collectionId) {
        return (
            <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <h2 className="text-xl mb-4">No collection ID provided</h2>
                    <Button onClick={() => router.push('/collections')}>Go to Collections</Button>
                </div>
            </div>
        );
    }

    return activity ? (
        <DndProvider backend={HTML5Backend}>
            <div className="w-full h-[calc(100vh-52px)] overflow-hidden flex flex-col">
                <div className="grid grid-cols-12 gap-1 h-full overflow-hidden">
                    {/* Main content area with question preview and settings */}
                    <div className="col-span-12 grid grid-cols-12  pt-3 gap-4 overflow-hidden" style={{ height: 'calc(100vh - 190px)' }}>
                        {/* Question Preview - scrollable */}
                        <div className="col-span-12 md:col-span-8  overflow-auto h-full pb-1">
                            {questions[activeQuestionIndex] && (
                                <QuestionPreview
                                    questions={questions}
                                    activeQuestionIndex={activeQuestionIndex}
                                    timeLimit={timeLimit}
                                    backgroundImage={backgroundImage}
                                    previewMode={previewMode}
                                    onAddQuestion={handleAddQuestion}
                                    onQuestionTextChange={handleCentralizedQuestionTextChange}
                                    onOptionChange={handleCentralizedOptionChange}
                                    onChangeQuestion={handleQuestionSelect}
                                    onSlideImageChange={handleSlideImageChange}
                                    onQuestionLocationChange={handleQuestionLocationChange}
                                    isQuestionListCollapsed={isQuestionListCollapsed}
                                    activity={activity}
                                    onSetActivitiesBackgrounds={handleSetActivitiesBackgrounds}
                                    onUpdateActivityBackground={handleUpdateActivityBackground}
                                />
                            )}
                        </div>

                        {/* Question Settings - scrollable */}
                        <div className="col-span-12 md:col-span-4 overflow-auto h-full pb-1">
                            <QuestionSettings
                                activeQuestion={questions[activeQuestionIndex]}
                                activeQuestionIndex={activeQuestionIndex}
                                activeTab={activeTab}
                                timeLimit={timeLimit}
                                backgroundImage={backgroundImage}
                                questionTypeIcons={questionTypeIcons}
                                questionTypeLabels={questionTypeLabels}
                                onTabChange={setActiveTab}
                                onQuestionTypeChange={(value) => {
                                    handleQuestionTypeChange(value as any);
                                }}
                                onTimeLimitChange={setTimeLimit}
                                onBackgroundImageChange={(value) => handleBackgroundImageChange(value)}
                                onClearBackground={() => handleBackgroundImageChange('')}
                                onAddOption={handleAddOption}
                                onOptionChange={handleCentralizedOptionChange}
                                onDeleteOption={handleDeleteOption}
                                onCorrectAnswerChange={handleCorrectAnswerChange}
                                onSlideContentChange={handleSlideContentChange}
                                onSlideImageChange={handleSlideImageChange}
                                onReorderOptions={handleReorderOptions}
                                onQuestionLocationChange={handleQuestionLocationChange}
                                activity={activity}
                            />
                        </div>
                    </div>

                    {/* Question List - fixed at bottom with fixed height */}
                    <div className="col-span-12 h-[138px] overflow-hidden">
                        <QuestionList
                            questions={questions}
                            activeQuestionIndex={activeQuestionIndex}
                            onQuestionSelect={handleQuestionSelect}
                            onAddQuestion={handleAddQuestion}
                            onDeleteQuestion={handleDeleteQuestion}
                            isCollapsed={isQuestionListCollapsed}
                            onCollapseToggle={(collapsed) => setIsQuestionListCollapsed(collapsed)}
                            onReorderQuestions={handleReorderQuestions}
                            collectionId={collectionId}
                            activities={activities}
                            onReorderActivities={handleReorderActivities}
                        />
                    </div>
                </div>
            </div>
        </DndProvider>
    ) : (
        <div className="w-full py-8 flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-xl mb-4">No collection data available</h2>
                <Button onClick={refreshCollectionData}>Refresh Data</Button>
            </div>
        </div>
    );
} 