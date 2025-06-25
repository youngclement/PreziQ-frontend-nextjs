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
      source?: string;
    };
  }
}

// Add FileUploadResponse interface
interface FileUploadResponse {
  fileUrl?: string;
  data?: {
    data?: {
      fileUrl?: string;
    };
  };
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Radio,
  CheckSquare,
  AlignLeft,
  FileText,
  MoveVertical,
  MapPin,
  Settings,
  Zap,
  Upload,
  Info,
  Eye,
  EyeOff,
  Palette,
  Check,
  Link,
  Trash,
  Trash2,
  Loader2,
  RefreshCw,
  PlusCircle,
  PaintBucket,
  ChevronsUpDown,
  Plus,
  X,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { QuizOption, QuizQuestion, MatchingPairOption } from '../types';
import { OptionList } from './option-list';
import { AdvancedSettings } from './advanced-settings';
import { Textarea } from '@/components/ui/textarea';
import { ReorderOptions } from './reorder-options';
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

import { useToast } from '@/hooks/use-toast';
import { MatchingPairSettings } from './matching-pair-settings';

import AnimationToolbar from '../slide/sidebar/animation-toolbar';
import { SlideElementPayload } from '@/types/slideInterface';
import { useLanguage } from '@/contexts/language-context';
import { t } from 'i18next';
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
    value: any,
    isTyping?: boolean
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
    value: any,
    isTyping?: boolean
  ) => void;
  onDeleteOption: (index: number) => void;
  onCorrectAnswerChange?: (value: string) => void;
  onSlideContentChange?: (value: string) => void;
  onSlideImageChange?: (value: string, index: number) => void;
  onReorderOptions?: (sourceIndex: number, destinationIndex: number) => void;
  onQuestionLocationChange?: (questionIndex: number, locationData: any) => void;
  onMatchingPairOptionsChange?: (
    questionIndex: number,
    newOptions: MatchingPairOption[]
  ) => void;
  onMatchingPairConnectionsChange?: (questionIndex: number) => void;
  onMatchingPairColumnNamesChange?: (left: string, right: string) => void;
  leftColumnName?: string;
  rightColumnName?: string;
  activity?: any; // Atividade associada à questão ativa
  slideElements: Record<string, SlideElementPayload[]>;
  onSlideElementsUpdate: (
    activityId: string,
    elements: SlideElementPayload[]
  ) => void;
  onSettingsUpdate?: () => void;
  correctAnswerText: string;
  onCorrectAnswerTextChange: (value: string) => void;
  onCorrectAnswerTextBlur: (value: string) => void;
}
const TextAnswerForm = ({
  activeQuestion,
  onOptionChange,
  questionIndex,
}: {
  activeQuestion: QuizQuestion;
  onOptionChange: (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: any,
    isTyping?: boolean
  ) => void;
  questionIndex: number;
}) => {
  const { t } = useLanguage();

  const getCorrectAnswerValue = () => {
    // Ưu tiên lấy từ correct_answer_text
    if (activeQuestion.correct_answer_text) {
      return activeQuestion.correct_answer_text;
    }

    // Nếu không có, lấy từ option đầu tiên (như API response của bạn)
    if (activeQuestion.options && activeQuestion.options.length > 0) {
      const correctOption = activeQuestion.options.find(
        (opt) => opt.is_correct
      );
      if (correctOption) {
        return correctOption.option_text;
      }
      // Fallback to first option
      return activeQuestion.options[0].option_text || '';
    }

    return '';
  };

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
        value={getCorrectAnswerValue()}
        onChange={(e) => {
          // Cập nhật với isTyping = true
          onOptionChange(
            questionIndex,
            0,
            'correct_answer_text',
            e.target.value,
            true
          );
        }}
        onBlur={(e) => {
          onOptionChange(
            questionIndex,
            0,
            'correct_answer_text',
            e.target.value,
            false
          );
        }}
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
  onMatchingPairOptionsChange,
  onMatchingPairConnectionsChange,
  activity,
  leftColumnName,
  rightColumnName,
  onMatchingPairColumnNamesChange,
  slideElements,
  onSlideElementsUpdate,
  onSettingsUpdate,
  correctAnswerText,
  onCorrectAnswerTextChange,
  onCorrectAnswerTextBlur,
}: QuestionSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeType, setActiveType] = useState(
    activeQuestion?.question_type || 'multiple_choice'
  );
  // const [correctAnswerText, setCorrectAnswerText] = useState(
  //   activeQuestion?.correct_answer_text || ''
  // );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [invalidImageUrl, setInvalidImageUrl] = useState(false);

  const [backgroundColor, setBackgroundColor] = useState(
    activity?.backgroundColor || '#FFFFFF'
  );
  const [customBackgroundMusic, setCustomBackgroundMusic] = useState(
    activity?.customBackgroundMusic || ''
  );
  const [title, setTitle] = useState(activity?.title || '');
  const [description, setDescription] = useState(activity?.description || '');
  const [isPublished, setIsPublished] = useState(
    activity?.is_published || false
  );
  const [pointType, setPointType] = useState(
    activity?.quiz?.pointType || 'STANDARD'
  );

  // Track the activity ID to detect changes
  const [prevActivityId, setPrevActivityId] = useState(activity?.id);
  const { toast } = useToast();

  // Reference for location data management
  const locationDataRef = useRef<any[]>([]);
  const previousAnswersRef = useRef<any[]>([]);
  const [locationData, setLocationData] = useState<any[]>([]);
  // Thêm state để theo dõi thay đổi từ settings
  const [settingsUpdateTrigger, setSettingsUpdateTrigger] = useState(0);

  // Thêm function để trigger cập nhật preview
  const triggerPreviewUpdate = useCallback(() => {
    setSettingsUpdateTrigger((prev) => prev + 1);
    if (onSettingsUpdate) {
      onSettingsUpdate();
    }
  }, [onSettingsUpdate]);

  useEffect(() => {
    if (activity) {
      setBackgroundColor(activity.backgroundColor || '#FFFFFF');
      setTitle(activity.title || '');
      setDescription(activity.description || '');
      setIsPublished(activity.is_published || false);
      setPointType(activity.quiz?.pointType || 'STANDARD');

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
      if (
        event.detail &&
        event.detail.activity &&
        activity &&
        event.detail.activity.activityId === activity.id
      ) {
        // Update local background image if it changed
        if (event.detail.activity.backgroundImage !== backgroundImage) {
          onBackgroundImageChange(event.detail.activity.backgroundImage || '');
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(
        'activity:updated',
        handleActivityUpdated as EventListener
      );
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(
          'activity:updated',
          handleActivityUpdated as EventListener
        );
      }
    };
  }, [activity, backgroundImage, onBackgroundImageChange]);

  // Update state when activeQuestion changes
  React.useEffect(() => {
    if (activeQuestion) {
      //setCorrectAnswerText(activeQuestion.correct_answer_text || '');
      setActiveType(activeQuestion.question_type || 'multiple_choice');
    }
  }, [
    activeQuestion,
    activeQuestion.activity_id,
    activeQuestion.correct_answer_text,
  ]);

  // // Update text answer when changing
  // const handleTextAnswerChange = (value: string) => {
  //   onCorrectAnswerTextChange(value);
  // };

  // // Send to API when input loses focus
  // const handleTextAnswerBlur = () => {
  //   onCorrectAnswerTextBlur(correctAnswerText);
  // };

  // // Handler for slide content changes
  // const handleSlideContentChange = (value: string) => {
  //   if (onSlideContentChange) {
  //     onSlideContentChange(value);

  //     // If this is a slide activity, also update the activity description
  //     if (
  //       activity &&
  //       (activeQuestion.question_type === 'slide' ||
  //         activeQuestion.question_type === 'info_slide')
  //     ) {
  //       debouncedUpdateActivity({ description: value });
  //     }
  //   }
  // };

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
    matching_pair:
      'bg-indigo-100 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/40',
  };

  // Replace the QuestionTypeSelector component with this new combobox version
  const QuestionTypeSelector = () => {
    const [open, setOpen] = useState(false);

    const questionTypes = [
      {
        value: 'multiple_choice',
        label: t('activity.types.multiple_choice'),
        icon: <Radio className="h-4 w-4 mr-2 text-purple-600" />,
      },
      {
        value: 'multiple_response',
        label: t('activity.types.multiple_response'),
        icon: <CheckSquare className="h-4 w-4 mr-2 text-blue-600" />,
      },
      {
        value: 'true_false',
        label: t('activity.types.true_false'),
        icon: (
          <div className="flex mr-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <XCircle className="h-4 w-4 text-red-500 -ml-1" />
          </div>
        ),
      },
      {
        value: 'text_answer',
        label: t('activity.types.text_answer'),
        icon: <AlignLeft className="h-4 w-4 mr-2 text-pink-600" />,
      },
      {
        value: 'reorder',
        label: t('activity.types.reorder'),
        icon: <MoveVertical className="h-4 w-4 mr-2 text-orange-600" />,
      },
      {
        value: 'location',
        label: t('activity.types.location'),
        icon: <MapPin className="h-4 w-4 mr-2 text-cyan-600" />,
      },
      {
        value: 'slide',
        label: t('activity.types.slide'),
        icon: <FileText className="h-4 w-4 mr-2 text-yellow-600" />,
      },
      {
        value: 'matching_pair',
        label: t('activity.types.matching_pair'),
        icon: <Link className="h-4 w-4 mr-2 text-indigo-600" />,
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

                type: 'CHOICE',
                questionText:
                  activity.quiz?.questionText || activeQuestion.question_text,
                pointType: activity.quiz?.pointType || (pointType as any),
                answers:
                  activity.quiz?.quizAnswers ||
                  activeQuestion.options?.map((opt) => ({
                    answerText: opt.option_text,
                    isCorrect: opt.is_correct,
                    explanation: opt.explanation || '',
                  })) ||
                  [],
              });
              break;
            case 'multiple_response':
              activitiesApi.updateCheckboxesQuiz(activity.id, {
                ...quizPayload,

                type: 'CHOICE',
                questionText:
                  activity.quiz?.questionText || activeQuestion.question_text,
                pointType: activity.quiz?.pointType || (pointType as any),
                answers:
                  activity.quiz?.quizAnswers ||
                  activeQuestion.options?.map((opt) => ({
                    answerText: opt.option_text,
                    isCorrect: opt.is_correct,
                    explanation: opt.explanation || '',
                  })) ||
                  [],
              });
              break;
            case 'true_false':
              activitiesApi.updateTrueFalseQuiz(activity.id, {
                ...quizPayload,

                type: 'TRUE_FALSE',
                questionText:
                  activity.quiz?.questionText || activeQuestion.question_text,
                pointType: activity.quiz?.pointType || (pointType as any),
                correctAnswer:
                  activeQuestion.options
                    ?.find((o) => o.is_correct)
                    ?.option_text.toLowerCase() === 'true',
              });
              break;
            case 'text_answer':
              activitiesApi.updateTypeAnswerQuiz(activity.id, {
                ...quizPayload,

                type: 'TYPE_ANSWER',
                questionText:
                  activity.quiz?.questionText || activeQuestion.question_text,
                pointType: activity.quiz?.pointType || (pointType as any),
                correctAnswer: activeQuestion.correct_answer_text || '',
              });
              break;
            case 'reorder':
              activitiesApi.updateReorderQuiz(activity.id, {
                ...quizPayload,

                type: 'REORDER',
                questionText:
                  activity.quiz?.questionText || activeQuestion.question_text,
                pointType: activity.quiz?.pointType || (pointType as any),
                correctOrder:
                  activeQuestion.options?.map((o) => o.option_text) || [],
              });
              break;
            case 'location':
              // Get the current location data and point type
              const locationData = activeQuestion.location_data || ({} as any);
              const locationPointType = locationData.pointType || 'STANDARD';

              // Use the correct field name for location answers
              const locationAnswers = activity?.quiz?.quizLocationAnswers ||
                (locationData as any).quizLocationAnswers ||
                (locationData as any).locationAnswers || [
                  {
                    longitude: (locationData as any).lng || 105.77803333582227,
                    latitude: (locationData as any).lat || 19.83950812993956,
                    radius: (locationData as any).radius || 10.0,
                  },
                ];

              // For location quizzes, use the activitiesApi
              if (onQuestionLocationChange) {
                // Update local state with the new time limit
                const updatedLocationData = {
                  ...locationData,
                  timeLimitSeconds: value,
                };

                // Call the callback to update parent state
                onQuestionLocationChange(
                  activeQuestionIndex,
                  updatedLocationData
                );

                // Update via API
                activitiesApi
                  .updateLocationQuiz(activity.id, {
                    type: 'LOCATION' as 'LOCATION',
                    questionText:
                      activity.quiz?.questionText ||
                      activeQuestion.question_text,

                    timeLimitSeconds: value,
                    pointType: locationPointType as
                      | 'STANDARD'
                      | 'NO_POINTS'
                      | 'DOUBLE_POINTS',
                    locationAnswers: locationAnswers.map((answer: any) => ({
                      longitude: answer.longitude,
                      latitude: answer.latitude,

                      radius: answer.radius,
                    })),
                  })
                  .then((response) => {
                    // **NEW**: Dispatch success event for location editor
                    if (typeof window !== 'undefined') {
                      const successEvent = new CustomEvent(
                        'location:api:success',
                        {
                          detail: {
                            source: 'location-quiz-api-success-timeLimit',
                            response: response,
                            timestamp: Date.now(),
                          },
                        }
                      );
                      window.dispatchEvent(successEvent);
                    }
                    console.log(
                      'Location quiz time limit updated successfully'
                    );
                  })
                  .catch((error) => {
                    console.error(
                      'Error updating location quiz time limit:',
                      error
                    );
                  });
              }
              break;

            case 'matching_pair':
              // Get the current matching pair data
              const matchingData =
                activeQuestion.quizMatchingPairAnswer ||
                activeQuestion.matching_data;

              if (matchingData) {
                activitiesApi.updateMatchingPairQuiz(activity.id, {
                  type: 'MATCHING_PAIRS',
                  questionText:
                    activity.quiz?.questionText || activeQuestion.question_text,
                  timeLimitSeconds: value,
                  pointType: activity.quiz?.pointType || (pointType as any),
                  quizMatchingPairAnswer: {
                    ...matchingData,
                    leftColumnName: leftColumnName || 'Left Item',
                    rightColumnName: rightColumnName || 'Right Item',
                  },
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
          <Label htmlFor="time-limit">{t('activity.timeLimit')}</Label>
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
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
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

      // Upload file with flexible type
      const response = (await storageApi.uploadSingleFile(
        file,
        'activities'
      )) as FileUploadResponse;

      clearInterval(progressInterval);
      setUploadAudioProgress(100);

      console.log('Audio file upload response:', response);

      // Extract file URL from response using either structure
      let fileUrl: string | undefined = undefined;

      if (response.fileUrl) {
        fileUrl = response.fileUrl;
      } else if (response.data?.data?.fileUrl) {
        fileUrl = response.data.data.fileUrl;
      }

      if (fileUrl) {
        setCustomBackgroundMusic(fileUrl);
        await updateActivity({ customBackgroundMusic: fileUrl });
      } else {
        console.error('No file URL in response:', response);
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
      return;
    }

    setIsSaving(true);
    try {
      // Dispatch an event before making the API call for immediate UI feedback
      const event = new CustomEvent('activity:updated', {
        detail: {
          activityId: activity.id,
          data: data,
        },
      });
      window.dispatchEvent(event);

      // Handle background changes separately through global method if available
      if (
        typeof window !== 'undefined' &&
        window.updateActivityBackground &&
        data.backgroundColor
      ) {
        window.updateActivityBackground(activity.id, {
          backgroundColor: data.backgroundColor,
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
        };

        // Special handling for time limit to trigger immediate DOM updates
        if (data.timeLimitSeconds) {
          // Create and dispatch a custom event with the necessary details
          const timeLimitEvent = new CustomEvent('activity:timeLimit:updated', {
            detail: {
              activityId: activity.id,
              timeLimitSeconds: data.timeLimitSeconds,
            },
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
              locationData: [...data.locationAnswers],
            };
          }

          // Include required fields if they're missing
          const locationPayload = {
            type: 'LOCATION' as 'LOCATION',
            questionText:
              activity.quiz?.questionText || activeQuestion.question_text,
            timeLimitSeconds:
              data.timeLimitSeconds ||
              activity.quiz?.timeLimitSeconds ||
              timeLimit,
            pointType: data.pointType || activity.quiz?.pointType || 'STANDARD',
            // Don't send quizLocationAnswerId - let API generate new ones
            locationAnswers: data.locationAnswers.map((answer: any) => ({
              longitude: answer.longitude,
              latitude: answer.latitude,
              radius: answer.radius,
            })),
          };

          console.log('Updating location quiz with payload:', locationPayload);
          const response = await activitiesApi.updateLocationQuiz(
            activity.id,
            locationPayload
          );
          console.log('Location quiz updated:', response);

          // Update local state to reflect the changes - use deep cloning to avoid reference issues
          const updatedLocationAnswers = data.locationAnswers.map(
            (ans: any, idx: number) => ({
              ...ans,
              quizLocationAnswerId:
                ans.quizLocationAnswerId || `temp-id-${idx}`,
            })
          );

          // Update local refs to prevent override from other components
          if (locationDataRef && locationDataRef.current) {
            locationDataRef.current = JSON.parse(
              JSON.stringify(updatedLocationAnswers)
            );
          }

          // Dispatch event for background updates
          const eventBg = new CustomEvent('activity:background:updated', {
            detail: {
              activityId: activity.id,
              properties: { backgroundColor: data.backgroundColor },
              sender: 'questionSettings_api',
            },
          });
          window.dispatchEvent(eventBg);

          if (previousAnswersRef && previousAnswersRef.current) {
            previousAnswersRef.current = JSON.parse(
              JSON.stringify(updatedLocationAnswers)
            );
          }

          // Update local state if using it
          if (typeof setLocationData === 'function') {
            setLocationData(JSON.parse(JSON.stringify(updatedLocationAnswers)));
          }

          // Force parent component update through callback
          if (onQuestionLocationChange) {
            onQuestionLocationChange(
              activeQuestionIndex,
              updatedLocationAnswers
            );
          }

          // Show success notification

          // Dispatch event to update all components

          if (typeof window !== 'undefined') {
            const updateEvent = new CustomEvent('location:answers:updated', {
              detail: {
                locationAnswers:
                  response.data?.quiz?.quizLocationAnswers ||
                  data.locationAnswers,
                timestamp: Date.now(),
                source: 'settings',
              },
            });
            window.dispatchEvent(updateEvent);
          }
        }

        // For all other updates, use the regular updateActivity endpoint
        return await activitiesApi.updateActivity(activity.id, data);
      } catch (error) {
        console.error('Error in API call:', error);
      }
    } catch (error) {
      console.error('Error updating activity:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Function to update activity in the API with debounce
  const debouncedUpdateActivity = useCallback(
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
    [activity]
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

  const handlePointTypeChange = (value: string) => {
    // Update local state
    setPointType(value);

    // Call API to update the quiz based on question type
    if (activity && activity.id) {
      try {
        const questionType = activeQuestion.question_type;
        const quizPayload = { pointType: value };

        // Type assertion for pointType
        const typedPointType = value as
          | 'STANDARD'
          | 'NO_POINTS'
          | 'DOUBLE_POINTS';

        // Update with the appropriate quiz API call based on quiz type
        switch (questionType) {
          case 'multiple_choice':
            activitiesApi.updateButtonsQuiz(activity.id, {
              type: 'CHOICE',
              questionText:
                activity.quiz?.questionText || activeQuestion.question_text,
              timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit,
              pointType: typedPointType,
              answers:
                activity.quiz?.quizAnswers ||
                activeQuestion.options?.map((opt) => ({
                  answerText: opt.option_text,
                  isCorrect: opt.is_correct,
                  explanation: opt.explanation || '',
                })) ||
                [],
            });
            break;
          case 'multiple_response':
            activitiesApi.updateCheckboxesQuiz(activity.id, {
              type: 'CHOICE',
              questionText:
                activity.quiz?.questionText || activeQuestion.question_text,
              timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit,
              pointType: typedPointType,
              answers:
                activity.quiz?.quizAnswers ||
                activeQuestion.options?.map((opt) => ({
                  answerText: opt.option_text,
                  isCorrect: opt.is_correct,
                  explanation: opt.explanation || '',
                })) ||
                [],
            });
            break;
          case 'true_false':
            activitiesApi.updateTrueFalseQuiz(activity.id, {
              type: 'TRUE_FALSE',
              questionText:
                activity.quiz?.questionText || activeQuestion.question_text,
              timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit,
              pointType: typedPointType,
              correctAnswer:
                activeQuestion.options
                  ?.find((o) => o.is_correct)
                  ?.option_text.toLowerCase() === 'true',
            });
            break;
          case 'text_answer':
            activitiesApi.updateTypeAnswerQuiz(activity.id, {
              type: 'TYPE_ANSWER',
              questionText:
                activity.quiz?.questionText || activeQuestion.question_text,
              timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit,
              pointType: typedPointType,
              correctAnswer: activeQuestion.correct_answer_text || '',
            });
            break;
          case 'reorder':
            activitiesApi.updateReorderQuiz(activity.id, {
              type: 'REORDER',
              questionText:
                activity.quiz?.questionText || activeQuestion.question_text,
              timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit,
              pointType: typedPointType,
              correctOrder:
                activeQuestion.options?.map((o) => o.option_text) || [],
            });
            break;
          case 'location':
            // For location quizzes

            const locationData = activeQuestion.location_data || ({} as any);
            const locationPointType = locationData.pointType || 'STANDARD';

            // Use the correct field name for location answers
            const locationAnswers = activity?.quiz?.quizLocationAnswers ||
              (locationData as any).quizLocationAnswers ||
              (locationData as any).locationAnswers || [
                {
                  longitude: (locationData as any).lng || 105.77803333582227,
                  latitude: (locationData as any).lat || 19.83950812993956,
                  radius: (locationData as any).radius || 10.0,
                },
              ];

            if (onQuestionLocationChange) {
              // Update local state
              const updatedData = {
                ...locationData,
                pointType: value,
              };

              onQuestionLocationChange(activeQuestionIndex, updatedData);

              // Update via API
              activitiesApi
                .updateLocationQuiz(activity.id, {
                  type: 'LOCATION',
                  questionText: activeQuestion.question_text,
                  timeLimitSeconds:
                    activity.quiz?.timeLimitSeconds || timeLimit,
                  pointType: value as
                    | 'STANDARD'
                    | 'NO_POINTS'
                    | 'DOUBLE_POINTS',
                  locationAnswers: locationAnswers.map((answer: any) => ({
                    longitude: answer.longitude,
                    latitude: answer.latitude,
                    radius: answer.radius,
                  })),
                })
                .then((response) => {
                  // **NEW**: Dispatch success event for location editor
                  if (typeof window !== 'undefined') {
                    const successEvent = new CustomEvent(
                      'location:api:success',
                      {
                        detail: {
                          source: 'location-quiz-api-success-pointType',
                          response: response,
                          timestamp: Date.now(),
                        },
                      }
                    );
                    window.dispatchEvent(successEvent);
                  }
                  console.log('Location quiz point type updated successfully');
                })
                .catch((error) => {
                  console.error(
                    'Error updating location quiz point type:',
                    error
                  );
                });
            }
            break;
          case 'matching_pair':
            // Get the current matching pair data
            const matchingData =
              activeQuestion.quizMatchingPairAnswer ||
              activeQuestion.matching_data;

            if (matchingData) {
              activitiesApi.updateMatchingPairQuiz(activity.id, {
                type: 'MATCHING_PAIRS',
                questionText:
                  activity.quiz?.questionText || activeQuestion.question_text,
                timeLimitSeconds: activity.quiz?.timeLimitSeconds || timeLimit,
                pointType: typedPointType,
                quizMatchingPairAnswer: {
                  ...matchingData,
                  leftColumnName: leftColumnName || 'Left Item',
                  rightColumnName: rightColumnName || 'Right Item',
                },
              });
            }
            break;
          default:
            // For other types, just update the activity directly
            debouncedUpdateActivity({ pointType: value });
            break;
        }

        console.log(
          `Updated point type to ${value} for ${questionType} question`
        );
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
    onChange,
  }: {
    value: string;
    onChange: (value: string) => void;
  }) => {
    return (
      <div className="space-y-2">
        <Label htmlFor="point-type">{t('activity.pointType')}</Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id="point-type" className="w-full">
            <SelectValue placeholder="Select point type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STANDARD">{t('activity.pointTypes.standard')}</SelectItem>
            <SelectItem value="NO_POINTS">{t('activity.pointTypes.noPoints')}</SelectItem>
            <SelectItem value="DOUBLE_POINTS">{t('activity.pointTypes.doublePoints')}</SelectItem>
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
            <Label htmlFor="is-published">{t('activity.published')}</Label>
          </div>
          <div>
            {isPublished ? (
              <Badge className="bg-green-500">
                <Eye className="h-3 w-3 mr-1" />
                {t('activity.visible')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                <EyeOff className="h-3 w-3 mr-1" />
                {t('activity.draft')}
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

    // Function to handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activity) return;

      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return;
      }

      setIsUploading(true);
      setUploadProgress(10);

      try {
        if (activity.backgroundImage) {
          try {
            await storageApi.deleteSingleFile(activity.backgroundImage);
          } catch (error) {
            console.error('Error deleting old background image:', error);
            // Continue with upload even if delete fails
          }
        }

        // Simulate upload progress
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
        const response = (await storageApi.uploadSingleFile(
          file,
          'activities'
        )) as FileUploadResponse;

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Extract file URL from response using either structure
        let fileUrl: string | undefined = undefined;

        if (response.fileUrl) {
          fileUrl = response.fileUrl;
        } else if (response.data?.data?.fileUrl) {
          fileUrl = response.data.data.fileUrl;
        }

        if (fileUrl) {
          // Update both local state and API
          onBackgroundImageChange(fileUrl);
          if (activity) {
            updateActivity({ backgroundImage: fileUrl });
          }
        } else {
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        // Clear file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    return (
      <div className="space-y-5" key={colorRenderKey}>
        <div className="space-y-3">
          <Label htmlFor="background-color">
            {t('activity.backgroundColor')}
          </Label>
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
              {t('activity.pastelColors')}
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
            <Label htmlFor="background-image">{t('activity.backgroundImage')}</Label>
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
                placeholder= {t('activity.backgroundImageUrl')}
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
                {t('activity.uploadImage')}
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
                  <span>{t('activity.uploading')}</span>
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
                src={backgroundImage || '/placeholder.svg'}
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
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Location settings component
  const LocationSettings = () => {
    // Handle adding a new location point
    const handleAddLocation = () => {
      const currentLocations =
        activeQuestion.location_data?.quizLocationAnswers || [];
      const newLocation = {
        latitude: currentLocations[0]?.latitude || 21.028511,
        longitude: currentLocations[0]?.longitude || 105.804817,
        radius: 10,
        hint: '',
      };
      const updatedLocations = [...currentLocations, newLocation];

      onQuestionLocationChange?.(activeQuestionIndex, updatedLocations);
    };

    // Handle deleting a location point
    const handleDeleteLocation = (indexToDelete: number) => {
      const currentLocations =
        activeQuestion.location_data?.quizLocationAnswers || [];
      const updatedLocations = currentLocations.filter(
        (_, index) => index !== indexToDelete
      );
      onQuestionLocationChange?.(activeQuestionIndex, updatedLocations);
    };

    // Handle updating a specific field of a location
    const handleUpdateLocation = (
      indexToUpdate: number,
      property: 'longitude' | 'latitude' | 'radius' | 'hint',
      value: string | number
    ) => {
      const currentLocations =
        activeQuestion.location_data?.quizLocationAnswers || [];
      const updatedLocations = currentLocations.map((loc, index) => {
        if (index === indexToUpdate) {
          const numericValue =
            property === 'hint' ? value : parseFloat(value as string);
          return { ...loc, [property]: numericValue };
        }
        return loc;
      });
      onQuestionLocationChange?.(activeQuestionIndex, updatedLocations);
    };

    if (!activeQuestion) return null;

    const locationAnswers =
      activeQuestion.location_data?.quizLocationAnswers || [];

    return (
      <Card className="border-t-2 border-t-yellow-400 p-0">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium">Location Points</h3>
              <Badge className="bg-yellow-400 text-white">
                {locationAnswers.length}
              </Badge>
            </div>
            <Button
              onClick={handleAddLocation}
              size="sm"
              variant="outline"
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Point
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {locationAnswers.map((location, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium">
                    Point {index + 1}
                  </Label>
                  {locationAnswers.length > 1 && (
                    <Button
                      onClick={() => handleDeleteLocation(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <div>
                    <Label
                      htmlFor={`lat-${index}`}
                      className="text-xs text-gray-600"
                    >
                      Latitude
                    </Label>
                    <Input
                      id={`lat-${index}`}
                      type="number"
                      value={location.latitude}
                      onChange={(e) =>
                        handleUpdateLocation(index, 'latitude', e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor={`lng-${index}`}
                      className="text-xs text-gray-600"
                    >
                      Longitude
                    </Label>
                    <Input
                      id={`lng-${index}`}
                      type="number"
                      value={location.longitude}
                      onChange={(e) =>
                        handleUpdateLocation(index, 'longitude', e.target.value)
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <Label
                    htmlFor={`radius-${index}`}
                    className="text-xs text-gray-600"
                  >
                    Radius (km)
                  </Label>
                  <Input
                    id={`radius-${index}`}
                    type="number"
                    value={location.radius}
                    onChange={(e) =>
                      handleUpdateLocation(index, 'radius', e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="mt-3">
                  <Label
                    htmlFor={`hint-${index}`}
                    className="text-xs text-gray-600"
                  >
                    Hint
                  </Label>
                  <Input
                    id={`hint-${index}`}
                    value={(location as any).hint || ''}
                    onChange={(e) =>
                      handleUpdateLocation(index, 'hint', e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </Card>
            ))}
          </div>

          {locationAnswers.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No location points set</p>
            </div>
          )}

          <Button
            onClick={handleAddLocation}
            className="w-full mt-4"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Point
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Content tab for question settings
  const ContentTab = () => {
    if (!activeQuestion) {
      return null;
    }

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
                  value,
                  isTyping = false
                ) =>
                  onOptionChange(
                    questionIndex,
                    optionIndex,
                    field,
                    value,
                    isTyping
                  )
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
              activeQuestion={activeQuestion}
              onOptionChange={onOptionChange}
              questionIndex={activeQuestionIndex}
            />
          ) : activeQuestion.question_type === 'slide' ||
            activeQuestion.question_type === 'info_slide' ? (
            <SlideSettings
              slideId={activity?.id || ''}
              backgroundColor={backgroundColor}
              backgroundImage={backgroundImage || ''}
              questionType={activeQuestion.question_type}
              activeQuestionIndex={activeQuestionIndex}
              handleSlideBackgroundChange={handleBackgroundColorChange}
              handleSlideBackgroundImageChange={handleSlideImageChange}
            />
          ) : activeQuestion.question_type === 'reorder' ? (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-md border border-orange-100 dark:border-orange-800">
              <ReorderOptions
                options={activeQuestion.options}
                onOptionChange={(index, field, value, isTyping = false) =>
                  onOptionChange(
                    activeQuestionIndex,
                    index,
                    field,
                    value,
                    isTyping
                  )
                }
                onDeleteOption={onDeleteOption}
                onAddOption={onAddOption}
                onReorder={onReorderOptions}
              />
            </div>
          ) : activeQuestion.question_type === 'location' ? (
            <LocationSettings />
          ) : activeQuestion.question_type === 'matching_pair' ? (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-md border border-indigo-100 dark:border-indigo-800">
              <MatchingPairSettings
                question={activeQuestion}
                activityId={activity?.id || ''}
                onOptionsChange={(newOptions) => {
                  if (onMatchingPairOptionsChange) {
                    onMatchingPairOptionsChange(
                      activeQuestionIndex,
                      newOptions
                    );
                  }
                  // Trigger preview update
                  triggerPreviewUpdate();
                }}
                onAddPair={() => {
                  // This will be handled by the MatchingPairSettings component via API
                  console.log('Add pair triggered');
                  // Trigger preview update
                  triggerPreviewUpdate();
                }}
                onDeletePair={(pairId) => {
                  // This will be handled by the MatchingPairSettings component via API
                  console.log('Delete pair triggered:', pairId);
                  // Trigger preview update
                  triggerPreviewUpdate();
                }}
                onReorderPairs={(startIndex, endIndex) => {
                  // This will be handled by the MatchingPairSettings component via API
                  console.log('Reorder pairs triggered:', startIndex, endIndex);
                  // Trigger preview update
                  triggerPreviewUpdate();
                }}
                leftColumnName={leftColumnName || 'Left Item'}
                rightColumnName={rightColumnName || 'Right Item'}
                onColumnNamesChange={(left, right) => {
                  if (onMatchingPairColumnNamesChange) {
                    onMatchingPairColumnNamesChange(left, right);
                  }
                  // Trigger preview update
                  triggerPreviewUpdate();
                }}
                onMatchingDataUpdate={(matchingData) => {
                  // Update the question with new matching data
                  if (onMatchingPairOptionsChange) {
                    // Convert matching data back to options format for compatibility
                    const options: MatchingPairOption[] = [];

                    if (matchingData.items) {
                      matchingData.items.forEach((item: any) => {
                        options.push({
                          id: item.quizMatchingPairItemId,
                          quizMatchingPairItemId: item.quizMatchingPairItemId,
                          content: item.content,
                          option_text: item.content,
                          isLeftColumn: item.isLeftColumn,
                          display_order: item.displayOrder,
                          quiz_question_id: activeQuestion.id,
                        });
                      });
                    }

                    onMatchingPairOptionsChange(activeQuestionIndex, options);
                  }
                  // Trigger preview update
                  triggerPreviewUpdate();
                }}
                onRefreshActivity={async () => {
                  // Trigger preview update after refresh
                  triggerPreviewUpdate();
                }}
              />
            </div>
          ) : null}
        </div>

        {/* Slide content editor */}
        {activeQuestion.question_type === 'slide' && (
          <SlideToolbar
            slideId={activity.id}
            slideElements={slideElements[activity?.id] || []}
            onSlideElementsUpdate={(elements) => {
              if (activity?.id) {
                onSlideElementsUpdate(activity.id, elements);
              }
            }}
          />
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
          {t('activity.settings')}
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
              {t('activity.content')}
            </TabsTrigger>
            <TabsTrigger value="design" className="text-xs">
              <Palette className="h-3.5 w-3.5 mr-1.5" />
              {t('activity.design')}
            </TabsTrigger>
            <TabsTrigger value="meta" className="text-xs">
              {activeQuestion.question_type === 'slide' ||
              activeQuestion.question_type === 'info_slide' ? (
                <Layers className="h-3.5 w-3.5 mr-1.5" />
              ) : (
                <Info className="h-3.5 w-3.5 mr-1.5" />
              )}
              {activeQuestion.question_type === 'slide' ||
              activeQuestion.question_type === 'info_slide'
                ? t('activity.animation')
                : t('activity.metadata')}
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
                    ? t('activity.slideContent')
                    : t('activity.answerOptions')}
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
                        value,
                        isTyping = false
                      ) =>
                        onOptionChange(
                          questionIndex,
                          optionIndex,
                          field,
                          value,
                          isTyping
                        )
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
                    activeQuestion={activeQuestion}
                    onOptionChange={onOptionChange}
                    questionIndex={activeQuestionIndex}
                  />
                ) : activeQuestion.question_type === 'slide' ||
                  activeQuestion.question_type === 'info_slide' ? (
                  <>
                    <SlideToolbar
                      slideId={activity.id}
                      slideElements={slideElements[activity?.id] || []}
                      onSlideElementsUpdate={(elements) => {
                        if (activity?.id) {
                          onSlideElementsUpdate(activity.id, elements);
                        }
                      }}
                    />
                    <div>
                      <h3 className="text-sm font-medium mb-2.5 mt-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
                        {/* <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                        Background Settings */}
                      </h3>
                    </div>
                  </>
                ) : activeQuestion.question_type === 'reorder' ? (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-md border border-orange-100 dark:border-orange-800">
                    <ReorderOptions
                      options={activeQuestion.options}
                      onOptionChange={(index, field, value, isTyping = false) =>
                        onOptionChange(
                          activeQuestionIndex,
                          index,
                          field,
                          value,
                          isTyping
                        )
                      }
                      onDeleteOption={onDeleteOption}
                      onAddOption={onAddOption}
                      onReorder={onReorderOptions}
                    />
                  </div>
                ) : activeQuestion.question_type === 'location' ? (
                  <LocationSettings />
                ) : activeQuestion.question_type === 'matching_pair' ? (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-md border border-indigo-100 dark:border-indigo-800">
                    <MatchingPairSettings
                      question={activeQuestion}
                      activityId={activity?.id || ''}
                      onOptionsChange={(newOptions) => {
                        if (onMatchingPairOptionsChange) {
                          onMatchingPairOptionsChange(
                            activeQuestionIndex,
                            newOptions
                          );
                        }
                      }}
                      onAddPair={() => {
                        if (!onMatchingPairOptionsChange) return;
                        const pairId = `pair-${Date.now()}`;
                        const currentOptions = activeQuestion.options || [];
                        const newPair: QuizOption[] = [
                          {
                            id: `left-${pairId}`,
                            option_text: 'Left item',
                            type: 'left',
                            pair_id: pairId,
                            is_correct: true,
                            display_order: currentOptions.length,
                            quiz_question_id: activeQuestion.id,
                          },
                          {
                            id: `right-${pairId}`,
                            option_text: 'Right item',
                            type: 'right',
                            pair_id: pairId,
                            is_correct: true,
                            display_order: currentOptions.length + 1,
                            quiz_question_id: activeQuestion.id,
                          },
                        ];
                        onMatchingPairOptionsChange(activeQuestionIndex, [
                          ...currentOptions,
                          ...newPair,
                        ]);
                      }}
                      onDeletePair={(pairId) => {
                        if (!onMatchingPairOptionsChange) return;
                        const currentOptions = activeQuestion.options || [];
                        const newOptions = currentOptions.filter(
                          (opt) => opt.pair_id !== pairId
                        );
                        onMatchingPairOptionsChange(
                          activeQuestionIndex,
                          newOptions
                        );
                      }}
                      onReorderPairs={(startIndex, endIndex) => {
                        if (!onMatchingPairOptionsChange) return;

                        const currentOptions = [
                          ...(activeQuestion.options || []),
                        ];

                        const pairs = currentOptions
                          .filter((o) => o.type === 'left')
                          .map((left) => {
                            const right = currentOptions.find(
                              (r) =>
                                r.type === 'right' && r.pair_id === left.pair_id
                            );
                            return { id: left.pair_id, left, right };
                          })
                          .filter((p) => p.right);

                        const [reorderedPair] = pairs.splice(startIndex, 1);
                        pairs.splice(endIndex, 0, reorderedPair);

                        const newOptions = pairs
                          .flatMap((p) => [p.left, p.right])
                          .map((opt, index) => ({
                            ...opt,
                            display_order: index,
                          })) as QuizOption[];

                        onMatchingPairOptionsChange(
                          activeQuestionIndex,
                          newOptions
                        );
                      }}
                      leftColumnName={leftColumnName}
                      rightColumnName={rightColumnName}
                      onColumnNamesChange={onMatchingPairColumnNamesChange}
                    />
                  </div>
                ) : null}
              </div>

              {activeQuestion.question_type === 'slide' ||
              activeQuestion.question_type === 'info_slide' ? (
                ''
              ) : (
                <div>
                  <div>
                    <h3 className="text-sm font-medium mb-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                      {t('activity.timeSettings')}
                    </h3>
                    <TimeSettings />
                  </div>

                  {/* Section 4: Point Type Settings */}
                  <div>
                    <h3 className="text-sm font-medium mb-2.5 text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 bg-primary rounded-full"></span>
                      {t('activity.pointSettings')}
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
                     {t('activity.advancedSettings')}
                    </h3>
                    <AdvancedSettings />
                  </div>
                </div>
              )}

              {/* Section 3: Time Settings */}
            </div>
          </TabsContent>

          <TabsContent value="design" className="mt-0 space-y-5">
            {/* Design tab: Background, colors, etc */}

            {activeQuestion.question_type === 'slide' ||
            activeQuestion.question_type === 'info_slide' ? (
              <SlideSettings
                slideId={activity?.id || ''}
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

            {activeQuestion.question_type === 'slide' ||
            activeQuestion.question_type === 'info_slide' ? (
              <AnimationToolbar
                slideId={activity?.id || ''}
                slideElements={slideElements[activity?.id] || []}
                onSlideElementsUpdate={(elements) => {
                  if (activity?.id) {
                    onSlideElementsUpdate(activity.id, elements);
                  }
                }}
              ></AnimationToolbar>
            ) : (
              <ActivityMetadataTab />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
