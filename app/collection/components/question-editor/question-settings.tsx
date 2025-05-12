'use client';

// Add Window interface extension
declare global {
  interface Window {
    updateActivityTimer: ReturnType<typeof setTimeout>;
    updateActivityBackground?: (activityId: string, properties: { backgroundImage?: string, backgroundColor?: string }) => void;
    savedBackgroundColors?: Record<string, string>;
  }
}

import React, { useState, useRef, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Type,
  Radio,
  CheckSquare,
  AlignLeft,
  FileText,
  MoveVertical,
  MapPin,
  Settings,
  Zap,
  Image as ImageIcon,
  Upload,
  Music,
  Info,
  Eye,
  EyeOff,
  Palette,
  AlertCircle,
  Check,
  ChevronsUpDown
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
import { QuizOption, QuizQuestion } from '../types';
import { OptionList } from './option-list';
import { AdvancedSettings } from './advanced-settings';
import { Textarea } from '@/components/ui/textarea';
import { FabricToolbar } from '../slide/tool-bar';
import { ReorderOptions } from './reorder-options';
import { LocationQuestionEditor } from './location-question-editor';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Switch } from '@/components/ui/switch';
import { storageApi } from '@/api-client/storage-api';
import { activitiesApi } from '@/api-client/activities-api';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SlideSettings } from '../slide/sidebar/slide-settings';
/**
 * Component that allows editing settings for a quiz question/activity.
 * 
 * Features:
 * - Organized into three tabs: Content, Design, and Metadata
 * - Content tab: Question type, answer options, time limit, etc.
 * - Design tab: Background color, background image, background music
 * - Metadata tab: Title, description, publish status
 * 
 * Important note:
 * Any changes made to settings in this component (title, description, background, etc.)
 * will automatically call the API to update the activity. The component handles:
 * - Updating local state for immediate UI feedback
 * - Calling activitiesApi.updateActivity() to save changes to the backend
 * - File uploads for background images to S3 via storageApi.uploadSingleFile()
 * - Showing appropriate loading states and success/error notifications
 */

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
  onSlideImageChange?: (value: string, index: number) => void;
  onReorderOptions?: (sourceIndex: number, destinationIndex: number) => void;
  onQuestionLocationChange?: (questionIndex: number, locationData: any) => void;
  activity?: any; // Atividade associada à questão ativa
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
    <div className="space-y-2 mt-4 p-4 bg-pink-50 dark:bg-pink-900/10 rounded-md border border-pink-100 dark:border-pink-800">
      <Label htmlFor="correct-answer" className="text-pink-800 dark:text-pink-300">Correct Answer</Label>
      <Input
        id="correct-answer"
        value={correctAnswerText}
        onChange={(e) => onTextAnswerChange(e.target.value)}
        onBlur={onTextAnswerBlur}
        placeholder="Enter the correct answer"
        className="w-full bg-white dark:bg-black border-pink-200 dark:border-pink-700 focus-visible:ring-pink-300"
      />
      <p className="text-xs text-pink-600 dark:text-pink-400">
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
  onQuestionLocationChange,
  activity, // Nova propriedade para acessar a atividade atual
}: QuestionSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeType, setActiveType] = useState(activeQuestion?.question_type || "multiple_choice");
  const [correctAnswerText, setCorrectAnswerText] = useState(activeQuestion?.correct_answer_text || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [invalidImageUrl, setInvalidImageUrl] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(activity?.backgroundColor || "#FFFFFF");
  const [customBackgroundMusic, setCustomBackgroundMusic] = useState(activity?.customBackgroundMusic || "");
  const [title, setTitle] = useState(activity?.title || "");
  const [description, setDescription] = useState(activity?.description || "");
  const [isPublished, setIsPublished] = useState(activity?.is_published || false);
  const { toast } = useToast();

  // Track the activity ID to detect changes
  const [prevActivityId, setPrevActivityId] = useState(activity?.id);

  useEffect(() => {
    if (activity) {
      setBackgroundColor(activity.backgroundColor || "#FFFFFF");
      setCustomBackgroundMusic(activity.customBackgroundMusic || "");
      setTitle(activity.title || "");
      setDescription(activity.description || "");
      setIsPublished(activity.is_published || false);

      // Check if we've switched to a different activity
      if (activity.id !== prevActivityId) {
        setPrevActivityId(activity.id);

        // Update the local backgroundImage state if activity has changed
        if (activity.backgroundImage !== backgroundImage) {
          onBackgroundImageChange(activity.backgroundImage || "");
        }
      }
    }
  }, [activity, backgroundImage, onBackgroundImageChange, prevActivityId]);

  // Update state when activeQuestion changes
  React.useEffect(() => {
    if (activeQuestion) {
      setCorrectAnswerText(activeQuestion.correct_answer_text || '');
      setActiveType(activeQuestion.question_type || 'multiple_choice');
    }
  }, [activeQuestion, activeQuestion.activity_id, activeQuestion.correct_answer_text]);

  // Update text answer when changing
  const handleTextAnswerChange = (value: string) => {
    setCorrectAnswerText(value);
    // Immediately call the change handler to update parent state
    if (onCorrectAnswerChange) {
      onCorrectAnswerChange(value);
    }
  };

  // Send to API when input loses focus
  const handleTextAnswerBlur = () => {
    if (activity && activity.id && activeQuestion.question_type === 'text_answer') {
      // Update the quiz in the backend
      try {
        activitiesApi.updateTypeAnswerQuiz(activity.id, {
          type: "TYPE_ANSWER",
          questionText: activeQuestion.question_text,
          pointType: "STANDARD",
          timeLimitSeconds: timeLimit,
          correctAnswer: correctAnswerText
        });
      } catch (error) {
        console.error('Error updating text answer quiz:', error);
        toast({
          title: "Error saving answer",
          description: "Could not save the correct answer. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Handler for slide content changes
  const handleSlideContentChange = (value: string) => {
    if (onSlideContentChange) {
      onSlideContentChange(value);

      // If this is a slide activity, also update the activity description
      if (activity && (activeQuestion.question_type === 'slide' || activeQuestion.question_type === 'info_slide')) {
        debouncedUpdateActivity({ description: value });
      }
    }
  };

  // Handler for slide image changes
  const handleSlideImageChange = (value: string, index: number) => {
    setInvalidImageUrl(false); // Reset invalid state

    if (onSlideImageChange) {
      onSlideImageChange(value, index);

      // Also update activity background image for consistency
      if (activity) {
        debouncedUpdateActivity({ backgroundImage: value });
      }
    }
  };

  // Color mapping for question types
  const questionTypeColors = {
    'multiple_choice': 'bg-purple-100 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/40',
    'multiple_response': 'bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40',
    'true_false': 'bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40',
    'text_answer': 'bg-pink-100 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800 text-pink-800 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/40',
    'reorder': 'bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 text-orange-800 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/40',
    'location': 'bg-cyan-100 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-900/40',
    'slide': 'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/40',
    'info_slide': 'bg-indigo-100 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/40',
  };

  // Replace the QuestionTypeSelector component with this new combobox version
  const QuestionTypeSelector = () => {
    const [open, setOpen] = useState(false);

    const questionTypes = [
      { value: 'multiple_choice', label: 'Single Choice', icon: <Radio className="h-4 w-4 mr-2 text-purple-600" /> },
      { value: 'multiple_response', label: 'Multiple Choice', icon: <CheckSquare className="h-4 w-4 mr-2 text-blue-600" /> },
      { value: 'true_false', label: 'True/False', icon: <div className="flex mr-2"><CheckCircle className="h-4 w-4 text-green-500" /><XCircle className="h-4 w-4 text-red-500 -ml-1" /></div> },
      { value: 'text_answer', label: 'Text Answer', icon: <AlignLeft className="h-4 w-4 mr-2 text-pink-600" /> },
      { value: 'reorder', label: 'Reorder', icon: <MoveVertical className="h-4 w-4 mr-2 text-orange-600" /> },
      { value: 'location', label: 'Location', icon: <MapPin className="h-4 w-4 mr-2 text-cyan-600" /> },
      { value: 'slide', label: 'Information Slide', icon: <FileText className="h-4 w-4 mr-2 text-yellow-600" /> },
      { value: 'info_slide', label: 'Interactive Info Slide', icon: <FileText className="h-4 w-4 mr-2 text-indigo-600" /> },
    ];

    // Find the current question type
    const currentType = questionTypes.find(type => type.value === activeQuestion.question_type) || questionTypes[0];

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between px-3 py-5 h-auto border",
              activeQuestion.question_type && questionTypeColors[activeQuestion.question_type]
            )}
          >
            <div className="flex items-center gap-2">
              {currentType.icon}
              <span className="text-sm font-medium">{currentType.label}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search question type..." />
            <CommandList>
              <CommandEmpty>No question type found.</CommandEmpty>
              <CommandGroup>
                {questionTypes.map((type) => (
                  <CommandItem
                    key={type.value}
                    value={type.value}
                    onSelect={() => {
                      onQuestionTypeChange(type.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5",
                      activeQuestion.question_type === type.value && "bg-accent"
                    )}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                    {activeQuestion.question_type === type.value && (
                      <Check className="ml-auto h-4 w-4" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  // TrueFalse component
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
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className={cn(
          "flex items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 border",
          isTrueSelected
            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 shadow-sm"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/10"
        )}
          onClick={() => {
            if (trueIndex >= 0) {
              onOptionChange(activeQuestionIndex, trueIndex, "is_correct", true);
            }
          }}>
          <CheckCircle className={cn(
            "h-5 w-5 mr-2",
            isTrueSelected ? "text-green-600 dark:text-green-400" : "text-gray-400"
          )} />
          <span className="text-base font-medium">True</span>
        </div>
        <div className={cn(
          "flex items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 border",
          isFalseSelected
            ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 shadow-sm"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/10"
        )}
          onClick={() => {
            if (falseIndex >= 0) {
              onOptionChange(activeQuestionIndex, falseIndex, "is_correct", true);
            }
          }}>
          <XCircle className={cn(
            "h-5 w-5 mr-2",
            isFalseSelected ? "text-red-600 dark:text-red-400" : "text-gray-400"
          )} />
          <span className="text-base font-medium">False</span>
        </div>
      </div>
    );
  };

  // Time settings component
  const TimeSettings = () => {
    const timePresets = [10, 20, 30, 60, 90, 120];

    // Get time limit from the API if available, otherwise use the prop
    const currentTimeLimit = (activity && activity.quiz?.timeLimitSeconds) || timeLimit;

    const handleTimeChange = (value: number) => {
      // Update local state immediately
      onTimeLimitChange(value);

      // Also update any local activity state to ensure UI is updated immediately
      if (activity && activity.quiz) {
        // Create a copy of the activity with updated time limit
        const updatedActivity = {
          ...activity,
          quiz: {
            ...activity.quiz,
            timeLimitSeconds: value
          }
        };

        // If we have direct access to setActivity, call it
        if (typeof window !== 'undefined') {
          // Force re-render by triggering state updates in parent components
          const event = new CustomEvent('activity:timeLimit:updated', {
            detail: { activityId: activity.id, timeLimitSeconds: value }
          });
          window.dispatchEvent(event);
        }
      }

      // Call API to update the quiz based on question type
      if (activity && activity.id) {
        try {
          // First determine what type of quiz we're dealing with
          const questionType = activeQuestion.question_type;
          const quizPayload = { timeLimitSeconds: value };

          // Update with the appropriate quiz API call based on quiz type
          switch (questionType) {
            case 'multiple_choice':
              activitiesApi.updateButtonsQuiz(activity.id, {
                ...quizPayload,
                type: "CHOICE",
                questionText: activity.quiz?.questionText || activeQuestion.question_text,
                pointType: "STANDARD",
                answers: activity.quiz?.quizAnswers || activeQuestion.options?.map(opt => ({
                  answerText: opt.option_text,
                  isCorrect: opt.is_correct,
                  explanation: opt.explanation || ''
                })) || []
              });
              break;
            case 'multiple_response':
              activitiesApi.updateCheckboxesQuiz(activity.id, {
                ...quizPayload,
                type: "CHOICE",
                questionText: activity.quiz?.questionText || activeQuestion.question_text,
                pointType: "STANDARD",
                answers: activity.quiz?.quizAnswers || activeQuestion.options?.map(opt => ({
                  answerText: opt.option_text,
                  isCorrect: opt.is_correct,
                  explanation: opt.explanation || ''
                })) || []
              });
              break;
            case 'true_false':
              activitiesApi.updateTrueFalseQuiz(activity.id, {
                ...quizPayload,
                type: "TRUE_FALSE",
                questionText: activity.quiz?.questionText || activeQuestion.question_text,
                pointType: "STANDARD",
                correctAnswer: activeQuestion.options?.find(o => o.is_correct)?.option_text.toLowerCase() === 'true'
              });
              break;
            case 'text_answer':
              activitiesApi.updateTypeAnswerQuiz(activity.id, {
                ...quizPayload,
                type: "TYPE_ANSWER",
                questionText: activity.quiz?.questionText || activeQuestion.question_text,
                pointType: "STANDARD",
                correctAnswer: activeQuestion.correct_answer_text || ''
              });
              break;
            case 'reorder':
              activitiesApi.updateReorderQuiz(activity.id, {
                ...quizPayload,
                type: "REORDER",
                questionText: activity.quiz?.questionText || activeQuestion.question_text,
                pointType: "STANDARD",
                correctOrder: activeQuestion.options?.map(o => o.option_text) || []
              });
              break;
            default:
              // For slide types or any other type, just update the activity directly
              debouncedUpdateActivity({ timeLimitSeconds: value });
              break;
          }

          console.log(`Updated time limit to ${value}s for ${questionType} question`);
        } catch (error) {
          console.error('Error updating time limit:', error);
          // Fall back to general update if specific API fails
          debouncedUpdateActivity({ timeLimitSeconds: value });
        }
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="time-limit">Time Limit</Label>
          <Badge variant="outline" className="px-2 py-1 font-mono">{currentTimeLimit}s</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Slider
            id="time-limit"
            min={5}
            max={120}
            step={5}
            value={[currentTimeLimit]}
            onValueChange={(value) => handleTimeChange(value[0])}
            className="flex-1"
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-1">
          {timePresets.map(time => (
            <Button
              key={time}
              variant={currentTimeLimit === time ? "default" : "outline"}
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => handleTimeChange(time)}
            >
              {time}s
            </Button>
          ))}
        </div>
      </div>
    );
  };

  // Funções para gerenciamento e upload de imagens
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activity) return;

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid format",
        description: "Please select an image in PNG or JPG format.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (between 1KB and 5MB)
    if (file.size < 1024 || file.size > 5 * 1024 * 1024) {
      toast({
        title: "Invalid file size",
        description: "Image must be between 1KB and 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Simulate upload progress (in practice you can use an axios interceptor)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Upload file
      const response = await storageApi.uploadSingleFile(file, 'uploads');

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('File upload response:', response);

      if (response?.data) {
        // Get the correct fileUrl from the response structure
        let fileUrl = '';

        // Handle different response structures
        const responseData = response.data as Record<string, any>;
        if (responseData && typeof responseData === 'object') {
          if ('fileUrl' in responseData && typeof responseData.fileUrl === 'string') {
            fileUrl = responseData.fileUrl;
          } else if ('data' in responseData &&
            responseData.data &&
            typeof responseData.data === 'object' &&
            'fileUrl' in responseData.data) {
            fileUrl = responseData.data.fileUrl as string;
          }
        }

        if (fileUrl) {
          // Update image URL in local state
          onBackgroundImageChange(fileUrl);

          // Update in API
          await updateActivity({ backgroundImage: fileUrl });

          toast({
            title: "Upload complete",
            description: "Background image has been updated successfully.",
          });
        } else {
          console.error('Invalid response structure:', response);
          toast({
            title: "Upload error",
            description: "Received invalid response from server.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload error",
        description: "Could not upload the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Clear file field
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Function to handle audio file upload
  const audioFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [uploadAudioProgress, setUploadAudioProgress] = useState(0);

  const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activity) return;

    // Check file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid format",
        description: "Please select an audio file in MP3, WAV or OGG format.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Invalid file size",
        description: "Audio file must be smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAudio(true);
    setUploadAudioProgress(10);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadAudioProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Upload file
      const response = await storageApi.uploadSingleFile(file, 'uploads');

      clearInterval(progressInterval);
      setUploadAudioProgress(100);

      console.log('Audio file upload response:', response);

      if (response?.data) {
        // Get the correct fileUrl from the response structure
        let fileUrl = '';

        // Handle different response structures
        const responseData = response.data as Record<string, any>;
        if (responseData && typeof responseData === 'object') {
          if ('fileUrl' in responseData && typeof responseData.fileUrl === 'string') {
            fileUrl = responseData.fileUrl;
          } else if ('data' in responseData &&
            responseData.data &&
            typeof responseData.data === 'object' &&
            'fileUrl' in responseData.data) {
            fileUrl = responseData.data.fileUrl as string;
          }
        }

        if (fileUrl) {
          // Update audio URL in state and API
          setCustomBackgroundMusic(fileUrl);
          await updateActivity({ customBackgroundMusic: fileUrl });

          toast({
            title: "Upload complete",
            description: "Background music has been updated successfully.",
          });
        } else {
          console.error('Invalid response structure:', response);
          toast({
            title: "Upload error",
            description: "Received invalid response from server.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error('Error uploading audio file:', error);
      toast({
        title: "Upload error",
        description: "Could not upload the audio file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAudio(false);
      setUploadAudioProgress(0);
      // Clear file field
      if (audioFileInputRef.current) {
        audioFileInputRef.current.value = '';
      }
    }
  };

  // Function to update activity in the API
  const updateActivity = async (data: any) => {
    if (!activity?.id) return;

    setIsSaving(true);

    // Lưu trước màu mới vào global storage
    if (data.backgroundColor && typeof window !== 'undefined') {
      if (!window.savedBackgroundColors) {
        window.savedBackgroundColors = {};
      }
      window.savedBackgroundColors[activity.id] = data.backgroundColor;
    }

    try {
      // Ensure we're sending the correct API payload shape
      const payload = {
        ...data,
        // Make sure these fields match the API expected format
        title: data.title !== undefined ? data.title : activity.title,
        description: data.description !== undefined ? data.description : activity.description,
        isPublished: data.isPublished !== undefined ? data.isPublished : activity.is_published,
        backgroundColor: data.backgroundColor !== undefined ? data.backgroundColor : activity.backgroundColor,
        backgroundImage: data.backgroundImage !== undefined ? data.backgroundImage : activity.backgroundImage,
        customBackgroundMusic: data.customBackgroundMusic !== undefined ? data.customBackgroundMusic : activity.customBackgroundMusic
      };

      // Only send fields that are actually changing
      const finalPayload = Object.keys(data).reduce((acc, key) => {
        acc[key] = payload[key];
        return acc;
      }, {} as any);

      console.log('Updating activity with payload:', finalPayload);
      await activitiesApi.updateActivity(activity.id, finalPayload);

      // Sau khi API thành công, phát sự kiện để đảm bảo UI được cập nhật đồng bộ
      if (data.backgroundColor && typeof window !== 'undefined') {
        // Đảm bảo lưu màu mới vào global storage
        if (!window.savedBackgroundColors) {
          window.savedBackgroundColors = {};
        }
        window.savedBackgroundColors[activity.id] = data.backgroundColor;

        // Phát sự kiện để thông báo cho tất cả các component
        const event = new CustomEvent('activity:background:updated', {
          detail: {
            activityId: activity.id,
            properties: { backgroundColor: data.backgroundColor },
            sender: 'questionSettings_api'
          }
        });
        window.dispatchEvent(event);
      }

      toast({
        title: "Saved successfully",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error('Error updating activity:', error);

      // Thông báo lỗi nhưng VẪN GIỐNG màu trong UI (không reset về màu cũ)
      toast({
        title: "Error saving changes",
        description: "Could not save your changes to the server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Function to update activity in the API with debounce
  const debouncedUpdateActivity = React.useCallback(
    (data: any) => {
      if (!activity?.id) return;

      setIsSaving(true);

      // Clear any existing timeout
      if (window.updateActivityTimer) {
        clearTimeout(window.updateActivityTimer);
      }

      // Set a new timeout
      window.updateActivityTimer = setTimeout(async () => {
        try {
          await updateActivity(data);
        } finally {
          setIsSaving(false);
        }
      }, 500); // 500ms debounce time
    },
    [activity, updateActivity]
  );

  // Use debounced version for high-frequency updates like color changes
  const handleBackgroundColorChange = (value: string) => {
    // Cập nhật UI ngay lập tức
    if (activity) {
      // Cập nhật trong state local trước
      setBackgroundColor(value);

      // Lưu vào global storage để các component khác có thể sử dụng
      if (typeof window !== 'undefined') {
        if (!window.savedBackgroundColors) window.savedBackgroundColors = {};
        window.savedBackgroundColors[activity.id] = value;

        // Phát sự kiện để thông báo cho các component khác
        const event = new CustomEvent('activity:background:updated', {
          detail: {
            activityId: activity.id,
            properties: { backgroundColor: value },
            sender: 'questionSettings'
          }
        });
        window.dispatchEvent(event);
      }

      // Gửi API update (debounced để tránh quá nhiều request)
      debouncedUpdateActivity({ backgroundColor: value });

      // Cập nhật background trong tất cả các component nếu cần thiết
      if (typeof window !== 'undefined' && window.updateActivityBackground) {
        window.updateActivityBackground(activity.id, { backgroundColor: value });
      }
    }
  };

  // Thêm vào useEffect để lắng nghe các thay đổi về màu nền
  useEffect(() => {
    // Lắng nghe sự kiện cập nhật từ component khác
    const handleBackgroundUpdate = (event: any) => {
      if (event.detail &&
        event.detail.activityId &&
        event.detail.properties &&
        event.detail.properties.backgroundColor &&
        activity &&
        activity.id === event.detail.activityId) {
        // Cập nhật state local nếu sender không phải là chính mình
        if (event.detail.sender !== 'questionSettings') {
          setBackgroundColor(event.detail.properties.backgroundColor);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('activity:background:updated', handleBackgroundUpdate);
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('activity:background:updated', handleBackgroundUpdate);
      }
    };
  }, [activity]);

  // Functions for updating basic fields
  const handleTitleChange = (value: string) => {
    setTitle(value);
    // Update API silently without showing saving state
    if (activity && value !== activity.title) {
      updateActivitySilently({ title: value });
    }
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    // Update API silently without showing saving state
    if (activity && value !== activity.description) {
      updateActivitySilently({ description: value });
    }
  };

  // Silent update without showing saving indicator
  const updateActivitySilently = async (data: any) => {
    if (!activity?.id) return;

    try {
      // Ensure we're sending the correct API payload shape
      const payload = {
        ...data,
        // Make sure these fields match the API expected format
        title: data.title !== undefined ? data.title : activity.title,
        description: data.description !== undefined ? data.description : activity.description,
        isPublished: data.isPublished !== undefined ? data.isPublished : activity.is_published,
        backgroundColor: data.backgroundColor !== undefined ? data.backgroundColor : activity.backgroundColor,
        backgroundImage: data.backgroundImage !== undefined ? data.backgroundImage : activity.backgroundImage,
        customBackgroundMusic: data.customBackgroundMusic !== undefined ? data.customBackgroundMusic : activity.customBackgroundMusic
      };

      // Only send fields that are actually changing
      const finalPayload = Object.keys(data).reduce((acc, key) => {
        acc[key] = payload[key];
        return acc;
      }, {} as any);

      console.log('Silently updating activity with payload:', finalPayload);
      await activitiesApi.updateActivity(activity.id, finalPayload);

      // No toast for silent updates
    } catch (error) {
      console.error('Error updating activity silently:', error);
      // Only show toast for errors
      toast({
        title: "Error saving changes",
        description: "Could not save your changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleIsPublishedChange = (checked: boolean) => {
    setIsPublished(checked);
    debouncedUpdateActivity({ isPublished: checked });
  };

  const handleBackgroundMusicChange = (value: string) => {
    setCustomBackgroundMusic(value);
    // Update API immediately
    if (activity && value !== activity.customBackgroundMusic) {
      debouncedUpdateActivity({ customBackgroundMusic: value });
    }
  };

  // Function to handle background image change from input
  const handleBackgroundImageChange = (value: string) => {
    setInvalidImageUrl(false); // Reset invalid state when URL changes
    onBackgroundImageChange(value);

    // Call the API directly when URL changes
    if (activity && value !== activity.backgroundImage) {
      debouncedUpdateActivity({ backgroundImage: value });
    }
  };

  // Clear background function
  const handleClearBackground = () => {
    setInvalidImageUrl(false);
    onClearBackground();

    // Call API to update
    if (activity && activity.backgroundImage) {
      debouncedUpdateActivity({ backgroundImage: '' });
    }
  };

  const ActivityMetadataTab = () => {
    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="activity-title">Title</Label>
            {isSaving && <Badge variant="outline" className="text-blue-500">Saving...</Badge>}
          </div>
          <Input
            id="activity-title"
            placeholder="Enter activity title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="activity-description">Description</Label>
          <Textarea
            id="activity-description"
            placeholder="Enter a brief description"
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="is-published"
              checked={isPublished}
              onCheckedChange={handleIsPublishedChange}
            />
            <Label htmlFor="is-published">Published</Label>
          </div>
          <div>
            {isPublished ? (
              <Badge className="bg-green-500">
                <Eye className="h-3 w-3 mr-1" />
                Visible
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                <EyeOff className="h-3 w-3 mr-1" />
                Draft
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Background settings component with enhanced styling and upload
  const BackgroundSettings = () => {
    // Thêm state để theo dõi các thay đổi màu và force re-render
    const [colorRenderKey, setColorRenderKey] = useState(0);

    // Thêm danh sách màu pastel dễ thương
    const pastelColors = [
      { color: '#FFD6E0', name: 'Pastel Pink' },
      { color: '#FFEFCF', name: 'Pastel Yellow' },
      { color: '#D1F0E0', name: 'Pastel Green' },
      { color: '#D0F0FD', name: 'Pastel Blue' },
      { color: '#E2D8FD', name: 'Pastel Purple' },
      { color: '#FEE2D5', name: 'Pastel Peach' },
      { color: '#E9F3E6', name: 'Mint Cream' },
      { color: '#F0E6E4', name: 'Pastel Beige' }
    ];

    // Thêm useEffect để lắng nghe sự kiện thay đổi màu
    useEffect(() => {
      const handleBackgroundUpdate = (event: any) => {
        if (event.detail &&
          event.detail.activityId &&
          event.detail.properties &&
          event.detail.properties.backgroundColor &&
          activity &&
          activity.id === event.detail.activityId) {
          // Force re-render khi có thay đổi màu
          setColorRenderKey(prev => prev + 1);
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('activity:background:updated', handleBackgroundUpdate);
      }

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('activity:background:updated', handleBackgroundUpdate);
        }
      };
    }, [activity]);

    // Lấy màu hiện tại từ cả hai nguồn
    // Ưu tiên global storage trước, sau đó mới tới state local
    const currentBackgroundColor = typeof window !== 'undefined' &&
      window.savedBackgroundColors &&
      activity?.id &&
      window.savedBackgroundColors[activity.id]
      ? window.savedBackgroundColors[activity.id]
      : backgroundColor;

    // Hàm chọn màu pastel
    const handlePastelColorSelect = (color: string) => {
      handleBackgroundColorChange(color);
    };

    return (
      <div className="space-y-5" key={colorRenderKey}>
        <div className="space-y-3">
          <Label htmlFor="background-color">Background Color</Label>
          <div className="flex gap-3">
            <div
              className="h-10 w-10 rounded-md border overflow-hidden"
              style={{ backgroundColor: currentBackgroundColor }}
            />
            <Input
              id="background-color"
              type="color"
              value={currentBackgroundColor}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Pastel color palette */}
          <div className="mt-3">
            <div className="text-xs text-gray-500 mb-2 flex items-center">
              <div className="w-3 h-3 bg-gradient-to-r from-pink-200 to-blue-200 rounded-full mr-1.5"></div>
              Pastel Colors
            </div>
            <div className="grid grid-cols-4 gap-2">
              {pastelColors.map((pastel) => (
                <button
                  key={pastel.color}
                  type="button"
                  onClick={() => handlePastelColorSelect(pastel.color)}
                  className="relative group h-14 rounded-md border border-gray-200 dark:border-gray-700 transition-all hover:scale-105 overflow-hidden"
                  title={pastel.name}
                >
                  <div
                    className="absolute inset-0"
                    style={{ backgroundColor: pastel.color }}
                  ></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/10 flex items-center justify-center transition-opacity">
                    <span className="text-xs font-medium text-gray-800 bg-white/80 px-1.5 py-0.5 rounded-sm">
                      {pastel.name}
                    </span>
                  </div>
                  {currentBackgroundColor.toUpperCase() === pastel.color.toUpperCase() && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white dark:bg-gray-800 rounded-full"></div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="background-image">Background Image</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">Supports PNG, JPG (max 5MB, min 1KB)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="relative">
              <Input
                id="background-image"
                placeholder="Background image URL"
                value={backgroundImage}
                onChange={(e) => handleBackgroundImageChange(e.target.value)}
                className="pr-20"
              />
              {backgroundImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-7 text-xs"
                  onClick={handleClearBackground}
                >
                  Clear
                </Button>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
              />
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {backgroundImage && (
            <div className="mt-3 rounded-md overflow-hidden relative h-32 border">
              <Image
                src={backgroundImage}
                alt="Background preview"
                className="w-full h-full object-cover"
                unoptimized
                width={300}
                height={200}
                onError={(e) => {
                  // Set invalid state to prevent infinite loops
                  if (!invalidImageUrl) {
                    setInvalidImageUrl(true);
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Invalid+Image+URL';

                    toast({
                      title: "Invalid image URL",
                      description: "The image URL could not be loaded.",
                      variant: "destructive",
                    });
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Label htmlFor="background-music">Background Music</Label>
          <div className="relative">
            <Input
              id="background-music"
              placeholder="Audio file URL"
              value={customBackgroundMusic}
              onChange={(e) => handleBackgroundMusicChange(e.target.value)}
              className="pr-10"
            />
            {customBackgroundMusic && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 text-xs"
                onClick={() => {
                  setCustomBackgroundMusic('');
                  debouncedUpdateActivity({ customBackgroundMusic: '' });
                }}
              >
                Clear
              </Button>
            )}
          </div>

          <div className="flex gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => audioFileInputRef.current?.click()}
              disabled={isUploadingAudio}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Audio
            </Button>
            <input
              type="file"
              ref={audioFileInputRef}
              onChange={handleAudioFileUpload}
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
              className="hidden"
            />
          </div>

          {isUploadingAudio && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Uploading audio...</span>
                <span>{uploadAudioProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadAudioProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {customBackgroundMusic && (
            <div className="mt-2">
              <audio controls className="w-full h-10">
                <source src={customBackgroundMusic} />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Slide settings component
  const SlideSettingsComponent = () => {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-800">
        {/* <div className="mb-4">
          <Label
            htmlFor="slide-content"
            className="text-yellow-800 dark:text-yellow-300"
          >
            Slide Content
          </Label>
          <Textarea
            id="slide-content"
            placeholder="Enter slide content"
            value={activeQuestion.slide_content || ''}
            onChange={(e) => handleSlideContentChange(e.target.value)}
            className="min-h-[100px] mt-2 bg-white dark:bg-black border-yellow-200 dark:border-yellow-700 focus-visible:ring-yellow-300"
          />
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            Use line breaks to separate paragraphs
          </p>
        </div>

        <div className="mb-4">
          <Label
            htmlFor="slide-image-url"
            className="text-yellow-800 dark:text-yellow-300"
          >
            Slide Image URL
          </Label>
          <div className="relative mt-2">
            <Input
              id="slide-image-url"
              placeholder="Enter image URL"
              value={activeQuestion.slide_image || ''}
              onChange={(e) =>
                handleSlideImageChange(e.target.value, activeQuestionIndex)
              }
              className="pr-10 bg-white dark:bg-black border-yellow-200 dark:border-yellow-700 focus-visible:ring-yellow-300"
            />
            {activeQuestion.slide_image && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 text-xs"
                onClick={() => {
                  handleSlideImageChange('', activeQuestionIndex);
                }}
              >
                Clear
              </Button>
            )}
          </div>
          {activeQuestion.slide_image && (
            <div className="mt-3 rounded-md overflow-hidden relative h-32 border border-yellow-200 dark:border-yellow-700">
              <img
                src={activeQuestion.slide_image}
                alt="Slide image preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Prevent infinite loops by checking if already set to placeholder
                  if (
                    !(e.target as HTMLImageElement).src.includes(
                      'via.placeholder.com'
                    )
                  ) {
                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/300x200?text=Invalid+Image+URL';
                  }
                }}
              />
            </div>
          )}
        </div> */}

          <SlideSettings
            activeQuestion={activeQuestion}
            activeQuestionIndex={activeQuestionIndex}
            handleSlideBackgroundChange={handleBackgroundColorChange}
            handleSlideBackgroundImageChange={handleSlideImageChange}
          />

        <div className="mt-5 pt-4 border-t border-yellow-200 dark:border-yellow-800">
          <h4 className="text-sm font-medium mb-3 text-yellow-800 dark:text-yellow-300">
            Advanced Editing Options
          </h4>
          {/* <FabricToolbar
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
          /> */}
        </div>
      </div>
    );
  };

  // Location settings component
  const LocationSettings = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Radius (meters)</Label>
          <Slider
            min={10}
            max={100}
            step={5}
            value={[activeQuestion.location_data?.radius || 20]}
            onValueChange={(value) => {
              if (onQuestionLocationChange) {
                const updatedData = {
                  ...activeQuestion.location_data,
                  radius: value[0]
                };
                onQuestionLocationChange(activeQuestionIndex, updatedData);
              }
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10m</span>
            <span>{activeQuestion.location_data?.radius || 20}m</span>
            <span>100m</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Hint (Optional)</Label>
          <Textarea
            placeholder="Provide a hint to help students find the location"
            value={activeQuestion.location_data?.hint || ""}
            onChange={(e) => {
              if (onQuestionLocationChange) {
                const updatedData = {
                  ...activeQuestion.location_data,
                  hint: e.target.value
                };
                onQuestionLocationChange(activeQuestionIndex, updatedData);
              }
            }}
            className="min-h-[80px] text-sm"
          />
        </div>
      </div>
    );
  };

  // Content tab for question settings
  const ContentTab = () => {
    return (
      <div className="space-y-6">
        <QuestionTypeSelector />

        {/* Option list for choice questions */}
        {(activeQuestion.question_type === 'multiple_choice' ||
          activeQuestion.question_type === 'multiple_response') && (
          <OptionList
            options={activeQuestion.options}
            activeQuestionIndex={activeQuestionIndex}
            questionType={activeQuestion.question_type}
            onAddOption={onAddOption}
            onOptionChange={(questionIndex, optionIndex, field, value) =>
              onOptionChange(questionIndex, optionIndex, field, value)
            }
            onDeleteOption={onDeleteOption}
          />
        )}

        {/* True/false selector */}
        {activeQuestion.question_type === 'true_false' && (
          <TrueFalseSelector
            options={activeQuestion.options}
            onOptionChange={onOptionChange}
            activeQuestionIndex={activeQuestionIndex}
          />
        )}

        {/* Text answer input */}
        {activeQuestion.question_type === 'text_answer' && (
          <TextAnswerForm
            correctAnswerText={correctAnswerText}
            onTextAnswerChange={handleTextAnswerChange}
            onTextAnswerBlur={handleTextAnswerBlur}
          />
        )}

        {/* Reorder options */}
        {activeQuestion.question_type === 'reorder' && onReorderOptions && (
          <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-md border border-orange-100 dark:border-orange-800">
            <ReorderOptions
              options={activeQuestion.options}
              onOptionChange={(index, field, value) =>
                onOptionChange(activeQuestionIndex, index, field, value)
              }
              onDeleteOption={onDeleteOption}
              onAddOption={onAddOption}
              onReorder={onReorderOptions}
            />
          </div>
        )}

        {/* Slide content editor */}
        {activeQuestion.question_type === 'slide' && <SlideSettingsComponent />}

        {/* Location question editor */}
        {activeQuestion.question_type === 'location' && <LocationSettings />}

        {/* Time limit control - for all question types */}
        <TimeSettings />
      </div>
    );
  };

  return (
    <Card className="border-none overflow-hidden shadow-md h-full w-full">
      <CardHeader className="px-4 py-2 flex flex-row items-center justify-between bg-white dark:bg-gray-950 border-b">
        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Settings
        </CardTitle>
        <div className="flex items-center gap-1">
          <Settings className="h-4 w-4 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent
        className="p-4 bg-white dark:bg-black overflow-auto"
        style={{ height: 'calc(100% - 48px)' }}
      >
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="content" className="text-xs">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Content
            </TabsTrigger>
            <TabsTrigger value="design" className="text-xs">
              <Palette className="h-3.5 w-3.5 mr-1.5" />
              Design
            </TabsTrigger>
            <TabsTrigger value="meta" className="text-xs">
              <Info className="h-3.5 w-3.5 mr-1.5" />
              Metadata
            </TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="mt-0 space-y-5">
            {/* Conteúdo existente para edição de questões */}
            <div className="flex flex-col gap-5">
              {/* Section 1: Question Type */}
              <div>
                <h3 className="text-sm font-medium mb-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Question Type
                </h3>
                <QuestionTypeSelector />
              </div>

              {/* Section 2: Content/Answer Options */}
              <div>
                <h3 className="text-sm font-medium mb-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                  {activeQuestion.question_type === 'slide' ||
                  activeQuestion.question_type === 'info_slide'
                    ? 'Slide Content'
                    : 'Answer Options'}
                </h3>

                {/* Display different content based on question type */}
                {activeQuestion.question_type === 'multiple_choice' ||
                activeQuestion.question_type === 'multiple_response' ? (
                  <div
                    className={cn(
                      'p-3 rounded-md border',
                      activeQuestion.question_type === 'multiple_choice'
                        ? 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800'
                        : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800'
                    )}
                  >
                    <OptionList
                      options={activeQuestion.options}
                      activeQuestionIndex={activeQuestionIndex}
                      questionType={activeQuestion.question_type}
                      onAddOption={onAddOption}
                      onOptionChange={(
                        questionIndex,
                        optionIndex,
                        field,
                        value
                      ) =>
                        onOptionChange(questionIndex, optionIndex, field, value)
                      }
                      onDeleteOption={onDeleteOption}
                    />
                  </div>
                ) : activeQuestion.question_type === 'true_false' ? (
                  <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-md border border-green-100 dark:border-green-800">
                    <TrueFalseSelector
                      options={activeQuestion.options}
                      onOptionChange={onOptionChange}
                      activeQuestionIndex={activeQuestionIndex}
                    />
                  </div>
                ) : activeQuestion.question_type === 'text_answer' ? (
                  <TextAnswerForm
                    correctAnswerText={correctAnswerText}
                    onTextAnswerChange={handleTextAnswerChange}
                    onTextAnswerBlur={handleTextAnswerBlur}
                  />
                ) : activeQuestion.question_type === 'slide' ||
                  activeQuestion.question_type === 'info_slide' ? (
                  <SlideSettingsComponent />
                ) : activeQuestion.question_type === 'reorder' ? (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-md border border-orange-100 dark:border-orange-800">
                    <ReorderOptions
                      options={activeQuestion.options}
                      onOptionChange={(index, field, value) =>
                        onOptionChange(activeQuestionIndex, index, field, value)
                      }
                      onDeleteOption={onDeleteOption}
                      onAddOption={onAddOption}
                      onReorder={onReorderOptions}
                    />
                  </div>
                ) : activeQuestion.question_type === 'location' ? (
                  <LocationSettings />
                ) : null}
              </div>

              {/* Time Settings */}
              <div>
                <h3 className="text-sm font-medium mb-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Time
                </h3>
                <TimeSettings />
              </div>

              {/* Advanced Settings */}
              <div>
                <h3 className="text-sm font-medium mb-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                  More Settings
                </h3>
                <AdvancedSettings />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="design" className="mt-0 space-y-5">
            {/* Design tab: Background, colors, etc */}
            <BackgroundSettings />
          </TabsContent>

          <TabsContent value="meta" className="mt-0">
            {/* Metadata tab: title, description, publication status */}
            <ActivityMetadataTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
