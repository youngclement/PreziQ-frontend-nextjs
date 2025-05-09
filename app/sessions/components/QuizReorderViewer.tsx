'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  GripVertical,
  Clock,
  Users,
  ArrowUpDown,
} from 'lucide-react';
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
import { motion } from 'framer-motion';

interface QuizReorderViewerProps {
  activity: {
    activityId: string;
    title: string;
    description: string;
    backgroundColor?: string;
    backgroundImage?: string;
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
    <motion.div
      ref={setNodeRef}
      style={style}
      className='flex items-center gap-3 p-4 bg-white/90 dark:bg-gray-900/80 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-2 cursor-move hover:bg-gray-50 dark:hover:bg-gray-800/80 backdrop-blur-lg transition-all duration-300'
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div {...attributes} {...listeners} className='cursor-grab'>
        <GripVertical className='h-5 w-5 text-gray-400' />
      </div>
      <span className='flex-1 text-gray-800 dark:text-gray-100'>{text}</span>
    </motion.div>
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
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

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

  useEffect(() => {
    if (!sessionWebSocket) return;

    const handleParticipantsUpdate = (participants: any[]) => {
      setTotalParticipants(participants.length);
      const answered = participants.filter((p) => p.hasAnswered).length;
      setAnsweredCount(answered);
    };

    sessionWebSocket.onParticipantsUpdateHandler(handleParticipantsUpdate);
  }, [sessionWebSocket]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <Card className='max-w-4xl mx-auto overflow-hidden'>
        {/* Header với thời gian và tiến trình */}
        <motion.div
          className='aspect-[16/5] rounded-t-xl flex flex-col shadow-md relative overflow-hidden'
          style={{
            backgroundImage: activity.backgroundImage
              ? `url(${activity.backgroundImage})`
              : undefined,
            backgroundColor: activity.backgroundColor || '#FFFFFF',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay */}
          <div className='absolute inset-0 bg-black/30' />

          {/* Status Bar */}
          <div className='absolute top-0 left-0 right-0 h-12 bg-black/40 flex items-center justify-between px-5 text-white z-10'>
            <div className='flex items-center gap-3'>
              <div className='h-7 w-7 rounded-full bg-amber-500 flex items-center justify-center shadow-sm'>
                <ArrowUpDown className='h-4 w-4' />
              </div>
              <div className='text-xs capitalize font-medium'>Reorder Quiz</div>
            </div>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2 bg-black/60 px-2 py-1 rounded-full text-xs'>
                <Users className='h-3.5 w-3.5' />
                <span>
                  {answeredCount}/{totalParticipants}
                </span>
              </div>
              <div className='flex items-center gap-1.5 bg-primary px-2 py-1 rounded-full text-xs font-medium'>
                <Clock className='h-3.5 w-3.5' />
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>

          {/* Question Text */}
          <div className='flex-1 flex flex-col items-center justify-center z-10 py-6 px-5'>
            <h2 className='text-xl md:text-2xl font-bold text-center max-w-2xl text-white drop-shadow-sm px-4'>
              {activity.quiz.questionText}
            </h2>
            {activity.description && (
              <p className='mt-2 text-sm text-white/80 text-center max-w-xl'>
                {activity.description}
              </p>
            )}
          </div>
        </motion.div>

        {/* Progress Bars */}
        <div className='w-full'>
          {/* Time Progress */}
          <motion.div
            className='h-1 bg-primary'
            initial={{ width: '100%' }}
            animate={{
              width: `${Math.min(
                100,
                Math.max(0, (timeLeft / activity.quiz.timeLimitSeconds) * 100)
              )}%`,
            }}
            transition={{ duration: 0.1 }}
          />
          {/* Participants Progress */}
          <motion.div
            className='h-1 bg-amber-500'
            initial={{ width: '0%' }}
            animate={{
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  (answeredCount / Math.max(1, totalParticipants)) * 100
                )
              )}%`,
            }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Content */}
        <div className='p-4 bg-white dark:bg-gray-800'>
          {error && (
            <Alert variant='destructive' className='mb-4'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isAnswered && (
            <motion.div
              className='mb-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className='flex items-center gap-2 mb-2'>
                {isCorrect ? (
                  <>
                    <CheckCircle2 className='h-5 w-5 text-green-500' />
                    <span className='text-green-500 font-medium'>
                      Thứ tự đã đúng!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className='h-5 w-5 text-red-500' />
                    <span className='text-red-500 font-medium'>
                      Thứ tự chưa đúng
                    </span>
                  </>
                )}
              </div>
              <div className='mt-2'>
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  Thứ tự đúng là:
                </p>
                <div className='mt-2 space-y-2'>
                  {activity.quiz.quizAnswers
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((answer) => (
                      <div
                        key={answer.quizAnswerId}
                        className='p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm'
                      >
                        {answer.answerText}
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isAnswered || timeLeft === 0}
                className={`w-full h-14 text-lg mt-4 ${
                  isSubmitting || isAnswered || timeLeft === 0
                    ? 'bg-gray-400'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-5 w-5 animate-spin' />
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
            </motion.div>
          </div>
        </div>
      </Card>
    </div>
  );
}
