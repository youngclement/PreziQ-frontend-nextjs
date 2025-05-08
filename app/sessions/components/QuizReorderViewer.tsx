'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { Loader2, CheckCircle2, XCircle, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface QuizReorderViewerProps {
  activity: {
    activityId: string;
    title: string;
    description: string;
    quiz: {
      questionText: string;
      timeLimitSeconds: number;
      quizAnswers: {
        quizAnswerId: string;
        answerText: string;
        isCorrect: boolean;
        orderIndex: number;
      }[];
    };
  };
  sessionId: string;
  sessionWebSocket: SessionWebSocket;
}

interface SortableItemProps {
  id: string;
  text: string;
}

function SortableItem({ id, text }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className='flex items-center gap-3 p-4 bg-white border rounded-lg shadow-sm mb-2 cursor-move hover:bg-gray-50'
    >
      <div {...attributes} {...listeners} className='cursor-grab'>
        <GripVertical className='h-5 w-5 text-gray-400' />
      </div>
      <span className='flex-1'>{text}</span>
    </div>
  );
}

export default function QuizReorderViewer({
  activity,
  sessionId,
  sessionWebSocket,
}: QuizReorderViewerProps) {
  const [items, setItems] = useState<SortableItemProps[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(activity.quiz.timeLimitSeconds);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Khởi tạo danh sách items từ quizAnswers
    const initialItems = activity.quiz.quizAnswers.map((answer) => ({
      id: answer.quizAnswerId,
      text: answer.answerText,
    }));
    setItems(initialItems);
  }, [activity.quiz.quizAnswers]);

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isAnswered]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isAnswered) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Tạo answerContent từ thứ tự hiện tại của items
      const answerContent = items.map((item) => item.id).join(',');

      await sessionWebSocket.submitActivity({
        sessionId,
        activityId: activity.activityId,
        answerContent,
      });

      // Kiểm tra câu trả lời
      const correctOrder = activity.quiz.quizAnswers
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((a) => a.quizAnswerId);
      const userOrder = items.map((item) => item.id);
      const isAnswerCorrect =
        JSON.stringify(correctOrder) === JSON.stringify(userOrder);

      setIsCorrect(isAnswerCorrect);
      setIsAnswered(true);
    } catch (err) {
      setError('Không thể gửi câu trả lời. Vui lòng thử lại.');
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='space-y-4'>
      <Card className='p-6'>
        <h2 className='text-2xl font-bold mb-4'>{activity.title}</h2>
        <p className='text-gray-600 mb-6'>{activity.description}</p>

        <div className='mb-6'>
          <h3 className='text-xl font-semibold mb-4'>
            {activity.quiz.questionText}
          </h3>
          <div className='flex items-center gap-2 mb-4'>
            <span className='text-sm font-medium'>Thời gian còn lại:</span>
            <span
              className={`text-lg font-bold ${
                timeLeft <= 10 ? 'text-red-500' : 'text-green-500'
              }`}
            >
              {timeLeft} giây
            </span>
          </div>
        </div>

        {error && (
          <Alert variant='destructive' className='mb-4'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isAnswered && (
          <div className='mb-6 p-4 rounded-lg bg-gray-50'>
            <div className='flex items-center gap-2 mb-2'>
              {isCorrect ? (
                <>
                  <CheckCircle2 className='h-5 w-5 text-green-500' />
                  <span className='text-green-500 font-medium'>
                    Câu trả lời đúng!
                  </span>
                </>
              ) : (
                <>
                  <XCircle className='h-5 w-5 text-red-500' />
                  <span className='text-red-500 font-medium'>
                    Câu trả lời chưa đúng
                  </span>
                </>
              )}
            </div>
            <div className='mt-2'>
              <p className='text-sm text-gray-600'>Thứ tự đúng là:</p>
              <div className='mt-2 space-y-2'>
                {activity.quiz.quizAnswers
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((answer) => (
                    <div
                      key={answer.quizAnswerId}
                      className='p-2 bg-white rounded border'
                    >
                      {answer.answerText}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className='space-y-4'>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item) => (
                <SortableItem key={item.id} id={item.id} text={item.text} />
              ))}
            </SortableContext>
          </DndContext>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isAnswered || timeLeft === 0}
            className='w-full'
          >
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Đang gửi...
              </>
            ) : isAnswered ? (
              'Đã gửi câu trả lời'
            ) : timeLeft === 0 ? (
              'Hết thời gian'
            ) : (
              'Gửi câu trả lời'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
