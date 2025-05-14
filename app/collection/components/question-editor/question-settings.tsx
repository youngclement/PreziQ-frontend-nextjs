'use client';

// Add Window interface extension
declare global {
  interface Window {
    updateActivityTimer: ReturnType<typeof setTimeout>;
    updateActivityBackground?: (
      activityId: string,
      properties: { backgroundImage?: string; backgroundColor?: string }
    ) => void;
    savedBackgroundColors?: Record<string, string>;
    locationUpdateTimer?: ReturnType<typeof setTimeout>;
    lastLocationUpdate?: {
      timestamp: number;
      activityId: string;
      locationData: any[];
    };
  }
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
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

  Trash,
  Loader2,
  RefreshCw,
  PlusCircle,
  PaintBucket

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

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,

} from '@/components/ui/popover';
import { SlideSettings } from '../slide/sidebar/slide-settings';
import SlideToolbar from '../slide/sidebar/slide-toolbar';

import { quizQuestionsApi } from '@/api-client/quiz-questions-api';
import { ImagePicker } from '../image-picker/image-picker';
import { useToast } from "@/hooks/use-toast";


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
  onOptionChange,
}: {
  option: QuizOption;
  questionIndex: number;
  optionIndex: number;
  onOptionChange: (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: any
  ) => void;
}) => {
  return (
    <div className="mt-2 space-y-2">
      <Label htmlFor={`answer-text-${optionIndex}`}>Answer Text</Label>
      <Textarea
        id={`answer-text-${optionIndex}`}
        placeholder="Enter answer text"
        value={option.option_text || ''}
        onChange={(e) =>
          onOptionChange(
            questionIndex,
            optionIndex,
            'option_text',
            e.target.value
          )
        }
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
  onTextAnswerBlur,
}: {
  correctAnswerText: string;
  onTextAnswerChange: (value: string) => void;
  onTextAnswerBlur: () => void;
}) => {
  return (
    <div className="space-y-2 mt-4 p-4 bg-pink-50 dark:bg-pink-900/10 rounded-md border border-pink-100 dark:border-pink-800">
      <Label
        htmlFor="correct-answer"
        className="text-pink-800 dark:text-pink-300"
      >
        Correct Answer
      </Label>
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
  const [activeType, setActiveType] = useState(
    activeQuestion?.question_type || 'multiple_choice'
  );
  const [correctAnswerText, setCorrectAnswerText] = useState(
    activeQuestion?.correct_answer_text || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [invalidImageUrl, setInvalidImageUrl] = useState(false);

  const [backgroundColor, setBackgroundColor] = useState(activity?.backgroundColor || "#FFFFFF");
  const [customBackgroundMusic, setCustomBackgroundMusic] = useState(activity?.customBackgroundMusic || "");
  const [title, setTitle] = useState(activity?.title || "");
  const [description, setDescription] = useState(activity?.description || "");
  const [isPublished, setIsPublished] = useState(activity?.is_published || false);
  const [pointType, setPointType] = useState(activity?.quiz?.pointType || "STANDARD");
  const { toast } = useToast();


  // Track the activity ID to detect changes
  const [prevActivityId, setPrevActivityId] = useState(activity?.id);

  const { toast } = useToast();

  useEffect(() => {
    if (activity) {
      setBackgroundColor(activity.backgroundColor || '#FFFFFF');
      setCustomBackgroundMusic(activity.customBackgroundMusic || '');
      setTitle(activity.title || '');
      setDescription(activity.description || '');
      setIsPublished(activity.is_published || false);
      setPointType(activity.quiz?.pointType || "STANDARD");

      // Check if we've switched to a different activity
      if (activity.id !== prevActivityId) {
        setPrevActivityId(activity.id);

        // Update the local backgroundImage state if activity has changed
        if (activity.backgroundImage !== backgroundImage) {
          onBackgroundImageChange(activity.backgroundImage || '');
        }
      }
    }
  }, [activity, backgroundImage, onBackgroundImageChange, prevActivityId]);

  // Add listener for activity:updated event
  useEffect(() => {
    const handleActivityUpdated = (event: CustomEvent) => {
      if (event.detail && event.detail.activity && activity && event.detail.activity.activityId === activity.id) {
        // Update local background image if it changed
        if (event.detail.activity.backgroundImage !== backgroundImage) {
          onBackgroundImageChange(event.detail.activity.backgroundImage || "");
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('activity:updated', handleActivityUpdated as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('activity:updated', handleActivityUpdated as EventListener);
      }
    };
  }, [activity, backgroundImage, onBackgroundImageChange]);

  // Update state when activeQuestion changes
  React.useEffect(() => {
    if (activeQuestion) {
      setCorrectAnswerText(activeQuestion.correct_answer_text || '');
      setActiveType(activeQuestion.question_type || 'multiple_choice');
    }
  }, [
    activeQuestion,
    activeQuestion.activity_id,
    activeQuestion.correct_answer_text,
  ]);

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
    if (
      activity &&
      activity.id &&
      activeQuestion.question_type === 'text_answer'
    ) {
      // Update the quiz in the backend
      try {
        activitiesApi.updateTypeAnswerQuiz(activity.id, {
          type: 'TYPE_ANSWER',
          questionText: activeQuestion.question_text,
          pointType: 'STANDARD',
          timeLimitSeconds: timeLimit,
          correctAnswer: correctAnswerText,
        });
      } catch (error) {
        console.error('Error updating text answer quiz:', error);

        toast({
          title: 'Error saving answer',
          description: 'Could not save the correct answer. Please try again.',
          variant: 'destructive',
        });

      }
    }
  };

  // Handler for slide content changes
  const handleSlideContentChange = (value: string) => {
    if (onSlideContentChange) {
      onSlideContentChange(value);

      // If this is a slide activity, also update the activity description
      if (
        activity &&
        (activeQuestion.question_type === 'slide' ||
          activeQuestion.question_type === 'info_slide')
      ) {
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
    multiple_choice:
      'bg-purple-100 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800 text-purple-800 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/40',
    multiple_response:
      'bg-blue-100 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 text-blue-800 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40',
    true_false:
      'bg-green-100 border-green-200 dark:bg-green-900/20 dark:border-green-800 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40',
    text_answer:
      'bg-pink-100 border-pink-200 dark:bg-pink-900/20 dark:border-pink-800 text-pink-800 dark:text-pink-300 hover:bg-pink-200 dark:hover:bg-pink-900/40',
    reorder:
      'bg-orange-100 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 text-orange-800 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/40',
    location:
      'bg-cyan-100 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-200 dark:hover:bg-cyan-900/40',
    slide:
      'bg-yellow-100 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/40',
    info_slide:
      'bg-indigo-100 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/40',
  };

  // Replace the QuestionTypeSelector component with this new combobox version
  const QuestionTypeSelector = () => {
    const [open, setOpen] = useState(false);

    const questionTypes = [
      {
        value: 'multiple_choice',
        label: 'Single Choice',
        icon: <Radio className="h-4 w-4 mr-2 text-purple-600" />,
      },
      {
        value: 'multiple_response',
        label: 'Multiple Choice',
        icon: <CheckSquare className="h-4 w-4 mr-2 text-blue-600" />,
      },
      {
        value: 'true_false',
        label: 'True/False',
        icon: (
          <div className="flex mr-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <XCircle className="h-4 w-4 text-red-500 -ml-1" />
          </div>
        ),
      },
      {
        value: 'text_answer',
        label: 'Text Answer',
        icon: <AlignLeft className="h-4 w-4 mr-2 text-pink-600" />,
      },
      {
        value: 'reorder',
        label: 'Reorder',
        icon: <MoveVertical className="h-4 w-4 mr-2 text-orange-600" />,
      },
      {
        value: 'location',
        label: 'Location',
        icon: <MapPin className="h-4 w-4 mr-2 text-cyan-600" />,
      },
      {
        value: 'slide',
        label: 'Information Slide',
        icon: <FileText className="h-4 w-4 mr-2 text-yellow-600" />,
      },
      {
        value: 'info_slide',
        label: 'Interactive Info Slide',
        icon: <FileText className="h-4 w-4 mr-2 text-indigo-600" />,
      },
    ];

    // Find the current question type
    const currentType =
      questionTypes.find(
        (type) => type.value === activeQuestion.question_type
      ) || questionTypes[0];

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between px-3 py-5 h-auto border',
              activeQuestion.question_type &&
                questionTypeColors[activeQuestion.question_type]
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
                      'flex items-center gap-2 px-3 py-2.5',
                      activeQuestion.question_type === type.value && 'bg-accent'
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
    activeQuestionIndex,
  }: {
    options: any[];
    onOptionChange: (
      questionIndex: number,
      optionIndex: number,
      field: string,
      value: any
    ) => void;
    activeQuestionIndex: number;
  }) => {
    const trueIndex = options.findIndex(
      (opt) => opt.option_text.toLowerCase() === 'true'
    );
    const falseIndex = options.findIndex(
      (opt) => opt.option_text.toLowerCase() === 'false'
    );

    const isTrueSelected = trueIndex >= 0 && options[trueIndex].is_correct;
    const isFalseSelected = falseIndex >= 0 && options[falseIndex].is_correct;

    return (
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div
          className={cn(
            'flex items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 border',
            isTrueSelected
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700 shadow-sm'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/10'
          )}
          onClick={() => {
            if (trueIndex >= 0) {
              onOptionChange(
                activeQuestionIndex,
                trueIndex,
                'is_correct',
                true
              );
            }
          }}
        >
          <CheckCircle
            className={cn(
              'h-5 w-5 mr-2',
              isTrueSelected
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-400'
            )}
          />
          <span className="text-base font-medium">True</span>
        </div>
        <div
          className={cn(
            'flex items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 border',
            isFalseSelected
              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 shadow-sm'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/10'
          )}
          onClick={() => {
            if (falseIndex >= 0) {
              onOptionChange(
                activeQuestionIndex,
                falseIndex,
                'is_correct',
                true
              );
            }
          }}
        >
          <XCircle
            className={cn(
              'h-5 w-5 mr-2',
              isFalseSelected
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-400'
            )}
          />
          <span className="text-base font-medium">False</span>
        </div>
      </div>
    );
  };

  // Time settings component
  const TimeSettings = () => {
    const timePresets = [10, 20, 30, 60, 90, 120];

    // Get time limit from the API if available, otherwise use the prop
    const currentTimeLimit =
      (activity && activity.quiz?.timeLimitSeconds) || timeLimit;

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
            timeLimitSeconds: value,
          },
        };

        // If we have direct access to setActivity, call it
        if (typeof window !== 'undefined') {
          // Force re-render by triggering state updates in parent components
          const event = new CustomEvent('activity:timeLimit:updated', {
            detail: { activityId: activity.id, timeLimitSeconds: value },
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
                pointType: activity.quiz?.pointType || pointType,
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
                pointType: activity.quiz?.pointType || pointType,
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
                pointType: activity.quiz?.pointType || pointType,
                correctAnswer: activeQuestion.options?.find(o => o.is_correct)?.option_text.toLowerCase() === 'true'

              });
              break;
            case 'text_answer':
              activitiesApi.updateTypeAnswerQuiz(activity.id, {
                ...quizPayload,

                type: "TYPE_ANSWER",
                questionText: activity.quiz?.questionText || activeQuestion.question_text,
                pointType: activity.quiz?.pointType || pointType,
                correctAnswer: activeQuestion.correct_answer_text || ''

              });
              break;
            case 'reorder':
              activitiesApi.updateReorderQuiz(activity.id, {
                ...quizPayload,

                type: "REORDER",
                questionText: activity.quiz?.questionText || activeQuestion.question_text,
                pointType: activity.quiz?.pointType || pointType,
                correctOrder: activeQuestion.options?.map(o => o.option_text) || []

              });
              break;
            case 'location':
              // Get the current location data and point type
              const locationData = activeQuestion.location_data || {};
              const pointType = locationData.pointType || "STANDARD";

              // Use the correct field name for location answers
              const locationAnswers = activity?.quiz?.quizLocationAnswers ||
                locationData.quizLocationAnswers ||
                locationData.locationAnswers ||
                [{
                  quizLocationAnswerId: "",
                  longitude: locationData.lng || 0,
                  latitude: locationData.lat || 0,
                  radius: locationData.radius || 20
                }];

              // For location quizzes, use the activitiesApi
              if (onQuestionLocationChange) {
                // Update local state with the new time limit
                const updatedLocationData = {
                  ...locationData,
                  timeLimitSeconds: value
                };

                // Update via API
                activitiesApi.updateLocationQuiz(activity.id, {
                  type: "LOCATION",
                  questionText: activeQuestion.question_text,
                  timeLimitSeconds: value,
                  pointType: pointType,
                  locationAnswers: locationAnswers.map(answer => ({
                    longitude: answer.longitude,
                    latitude: answer.latitude,
                    radius: answer.radius
                  }))
                });
              }
              break;
            default:
              // For slide types or any other type, just update the activity directly
              debouncedUpdateActivity({ timeLimitSeconds: value });
              break;
          }

          console.log(
            `Updated time limit to ${value}s for ${questionType} question`
          );
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
          <Badge variant="outline" className="px-2 py-1 font-mono">
            {currentTimeLimit}s
          </Badge>
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
          {timePresets.map((time) => (
            <Button
              key={time}
              variant={currentTimeLimit === time ? 'default' : 'outline'}
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

        title: "Unsupported file type",
        description: "Please upload JPEG or PNG images only.",
        variant: "destructive"

      });
      return;
    }

    // Check file size (between 1KB and 5MB)
    if (file.size < 1024 || file.size > 5 * 1024 * 1024) {
      toast({

        title: "Invalid file size",
        description: "File size should be between 1KB and 5MB.",
        variant: "destructive"

      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    try {
      // Simulate upload progress (in practice you can use an axios interceptor)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
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


      // Axios returns the full response with a 'data' property that contains the API response
      // The API response itself has a 'data' property that contains the file information
      if (response && response.data && response.data.data && response.data.data.fileUrl) {
        const fileUrl = response.data.data.fileUrl;

        // Update local state
        setInvalidImageUrl(false);
        onBackgroundImageChange(fileUrl);

        // Update background in the UI immediately
        if (typeof window !== 'undefined' && window.updateActivityBackground && activity) {
          window.updateActivityBackground(activity.id, { backgroundImage: fileUrl });

        }

        // Update in API
        const result = await updateActivity({ backgroundImage: fileUrl });

        // Force UI update after API response
        // This ensures the new image shows up in the UI
        if (result && result.data) {
          const updatedActivity = result.data;

          // Dispatch event to notify other components
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('activity:updated', {
              detail: { activity: updatedActivity }
            });
            window.dispatchEvent(event);
          }

          // Show success notification
          toast({

            title: "Image uploaded successfully",
            variant: "default"

          });
        }
      } else {
        console.error('Invalid response structure:', response);
        toast({
          title: "Upload failed",
          description: "Could not process the uploaded image",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({

        title: "Upload failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive"

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

  const handleAudioFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !activity) return;

    // Check file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {

      toast({
        title: 'Invalid format',
        description: 'Please select an audio file in MP3, WAV or OGG format.',
        variant: 'destructive',
      });

      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {

      toast({
        title: 'Invalid file size',
        description: 'Audio file must be smaller than 10MB.',
        variant: 'destructive',
      });

      return;
    }

    setIsUploadingAudio(true);
    setUploadAudioProgress(10);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadAudioProgress((prev) => {
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


      // Correctly access the fileUrl from the API response structure
      if (response && response.data && response.data.data && response.data.data.fileUrl) {
        const fileUrl = response.data.data.fileUrl;
        setCustomBackgroundMusic(fileUrl);
        await updateActivity({ customBackgroundMusic: fileUrl });

        // Show success notification
        toast({
          title: "Audio uploaded successfully",
          variant: "default"
        });
      } else {
        console.error('Invalid response structure:', response);
        toast({
          title: "Audio upload failed",
          description: "Could not process the uploaded audio",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error uploading audio file:', error);

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

    if (activity.activity_type_id === 'INFO_SLIDE') {
      console.log(
        'Bỏ qua gọi API cho INFO_SLIDE, sẽ được xử lý bởi SlideSettings'
      );
      return;
    }

    setIsSaving(true);
    try {
      // Dispatch an event before making the API call for immediate UI feedback
      const event = new CustomEvent("activity:updated", {
        detail: {
          activityId: activity.id,
          data: data
        }
      });
      window.dispatchEvent(event);

      // Handle background changes separately through global method if available
      if (typeof window !== 'undefined' && window.updateActivityBackground && data.backgroundColor) {
        window.updateActivityBackground(activity.id, {
          backgroundColor: data.backgroundColor
        });
      }


    try {
      // Ensure we're sending the correct API payload shape
      const payload = {
        ...data,
        // Make sure these fields match the API expected format
        title: data.title !== undefined ? data.title : activity.title,
        description:
          data.description !== undefined
            ? data.description
            : activity.description,
        isPublished:
          data.isPublished !== undefined
            ? data.isPublished
            : activity.is_published,
        backgroundColor:
          data.backgroundColor !== undefined
            ? data.backgroundColor
            : activity.backgroundColor,
        backgroundImage:
          data.backgroundImage !== undefined
            ? data.backgroundImage
            : activity.backgroundImage,
        customBackgroundMusic:
          data.customBackgroundMusic !== undefined
            ? data.customBackgroundMusic
            : activity.customBackgroundMusic,
      };

      // Special handling for time limit to trigger immediate DOM updates
      if (data.timeLimitSeconds) {
        // Create and dispatch a custom event with the necessary details
        const timeLimitEvent = new CustomEvent('activity:timeLimit:updated', {
          detail: {
            activityId: activity.id,
            timeLimitSeconds: data.timeLimitSeconds
          }
        });
        window.dispatchEvent(timeLimitEvent);
      }


      // Handle location quiz updates
      if (data.locationAnswers) {
        // Update lastLocationUpdate timestamp to prevent race conditions
        if (typeof window !== 'undefined') {
          window.lastLocationUpdate = {
            timestamp: Date.now(),
            activityId: activity.id,
            locationData: [...data.locationAnswers]
          };
        }

        // Include required fields if they're missing
        const locationPayload = {
          type: "LOCATION",
          questionText: activity.quiz?.questionText || activeQuestion.question_text,
          timeLimitSeconds: data.timeLimitSeconds || activity.quiz?.timeLimitSeconds || timeLimit,
          pointType: data.pointType || activity.quiz?.pointType || "STANDARD",
          locationAnswers: data.locationAnswers
        };

        console.log("Updating location quiz with payload:", locationPayload);
        const response = await activitiesApi.updateLocationQuiz(activity.id, locationPayload);
        console.log("Location quiz updated:", response);

        // Update local state to reflect the changes - use deep cloning to avoid reference issues
        const updatedLocationAnswers = data.locationAnswers.map((ans: any, idx: number) => ({
          ...ans,
          quizLocationAnswerId: ans.quizLocationAnswerId || `temp-id-${idx}`
        }));

        // Update local refs to prevent override from other components
        if (locationDataRef && locationDataRef.current) {
          locationDataRef.current = JSON.parse(JSON.stringify(updatedLocationAnswers));
        }


        const event = new CustomEvent('activity:background:updated', {
          detail: {
            activityId: activity.id,
            properties: { backgroundColor: data.backgroundColor },
            sender: 'questionSettings_api',
          },

        if (previousAnswersRef && previousAnswersRef.current) {
          previousAnswersRef.current = JSON.parse(JSON.stringify(updatedLocationAnswers));
        }

        // Update local state if using it
        if (typeof setLocationData === 'function') {
          setLocationData(JSON.parse(JSON.stringify(updatedLocationAnswers)));
        }

        // Force parent component update through callback
        if (onQuestionLocationChange) {
          onQuestionLocationChange(activeQuestionIndex, updatedLocationAnswers);
        }

        // Show success notification
        toast({
          title: "Location updated",
          description: "Location answers have been saved successfully",

        });

        // Dispatch event to update all components
        if (typeof window !== 'undefined') {
          const syncEvent = new CustomEvent('location:force:sync', {
            detail: {
              locationData: updatedLocationAnswers,
              timestamp: Date.now(),
              source: 'settings'
            }
          });
          window.dispatchEvent(syncEvent);
        }

        setIsSaving(false);
        return response;
      }


      toast({
        title: 'Saved successfully',
        description: 'Your changes have been saved.',
      });

      // For all other updates, use the regular updateActivity endpoint
      return await activitiesApi.updateActivity(activity.id, data);

    } catch (error) {
      console.error("Error updating activity:", error);
      toast({

        title: "Error updating activity",
        description: "Please try again",
        variant: "destructive"

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
            sender: 'questionSettings',
          },
        });
        window.dispatchEvent(event);
      }

      // Gửi API update (debounced để tránh quá nhiều request)
      debouncedUpdateActivity({ backgroundColor: value });

      // Cập nhật background trong tất cả các component nếu cần thiết
      if (typeof window !== 'undefined' && window.updateActivityBackground) {
        window.updateActivityBackground(activity.id, {
          backgroundColor: value,
        });
      }
    }
  };

  // Thêm vào useEffect để lắng nghe các thay đổi về màu nền
  useEffect(() => {
    // Lắng nghe sự kiện cập nhật từ component khác
    const handleBackgroundUpdate = (event: any) => {
      if (
        event.detail &&
        event.detail.activityId &&
        event.detail.properties &&
        event.detail.properties.backgroundColor &&
        activity &&
        activity.id === event.detail.activityId
      ) {
        // Cập nhật state local nếu sender không phải là chính mình
        if (event.detail.sender !== 'questionSettings') {
          setBackgroundColor(event.detail.properties.backgroundColor);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'activity:background:updated',
        handleBackgroundUpdate
      );
    }

    // Cleanup on unmount
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'activity:background:updated',
          handleBackgroundUpdate
        );
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
        description:
          data.description !== undefined
            ? data.description
            : activity.description,
        isPublished:
          data.isPublished !== undefined
            ? data.isPublished
            : activity.is_published,
        backgroundColor:
          data.backgroundColor !== undefined
            ? data.backgroundColor
            : activity.backgroundColor,
        backgroundImage:
          data.backgroundImage !== undefined
            ? data.backgroundImage
            : activity.backgroundImage,
        customBackgroundMusic:
          data.customBackgroundMusic !== undefined
            ? data.customBackgroundMusic
            : activity.customBackgroundMusic,
      };

      // Only send fields that are actually changing
      const finalPayload = Object.keys(data).reduce((acc, key) => {
        acc[key] = payload[key];
        return acc;
      }, {} as any);

      console.log('Silently updating activity with payload:', finalPayload);
      await activitiesApi.updateActivity(activity.id, finalPayload);
    } catch (error) {

      console.error('Error silently updating activity:', error);

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

  const handlePointTypeChange = (value: string) => {
    // Update local state
    setPointType(value);

    // Call API to update the quiz based on question type
    if (activity && activity.id) {
      try {
        const questionType = activeQuestion.question_type;
        const quizPayload = { pointType: value };

        // Update with the appropriate quiz API call based on quiz type
        switch (questionType) {
          case 'multiple_choice':
            activitiesApi.updateButtonsQuiz(activity.id, {
              type: "CHOICE",
              questionText: activity.quiz?.questionText || activeQuestion.question_text,
              timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit,
              pointType: value,
              answers: activity.quiz?.quizAnswers || activeQuestion.options?.map(opt => ({
                answerText: opt.option_text,
                isCorrect: opt.is_correct,
                explanation: opt.explanation || ''
              })) || []
            });
            break;
          case 'multiple_response':
            activitiesApi.updateCheckboxesQuiz(activity.id, {
              type: "CHOICE",
              questionText: activity.quiz?.questionText || activeQuestion.question_text,
              timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit,
              pointType: value,
              answers: activity.quiz?.quizAnswers || activeQuestion.options?.map(opt => ({
                answerText: opt.option_text,
                isCorrect: opt.is_correct,
                explanation: opt.explanation || ''
              })) || []
            });
            break;
          case 'true_false':
            activitiesApi.updateTrueFalseQuiz(activity.id, {
              type: "TRUE_FALSE",
              questionText: activity.quiz?.questionText || activeQuestion.question_text,
              timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit,
              pointType: value,
              correctAnswer: activeQuestion.options?.find(o => o.is_correct)?.option_text.toLowerCase() === 'true'
            });
            break;
          case 'text_answer':
            activitiesApi.updateTypeAnswerQuiz(activity.id, {
              type: "TYPE_ANSWER",
              questionText: activity.quiz?.questionText || activeQuestion.question_text,
              timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit,
              pointType: value,
              correctAnswer: activeQuestion.correct_answer_text || ''
            });
            break;
          case 'reorder':
            activitiesApi.updateReorderQuiz(activity.id, {
              type: "REORDER",
              questionText: activity.quiz?.questionText || activeQuestion.question_text,
              timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit,
              pointType: value,
              correctOrder: activeQuestion.options?.map(o => o.option_text) || []
            });
            break;
          case 'location':
            // For location quizzes
            const locationData = activeQuestion.location_data || {};

            // Use the correct field name for location answers
            const locationAnswers = activity?.quiz?.quizLocationAnswers ||
              locationData.quizLocationAnswers ||
              locationData.locationAnswers ||
              [{
                quizLocationAnswerId: "",
                longitude: locationData.lng || 0,
                latitude: locationData.lat || 0,
                radius: locationData.radius || 20
              }];

            if (onQuestionLocationChange) {
              // Update local state
              const updatedData = {
                ...locationData,
                pointType: value
              };

              onQuestionLocationChange(activeQuestionIndex, updatedData);

              // Update via API
              activitiesApi.updateLocationQuiz(activity.id, {
                type: "LOCATION",
                questionText: activeQuestion.question_text,
                timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit,
                pointType: value,
                locationAnswers: locationAnswers.map(answer => ({
                  longitude: answer.longitude,
                  latitude: answer.latitude,
                  radius: answer.radius
                }))
              });
            }
            break;
          default:
            // For other types, just update the activity directly
            debouncedUpdateActivity({ pointType: value });
            break;
        }

        console.log(`Updated point type to ${value} for ${questionType} question`);
      } catch (error) {
        console.error('Error updating point type:', error);
        // Fall back to general update if specific API fails
        debouncedUpdateActivity({ pointType: value });
      }
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

  // Add PointTypeSelector component
  const PointTypeSelector = ({
    value,
    onChange
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => {
    return (
      <div className="space-y-2">
        <Label htmlFor="point-type">Point Type</Label>
        <Select
          value={value}
          onValueChange={onChange}
        >
          <SelectTrigger id="point-type" className="w-full">
            <SelectValue placeholder="Select point type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STANDARD">Standard Points</SelectItem>
            <SelectItem value="NO_POINTS">No Points</SelectItem>
            <SelectItem value="DOUBLE_POINTS">Double Points</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  const ActivityMetadataTab = () => {
    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="activity-title">Title</Label>
            {isSaving && (
              <Badge variant="outline" className="text-blue-500">
                Saving...
              </Badge>
            )}
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
      { color: '#F0E6E4', name: 'Pastel Beige' },
    ];

    // Thêm useEffect để lắng nghe sự kiện thay đổi màu
    useEffect(() => {
      const handleBackgroundUpdate = (event: any) => {
        if (
          event.detail &&
          event.detail.activityId &&
          event.detail.properties &&
          event.detail.properties.backgroundColor &&
          activity &&
          activity.id === event.detail.activityId
        ) {
          // Force re-render khi có thay đổi màu
          setColorRenderKey((prev) => prev + 1);
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener(
          'activity:background:updated',
          handleBackgroundUpdate
        );
      }

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener(
            'activity:background:updated',
            handleBackgroundUpdate
          );
        }
      };
    }, [activity]);

    // Lấy màu hiện tại từ cả hai nguồn
    // Ưu tiên global storage trước, sau đó mới tới state local
    const currentBackgroundColor =
      typeof window !== 'undefined' &&
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
                  {currentBackgroundColor.toUpperCase() ===
                    pastel.color.toUpperCase() && (
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
                  <p className="text-xs max-w-xs">
                    Supports PNG, JPG (max 5MB, min 1KB)
                  </p>
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

                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/300x200?text=Invalid+Image+URL';

                    toast({
                      title: 'Invalid image URL',
                      description: 'The image URL could not be loaded.',
                      variant: 'destructive',
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

  // // Slide settings component
  // const SlideSettingsComponent = () => {
  //   return (
  //     <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-800">
  //       <div className="mb-4">
  //         {/* <Label
  //           htmlFor="slide-content"
  //           className="text-yellow-800 dark:text-yellow-300"
  //         >
  //           Slide Content
  //         </Label>
  //         <Textarea
  //           id="slide-content"
  //           placeholder="Enter slide content"
  //           value={activeQuestion.slide_content || ''}
  //           onChange={(e) => handleSlideContentChange(e.target.value)}
  //           className="min-h-[100px] mt-2 bg-white dark:bg-black border-yellow-200 dark:border-yellow-700 focus-visible:ring-yellow-300"
  //         />
  //         <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
  //           Use line breaks to separate paragraphs
  //         </p> */}
  //        <TextEditorToolbar />
  //       </div>

  //       <div className="mb-4">
  //         <Label
  //           htmlFor="slide-image-url"
  //           className="text-yellow-800 dark:text-yellow-300"
  //         >
  //           Slide Image URL
  //         </Label>

  //         <PexelsPanel />
  //       </div>

  //       {/* <SlideSettings
  //         slideId={activity.id}
  //         backgroundColor={activity.backgroundColor}
  //         backgroundImage={activity.backgroundImage}
  //         questionType={activeQuestion.question_type}
  //         activeQuestionIndex={activeQuestionIndex}
  //         handleSlideBackgroundChange={handleBackgroundColorChange}
  //         handleSlideBackgroundImageChange={handleSlideImageChange}
  //       /> */}

  //       <div className="mt-5 pt-4 border-t border-yellow-200 dark:border-yellow-800">
  //         <h4 className="text-sm font-medium mb-3 text-yellow-800 dark:text-yellow-300">
  //           Advanced Editing Options
  //         </h4>
  //         {/* <FabricToolbar
  //           onAddText={() => {
  //             const event = new CustomEvent('fabric:add-text');
  //             window.dispatchEvent(event);
  //           }}
  //           onAddImage={(url) => {
  //             const event = new CustomEvent('fabric:add-image', {
  //               detail: { url },
  //             });
  //             window.dispatchEvent(event);
  //           }}
  //           onClear={() => {
  //             const event = new Event('fabric:clear');
  //             window.dispatchEvent(event);
  //           }}
  //         /> */}
  //       </div>
  //     </div>
  //   );
  // };

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
                  radius: value[0],
                };
                onQuestionLocationChange(activeQuestionIndex, updatedData);

    const { toast } = useToast();
    const [locationData, setLocationData] = useState<any[]>([]);
    const [updatedFields, setUpdatedFields] = useState<{ [key: string]: boolean }>({});
    const locationDataRef = useRef<any[]>([]);
    const [isDragging, setIsDragging] = useState(false);

    // Get or convert location answers from the activity
    // When we have quizLocationAnswers from the API, use that structure
    useEffect(() => {
      let answers = [];
      if (activity?.quiz?.quizLocationAnswers?.length > 0) {
        answers = activity.quiz.quizLocationAnswers.map(answer => ({
          quizLocationAnswerId: answer.quizLocationAnswerId,
          longitude: answer.longitude,
          latitude: answer.latitude,
          radius: answer.radius
        }));
      } else if (activeQuestion?.location_data) {
        // For newer format
        if (Array.isArray(activeQuestion.location_data)) {
          answers = activeQuestion.location_data;
        } else if (activeQuestion.location_data.lng) {
          // For backward compatibility with old format
          answers = [{
            longitude: activeQuestion.location_data.lng,
            latitude: activeQuestion.location_data.lat,
            radius: activeQuestion.location_data.radius || 10
          }];
        }
      }

      // Ensure we always have at least one location
      if (answers.length === 0) {
        answers = [{ longitude: 105.804817, latitude: 21.028511, radius: 10 }];
      }

      // Only update if there's an actual change or this is the first load
      const currentDataString = JSON.stringify(locationData);
      const newDataString = JSON.stringify(answers);

      if (currentDataString !== newDataString || locationData.length === 0) {
        console.log("Updating location data from API:", answers);
        setLocationData(answers);
        locationDataRef.current = answers;
        previousAnswersRef.current = answers;
      }
    }, [activity?.quiz?.quizLocationAnswers, activeQuestion?.location_data]);

    const handlePointTypeChange = (value: string) => {
      // Update the activity with the new point type
      if (activity?.id) {
        updateActivity({
          pointType: value
        });
      }
    };

    const handleLocationAnswersChange = (questionIndex: number, newLocationData: any[]) => {
      console.log("Location answers updated:", newLocationData);

      // Generate an update timestamp for tracking
      const updateTimestamp = Date.now();

      // Deep clone the data to avoid reference issues
      const updateData = JSON.parse(JSON.stringify(newLocationData));

      // Store the updated data in our ref to prevent overrides
      locationDataRef.current = updateData;

      // Update our local state for immediate UI feedback
      setLocationData(updateData);

      // Save to previous answers ref to avoid reset on blur events
      previousAnswersRef.current = updateData;

      // Update the global lastLocationUpdate tracker
      if (typeof window !== 'undefined') {
        window.lastLocationUpdate = {
          timestamp: updateTimestamp,
          activityId: activity?.id || '',
          locationData: updateData
        };
      }

      // Call the API to update location answers
      if (activity?.id) {
        const locationAnswers = updateData.map(location => ({
          quizLocationAnswerId: location.quizLocationAnswerId,
          longitude: location.longitude,
          latitude: location.latitude,
          radius: location.radius
        }));

        // Show a loading indicator
        const loadingToastId = toast({
          title: "Updating location data...",
          description: "Saving changes to the server",
          duration: 2000
        });

        // Call the API with complete payload
        const locationPayload = {
          locationAnswers: locationAnswers,
          pointType: activity.quiz?.pointType || "STANDARD",
          timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit
        };

        // Call the API
        updateActivity(locationPayload).then(() => {
          // Show success message
          toast({
            title: "Location data saved",
            description: "Changes have been saved to the server",
            duration: 2000
          });

          // Force update local refs again to be safe
          locationDataRef.current = updateData;
          previousAnswersRef.current = updateData;

          // Dispatch event to force all components to sync
          if (typeof window !== 'undefined') {
            const syncEvent = new CustomEvent('location:force:sync', {
              detail: {
                locationData: updateData,
                timestamp: updateTimestamp,
                source: 'settings'

              }
            });
            window.dispatchEvent(syncEvent);
          }
        }).catch(error => {
          console.error("Error updating location data:", error);
          toast({
            title: "Error saving location data",
            description: "Please try again",
            variant: "destructive",
            duration: 3000
          });
        });
      }

      // Also update the local state if needed
      if (onQuestionLocationChange) {
        onQuestionLocationChange(questionIndex, updateData);
      }
    };

    // Function to request map sync
    const requestMapSync = () => {
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('location:sync:request');
        window.dispatchEvent(event);
      }
    };

    // Sync map with settings when component mounts or when location data changes from API
    useEffect(() => {
      // Small delay to ensure everything is loaded
      const timer = setTimeout(() => {
        requestMapSync();
      }, 500);

      return () => clearTimeout(timer);
    }, [activity?.quiz?.quizLocationAnswers]);

    // Add a new effect to ensure our local state stays in sync with our ref
    useEffect(() => {
      // If our ref has data that differs from state, update the state
      if (locationDataRef.current.length > 0) {
        const refDataString = JSON.stringify(locationDataRef.current);
        const stateDataString = JSON.stringify(locationData);

        if (refDataString !== stateDataString) {
          console.log("Syncing location state with ref data");
          setLocationData([...locationDataRef.current]);
        }
      }
    }, [activity?.id]); // Only run when activity changes

    const handleLatitudeChange = (index: number, value: string) => {
      // Just update the local state for UI display while typing
      const newLocationData = [...locationData];
      newLocationData[index] = {
        ...newLocationData[index],
        latitude: parseFloat(value) || newLocationData[index].latitude
      };
      setLocationData(newLocationData);

      // Also update our ref to prevent overrides
      locationDataRef.current = newLocationData;
    };

    const handleLatitudeBlur = (index: number, value: string) => {
      const lat = parseFloat(value);

      if (isNaN(lat) || lat < -90 || lat > 90) {
        toast({
          title: "Invalid latitude",
          description: "Latitude must be between -90 and 90",
          variant: "destructive"
        });

        // Revert to previous valid value
        const newLocationData = JSON.parse(JSON.stringify(locationData));
        newLocationData[index] = {
          ...newLocationData[index],
          latitude: previousAnswersRef.current[index]?.latitude || 0
        };
        setLocationData(newLocationData);
        locationDataRef.current = newLocationData;
        return;
      }

      // Generate an update timestamp
      const updateTimestamp = Date.now();

      // Update local state immediately
      const newLocationData = JSON.parse(JSON.stringify(locationData));
      newLocationData[index] = {
        ...newLocationData[index],
        latitude: lat
      };

      // Update all refs and state
      setLocationData(newLocationData);
      locationDataRef.current = newLocationData;
      previousAnswersRef.current = newLocationData;

      // Update global tracking
      if (typeof window !== 'undefined') {
        window.lastLocationUpdate = {
          timestamp: updateTimestamp,
          activityId: activity?.id || '',
          locationData: newLocationData
        };
      }

      // Show update indicator
      setUpdatedFields({ ...updatedFields, [`lat-${index}`]: true });
      setTimeout(() => {
        setUpdatedFields(prev => ({ ...prev, [`lat-${index}`]: false }));
      }, 2000);

      // Dispatch event to update map marker position immediately
      if (typeof window !== 'undefined') {
        // First dispatch a simple coordinate update event for the map
        const event = new CustomEvent('location:coordinate:updated', {
          detail: {
            index,
            longitude: newLocationData[index].longitude,
            latitude: lat,
            timestamp: updateTimestamp
          }
        });
        window.dispatchEvent(event);

        // Then dispatch a more comprehensive sync event
        setTimeout(() => {
          const syncEvent = new CustomEvent('location:force:sync', {
            detail: {
              locationData: newLocationData,
              timestamp: updateTimestamp,
              source: 'settings'
            }
          });
          window.dispatchEvent(syncEvent);
        }, 100);
      }

      // Update API with all location data to ensure consistency
      debouncedLocationUpdate(newLocationData);
    };

    const handleLongitudeChange = (index: number, value: string) => {
      // Just update the local state for UI display while typing
      const newLocationData = [...locationData];
      newLocationData[index] = {
        ...newLocationData[index],
        longitude: parseFloat(value) || newLocationData[index].longitude
      };
      setLocationData(newLocationData);

      // Also update our ref to prevent overrides
      locationDataRef.current = newLocationData;
    };

    const handleLongitudeBlur = (index: number, value: string) => {
      const lng = parseFloat(value);

      if (isNaN(lng) || lng < -180 || lng > 180) {
        toast({
          title: "Invalid longitude",
          description: "Longitude must be between -180 and 180",
          variant: "destructive"
        });

        // Revert to previous valid value
        const newLocationData = JSON.parse(JSON.stringify(locationData));
        newLocationData[index] = {
          ...newLocationData[index],
          longitude: previousAnswersRef.current[index]?.longitude || 0
        };
        setLocationData(newLocationData);
        locationDataRef.current = newLocationData;
        return;
      }

      // Generate an update timestamp
      const updateTimestamp = Date.now();

      // Update local state immediately
      const newLocationData = JSON.parse(JSON.stringify(locationData));
      newLocationData[index] = {
        ...newLocationData[index],
        longitude: lng
      };

      // Update all refs and state
      setLocationData(newLocationData);
      locationDataRef.current = newLocationData;
      previousAnswersRef.current = newLocationData;

      // Update global tracking
      if (typeof window !== 'undefined') {
        window.lastLocationUpdate = {
          timestamp: updateTimestamp,
          activityId: activity?.id || '',
          locationData: newLocationData
        };
      }

      // Show update indicator
      setUpdatedFields({ ...updatedFields, [`lng-${index}`]: true });
      setTimeout(() => {
        setUpdatedFields(prev => ({ ...prev, [`lng-${index}`]: false }));
      }, 2000);

      // Dispatch event to update map marker position immediately
      if (typeof window !== 'undefined') {
        // First dispatch a simple coordinate update event for the map
        const event = new CustomEvent('location:coordinate:updated', {
          detail: {
            index,
            longitude: lng,
            latitude: newLocationData[index].latitude,
            timestamp: updateTimestamp
          }
        });
        window.dispatchEvent(event);

        // Then dispatch a more comprehensive sync event
        setTimeout(() => {
          const syncEvent = new CustomEvent('location:force:sync', {
            detail: {
              locationData: newLocationData,
              timestamp: updateTimestamp,
              source: 'settings'
            }
          });
          window.dispatchEvent(syncEvent);
        }, 100);
      }

      // Update API with all location data to ensure consistency
      debouncedLocationUpdate(newLocationData);
    };

    // Track previous valid answers
    const previousAnswersRef = useRef<any[]>(locationData);

    // Update previous answers ref when location data changes from API
    useEffect(() => {
      // Only update from API if there's actual data
      if (activity?.quiz?.quizLocationAnswers?.length > 0) {
        previousAnswersRef.current = activity.quiz.quizLocationAnswers.map(answer => ({
          quizLocationAnswerId: answer.quizLocationAnswerId,
          longitude: answer.longitude,
          latitude: answer.latitude,
          radius: answer.radius
        }));

        // Also update our main ref
        locationDataRef.current = previousAnswersRef.current;
      }
    }, [activity?.quiz?.quizLocationAnswers]);

    // Debounced function to update location data via API
    const debouncedLocationUpdate = useCallback(
      (newLocationData: any[]) => {
        if (!activity?.id) return;

        // Clear any existing timeout
        if (window.locationUpdateTimer) {
          clearTimeout(window.locationUpdateTimer);
        }

        // Store a timestamp and data in ref to avoid losing changes
        const updateTimestamp = Date.now();
        const updateData = JSON.parse(JSON.stringify(newLocationData));

        // Update our ref immediately to prevent overrides
        locationDataRef.current = JSON.parse(JSON.stringify(updateData));

        // Also update our state for UI consistency
        setLocationData(JSON.parse(JSON.stringify(updateData)));

        // Also update previousAnswersRef for continuity
        previousAnswersRef.current = JSON.parse(JSON.stringify(updateData));

        // Update lastLocationUpdate to track the latest data
        if (typeof window !== 'undefined') {
          window.lastLocationUpdate = {
            timestamp: updateTimestamp,
            activityId: activity.id,
            locationData: JSON.parse(JSON.stringify(updateData))
          };
        }

        // Set a new timeout for API update
        window.locationUpdateTimer = setTimeout(() => {
          // Check if this is still the most recent update request
          if (typeof window !== 'undefined' && window.lastLocationUpdate &&
            window.lastLocationUpdate.timestamp > updateTimestamp) {
            console.log("Skipping outdated location update request");
            return;
          }

          // Create a complete payload with all required fields
          const locationPayload = {
            locationAnswers: updateData,
            pointType: activity.quiz?.pointType || "STANDARD",
            timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit
          };

          // Call handler with complete data
          handleLocationAnswersChange(activeQuestionIndex, updateData);
        }, 1000); // Longer debounce for API calls
      },
      [activity?.id, activeQuestionIndex, activity?.quiz?.pointType, activity?.quiz?.timeLimitSeconds, timeLimit]
    );

    const handleRadiusChange = (index: number, value: number[]) => {
      console.log(`Radius changed for location ${index} to ${value[0]}km`);

      // Generate an update timestamp
      const updateTimestamp = Date.now();

      // Create a deep copy to avoid reference issues
      const newLocationData = JSON.parse(JSON.stringify(locationData));

      // Update the radius for this location
      newLocationData[index] = {
        ...newLocationData[index],
        radius: value[0]
      };

      // Update local state immediately
      setLocationData([...newLocationData]);
      locationDataRef.current = [...newLocationData];

      // Show update indicator
      setUpdatedFields({ ...updatedFields, [`radius-${index}`]: true });
      setTimeout(() => {
        setUpdatedFields(prev => ({ ...prev, [`radius-${index}`]: false }));
      }, 2000);

      // Save the current valid state
      previousAnswersRef.current = [...newLocationData];

      // Dispatch event to update circle radius immediately
      if (typeof window !== 'undefined') {
        // First update the radius
        const event = new CustomEvent('location:radius:updated', {
          detail: {
            index,
            radius: value[0]
          }
        });
        window.dispatchEvent(event);

        // Then force a sync between all components
        setTimeout(() => {
          const syncEvent = new CustomEvent('location:force:sync', {
            detail: {
              locationData: [...newLocationData]
            }
          });
          window.dispatchEvent(syncEvent);
        }, 100);
      }

      // Create a complete payload with all required fields
      const locationPayload = {
        locationAnswers: newLocationData,
        pointType: activity?.quiz?.pointType || "STANDARD",
        timeLimitSeconds: activity?.quiz?.timeLimitSeconds || timeLimit
      };

      // Update API with all location data to ensure consistency
      // Use the direct update method to ensure it persists
      if (activity?.id && !isDragging) {
        // Only update the API if we're not in the middle of dragging
        // This prevents too many API calls during slider dragging
        updateActivity(locationPayload);
      } else {
        // If dragging, use the debounced version
        debouncedLocationUpdate([...newLocationData]);
      }
    };

    const handleAddLocation = () => {
      // Get center of map if possible, otherwise use default or average of existing points
      let newLat = 21.028511;
      let newLng = 105.804817;

      // If we have existing locations, calculate a slightly offset position from the last one
      if (locationData.length > 0) {
        const lastLocation = locationData[locationData.length - 1];
        // Add a small offset to make the new point visible but close to existing ones
        newLat = lastLocation.latitude + 0.01;
        newLng = lastLocation.longitude + 0.01;
      }

      // Add the new location to the array
      const newLocationData = [
        ...locationData,
        {
          longitude: newLng,
          latitude: newLat,
          radius: 10
        }
      ];

      // Update local state immediately
      setLocationData(newLocationData);
      locationDataRef.current = newLocationData;

      // Dispatch an event to notify the map to update and focus on the new point
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('location:point:added', {
          detail: {
            index: newLocationData.length - 1,
            longitude: newLng,
            latitude: newLat
          }
        });
        window.dispatchEvent(event);
      }

      // Debounce the API update
      debouncedLocationUpdate(newLocationData);

      toast({
        title: "Location added",
        description: "A new location point has been added"
      });
    };

    const handleRemoveLocation = (index: number) => {
      // Prevent removing the last location
      if (locationData.length <= 1) {
        toast({
          title: "Cannot remove",
          description: "At least one location is required",
          variant: "destructive"
        });
        return;
      }

      // Dispatch event to remove the marker from the map immediately
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('location:point:removed', {
          detail: { index }
        });
        window.dispatchEvent(event);
      }

      // Update local state
      const newLocationData = locationData.filter((_, i) => i !== index);
      setLocationData(newLocationData);
      locationDataRef.current = newLocationData;

      // Debounce the API update
      debouncedLocationUpdate(newLocationData);

      toast({
        title: "Location removed",
        description: "The location point has been removed"
      });
    };

    // Add listener for the force sync event
    useEffect(() => {
      const handleForceSync = (event: CustomEvent) => {
        if (event.detail && event.detail.locationData) {
          // Update our local state with the forced data
          setLocationData(event.detail.locationData);
          locationDataRef.current = event.detail.locationData;
          previousAnswersRef.current = event.detail.locationData;

          console.log("Force synced location data from event:", event.detail.locationData);
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('location:force:sync', handleForceSync as EventListener);
      }

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('location:force:sync', handleForceSync as EventListener);
        }
      };
    }, []);

    // Add a debugging effect to track location data changes
    useEffect(() => {
      console.log("LocationSettings: locationData changed:", locationData);

      // When location data changes, ensure our refs are updated
      locationDataRef.current = [...locationData];
      previousAnswersRef.current = [...locationData];

    }, [locationData]);

    // Also monitor activity quiz changes
    useEffect(() => {
      if (activity?.quiz?.quizLocationAnswers) {
        console.log("LocationSettings: Activity quiz location answers changed:",
          activity.quiz.quizLocationAnswers);
      }
    }, [activity?.quiz?.quizLocationAnswers]);

    return (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Location Question Settings</h3>

          <div className="bg-blue-50 dark:bg-blue-900/10 rounded-md p-4 border border-blue-100 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Point Type</h4>
            <PointTypeSelector
              value={pointType}
              onChange={handlePointTypeChange}
            />
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
              Determines how points are awarded for this question.
            </p>
          </div>


        <div className="space-y-2">
          <Label>Hint (Optional)</Label>
          <Textarea
            placeholder="Provide a hint to help students find the location"
            value={activeQuestion.location_data?.hint || ''}
            onChange={(e) => {
              if (onQuestionLocationChange) {
                const updatedData = {
                  ...activeQuestion.location_data,
                  hint: e.target.value,
                };
                onQuestionLocationChange(activeQuestionIndex, updatedData);
              }
            }}
            className="min-h-[80px] text-sm"
          />

          <div className="rounded-md border">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-blue-800 dark:text-blue-300">
                  Location Map Preview
                </h4>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Drag pins to reposition. Use settings below to add or adjust locations.
              </p>
            </div>

            <div className="p-4">
              <LocationQuestionEditor
                questionText={activeQuestion.question_text || ""}
                locationAnswers={locationData}
                onLocationChange={handleLocationAnswersChange}
                questionIndex={activeQuestionIndex}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-800">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-blue-800 dark:text-blue-300">
                  Location Points
                </h4>
                <Button
                  onClick={handleAddLocation}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <PlusCircle className="h-4 w-4 mr-1" />
                  Add Location
                </Button>
              </div>
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                Define multiple correct locations if needed. Players just need to click within one of them to be correct.
              </p>
            </div>

            <div className="divide-y">
              {locationData.map((location, index) => (
                <div key={index} className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="font-medium">Location Point {index + 1}</h5>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveLocation(index)}
                      className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Label htmlFor={`latitude-${index}`}>Latitude</Label>
                      <div className="relative">
                        <Input
                          id={`latitude-${index}`}
                          value={location.latitude}
                          onChange={(e) => handleLatitudeChange(index, e.target.value)}
                          onBlur={(e) => handleLatitudeBlur(index, e.target.value)}
                          placeholder="Latitude (-90 to 90)"
                          type="number"
                          step="0.000001"
                          className={updatedFields[`lat-${index}`] ? "border-green-500 pr-10" : ""}
                        />
                        {updatedFields[`lat-${index}`] && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 animate-pulse">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <Label htmlFor={`longitude-${index}`}>Longitude</Label>
                      <div className="relative">
                        <Input
                          id={`longitude-${index}`}
                          value={location.longitude}
                          onChange={(e) => handleLongitudeChange(index, e.target.value)}
                          onBlur={(e) => handleLongitudeBlur(index, e.target.value)}
                          placeholder="Longitude (-180 to 180)"
                          type="number"
                          step="0.000001"
                          className={updatedFields[`lng-${index}`] ? "border-green-500 pr-10" : ""}
                        />
                        {updatedFields[`lng-${index}`] && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 animate-pulse">
                            <Check className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor={`radius-${index}`}>
                        Radius (km): {location.radius}
                        {updatedFields[`radius-${index}`] && (
                          <span className="ml-2 text-green-500 inline-flex items-center animate-pulse">
                            <Check className="h-4 w-4 mr-1" /> Updated
                          </span>
                        )}
                      </Label>
                    </div>
                    <Slider
                      id={`radius-${index}`}
                      value={[location.radius]}
                      min={1}
                      max={100}
                      step={1}
                      onValueChange={(values) => handleRadiusChange(index, values)}
                      className={updatedFields[`radius-${index}`] ? "border border-green-500 rounded-md p-1" : ""}
                    />
                    <p className="text-xs text-gray-500">
                      Area within which player's answer will be considered correct.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    );
  };

  // Content tab for question settings
  const ContentTab = () => {
    return (
      <div className="space-y-6">

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
            {activeQuestion.question_type === 'slide' || activeQuestion.question_type === 'info_slide' ? "Slide Content" : "Answer Options"}
          </h3>

          {/* Display different content based on question type */}
          {activeQuestion.question_type === 'multiple_choice' || activeQuestion.question_type === 'multiple_response' ? (
            <div className={cn(
              "p-3 rounded-md border",
              activeQuestion.question_type === 'multiple_choice'
                ? "bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800"
                : "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800"
            )}>
              <OptionList
                options={activeQuestion.options}
                activeQuestionIndex={activeQuestionIndex}
                questionType={activeQuestion.question_type}
                onAddOption={onAddOption}
                onOptionChange={(questionIndex, optionIndex, field, value) => onOptionChange(questionIndex, optionIndex, field, value)}
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
          ) : activeQuestion.question_type === 'slide' || activeQuestion.question_type === 'info_slide' ? (
            <SlideSettings />
          ) : activeQuestion.question_type === 'reorder' ? (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-md border border-orange-100 dark:border-orange-800">
              <ReorderOptions
                options={activeQuestion.options}
                onOptionChange={(index, field, value) => onOptionChange(activeQuestionIndex, index, field, value)}
                onDeleteOption={onDeleteOption}
                onAddOption={onAddOption}
                onReorder={onReorderOptions}
              />
            </div>
          ) : activeQuestion.question_type === 'location' ? (
            <LocationSettings />
          ) : null}
        </div>


        {/* Slide content editor */}
        {activeQuestion.question_type === 'slide' && (
          <SlideToolbar slideId={activity.id} />
        )}

        {/* Location question editor */}
        {activeQuestion.question_type === 'location' && <LocationSettings />}

        {/* Section 3: Time Settings */}
        <div>
          <h3 className="text-sm font-medium mb-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
            Time
          </h3>
          <TimeSettings />
        </div>

        {/* Section 4: Point Type Settings */}
        <div>
          <h3 className="text-sm font-medium mb-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
            Points
          </h3>
          <PointTypeSelector
            value={pointType}
            onChange={handlePointTypeChange}
          />
        </div>


        {/* Section 5: Advanced Settings */}
        <div>
          <h3 className="text-sm font-medium mb-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
            More Settings
          </h3>
          <AdvancedSettings />
        </div>
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
                  <>
                    <SlideToolbar slideId={activity.id} />
                    <div>
                      <h3 className="text-sm font-medium mb-2.5 mt-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                        Background Settings
                      </h3>
                    </div>
                  </>
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

              {/* Section 3: Time Settings */}
              <div>
                <h3 className="text-sm font-medium mb-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Time
                </h3>
                <TimeSettings />
              </div>

              {/* Section 4: Point Type Settings */}
              <div>
                <h3 className="text-sm font-medium mb-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                  Points
                </h3>
                <PointTypeSelector
                  value={pointType}
                  onChange={handlePointTypeChange}
                />
              </div>

              {/* Section 5: Advanced Settings */}
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

            {activeQuestion.question_type === 'slide' ||
            activeQuestion.question_type === 'info_slide' ? (
              <SlideSettings
                slideId={activity.id}
                backgroundColor={backgroundColor}
                backgroundImage={backgroundImage}
                questionType={activeQuestion.question_type}
                activeQuestionIndex={activeQuestionIndex}
                handleSlideBackgroundChange={handleBackgroundColorChange}
                handleSlideBackgroundImageChange={handleSlideImageChange}
              />
            ) : (
              <BackgroundSettings />
            )}
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
