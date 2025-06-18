"use client";

import React, { useEffect, useRef } from "react";
import { Plus, Trash, CheckCircle, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { QuizOption } from "../types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface OptionListProps {
    options: QuizOption[];
    activeQuestionIndex: number;
    questionType: string;  // Add this prop
    onAddOption: () => void;
    onOptionChange: (questionIndex: number, optionIndex: number, field: string, value: any, isTyping?: boolean) => void;
    onDeleteOption: (index: number) => void;
}

// Update the OptionList.tsx file to include the answer text input
export function OptionList({
    options,
    activeQuestionIndex,
    questionType,
    onAddOption,
    onOptionChange,
    onDeleteOption
}: OptionListProps) {
    // Reference to the option container to scroll to newly added options
    const optionsContainerRef = useRef<HTMLDivElement>(null);

    // Scroll to the bottom when options change (new option added)
    useEffect(() => {
        if (optionsContainerRef.current && options.length > 0) {
            const container = optionsContainerRef.current;
            container.scrollTop = container.scrollHeight;
        }
    }, [options.length]);

    // Function to handle radio button change for multiple choice questions
    const handleCorrectAnswerChange = (optionIndex: number, checked: boolean) => {
        // if (questionType === 'multiple_choice' && checked) {
        //     // For multiple choice, set all other options to false and this one to true
        //     options.forEach((_, index) => {
        //         const newValue = index === optionIndex;
        //         onOptionChange(activeQuestionIndex, index, "is_correct", newValue, false);
        //     });
        // } else {
        //     // For multiple response, just toggle the checked state for this option
        //     onOptionChange(activeQuestionIndex, optionIndex, "is_correct", checked, false);
        // }
        onOptionChange(activeQuestionIndex, optionIndex, "is_correct", checked, false);
    };

    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label>
            {questionType === 'multiple_response'
              ? 'Select All That Apply'
              : 'Select One Answer'}
          </Label>
          <Button
            size="sm"
            variant="outline"
            onClick={onAddOption}
            disabled={options.length > 9}
          >
            <Plus className="h-3.5 w-3.5 mr-2" /> Add Option
          </Button>
        </div>

        <div
          className="space-y-3 max-h-[400px] overflow-y-auto pr-1"
          ref={optionsContainerRef}
        >
          {options.map((option, index) => (
            <div
              key={index}
              className={cn(
                'group flex flex-col p-2.5 rounded-md transition-all',
                option.is_correct
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900'
                  : 'bg-card hover:bg-muted/50 border border-border'
              )}
            >
              <div className="flex items-center flex-1 min-w-0">
                <div className="opacity-40 cursor-grab hover:opacity-100 mr-1.5">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3',
                    option.is_correct
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {index + 1}
                </div>
                <div className="flex-1">
                  <Input
                    value={option.option_text}
                    onChange={(e) =>
                      onOptionChange(
                        activeQuestionIndex,
                        index,
                        'option_text',
                        e.target.value,
                        true
                      )
                    }
                    placeholder="Enter option text"
                    onBlur={(e) => {
                      onOptionChange(
                        activeQuestionIndex,
                        index,
                        'option_text',
                        e.target.value,
                        false
                      );
                    }}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center space-x-2">
                  <input
                    type={
                      questionType === 'multiple_choice' ? 'radio' : 'checkbox'
                    }
                    checked={option.is_correct}
                    onChange={(e) =>
                      handleCorrectAnswerChange(index, e.target.checked)
                    }
                    className="h-4 w-4"
                  />
                  <Label>Correct Answer</Label>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteOption(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
}