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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { QuizQuestion, Activity } from '../types';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import axios from 'axios';

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
}

// Sortable Activity Item
const SortableActivityItem = ({
  activity,
  index,
  isActive,
}: {
  activity: Activity;
  index: number;
  isActive: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: activity.id });

  // console.log('DND activity: ', activity);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'flex-shrink-0 h-8 px-2 flex items-center gap-1 rounded-md cursor-pointer transition-all border',
        isActive
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
      )}
    >
      <div className="flex items-center">
        <div
          className={cn(
            'w-4 h-4 rounded-full flex items-center justify-center mr-1 flex-shrink-0 text-[10px] font-medium',
            isActive
              ? 'bg-white text-primary'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          )}
        >
          {index + 1}
        </div>
        <span className="text-[10px] whitespace-nowrap max-w-[120px] truncate">
          {activity.title || `Activity ${index + 1}`}
        </span>
      </div>
      <div className="cursor-grab opacity-50 hover:opacity-100">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
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
}: QuestionListProps) {
  const [expandedView, setExpandedView] = useState(false);
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const isCollapsed =
    externalIsCollapsed !== undefined
      ? externalIsCollapsed
      : internalIsCollapsed;
  const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null);
  const [hoveredActivity, setHoveredActivity] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [renderKey, setRenderKey] = useState(0);
  
  // Scroll to the end of the activities list when a new activity is added
  React.useEffect(() => {
    if (scrollContainerRef.current && activities.length > 0) {
      // Scroll to the end when activities length changes
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
    }
  }, [activities.length]);

  // Setup sensors for dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor),
    //useSensor(sortableKeyboardCoordinates)
  );

  // Handle add question with scrolling to new question
  const handleAddQuestion = () => {
    // Call the parent component's add question function
    onAddQuestion();

    // Scroll to the end after a short delay to ensure the new question is rendered
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      }
    }, 100);
  };

  // Handle drag end for activities
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = activities.findIndex(
        (activity) => activity.id === active.id
      );
      const newIndex = activities.findIndex(
        (activity) => activity.id === over?.id
      );

      // Reorder activities locally
      const newActivities = [...activities];
      const [reorderedActivity] = newActivities.splice(oldIndex, 1);
      newActivities.splice(newIndex, 0, reorderedActivity);

      // Update the order
      const orderedActivityIds = newActivities.map(
        (activity) => activity.id
      );
      if (onReorderActivities && collectionId) {
        try {
          // Call API to update the order
          await axios.put(`/collections/${collectionId}/activities/reorder`, {
            orderedActivityIds,
          });
          onReorderActivities(orderedActivityIds);
        } catch (error) {
          console.error('Error reordering activities:', error);
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

  // Handle question click
  const handleQuestionClick = (index: number) => {
    window.lastQuestionClick = Date.now();
    onQuestionSelect(index);
  };

  // Question type icons
  const questionTypeIcons = {
    multiple_choice: <CheckCircle className="h-3.5 w-3.5" />,
    multiple_response: <CheckSquare className="h-3.5 w-3.5" />,
    true_false: <XCircle className="h-3.5 w-3.5" />,
    text_answer: <AlignLeft className="h-3.5 w-3.5" />,
    slide: <FileText className="h-3.5 w-3.5" />,
    info_slide: <FileText className="h-3.5 w-3.5" />,
    reorder: <MoveVertical className="h-3.5 w-3.5" />,
    location: <MapPin className="h-3.5 w-3.5" />,
  };

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
    if (typeof window !== 'undefined' && window.savedBackgroundColors && window.savedBackgroundColors[activityId]) {
      return window.savedBackgroundColors[activityId];
    }

    // Nếu không tìm thấy, lấy từ danh sách activities
    const activityBgColor = activities.find(a => a.id === activityId)?.backgroundColor;
    if (activityBgColor) {
      return activityBgColor;
    }

    // Màu mặc định
    return '#FFFFFF';
  };

  // Thêm sự kiện listener để cập nhật UI khi có thay đổi màu nền
  useEffect(() => {
    const handleBackgroundUpdate = (event: any) => {
      if (event.detail && event.detail.activityId && event.detail.properties && event.detail.properties.backgroundColor) {
        // Khi có sự kiện cập nhật màu, force re-render component
        setRenderKey(prev => prev + 1);
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
  }, []);

  return (
    <Card
      className={cn(
        'overflow-hidden border-none shadow-md transition-all duration-300 w-full h-full',
        isCollapsed ? 'max-h-20' : ''
      )}
    >
      <CardHeader
        className={cn(
          'p-1 bg-gray-100 dark:bg-black text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800',
          isCollapsed && 'p-0.5'
        )}
      >
        <div className="flex justify-between items-center h-6">
          {!isCollapsed ? (
            <>
              <div className="bg-white dark:bg-black px-1.5 py-0.5 rounded-md shadow-sm border border-gray-200 dark:border-gray-900">
                <span className="font-medium text-[10px] text-gray-900 dark:text-white">
                  Q ({questions.length})
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className="bg-white dark:bg-black rounded-md shadow-sm border border-gray-200 dark:border-gray-900 p-0.5 flex">
                  <Button
                    variant={expandedView ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'h-5 w-5 p-0 flex items-center justify-center',
                      expandedView
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-transparent text-gray-700 dark:text-gray-300'
                    )}
                    onClick={() => setExpandedView(true)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                  </Button>
                  <Button
                    variant={!expandedView ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'h-5 w-5 p-0 flex items-center justify-center',
                      !expandedView
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-transparent text-gray-700 dark:text-gray-300'
                    )}
                    onClick={() => setExpandedView(false)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCollapseToggle(true)}
                  className="h-5 w-5 p-0 rounded-md bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-900"
                  title="Collapse sidebar"
                >
                  <ChevronLeft className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                </Button>
              </div>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleCollapseToggle(false)}
              className="h-5 w-5 p-0 mx-auto rounded-md bg-white dark:bg-black hover:bg-gray-100 dark:hover:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-900"
              title="Expand sidebar"
            >
              <ChevronRight className="h-3 w-3 text-gray-700 dark:text-gray-300" />
            </Button>
          )}
        </div>
      </CardHeader>
      {!isCollapsed ? (
        <CardContent
          className="p-2 overflow-hidden bg-white dark:bg-black"
          style={{ height: 'calc(100% - 30px)' }}
        >
          {expandedView ? (
            <div
              ref={scrollContainerRef}
              className="flex flex-row gap-3 flex-nowrap overflow-x-auto overflow-y-hidden py-1 pb-2 h-full cursor-grab"
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
              {questions.map((question, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex-shrink-0 cursor-pointer transition-all hover:shadow-md',
                    'w-[120px] h-[80px] rounded-md overflow-hidden shadow-sm border',
                    index === activeQuestionIndex
                      ? 'border-primary ring-1 ring-primary scale-[1.02]'
                      : 'border-transparent hover:border-gray-300'
                  )}
                  onClick={() => handleQuestionClick(index)}
                >
                  <div className="relative h-full">
                    <div className="absolute top-1 left-1 bg-black/40 text-white text-[8px] px-1 py-0.5 rounded-full z-10">
                      {index + 1}
                    </div>
                    <div className="absolute top-1 right-1 bg-white/90 dark:bg-gray-800/90 text-[8px] px-1 py-0.5 rounded-sm z-10 flex items-center shadow-sm">
                      {
                        questionTypeIcons[
                        question.question_type as keyof typeof questionTypeIcons
                        ]
                      }
                      <span className="ml-0.5 capitalize">
                        {question.question_type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div
                      className="w-full h-full flex flex-col"
                      style={{
                        backgroundImage: activities.find(
                          (a) => a.id === question.activity_id
                        )?.backgroundImage
                          ? `url(${activities.find(
                            (a) => a.id === question.activity_id
                          )?.backgroundImage
                          })`
                          : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: getActivityBackgroundColor(question.activity_id),
                      }}
                    >
                      <div className="p-2 h-full bg-black/20">
                        <h3 className="text-[10px] font-medium line-clamp-2 mb-1 text-white drop-shadow-sm">
                          {question.question_text || `Question ${index + 1}`}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div
                className="flex-shrink-0 cursor-pointer transition-all w-[120px] h-[80.px] rounded-md overflow-hidden shadow-sm border border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary flex flex-col items-center justify-center"
                onClick={handleAddQuestion}
              >
                <Plus className="h-5 w-5 text-gray-400 dark:text-gray-500 mb-1" />
                <p className="text-xs font-medium">Add Question</p>
              </div>
            </div>
          ) : (
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
                  className="flex overflow-x-auto overflow-y-hidden gap-2 py-1 pl-0 pr-2 flex-nowrap h-full cursor-grab"
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
                    />
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddQuestion}
                    className="flex-shrink-0 h-8 rounded-md px-2 text-xs"
                    ref={addButtonRef}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    <span>Add</span>
                  </Button>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      ) : (
        <div
          ref={scrollContainerRef}
          className="p-1 overflow-x-auto flex items-center h-12 bg-white dark:bg-black cursor-grab"
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
          <div className="flex items-center gap-1 flex-nowrap overflow-x-auto">
            {questions.map((question, index) => (
              <div
                key={index}
                className={cn(
                  'h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] cursor-pointer transition-all duration-200 relative border',
                  index === activeQuestionIndex
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 border-transparent'
                )}
                onClick={() => handleQuestionClick(index)}
                onMouseEnter={() => setHoveredQuestion(index)}
                onMouseLeave={() => setHoveredQuestion(null)}
              >
                {index + 1}
                {hoveredQuestion === index && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 shadow-md rounded-md p-2 text-xs z-50 w-48">
                    <div className="max-w-full overflow-hidden">
                      <p className="font-medium truncate">
                        {question.question_text || `Question ${index + 1}`}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {question.question_type.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-800"></div>
                  </div>
                )}
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-[6px] border border-gray-200 dark:border-gray-600">
                  {
                    questionTypeIcons[
                    question.question_type as keyof typeof questionTypeIcons
                    ]
                  }
                </div>
              </div>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg flex-shrink-0"
              onClick={handleAddQuestion}
              title="Add new question"
              ref={addButtonRef}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
