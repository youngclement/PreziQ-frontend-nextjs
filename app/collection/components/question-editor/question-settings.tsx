"use client";

import React from "react";
import { CheckCircle, XCircle, Type, Radio, CheckSquare, AlignLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { QuizQuestion } from "../types";
import { OptionList } from "./option-list";
import { AdvancedSettings } from "./advanced-settings";

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
    onOptionChange: (questionIndex: number, optionIndex: number, field: string, value: any) => void;
    onDeleteOption: (index: number) => void;
    onCorrectAnswerChange?: (value: string) => void;
}

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
    onCorrectAnswerChange
}: QuestionSettingsProps) {
    // State to store the correct answer text for text_answer type
    const [correctAnswerText, setCorrectAnswerText] = React.useState(
        activeQuestion.correct_answer_text || ""
    );

    // Update text answer when changing
    const handleTextAnswerChange = (value: string) => {
        setCorrectAnswerText(value);
        if (onCorrectAnswerChange) {
            onCorrectAnswerChange(value);
        }
    };

    // Helper function to render correct answer UI based on question type
    const renderCorrectAnswerUI = () => {
        switch (activeQuestion.question_type) {
            case "true_false":
                return (
                    <div className="space-y-2 mt-4 p-4 bg-muted/30 rounded-md">
                        <Label className="font-medium">Correct Answer</Label>
                        <RadioGroup
                            value={
                                activeQuestion.options.find(opt => opt.is_correct)?.option_text === "True"
                                    ? "true"
                                    : "false"
                            }
                            onValueChange={(value) => {
                                // Find the indices of True and False options
                                const trueIndex = activeQuestion.options.findIndex(
                                    opt => opt.option_text === "True"
                                );
                                const falseIndex = activeQuestion.options.findIndex(
                                    opt => opt.option_text === "False"
                                );

                                // Set the correct option based on the value
                                if (trueIndex >= 0 && falseIndex >= 0) {
                                    if (value === "true") {
                                        onOptionChange(activeQuestionIndex, trueIndex, 'is_correct', true);
                                        // Setting false will happen automatically in handleOptionChange
                                    } else {
                                        onOptionChange(activeQuestionIndex, falseIndex, 'is_correct', true);
                                        // Setting false will happen automatically in handleOptionChange
                                    }
                                }
                            }}
                            className="flex flex-col space-y-2"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="true" id="true" />
                                <Label htmlFor="true" className="flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" /> True
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="false" id="false" />
                                <Label htmlFor="false" className="flex items-center">
                                    <XCircle className="h-4 w-4 mr-2 text-red-500" /> False
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                );
            case "text_answer":
                return (
                    <div className="space-y-2 mt-4 p-4 bg-muted/30 rounded-md">
                        <Label className="font-medium">Correct Answer Text</Label>
                        <Input
                            value={correctAnswerText}
                            onChange={(e) => handleTextAnswerChange(e.target.value)}
                            placeholder="Enter the correct answer"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Student answer will be compared to this text (case insensitive)
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Card className="h-full">
            <CardHeader className="p-4">
                <CardTitle className="text-sm">
                    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
                        <TabsList className="grid grid-cols-2 w-full">
                            <TabsTrigger value="content">Content</TabsTrigger>
                            <TabsTrigger value="settings">Settings</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                <Tabs value={activeTab}>
                    <TabsContent value="content" className="mt-0">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Question Type</Label>
                                <Select
                                    value={activeQuestion.question_type}
                                    onValueChange={onQuestionTypeChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
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
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Show correct answer UI for true/false and text answers */}
                            {renderCorrectAnswerUI()}

                            {/* Only show options list for multiple choice and multiple response */}
                            {(activeQuestion.question_type === "multiple_choice" ||
                                activeQuestion.question_type === "multiple_response") && (
                                    <OptionList
                                        options={activeQuestion.options}
                                        activeQuestionIndex={activeQuestionIndex}
                                        onAddOption={onAddOption}
                                        onOptionChange={onOptionChange}
                                        onDeleteOption={onDeleteOption}
                                        questionType={activeQuestion.question_type}
                                    />
                                )}
                        </div>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-0">
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
            </CardContent>
        </Card>
    );
}