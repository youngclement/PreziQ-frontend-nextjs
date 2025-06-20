'use client';

// Thêm định nghĩa window.savedBackgroundColors
declare global {
  interface Window {
    lastQuestionClick?: number;
    savedBackgroundColors?: Record<string, string>;
  }
}

import React, { useCallback, useState, useRef, useEffect } from 'react';
import {
  Plus,
  Trash,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MoveVertical,
  FileText,
  AlignLeft,
  XCircle,
  CheckSquare,
  CheckCircle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { QuizQuestion, Activity } from '../types';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  KeyboardSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';
import { activitiesApi } from '@/api-client/activities-api';
import { ActivityType } from '@/api-client/activities-api';
import { LoadingIndicator } from '@/components/common/loading-indicator';

// Interface for props
interface QuestionListProps {
  questions: QuizQuestion[];
  activeQuestionIndex: number;
  onQuestionSelect: (index: number) => void;
  onAddQuestion: (newQuestion?: QuizQuestion) => void;
  onDeleteQuestion: (index: number) => void;
  isCollapsed?: boolean;
  onCollapseToggle?: (collapsed: boolean) => void;
  onReorderQuestions?: (newOrder: string[]) => void;
  collectionId?: string;
  activities?: Activity[];
  onReorderActivities?: (newOrder: string[]) => void;
  onAddLocationQuestion?: (pointType?: string) => void;
  slidesBackgrounds: Record<
    string,
    { backgroundImage: string; backgroundColor: string }
  >;
}

// Sortable Activity Item
const SortableActivityItem = ({
  activity,
  index,
  isActive,
  onSelect,
  questions, // Add this prop
}: {
  activity: Activity;
  index: number;
  isActive: boolean;
  onSelect: () => void;
  questions: QuizQuestion[]; // Add this prop type
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Get background color for activity
  const getBackgroundColor = () => {
    // Use savedBackgroundColors from window if available
    if (
      typeof window !== 'undefined' &&
      window.savedBackgroundColors &&
      window.savedBackgroundColors[activity.id]
    ) {
      return window.savedBackgroundColors[activity.id];
    }

    return activity.backgroundColor || '#FFFFFF';
  };

  // Tách riêng sự kiện click để chọn activity và sự kiện kéo thả
  const handleActivityClick = (e: React.MouseEvent) => {
    // Nếu đang thực hiện kéo thả, không trigger click
    if (
      e.target === e.currentTarget ||
      !(e.target as HTMLElement).classList.contains('grip-handle')
    ) {
      onSelect();
    }
  };

  // Find the associated question to get the most up-to-date text
  const associatedQuestion = questions.find(
    (q) => q.activity_id === activity.id
  );

  const displayTitle =
    associatedQuestion?.question_text ||
    ``;

  const getBackgroundStyle = () => {
    const style: React.CSSProperties = {};

    if (activity.activity_type_id === 'INFO_SLIDE') {
      // Chỉ áp dụng logic ưu tiên cho INFO_SLIDE
      if (activity.backgroundImage) {
        // Nếu có background image, ưu tiên hiển thị nó
        style.backgroundImage = `url(${activity.backgroundImage})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      } else {
        // Nếu không có background image, sử dụng background color
        style.backgroundColor = getBackgroundColor();
      }
    } else {
      // Các activity type khác giữ nguyên logic cũ
      style.backgroundColor = getBackgroundColor();
      if (activity.backgroundImage) {
        style.backgroundImage = `url(${activity.backgroundImage})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
      }
    }

    return style;
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        ...getBackgroundStyle(),
      }}
      onClick={handleActivityClick}
      className={cn(
        'flex-shrink-0 cursor-pointer transition-all hover:shadow-md',
        'w-[100px] h-[70px] rounded-md overflow-hidden shadow-sm border relative',
        isActive
          ? 'border-primary ring-1 ring-primary scale-[1.02]'
          : 'border-transparent hover:border-gray-300'
      )}
    >
      <div className="absolute top-1 left-1 bg-black/40 text-white text-[8px] px-1 py-0.5 rounded-full z-10">
        {index + 1}
      </div>
      <div
        className="absolute top-1 right-1 cursor-grab opacity-70 hover:opacity-100 grip-handle"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3 w-3 text-white drop-shadow-md grip-handle" />
      </div>

      <div className="p-2 h-full bg-black/30 flex flex-col justify-end">
        <h3 className="text-[9px] font-medium line-clamp-2 text-white drop-shadow-sm">
          {activity.activity_type_id === 'INFO_SLIDE'
            ? 'Slide ' + (index + 1)
            : displayTitle}
        </h3>
      </div>
    </div>
  );
};

export function QuestionList({
  questions,
  activeQuestionIndex,
  onQuestionSelect,
  onAddQuestion,
  onDeleteQuestion,
  isCollapsed: externalIsCollapsed,
  onCollapseToggle,
  onReorderQuestions,
  collectionId,
  activities = [],
  onReorderActivities,
  onAddLocationQuestion,
}: QuestionListProps) {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const isCollapsed =
    externalIsCollapsed !== undefined
      ? externalIsCollapsed
      : internalIsCollapsed;
  const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullyCollapsed, setIsFullyCollapsed] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLDivElement>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to the end of the activities list when a new activity is added
  React.useEffect(() => {
    if (scrollContainerRef.current && activities.length > 0) {
      // Scroll to the end when activities length changes
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth;
    }
  }, [activities.length]);

  // Setup sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Map question type to activity type for API calls
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
      case 'slide':
      case 'info_slide':
        return 'INFO_SLIDE';
      case 'location':
        return 'QUIZ_LOCATION';
      default:
        return 'QUIZ_BUTTONS';
    }
  };

  // Handle add question with scrolling to new question
  const handleAddQuestion = async () => {
    try {
      setIsLoading(true);
      if (!collectionId) {
        return;
      }

      // Step 1: Create activity with the appropriate type
      const activityPayload = {
        collectionId: collectionId,
        activityType: 'QUIZ_BUTTONS' as ActivityType,
        title: 'New Question',
        description: 'This is a new question',
        isPublished: true,
        backgroundColor: '#FFFFFF',
      };

      // Create the activity first
      const activityResponse = await activitiesApi.createActivity(
        activityPayload
      );

      // Make sure we have a valid response with an activity ID
      if (!activityResponse.data?.data?.activityId) {
        throw new Error('No activity ID returned from server');
      }

      const newActivityId = activityResponse.data.data.activityId;

      // Step 2: Initialize the quiz data (multiple choice)
      const quizPayload = {
        type: 'CHOICE' as const,
        questionText: 'Default question',
        timeLimitSeconds: 30,
        pointType: 'STANDARD' as const,
        answers: [
          { answerText: 'Option 1', isCorrect: true, explanation: 'Correct' },
          {
            answerText: 'Option 2',
            isCorrect: false,
            explanation: 'Incorrect',
          },
          {
            answerText: 'Option 3',
            isCorrect: false,
            explanation: 'Incorrect',
          },
          {
            answerText: 'Option 4',
            isCorrect: false,
            explanation: 'Incorrect',
          },
        ],
      };

      await activitiesApi.updateButtonsQuiz(newActivityId, quizPayload);

      // Step 3: Create question data for the local state
      const questionData = {
        id: newActivityId,
        activity_id: newActivityId,
        question_text: 'Default question',
        question_type: 'multiple_choice' as 'multiple_choice',
        options: [
          { option_text: 'Option 1', is_correct: true, display_order: 0 },
          { option_text: 'Option 2', is_correct: false, display_order: 1 },
          { option_text: 'Option 3', is_correct: false, display_order: 2 },
          { option_text: 'Option 4', is_correct: false, display_order: 3 },
        ],
        time_limit_seconds: 30,
        points: 1,
        correct_answer_text: '',
      };

      // Step 4: Update local state via the callback
      if (typeof onAddQuestion === 'function') {
        onAddQuestion(questionData);
      }

      // Initialize the background color in global storage
      if (typeof window !== 'undefined') {
        if (!window.savedBackgroundColors) {
          window.savedBackgroundColors = {};
        }
        window.savedBackgroundColors[newActivityId] = '#FFFFFF';
      }

      // Scroll to the end after a short delay to ensure the new question is rendered
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft =
            scrollContainerRef.current.scrollWidth;
        }
      }, 100);
    } catch (error) {
      console.error('Error adding question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a specialized function for adding location quizzes
  const handleAddLocationQuestion = async () => {
    try {
      setIsLoading(true);
      if (!collectionId) {
        return;
      }

      // Step 1: Create activity with INFO_SLIDE type (since QUIZ_LOCATION is not in ActivityType)
      const activityPayload = {
        collectionId: collectionId,
        activityType: 'INFO_SLIDE' as ActivityType,
        title: 'Where is this location?',
        description: 'Find this location on the map',
        isPublished: true,
        backgroundColor: '#FFFFFF',
      };

      // Create the activity first
      const activityResponse = await activitiesApi.createActivity(
        activityPayload
      );

      // Make sure we have a valid response with an activity ID
      if (!activityResponse.data?.data?.activityId) {
        throw new Error('No activity ID returned from server');
      }

      const newActivityId = activityResponse.data.data.activityId;

      // Step 2: Initialize the location quiz data
      const locationPayload = {
        type: 'LOCATION' as const,
        questionText: 'Where is this location?',
        timeLimitSeconds: 60,
        pointType: 'STANDARD' as const,
        locationAnswers: [
          {
            longitude: 105.8048, // Default to Hanoi
            latitude: 21.0285,
            radius: 20,
          },
        ],
      };

      await activitiesApi.updateLocationQuiz(newActivityId, locationPayload);

      // Step 3: Create question data for the local state
      const locationData = {
        id: newActivityId,
        activity_id: newActivityId,
        question_text: 'Where is this location?',
        question_type: 'location' as 'location',
        options: [],
        time_limit_seconds: 60,
        points: 1,
        correct_answer_text: '',
        location_data: {
          lat: 21.0285,
          lng: 105.8048,
          radius: 20,
          hint: 'Find this location on the map',
          pointType: 'STANDARD',
        },
      };

      // Step 4: Update local state via the callback
      if (
        onAddLocationQuestion &&
        typeof onAddLocationQuestion === 'function'
      ) {
        onAddLocationQuestion('STANDARD');
      } else if (typeof onAddQuestion === 'function') {
        onAddQuestion(locationData);
      }

      // Initialize the background color in global storage
      if (typeof window !== 'undefined') {
        if (!window.savedBackgroundColors) {
          window.savedBackgroundColors = {};
        }
        window.savedBackgroundColors[newActivityId] = '#FFFFFF';
      }

      // Scroll to the end after a short delay
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft =
            scrollContainerRef.current.scrollWidth;
        }
      }, 100);
    } catch (error) {
      console.error('Error adding location question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle drag end for activities
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && over?.id) {
      const oldIndex = activities.findIndex(
        (activity) => activity.id === active.id
      );
      const newIndex = activities.findIndex(
        (activity) => activity.id === over.id
      );

      // Reorder activities locally - cập nhật UI ngay lập tức
      const newActivities = arrayMove([...activities], oldIndex, newIndex);

      // Lấy danh sách ID sau khi sắp xếp
      const orderedActivityIds = newActivities.map((activity) => activity.id);

      // Tạo lại danh sách questions mới theo thứ tự activities mới
      const newQuestions = orderedActivityIds
        .map((activityId) => {
          // Tìm question tương ứng với activity này
          return questions.find((q) => q.activity_id === activityId);
        })
        .filter((q) => q !== undefined) as QuizQuestion[];

      if (onReorderActivities) {
        // Gọi callback để component cha cập nhật UI trước khi API call hoàn thành
        // Truyền danh sách questions đã sắp xếp lại để cập nhật UI
        onReorderActivities(orderedActivityIds);

        // Call API to update the order if collectionId is available
        if (collectionId) {
          try {
            // Gọi API với đầy đủ danh sách ID
            await activitiesApi.reorderActivities(
              collectionId,
              orderedActivityIds
            );
          } catch (error) {
            console.error('Error reordering activities:', error);
          }
        }
      }
    }
  };

  // Handle collapse toggle
  const handleCollapseToggle = (collapsed: boolean) => {
    if (onCollapseToggle) {
      onCollapseToggle(collapsed);
    } else {
      setInternalIsCollapsed(collapsed);
    }
  };

  // Thêm hàm xử lý khi đóng/mở hoàn toàn
  const handleFullCollapseToggle = (collapsed: boolean) => {
    setIsFullyCollapsed(collapsed);
    // Cũng thông báo cho component cha biết về trạng thái mới
    if (onCollapseToggle) {
      onCollapseToggle(collapsed);
    }
  };

  // Handle question click
  const handleQuestionClick = (index: number) => {
    window.lastQuestionClick = Date.now();
    onQuestionSelect(index);
  };

  // Question type icons
  const questionTypeIcons = {
    slide: <FileText className="h-3.5 w-3.5" />,
    info_slide: <FileText className="h-3.5 w-3.5" />,
  };

  // Filter questions to show only slides
  const slideQuestions = questions.filter(
    (q) => q.question_type === 'slide' || q.question_type === 'info_slide'
  );

  // Mouse events for drag-to-scroll
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scrollContainerRef.current) {
      setIsDragging(true);
      scrollContainerRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft -= e.movementX;
    }
  };

  const handleMouseUp = () => {
    if (scrollContainerRef.current) {
      setIsDragging(false);
      scrollContainerRef.current.style.cursor = 'grab';
    }
  };

  // Thêm hàm để lấy màu nền từ nhiều nguồn
  const getActivityBackgroundColor = (activityId: string) => {
    // Ưu tiên lấy màu từ global storage
    if (
      typeof window !== 'undefined' &&
      window.savedBackgroundColors &&
      window.savedBackgroundColors[activityId]
    ) {
      return window.savedBackgroundColors[activityId];
    }

    // Nếu không tìm thấy, lấy từ danh sách activities
    const activityBgColor = activities.find(
      (a) => a.id === activityId
    )?.backgroundColor;
    if (activityBgColor) {
      return activityBgColor;
    }

    // Màu mặc định
    return '#FFFFFF';
  };

  // Thêm sự kiện listener để cập nhật UI khi có thay đổi màu nền
  useEffect(() => {
    const handleBackgroundUpdate = (event: any) => {
      if (
        event.detail &&
        event.detail.activityId &&
        event.detail.properties &&
        event.detail.properties.backgroundColor
      ) {
        // Khi có sự kiện cập nhật màu, force re-render component
        setRenderKey((prev) => prev + 1);
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
  }, []);

  // Thêm hàm để xử lý khi activity được chọn
  const handleActivitySelect = (activityId: string) => {
    // Tìm index của question thuộc activity này
    const questionIndex = questions.findIndex(
      (q) => q.activity_id === activityId
    );
    if (questionIndex !== -1) {
      // Gọi hàm onQuestionSelect với index tìm được
      handleQuestionClick(questionIndex);
    }
  };

  // Thay đổi: Đơn giản hóa handleAddActivity để gọi trực tiếp onAddQuestion
  const handleAddActivity = () => {
    if (typeof onAddQuestion === 'function') {
      onAddQuestion();

      // Cuộn đến cuối danh sách sau khi thêm thành công
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft =
            scrollContainerRef.current.scrollWidth;
        }
      }, 100);
    }
  };

  // Listen for question text updates from QuestionPreview
  useEffect(() => {
    const handleTitleUpdate = (event: any) => {
      if (
        event.detail &&
        event.detail.activityId &&
        event.detail.title || event.detail.questionText &&
        event.detail.sender !== 'questionList'
      ) {
        // Force re-render when question text changes
        setRenderKey((prev) => prev + 1);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('activity:title:updated', handleTitleUpdate);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('activity:title:updated', handleTitleUpdate);
      }
    };
  }, []);

  return (
    <div
      className={cn(
        'w-full transition-all duration-300 ease-in-out relative border-t border-gray-100 dark:border-gray-800',
        isFullyCollapsed
          ? 'h-1 bg-white/95 dark:bg-gray-950/95'
          : 'bg-white dark:bg-gray-950'
      )}
    >
      {/* Nút mũi tên luôn hiển thị ở viền trên của question-list */}
      <Button
        size="sm"
        variant="secondary"
        onClick={() => handleFullCollapseToggle(!isFullyCollapsed)}
        className={cn(
          'absolute left-1/2 -translate-x-1/2 z-50 shadow-md rounded-full flex items-center justify-center hover:scale-110 transition-all duration-300',
          isFullyCollapsed
            ? 'h-10 w-10 -top-5 bg-white dark:bg-black border-2 border-gray-300 dark:border-gray-600'
            : 'h-7 w-7 -top-3.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600'
        )}
        title={isFullyCollapsed ? 'Expand panel' : 'Collapse panel'}
      >
        {isFullyCollapsed ? (
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary dark:text-primary"
          >
            <path
              d="M1 8L9 2L17 8"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg
            width="18"
            height="14"
            viewBox="0 0 18 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-primary dark:text-primary"
          >
            <path
              d="M1 2L9 8L17 2"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </Button>

      <div
        className={cn(
          'flex items-center justify-between px-2 py-1',
          isFullyCollapsed ? 'hidden' : ''
        )}
      >
        <div className="w-5"></div> {/* Placeholder to maintain layout */}
        <h3 className="text-xs font-medium text-gray-500">Module Collection</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleCollapseToggle(!isCollapsed)}
          className="h-5 w-5 p-0 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800"
          title={isCollapsed ? 'Show slides' : 'Hide slides'}
        ></Button>
      </div>

      <div
        className={cn(
          'transition-all duration-300 ease-in-out overflow-hidden',
          isFullyCollapsed ? 'max-h-0 opacity-0' : 'max-h-[120px] opacity-100'
        )}
      >
        {!isFullyCollapsed && (
          <>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={activities.map((activity) => activity.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div
                  ref={scrollContainerRef}
                  className="flex overflow-x-auto overflow-y-hidden gap-2 py-1 flex-nowrap cursor-grab"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <style jsx global>{`
                    div::-webkit-scrollbar {
                      display: none;
                    }
                  `}</style>
                  {activities.map((activity, index) => (
                    <SortableActivityItem
                      key={activity.id}
                      activity={activity}
                      index={index}
                      isActive={
                        questions[activeQuestionIndex]?.activity_id ===
                        activity.id
                      }
                      onSelect={() => handleActivitySelect(activity.id)}
                      questions={questions} // Add this prop
                    />
                  ))}
                  <div className="relative">
                    <div
                      ref={addButtonRef}
                      className="flex-shrink-0 cursor-pointer transition-all w-[100px] h-[70px] rounded-md overflow-hidden shadow-sm border border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary hover:bg-gray-50 dark:hover:bg-gray-800 flex flex-col items-center justify-center gap-1"
                      onClick={handleAddActivity}
                    >
                      {isLoading ? (
                        <LoadingIndicator
                          size="sm"
                          variant="inline"
                          text="Adding..."
                        />
                      ) : (
                        <>
                          <Plus className="h-5 w-5 text-primary" />
                          <p className="text-xs font-medium text-primary">
                            Add Activity
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </SortableContext>
            </DndContext>
          </>
        )}
      </div>
    </div>
  );
}
