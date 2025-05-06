/**
 * Extending Window interface to include our custom properties
 */
declare global {
  interface Window {
    updateQuestionTimer: ReturnType<typeof setTimeout>;
    updateCorrectAnswerTimer: ReturnType<typeof setTimeout>;
    scrollSyncTimer: NodeJS.Timeout | undefined;
  }
}

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Monitor, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Import components
import { QuestionList } from "./components/question-editor/question-list";
import { QuestionPreview } from "./components/question-editor/question-preview";
import { QuestionSettings } from "./components/question-editor/question-settings";

// Import custom hooks
import { useCollectionData } from "./hooks/use-collection-data";
import { useQuestionOperations } from "./hooks/use-question-operations";
import { useOptionOperations } from "./hooks/use-option-operations";
import { useSlideOperations } from "./hooks/use-slide-operations";

// Import utility functions and constants
import { clearScrollTimers } from "./utils/question-helpers";
import { questionTypeLabels, questionTypeIcons } from "./utils/question-type-mapping";

export default function QuestionsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const activityId = params.id;

  // Hard-coded collection ID as requested
  const COLLECTION_ID = "c2fd3da5-ab44-432c-81c6-1b623c31ab39";

  // State for UI
  const [activeTab, setActiveTab] = useState("content");
  const [backgroundImage, setBackgroundImage] = useState("");
  const [previewMode, setPreviewMode] = useState(false);

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
  } = useCollectionData(COLLECTION_ID, activityId);

  // Use question operations hook
  const {
    timeLimit,
    setTimeLimit,
    handleAddQuestion,
    handleDeleteQuestion,
    handleDeleteActivity,
    handleQuestionTypeChange,
    handleQuestionTextChange
  } = useQuestionOperations(
    COLLECTION_ID,
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

  return activity ? (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-4 bg-card p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/collections/${activity.collection_id}`)}
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
        {/* Left sidebar - Questions list */}
        <div className="col-span-12 md:col-span-2">
          <QuestionList
            questions={questions}
            activeQuestionIndex={activeQuestionIndex}
            onQuestionSelect={handleQuestionSelect}
            onAddQuestion={handleAddQuestion}
            onDeleteQuestion={handleDeleteQuestion}
          />
        </div>

        {/* Main content area */}
        <div className="col-span-12 md:col-span-8">
          {questions[activeQuestionIndex] && (
            <QuestionPreview
              questions={questions}
              activeQuestionIndex={activeQuestionIndex}
              timeLimit={timeLimit}
              backgroundImage={backgroundImage}
              previewMode={previewMode}
              onQuestionTextChange={handleQuestionTextChange}
              onOptionChange={(questionIndex, optionIndex, field, value) => {
                if (questions[questionIndex].question_type === "reorder" && field === "option_text") {
                  updateReorderOptionContent(questionIndex, optionIndex, value);
                } else {
                  handleOptionChange(questionIndex, optionIndex, field, value);
                }
              }}
              onChangeQuestion={handleQuestionSelect}
              onSlideImageChange={handleSlideImageChange}
            />
          )}
        </div>

        {/* Right sidebar - Settings */}
        <div className="col-span-12 md:col-span-2">
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
              handleQuestionTypeChange(value as "true_false" | "text_answer" | "multiple_choice" | "multiple_response" | "reorder" | "slide");
            }}
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