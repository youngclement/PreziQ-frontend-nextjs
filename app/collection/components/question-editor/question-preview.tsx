'use client';

// Extend Window interface to include our custom property
declare global {
  interface Window {
    lastQuestionClick?: number;
    savedBackgroundColors?: Record<string, string>;
  }
}

// Update the imports at the top of question-preview.tsx
import dynamic from 'next/dynamic';

// Define dynamic components with unique names to avoid conflicts
const DynamicLocationQuestionPlayer = dynamic(
  () => import('../question-player/location-question-player').then(mod => mod.LocationQuestionPlayer),
  { ssr: false }
);

const DynamicLocationQuestionEditor = dynamic(
  () => import('../question-editor/location-question-editor').then(mod => mod.LocationQuestionEditor),
  { ssr: false }
);

const FabricEditor = dynamic(() => import('../slide/slide-edit/slide-editor'), {
  ssr: false,
});

import {
  Clock, Image, Zap, Pencil, ChevronDown, ArrowUp, FileText,
  Search, Monitor, Tablet, Smartphone, GripVertical, Radio, CheckSquare, CheckCircle, XCircle, Type, MoveVertical, MapPin, Edit, Plus, Trash
} from "lucide-react";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuizQuestion, QuizOption, Activity } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";

import { slidesApi } from '@/api-client/slides-api';
import { storageApi } from '@/api-client/storage-api';
import { debounce } from 'lodash';
import { SlideElementPayload } from '@/types/slideInterface';
import { useToast } from '@/hooks/use-toast';
import { activitiesApi, ActivityType } from '@/api-client/activities-api';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface QuestionPreviewProps {
  questions: QuizQuestion[];
  activeQuestionIndex: number;
  timeLimit: number;
  backgroundImage: string;
  previewMode?: boolean;
  onQuestionLocationChange?: (questionIndex: number, locationData: any) => void;
  onQuestionTextChange: (value: string, questionIndex: number) => void;
  onOptionChange: (questionIndex: number, optionIndex: number, field: string, value: any) => void;
  onChangeQuestion: (index: number) => void;
  onSlideImageChange?: (value: string, index: number) => void;
  onSlideContentChange?: (value: string) => void;
  isQuestionListCollapsed?: boolean;
  onCorrectAnswerChange?: (value: string) => void;
  activity?: Activity;
  onSetActivitiesBackgrounds?: (fn: (activities: Activity[]) => void) => void;
  onUpdateActivityBackground?: (
    fn: (activityId: string, properties: { backgroundImage?: string; backgroundColor?: string }) => void
  ) => void;
  onAddQuestion: (question?: QuizQuestion) => void;
  onDeleteActivity?: (activityId: string) => void;
}

// Update the QuestionPreview component to include a hardcoded location quiz

export function QuestionPreview({
  questions,
  activeQuestionIndex,
  timeLimit,
  backgroundImage,
  previewMode = true,
  onQuestionLocationChange = () => { },
  onQuestionTextChange,
  onOptionChange,
  onChangeQuestion,
  onSlideImageChange,
  onSlideContentChange,
  isQuestionListCollapsed = false,
  onCorrectAnswerChange,
  activity,
  onSetActivitiesBackgrounds,
  onUpdateActivityBackground,
  onAddQuestion,
  onDeleteActivity
}: QuestionPreviewProps) {
  const [viewMode, setViewMode] = React.useState("desktop");
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  // Add state for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  // React to changes in activity props to update UI
  const [backgroundState, setBackgroundState] = React.useState({
    backgroundImage: activity?.backgroundImage || backgroundImage,
    backgroundColor: activity?.backgroundColor || '#FFFFFF'
  });

  // Map to store activity-specific backgrounds
  const [activityBackgrounds, setActivityBackgrounds] = React.useState<Record<string, {
    backgroundImage?: string;
    backgroundColor: string;
  }>>({});

  // Add this state to track when we need to force re-render
  const [renderKey, setRenderKey] = useState(0);

  // Add or update a function to update activity background in real-time
  const updateActivityBackground = (activityId: string, properties: {
    backgroundImage?: string;
    backgroundColor?: string;
  }) => {
    console.log('QuestionPreview: Updating background for activity:', activityId, properties);

    // Update the activity backgrounds map
    setActivityBackgrounds(prev => {
      const current = prev[activityId] || { backgroundImage: '', backgroundColor: '#FFFFFF' };
      const updated = {
        ...current,
        ...properties
      };

      const newBackgrounds = {
        ...prev,
        [activityId]: updated
      };

      return newBackgrounds;
    });

    // Force re-render for current activity - do this outside the setActivityBackgrounds callback
    // to ensure background state is updated independently
    if (activity && activity.id === activityId) {
      setBackgroundState(prev => ({
        ...prev,
        ...(properties.backgroundImage !== undefined ? { backgroundImage: properties.backgroundImage } : {}),
        ...(properties.backgroundColor !== undefined ? { backgroundColor: properties.backgroundColor } : {})
      }));
    }
  };

  // Update background state when activity changes
  React.useEffect(() => {
    console.log("Activity changed, updating background state:", activity);

    if (activity) {
      // Check if we have a saved color in the global storage first
      if (typeof window !== 'undefined' && window.savedBackgroundColors && activity.id) {
        const savedColor = window.savedBackgroundColors[activity.id];

        if (savedColor) {
          // Use saved color from global storage if available
          setBackgroundState({
            backgroundImage: activity.backgroundImage || '',
            backgroundColor: savedColor
          });
          return;
        }
      }

      // Fallback to activity props
      setBackgroundState({
        backgroundImage: activity.backgroundImage || '',
        backgroundColor: activity.backgroundColor || '#FFFFFF'
      });

      // If this activity has an ID, add it to the map
      if (activity.id) {
        setActivityBackgrounds(prev => ({
          ...prev,
          [activity.id]: {
            backgroundImage: activity.backgroundImage || '',
            backgroundColor: activity.backgroundColor || '#FFFFFF'
          }
        }));
      }
    }
  }, [activity]);

  // Expose the updateActivityBackground function to global window object
  // This enables synchronization across components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('Setting global updateActivityBackground function');

      // Initialize global storage if needed
      if (!window.savedBackgroundColors) {
        window.savedBackgroundColors = {};
      }

      // Store our updateActivityBackground function globally
      const globalUpdateActivityBackground = (activityId: string, properties: {
        backgroundImage?: string;
        backgroundColor?: string;
      }) => {
        console.log('Global updateActivityBackground called:', activityId, properties);

        // Save to global storage first
        if (properties.backgroundColor) {
          window.savedBackgroundColors = window.savedBackgroundColors || {};
          window.savedBackgroundColors[activityId] = properties.backgroundColor;
        }

        // Then call our component's function
        updateActivityBackground(activityId, properties);
      };

      window.updateActivityBackground = globalUpdateActivityBackground;

      // Cleanup on unmount
      return () => {
        if (window.updateActivityBackground === globalUpdateActivityBackground) {
          delete window.updateActivityBackground;
        }
      };
    }
  }, []);

  // Expose the function to parent component through the prop callback
  useEffect(() => {
    if (onUpdateActivityBackground) {
      console.log('Registering updateActivityBackground with parent component');
      onUpdateActivityBackground(updateActivityBackground);
    }
  }, [onUpdateActivityBackground]);

  // Expose the setActivitiesBackgrounds function to parent component
  useEffect(() => {
    if (onSetActivitiesBackgrounds) {
      onSetActivitiesBackgrounds(setActivitiesBackgrounds);
    }
  }, [onSetActivitiesBackgrounds]);

  // Function to bulk set activity backgrounds from collection API response
  const setActivitiesBackgrounds = (activities: Activity[]) => {
    if (!activities || activities.length === 0) return;

    const backgroundsMap: Record<string, {
      backgroundImage?: string;
      backgroundColor: string;
    }> = {};

    // Process all activities at once and build a map
    activities.forEach(act => {
      if (act.id) {
        backgroundsMap[act.id] = {
          backgroundImage: act.backgroundImage || '',
          backgroundColor: act.backgroundColor || '#FFFFFF'
        };
      }
    });

    // Set all backgrounds in one update
    setActivityBackgrounds(backgroundsMap);

    // Set main background from the first activity if available
    if (activities[0]) {
      setBackgroundState({
        backgroundImage: activities[0].backgroundImage || '',
        backgroundColor: activities[0].backgroundColor || '#FFFFFF'
      });
    }
  };

  // Function to handle scroll to question - let's improve this
  const scrollToQuestion = (index: number) => {
    if (questionRefs.current[index]) {
      // Use a small timeout to ensure DOM is ready
      setTimeout(() => {
        const container = scrollContainerRef.current;
        const question = questionRefs.current[index];

        if (container && question) {
          const containerRect = container.getBoundingClientRect();
          const questionRect = question.getBoundingClientRect();

          // Calculate the scroll position needed - adjust the offset for better positioning
          const scrollPosition = container.scrollTop + (questionRect.top - containerRect.top) - 20;

          // Use smooth scrolling
          container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      }, 100); // Increase timeout to ensure refs are up to date
    }
  };

  // Setup scroll event listener with a flag to prevent circular updates
  useEffect(() => {
    let isScrolling = false;

    const handleScroll = () => {
      if (isScrolling) return; // Skip if this is a programmatic scroll

      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        setShowScrollTop(scrollContainer.scrollTop > 300);

        // Don't detect active question during programmatic scrolling
        const now = Date.now();
        const lastClick = window.lastQuestionClick || 0;
        if (now - lastClick < 1000) return; // Skip detection for 1 second after a click

        // Find which question is most visible in the viewport
        let bestVisibleArea = 0;
        let mostVisibleIndex = activeQuestionIndex;

        const containerRect = scrollContainer.getBoundingClientRect();
        const containerTop = containerRect.top;
        const containerHeight = containerRect.height;

        questionRefs.current.forEach((ref, index) => {
          if (ref) {
            const rect = ref.getBoundingClientRect();

            // Skip if the element is not visible at all
            if (rect.bottom < containerTop || rect.top > containerTop + containerHeight) {
              return;
            }

            // Calculate how much of the element is visible
            const visibleTop = Math.max(rect.top, containerTop);
            const visibleBottom = Math.min(rect.bottom, containerTop + containerHeight);
            const visibleHeight = visibleBottom - visibleTop;

            // If this element has more visible area than our current best, update
            if (visibleHeight > bestVisibleArea) {
              bestVisibleArea = visibleHeight;
              mostVisibleIndex = index;
            }
          }
        });

        // Only update if we found a different question
        if (mostVisibleIndex !== activeQuestionIndex && bestVisibleArea > 0) {
          onChangeQuestion(mostVisibleIndex);
        }
      }
    };

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [activeQuestionIndex, onChangeQuestion]);

  // Modified useEffect for handling activeQuestionIndex changes
  useEffect(() => {
    // Set a flag to indicate we're programmatically scrolling
    const lastClick = window.lastQuestionClick || 0;
    const now = Date.now();

    // Only scroll if this was triggered by a click or is the initial render
    if (now - lastClick < 1000) {
      scrollToQuestion(activeQuestionIndex);
    }
  }, [activeQuestionIndex]);

  // Modify the initialization useEffect - this should only run once
  useEffect(() => {
    // Initialize the global variable if it doesn't exist yet
    if (typeof window !== 'undefined' && !window.lastQuestionClick) {
      window.lastQuestionClick = Date.now();
    }

    // Initial scroll to active question
    scrollToQuestion(activeQuestionIndex);
  }, []);

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Simplified color scheme with lighter, flatter colors
  const getQuestionTypeColor = (questionType: string) => {
    const colors = {
      "multiple_choice": "bg-blue-500 text-white",
      "multiple_response": "bg-violet-500 text-white",
      "true_false": "bg-emerald-500 text-white",
      "text_answer": "bg-amber-500 text-white",
      "reorder": "bg-pink-500 text-white",
      "location": "bg-cyan-500 text-white",
      "slide": "bg-indigo-500 text-white",
      "info_slide": "bg-indigo-500 text-white"
    };

    return colors[questionType as keyof typeof colors] || "bg-slate-500 text-white";
  };

  // Get question type icon
  const getQuestionTypeIcon = (questionType: string) => {
    const slideIcon = <FileText className="h-4 w-4" />;

    const icons = {
      "multiple_choice": <Radio className="h-4 w-4" />,
      "multiple_response": <CheckSquare className="h-4 w-4" />,
      "true_false": <div className="flex"><CheckCircle className="h-4 w-4" /><XCircle className="h-4 w-4 -ml-1" /></div>,
      "text_answer": <Type className="h-4 w-4" />,
      "reorder": <MoveVertical className="h-4 w-4" />,
      "location": <MapPin className="h-4 w-4" />,
      "slide": slideIcon,
      "info_slide": slideIcon
    };

    return icons[questionType as keyof typeof icons] || <Zap className="h-4 w-4" />;
  };

  // Enhanced renderQuestionContent function with simplified styling
  function renderQuestionContent(question: QuizQuestion, questionIndex: number, isActive: boolean, viewMode: string, backgroundImage: string) {
    const isSlideType = question.question_type === 'slide' || question.question_type === 'info_slide';

    // Find activity specific background for this question
    let actualBackgroundImage = ''; // Initialize with empty string instead of inheriting
    let actualBackgroundColor = '#FFFFFF'; // Safe default

    // Look up background info from the activities map first
    if (question.activity_id && activityBackgrounds[question.activity_id]) {
      const actBg = activityBackgrounds[question.activity_id];
      actualBackgroundImage = actBg.backgroundImage || ''; // Use empty string if undefined
      actualBackgroundColor = actBg.backgroundColor;
    }
    // Fallback to main activity if we have one
    else if (question.activity_id && activity?.id === question.activity_id) {
      actualBackgroundImage = activity.backgroundImage || ''; // Use empty string if undefined
      actualBackgroundColor = activity.backgroundColor || '#FFFFFF';
    }

    // Check if background image is actually defined (not empty string)
    const hasBackgroundImage = actualBackgroundImage && actualBackgroundImage.trim() !== '';

    if (isSlideType) {
      const slideTypeText = question.question_type === 'info_slide' ? 'Info Slide' : 'Slide';

      return (
        <div
          className={cn(
            'border-none rounded-xl shadow-lg overflow-hidden transition-all duration-300 mx-auto',
            isActive
              ? 'ring-2 ring-primary/20 scale-100'
              : 'scale-[0.98] opacity-90 hover:opacity-100 hover:scale-[0.99]',
            viewMode === 'desktop' && 'max-w-full w-full',
            viewMode === 'tablet' && 'max-w-4xl w-full',
            viewMode === 'mobile' && 'max-w-sm'
          )}
          style={{
            backgroundImage: hasBackgroundImage
              ? `url(${actualBackgroundImage})`
              : 'none',
            backgroundColor: hasBackgroundImage ? 'transparent' : actualBackgroundColor,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="flex flex-col items-center gap-6 w-full p-8 bg-white/95 dark:bg-gray-800/95 min-h-[400px]">
            <div className="w-full flex justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                {isSaving && <span className="text-blue-500">(Saving...)</span>}
              </div>
              <div className="flex items-center gap-2 bg-black/10 dark:bg-white/10 px-3 py-1.5 rounded-full">
                <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {slideTypeText} {questionIndex + 1}
                </span>
              </div>
            </div>

            {editMode !== null ? (
              <div className="w-full max-w-2xl">
                <Textarea
                  value={question.question_text || `${slideTypeText} ${questionIndex + 1}`}
                  onChange={(e) => onQuestionTextChange(e.target.value, questionIndex)}
                  className="text-2xl md:text-3xl font-bold text-center text-gray-800 dark:text-white"
                />
              </div>
            ) : (
              <motion.div
                className="w-full max-w-2xl"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 dark:text-white">
                  {question.question_text || `${slideTypeText} ${questionIndex + 1}`}
                </h2>
              </motion.div>
            )}

            {editMode !== null ? (
              <div className="w-full max-w-4xl">
                <Textarea
                  value={question.slide_content || ""}
                  onChange={(e) => {
                    if (onSlideContentChange) {
                      onSlideContentChange(e.target.value);
                    }
                  }}
                  className="text-lg md:text-xl text-center text-gray-700 dark:text-gray-200 min-h-[100px]"
                  placeholder="Enter slide content here..."
                />
              </div>
            ) : (
              <motion.div
                className="text-lg md:text-xl text-center text-gray-700 dark:text-gray-200 max-w-4xl"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {question.slide_content?.split('\n').map((line, i) => (
                  <p key={i} className="mb-3">
                    {line}
                  </p>
                )) || 'Slide content goes here'}
              </motion.div>
            )}

            {question.slide_image && (
              <motion.div
                className="mt-6 w-full flex justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <img
                  src={question.slide_image}
                  alt="Slide image"
                  className="max-h-96 w-auto rounded-lg object-contain shadow-md"
                />
              </motion.div>
            )}

            <div className="flex-1 w-full">
              <FabricEditor
                slideTitle={question.question_text || `${slideTypeText} ${questionIndex + 1}`}
                slideContent={question.slide_content || ""}
                onUpdate={(data) => {
                  if (onQuestionTextChange) {
                    onQuestionTextChange(data.title, questionIndex);
                  }
                  if (onSlideContentChange) {
                    onSlideContentChange(data.content);
                  }
                }}
                width={!isQuestionListCollapsed ? (viewMode === 'mobile' ? 300 : viewMode === 'tablet' ? 650 : 900) : (viewMode === 'mobile' ? 300 : viewMode === 'tablet' ? 650 : 1000)}
                height={400}
                zoom={1}
                slideId={question.activity_id}
                onSavingStateChange={(saving) => setIsSaving(saving)}
              />
            </div>
          </div>
        </div>
      );
    }

    // Simplified location question type
    if (question.question_type === 'location') {
      return (
        <Card
          className={cn(
            'border-none rounded-xl shadow-lg overflow-hidden transition-all duration-300 mx-auto',
            isActive
              ? 'ring-2 ring-primary/20 scale-100'
              : 'scale-[0.98] opacity-90 hover:opacity-100 hover:scale-[0.99]',
            viewMode === 'desktop' && 'max-w-5xl',
            viewMode === 'tablet' && 'max-w-2xl',
            viewMode === 'mobile' && 'max-w-sm'
          )}
        >
          {editMode !== null ? (
            <DynamicLocationQuestionEditor
              questionText={question.question_text || "Chọn vị trí trên bản đồ"}
              locationData={question.location_data || { lat: 21.028511, lng: 105.804817, radius: 10 }}
              onLocationChange={(locationData) => onQuestionLocationChange(questionIndex, locationData)}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              use3D={false}
              useGlobe={false}
            />
          ) : (
            <DynamicLocationQuestionPlayer
              questionText={question.question_text}
              locationData={question.location_data || { lat: 0, lng: 0, radius: 10 }}
              onAnswer={() => { }}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              use3D={false}
              useGlobe={false}
            />
          )}
        </Card>
      );
    }

    // Modified for question cards without slide type
    if (!isSlideType) {
      return (
        <Card
          className={cn(
            'border-none rounded-xl shadow-lg overflow-hidden transition-all duration-300 mx-auto',
            isActive
              ? 'ring-2 ring-primary/20 scale-100'
              : 'scale-[0.98] opacity-90 hover:opacity-100 hover:scale-[0.99]',
            viewMode === 'desktop' && 'max-w-5xl',
            viewMode === 'tablet' && 'max-w-2xl',
            viewMode === 'mobile' && 'max-w-sm'
          )}
          key={`question-card-${questionIndex}-${renderKey}`}
        >
          <motion.div
            className={cn(
              'aspect-[16/5] rounded-t-xl flex flex-col shadow-md relative overflow-hidden',
              hasBackgroundImage && 'bg-cover bg-center'
            )}
            style={{
              backgroundImage: hasBackgroundImage
                ? `url(${actualBackgroundImage})`
                : undefined,
              backgroundColor: actualBackgroundColor, // Always apply background color
            }}
            initial={{ opacity: 0.8 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            key={`question-bg-${questionIndex}-${renderKey}-${actualBackgroundColor}`}
          >
            {/* Light overlay */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Simplified Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-black/40 flex items-center justify-between px-5 text-white z-10">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-7 w-7 rounded-full flex items-center justify-center shadow-sm",
                  getQuestionTypeColor(question.question_type)
                )}>
                  {getQuestionTypeIcon(question.question_type)}
                </div>
                <div>
                  <div className="text-xs capitalize font-medium">
                    {question.question_type.replace(/_/g, ' ')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full text-xs font-medium">
                  Q{questionIndex + 1}
                </div>
                <div className="flex items-center gap-1.5 bg-primary px-2 py-1 rounded-full text-xs font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  {question.time_limit_seconds || timeLimit}s
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 py-6 px-5">
              {editMode !== null ? (
                <div className="w-full max-w-2xl">
                  <Textarea
                    value={question.question_text || `Question ${questionIndex + 1}`}
                    onChange={(e) => onQuestionTextChange(e.target.value, questionIndex)}
                    className="text-xl md:text-2xl font-bold text-center text-white bg-black/30 border-none focus:ring-white/30"
                  />
                </div>
              ) : (
                <div className="relative w-full max-w-2xl">
                  <h2 className="text-xl md:text-2xl font-bold text-center max-w-2xl text-white drop-shadow-sm px-4">
                    {question.question_text || `Question ${questionIndex + 1}`}
                  </h2>
                </div>
              )}
            </div>

            {/* Image Attribution */}
            {hasBackgroundImage && (
              <div className="absolute bottom-2 right-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full bg-black/40 hover:bg-black/50 text-white"
                >
                  <Image className="h-3 w-3" />
                </Button>
              </div>
            )}
          </motion.div>

          {/* Simplified options container */}
          <CardContent className="p-0 bg-card">
            {/* Layout for true/false */}
            {question.question_type === 'true_false' ? (
              <div className="p-4 grid grid-cols-2 gap-4 bg-white dark:bg-gray-800">
                {/* Direct rendering of true/false options */}
                {question.options.map((option, optionIndex) => {
                  const isTrue = option.option_text.toLowerCase() === 'true';
                  return (
                    <div
                      key={optionIndex}
                      className={cn(
                        "rounded-lg p-3 flex items-center gap-3 border transition-all duration-200 cursor-pointer hover:shadow-md relative group",
                        option.is_correct
                          ? "bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : isTrue
                            ? "bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                            : "bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      )}
                      onClick={() => toggleCorrectAnswer(questionIndex, optionIndex)}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
                        isTrue
                          ? "bg-blue-500 text-white"
                          : "bg-red-500 text-white"
                      )}>
                        {isTrue ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                      {editMode !== null ? (
                        <Input
                          value={option.option_text}
                          className="flex-1"
                          onChange={(e) => onOptionChange(questionIndex, optionIndex, "option_text", e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className="text-base font-medium flex-1">{option.option_text}</span>
                      )}
                      {option.is_correct && (
                        <div className="bg-green-500 text-white rounded-full p-1">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : question.question_type === 'text_answer' ? (
              <div className="p-4 bg-white dark:bg-gray-800">
                {/* Text input field placeholder */}
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-3">
                  <div className="h-9 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 px-3 flex items-center text-gray-500 dark:text-gray-400 text-sm">
                    Type your answer here...
                  </div>
                </div>

                {/* Correct answer display */}
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic relative group">
                  {editMode !== null ? (
                    <div className="flex items-center">
                      <span className="font-medium mr-2">Correct answer:</span>
                      <Input
                        value={question.correct_answer_text ||
                          (question.options && question.options.length > 0 &&
                            question.options.find(opt => opt.is_correct)?.option_text) || ""}
                        onChange={(e) => saveTextAnswer(questionIndex, e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">Correct answer:</span> {question.correct_answer_text ||
                        (question.options && question.options.length > 0 && question.options.find(opt => opt.is_correct)?.option_text) ||
                        "Not specified"}
                    </>
                  )}
                </div>
              </div>
            ) : question.question_type === 'reorder' ? (
              <div className="py-3 px-4 bg-white dark:bg-black">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                  <MoveVertical className="h-3.5 w-3.5 mr-1.5" />
                  <span>Drag items to put them in the correct order</span>
                </div>

                {/* Modern reorder question layout with visual steps */}
                <div className="mt-2 relative flex flex-col gap-2">
                  {/* Visual timeline line */}
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-black/30 dark:bg-white/20 z-0"></div>

                  {question.options
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((option, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 relative z-10 group"
                      >
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-black to-gray-800 dark:from-black dark:to-gray-900 flex items-center justify-center border border-gray-700 dark:border-gray-800 text-sm font-semibold text-white shadow-sm">
                          {idx + 1}
                        </div>

                        <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-2 shadow-sm border border-gray-300 dark:border-gray-800 flex items-center gap-2 relative">
                          {editMode !== null ? (
                            <Input
                              value={option.option_text || `Step ${idx + 1}`}
                              onChange={(e) => onOptionChange(questionIndex, idx, "option_text", e.target.value)}
                              className="flex-1"
                            />
                          ) : (
                            <>
                              <div className="flex-1">
                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                  {option.option_text || `Step ${idx + 1}`}
                                </p>
                              </div>
                            </>
                          )}

                          <div className="w-6 h-6 flex-shrink-0 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center cursor-grab text-gray-700 dark:text-gray-300">
                            <GripVertical className="h-3 w-3" />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                  <div className="flex items-start gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Students must arrange the items in the correct sequence.</span>
                  </div>
                </div>
              </div>
            ) : question.options && question.options.length > 0 && ['multiple_choice', 'multiple_response'].includes(question.question_type) ? (
              <div className={cn(
                'p-4 bg-white dark:bg-gray-800',
                question.options.length <= 2
                  ? 'grid grid-cols-1 gap-3 md:grid-cols-2'
                  : question.options.length <= 4
                    ? 'grid grid-cols-2 gap-3'
                    : 'grid grid-cols-2 gap-3 md:grid-cols-3',
                viewMode === 'mobile' && 'grid-cols-1',
                viewMode === 'tablet' && question.options.length > 4 && 'grid-cols-2'
              )}>
                {/* Direct rendering of choice options */}
                {question.options.map((option, optionIndex) => {
                  const optionLetter = ['A', 'B', 'C', 'D', 'E', 'F'][optionIndex];
                  const optionColors = [
                    'bg-blue-500',
                    'bg-pink-500',
                    'bg-green-500',
                    'bg-orange-500',
                    'bg-purple-500',
                    'bg-cyan-500'
                  ];

                  return (
                    <div
                      key={optionIndex}
                      className={cn(
                        "rounded-lg border p-3 flex items-center gap-3 transition-all duration-200 cursor-pointer hover:shadow-md relative group",
                        option.is_correct
                          ? "bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      )}
                      onClick={() => toggleCorrectAnswer(questionIndex, optionIndex)}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm",
                        optionColors[optionIndex % optionColors.length]
                      )}>
                        {optionLetter}
                      </div>

                      {editMode !== null ? (
                        <Input
                          value={option.option_text || `Option ${optionLetter}`}
                          onChange={(e) => onOptionChange(questionIndex, optionIndex, "option_text", e.target.value)}
                          className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {option.option_text || `Option ${optionLetter}`}
                          </span>
                        </div>
                      )}

                      {option.is_correct && (
                        <div className="bg-green-500 text-white rounded-full p-1">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>
      );
    }
  }

  // Function to save question text - không cần thiết lập lại editMode vì người dùng sẽ tắt nó qua toggle
  const saveQuestionText = (questionIndex: number, text: string) => {
    if (text.trim() === questions[questionIndex].question_text) return;

    onQuestionTextChange(text, questionIndex);

    // If we have an activity, update the activity title as well
    if (activity && questions[questionIndex].activity_id) {
      updateActivity({
        title: text
      }, questions[questionIndex].activity_id);

      toast({
        title: "Question updated",
        description: "Question text has been updated successfully",
        variant: "default",
      });
    }
  };

  // Function to save option text - không cần thiết lập lại editMode vì người dùng sẽ tắt nó qua toggle
  const saveOptionText = (questionIndex: number, optionIndex: number, text: string) => {
    if (text.trim() === questions[questionIndex].options[optionIndex].option_text) return;

    onOptionChange(questionIndex, optionIndex, "option_text", text);

    toast({
      title: "Option updated",
      description: "Option text has been updated successfully",
      variant: "default",
    });
  };

  // Function to toggle correct answer
  const toggleCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    const question = questions[questionIndex];
    const isMultipleResponse = question.question_type === 'multiple_response';
    const options = [...question.options];

    if (isMultipleResponse) {
      // For multiple response, toggle the current option
      onOptionChange(
        questionIndex,
        optionIndex,
        "is_correct",
        !options[optionIndex].is_correct
      );
    } else {
      // For multiple choice or true/false, set only this option as correct
      options.forEach((option, idx) => {
        onOptionChange(
          questionIndex,
          idx,
          "is_correct",
          idx === optionIndex
        );
      });
    }

    toast({
      title: "Correct answer updated",
      description: "The correct answer has been updated",
      variant: "default",
    });
  };

  // Function to update activity via API
  const updateActivity = async (data: any, activityId: string) => {
    try {
      setIsSaving(true);

      const response = await activitiesApi.updateActivity(activityId, data);

      // If we updated background color, make sure the UI reflects it immediately
      if (data.backgroundColor && typeof data.backgroundColor === 'string') {
        // Update local state for immediate UI feedback
        updateActivityBackground(activityId, { backgroundColor: data.backgroundColor });

        // Use global function to notify other components
        if (window.updateActivityBackground && window.updateActivityBackground !== updateActivityBackground) {
          window.updateActivityBackground(activityId, { backgroundColor: data.backgroundColor });
        }
      }

      toast({
        title: "Success",
        description: "Question updated successfully",
        variant: "default",
      });

      return response;
    } catch (error) {
      console.error("Error updating activity:", error);
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  // Debounced update to avoid too many API calls
  const debouncedUpdateActivity = React.useCallback(
    debounce((data: any, activityId: string) => {
      updateActivity(data, activityId);
    }, 800),
    []
  );

  // Function to save text answer - modified to work directly with input changes
  const saveTextAnswer = (questionIndex: number, text: string) => {
    const question = questions[questionIndex];
    // Check if the text is different from existing answer
    const currentCorrectAnswer = question.correct_answer_text ||
      (question.options && question.options.length > 0 && question.options.find(opt => opt.is_correct)?.option_text) || "";

    if (text.trim() === currentCorrectAnswer) return;

    // If there are options, update the first correct option instead of correct_answer_text
    if (question.options && question.options.length > 0) {
      // Find the first correct option, or first option if none are correct
      const correctOptionIndex = question.options.findIndex(opt => opt.is_correct);
      const targetIndex = correctOptionIndex >= 0 ? correctOptionIndex : 0;

      // Mark it as correct if not already and update the text
      if (!question.options[targetIndex].is_correct) {
        onOptionChange(questionIndex, targetIndex, "is_correct", true);
      }
      onOptionChange(questionIndex, targetIndex, "option_text", text);
    } else if (onCorrectAnswerChange) {
      // Otherwise use the correct_answer_text property
      onCorrectAnswerChange(text);
    }

    // No toast needed for direct editing - reduces UI noise
    if (editMode === null) {
      toast({
        title: "Text answer updated",
        description: "The correct text answer has been updated",
        variant: "default",
      });
    }
  };

  // Add or update a helper function to extract options from API data
  // This should be at the component level, before the return statement
  const extractOptionsFromActivity = (activity: any) => {
    if (!activity || !activity.quiz || !activity.quiz.quizAnswers) {
      return [];
    }

    // Map API quizAnswers to internal options format
    return activity.quiz.quizAnswers.map((answer: any, index: number) => ({
      id: answer.quizAnswerId,
      quiz_question_id: activity.quiz.quizId,
      option_text: answer.answerText,
      is_correct: answer.isCorrect,
      display_order: answer.orderIndex || index
    }));
  };

  // Add this right before the return statement
  useEffect(() => {
    // When the activity changes and has answers but the current question has none
    // Map the answers from the API to the internal format
    if (
      activity &&
      activity.quiz &&
      activity.quiz.quizAnswers &&
      activity.quiz.quizAnswers.length > 0 &&
      activeQuestionIndex >= 0 &&
      (!questions[activeQuestionIndex].options || questions[activeQuestionIndex].options.length === 0)
    ) {
      // Get the options from the activity
      const options = extractOptionsFromActivity(activity);

      // Pass each option to the onOptionChange handler
      options.forEach((option: QuizOption, optionIndex: number) => {
        onOptionChange(
          activeQuestionIndex,
          optionIndex,
          "option_text",
          option.option_text
        );
        onOptionChange(
          activeQuestionIndex,
          optionIndex,
          "is_correct",
          option.is_correct
        );
      });

      // If this is a text_answer type and we have a correct answer
      if (
        questions[activeQuestionIndex].question_type === 'text_answer' &&
        options.find((opt: QuizOption) => opt.is_correct)
      ) {
        const correctOption = options.find((opt: QuizOption) => opt.is_correct);
        if (correctOption && onCorrectAnswerChange) {
          onCorrectAnswerChange(correctOption.option_text);
        }
      }
    }
  }, [activity, activeQuestionIndex, questions, onOptionChange, onCorrectAnswerChange]);

  // Fix the mapQuestionTypeToActivityType function to correctly map question types to activity types
  const mapQuestionTypeToActivityType = (questionType: string): ActivityType => {
    switch (questionType) {
      case 'multiple_choice': return 'QUIZ_BUTTONS';
      case 'multiple_response': return 'QUIZ_CHECKBOXES';
      case 'true_false': return 'QUIZ_TRUE_OR_FALSE';
      case 'text_answer': return 'QUIZ_TYPE_ANSWER';
      case 'reorder': return 'QUIZ_REORDER';
      // Location doesn't have a specific activity type, so we'll use INFO_SLIDE as a fallback
      case 'location': return 'INFO_SLIDE';
      case 'slide': return 'INFO_SLIDE';
      case 'info_slide': return 'INFO_SLIDE';
      default: return 'INFO_SLIDE';
    }
  };

  // Replace the entire handleAddQuestion function with this enhanced version
  const handleAddQuestion = async (questionData?: QuizQuestion) => {
    try {
      setIsSaving(true);

      // Get the collection ID from current activity if available
      if (!activity?.collection_id) {
        toast({
          title: "Collection not found",
          description: "Cannot add activity: collection information not available.",
          variant: "destructive",
        });
        return;
      }

      // Create default question data if not provided
      if (!questionData) {
        questionData = {
          id: `temp_${Date.now()}_choice`,
          activity_id: '',
          question_text: 'New Single Choice Question',
          question_type: 'multiple_choice',
          options: [
            { id: `opt_1_${Date.now()}`, quiz_question_id: '', option_text: 'Option A', is_correct: true, display_order: 0 },
            { id: `opt_2_${Date.now()}`, quiz_question_id: '', option_text: 'Option B', is_correct: false, display_order: 1 },
          ],
          time_limit_seconds: 30,
          points: 1,
          correct_answer_text: ''
        };
      }

      // Step 1: Create activity with the appropriate type
      const activityType = mapQuestionTypeToActivityType(questionData.question_type);
      console.log(`Creating activity with type ${questionData.question_type} -> ${activityType}`);

      const activityPayload = {
        collectionId: activity.collection_id,
        activityType: activityType,
        title: questionData.question_text,
        description: questionData.slide_content || '',
        isPublished: false,
        backgroundColor: '#FFFFFF'
      };

      // Create the activity first
      const activityResponse = await activitiesApi.createActivity(activityPayload);
      console.log('Activity created:', activityResponse);

      // Make sure we have a valid response with an activity ID
      if (!activityResponse.data?.data?.activityId) {
        throw new Error("No activity ID returned from server");
      }

      const newActivityId = activityResponse.data.data.activityId;

      // Create the new activity object to add to local state
      const newActivity = {
        id: newActivityId,
        title: questionData.question_text,
        collection_id: activity.collection_id,
        description: questionData.slide_content || '',
        is_published: false,
        activity_type_id: activityType,
        backgroundColor: '#FFFFFF',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: ""
      };

      // Step 2: Initialize the appropriate quiz data based on question type
      try {
        let quizPayload;

        switch (questionData.question_type) {
          case 'multiple_choice':
            quizPayload = {
              type: "CHOICE" as const,
              questionText: questionData.question_text,
              timeLimitSeconds: questionData.time_limit_seconds || 30,
              pointType: "STANDARD" as const,
              answers: questionData.options.map(option => ({
                answerText: option.option_text,
                isCorrect: option.is_correct,
                explanation: option.explanation || ''
              }))
            };
            await activitiesApi.updateButtonsQuiz(newActivityId, quizPayload);
            break;

          case 'multiple_response':
            quizPayload = {
              type: "CHOICE" as const,
              questionText: questionData.question_text,
              timeLimitSeconds: questionData.time_limit_seconds || 30,
              pointType: "STANDARD" as const,
              answers: questionData.options.map(option => ({
                answerText: option.option_text,
                isCorrect: option.is_correct,
                explanation: option.explanation || ''
              }))
            };
            await activitiesApi.updateCheckboxesQuiz(newActivityId, quizPayload);
            break;

          case 'true_false':
            // For true/false, we find which option is marked as true
            const trueOption = questionData.options.find(o => o.option_text.toLowerCase() === 'true');
            quizPayload = {
              type: "TRUE_FALSE" as const,
              questionText: questionData.question_text,
              timeLimitSeconds: questionData.time_limit_seconds || 30,
              pointType: "STANDARD" as const,
              correctAnswer: trueOption?.is_correct || false
            };
            await activitiesApi.updateTrueFalseQuiz(newActivityId, quizPayload);
            break;

          case 'text_answer':
            quizPayload = {
              type: "TYPE_ANSWER" as const,
              questionText: questionData.question_text,
              timeLimitSeconds: questionData.time_limit_seconds || 30,
              pointType: "STANDARD" as const,
              correctAnswer: questionData.correct_answer_text || 'Enter the correct answer here'
            };
            console.log("Creating text answer quiz with payload:", quizPayload);
            try {
              const quizResponse = await activitiesApi.updateTypeAnswerQuiz(newActivityId, quizPayload);
              console.log("Text answer quiz created successfully:", quizResponse);
            } catch (quizError) {
              console.error("Error creating text answer quiz:", quizError);
              throw quizError; // Re-throw to trigger the error handling
            }
            break;

          case 'reorder':
            quizPayload = {
              type: "REORDER" as const,
              questionText: questionData.question_text,
              timeLimitSeconds: questionData.time_limit_seconds || 30,
              pointType: "STANDARD" as const,
              correctOrder: questionData.options.map(option => option.option_text)
            };
            await activitiesApi.updateReorderQuiz(newActivityId, quizPayload);
            break;

          case 'slide':
          case 'info_slide':
            // Slides don't need quiz data initialization
            break;

          default:
            console.log(`No specific initialization for question type: ${questionData.question_type}`);
        }

        console.log(`Quiz data initialized for ${questionData.question_type}`);
      } catch (quizError) {
        console.error(`Error initializing quiz data for ${questionData.question_type}:`, quizError);
        // We don't throw here to avoid stopping the flow if quiz initialization fails
        // The activity is still created and can be edited by the user
        toast({
          title: "Warning",
          description: "Activity created but quiz data initialization failed. You may need to set up the questions manually.",
          variant: "destructive",
        });
      }

      // Step 3: Update the local state with the new question
      const newQuestion = {
        ...questionData,
        activity_id: newActivityId
      };

      // If the parent component provides onAddQuestion, call it to update state
      if (typeof onAddQuestion === 'function') {
        onAddQuestion(newQuestion);
      }

      // Force a UI refresh by updating renderKey
      setRenderKey(prevKey => prevKey + 1);

      // Initialize the background color for this activity in global storage
      if (typeof window !== 'undefined') {
        window.savedBackgroundColors = window.savedBackgroundColors || {};
        window.savedBackgroundColors[newActivityId] = '#FFFFFF';

        // Update the activity backgrounds map
        updateActivityBackground(newActivityId, {
          backgroundColor: '#FFFFFF',
          backgroundImage: ''
        });
      }

      // Handle success
      toast({
        title: "Activity added",
        description: `New ${questionData.question_type.replace('_', ' ')} activity created successfully.`,
        variant: "default",
      });

      // Close the dialog (if it was open)
      setIsAddActivityOpen(false);
    } catch (error) {
      console.error("Error creating activity:", error);
      toast({
        title: "Error",
        description: "Failed to create new activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Add a function to handle activity deletion
  const handleDeleteActivity = async (activityId: string) => {
    // Instead of showing the browser confirm, set the activityToDelete and open the dialog
    setActivityToDelete(activityId);
    setIsDeleteDialogOpen(true);
  };

  // New function to handle the actual deletion after confirmation
  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;

    try {
      setIsSaving(true);

      // Check if this is a collectionId rather than an activityId
      // This is needed because the API response structure uses collectionId in some places 
      // where we might expect activityId
      const isCollectionId = activityToDelete.includes('-');

      // If we have a collectionId format but need activityId, try to find the corresponding activity
      let activityId = activityToDelete;
      if (isCollectionId && activity && activity.id !== activityToDelete) {
        console.log("Detected a collectionId instead of an activityId, finding proper activity ID");
        // In this case, we'll use the activity.id which should be the correct activityId
        activityId = activity.id;
      }

      console.log(`Deleting activity with ID: ${activityId}`);

      // Find the index of the question with this activity_id before we delete it
      const questionIndex = questions.findIndex(q => q.activity_id === activityId);
      if (questionIndex === -1) {
        console.warn(`Could not find question with activity_id ${activityId} in local state`);
      }

      // Call the API to delete the activity
      await activitiesApi.deleteActivity(activityId);

      // Notify of successful deletion
      toast({
        title: "Activity deleted",
        description: "The activity has been successfully deleted",
        variant: "default",
      });

      // Update UI without reload by:
      // 1. Remove the activity from activityBackgrounds
      setActivityBackgrounds(prev => {
        const updated = { ...prev };
        delete updated[activityId];
        return updated;
      });

      // 2. Force re-render 
      setRenderKey(prevKey => prevKey + 1);

      // 3. Call parent component's onDeleteActivity if provided
      // This is the critical step to update both the QuestionPreview and QuestionList components
      if (onDeleteActivity) {
        onDeleteActivity(activityId);
      } else {
        console.warn('onDeleteActivity callback not provided - UI may not update correctly');
      }

      // 4. If the deleted question was the active one, select another question
      if (questionIndex === activeQuestionIndex && questions.length > 1) {
        const newIndex = questionIndex > 0 ? questionIndex - 1 : 0;
        onChangeQuestion(newIndex);
      }

      // Log success for debugging
      console.log(`Activity ${activityId} successfully deleted and UI updated`);
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast({
        title: "Error",
        description: "Failed to delete activity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      // Close the dialog after completion
      setIsDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  return (
    <>
      <Card className={cn(
        "overflow-hidden transition-all w-full h-full border-none shadow-md",
        isQuestionListCollapsed && "max-w-full",
        isQuestionListCollapsed ? "ml-0" : "ml-0"
      )} key={`preview-card-${renderKey}`}>
        <CardHeader className="px-4 py-2 flex flex-row items-center justify-between bg-white dark:bg-gray-950 border-b">
          <div className="flex items-center gap-4">
            <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">Preview</CardTitle>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-mode"
                checked={editMode !== null}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setEditMode('global_edit_mode');
                  } else {
                    setEditMode(null);
                  }
                }}
              />
              <Label htmlFor="edit-mode" className="text-xs">Edit Mode</Label>
            </div>
            {isSaving && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                Saving...
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={setViewMode} className="h-8">
              <TabsList className="h-8 py-1">
                <TabsTrigger
                  value="mobile"
                  className="h-6 w-8 px-1.5 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-800"
                >
                  <Smartphone className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger
                  value="tablet"
                  className="h-6 w-8 px-1.5 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-800"
                >
                  <Tablet className="h-3 w-3" />
                </TabsTrigger>
                <TabsTrigger
                  value="desktop"
                  className="h-6 w-8 px-1.5 data-[state=active]:bg-gray-200 dark:data-[state=active]:bg-gray-800"
                >
                  <Monitor className="h-3 w-3" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent
          className="p-1 overflow-auto bg-gray-50 dark:bg-gray-950"
          ref={scrollContainerRef}
          style={{ height: 'calc(100% - 52px)' }}
        >
          <div className="w-full pb-2">
            {questions.map((question, questionIndex) => (
              <div
                key={questionIndex}
                ref={(el) => (questionRefs.current[questionIndex] = el)}
                className={cn(
                  'w-full mb-4 px-3 pt-3',
                  questionIndex === activeQuestionIndex && 'scroll-mt-4'
                )}
              >
                {/* Add delete button */}
                <div className="flex justify-end mb-2">
                  {question.activity_id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7"
                      onClick={() => handleDeleteActivity(question.activity_id)}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>

                {/* Conditional rendering based on question_type */}
                <div className="w-full">
                  {renderQuestionContent(question, questionIndex, questionIndex === activeQuestionIndex, viewMode, backgroundImage)}
                </div>
              </div>
            ))}

            {/* Simple Add Activity button */}
            <div className="w-full px-3 py-5 flex justify-center">
              <Button
                className="flex items-center gap-2"
                onClick={() => onAddQuestion()}
              >
                <Plus className="h-4 w-4" />
                Add Activity
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this activity? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteActivity}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface OptionItemProps {
  option: QuizOption;
  index: number;
  questionType: "multiple_choice" | "multiple_response" | "true_false" | "text_answer" | "slide" | "info_slide" | "reorder" | "location";
  questionIndex: number;
  onOptionEdit?: (questionIndex: number, optionIndex: number, text: string) => void;
  onToggleCorrect?: (questionIndex: number, optionIndex: number) => void;
}

function OptionItem({ option, index, questionType, questionIndex, onOptionEdit, onToggleCorrect }: OptionItemProps) {
  const optionLetter = ['A', 'B', 'C', 'D', 'E', 'F'][index];
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(option.option_text || `Option ${optionLetter}`);

  const getOptionStyle = () => {
    // Premium gradient combinations
    const styles = [
      { bg: "bg-gradient-to-r from-pink-600 via-rose-500 to-rose-700", border: "border-pink-200 dark:border-pink-900", shadow: "shadow-pink-200/40 dark:shadow-pink-900/20" },
      { bg: "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-700", border: "border-blue-200 dark:border-blue-900", shadow: "shadow-blue-200/40 dark:shadow-blue-900/20" },
      { bg: "bg-gradient-to-r from-green-600 via-emerald-500 to-emerald-700", border: "border-green-200 dark:border-green-900", shadow: "shadow-green-200/40 dark:shadow-green-900/20" },
      { bg: "bg-gradient-to-r from-amber-600 via-orange-500 to-orange-700", border: "border-amber-200 dark:border-amber-900", shadow: "shadow-amber-200/40 dark:shadow-amber-900/20" },
      { bg: "bg-gradient-to-r from-purple-600 via-violet-500 to-violet-700", border: "border-purple-200 dark:border-purple-900", shadow: "shadow-purple-200/40 dark:shadow-purple-900/20" },
      { bg: "bg-gradient-to-r from-cyan-600 via-sky-500 to-sky-700", border: "border-cyan-200 dark:border-cyan-900", shadow: "shadow-cyan-200/40 dark:shadow-cyan-900/20" },
    ];
    return styles[index % styles.length];
  };

  const optionStyle = getOptionStyle();

  const handleEditSave = () => {
    if (onOptionEdit) {
      onOptionEdit(questionIndex, index, editText);
    }
    setIsEditing(false);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleToggleCorrect = () => {
    if (onToggleCorrect) {
      onToggleCorrect(questionIndex, index);
    }
  };

  // Improved true/false options with premium styling
  if (questionType === 'true_false') {
    const isTrue = option.option_text.toLowerCase() === 'true';

    return (
      <motion.div
        className={cn(
          "group rounded-lg transition-all duration-300 overflow-hidden",
          "cursor-pointer hover:scale-[1.02]"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleToggleCorrect}
      >
        <div className={cn(
          "p-5 h-full w-full rounded-lg transition-all duration-300 flex items-center gap-4",
          "border-2 backdrop-blur-lg shadow-xl relative overflow-hidden",
          isTrue
            ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 hover:border-blue-300 dark:hover:border-blue-700"
            : "bg-red-50/80 dark:bg-red-950/40 border-red-200 dark:border-red-800/80 hover:border-red-300 dark:hover:border-red-700"
        )}>
          {/* Decorative light effect */}
          <div className={cn(
            "absolute inset-0 bg-[radial-gradient(circle_at_100%_100%,rgba(255,255,255,0.15),transparent_70%)]",
            isTrue ? "opacity-40" : "opacity-30"
          )}></div>

          <div className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center shadow-lg relative z-10 border border-white/30",
            isTrue
              ? "bg-gradient-to-br from-blue-500 via-blue-400 to-blue-600 text-white"
              : "bg-gradient-to-br from-red-500 via-red-400 to-red-600 text-white"
          )}>
            {isTrue ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
          </div>

          <span className="text-lg font-medium flex-1 relative z-10">{option.option_text}</span>

          {/* Enhanced correct answer marker */}
          {option.is_correct && (
            <div className="bg-gradient-to-r from-green-500 via-emerald-400 to-emerald-600 text-white rounded-full p-1.5 shadow-lg relative z-10 border border-white/30">
              <CheckCircle className="h-4 w-4" />
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Enhanced multiple choice and multiple response options
  return (
    <motion.div
      className={cn(
        "group rounded-lg transition-all duration-300 overflow-hidden",
        "cursor-pointer hover:scale-[1.02]",
        option.is_correct && questionType !== 'reorder' && "shadow-lg"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleToggleCorrect}
    >
      <div className={cn(
        "p-4 h-full rounded-lg border-2 flex items-center gap-4 transition-all duration-300 relative",
        "backdrop-blur-lg shadow-xl",
        option.is_correct
          ? "bg-green-50/80 dark:bg-green-950/40 border-green-300 dark:border-green-800/80 hover:border-green-400 dark:hover:border-green-700"
          : "bg-white/90 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
        optionStyle.shadow
      )}>
        {/* Decorative light effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(255,255,255,0.1),transparent_70%)] opacity-50"></div>

        <div
          className={cn(
            "relative z-10 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white font-medium shadow-lg border border-white/30",
            optionStyle.bg
          )}
        >
          {optionLetter}
        </div>

        <div className="flex-1 flex items-center justify-between relative z-10">
          {isEditing ? (
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="flex-1"
              autoFocus
              onBlur={handleEditSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleEditSave();
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <>
              <span className="text-base text-gray-800 dark:text-gray-100">
                {option.option_text || `Option ${optionLetter}`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-0"
                onClick={handleEditClick}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </>
          )}

          {option.is_correct && (
            <div className="flex-shrink-0 bg-gradient-to-r from-green-500 via-emerald-400 to-emerald-600 text-white rounded-full p-1.5 shadow-lg border border-white/30">
              <CheckCircle className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}