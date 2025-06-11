"use client";

import React, { useCallback } from "react";
import { Plus, Trash, GripVertical, Search, CheckCircle, CheckSquare, XCircle, AlignLeft, FileText, ChevronLeft, ChevronRight, MapPin, MoveVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QuizQuestion, Activity } from "../types";
import { cn } from "@/lib/utils";
import { useDrag, useDrop, DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";

// Define item types for drag and drop
const ItemTypes = {
  QUESTION: 'question'
};

// Interface for drag item
interface DragItem {
  index: number;
  id: string;
  type: string;
}

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
}

export function QuestionList({
  questions,
  activeQuestionIndex,
  onQuestionSelect,
  onAddQuestion,
  onDeleteQuestion,
  isCollapsed: externalIsCollapsed,
  onCollapseToggle,
  onReorderQuestions,
  collectionId
}: QuestionListProps) {
  // For a more realistic UI - this would actually filter questions in a real implementation
  const [expandedView, setExpandedView] = React.useState(true);

  // If external control is provided, use it, otherwise use internal state
  const [internalIsCollapsed, setInternalIsCollapsed] = React.useState(false);
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;

  // Thêm state để theo dõi nếu user hover vào question khi collapsed
  const [hoveredQuestion, setHoveredQuestion] = React.useState<number | null>(null);

  // Add state for tracking whether user is dragging
  const [isDragging, setIsDragging] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Function to handle reordering of questions
  const moveQuestion = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      if (!questions || dragIndex === hoverIndex) return;

      // Create a new array with the reordered questions
      const newQuestions = [...questions];
      const draggedQuestion = newQuestions[dragIndex];

      // Remove the dragged question from its original position
      newQuestions.splice(dragIndex, 1);
      // Insert it at the new position
      newQuestions.splice(hoverIndex, 0, draggedQuestion);

      // Get the array of IDs in the new order
      const orderedIds = newQuestions.map(q => q.id);

      // Call the reorder function passed from props
      if (onReorderQuestions && collectionId) {
        onReorderQuestions(orderedIds);
      }
    },
    [questions, onReorderQuestions, collectionId]
  );

  // Mouse events for drag-to-scroll functionality
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

  // Function to handle collapse toggle
  const handleCollapseToggle = (collapsed: boolean) => {
    if (onCollapseToggle) {
      onCollapseToggle(collapsed); // Call external handler if provided
    } else {
      setInternalIsCollapsed(collapsed); // Otherwise use internal state
    }
  };

  // Add handleQuestionClick function to track click timestamp and update selection
  const handleQuestionClick = (index: number) => {
    // Set timestamp for the most recent click
    window.lastQuestionClick = Date.now();

    // Update the active question index
    onQuestionSelect(index);
  };

  // Question type icons
  const questionTypeIcons = {
    "multiple_choice": <CheckCircle className="h-3.5 w-3.5" />,
    "multiple_response": <CheckSquare className="h-3.5 w-3.5" />,
    "true_false": <XCircle className="h-3.5 w-3.5" />,
    "text_answer": <AlignLeft className="h-3.5 w-3.5" />,
    "slide": <FileText className="h-3.5 w-3.5" />,
    "reorder": <MoveVertical className="h-3.5 w-3.5" />,
    "location": <MapPin className="h-3.5 w-3.5" />
  };

  const getQuestionColor = (index: number) => {
    // Create a sequence of colors for questions
    const colors = [
      "from-blue-500/10 to-indigo-500/10",
      "from-purple-500/10 to-pink-500/10",
      "from-green-500/10 to-teal-500/10",
      "from-orange-500/10 to-yellow-500/10",
      "from-red-500/10 to-pink-500/10"
    ];

    return colors[index % colors.length];
  };

  // Draggable Question Item component
  const DraggableQuestionListItem = ({ question, index }: { question: QuizQuestion, index: number }) => {
    const ref = React.useRef<HTMLDivElement>(null);

    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.QUESTION,
      item: { type: ItemTypes.QUESTION, id: question.id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: ItemTypes.QUESTION,
      hover: (item: DragItem, monitor) => {
        if (!ref.current) {
          return;
        }
        const dragIndex = item.index;
        const hoverIndex = index;

        // Don't replace items with themselves
        if (dragIndex === hoverIndex) {
          return;
        }

        // Determine rectangle on screen
        const hoverBoundingRect = ref.current.getBoundingClientRect();

        // Get vertical middle
        const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();

        // Get pixels to the top
        const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

        // Only perform the move when the mouse has crossed half of the items height
        // Dragging downwards
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
          return;
        }

        // Dragging upwards
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
          return;
        }

        // Time to actually perform the action
        moveQuestion(dragIndex, hoverIndex);

        // Note: We're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        item.index = hoverIndex;
      },
    });

    const opacity = isDragging ? 0.4 : 1;
    drag(drop(ref));

    return (
      <div
        ref={ref}
        style={{ opacity }}
        className={cn(
          "flex items-center p-3 hover:bg-muted/50 cursor-pointer transition-all border-l-2 border-transparent",
          index === activeQuestionIndex && "bg-muted/70 border-l-2 border-primary"
        )}
        onClick={() => handleQuestionClick(index)}
      >
        <div className="flex items-center flex-1 min-w-0">
          <div className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center mr-3 flex-shrink-0 text-xs font-medium",
            index === activeQuestionIndex
              ? "bg-primary text-primary-foreground"
              : "bg-muted-foreground/10 text-muted-foreground"
          )}>
            {index + 1}
          </div>
          <div className="truncate">
            <p className="text-sm font-medium truncate">
              {question.question_text || `Question ${index + 1}`}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {question.options.length} options • {question.question_type.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 pl-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
              index === activeQuestionIndex && "opacity-100"
            )}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteQuestion(index);
            }}
          >
            <Trash className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
          <div className="cursor-grab opacity-50 hover:opacity-100">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  };

  // Add DraggableQuestionThumbnail for the expanded view
  const DraggableQuestionThumbnail = ({ question, index }: { question: QuizQuestion, index: number }) => {
    const ref = React.useRef<HTMLDivElement>(null);

    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.QUESTION,
      item: { type: ItemTypes.QUESTION, id: question.id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: ItemTypes.QUESTION,
      hover: (item: DragItem, monitor) => {
        if (!ref.current) {
          return;
        }
        const dragIndex = item.index;
        const hoverIndex = index;

        // Don't replace items with themselves
        if (dragIndex === hoverIndex) {
          return;
        }

        // Determine rectangle on screen
        const hoverBoundingRect = ref.current.getBoundingClientRect();

        // Get horizontal middle
        const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();

        // Get pixels to the left
        const hoverClientX = clientOffset!.x - hoverBoundingRect.left;

        // Only perform the move when the mouse has crossed half of the items width
        // Dragging right
        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
          return;
        }

        // Dragging left
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
          return;
        }

        // Time to actually perform the action
        moveQuestion(dragIndex, hoverIndex);

        // Note: We're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        item.index = hoverIndex;
      },
    });

    const opacity = isDragging ? 0.4 : 1;
    drag(drop(ref));

    const isActive = index === activeQuestionIndex;

    // Get only correct options for display in thumbnail
    const correctOptions = question.options.filter(opt => opt.is_correct);

    return (
      <div
        ref={ref}
        style={{ opacity }}
        className={cn(
          "mb-3 cursor-pointer transition-all rounded-md overflow-hidden shadow-sm border",
          isActive
            ? "border-primary ring-1 ring-primary scale-[1.02]"
            : "border-transparent hover:border-gray-300"
        )}
        onClick={() => handleQuestionClick(index)}
      >
        <div className="relative">
          {/* Question number badge */}
          <div className="absolute top-2 left-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded-full z-10">
            {index + 1}
          </div>

          {/* Drag handle */}
          <div className="absolute top-2 right-9 bg-black/40 text-white p-0.5 rounded-sm z-10 cursor-grab">
            <GripVertical className="h-3 w-3" />
          </div>

          {/* Question type badge */}
          <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-800/90 text-[10px] px-1.5 py-0.5 rounded-sm z-10 flex items-center shadow-sm">
            {questionTypeIcons[question.question_type as keyof typeof questionTypeIcons]}
            <span className="ml-1 capitalize">
              {question.question_type.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Question content */}
          <div className="flex flex-col h-full">
            {/* Question area */}
            <div className={cn(
              "w-full h-36 bg-gradient-to-r p-3 flex flex-col",
              getQuestionColor(index)
            )}>
              <div className="flex justify-between">
                <div className="flex-1 text-sm font-medium line-clamp-3 mb-2">
                  {question.question_text || `Question ${index + 1}`}
                </div>
              </div>

              {/* Visual representation of the question */}
              <div className="flex-1 flex items-center justify-center overflow-hidden">
                {question.question_type === 'true_false' ? (
                  <div className="flex gap-3 justify-center w-full">
                    <div className={cn(
                      "flex-1 py-1 px-3 rounded-md text-xs flex items-center justify-center",
                      correctOptions.find(o => o.option_text?.toLowerCase() === 'true')
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                        : "bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700"
                    )}>
                      True
                    </div>
                    <div className={cn(
                      "flex-1 py-1 px-3 rounded-md text-xs flex items-center justify-center",
                      correctOptions.find(o => o.option_text?.toLowerCase() === 'false')
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                        : "bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700"
                    )}>
                      False
                    </div>
                  </div>
                ) : question.question_type === 'text_answer' ? (
                  <div className="w-full p-2 bg-white/70 dark:bg-gray-800/70 border border-dashed border-gray-300 dark:border-gray-600 rounded-md text-xs text-center">
                    Text Response Question
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 w-full">
                    {question.options.slice(0, 4).map((option, optIdx) => (
                      <div
                        key={optIdx}
                        className={cn(
                          "px-2 py-1 rounded-md text-[9px] truncate flex items-center",
                          option.is_correct
                            ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                            : "bg-white/70 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                        )}
                      >
                        <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[8px] mr-1 flex-shrink-0">
                          {['A', 'B', 'C', 'D'][optIdx]}
                        </div>
                        <span className="truncate">{option.option_text || `Option ${optIdx + 1}`}</span>
                      </div>
                    ))}

                    {question.options.length > 4 && (
                      <div className="col-span-2 px-2 py-1 rounded-md text-[9px] bg-gray-100/70 dark:bg-gray-800/70 text-gray-500 text-center">
                        +{question.options.length - 4} more options
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom toolbar */}
            <div className="bg-white dark:bg-gray-800 p-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Clone question logic would go here
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                    <rect x="8" y="8" width="12" height="12" rx="2" />
                    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                  </svg>
                  Clone
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteQuestion(index);
                }}
              >
                <Trash className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuestionThumbnail = (question: QuizQuestion, index: number) => {
    return (
      <DraggableQuestionThumbnail
        key={question.id}
        question={question}
        index={index}
      />
    );
  };

  const renderQuestionListItem = (question: QuizQuestion, index: number) => {
    return (
      <DraggableQuestionListItem
        key={question.id}
        question={question}
        index={index}
      />
    );
  };

  // Create a draggable compact question for the collapsed list
  const DraggableCompactQuestion = ({ question, index }: { question: QuizQuestion, index: number }) => {
    const ref = React.useRef<HTMLDivElement>(null);

    const [{ isDragging }, drag] = useDrag({
      type: ItemTypes.QUESTION,
      item: { type: ItemTypes.QUESTION, id: question.id, index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const [, drop] = useDrop({
      accept: ItemTypes.QUESTION,
      hover: (item: DragItem, monitor) => {
        if (!ref.current) {
          return;
        }
        const dragIndex = item.index;
        const hoverIndex = index;

        // Don't replace items with themselves
        if (dragIndex === hoverIndex) {
          return;
        }

        // Determine rectangle on screen
        const hoverBoundingRect = ref.current.getBoundingClientRect();

        // Get horizontal middle
        const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();

        // Get pixels to the left
        const hoverClientX = clientOffset!.x - hoverBoundingRect.left;

        // Only perform the move when the mouse has crossed half of the items width
        // Dragging right
        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
          return;
        }

        // Dragging left
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
          return;
        }

        // Time to actually perform the action
        moveQuestion(dragIndex, hoverIndex);

        // Note: We're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        item.index = hoverIndex;
      },
    });

    const opacity = isDragging ? 0.4 : 1;
    drag(drop(ref));

    return (
      <div
        ref={ref}
        style={{ opacity }}
        className={cn(
          "h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] cursor-pointer transition-all duration-200 relative border",
          index === activeQuestionIndex
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-muted text-muted-foreground hover:bg-muted/80 border-transparent"
        )}
        onClick={() => handleQuestionClick(index)}
        onMouseEnter={() => setHoveredQuestion(index)}
        onMouseLeave={() => setHoveredQuestion(null)}
      >
        {index + 1}

        {hoveredQuestion === index && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-gray-800 shadow-md rounded-md p-2 text-xs z-50 w-48">
            <div className="max-w-full overflow-hidden">
              <p className="font-medium truncate">{question.question_text || `Question ${index + 1}`}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {question.question_type.replace(/_/g, ' ')}
              </p>
            </div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-800"></div>
          </div>
        )}

        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-[6px] border border-gray-200 dark:border-gray-600">
          {questionTypeIcons[question.question_type as keyof typeof questionTypeIcons]}
        </div>
      </div>
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className={cn(
        "overflow-hidden border-none shadow-md transition-all duration-300 w-full h-full",
        isCollapsed ? "max-h-20" : ""
      )}>
        <CardHeader className={cn(
          "p-1 bg-gray-100 dark:bg-black text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800",
          isCollapsed && "p-0.5"
        )}>
          <div className="flex justify-between items-center h-6">
            {!isCollapsed ? (
              <>
                <div className="bg-white dark:bg-black px-1.5 py-0.5 rounded-md shadow-sm border border-gray-200 dark:border-gray-900">
                  <span className="font-medium text-[10px] text-gray-900 dark:text-white">Q ({questions.length})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="bg-white dark:bg-black rounded-md shadow-sm border border-gray-200 dark:border-gray-900 p-0.5 flex">
                    <Button
                      variant={expandedView ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-5 w-5 p-0 flex items-center justify-center",
                        expandedView ? "bg-primary text-primary-foreground" : "bg-transparent text-gray-700 dark:text-gray-300"
                      )}
                      onClick={() => setExpandedView(true)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7" />
                        <rect x="14" y="3" width="7" height="7" />
                        <rect x="14" y="14" width="7" height="7" />
                        <rect x="3" y="14" width="7" height="7" />
                      </svg>
                    </Button>
                    <Button
                      variant={!expandedView ? "default" : "ghost"}
                      size="sm"
                      className={cn(
                        "h-5 w-5 p-0 flex items-center justify-center",
                        !expandedView ? "bg-primary text-primary-foreground" : "bg-transparent text-gray-700 dark:text-gray-300"
                      )}
                      onClick={() => setExpandedView(false)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <CardContent className="p-2 overflow-hidden bg-white dark:bg-black" style={{ height: 'calc(100% - 30px)' }}>
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
                                    /* Hide scrollbar for Chrome, Safari and Opera */
                                    div::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
                {questions.map((question, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex-shrink-0 cursor-pointer transition-all hover:shadow-md",
                      "w-[120px] h-[80px] rounded-md overflow-hidden shadow-sm border",
                      index === activeQuestionIndex
                        ? "border-primary ring-1 ring-primary scale-[1.02]"
                        : "border-transparent hover:border-gray-300"
                    )}
                    onClick={() => handleQuestionClick(index)}
                  >
                    <div className="relative h-full">
                      {/* Question number badge */}
                      <div className="absolute top-1 left-1 bg-black/40 text-white text-[8px] px-1 py-0.5 rounded-full z-10">
                        {index + 1}
                      </div>

                      {/* Question type badge */}
                      <div className="absolute top-1 right-1 bg-white/90 dark:bg-gray-800/90 text-[8px] px-1 py-0.5 rounded-sm z-10 flex items-center shadow-sm">
                        {questionTypeIcons[question.question_type as keyof typeof questionTypeIcons]}
                        <span className="ml-0.5 capitalize">
                          {question.question_type.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {/* Question area */}
                      <div className={cn(
                        "w-full h-full bg-gradient-to-r flex flex-col",
                        getQuestionColor(index)
                      )}>
                        <div className="p-2">
                          <h3 className="text-[10px] font-medium line-clamp-2 mb-1">
                            {question.question_text || `Question ${index + 1}`}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add new question card */}
                <div
                  className="flex-shrink-0 cursor-pointer transition-all w-[120px] h-[80px] rounded-md overflow-hidden shadow-sm border border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary flex flex-col items-center justify-center"
                  onClick={() => onAddQuestion()}
                >
                  <Plus className="h-5 w-5 text-gray-400 dark:text-gray-500 mb-1" />
                  <p className="text-xs font-medium">Add Question</p>
                </div>
              </div>
            ) : (
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
                                    /* Hide scrollbar for Chrome, Safari and Opera */
                                    div::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
                {questions.map((question, index) => {
                  // Create a draggable component for the non-expanded view
                  const ref = React.useRef<HTMLDivElement>(null);

                  const [{ isDragging }, drag] = useDrag({
                    type: ItemTypes.QUESTION,
                    item: { type: ItemTypes.QUESTION, id: question.id, index },
                    collect: (monitor) => ({
                      isDragging: monitor.isDragging(),
                    }),
                  });

                  const [, drop] = useDrop({
                    accept: ItemTypes.QUESTION,
                    hover: (item: DragItem, monitor) => {
                      if (!ref.current) {
                        return;
                      }
                      const dragIndex = item.index;
                      const hoverIndex = index;

                      // Don't replace items with themselves
                      if (dragIndex === hoverIndex) {
                        return;
                      }

                      // Determine rectangle on screen
                      const hoverBoundingRect = ref.current.getBoundingClientRect();

                      // Get horizontal middle
                      const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

                      // Determine mouse position
                      const clientOffset = monitor.getClientOffset();

                      // Get pixels to the left
                      const hoverClientX = clientOffset!.x - hoverBoundingRect.left;

                      // Only perform the move when the mouse has crossed half of the items width
                      // Dragging right
                      if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
                        return;
                      }

                      // Dragging left
                      if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
                        return;
                      }

                      // Time to actually perform the action
                      moveQuestion(dragIndex, hoverIndex);

                      // Note: We're mutating the monitor item here!
                      // Generally it's better to avoid mutations,
                      // but it's good here for the sake of performance
                      // to avoid expensive index searches.
                      item.index = hoverIndex;
                    },
                  });

                  const opacity = isDragging ? 0.4 : 1;
                  drag(drop(ref));

                  return (
                    <div
                      key={question.id}
                      ref={ref}
                      style={{ opacity }}
                      className={cn(
                        "flex-shrink-0 h-8 px-2 flex items-center gap-1 rounded-md cursor-pointer transition-all border",
                        index === activeQuestionIndex
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                      onClick={() => handleQuestionClick(index)}
                    >
                      <div className="flex items-center">
                        <div className={cn(
                          "w-4 h-4 rounded-full flex items-center justify-center mr-1 flex-shrink-0 text-[10px] font-medium",
                          index === activeQuestionIndex
                            ? "bg-white text-primary"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        )}>
                          {index + 1}
                        </div>
                        <span className="text-[10px] whitespace-nowrap max-w-[120px] truncate">
                          {question.question_text || `Question ${index + 1}`}
                        </span>
                        <GripVertical className="h-3 w-3 ml-1 text-muted-foreground cursor-grab" />
                      </div>
                    </div>
                  );
                })}

                {/* Add new question button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddQuestion()}
                  className="flex-shrink-0 h-8 rounded-md px-2 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  <span>Add</span>
                </Button>
              </div>
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
                            /* Hide scrollbar for Chrome, Safari and Opera */
                            div::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
            <div className="flex items-center gap-1 flex-nowrap overflow-x-auto">
              {questions.map((question, index) => (
                <DraggableCompactQuestion
                  key={question.id}
                  question={question}
                  index={index}
                />
              ))}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg flex-shrink-0"
                onClick={() => onAddQuestion()}
                title="Add new question"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </DndProvider>
  );
}