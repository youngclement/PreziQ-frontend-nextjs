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
        scrollToNewestQuestion?: () => void;
        savedBackgroundColors?: Record<string, string>;
    }
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Save, ArrowLeft, Monitor, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
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

// Update the imports to explicitly cast the components as React.FC
const QuestionPreviewComponent = QuestionPreview as React.FC<any>;
const QuestionSettingsComponent = QuestionSettings as React.FC<any>;

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
    const [matchingPairColumnNames, setMatchingPairColumnNames] = useState({
        left: 'Questions',
        right: 'Answers',
    });

    // Use question operations hook
    const {
        timeLimit,
        setTimeLimit,
        handleAddQuestion: handleAddQuestionFromHook,
        handleDeleteQuestion,
        handleDeleteActivity,
        handleQuestionTypeChange,
        handleQuestionLocationChange,
        handleQuestionTextChange,
        handleTimeLimitChange,
        handleAddLocationQuestion: handleAddLocationQuestionFromHook
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
        handleCorrectAnswerChange,
        handleAddOption,
        handleDeleteOption,
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

    // Use effect to listen for time limit update events
    useEffect(() => {
        const handleTimeLimitUpdate = (event: any) => {
            // Check if this update is for our current activity
            if (activity && event.detail && event.detail.activityId === activity.id) {
                console.log('Parent component detected time limit update:', event.detail.timeLimitSeconds);

                // Save current scroll positions of all containers
                const scrollPositions: Record<string, number> = {};
                document.querySelectorAll('.overflow-auto').forEach((container, index) => {
                    scrollPositions[`container-${index}`] = (container as HTMLElement).scrollTop;
                });

                // Update time limit in parent state
                setTimeLimit(event.detail.timeLimitSeconds);

                // Also update the activity object in state
                const updatedActivity = {
                    ...activity,
                    quiz: {
                        ...activity.quiz,
                        timeLimitSeconds: event.detail.timeLimitSeconds
                    }
                };
                setActivity(updatedActivity);

                // Update activities array as well
                if (activities) {
                    const updatedActivities = activities.map(act =>
                        act.id === activity.id ? updatedActivity : act
                    );
                    setActivities(updatedActivities);
                }

                // Restore scroll positions after state updates
                setTimeout(() => {
                    document.querySelectorAll('.overflow-auto').forEach((container, index) => {
                        if (scrollPositions[`container-${index}`]) {
                            (container as HTMLElement).scrollTop = scrollPositions[`container-${index}`];
                        }
                    });
                }, 10);
            }
        };

        // Add event listener
        window.addEventListener('activity:timeLimit:updated', handleTimeLimitUpdate);

        // Cleanup
        return () => {
            window.removeEventListener('activity:timeLimit:updated', handleTimeLimitUpdate);
        };
    }, [activity, activities, setActivity, setActivities, setTimeLimit]);

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
            // Tạo bản sao của activity và cập nhật
            const updatedActivity = {
                ...activity,
                backgroundImage: value
            };

            // Cập nhật background trong cả state và global storage ngay lập tức
            if (typeof window !== 'undefined') {
                // Cập nhật vào global storage
                if (!window.savedBackgroundColors) {
                    window.savedBackgroundColors = {};
                }

                // Lưu lại backgroundColor hiện tại
                if (activity.backgroundColor) {
                    window.savedBackgroundColors[activity.id] = activity.backgroundColor;
                }

                // Phát sự kiện background updated để tất cả các component cập nhật UI
                const event = new CustomEvent('activity:background:updated', {
                    detail: {
                        activityId: activity.id,
                        properties: {
                            backgroundImage: value,
                            backgroundColor: activity.backgroundColor
                        },
                        sender: 'questionsPageContent'
                    }
                });
                window.dispatchEvent(event);
            }

            // Atualizar estado local
            const updatedActivities = activities.map(a =>
                a.id === activity.id ? updatedActivity : a
            );
            setActivities(updatedActivities);

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
            // Lưu lại vị trí cuộn và trạng thái UI hiện tại
            const scrollPositions: Record<string, number> = {};
            document.querySelectorAll('.overflow-auto').forEach((container, index) => {
                scrollPositions[`container-${index}`] = (container as HTMLElement).scrollTop;
            });

            // Lưu lại activity và question hiện tại đang active
            const currentActivityId = activity?.id;
            const currentQuestionIndex = activeQuestionIndex;

            // Cập nhật UI ngay lập tức với thứ tự mới
            if (activities) {
                const activityMap = new Map(activities.map(a => [a.id, a]));
                const reorderedActivities = orderedIds
                    .map(id => activityMap.get(id))
                    .filter(a => a !== undefined);

                // Cập nhật state với activities đã sắp xếp lại
                setActivities(reorderedActivities as any);

                // Quan trọng: Tạo lại danh sách questions mới theo đúng thứ tự của activities
                const questionMap = new Map(questions.map(q => [q.activity_id, q]));
                const reorderedQuestions = orderedIds
                    .map(id => questionMap.get(id))
                    .filter(q => q !== undefined) as typeof questions;

                // Cập nhật state với questions đã sắp xếp lại
                setQuestions(reorderedQuestions);

                // Cập nhật activeQuestionIndex để giữ nguyên câu hỏi đang hiển thị
                if (currentActivityId) {
                    const newActiveIndex = reorderedQuestions.findIndex(q => q.activity_id === currentActivityId);
                    if (newActiveIndex !== -1 && newActiveIndex !== currentQuestionIndex) {
                        setActiveQuestionIndex(newActiveIndex);
                    }
                }
            }

            // Khôi phục vị trí cuộn sau khi cập nhật UI
            setTimeout(() => {
                document.querySelectorAll('.overflow-auto').forEach((container, index) => {
                    if (scrollPositions[`container-${index}`]) {
                        (container as HTMLElement).scrollTop = scrollPositions[`container-${index}`];
                    }
                });
            }, 10);

            // Gọi API với đầy đủ danh sách orderedIds
            await CollectionService.reorderActivities(collectionId, orderedIds);
        } catch (error) {
            console.error("Error reordering activities:", error);
            // Không gọi refreshCollectionData() để tránh reload toàn bộ trang
        }
    };

    // Handle reordering questions within an activity
    const handleReorderQuestions = async (orderedQuestionIds: string[]) => {
        if (!activity) return;

        try {
            // Lưu lại vị trí cuộn và trạng thái UI hiện tại
            const scrollPositions: Record<string, number> = {};
            document.querySelectorAll('.overflow-auto').forEach((container, index) => {
                scrollPositions[`container-${index}`] = (container as HTMLElement).scrollTop;
            });

            // Lưu lại question hiện tại đang active
            const currentQuestionId = questions[activeQuestionIndex]?.id;

            // Cập nhật UI ngay lập tức
            const questionMap = new Map(questions.map(q => [q.id, q]));
            const reorderedQuestions = orderedQuestionIds
                .map(id => questionMap.get(id))
                .filter(q => q !== undefined) as typeof questions;

            // Cập nhật state
            setQuestions(reorderedQuestions);

            // Nếu có question active, cập nhật lại index mới sau khi sắp xếp
            if (currentQuestionId) {
                const newIndex = reorderedQuestions.findIndex(q => q.id === currentQuestionId);
                if (newIndex !== -1 && newIndex !== activeQuestionIndex) {
                    setActiveQuestionIndex(newIndex);
                }
            }

            // Khôi phục vị trí cuộn sau khi cập nhật UI
            setTimeout(() => {
                document.querySelectorAll('.overflow-auto').forEach((container, index) => {
                    if (scrollPositions[`container-${index}`]) {
                        (container as HTMLElement).scrollTop = scrollPositions[`container-${index}`];
                    }
                });
            }, 10);

            // Gọi API để lưu thay đổi với đầy đủ danh sách ID
            await CollectionService.reorderQuestions(activity.id, orderedQuestionIds);
        } catch (error) {
            console.error("Error reordering questions:", error);
            // Không gọi refreshCollectionData() để tránh reload toàn bộ trang
        }
    };

    // Replace the original handleAddQuestion function with a simplified version that uses the hook
    const handleAddQuestion = async () => {
        await handleAddQuestionFromHook();

        // Use the scrollToNewestQuestion function exposed by QuestionPreview
        setTimeout(() => {
            if (typeof window !== 'undefined' && window.scrollToNewestQuestion) {
                window.scrollToNewestQuestion();
            }
        }, 200);
    };

    // Add a function to handle adding location questions
    const handleAddLocationQuestion = async (pointType: string = "STANDARD") => {
        await handleAddLocationQuestionFromHook(pointType);

        // Use the scrollToNewestQuestion function exposed by QuestionPreview
        setTimeout(() => {
            if (typeof window !== 'undefined' && window.scrollToNewestQuestion) {
                window.scrollToNewestQuestion();
            }
        }, 200);
    };

    const handleSetTimeLimit = (value: number) => {
        setTimeLimit(value);
        // Call the hook's handleTimeLimitChange function which will update the API
        if (handleTimeLimitChange) {
            handleTimeLimitChange(value);
        }
    };

    const handleMatchingPairColumnNamesChange = (left: string, right: string) => {
        setMatchingPairColumnNames({ left, right });
        // Here you might want to debounce an API call to save these names
        // For now, it just updates the local state
    };

    // Function to handle changes in matching pair options
    const handleMatchingPairOptionsChange = (questionIndex: number, newOptions: any[]) => {
        const updatedQuestions = [...questions];
        if (updatedQuestions[questionIndex]) {
            updatedQuestions[questionIndex].options = newOptions;
            setQuestions(updatedQuestions);

            // TODO: Add API call to persist changes for matching pair options
            // This would typically involve calling a function from useQuestionOperations
            // that is designed to update the entire options array for a question.
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

                    <div className="col-span-12 grid grid-cols-12 pt-3 gap-4 overflow-hidden"
                        style={{
                            height: isQuestionListCollapsed
                                ? 'calc(100vh - 52px)' // Chiều cao gần như toàn màn hình khi thu gọn hoàn toàn
                                : 'calc(100vh - 190px)' // Chiều cao bình thường khi có question list
                        }}
                    >

                        {/* Question Preview - scrollable */}
                        <div className="col-span-12 md:col-span-8 overflow-auto h-full pb-1">
                            {questions[activeQuestionIndex] && (
                                <QuestionPreviewComponent
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
                                    onAddOption={handleAddOption}
                                    onDeleteOption={handleDeleteOption}
                                    onDeleteActivity={(activityId: string) => {
                                        // Lưu vị trí cuộn hiện tại của tất cả các container có scroll
                                        const scrollPositions: Record<string, number> = {};
                                        document.querySelectorAll('.overflow-auto').forEach((container, index) => {
                                            scrollPositions[`container-${index}`] = (container as HTMLElement).scrollTop;
                                        });

                                        // Tạm thời vô hiệu hóa scroll để ngăn UI nhảy
                                        if (typeof document !== 'undefined') {
                                            document.body.style.overflow = 'hidden';
                                        }

                                        // Update local state without refreshing page
                                        // Remove activity from activities array
                                        const updatedActivities = activities.filter(a => a.id !== activityId);
                                        setActivities(updatedActivities);

                                        // Remove question from questions array
                                        const questionIndex = questions.findIndex(q => q.activity_id === activityId);
                                        if (questionIndex !== -1) {
                                            const updatedQuestions = [...questions];
                                            updatedQuestions.splice(questionIndex, 1);

                                            // Calculate new active index before updating questions
                                            let newActiveIndex = activeQuestionIndex;

                                            // If deleting the active question or one before it, adjust the index
                                            if (questionIndex === activeQuestionIndex) {
                                                // If deleting active question, go to previous question if possible
                                                newActiveIndex = questionIndex > 0 ? questionIndex - 1 : 0;
                                            } else if (questionIndex < activeQuestionIndex) {
                                                // If deleting a question before the active one, decrement the index
                                                newActiveIndex = activeQuestionIndex - 1;
                                            }

                                            // Make sure the new index is valid
                                            newActiveIndex = Math.min(newActiveIndex, updatedQuestions.length - 1);
                                            newActiveIndex = Math.max(0, newActiveIndex);

                                            // Update questions array first
                                            setQuestions(updatedQuestions);

                                            // Only update activity and active index if we have questions left
                                            if (updatedQuestions.length > 0) {
                                                // Set active index and activity in a single batched update to minimize repaints
                                                const newActiveQuestion = updatedQuestions[newActiveIndex];
                                                const newActiveActivity = updatedActivities.find(a => a.id === newActiveQuestion.activity_id);

                                                // Important: Don't trigger scroll by setting lastQuestionClick timestamp
                                                window.lastQuestionClick = Date.now();

                                                // Update state in one pass to reduce renders
                                                setActiveQuestionIndex(newActiveIndex);
                                                if (newActiveActivity) {
                                                    setActivity(newActiveActivity);
                                                }
                                            } else {
                                                setActivity(null);
                                            }

                                            // Khôi phục vị trí cuộn sau khi cập nhật state
                                            setTimeout(() => {
                                                document.querySelectorAll('.overflow-auto').forEach((container, index) => {
                                                    if (scrollPositions[`container-${index}`]) {
                                                        (container as HTMLElement).scrollTop = scrollPositions[`container-${index}`];
                                                    }
                                                });

                                                // Bật lại scroll sau khi đã khôi phục vị trí
                                                if (typeof document !== 'undefined') {
                                                    document.body.style.overflow = '';
                                                }
                                            }, 50);
                                        }
                                    }}
                                    leftColumnName={matchingPairColumnNames.left}
                                    rightColumnName={matchingPairColumnNames.right}
                                />
                            )}
                        </div>

                        {/* Question Settings - scrollable */}
                        <div className="col-span-12 md:col-span-4 overflow-auto h-full pb-1">
                            <QuestionSettingsComponent
                                activeQuestion={questions[activeQuestionIndex]}
                                activeQuestionIndex={activeQuestionIndex}
                                activeTab={activeTab}
                                timeLimit={timeLimit}
                                backgroundImage={backgroundImage}
                                questionTypeIcons={questionTypeIcons}
                                questionTypeLabels={questionTypeLabels}
                                onTabChange={setActiveTab}
                                onQuestionTypeChange={(value: string) => {
                                    handleQuestionTypeChange(value as any, activeQuestionIndex);
                                }}
                                onTimeLimitChange={handleSetTimeLimit}
                                onBackgroundImageChange={(value: string) => handleBackgroundImageChange(value)}
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
                                onMatchingPairColumnNamesChange={handleMatchingPairColumnNamesChange}
                                onMatchingPairOptionsChange={handleMatchingPairOptionsChange}
                                leftColumnName={matchingPairColumnNames.left}
                                rightColumnName={matchingPairColumnNames.right}
                            />
                        </div>
                    </div>

                    {/* Question List - fixed at bottom with fixed height */}
                    <div className={cn(
                        "col-span-12 relative",
                        isQuestionListCollapsed ? "h-1 min-h-[1px] mb-8 overflow-visible" : "overflow-hidden"
                    )}>
                        <QuestionList
                            questions={questions}
                            activeQuestionIndex={activeQuestionIndex}
                            onQuestionSelect={handleQuestionSelect}
                            onAddQuestion={handleAddQuestion}
                            onDeleteQuestion={handleDeleteQuestion}
                            isCollapsed={isQuestionListCollapsed}
                            onCollapseToggle={(collapsed) => {
                                setIsQuestionListCollapsed(collapsed);
                                // Điều chỉnh lại các scroll container nếu cần
                                setTimeout(() => {
                                    window.dispatchEvent(new Event('resize'));
                                }, 300);
                            }}
                            onReorderQuestions={handleReorderQuestions}
                            collectionId={collectionId}
                            activities={activities}
                            onReorderActivities={handleReorderActivities}
                            onAddLocationQuestion={handleAddLocationQuestion}
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