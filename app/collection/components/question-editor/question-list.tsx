"use client";

import React from "react";
import { Plus, Trash, GripVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QuizQuestion } from "../types";
import { cn } from "@/lib/utils";

interface QuestionListProps {
    questions: QuizQuestion[];
    activeQuestionIndex: number;
    onQuestionSelect: (index: number) => void;
    onAddQuestion: () => void;
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

    return (
        <Card className="h-full overflow-hidden border-none shadow-md">
            <CardHeader className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
                <div className="flex flex-col space-y-2">
                    <CardTitle className="text-sm flex justify-between items-center">
                        <span>Questions ({questions.length})</span>
                        <Button size="sm" variant="ghost" onClick={onAddQuestion} className="h-8 w-8 p-0 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 shadow-sm">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </CardTitle>
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search questions..."
                            className="pl-8 h-9 bg-white/70 dark:bg-gray-900/70 focus:bg-white dark:focus:bg-gray-900"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0 overflow-auto max-h-[calc(100vh-16rem)]">
                <div className="py-1">
                    {questions.map((question, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center p-3 hover:bg-muted/50 cursor-pointer transition-all border-l-2 border-transparent",
                                index === activeQuestionIndex && "bg-muted/70 border-l-2 border-primary"
                            )}
                            onClick={() => onQuestionSelect(index)}
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
                    ))}
                </div>
            </CardContent>
            <div className="p-3 bg-muted/50 border-t flex justify-center">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onAddQuestion}
                    className="w-full bg-card hover:bg-muted transition-colors"
                >
                    <Plus className="h-3.5 w-3.5 mr-2" /> Add Question
                </Button>
            </div>
        </Card>
    );
}