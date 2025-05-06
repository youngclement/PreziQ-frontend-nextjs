"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckIcon, RefreshCcw, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TextAnswerFormProps {
  correctAnswerText: string;
  onTextAnswerChange: (value: string) => void;
  onTextAnswerBlur: () => void;
}

export function TextAnswerForm({
  correctAnswerText,
  onTextAnswerChange,
  onTextAnswerBlur
}: TextAnswerFormProps) {
  const [editValue, setEditValue] = useState(correctAnswerText);
  const [isEditing, setIsEditing] = useState(false);
  
  // Sync with external props
  useEffect(() => {
    setEditValue(correctAnswerText);
  }, [correctAnswerText]);

  const handleSaveAnswer = () => {
    onTextAnswerChange(editValue);
    setIsEditing(false);
    onTextAnswerBlur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveAnswer();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="correct-answer" className="text-base font-medium flex items-center">
          <CheckIcon className="h-4 w-4 mr-2 text-green-500" />
          Correct Answer
        </Label>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <Info className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="w-[220px] text-xs">
                Students must type this exact answer to be marked as correct. The answer is case-sensitive.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className={cn(
        "p-4 rounded-lg border transition-all",
        isEditing 
          ? "bg-white dark:bg-gray-800 border-primary" 
          : "bg-muted/30 hover:bg-muted/50 cursor-pointer"
      )}>
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              id="correct-answer"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter the correct answer"
              className="w-full border-gray-200 focus:ring-primary"
              onKeyDown={handleKeyDown}
              autoFocus
            />
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setEditValue(correctAnswerText);
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              
              <Button 
                size="sm"
                onClick={handleSaveAnswer}
                className="bg-primary hover:bg-primary/90"
              >
                Save Answer
              </Button>
            </div>
          </div>
        ) : (
          <div onClick={() => setIsEditing(true)} className="min-h-[60px]">
            {correctAnswerText ? (
              <div className="p-2 bg-green-50 border border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-900/30 dark:text-green-400 rounded">
                {correctAnswerText}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground py-4">
                <span>Click to add correct answer</span>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Students must type this exact answer to be marked correct
      </p>
    </div>
  );
}