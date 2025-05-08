'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface QuizTypeAnswerViewerProps {
  activity: {
    activityId: string;
    title: string;
    description: string;
    quiz: {
      questionText: string;
      timeLimitSeconds: number;
      quizAnswers: {
        answerText: string;
        isCorrect: boolean;
      }[];
    };
  };
  sessionId: string;
  sessionWebSocket: SessionWebSocket;
}

export default function QuizTypeAnswerViewer({
  activity,
  sessionId,
  sessionWebSocket,
}: QuizTypeAnswerViewerProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(activity.quiz.timeLimitSeconds);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    if (timeLeft > 0 && !isAnswered) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isAnswered]);

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setError('Vui lòng nhập câu trả lời');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await sessionWebSocket.submitActivity({
        sessionId,
        activityId: activity.activityId,
        answerContent: answer.trim(),
      });
      setIsAnswered(true);

      // Kiểm tra câu trả lời
      const correctAnswer = activity.quiz.quizAnswers.find((a) => a.isCorrect);
      if (correctAnswer) {
        const isAnswerCorrect =
          answer.trim().toLowerCase() ===
          correctAnswer.answerText.toLowerCase();
        setIsCorrect(isAnswerCorrect);
      }
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
              <p className='text-sm text-gray-600'>Đáp án đúng là:</p>
              <p className='font-medium text-gray-900'>
                {activity.quiz.quizAnswers.find((a) => a.isCorrect)?.answerText}
              </p>
            </div>
          </div>
        )}

        <div className='space-y-4'>
          <Input
            type='text'
            placeholder='Nhập câu trả lời của bạn...'
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitting || isAnswered}
            className='w-full'
          />

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
