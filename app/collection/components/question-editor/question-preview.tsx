'use client';

// Extend Window interface to include our custom property
declare global {
  interface Window {
    lastQuestionClick?: number;
    savedBackgroundColors?: Record<string, string>;
    scrollToNewestQuestion?: () => void;
    updateActivityBackground?: (
      activityId: string,
      properties: { backgroundImage?: string; backgroundColor?: string }
    ) => void;
    lastLocationUpdate?: {
      timestamp: number;
      activityId: string;
      locationData: any[];
      source?: string;
    };
  }
}

// Update the imports at the top of question-preview.tsx
import dynamic from 'next/dynamic';

// Define dynamic components with unique names to avoid conflicts
const DynamicLocationQuestionPlayer = dynamic(
  () =>
    import('../question-player/location-question-player').then(
      (mod) => mod.LocationQuestionPlayer
    ),
  { ssr: false }
);

const DynamicLocationQuestionEditor = dynamic(
  () =>
    import('../question-editor/location-question-editor').then(
      (mod) => mod.LocationQuestionEditor
    ),
  { ssr: false }
);

const FabricEditor = dynamic(() => import('../slide/slide-edit/slide-editor'), {
  ssr: false,
});

import {
  Clock,
  Image,
  Zap,
  Pencil,
  FileText,
  Monitor,
  Tablet,
  Smartphone,
  GripVertical,
  Radio,
  CheckSquare,
  CheckCircle,
  XCircle,
  Type,
  MoveVertical,
  MapPin,
  Edit,
  Plus,
  Trash,
  Info,
  Link2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { QuizQuestion, QuizOption, Activity } from '../types';
import { motion } from 'framer-motion';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { debounce } from 'lodash';
import type { SlideElementPayload } from '@/types/slideInterface';
import { activitiesApi, type ActivityType } from '@/api-client/activities-api';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// First, let's import the needed drag and drop components from react-beautiful-dnd
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';

import { slideBackgroundManager } from '@/utils/slideBackgroundManager';

// Import the useToast hook at the top of the file
import { useToast } from '@/hooks/use-toast';

// Add import at the top
import { MatchingPairPreview } from './matching-pair-preview';

interface QuestionPreviewProps {
  questions: QuizQuestion[];
  activeQuestionIndex: number;
  timeLimit: number;
  backgroundImage: string;
  previewMode?: boolean;
  onQuestionLocationChange?: (questionIndex: number, locationData: any) => void;
  onQuestionTextChange: (
    value: string,
    questionIndex: number,
    isTyping?: boolean
  ) => void;
  onOptionChange: (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: any,
    isTyping?: boolean
  ) => void;
  onChangeQuestion: (index: number) => void;
  onSlideImageChange?: (value: string, index: number) => void;
  onSlideContentChange?: (value: string) => void;
  isQuestionListCollapsed?: boolean;
  onCorrectAnswerChange?: (value: string) => void;
  activity?: Activity;
  onSetActivitiesBackgrounds?: (fn: (activities: Activity[]) => void) => void;
  onUpdateActivityBackground?: (
    fn: (
      activityId: string,
      properties: { backgroundImage?: string; backgroundColor?: string }
    ) => void
  ) => void;
  onAddQuestion: (question?: QuizQuestion) => void;
  onDeleteActivity?: (activityId: string) => void;
  onAddOption?: () => void;
  onDeleteOption?: (index: number) => void;
  onReorderOptions?: (fromIndex: number, toIndex: number) => void;
  leftColumnName?: string;
  rightColumnName?: string;
  slideElements?: Record<string, SlideElementPayload[]>;
  slidesData?: Record<string, any>;
  slidesBackgrounds?: Record<
    string,
    { backgroundImage: string; backgroundColor: string }
  >;
  onSlideElementsUpdate?: (
    activityId: string,
    elements: SlideElementPayload[]
  ) => void;
  correctAnswerText: string;
  onCorrectAnswerTextChange: (value: string) => void;
  onCorrectAnswerTextBlur: (value: string) => void;
}

interface SlideData {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  activityId: string;
  activityType: ActivityType;
  title: string;
  description: string;
  isPublished: boolean;
  orderIndex: number;
  backgroundColor?: string;
  backgroundImage?: string;
  customBackgroundMusic?: string;
  slide?: {
    slideElements: SlideElementPayload[];
  };
}

interface LocationAnswer {
  quizLocationAnswerId?: string;
  longitude: number;
  latitude: number;
  radius: number;
  lng?: number;
  lat?: number;
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
  onDeleteActivity,
  onAddOption = () => { },
  onDeleteOption = () => { },
  onReorderOptions,
  leftColumnName,
  rightColumnName,
  slideElements,
  onSlideElementsUpdate,
  slidesData,
  slidesBackgrounds,
  correctAnswerText,
  onCorrectAnswerTextChange,
  onCorrectAnswerTextBlur,
}: QuestionPreviewProps) {
  const [viewMode, setViewMode] = React.useState('desktop');
  const [showScrollTop, setShowScrollTop] = React.useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(
    null
  );
  const blurTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

  const [activeQuestionPairIndex, setActiveQuestionPairIndex] = useState(0);
  const [isAddActivityOpen, setIsAddActivityOpen] = useState(false);
  // Add state for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  // const [slidesData, setSlidesData] = useState<Record<string, SlideData>>({});
  // const [slidesElements, setSlidesElements] = useState<
  //   Record<string, SlideElementPayload[]>
  // >({});

  // React to changes in activity props to update UI
  const [backgroundState, setBackgroundState] = React.useState({
    backgroundImage: activity?.backgroundImage || backgroundImage,
    backgroundColor: activity?.backgroundColor || '#FFFFFF',
  });

  // const [slidesBackgrounds, setSlidesBackgrounds] = useState<
  //   Record<string, { backgroundImage: string; backgroundColor: string }>
  // >({});

  // Map to store activity-specific backgrounds
  const [activityBackgrounds, setActivityBackgrounds] = React.useState<
    Record<
      string,
      {
        backgroundImage?: string;
        backgroundColor: string;
      }
    >
  >({});

  // Add this state to track when we need to force re-render
  const [renderKey, setRenderKey] = useState(0);

  // Add toast hook
  const { toast } = useToast();

  // Add state for reorder feedback
  const [isReordering, setIsReordering] = useState(false);

  // Listen for reorder events to show feedback
  useEffect(() => {
    const handleReorderSuccess = (event: CustomEvent) => {
      setIsReordering(false);
      toast({
        title: "✅ Sắp xếp thành công",
        description: "Thứ tự các bước đã được cập nhật.",
        duration: 2000,
      });
    };

    const handleReorderError = (event: CustomEvent) => {
      setIsReordering(false);
      toast({
        title: "❌ Lỗi sắp xếp",
        description: "Không thể cập nhật thứ tự. Vui lòng thử lại.",
        variant: "destructive",
        duration: 3000,
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('reorder:success', handleReorderSuccess as EventListener);
      window.addEventListener('reorder:error', handleReorderError as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('reorder:success', handleReorderSuccess as EventListener);
        window.removeEventListener('reorder:error', handleReorderError as EventListener);
      }
    };
  }, [toast]);

  const activeQuestion = questions[activeQuestionIndex];
  const [currentQuestion, setCurrentQuestion] = useState(activeQuestion);

  // Handler functions
  const handleCorrectAnswerChange = (value: string) => {
    // You can implement logic to save the score or update state
  };

  const saveBackgroundToServer = async (
    activityId: string,
    backgroundData: { backgroundImage: string; backgroundColor: string }
  ) => {
    try {
      setIsSaving(true);
      await activitiesApi.updateActivity(activityId, {
        backgroundColor: backgroundData.backgroundColor,
        backgroundImage: backgroundData.backgroundImage,
      });

      // Cập nhật global storage
      if (typeof window !== 'undefined') {
        if (!window.savedBackgroundColors) window.savedBackgroundColors = {};
        window.savedBackgroundColors[activityId] =
          backgroundData.backgroundColor;
      }
    } catch (error) {
      console.error('Error saving background:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Add this useEffect to listen for time limit update events
  useEffect(() => {
    const handleTimeLimitUpdate = (event: any) => {
      // Check if this update is for our current activity
      if (activity && event.detail && event.detail.activityId === activity.id) {
        // console.log('Time limit updated, refreshing UI');

        // First, directly update DOM elements with the time-limit-display class
        // This prevents flickering by immediately updating visible elements
        const timeDisplayElements = document.querySelectorAll(
          '.time-limit-display'
        );
        if (timeDisplayElements.length > 0) {
          timeDisplayElements.forEach((el) => {
            el.textContent = `${event.detail.timeLimitSeconds}s`;
          });

          // No need to force re-render with the key change since we've updated DOM directly
          // This avoids the flickering effect
        } else {
          // Fallback if we can't find the elements - update with minimal visual disruption
          requestAnimationFrame(() => {
            setRenderKey((prev) => prev + 1);
          });
        }
      }
    };

    // Add event listener
    window.addEventListener(
      'activity:timeLimit:updated',
      handleTimeLimitUpdate
    );

    // Cleanup
    return () => {
      window.removeEventListener(
        'activity:timeLimit:updated',
        handleTimeLimitUpdate
      );
    };
  }, [activity]);

  // Add or update a function to update activity background in real-time
  const updateActivityBackground = (
    activityId: string,
    properties: {
      backgroundImage?: string;
      backgroundColor?: string;
    }
  ) => {
    // Lưu vào global storage ngay lập tức để đảm bảo đồng bộ
    if (typeof window !== 'undefined' && properties.backgroundColor) {
      // Đảm bảo object đã được khởi tạo
      if (!window.savedBackgroundColors) {
        window.savedBackgroundColors = {};
      }
      window.savedBackgroundColors[activityId] = properties.backgroundColor;
    }

    // Cập nhật trạng thái local cho component hiện tại
    if (activity && activity.id === activityId) {
      // Cập nhật trạng thái background trước để UI hiển thị ngay lập tức
      setBackgroundState((prev) => ({
        ...prev,
        ...(properties.backgroundImage !== undefined
          ? { backgroundImage: properties.backgroundImage }
          : {}),
        ...(properties.backgroundColor !== undefined
          ? { backgroundColor: properties.backgroundColor }
          : {}),
      }));
    }

    // Cập nhật bản đồ activityBackgrounds sau đó
    if (activity?.activity_type_id != 'INFO_SLIDE') {
      setActivityBackgrounds((prev) => {
        const current = prev[activityId] || {
          backgroundImage: '',
          backgroundColor: '#FFFFFF',
        };
        const updated = {
          ...current,
          ...properties,
        };

        return {
          ...prev,
          [activityId]: updated,
        };
      });
    }
  };

  // Update background state when activity changes
  React.useEffect(() => {
    // console.log('Activity changed, updating background state:', activity);

    if (activity) {
      // Luôn ưu tiên sử dụng màu từ global storage trước
      const savedColor =
        typeof window !== 'undefined' &&
          window.savedBackgroundColors &&
          activity.id
          ? window.savedBackgroundColors[activity.id]
          : null;

      // Sử dụng màu đã lưu hoặc màu từ activity
      const backgroundColor =
        savedColor || activity.backgroundColor || '#FFFFFF';
      const backgroundImage = activity.backgroundImage || '';

      // Cập nhật trạng thái local
      setBackgroundState({
        backgroundImage,
        backgroundColor,
      });

      // Cập nhật vào bản đồ activities
      if (activity.id) {
        setActivityBackgrounds((prev) => ({
          ...prev,
          [activity.id]: {
            backgroundImage,
            backgroundColor,
          },
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
      const globalUpdateActivityBackground = (
        activityId: string,
        properties: {
          backgroundImage?: string;
          backgroundColor?: string;
        }
      ) => {
        console.log(
          'Global updateActivityBackground called:',
          activityId,
          properties
        );

        // Lưu vào global storage - đảm bảo window.savedBackgroundColors đã được khởi tạo
        if (properties.backgroundColor) {
          if (!window.savedBackgroundColors) window.savedBackgroundColors = {};
          window.savedBackgroundColors[activityId] = properties.backgroundColor;
        }

        // Cập nhật tất cả các thành phần đang hiển thị activity này
        updateActivityBackground(activityId, properties);

        // Phát sự kiện để thông báo cho các component khác
        const event = new CustomEvent('activity:background:updated', {
          detail: {
            activityId,
            properties,
            sender: 'globalUpdateFn',
          },
        });
        window.dispatchEvent(event);
      };

      window.updateActivityBackground = globalUpdateActivityBackground;

      // Lắng nghe sự kiện cập nhật từ các component khác
      const handleBackgroundUpdate = (event: any) => {
        if (
          event.detail &&
          event.detail.activityId &&
          event.detail.properties
        ) {
          // Chỉ cập nhật nếu không phải là người gửi
          if (event.detail.sender !== 'questionPreview') {
            updateActivityBackground(
              event.detail.activityId,
              event.detail.properties
            );
          }
        }
      };

      window.addEventListener(
        'activity:background:updated',
        handleBackgroundUpdate
      );

      // Cleanup on unmount
      return () => {
        if (
          window.updateActivityBackground === globalUpdateActivityBackground
        ) {
          delete window.updateActivityBackground;
        }
        window.removeEventListener(
          'activity:background:updated',
          handleBackgroundUpdate
        );
      };
    }
  }, []);

  // Expose the function to parent component through the prop callback
  useEffect(() => {
    if (onUpdateActivityBackground) {
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

    const backgroundsMap: Record<
      string,
      {
        backgroundImage?: string;
        backgroundColor: string;
      }
    > = {};

    // Process all activities at once and build a map
    activities.forEach((act) => {
      if (act.id) {
        backgroundsMap[act.id] = {
          backgroundImage: act.backgroundImage || '',
          backgroundColor: act.backgroundColor || '#FFFFFF',
        };
      }
    });

    // Set all backgrounds in one update
    setActivityBackgrounds(backgroundsMap);

    // Set main background from the first activity if available
    if (activities[0]) {
      setBackgroundState({
        backgroundImage: activities[0].backgroundImage || '',
        backgroundColor: activities[0].backgroundColor || '#FFFFFF',
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
          const scrollPosition =
            container.scrollTop + (questionRect.top - containerRect.top) - 20;

          // Use smooth scrolling
          container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth',
          });
        }
      }, 100); // Increase timeout to ensure refs are up to date
    }
  };

  // Setup scroll event listener with a flag to prevent circular updates
  useEffect(() => {
    const isScrolling = false;

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
            if (
              rect.bottom < containerTop ||
              rect.top > containerTop + containerHeight
            ) {
              return;
            }

            // Calculate how much of the element is visible
            const visibleTop = Math.max(rect.top, containerTop);
            const visibleBottom = Math.min(
              rect.bottom,
              containerTop + containerHeight
            );
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
      behavior: 'smooth',
    });
  };

  // Simplified color scheme with lighter, flatter colors
  const getQuestionTypeColor = (questionType: string) => {
    const colors = {
      multiple_choice: 'bg-violet-500 text-white',
      multiple_response: 'bg-blue-500 text-white',
      true_false: 'bg-emerald-500 text-white',
      text_answer: 'bg-amber-500 text-white',
      reorder: 'bg-pink-500 text-white',
      location: 'bg-cyan-500 text-white',
      slide: 'bg-indigo-500 text-white',
      info_slide: 'bg-indigo-500 text-white',
      matching_pair: 'bg-purple-500 text-white',
    };

    return (
      colors[questionType as keyof typeof colors] || 'bg-slate-500 text-white'
    );
  };

  // Get question type icon
  const getQuestionTypeIcon = (questionType: string) => {
    const slideIcon = <FileText className="h-4 w-4" />;

    const icons = {
      multiple_choice: <Radio className="h-4 w-4" />,
      multiple_response: <CheckSquare className="h-4 w-4" />,
      true_false: (
        <div className="flex">
          <CheckCircle className="h-4 w-4" />
          <XCircle className="h-4 w-4 -ml-1" />
        </div>
      ),
      text_answer: <Type className="h-4 w-4" />,
      reorder: <MoveVertical className="h-4 w-4" />,
      location: <MapPin className="h-4 w-4" />,
      slide: slideIcon,
      info_slide: slideIcon,
      matching_pair: <Link2 className="h-4 w-4" />,
    };

    return (
      icons[questionType as keyof typeof icons] || <Zap className="h-4 w-4" />
    );
  };

  const getQuestionTypeDisplayName = (questionType: string) => {
    const displayNames = {
      multiple_choice: 'Single Choice',
      multiple_response: 'Multiple Choice',
      // Keep others unchanged but formatted nicely
      true_false: 'True False',
      text_answer: 'Text Answer',
      reorder: 'Reorder',
      location: 'Location',
      slide: 'Slide',
      info_slide: 'Info Slide',
      matching_pair: 'Matching Pair',
    };

    return (
      displayNames[questionType as keyof typeof displayNames] ||
      questionType.replace(/_/g, ' ')
    );
  };

  // Enhanced renderQuestionContent function with simplified styling

  function renderQuestionContent(
    question: QuizQuestion,
    questionIndex: number,
    isActive: boolean,
    viewMode: string,
    backgroundImage: string
  ) {
    const isSlideType =
      question.question_type === 'slide' ||
      question.question_type === 'info_slide';

    const slideData =
      question.activity_id && slidesData
        ? slidesData[question.activity_id]
        : undefined;

    // const slideElements = question.activity_id
    //   ? slidesData[question.activity_id] ||
    //   slidesData[question.activity_id]?.slide?.slideElements ||
    //   []
    //   : [];

    // Find activity specific background for this question
    let actualBackgroundImage = ''; // Initialize with empty string
    let actualBackgroundColor = '#FFFFFF'; // Safe default

    // Thứ tự ưu tiên sử dụng background:
    // 1. Từ slidesBackgrounds (state đặc thù cho slide)
    // 2. Từ global storage
    // 3. Từ activityBackgrounds
    // 4. Từ activity hiện tại

    // 1. Ưu tiên lấy từ slidesBackgrounds trước nếu đây là slide
    if (
      isSlideType &&
      question.activity_id &&
      slidesBackgrounds?.[question.activity_id]
    ) {
      const slideBg = slidesBackgrounds[question.activity_id];
      actualBackgroundImage = slideBg.backgroundImage;
      actualBackgroundColor = slideBg.backgroundColor;
    }
    // 2. QUAN TRỌNG: Tiếp theo lấy màu từ global storage
    else if (
      question.activity_id &&
      typeof window !== 'undefined' &&
      window.savedBackgroundColors
    ) {
      const savedColor = window.savedBackgroundColors[question.activity_id];
      if (savedColor) {
        actualBackgroundColor = savedColor;
      }

      // Sau đó mới kiểm tra trong activityBackgrounds để lấy backgroundImage
      if (question.activity_id && activityBackgrounds[question.activity_id]) {
        const actBg = activityBackgrounds[question.activity_id];
        actualBackgroundImage = actBg.backgroundImage || '';
      }
    }
    // 3. Sau đó mới kiểm tra trong activityBackgrounds
    else if (
      question.activity_id &&
      activityBackgrounds[question.activity_id]
    ) {
      const actBg = activityBackgrounds[question.activity_id];
      actualBackgroundImage = actBg.backgroundImage || '';
      actualBackgroundColor = actBg.backgroundColor;
    }
    // 4. Fallback to main activity if we have one
    else if (question.activity_id && activity?.id === question.activity_id) {
      actualBackgroundImage = activity.backgroundImage || '';
      actualBackgroundColor = activity.backgroundColor || '#FFFFFF';
    }

    // Đảm bảo lưu màu vào global storage
    if (
      question.activity_id &&
      actualBackgroundColor &&
      typeof window !== 'undefined'
    ) {
      if (!window.savedBackgroundColors) {
        window.savedBackgroundColors = {};
      }
      window.savedBackgroundColors[question.activity_id] =
        actualBackgroundColor;
    }

    // Check if background image is actually defined (not empty string)
    const hasBackgroundImage =
      actualBackgroundImage && actualBackgroundImage.trim() !== '';

    if (isSlideType) {
      const slideTypeText =
        question.question_type === 'info_slide' ? 'Info Slide' : 'Slide';

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
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="flex flex-col items-center gap-3 w-full px-4 pb-8 pt-4 bg-gradient-to-br from-indigo-100/90 via-purple-100/80 to-blue-100/90 dark:from-indigo-900/90 dark:via-purple-900/80 dark:to-blue-900/95 min-h-[400px]">
            <div className="w-full flex justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
                {isSaving && <span className="text-blue-500">(Saving...)</span>}
              </div>
              <motion.div
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 px-4 py-2 rounded-full shadow-md"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FileText className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">
                  {slideTypeText} {questionIndex + 1}
                </span>
              </motion.div>
            </div>

            <div className="flex-1 w-full">
              <FabricEditor
                slideTitle={
                  question.question_text ||
                  `${slideTypeText} ${questionIndex + 1}`
                }
                slideContent={question.slide_content || ''}
                onUpdate={(data) => {
                  if (data.title) {
                    onQuestionTextChange(data.title, questionIndex);
                  }
                  if (data.content && onSlideContentChange) {
                    onSlideContentChange(data.content);
                  }
                  if (
                    data.slideElements &&
                    question.activity_id &&
                    onSlideElementsUpdate
                  ) {
                    onSlideElementsUpdate(
                      question.activity_id,
                      data.slideElements
                    );
                  }

                  if (
                    data.backgroundImage !== undefined ||
                    data.backgroundColor !== undefined
                  ) {
                    const updatedBackground = {
                      backgroundImage:
                        data.backgroundColor !== undefined
                          ? ''
                          : data.backgroundImage ?? '',
                      backgroundColor:
                        data.backgroundImage !== undefined
                          ? ''
                          : data.backgroundColor ?? '',
                    };
                    updateActivityBackground(
                      question.activity_id,
                      updatedBackground
                    );
                  }
                }}
                width={
                  !isQuestionListCollapsed
                    ? viewMode === 'mobile'
                      ? 300
                      : viewMode === 'tablet'
                        ? 650
                        : 812
                    : viewMode === 'mobile'
                      ? 300
                      : viewMode === 'tablet'
                        ? 650
                        : 812
                }
                height={460}
                zoom={1}
                slideId={question.activity_id}
                slideElements={
                  question.activity_id
                    ? slideElements?.[question.activity_id] || []
                    : []
                }
                backgroundColor={actualBackgroundColor}
                backgroundImage={actualBackgroundImage}
              />
            </div>
          </div>
        </div>
      );
    }

    // Simplified location question type
    if (question.question_type === 'location') {
      const locationAnswers = getLocationAnswers(question, activity);
      return (
        <div className="p-4">
          {locationAnswers && locationAnswers.length > 0 ? (
            <div className="w-full mt-2">
              {!previewMode ? (
                <DynamicLocationQuestionEditor
                  key={question.location_data?.quizLocationAnswers?.length || 0}
                  questionText={question.question_text}
                  locationAnswers={question.location_data?.quizLocationAnswers}
                  onLocationChange={(index, data) =>
                    onQuestionLocationChange?.(questionIndex, data)
                  }
                  questionIndex={questionIndex}
                />
              ) : (
                <DynamicLocationQuestionEditor
                  questionText={question.question_text}
                  locationAnswers={getLocationAnswers(question, activity)}
                  onLocationChange={() => { }} // Read-only, so no-op
                  questionIndex={questionIndex}
                  readonly={true}
                />
              )}
            </div>
          ) : (
            <div className="text-center p-8 bg-gray-50 rounded-lg">
              <p className="text-muted-foreground">
                No location data for this question yet.
              </p>
            </div>
          )}
        </div>
      );
    }

    // Handle matching_pair question type FIRST
    if (question.question_type === 'matching_pair') {
      console.log('Rendering matching pair question:', question);

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
          key={`question-card-matching-${questionIndex}-${renderKey}`}
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
              backgroundColor: actualBackgroundColor,
            }}
            initial={{ opacity: 0.8 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            key={`question-bg-${questionIndex}-${renderKey}-${actualBackgroundColor}`}
          >
            {/* Light overlay */}
            <div className="absolute inset-0 bg-black/30" />

            {/* Status Bar */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-black/40 flex items-center justify-between px-5 text-white z-10">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center shadow-sm',
                    getQuestionTypeColor(question.question_type)
                  )}
                >
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
                  <span className="time-limit-display">
                    {(activity && activity.quiz?.timeLimitSeconds) ||
                      question.time_limit_seconds ||
                      timeLimit}
                    s
                  </span>
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 py-6 px-5">
              {editMode !== null ? (
                <div className="w-full max-w-2xl">
                  <Textarea
                    value={
                      question.question_text ||
                      `Matching Pair Question ${questionIndex + 1}`
                    }
                    onChange={(e) =>
                      onQuestionTextChange(e.target.value, questionIndex, true)
                    }
                    className="resize-none custom-scrollbar text-xl md:text-2xl font-bold text-center text-white bg-black/30 border-none focus:ring-white/30"
                    onBlur={(e) =>
                      onQuestionTextChange(e.target.value, questionIndex, false)
                    }
                  />
                  <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                      width: 16px; /* Tăng width lên */
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                      background: transparent; /* Track trong suốt */
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                      background: rgba(255, 255, 255, 0.4);
                      border-radius: 8px;
                      border: 4px solid transparent; /* Tạo viền trong suốt */
                      background-clip: padding-box;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: rgba(255, 255, 255, 0.6);
                      border: 4px solid transparent;
                      background-clip: padding-box;
                    }
                  `}</style>
                </div>
              ) : (
                <div className="relative w-full max-w-2xl">
                  <h2 className="text-xl md:text-2xl font-bold text-center max-w-2xl text-white drop-shadow-sm px-4">
                    {question.question_text ||
                      `Matching Pair Question ${questionIndex + 1}`}
                  </h2>
                </div>
              )}
            </div>
          </motion.div>

          {/* Matching Pair Content */}
          <CardContent className="p-0 bg-white dark:bg-gray-800">
            <div className="w-full" key={question.id}>
              <MatchingPairPreview
                question={question}
                activityId={activity?.id || ''}
                questionIndex={questionIndex}
                isActive={isActive}
                viewMode={viewMode as 'desktop' | 'tablet' | 'mobile'}
                onCorrectAnswerChange={handleCorrectAnswerChange}
                editMode={editMode}
                setEditMode={setEditMode}
                editingText={editingText}
                setEditingText={setEditingText}
                editingOptionIndex={editingOptionIndex}
                setEditingOptionIndex={setEditingOptionIndex}
                onQuestionTextChange={onQuestionTextChange}
                onOptionChange={onOptionChange}
                onChangeQuestion={onChangeQuestion}
                leftColumnName={leftColumnName}
                rightColumnName={rightColumnName}
                previewMode={previewMode}
                onDeleteConnection={async (payload) => {
                  const connection =
                    question.quizMatchingPairAnswer?.connections?.find(
                      (c) =>
                        c.leftItem.quizMatchingPairItemId ===
                          payload.leftItemId &&
                        c.rightItem.quizMatchingPairItemId ===
                          payload.rightItemId
                    );
                  // Ưu tiên lấy activityId từ prop activity
                  const activityId = activity?.id || question.activity_id;
                  const connectionId = connection?.quizMatchingPairConnectionId;

                  if (connectionId && activityId) {
                    try {
                      await activitiesApi.deleteMatchingPairConnection(
                        connectionId,
                        activityId
                      );
                      toast({
                        title: 'Success',
                        description: 'Item deleted successfully',
                      });

                      // Gọi lại API lấy activity mới nhất
                      const response = await activitiesApi.getActivityById(
                        activityId
                      );
                      const updatedConnections =
                        response.data.data.quiz.quizMatchingPairAnswer
                          ?.connections ?? [];

                      onOptionChange(
                        questionIndex,
                        -1,
                        'update_connections',
                        updatedConnections
                      );
                    } catch (error) {
                      console.error(
                        'Failed to delete connection or refresh activity:',
                        error
                      );
                    }
                  } else {
                    // Thêm log để debug
                    console.error('Missing activityId or connectionId', {
                      activityId,
                      connectionId,
                    });
                  }
                }}
              />
            </div>
          </CardContent>
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
                <div
                  className={cn(
                    'h-7 w-7 rounded-full flex items-center justify-center shadow-sm',
                    getQuestionTypeColor(question.question_type)
                  )}
                >
                  {getQuestionTypeIcon(question.question_type)}
                </div>
                <div>
                  <div className="text-xs capitalize font-medium">
                    {getQuestionTypeDisplayName(question.question_type)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full text-xs font-medium">
                  Q{questionIndex + 1}
                </div>
                <div className="flex items-center gap-1.5 bg-primary px-2 py-1 rounded-full text-xs font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="time-limit-display">
                    {(activity && activity.quiz?.timeLimitSeconds) ||
                      question.time_limit_seconds ||
                      timeLimit}
                    s
                  </span>
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 py-6 px-5">
              {editMode !== null ? (
                <div className="w-full max-w-2xl">
                  <Textarea
                    value={question.question_text || ''}
                    onChange={(e) =>
                      onQuestionTextChange(e.target.value, questionIndex, true)
                    }
                    className="resize-none custom-scrollbar text-xl md:text-2xl font-bold text-center text-white bg-black/30 border-none focus:ring-white/30"
                    onBlur={(e) =>
                      onQuestionTextChange(e.target.value, questionIndex, false)
                    }
                  />
                  <style jsx global>{`
                    .custom-scrollbar::-webkit-scrollbar {
                      width: 16px; /* Tăng width lên */
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                      background: transparent; /* Track trong suốt */
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                      background: rgba(255, 255, 255, 0.4);
                      border-radius: 8px;
                      border: 4px solid transparent; /* Tạo viền trong suốt */
                      background-clip: padding-box;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: rgba(255, 255, 255, 0.6);
                      border: 4px solid transparent;
                      background-clip: padding-box;
                    }
                  `}</style>
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
                        'rounded-lg p-3 flex items-center gap-3 border transition-all duration-200 relative group',
                        option.is_correct
                          ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : isTrue
                            ? 'bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                            : 'bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800',
                        // Only show pointer cursor when edit mode is enabled
                        editMode !== null
                          ? 'cursor-pointer hover:shadow-md'
                          : ''
                      )}
                      onClick={() => {
                        // Only allow selection if edit mode is enabled
                        if (editMode !== null) {
                          const question = questions[questionIndex];
                          const isMultipleResponse =
                            question.question_type === 'multiple_response';
                          const options = [...question.options];

                          // For multiple choice or true/false, set only this option as correct
                          options.forEach((opt, idx) => {
                            onOptionChange(
                              questionIndex,
                              idx,
                              'is_correct',
                              idx === optionIndex
                            );
                          });

                          console.log('Correct answer updated');
                        }
                      }}
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shadow-sm',
                          isTrue
                            ? 'bg-blue-500 text-white'
                            : 'bg-red-500 text-white'
                        )}
                      >
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
                          onChange={(e) =>
                            onOptionChange(
                              questionIndex,
                              optionIndex,
                              'option_text',
                              e.target.value,
                              true
                            )
                          }
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) =>
                            onOptionChange(
                              questionIndex,
                              optionIndex,
                              'option_text',
                              e.target.value,
                              false
                            )
                          }
                        />
                      ) : (
                        <span className="text-base font-medium flex-1">
                          {option.option_text}
                        </span>
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
                <div className="mt-2 text-sm text-gray-600 dark:text-white italic relative group">
                  {editMode !== null ? (
                    <div className="flex items-center">
                      <span className="font-medium mr-2 text-gray-700 dark:text-white">
                        Correct answer:
                      </span>
                      <Input
                        value={
                          question.correct_answer_text ||
                          (question.options &&
                            question.options.length > 0 &&
                            question.options.find((opt) => opt.is_correct)
                              ?.option_text) ||
                          (question.options &&
                            question.options.length > 0 &&
                            question.options[0].option_text) ||
                          ''
                        }
                        onChange={(e) => {
                          // Cập nhật trực tiếp vào question
                          onOptionChange(
                            questionIndex,
                            0,
                            'correct_answer_text',
                            e.target.value,
                            true
                          );
                        }}
                        onBlur={(e) => {
                          // Gọi API khi blur
                          onOptionChange(
                            questionIndex,
                            0,
                            'correct_answer_text',
                            e.target.value,
                            false
                          );
                        }}
                        className="flex-1 border-blue-200 focus:border-blue-400 focus:ring-blue-400 text-gray-800 dark:text-white dark:bg-gray-700"
                      />
                    </div>
                  ) : (
                    <div
                      className="flex items-center cursor-pointer transition-all hover:bg-blue-50 dark:hover:bg-blue-900/30 p-2 rounded-md -mx-2"
                      onClick={() => setEditMode('text_answer_edit')}
                    >
                      <span className="font-medium">Correct answer:</span>{' '}
                      <span className="ml-1 font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">
                        {question.correct_answer_text ||
                          (question.options &&
                            question.options.length > 0 &&
                            question.options.find((opt) => opt.is_correct)
                              ?.option_text) ||
                          (question.options &&
                            question.options.length > 0 &&
                            question.options[0].option_text) ||
                          'Not specified'}
                      </span>
                      <Pencil className="h-3.5 w-3.5 ml-2 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                {/* Help text */}
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  {editMode !== null ? (
                    <p className="flex items-center">
                      <Info className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                      Click outside or press Enter to save your changes
                    </p>
                  ) : (
                    <p className="flex items-center">
                      <Info className="h-3.5 w-3.5 mr-1.5 text-blue-500" />
                      Click on the answer to edit it when in edit mode
                    </p>
                  )}
                </div>
              </div>
            ) : question.question_type === 'reorder' ? (
              <div className="py-3 px-4 bg-white dark:bg-black">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between">
                  <div className="flex items-center">
                    <MoveVertical className="h-3.5 w-3.5 mr-1.5" />
                    <span>
                      {editMode !== null
                        ? 'Kéo thả để sắp xếp các bước (chế độ chỉnh sửa đã bật)'
                        : 'Thứ tự các bước - Bật chế độ chỉnh sửa để sắp xếp lại'}
                    </span>
                  </div>

                  {editMode !== null && (
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs">Drag handle để di chuyển</span>
                    </div>
                  )}
                </div>

                {/* Enhanced drag and drop for reorder questions */}
                {editMode !== null ? (
                  <div className="relative">
                    {isReordering && (
                      <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow-lg border">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                          <span className="text-sm font-medium">Đang cập nhật...</span>
                        </div>
                      </div>
                    )}

                    <DragDropContext
                      onDragStart={() => {
                        console.log("🎯 REORDER PREVIEW: Drag started");
                      }}
                      onDragEnd={(result: DropResult) => {
                        console.log("🎯 REORDER PREVIEW: Drag operation completed", {
                          source: result.source,
                          destination: result.destination,
                          reason: result.reason,
                          questionIndex: questionIndex
                        });

                        if (
                          !result.destination ||
                          result.destination.index === result.source.index
                        ) {
                          console.log("🎯 REORDER PREVIEW: No reorder needed (same position or no destination)");
                          return;
                        }

                        console.log("🎯 REORDER PREVIEW: Calling onReorderOptions", {
                          sourceIndex: result.source.index,
                          destinationIndex: result.destination.index,
                          questionIndex: questionIndex
                        });

                        // Set loading state
                        setIsReordering(true);

                        if (onReorderOptions) {
                          onReorderOptions(
                            result.source.index,
                            result.destination.index
                          );
                        }
                      }}
                    >
                      <Droppable droppableId={`reorder-preview-droppable-${questionIndex}`}>
                        {(provided, snapshot) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className={cn(
                              "relative space-y-2",
                              snapshot.isDraggingOver && "bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-2"
                            )}
                          >
                            {/* Connecting line for visual guidance */}
                            {question.options.length > 1 && (
                              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-300 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 z-0"></div>
                            )}

                            {[...question.options]
                              .sort((a, b) => a.display_order - b.display_order)
                              .map((option, index) => (
                                <Draggable
                                  key={
                                    option.id || `option-${option.display_order}-${questionIndex}`
                                  }
                                  draggableId={
                                    option.id || `option-${option.display_order}-${questionIndex}`
                                  }
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        'flex items-center gap-2 p-1.5 relative mb-2 transition-all duration-300',
                                        snapshot.isDragging ? 'z-50 scale-105' : 'z-10'
                                      )}
                                      style={{
                                        ...provided.draggableProps.style,
                                      }}
                                    >
                                      {/* Step number */}
                                      <div className={cn(
                                        "flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-black to-gray-800 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center border border-gray-700 dark:border-gray-600 text-sm font-semibold text-white shadow-lg relative z-10 transition-all duration-300",
                                        snapshot.isDragging && 'scale-110 shadow-xl ring-2 ring-blue-400'
                                      )}>
                                        {index + 1}
                                      </div>

                                      {/* Step content */}
                                      <div
                                        className={cn(
                                          'flex-1 bg-white dark:bg-gray-800 rounded-lg p-3 border flex items-center gap-2 transition-all duration-300',
                                          snapshot.isDragging
                                            ? 'border-blue-400 ring-2 ring-blue-400/30 bg-blue-50/50 dark:bg-blue-900/20 shadow-xl scale-[1.02]'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md'
                                        )}
                                      >
                                        <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                                          {option.option_text}
                                        </span>

                                        {/* Drag handle */}
                                        <div
                                          {...provided.dragHandleProps}
                                          className={cn(
                                            "w-6 h-6 flex-shrink-0 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center cursor-grab text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors",
                                            snapshot.isDragging && "cursor-grabbing bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400"
                                          )}
                                        >
                                          <GripVertical className="h-3 w-3" />
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Static view when edit mode is off */}
                    {question.options.length > 1 && (
                      <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-300 dark:bg-gray-600 z-0"></div>
                    )}

                    {[...question.options]
                      .sort((a, b) => a.display_order - b.display_order)
                      .map((option, index) => (
                        <div
                          key={option.id || `option-${index}`}
                          className="flex items-center gap-2 p-1.5 relative mb-2"
                        >
                          {/* Step number */}
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center border border-gray-600 dark:border-gray-500 text-sm font-semibold text-white shadow-sm relative z-10">
                            {index + 1}
                          </div>

                          {/* Step content */}
                          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                              {option.option_text}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}

                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-xs text-blue-800 dark:text-blue-300">
                  <div className="flex items-start gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <div>
                      <div className="font-medium mb-1">Hướng dẫn sử dụng:</div>
                      <ul className="space-y-1">
                        <li>• Bật chế độ chỉnh sửa để kéo thả sắp xếp lại</li>
                        <li>• Giữ vào biểu tượng <GripVertical className="inline h-3 w-3 mx-1" /> để kéo</li>
                        <li>• Thứ tự sẽ được lưu tự động khi thả</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : question.options &&
              question.options.length > 0 &&
              ['multiple_choice', 'multiple_response'].includes(
                question.question_type
              ) ? (
              <div
                className={cn(
                  'p-4 bg-white dark:bg-gray-800',
                  question.options.length <= 2
                    ? 'grid grid-cols-1 gap-3 md:grid-cols-2'
                    : question.options.length <= 4
                      ? 'grid grid-cols-2 gap-3'
                      : 'grid grid-cols-2 gap-3 md:grid-cols-3',
                  viewMode === 'mobile' && 'grid-cols-1',
                  viewMode === 'tablet' &&
                  question.options.length > 4 &&
                  'grid-cols-2'
                )}
              >
                {/* Direct rendering of choice options */}
                {question.options.map((option, optionIndex) => {
                  const optionLetter = [
                    'A',
                    'B',
                    'C',
                    'D',
                    'E',
                    'F',
                    'G',
                    'H',
                    'I',
                  ][optionIndex];
                  const optionColors = [
                    'bg-blue-500',
                    'bg-pink-500',
                    'bg-green-500',
                    'bg-orange-500',
                    'bg-purple-500',
                    'bg-cyan-500',
                    'bg-red-500',
                    'bg-yellow-500',
                    'bg-teal-500',
                  ];

                  return (
                    <div
                      key={optionIndex}
                      className={cn(
                        'rounded-lg border p-3 flex items-center gap-3 transition-all duration-200 relative group',
                        option.is_correct
                          ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600',
                        // Only show pointer cursor when edit mode is active
                        editMode !== null
                          ? 'cursor-pointer hover:shadow-md'
                          : ''
                      )}
                      onClick={() =>
                        editMode !== null &&
                        toggleCorrectAnswer(questionIndex, optionIndex)
                      }
                    >
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm',
                          optionColors[optionIndex % optionColors.length]
                        )}
                      >
                        {optionLetter}
                      </div>

                      {editMode !== null ? (
                        <Input
                          value={option.option_text}
                          onChange={(e) =>
                            onOptionChange(
                              questionIndex,
                              optionIndex,
                              'option_text',
                              e.target.value,
                              true
                            )
                          }
                          className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200"
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() =>
                            onOptionChange(
                              questionIndex,
                              optionIndex,
                              'option_text',
                              option.option_text || '',
                              false // khi blur, isTyping=false để gọi API
                            )
                          }
                        />
                      ) : (
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                            {option.option_text}
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

                {/* Add Option button - visible only in edit mode */}
                {editMode !== null && question.options.length < 9 && (
                  <div
                    className="rounded-lg border border-dashed p-3 flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => onAddOption()}
                  >
                    <Plus className="h-5 w-5 text-blue-500" />
                    <span className="text-sm font-medium text-blue-500">
                      Add Option
                    </span>
                  </div>
                )}
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

    // Update local state through the parent component
    onQuestionTextChange(text, questionIndex);

    // If we have an activity, update the activity title as well
    if (activity && questions[questionIndex].activity_id) {
      setIsSaving(true);

      // Update the activity via API
      updateActivity(
        {
          title: text,
        },
        questions[questionIndex].activity_id
      )
        .then(() => {
          // Dispatch an event to notify other components about the title change
          if (typeof window !== 'undefined') {
            const event = new CustomEvent('activity:title:updated', {
              detail: {
                activityId: questions[questionIndex].activity_id,
                title: text,
                questionIndex: questionIndex,
              },
            });
            window.dispatchEvent(event);
          }
        })
        .catch((error) => {
          console.error('Error updating question title:', error);
        })
        .finally(() => {
          setIsSaving(false);
        });
    }
  };

  // Function to save option text - không cần thiết lập lại editMode vì người dùng sẽ tắt nó qua toggle
  const saveOptionText = (
    questionIndex: number,
    optionIndex: number,
    text: string
  ) => {
    if (
      text.trim() === questions[questionIndex].options[optionIndex].option_text
    )
      return;

    onOptionChange(questionIndex, optionIndex, 'option_text', text);

    console.log('Option text updated successfully');
  };

  // Function to toggle correct answer
  const toggleCorrectAnswer = (questionIndex: number, optionIndex: number) => {
    // Only allow toggling if edit mode is enabled
    if (editMode === null) {
      return;
    }

    const question = questions[questionIndex];
    const isMultipleResponse = question.question_type === 'multiple_response';
    const options = [...question.options];

    if (
      isMultipleResponse ||
      question.question_type === 'multiple_choice' ||
      question.question_type === 'true_false'
    ) {
      // For multiple response, toggle the current option
      onOptionChange(
        questionIndex,
        optionIndex,
        'is_correct',
        !options[optionIndex].is_correct
      );
    } else {
      // For multiple choice or true/false, set only this option as correct
      options.forEach((option, idx) => {
        onOptionChange(questionIndex, idx, 'is_correct', idx === optionIndex);
      });
    }

    console.log('Correct answer updated');
  };

  // Function to update activity via API
  const updateActivity = async (data: any, activityId: string) => {
    try {
      setIsSaving(true);

      // Nếu đang cập nhật màu nền hoặc hình nền và đây là slide
      const currentQuestion = questions[activeQuestionIndex];
      const isSlide =
        currentQuestion &&
        ['slide', 'info_slide'].includes(currentQuestion.question_type);

      // if (isSlide && (data.backgroundColor || data.backgroundImage)) {
      //   // Cập nhật slidesBackgrounds trước
      //   setSlidesBackgrounds((prev) => ({
      //     ...prev,
      //     [activityId]: {
      //       backgroundImage:
      //         data.backgroundImage !== undefined
      //           ? data.backgroundImage
      //           : prev[activityId]?.backgroundImage || '',
      //       backgroundColor:
      //         data.backgroundColor !== undefined
      //           ? data.backgroundColor
      //           : prev[activityId]?.backgroundColor || '#FFFFFF',
      //     },
      //   }));
      // }

      // Nếu đang cập nhật màu nền, cập nhật UI ngay lập tức trước khi gọi API
      if (data.backgroundColor && typeof data.backgroundColor === 'string') {
        // Cập nhật UI ngay lập tức để tránh hiệu ứng nhấp nháy
        updateActivityBackground(activityId, {
          backgroundColor: data.backgroundColor,
        });
      }

      // Gọi API để lưu thay đổi trên server
      const response = await activitiesApi.updateActivity(activityId, data);

      // Sau khi API trả về thành công, đảm bảo UI được cập nhật chính xác
      if (data.backgroundColor && typeof data.backgroundColor === 'string') {
        // Đảm bảo tất cả các component khác đều biết về thay đổi này
        slideBackgroundManager.set(activityId, {
          backgroundColor: data.backgroundColor,
          backgroundImage: '',
        });

        if (typeof window !== 'undefined') {
          const event = new CustomEvent('activity:background:updated', {
            detail: {
              activityId,
              properties: { backgroundColor: data.backgroundColor },
              sender: 'questionPreview',
            },
          });
          window.dispatchEvent(event);

          // Cập nhật global storage
          if (!window.savedBackgroundColors) {
            window.savedBackgroundColors = {};
          }
          window.savedBackgroundColors[activityId] = data.backgroundColor;
        }
      }

      if (data.backgroundImage && typeof data.backgroundImage === 'string') {
        slideBackgroundManager.set(activityId, {
          backgroundImage: data.backgroundImage,
          backgroundColor: '', // clear màu khi có ảnh mới
        });
      }

      return response;
    } catch (error) {
      console.error('Error updating activity:', error);

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
    const currentCorrectAnswer =
      question.correct_answer_text ||
      (question.options &&
        question.options.length > 0 &&
        question.options.find((opt) => opt.is_correct)?.option_text) ||
      '';

    if (text.trim() === currentCorrectAnswer) return;

    // If there are options, update the first correct option instead of correct_answer_text
    if (question.options && question.options.length > 0) {
      // Find the first correct option, or first option if none are correct
      const correctOptionIndex = question.options.findIndex(
        (opt) => opt.is_correct
      );
      const targetIndex = correctOptionIndex >= 0 ? correctOptionIndex : 0;

      // Mark it as correct if not already and update the text
      if (!question.options[targetIndex].is_correct) {
        onOptionChange(questionIndex, targetIndex, 'is_correct', true);
      }
      onOptionChange(questionIndex, targetIndex, 'option_text', text);
    } else if (onCorrectAnswerChange) {
      // Otherwise use the correct_answer_text property
      onCorrectAnswerChange(text);
    }

    // Call API to update the text answer if in edit mode and we have an activity ID
    if (editMode !== null && question.activity_id && activity) {
      setIsSaving(true);

      // Create the payload for the API
      const payload = {
        type: 'TYPE_ANSWER' as const,
        questionText: question.question_text || '',
        timeLimitSeconds: question.time_limit_seconds || timeLimit || 30,
        pointType: 'STANDARD' as const,
        correctAnswer: text,
      };

      // Call the API

      activitiesApi
        .updateTypeAnswerQuiz(question.activity_id, payload)
        .then(() => { })
        .catch((error) => {
          console.error('Error updating correct answer:', error);
        })
        .finally(() => {
          setIsSaving(false);
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
      display_order: answer.orderIndex || index,
    }));
  };

  // Add this right before the return statement
  useEffect(() => {
    if (
      !activity ||
      !activity.quiz ||
      !activity.quiz.quizAnswers ||
      activity.quiz.quizAnswers.length === 0 ||
      activeQuestionIndex < 0 ||
      // ADD THIS CHECK - Skip for slide types
      ['INFO_SLIDE', 'slide', 'info_slide'].includes(
        activity.activity_type_id
      ) ||
      questions[activeQuestionIndex]?.question_type === 'info_slide' ||
      questions[activeQuestionIndex]?.question_type === 'slide'
    ) {
      return;
    }
    // When the activity changes and has answers but the current question has none
    // Map the answers from the API to the internal format
    if (
      questions[activeQuestionIndex] &&
      (!questions[activeQuestionIndex].options ||
        questions[activeQuestionIndex].options.length === 0)
    ) {
      // Get the options from the activity
      const options = extractOptionsFromActivity(activity);

      // Pass each option to the onOptionChange handler
      options.forEach((option: QuizOption, optionIndex: number) => {
        onOptionChange(
          activeQuestionIndex,
          optionIndex,
          'option_text',
          option.option_text
        );
        onOptionChange(
          activeQuestionIndex,
          optionIndex,
          'is_correct',
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
  }, [
    activity,
    activeQuestionIndex,
    questions,
    onOptionChange,
    onCorrectAnswerChange,
  ]);

  // Fix the mapQuestionTypeToActivityType function to correctly map question types to activity types
  const mapQuestionTypeToActivityType = (
    questionType: string
  ): ActivityType => {
    switch (questionType) {
      case 'multiple_choice':
        return 'QUIZ_BUTTONS';
      case 'multiple_response':
        return 'QUIZ_CHECKBOXES';
      case 'true_false':
        return 'QUIZ_TRUE_OR_FALSE';
      case 'text_answer':
        return 'QUIZ_TYPE_ANSWER';
      case 'reorder':
        return 'QUIZ_REORDER';
      // Location doesn't have a specific activity type, so we'll use INFO_SLIDE as a fallback
      case 'location':
        return 'INFO_SLIDE';
      case 'slide':
        return 'INFO_SLIDE';
      case 'info_slide':
        return 'INFO_SLIDE';
      case 'matching_pair':
        return 'QUIZ_MATCHING_PAIRS';
      default:
        return 'INFO_SLIDE';
    }
  };

  // Replace the entire handleAddQuestion function with this enhanced version
  const handleAddQuestion = async (questionData?: QuizQuestion) => {
    try {
      setIsSaving(true);

      // Get the collection ID from current activity if available
      if (!activity?.collection_id) {
        console.error(
          'Cannot add activity: collection information not available.'
        );
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
            {
              id: `opt_1_${Date.now()}`,
              quiz_question_id: '',
              option_text: 'Option A',
              is_correct: true,
              display_order: 0,
            },
            {
              id: `opt_2_${Date.now()}`,
              quiz_question_id: '',
              option_text: 'Option B',
              is_correct: false,
              display_order: 1,
            },
          ],
          time_limit_seconds: 30,
          points: 1,
          correct_answer_text: '',
        };
      }

      // Generate a temporary activity ID
      const tempActivityId = `temp_${Date.now()}`;

      // Create the new activity object to add to local state
      const newActivity = {
        id: tempActivityId,
        title: questionData.question_text,
        collection_id: activity.collection_id,
        description: questionData.slide_content || '',
        is_published: false,
        activity_type_id: mapQuestionTypeToActivityType(
          questionData.question_type
        ),
        backgroundColor: '#FFFFFF',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: '',
      };

      // Update the question with the temporary activity ID
      const newQuestion = {
        ...questionData,
        activity_id: tempActivityId,
      };

      // If the parent component provides onAddQuestion, call it to update state
      if (typeof onAddQuestion === 'function') {
        onAddQuestion(newQuestion);
      }

      // Force a UI refresh by updating renderKey
      setRenderKey((prevKey) => prevKey + 1);

      // Initialize the background color for this activity in global storage
      if (typeof window !== 'undefined') {
        // Ensure the object is initialized
        if (!window.savedBackgroundColors) {
          window.savedBackgroundColors = {};
        }
        window.savedBackgroundColors[tempActivityId] = '#FFFFFF';

        // Update the activity backgrounds map
        updateActivityBackground(tempActivityId, {
          backgroundColor: '#FFFFFF',
          backgroundImage: '',
        });
      }

      console.log('New question added successfully');
    } catch (error) {
      console.error('Error adding question:', error);
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

      // Save the current scroll position
      const scrollContainer = scrollContainerRef.current;
      const currentScrollPosition = scrollContainer
        ? scrollContainer.scrollTop
        : 0;

      // Check if this is a collectionId rather than an activityId
      const isCollectionId = activityToDelete.includes('-');

      // If we have a collectionId format but need activityId, try to find the corresponding activity
      let activityId = activityToDelete;
      if (isCollectionId && activity && activity.id !== activityToDelete) {
        console.log(
          'Detected a collectionId instead of an activityId, finding proper activity ID'
        );
        // In this case, we'll use the activity.id which should be the correct activityId
        activityId = activity.id;
      }

      console.log(`Deleting activity with ID: ${activityId}`);

      // Find the index of the question with this activity_id before we delete it
      const questionIndex = questions.findIndex(
        (q) => q.activity_id === activityId
      );
      if (questionIndex === -1) {
        console.warn(
          `Could not find question with activity_id ${activityId} in local state`
        );
      }

      // Temporarily disable scrolling to prevent jumps
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'hidden';
      }

      // Call the API to delete the activity
      await activitiesApi.deleteActivity(activityId);

      // Call the parent's delete handler to update state without refreshing
      if (onDeleteActivity) {
        onDeleteActivity(activityId);
      }

      // Update local state
      setActivityBackgrounds((prev) => {
        const updated = { ...prev };
        delete updated[activityId];
        return updated;
      });

      // Set active question index if needed without scroll behavior
      if (questionIndex === activeQuestionIndex && questions.length > 1) {
        const newIndex = questionIndex > 0 ? questionIndex - 1 : 0;
        onChangeQuestion(newIndex);
      }

      // Make sure the DOM updates by forcing a re-render
      setRenderKey((prev) => prev + 1);

      // Restore scroll position immediately and again after render
      if (scrollContainer) {
        scrollContainer.scrollTop = currentScrollPosition;

        setTimeout(() => {
          if (scrollContainer) {
            scrollContainer.scrollTop = currentScrollPosition;

            // Re-enable scrolling
            if (typeof document !== 'undefined') {
              document.body.style.overflow = '';
            }
          }
        }, 50);
      }

      // Show success notification

      console.log('Activity deleted successfully');
    } catch (error) {
      console.error('Error deleting activity:', error);

      // Re-enable scrolling in case of error
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    } finally {
      setIsSaving(false);
      // Close the dialog after completion
      setIsDeleteDialogOpen(false);
    }
  };

  // Add a function to scroll to the newest question
  const scrollToNewestQuestion = useCallback(() => {
    if (questions.length > 0 && scrollContainerRef.current) {
      const container = scrollContainerRef.current;

      // Use smooth scrolling to bottom without jumping
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth', // Use smooth scrolling instead of instant jump
      });

      // Remove the highlight effect
      // We don't need any highlight or additional effects
    }
  }, [questions.length]);

  // Expose the function to window so it can be called from outside
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollToNewestQuestion = scrollToNewestQuestion;
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.scrollToNewestQuestion;
      }
    };
  }, [scrollToNewestQuestion]);

  // Sử dụng handleSlideImageChange từ use-slide-operations.ts
  // Thêm hàm mới để cập nhật background cho slide
  const updateSlideBackground = async (
    activityId: string,
    properties: {
      backgroundImage?: string;
      backgroundColor?: string;
    }
  ) => {
    if (!activityId) return;

    // Chỉ xử lý cho các slide
    const currentQuestion = questions[activeQuestionIndex];
    if (
      !currentQuestion ||
      !['slide', 'info_slide'].includes(currentQuestion.question_type)
    )
      return;

    console.log('Updating slide background:', activityId, properties);

    // Cập nhật local state slidesBackgrounds
    // setSlidesBackgrounds((prev) => ({
    //   ...prev,
    //   [activityId]: {
    //     backgroundImage:
    //       properties.backgroundImage !== undefined
    //         ? properties.backgroundImage
    //         : prev[activityId]?.backgroundImage || '',
    //     backgroundColor:
    //       properties.backgroundColor !== undefined
    //         ? properties.backgroundColor
    //         : prev[activityId]?.backgroundColor || '#FFFFFF',
    //   },
    // }));

    try {
      // Cập nhật trong activityBackgrounds để đảm bảo đồng bộ
      updateActivityBackground(activityId, properties);

      // Xử lý cập nhật background theo yêu cầu
      if (properties.backgroundColor !== undefined) {
        // Nếu cập nhật backgroundColor, đặt backgroundImage là rỗng
        await activitiesApi.updateActivity(activityId, {
          backgroundColor: properties.backgroundColor,
          backgroundImage: '',
        });
      } else if (properties.backgroundImage !== undefined) {
        // Nếu cập nhật backgroundImage, đặt backgroundColor là rỗng
        if (onSlideImageChange) {
          onSlideImageChange(properties.backgroundImage, activeQuestionIndex);
        }

        await activitiesApi.updateActivity(activityId, {
          backgroundColor: '',
          backgroundImage: properties.backgroundImage,
        });
      }

      // Force re-render bằng cách cập nhật renderKey
      setRenderKey((prev) => prev + 1);
    } catch (error) {
      console.error('Error updating slide background:', error);
    }
  };

  // Add debounced version for location updates
  const debouncedUpdateLocationQuiz = React.useCallback(
    debounce(
      async (
        activityId: string,
        locationPayload: import('@/api-client/activities-api').LocationQuizPayload
      ) => {
        try {
          setIsSaving(true);
          const response = await activitiesApi.updateLocationQuiz(
            activityId,
            locationPayload
          );
          console.log('Location quiz updated successfully:', response);

          // **ENHANCED**: Properly extract and format location data from response
          if (response.data?.quiz?.quizLocationAnswers) {
            const updatedLocationAnswers =
              response.data.quiz.quizLocationAnswers;

            // Update the question's location data directly to ensure UI reflects new points
            const questionIndex = questions.findIndex(
              (q) => q.activity_id === activityId
            );
            if (questionIndex >= 0 && onQuestionLocationChange) {
              // Format location data to match expected structure
              const formattedLocationData = {
                quizLocationAnswers: updatedLocationAnswers.map(
                  (answer: any) => ({
                    quizLocationAnswerId: answer.quizLocationAnswerId || '',
                    longitude: answer.longitude,
                    latitude: answer.latitude,
                    radius: answer.radius,
                  })
                ),
              };

              // Update parent state
              onQuestionLocationChange(questionIndex, formattedLocationData);
            }

            // Dispatch multiple events to ensure all components update
            if (typeof window !== 'undefined') {
              // Event for keeping UI position updated
              const keepUIEvent = new CustomEvent('location:keep:ui:position', {
                detail: {
                  locationAnswers: updatedLocationAnswers,
                  timestamp: Date.now(),
                  source: 'preview-debounced-success',
                },
              });
              window.dispatchEvent(keepUIEvent);

              // Additional event specifically for new points added
              const pointsUpdatedEvent = new CustomEvent(
                'location:points:updated',
                {
                  detail: {
                    activityId,
                    locationAnswers: updatedLocationAnswers,
                    timestamp: Date.now(),
                  },
                }
              );
              window.dispatchEvent(pointsUpdatedEvent);

              // Force editor to refresh markers
              const refreshMarkersEvent = new CustomEvent(
                'location:refresh:markers',
                {
                  detail: {
                    activityId,
                    locationAnswers: updatedLocationAnswers,
                  },
                }
              );
              window.dispatchEvent(refreshMarkersEvent);
            }
          }

          // Show success toast
        } catch (error) {
          console.error('Error updating location quiz:', error);

          // On error, revert to original position
          if (typeof window !== 'undefined') {
            const revertEvent = new CustomEvent('location:revert:position', {
              detail: {
                error: true,
                timestamp: Date.now(),
              },
            });
            window.dispatchEvent(revertEvent);
          }
        } finally {
          setIsSaving(false);
        }
      },
      1000
    ), // 1 second debounce
    [toast, questions, onQuestionLocationChange]
  );

  // Add or update the handleQuestionLocationChange function:

  const handleQuestionLocationChange = (
    questionIndex: number,
    locationData: any
  ) => {
    console.log('Handling location change:', questionIndex, locationData);

    const question = questions[questionIndex];

    if (onQuestionLocationChange) {
      onQuestionLocationChange(questionIndex, locationData);
    }

    try {
      setIsSaving(true);
      let locationAnswers;

      if (Array.isArray(locationData)) {
        console.log('Detected array format for location data');
        locationAnswers = locationData.map((loc: LocationAnswer) => ({
          longitude: loc.longitude || loc.lng,
          latitude: loc.latitude || loc.lat,
          radius: loc.radius || 10,
        }));
      } else if (locationData && locationData.quizLocationAnswers) {
        console.log('Detected object with quizLocationAnswers property');
        locationAnswers = locationData.quizLocationAnswers.map(
          (loc: LocationAnswer) => ({
            longitude: loc.longitude || loc.lng,
            latitude: loc.latitude || loc.lat,
            radius: loc.radius || 10,
          })
        );
      } else if (locationData && (locationData.longitude || locationData.lat)) {
        console.log('Detected legacy format with direct coordinates');
        locationAnswers = [
          {
            longitude: locationData.longitude || locationData.lng,
            latitude: locationData.latitude || locationData.lat,
            radius: locationData.radius || 10,
          },
        ];
      } else {
        console.log('Using existing location data from question');
        const existingData = getLocationAnswers(question, activity);
        locationAnswers = existingData.map((loc: LocationAnswer) => ({
          longitude: loc.longitude,
          latitude: loc.latitude,
          radius: loc.radius || 10,
        }));
      }

      if (!locationAnswers || locationAnswers.length === 0) {
        throw new Error('No valid location answers found');
      }

      console.log('Calling API with location answers:', locationAnswers);

      const locationPayload = {
        type: 'LOCATION' as const,
        questionText: question.question_text || 'Location Question',
        timeLimitSeconds: question.time_limit_seconds || timeLimit || 60,
        pointType: 'STANDARD' as const,
        locationAnswers: locationAnswers,
      };

      debouncedUpdateLocationQuiz(question.activity_id, locationPayload);
    } catch (error) {
      console.error('Error preparing location update:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Add this useEffect to listen for title updates from other components
  useEffect(() => {
    // Handler for title updates from other components
    const handleTitleUpdate = (event: any) => {
      if (
        (event.detail && event.detail.activityId && event.detail.title) ||
        (event.detail.questionText && event.detail.sender !== 'questionPreview')
      ) {
        // Find the question with this activity ID
        const questionIndex = questions.findIndex(
          (q) => q.activity_id === event.detail.activityId
        );

        const newText = event.detail.questionText || event.detail.title;

        if (
          questionIndex >= 0 &&
          questions[questionIndex].question_text !== newText
        ) {
          // Update the question text without calling the API again (since it was already updated)
          onQuestionTextChange(newText, questionIndex);
        }
      }
    };

    // Add the event listener
    if (typeof window !== 'undefined') {
      window.addEventListener('activity:title:updated', handleTitleUpdate);
    }

    // Clean up
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('activity:title:updated', handleTitleUpdate);
      }
    };
  }, [questions, onQuestionTextChange]);

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedUpdateLocationQuiz.cancel();
    };
  }, [debouncedUpdateLocationQuiz]);

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all w-full h-full border-none shadow-md',
        isQuestionListCollapsed && 'max-w-full'
      )}
      key={`preview-card-${renderKey}`}
    >
      <CardHeader className="px-4 py-2 flex flex-row items-center justify-between bg-white dark:bg-gray-950 border-b">
        <div className="flex items-center gap-4">
          <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Preview
          </CardTitle>
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
            <Label htmlFor="edit-mode" className="text-xs">
              Edit Mode
            </Label>
          </div>
          {isSaving && (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
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
              key={`question-preview-${question.id}-${questionIndex}-${renderKey}`}
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
                {renderQuestionContent(
                  question,
                  questionIndex,
                  questionIndex === activeQuestionIndex,
                  viewMode,
                  backgroundImage
                )}
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

      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Activity</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this activity? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteActivity}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface OptionItemProps {
  option: QuizOption;
  index: number;
  questionType:
  | 'multiple_choice'
  | 'multiple_response'
  | 'true_false'
  | 'text_answer'
  | 'slide'
  | 'info_slide'
  | 'reorder'
  | 'location';
  questionIndex: number;
  onOptionEdit?: (
    questionIndex: number,
    optionIndex: number,
    text: string
  ) => void;
  onToggleCorrect?: (questionIndex: number, optionIndex: number) => void;
}

function OptionItem({
  option,
  index,
  questionType,
  questionIndex,
  onOptionEdit,
  onToggleCorrect,
}: OptionItemProps) {
  const optionLetter = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'][index];
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(
    option.option_text || `Option ${optionLetter}`
  );

  // Look for the edit-mode checkbox in the DOM to determine if edit mode is enabled
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    // Update the edit mode state based on the checkbox's data-state attribute
    const updateEditModeState = () => {
      const editModeSwitch = document.getElementById('edit-mode');
      setIsEditMode(editModeSwitch?.getAttribute('data-state') === 'checked');
    };

    // Initial check
    updateEditModeState();

    // Set up a mutation observer to track changes to the edit-mode switch
    const observer = new MutationObserver(updateEditModeState);
    const editModeSwitch = document.getElementById('edit-mode');

    if (editModeSwitch) {
      observer.observe(editModeSwitch, { attributes: true });
    }

    return () => observer.disconnect();
  }, []);

  const getOptionStyle = () => {
    // Premium gradient combinations
    const styles = [
      {
        bg: 'bg-gradient-to-r from-pink-600 via-rose-500 to-rose-700',
        border: 'border-pink-200 dark:border-pink-900',
        shadow: 'shadow-pink-200/40 dark:shadow-pink-900/20',
      },
      {
        bg: 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-700',
        border: 'border-blue-200 dark:border-blue-900',
        shadow: 'shadow-blue-200/40 dark:shadow-blue-900/20',
      },
      {
        bg: 'bg-gradient-to-r from-green-600 via-emerald-500 to-emerald-700',
        border: 'border-green-200 dark:border-green-900',
        shadow: 'shadow-green-200/40 dark:shadow-green-900/20',
      },
      {
        bg: 'bg-gradient-to-r from-amber-600 via-orange-500 to-orange-700',
        border: 'border-amber-200 dark:border-amber-900',
        shadow: 'shadow-amber-200/40 dark:shadow-amber-900/20',
      },
      {
        bg: 'bg-gradient-to-r from-purple-600 via-violet-500 to-violet-700',
        border: 'border-purple-200 dark:border-purple-900',
        shadow: 'shadow-purple-200/40 dark:shadow-purple-900/20',
      },
      {
        bg: 'bg-gradient-to-r from-cyan-600 via-sky-500 to-sky-700',
        border: 'border-cyan-200 dark:border-cyan-900',
        shadow: 'shadow-cyan-200/40 dark:shadow-cyan-900/20',
      },
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
    // Only allow toggling correct answer if edit mode is enabled
    if (isEditMode && onToggleCorrect) {
      onToggleCorrect(questionIndex, index);
    }
  };

  // Enhanced multiple choice and multiple response options
  const motionProps = {
    className: cn(
      'group rounded-lg transition-all duration-300 overflow-hidden',
      isEditMode ? 'cursor-pointer hover:scale-[1.02]' : '',
      option.is_correct === true && questionType !== 'reorder' && 'shadow-lg'
    ),
    whileHover: isEditMode ? { scale: 1.02 } : {},
    whileTap: isEditMode ? { scale: 0.98 } : {},
    onClick: handleToggleCorrect,
  };

  return (
    <motion.div {...motionProps}>
      <div
        className={cn(
          'p-4 h-full rounded-lg border-2 flex items-center gap-4 transition-all duration-300 relative',
          'backdrop-blur-lg shadow-xl',
          option.is_correct === true
            ? isEditMode
              ? 'bg-green-100 dark:bg-green-900/60 border-green-500 dark:border-green-500 ring-2 ring-green-400 dark:ring-green-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
              : 'bg-green-50/80 dark:bg-green-950/40 border-green-300 dark:border-green-800/80 hover:border-green-400 dark:hover:border-green-700'
            : 'bg-white/90 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
          optionStyle.shadow
        )}
      >
        {/* Decorative light effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(255,255,255,0.1),transparent_70%)] opacity-50"></div>

        <div
          className={cn(
            'relative z-10 w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 text-white font-medium shadow-lg border border-white/30',
            option.is_correct === true && isEditMode
              ? 'bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 scale-110 transition-transform'
              : optionStyle.bg
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
              <span
                className={cn(
                  'text-base',
                  option.is_correct === true && isEditMode
                    ? 'text-green-800 dark:text-green-300 font-medium'
                    : 'text-gray-800 dark:text-gray-100'
                )}
              >
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

          {option.is_correct === true && (
            <div
              className={cn(
                'flex-shrink-0 text-white rounded-full p-1.5 shadow-lg border border-white/30',
                isEditMode
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 scale-125 animate-pulse'
                  : 'bg-gradient-to-r from-green-500 via-emerald-400 to-emerald-600'
              )}
            >
              <CheckCircle className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Add these helper functions after the renderQuestionContent function:

// Helper function to get location answers from question or activity
function getLocationAnswers(question: any, activity: any) {
  // First try to get from the activity quiz structure
  if (activity?.quiz?.quizLocationAnswers?.length > 0) {
    return activity.quiz.quizLocationAnswers.map((answer: any) => ({
      quizLocationAnswerId: answer.quizLocationAnswerId,
      longitude: answer.longitude,
      latitude: answer.latitude,
      radius: answer.radius,
    }));
  }

  // Then try to get from the question location_data if it has quizLocationAnswers
  if (question.location_data?.quizLocationAnswers?.length > 0) {
    return question.location_data.quizLocationAnswers.map((answer: any) => ({
      quizLocationAnswerId: answer.quizLocationAnswerId || '',
      longitude: answer.longitude,
      latitude: answer.latitude,
      radius: answer.radius,
    }));
  }

  // For backward compatibility, handle the old location_answer format
  if (question.location_answer) {
    const locationData = question.location_answer;

    return [
      {
        longitude: locationData.lng,
        latitude: locationData.lat,
        radius: locationData.radius || 10,
      },
    ];
  }

  // For even older format with location_data
  if (question.location_data) {
    return [
      {
        longitude: question.location_data.lng || 0,
        latitude: question.location_data.lat || 0,
        radius: question.location_data.radius || 10,
      },
    ];
  }

  // Default single location if nothing is found
  return [
    {
      quizLocationAnswerId: '',
      longitude: 105.804817,
      latitude: 21.028511,
      radius: 10,
    },
  ];
}

// Helper function to get location data for the map component
// This now supports multiple locations
function getLocationData(question: any, activity: any) {
  const locationAnswers = getLocationAnswers(question, activity);

  // Return all location answers for the map to display
  return locationAnswers.map((answer: LocationAnswer) => ({
    lat: answer.latitude,
    lng: answer.longitude,
    radius: answer.radius,
    id: answer.quizLocationAnswerId,
  }));
}

// Helper function to get the first location for preview display
function getFirstLocationData(question: any, activity: any) {
  const locationAnswers = getLocationAnswers(question, activity);

  if (locationAnswers.length > 0) {
    const firstAnswer = locationAnswers[0];
    return {
      lat: firstAnswer.latitude,
      lng: firstAnswer.longitude,
      radius: firstAnswer.radius,
    };
  }

  // Default location
  return { lat: 21.028511, lng: 105.804817, radius: 10 };
}
