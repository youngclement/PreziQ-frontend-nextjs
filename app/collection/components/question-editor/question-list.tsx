"use client";

import React from "react";
import { Plus, Trash, GripVertical, Search, CheckCircle, CheckSquare, XCircle, AlignLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QuizQuestion } from "../types";
import { cn } from "@/lib/utils";

interface QuestionListProps {
    questions: QuizQuestion[];
    activeQuestionIndex: number;
    onQuestionSelect: (index: number) => void;
    onAddQuestion: (newQuestion?: QuizQuestion) => void;
    onDeleteQuestion: (index: number) => void;
}

export function QuestionList({
    questions,
    activeQuestionIndex,
    onQuestionSelect,
    onAddQuestion,
    onDeleteQuestion
}: QuestionListProps) {
    // For a more realistic UI - this would actually filter questions in a real implementation
    const [searchQuery, setSearchQuery] = React.useState("");
    const [expandedView, setExpandedView] = React.useState(true);

    // Add handleQuestionClick function to track click timestamp and update selection
    const handleQuestionClick = (index: number) => {
        // Set timestamp for the most recent click
        window.lastQuestionClick = Date.now();

        // Update the active question index
        onQuestionSelect(index);
    };

    // Question type icons
    const questionTypeIcons = {
        "multiple_choice": <CheckCircle className="h-3.5 w-3.5" />,
        "multiple_response": <CheckSquare className="h-3.5 w-3.5" />,
        "true_false": <XCircle className="h-3.5 w-3.5" />,
        "text_answer": <AlignLeft className="h-3.5 w-3.5" />
    };

    const getQuestionColor = (index: number) => {
        // Create a sequence of colors for questions
        const colors = [
            "from-blue-500/10 to-indigo-500/10",
            "from-purple-500/10 to-pink-500/10",
            "from-green-500/10 to-teal-500/10",
            "from-orange-500/10 to-yellow-500/10",
            "from-red-500/10 to-pink-500/10"
        ];

        return colors[index % colors.length];
    };

    const renderQuestionThumbnail = (question: QuizQuestion, index: number) => {
        const isActive = index === activeQuestionIndex;

        // Get only correct options for display in thumbnail
        const correctOptions = question.options.filter(opt => opt.is_correct);

        return (
            <div
                key={index}
                className={cn(
                    "mb-3 cursor-pointer transition-all rounded-md overflow-hidden shadow-sm border",
                    isActive
                        ? "border-primary ring-1 ring-primary scale-[1.02]"
                        : "border-transparent hover:border-gray-300"
                )}
                onClick={() => handleQuestionClick(index)}
            >
                <div className="relative">
                    {/* Question number badge */}
                    <div className="absolute top-2 left-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10">
                        {index + 1}
                    </div>

                    {/* Question type badge */}
                    <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 text-[10px] px-1.5 py-0.5 rounded-sm z-10 flex items-center shadow-sm">
                        {questionTypeIcons[question.question_type as keyof typeof questionTypeIcons]}
                        <span className="ml-1 capitalize">
                            {question.question_type.replace(/_/g, ' ')}
                        </span>
                    </div>

                    {/* Question content */}
                    <div className="flex flex-col h-full">
                        {/* Question area */}
                        <div className={cn(
                            "w-full h-36 bg-gradient-to-r p-3 flex flex-col",
                            getQuestionColor(index)
                        )}>
                            <div className="flex justify-between">
                                <div className="flex-1 text-sm font-medium line-clamp-3 mb-2">
                                    {question.question_text || `Question ${index + 1}`}
                                </div>
                            </div>

                            {/* Visual representation of the question */}
                            <div className="flex-1 flex items-center justify-center overflow-hidden">
                                {question.question_type === 'true_false' ? (
                                    <div className="flex gap-3 justify-center w-full">
                                        <div className={cn(
                                            "flex-1 py-1 px-3 rounded-md text-xs flex items-center justify-center",
                                            correctOptions.find(o => o.option_text?.toLowerCase() === 'true')
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                                                : "bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700"
                                        )}>
                                            True
                                        </div>
                                        <div className={cn(
                                            "flex-1 py-1 px-3 rounded-md text-xs flex items-center justify-center",
                                            correctOptions.find(o => o.option_text?.toLowerCase() === 'false')
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                                                : "bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700"
                                        )}>
                                            False
                                        </div>
                                    </div>
                                ) : question.question_type === 'text_answer' ? (
                                    <div className="w-full p-2 bg-white/70 dark:bg-gray-800/70 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-xs text-center">
                                        Text Response Question
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-1.5 w-full">
                                        {question.options.slice(0, 4).map((option, optIdx) => (
                                            <div
                                                key={optIdx}
                                                className={cn(
                                                    "px-2 py-1 rounded-md text-[9px] truncate flex items-center",
                                                    option.is_correct
                                                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                                                        : "bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                                                )}
                                            >
                                                <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] mr-1 flex-shrink-0">
                                                    {['A', 'B', 'C', 'D'][optIdx]}
                                                </div>
                                                <span className="truncate">{option.option_text || `Option ${optIdx + 1}`}</span>
                                            </div>
                                        ))}

                                        {question.options.length > 4 && (
                                            <div className="col-span-2 px-2 py-1 rounded-md text-[9px] bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 text-center">
                                                +{question.options.length - 4} more options
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom toolbar */}
                        <div className="bg-white dark:bg-gray-800 p-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Clone question logic would go here
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                        <rect x="8" y="8" width="12" height="12" rx="2" />
                                        <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                                    </svg>
                                    Clone
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteQuestion(index);
                                }}
                            >
                                <Trash className="h-3 w-3 mr-1" />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderQuestionListItem = (question: QuizQuestion, index: number) => {
        return (
            <div
                key={index}
                className={cn(
                    "flex items-center p-3 hover:bg-muted/50 cursor-pointer transition-all border-l-2 border-transparent",
                    index === activeQuestionIndex && "bg-muted/70 border-l-2 border-primary"
                )}
                onClick={() => handleQuestionClick(index)}
            >
                <div className="flex items-center flex-1 min-w-0">
                    <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-xs font-medium",
                        index === activeQuestionIndex
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted-foreground/10 text-muted-foreground"
                    )}>
                        {index + 1}
                    </div>
                    <div className="truncate">
                        <p className="text-sm font-medium truncate">
                            {question.question_text || `Question ${index + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                            {question.options.length} options • {question.question_type.replace('_', ' ')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1 pl-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                            index === activeQuestionIndex && "opacity-100"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteQuestion(index);
                        }}
                    >
                        <Trash className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                    <div className="cursor-grab opacity-0 group-hover:opacity-50 hover:opacity-100">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Card className="h-full overflow-hidden border-none shadow-md">
            <CardHeader className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border-b border-gray-200 dark:border-gray-700">
                <div className="flex flex-col space-y-2">
                    <CardTitle className="text-sm flex justify-between items-center">
                        <div className="bg-white/80 dark:bg-gray-800/80 px-2.5 py-1 rounded-md shadow-sm border border-gray-200/50 dark:border-gray-700/50">
                            <span className="font-medium text-xs">Questions ({questions.length})</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-md shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-0.5 flex">
                                <Button
                                    variant={expandedView ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 text-xs",
                                        expandedView ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"
                                    )}
                                    onClick={() => setExpandedView(true)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                        <rect x="3" y="3" width="7" height="7" />
                                        <rect x="14" y="3" width="7" height="7" />
                                        <rect x="14" y="14" width="7" height="7" />
                                        <rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                    {/* Grid */}
                                </Button>
                                <Button
                                    variant={!expandedView ? "default" : "ghost"}
                                    size="sm"
                                    className={cn(
                                        "h-7 px-2 text-xs",
                                        !expandedView ? "bg-primary text-primary-foreground" : "bg-transparent text-muted-foreground"
                                    )}
                                    onClick={() => setExpandedView(false)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                        <line x1="8" y1="6" x2="21" y2="6" />
                                        <line x1="8" y1="12" x2="21" y2="12" />
                                        <line x1="8" y1="18" x2="21" y2="18" />
                                        <line x1="3" y1="6" x2="3.01" y2="6" />
                                        <line x1="3" y1="12" x2="3.01" y2="12" />
                                        <line x1="3" y1="18" x2="3.01" y2="18" />
                                    </svg>
                                    {/* List */}
                                </Button>
                            </div>
                            {/* <Button
                                size="sm"
                                variant="ghost"
                                onClick={onAddQuestion}
                                className="h-8 w-8 p-0 rounded-md bg-white dark:bg-gray-800 hover:bg-white/90 dark:hover:bg-gray-800/90 shadow-sm border border-gray-200/50 dark:border-gray-700/50"
                            >
                                <Plus className="h-4 w-4" />
                            </Button> */}
                        </div>
                    </CardTitle>
                    <div className="relative">
                        <div className="absolute left-0 inset-y-0 flex items-center pl-2.5">
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <Input
                            placeholder="Search questions..."
                            className="pl-8 h-9 bg-white dark:bg-gray-900 focus:bg-white dark:focus:bg-gray-900 rounded-md border-gray-200 dark:border-gray-700"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-3 overflow-auto max-h-[calc(100vh-16rem)]">
                {expandedView ? (
                    <div className="space-y-3">
                        {questions.map((question, index) => renderQuestionThumbnail(question, index))}

                        {/* Stacked buttons: Add Quiz and Add Slide */}
                        <div className="space-y-2">
                            {/* Add Quiz Question card */}
                            <div
                                className="cursor-pointer transition-all rounded-md overflow-hidden shadow-sm border border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary flex items-center p-3"
                                onClick={() => onAddQuestion()}
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-3">
                                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Add Quiz Question</p>
                                    <p className="text-xs text-muted-foreground">Multiple choice, True/False, etc.</p>
                                </div>
                            </div>

                            {/* Add Slide card */}
                            <div
                                className="cursor-pointer transition-all rounded-md overflow-hidden shadow-sm border border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary flex items-center p-3"
                                onClick={() => {
                                    const newSlideQuestion: QuizQuestion = {
                                        activity_id: questions[0]?.activity_id || "",
                                        question_text: "New Slide",
                                        question_type: "slide" as const,
                                        correct_answer_text: "",
                                        options: [],
                                        slide_content: ""
                                    };
                                    onAddQuestion(newSlideQuestion);
                                }}
                            >
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mr-3">
                                    <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Add Content Slide</p>
                                    <p className="text-xs text-muted-foreground">Information slide</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-1">
                        {questions.map((question, index) => renderQuestionListItem(question, index))}

                        {/* Add buttons at the bottom of list view too */}
                        <div className="space-y-2 mt-3 px-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onAddQuestion()}
                                className="w-full flex items-center justify-start"
                            >
                                <CheckCircle className="h-3.5 w-3.5 mr-2 text-blue-600" />
                                <span>Add Quiz Question</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const newSlideQuestion: QuizQuestion = {
                                        activity_id: questions[0]?.activity_id || "",
                                        question_text: "New Slide",
                                        question_type: "slide" as const,
                                        correct_answer_text: "",
                                        options: [],
                                        slide_content: ""
                                    };
                                    onAddQuestion(newSlideQuestion);
                                }}
                                className="w-full flex items-center justify-start"
                            >
                                <FileText className="h-3.5 w-3.5 mr-2 text-purple-600" />
                                <span>Add Content Slide</span>
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
            {/* <div className="p-3 bg-muted/50 border-t flex justify-center">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddQuestion}
                    className="w-full bg-card hover:bg-muted transition-colors"
                >
                    <Plus className="h-3.5 w-3.5 mr-2" /> Add Question
                </Button>
            </div> */}
        </Card>
    );
}