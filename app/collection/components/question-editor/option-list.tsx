"use client";

import React from "react";
import { Plus, Trash, CheckCircle, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { QuizOption } from "../types";
import { cn } from "@/lib/utils";

interface OptionListProps {
    options: QuizOption[];
    activeQuestionIndex: number;
    questionType: string;  // Add this prop
    onAddOption: () => void;
    onOptionChange: (questionIndex: number, optionIndex: number, field: string, value: any) => void;
    onDeleteOption: (index: number) => void;
}

export function OptionList({
    options,
    activeQuestionIndex,
    questionType,
    onAddOption,
    onOptionChange,
    onDeleteOption
}: OptionListProps) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <Label>{questionType === "multiple_response" ? "Select All That Apply" : "Select One Answer"}</Label>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={onAddOption}
                    disabled={options.length >= 6}
                >
                    <Plus className="h-3.5 w-3.5 mr-2" /> Add Option
                </Button>
            </div>

            <div className="space-y-3">
                {options.map((option, index) => (
                    <div
                        key={index}
                        className={cn(
                            "group flex items-center p-2.5 rounded-md transition-all",
                            option.is_correct
                                ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900"
                                : "bg-card hover:bg-muted/50 border border-border"
                        )}
                    >
                        <div className="flex items-center flex-1 min-w-0">
                            <div className="opacity-40 cursor-grab hover:opacity-100 mr-1.5">
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3",
                                option.is_correct
                                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {['A', 'B', 'C', 'D', 'E', 'F'][index]}
                            </div>
                            <div className="flex-1 truncate">
                                <div className="text-sm">{option.option_text || `Option ${index + 1}`}</div>
                            </div>
                        </div>
                        <div className="flex space-x-1 ml-2">
                            <Button
                                variant={option.is_correct ? "default" : "outline"}
                                size="sm"
                                className={cn(
                                    "h-7 w-7 p-0",
                                    option.is_correct && "bg-green-500 hover:bg-green-600"
                                )}
                                onClick={() =>
                                    onOptionChange(activeQuestionIndex, index, 'is_correct', !option.is_correct)
                                }
                            >
                                <CheckCircle className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0"
                                onClick={() => onDeleteOption(index)}
                                disabled={options.length <= 2}
                            >
                                <Trash className="h-3.5 w-3.5" />
                            </Button>

                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}