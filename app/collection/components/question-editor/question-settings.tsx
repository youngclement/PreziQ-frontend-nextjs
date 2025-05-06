'use client';

import React from 'react';
import {
  CheckCircle,
  XCircle,
  Type,
  Radio,
  CheckSquare,
  AlignLeft,
  FileText,
  MoveVertical, // Add this import
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuizQuestion } from '../types';
import { OptionList } from './option-list';
import { AdvancedSettings } from './advanced-settings';
import { Textarea } from '@/components/ui/textarea';
import { FabricToolbar } from '../slide/tool-bar';
import { ReorderOptions } from './reorder-options';

const AnswerTextEditor = ({
  option,
  questionIndex,
  optionIndex,
  onOptionChange
}: {
  option: QuizOption;
  questionIndex: number;
  optionIndex: number;
  onOptionChange: (questionIndex: number, optionIndex: number, field: string, value: any) => void;
}) => {
  return (
    <div className="mt-2 space-y-2">
      <Label htmlFor={`answer-text-${optionIndex}`}>Answer Text</Label>
      <Textarea
        id={`answer-text-${optionIndex}`}
        placeholder="Enter answer text"
        value={option.option_text || ""}
        onChange={(e) => onOptionChange(questionIndex, optionIndex, "option_text", e.target.value)}
        className="min-h-[80px] resize-none"
      />
    </div>
  );
};
interface QuestionSettingsProps {
  activeQuestion: QuizQuestion;
  activeQuestionIndex: number;
  activeTab: string;
  timeLimit: number;
  backgroundImage: string;
  questionTypeIcons: Record<string, React.ReactNode>;
  questionTypeLabels: Record<string, string>;
  onTabChange: (value: string) => void;
  onQuestionTypeChange: (value: string) => void;
  onTimeLimitChange: (value: number) => void;
  onBackgroundImageChange: (value: string) => void;
  onClearBackground: () => void;
  onAddOption: () => void;
  onOptionChange: (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: any
  ) => void;
  onDeleteOption: (index: number) => void;
  onCorrectAnswerChange?: (value: string) => void;
  onSlideContentChange?: (value: string) => void;
  onSlideImageChange?: (value: string) => void;
  onReorderOptions?: (sourceIndex: number, destinationIndex: number) => void;
}
const TextAnswerForm = ({
  correctAnswerText,
  onTextAnswerChange,
  onTextAnswerBlur
}: {
  correctAnswerText: string;
  onTextAnswerChange: (value: string) => void;
  onTextAnswerBlur: () => void;
}) => {
  return (
    <div className="space-y-2 mt-4 p-4 bg-muted/30 rounded-md">
      <Label htmlFor="correct-answer">Correct Answer</Label>
      <Input
        id="correct-answer"
        value={correctAnswerText}
        onChange={(e) => onTextAnswerChange(e.target.value)}
        onBlur={onTextAnswerBlur}
        placeholder="Enter the correct answer"
        className="w-full"
      />
      <p className="text-xs text-muted-foreground">
        Students must type this exact answer to be correct
      </p>
    </div>
  );
};
export function QuestionSettings({
  activeQuestion,
  activeQuestionIndex,
  activeTab,
  timeLimit,
  backgroundImage,
  questionTypeIcons,
  questionTypeLabels,
  onTabChange,
  onQuestionTypeChange,
  onTimeLimitChange,
  onBackgroundImageChange,
  onClearBackground,
  onAddOption,
  onOptionChange,
  onDeleteOption,
  onCorrectAnswerChange,
  onSlideContentChange,
  onSlideImageChange,
  onReorderOptions,
}: QuestionSettingsProps) {
  // State to store the correct answer text for text_answer type
  const [correctAnswerText, setCorrectAnswerText] = React.useState(
    activeQuestion?.correct_answer_text || ''
  );

  // Update state when activeQuestion changes
  React.useEffect(() => {
    setCorrectAnswerText(activeQuestion.correct_answer_text || '');
  }, [activeQuestion.activity_id, activeQuestion.correct_answer_text]);

  // Update text answer when changing
  const handleTextAnswerChange = (value: string) => {
    setCorrectAnswerText(value);
  };

  // Send to API when input loses focus
  const handleTextAnswerBlur = () => {
    if (onCorrectAnswerChange) {
      onCorrectAnswerChange(correctAnswerText);
    }
  };

  // Helper function to render correct answer UI based on question type
  const renderCorrectAnswerUI = () => {
    switch (activeQuestion.question_type) {
      case 'true_false':
        return (
          <div className="space-y-2 mt-4 p-4 bg-muted/30 rounded-md">
            <Label>Correct Answer</Label>
            <div className="flex flex-col gap-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="true-option"
                  checked={activeQuestion.options.findIndex(
                    (o) => o.option_text === "True" && o.is_correct
                  ) > -1}
                  onChange={() => {
                    const trueIdx = activeQuestion.options.findIndex(
                      (o) => o.option_text === "True"
                    );
                    if (trueIdx > -1) {
                      onOptionChange(activeQuestionIndex, trueIdx, "is_correct", true);
                    }
                  }}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                />
                <label htmlFor="true-option" className="text-sm font-medium">True</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="false-option"
                  checked={activeQuestion.options.findIndex(
                    (o) => o.option_text === "False" && o.is_correct
                  ) > -1}
                  onChange={() => {
                    const falseIdx = activeQuestion.options.findIndex(
                      (o) => o.option_text === "False"
                    );
                    if (falseIdx > -1) {
                      onOptionChange(activeQuestionIndex, falseIdx, "is_correct", true);
                    }
                  }}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                />
                <label htmlFor="false-option" className="text-sm font-medium">False</label>
              </div>
            </div>
          </div>
        );
      case 'text_answer':
        return (
          <div className="space-y-2 mt-4 p-4 bg-muted/30 rounded-md">
            <Label htmlFor="correct-answer">Correct Answer</Label>
            <Input
              id="correct-answer"
              value={correctAnswerText}
              onChange={(e) => handleTextAnswerChange(e.target.value)}
              placeholder="Enter the correct answer"
              className="w-full"
              onBlur={() => {
                // This ensures we trigger the callback after focus is lost
                if (onCorrectAnswerChange) {
                  onCorrectAnswerChange(correctAnswerText);
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Students must type this exact answer to be correct
            </p>
          </div>
        );
      case 'slide':
        return (
          <div className="space-y-4 mt-4 p-4 bg-muted/30 rounded-md">
            <FabricToolbar
              onAddText={() => {
                const event = new CustomEvent('fabric:add-text');
                window.dispatchEvent(event);
              }}
              onAddImage={(url) => {
                const event = new CustomEvent('fabric:add-image', {
                  detail: { url },
                });
                window.dispatchEvent(event);
              }}
              onClear={() => {
                const event = new Event('fabric:clear');
                window.dispatchEvent(event);
              }}
            />

            {/* <div className="space-y-2">
              <Label className="font-medium">Slide Content</Label>
              <Textarea
                value={activeQuestion.slide_content || ''}
                onChange={(e) => onSlideContentChange?.(e.target.value)}
                placeholder="Enter content for this informational slide"
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slide-image">Slide Image URL (optional)</Label>
              <Input
                id="slide-image"
                placeholder="Enter image URL"
                value={activeQuestion.slide_image || ''}
                onChange={(e) => onSlideImageChange?.(e.target.value)}
              />
              {activeQuestion.slide_image && (
                <div className="mt-2">
                  <p className="text-sm text-muted-foreground mb-1">Preview:</p>
                  <img
                    src={activeQuestion.slide_image}
                    alt="Slide preview"
                    className="max-h-40 rounded-md object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://via.placeholder.com/300x200?text=Invalid+Image+URL';
                    }}
                  />
                </div>
              )}
            </div> */}
          </div>
        );

      default:
        return null;
    }
  };

  const TrueFalseSelector = ({
    options,
    onOptionChange,
    activeQuestionIndex
  }: {
    options: any[];
    onOptionChange: (questionIndex: number, optionIndex: number, field: string, value: any) => void;
    activeQuestionIndex: number;
  }) => {
    const trueIndex = options.findIndex(opt => opt.option_text.toLowerCase() === 'true');
    const falseIndex = options.findIndex(opt => opt.option_text.toLowerCase() === 'false');

    const isTrueSelected = trueIndex >= 0 && options[trueIndex].is_correct;
    const isFalseSelected = falseIndex >= 0 && options[falseIndex].is_correct;

    return (
      <div className="space-y-2 mt-4 p-4 bg-muted/30 rounded-md">
        <Label>Correct Answer</Label>
        <div className="flex flex-col gap-3">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="true-option"
              checked={isTrueSelected}
              onChange={() => {
                if (trueIndex >= 0) {
                  onOptionChange(activeQuestionIndex, trueIndex, "is_correct", true);
                }
              }}
              className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
            />
            <label htmlFor="true-option" className="text-sm font-medium">True</label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="false-option"
              checked={isFalseSelected}
              onChange={() => {
                if (falseIndex >= 0) {
                  onOptionChange(activeQuestionIndex, falseIndex, "is_correct", true);
                }
              }}
              className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
            />
            <label htmlFor="false-option" className="text-sm font-medium">False</label>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-full border-none shadow-md overflow-hidden">
      <CardHeader className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 border-b border-gray-200 dark:border-gray-700">
        <CardTitle className="text-sm font-medium">Settings</CardTitle>
      </CardHeader>
      <div
        className="overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 14rem)' }}
      >
        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="w-full justify-start px-4 pt-4">
            <TabsTrigger value="type" className="flex-1">
              Type
            </TabsTrigger>
            <TabsTrigger value="content" className="flex-1">
              Content
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Compact the content of each tab */}
          <TabsContent value="type" className="p-4 pt-3">
            {/* Make select more compact */}
            <div className="space-y-3">
              <Label htmlFor="question-type" className="text-sm">
                Question Type
              </Label>
              <Select
                value={activeQuestion?.question_type || 'multiple_choice'}
                onValueChange={onQuestionTypeChange}
              >
                <SelectTrigger id="question-type" className="w-full">
                  <SelectValue placeholder="Select question type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">
                    <div className="flex items-center">
                      <Radio className="h-4 w-4 mr-2 text-primary" />
                      Single Choice
                    </div>
                  </SelectItem>
                  <SelectItem value="multiple_response">
                    <div className="flex items-center">
                      <CheckSquare className="h-4 w-4 mr-2 text-primary" />
                      Multiple Choice
                    </div>
                  </SelectItem>
                  <SelectItem value="true_false">
                    <div className="flex items-center">
                      <div className="flex mr-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <XCircle className="h-4 w-4 text-red-500 -ml-1" />
                      </div>
                      True/False
                    </div>
                  </SelectItem>
                  <SelectItem value="text_answer">
                    <div className="flex items-center">
                      <AlignLeft className="h-4 w-4 mr-2 text-primary" />
                      Text Answer
                    </div>
                  </SelectItem>
                  <SelectItem value="reorder">
                    <div className="flex items-center">
                      <MoveVertical className="h-4 w-4 mr-2 text-primary" />
                      Reorder
                    </div>
                  </SelectItem>
                  <SelectItem value="slide">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-primary" />
                      Information Slide
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="content" className="p-4 pt-3">
            <div className="space-y-4">
              {/* Show correct answer UI for true/false and text answers */}
              {renderCorrectAnswerUI()}

              {/* Only show options list for multiple choice and multiple response */}
              {(activeQuestion.question_type === 'multiple_choice' ||
                activeQuestion.question_type === 'multiple_response') && (
                  <OptionList
                    options={activeQuestion.options}
                    activeQuestionIndex={activeQuestionIndex}
                    onAddOption={onAddOption}
                    onOptionChange={onOptionChange}
                    onDeleteOption={onDeleteOption}
                    questionType={activeQuestion.question_type}
                  />
                )}

              {activeQuestion.question_type === "reorder" && activeTab === "content" && (
                <div className="space-y-4 mt-4">
                  <ReorderOptions
                    options={activeQuestion.options}
                    onOptionChange={onOptionChange}
                    onDeleteOption={onDeleteOption}
                    onAddOption={onAddOption}
                    onReorder={onReorderOptions}
                  />
                </div>
              )}

              {activeQuestion.question_type === 'true_false' && activeTab === 'content' && (
                <TrueFalseSelector
                  options={activeQuestion.options}
                  onOptionChange={onOptionChange}
                  activeQuestionIndex={activeQuestionIndex}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="p-4 pt-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="time-limit">Time Limit (seconds)</Label>
                <div className="flex items-center space-x-2">
                  <Slider
                    id="time-limit"
                    min={5}
                    max={120}
                    step={5}
                    value={[timeLimit]}
                    onValueChange={(value) => onTimeLimitChange(value[0])}
                  />
                  <span className="w-12 text-center">{timeLimit}s</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background-image">Background Image</Label>
                <Input
                  id="background-image"
                  placeholder="Enter image URL"
                  value={backgroundImage}
                  onChange={(e) => onBackgroundImageChange(e.target.value)}
                />
                {backgroundImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-1"
                    onClick={onClearBackground}
                  >
                    Clear Image
                  </Button>
                )}
              </div>

              <AdvancedSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
