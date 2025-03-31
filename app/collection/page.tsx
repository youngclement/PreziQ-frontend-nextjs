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

export default function QuestionsPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const activityId = params.id;

    const [activity, setActivity] = useState<Activity | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [activeTab, setActiveTab] = useState("content");
    const [timeLimit, setTimeLimit] = useState(30); // seconds
    const [backgroundImage, setBackgroundImage] = useState("");
    const [previewMode, setPreviewMode] = useState(false);

    useEffect(() => {
        // Using mock data for activity
        const mockActivity = MOCK_ACTIVITIES.find(act => act.id === activityId);

        if (mockActivity) {
            setActivity(mockActivity);
        } else {
            // If no matching activity in mock data, create a dummy one
            setActivity({
                id: activityId,
                title: "New Activity",
                collection_id: "1",
                description: "This is a new activity",
                is_published: false,
                activity_type_id: "quiz"
            });
        }

        // Using mock data for questions
        const mockQuestionsForActivity = MOCK_QUESTIONS[activityId as keyof typeof MOCK_QUESTIONS] || [];

        if (mockQuestionsForActivity.length > 0) {
            setQuestions(mockQuestionsForActivity);
        } else {
            // Add an empty question if none exist
            setQuestions([createEmptyQuestion()]);
        }
    }, [activityId]);

    const createEmptyQuestion = (): QuizQuestion => ({
        activity_id: activityId,
        question_text: "",
        question_type: "multiple_choice",
        correct_answer_text: "",
        options: [
            { option_text: "", is_correct: true, display_order: 0 },
            { option_text: "", is_correct: false, display_order: 1 },
            { option_text: "", is_correct: false, display_order: 2 },
            { option_text: "", is_correct: false, display_order: 3 }
        ]
    });
    const handleSlideContentChange = (value: string) => {
        const updatedQuestions = [...questions];
        updatedQuestions[activeQuestionIndex] = {
            ...updatedQuestions[activeQuestionIndex],
            slide_content: value
        };
        setQuestions(updatedQuestions);
    };

    // Add a handler for slide image changes
    const handleSlideImageChange = (url: string, questionIndex: number) => {
      const updatedQuestions = [...questions];
      updatedQuestions[questionIndex] = {
        ...updatedQuestions[questionIndex],
        slide_image: url,
      };
      setQuestions(updatedQuestions);
    };

    const handleAddQuestion = (newQuestion?: QuizQuestion) => {
        // If a newQuestion is provided (like a slide), use it
        // Otherwise create an empty question with the default function
        const questionToAdd = newQuestion || createEmptyQuestion();

        setQuestions([...questions, questionToAdd]);
        setActiveQuestionIndex(questions.length);
    };
    const handleDeleteQuestion = (index: number) => {
        if (questions.length <= 1) {
            return; // Don't delete the last question
        }

        const updatedQuestions = [...questions];
        updatedQuestions.splice(index, 1);
        setQuestions(updatedQuestions);

        if (activeQuestionIndex >= updatedQuestions.length) {
            setActiveQuestionIndex(updatedQuestions.length - 1);
        }
    };
    const handleQuestionTextChange = (value: string, questionIndex: number) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex] = {
            ...updatedQuestions[questionIndex],
            question_text: value
        };
        setQuestions(updatedQuestions);
    };

    const handleOptionChange = (questionIndex: number, optionIndex: number, field: string, value: any) => {
        const updatedQuestions = [...questions];
        const options = [...updatedQuestions[questionIndex].options];
        const questionType = updatedQuestions[questionIndex].question_type;

        if (field === 'is_correct' && value === true) {
            // For true_false questions, ensure only one option is correct
            if (questionType === 'true_false') {
                options.forEach((option, i) => {
                    // Set is_correct=true for the clicked option and false for all others
                    options[i] = {
                        ...option,
                        is_correct: i === optionIndex
                    };
                });
            }
            // For multiple_choice questions, also ensure only one option is correct
            else if (questionType === 'multiple_choice') {
                options.forEach((option, i) => {
                    options[i] = { ...option, is_correct: i === optionIndex };
                });
            }
            // For multiple_response, we allow multiple correct answers
            else {
                options[optionIndex] = { ...options[optionIndex], [field]: value };
            }
        } else {
            options[optionIndex] = { ...options[optionIndex], [field]: value };
        }

        updatedQuestions[questionIndex] = {
            ...updatedQuestions[questionIndex],
            options
        };

        setQuestions(updatedQuestions);
    };
    const handleQuestionTypeChange = (value: string) => {
        const updatedQuestions = [...questions];
        let options = [...updatedQuestions[activeQuestionIndex].options];

        // Adjust options based on question type
        if (value === "true_false") {
            // For true/false, we always set True as correct by default
            options = [
                { option_text: "True", is_correct: true, display_order: 0 },
                { option_text: "False", is_correct: false, display_order: 1 }
            ];
        } else if (value === "text_answer") {
            // For text answer, we don't need options
            options = [];
        } else if (options.length < 2) {
            // Ensure we have at least 2 options for multiple choice questions
            options = [
                { option_text: "", is_correct: true, display_order: 0 },
                { option_text: "", is_correct: false, display_order: 1 }
            ];
        } else if (value === "multiple_choice" && updatedQuestions[activeQuestionIndex].question_type === "multiple_response") {
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

            // If no correct option was found, set the first one as correct
            if (!hasCorrect && options.length > 0) {
                options[0] = { ...options[0], is_correct: true };
            }
        }

        updatedQuestions[activeQuestionIndex] = {
            ...updatedQuestions[activeQuestionIndex],
            question_type: value,
            options
        };

        setQuestions(updatedQuestions);
    };
    const handleCorrectAnswerChange = (value: string) => {
        const updatedQuestions = [...questions];
        updatedQuestions[activeQuestionIndex] = {
            ...updatedQuestions[activeQuestionIndex],
            correct_answer_text: value
        };
        setQuestions(updatedQuestions);
    };

    const handleAddOption = () => {
        const updatedQuestions = [...questions];
        const options = [...updatedQuestions[activeQuestionIndex].options];
        const newOption = {
            option_text: "",
            is_correct: false,
            display_order: options.length
        };

        updatedQuestions[activeQuestionIndex] = {
            ...updatedQuestions[activeQuestionIndex],
            options: [...options, newOption]
        };

        setQuestions(updatedQuestions);
    };
    const handleQuestionChange = (field: string, value: any) => {
        const updatedQuestions = [...questions];
        updatedQuestions[activeQuestionIndex] = {
            ...updatedQuestions[activeQuestionIndex],
            [field]: value
        };
        setQuestions(updatedQuestions);
    };
    const handleDeleteOption = (index: number) => {
        if (questions[activeQuestionIndex].options.length <= 2) {
            return; // Don't delete if only 2 options remain
        }

        const updatedQuestions = [...questions];
        const options = [...updatedQuestions[activeQuestionIndex].options];
        options.splice(index, 1);

        // Reorder the remaining options
        options.forEach((option, i) => {
            options[i] = { ...option, display_order: i };
        });

        updatedQuestions[activeQuestionIndex] = {
            ...updatedQuestions[activeQuestionIndex],
            options
        };

        setQuestions(updatedQuestions);
    };

    const handleSave = async () => {
        // Mock saving questions
        console.log("Saving questions:", questions);

        // In a real app, you'd save the questions to your backend
        // For development, just log the data and navigate

        setTimeout(() => {
            // Simulate API delay
            if (activity) {
                // Navigate back to the collection page
                router.push(`/collections/${activity.collection_id}`);
            }
        }, 500);
    };

    const activeQuestion = questions[activeQuestionIndex];

    if (!activity) {
        // Enhanced loading state
        return (
            <div className="container mx-auto py-8 flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                    <p className="text-muted-foreground">Loading question editor...</p>
                </div>
            </div>
        );
    }

    const questionTypeIcons = {
        "multiple_choice": <CheckCircle className="h-4 w-4 mr-2" />,
        "multiple_response": <CheckCircle className="h-4 w-4 mr-2" />,
        "true_false": <XCircle className="h-4 w-4 mr-2" />,
        "text_answer": <AlignLeft className="h-4 w-4 mr-2" />  // Add text answer icon
    };

    const questionTypeLabels = {
        "multiple_choice": "Single Choice",    // Changed label to match question-settings.tsx
        "multiple_response": "Multiple Choice", // Changed label to match question-settings.tsx
        "true_false": "True/False",
        "text_answer": "Text Answer"           // Add text answer label
    };

    return (
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
            />
          </div>
        </div>
      </div>
    );
}