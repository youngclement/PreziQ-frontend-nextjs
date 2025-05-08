'use client';

// Add Window interface extension
declare global {
  interface Window {
    updateActivityTimer: ReturnType<typeof setTimeout>;
    updateActivityBackground?: (activityId: string, properties: { backgroundImage?: string, backgroundColor?: string }) => void;
  }
}

import React, { useState, useRef } from 'react';
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
  AlertCircle
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
  // State to store the correct answer text for text_answer type
  const [correctAnswerText, setCorrectAnswerText] = React.useState(
    activeQuestion?.correct_answer_text || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('content');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // States for additional fields
  const [title, setTitle] = useState(activity?.title || '');
  const [description, setDescription] = useState(activity?.description || '');
  const [isPublished, setIsPublished] = useState(activity?.is_published || false);
  const [backgroundColor, setBackgroundColor] = useState(activity?.backgroundColor || '#FFFFFF');
  const [customBackgroundMusic, setCustomBackgroundMusic] = useState(activity?.customBackgroundMusic || '');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [invalidImageUrl, setInvalidImageUrl] = useState(false);

  // Update state when activity changes
  React.useEffect(() => {
    if (activity) {
      setTitle(activity.title || '');
      setDescription(activity.description || '');
      setIsPublished(activity.is_published || false);
      setBackgroundColor(activity.backgroundColor || '#FFFFFF');
      setCustomBackgroundMusic(activity.customBackgroundMusic || '');
    }
  }, [activity]);

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

  // Tạo nút chọn nhanh cho các loại question type
  const QuestionTypeSelector = () => {
    return (
      <div className="flex flex-col space-y-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center justify-start h-12 w-full border",
            activeQuestion.question_type === 'multiple_choice'
              ? `${questionTypeColors['multiple_choice']} font-medium`
              : "hover:bg-purple-50 dark:hover:bg-purple-900/10"
          )}
          onClick={() => onQuestionTypeChange('multiple_choice')}
        >
          <Radio className={cn("h-5 w-5 mr-2", activeQuestion.question_type === 'multiple_choice' ? "text-purple-600" : "text-gray-400")} />
          <span className="text-sm font-medium">Single Choice</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center justify-start h-12 w-full border",
            activeQuestion.question_type === 'multiple_response'
              ? `${questionTypeColors['multiple_response']} font-medium`
              : "hover:bg-blue-50 dark:hover:bg-blue-900/10"
          )}
          onClick={() => onQuestionTypeChange('multiple_response')}
        >
          <CheckSquare className={cn("h-5 w-5 mr-2", activeQuestion.question_type === 'multiple_response' ? "text-blue-600" : "text-gray-400")} />
          <span className="text-sm font-medium">Multiple Choice</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center justify-start h-12 w-full border",
            activeQuestion.question_type === 'true_false'
              ? `${questionTypeColors['true_false']} font-medium`
              : "hover:bg-green-50 dark:hover:bg-green-900/10"
          )}
          onClick={() => onQuestionTypeChange('true_false')}
        >
          <div className="flex mr-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <XCircle className="h-5 w-5 text-red-500 -ml-1" />
          </div>
          <span className="text-sm font-medium">True/False</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center justify-start h-12 w-full border",
            activeQuestion.question_type === 'text_answer'
              ? `${questionTypeColors['text_answer']} font-medium`
              : "hover:bg-pink-50 dark:hover:bg-pink-900/10"
          )}
          onClick={() => onQuestionTypeChange('text_answer')}
        >
          <AlignLeft className={cn("h-5 w-5 mr-2", activeQuestion.question_type === 'text_answer' ? "text-pink-600" : "text-gray-400")} />
          <span className="text-sm font-medium">Text Answer</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center justify-start h-12 w-full border",
            activeQuestion.question_type === 'reorder'
              ? `${questionTypeColors['reorder']} font-medium`
              : "hover:bg-orange-50 dark:hover:bg-orange-900/10"
          )}
          onClick={() => onQuestionTypeChange('reorder')}
        >
          <MoveVertical className={cn("h-5 w-5 mr-2", activeQuestion.question_type === 'reorder' ? "text-orange-600" : "text-gray-400")} />
          <span className="text-sm font-medium">Reorder</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center justify-start h-12 w-full border",
            activeQuestion.question_type === 'location'
              ? `${questionTypeColors['location']} font-medium`
              : "hover:bg-cyan-50 dark:hover:bg-cyan-900/10"
          )}
          onClick={() => onQuestionTypeChange('location')}
        >
          <MapPin className={cn("h-5 w-5 mr-2", activeQuestion.question_type === 'location' ? "text-cyan-600" : "text-gray-400")} />
          <span className="text-sm font-medium">Location</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center justify-start h-12 w-full border",
            activeQuestion.question_type === 'slide'
              ? `${questionTypeColors['slide']} font-medium`
              : "hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
          )}
          onClick={() => onQuestionTypeChange('slide')}
        >
          <FileText className={cn("h-5 w-5 mr-2", activeQuestion.question_type === 'slide' ? "text-yellow-600" : "text-gray-400")} />
          <span className="text-sm font-medium">Information Slide</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center justify-start h-12 w-full border",
            activeQuestion.question_type === 'info_slide'
              ? `${questionTypeColors['info_slide']} font-medium`
              : "hover:bg-indigo-50 dark:hover:bg-indigo-900/10"
          )}
          onClick={() => onQuestionTypeChange('info_slide')}
        >
          <FileText className={cn("h-5 w-5 mr-2", activeQuestion.question_type === 'info_slide' ? "text-indigo-600" : "text-gray-400")} />
          <span className="text-sm font-medium">Interactive Info Slide</span>
        </Button>
      </div>
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

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="time-limit">Time Limit</Label>
          <Badge variant="outline" className="px-2 py-1 font-mono">{timeLimit}s</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Slider
            id="time-limit"
            min={5}
            max={120}
            step={5}
            value={[timeLimit]}
            onValueChange={(value) => onTimeLimitChange(value[0])}
            className="flex-1"
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-1">
          {timePresets.map(time => (
            <Button
              key={time}
              variant={timeLimit === time ? "default" : "outline"}
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => onTimeLimitChange(time)}
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

      toast({
        title: "Saved successfully",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      console.error('Error updating activity:', error);
      toast({
        title: "Error saving changes",
        description: "Could not save your changes. Please try again.",
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
    setBackgroundColor(value);
    // Update in real-time but with debounce for better UX
    if (activity) {
      debouncedUpdateActivity({ backgroundColor: value });

      // Use the immediate background update function if available
      if (typeof window !== 'undefined' && window.updateActivityBackground) {
        window.updateActivityBackground(activity.id, { backgroundColor: value });
      }
    }
  };

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
    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <Label htmlFor="background-color">Background Color</Label>
          <div className="flex gap-3">
            <div
              className="h-10 w-10 rounded-md border overflow-hidden"
              style={{ backgroundColor }}
            />
            <Input
              id="background-color"
              type="color"
              value={backgroundColor}
              onChange={(e) => handleBackgroundColorChange(e.target.value)}
              className="w-full"
            />
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
  const SlideSettings = () => {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-800">
        <div className="mb-4">
          <Label htmlFor="slide-content" className="text-yellow-800 dark:text-yellow-300">Slide Content</Label>
          <Textarea
            id="slide-content"
            placeholder="Enter slide content"
            value={activeQuestion.slide_content || ""}
            onChange={(e) => handleSlideContentChange(e.target.value)}
            className="min-h-[100px] mt-2 bg-white dark:bg-black border-yellow-200 dark:border-yellow-700 focus-visible:ring-yellow-300"
          />
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
            Use line breaks to separate paragraphs
          </p>
        </div>

        <div className="mb-4">
          <Label htmlFor="slide-image-url" className="text-yellow-800 dark:text-yellow-300">Slide Image URL</Label>
          <div className="relative mt-2">
            <Input
              id="slide-image-url"
              placeholder="Enter image URL"
              value={activeQuestion.slide_image || ""}
              onChange={(e) => handleSlideImageChange(e.target.value, activeQuestionIndex)}
              className="pr-10 bg-white dark:bg-black border-yellow-200 dark:border-yellow-700 focus-visible:ring-yellow-300"
            />
            {activeQuestion.slide_image && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 text-xs"
                onClick={() => {
                  handleSlideImageChange("", activeQuestionIndex);
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
                  if (!(e.target as HTMLImageElement).src.includes('via.placeholder.com')) {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Invalid+Image+URL';
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-yellow-200 dark:border-yellow-800">
          <h4 className="text-sm font-medium mb-3 text-yellow-800 dark:text-yellow-300">Advanced Editing Options</h4>
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

  return (
    <Card className="border-none overflow-hidden shadow-md h-full w-full">
      <CardHeader className="px-4 py-2 flex flex-row items-center justify-between bg-white dark:bg-gray-950 border-b">
        <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Settings</CardTitle>
        <div className="flex items-center gap-1">
          <Settings className="h-4 w-4 text-gray-400" />
        </div>
      </CardHeader>
      <CardContent className="p-4 bg-white dark:bg-black overflow-auto" style={{ height: "calc(100% - 48px)" }}>
        <Tabs value={activeSettingsTab} onValueChange={setActiveSettingsTab} className="w-full">
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
                      onAddOption={onAddOption}
                      onOptionChange={onOptionChange}
                      onDeleteOption={onDeleteOption}
                      questionType={activeQuestion.question_type}
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
