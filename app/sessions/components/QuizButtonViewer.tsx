'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';

interface QuizAnswer {
  quizAnswerId: string;
  answerText: string;
  isCorrect: boolean;
  explanation: string;
  orderIndex: number;
}

interface Quiz {
  quizId: string;
  questionText: string;
  timeLimitSeconds: number;
  pointType: string;
  quizAnswers: QuizAnswer[];
}

interface QuizActivityProps {
  activity: {
    activityId: string;
    activityType: string;
    title: string;
    description: string;
    backgroundColor?: string;
    backgroundImage?: string;
    customBackgroundMusic?: string;
    quiz: Quiz;
  };
  sessionId?: string; 
  sessionCode?: string; 
  onAnswerSubmit?: (answerId: string) => void;
  sessionWebSocket?: SessionWebSocket;
}

const QuizButtonViewer: React.FC<QuizActivityProps> = ({
  activity,
  sessionId,
  sessionCode,
  onAnswerSubmit,
  sessionWebSocket,
}) => {
  const [selectedAnswerId, setSelectedAnswerId] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(
    activity.quiz.timeLimitSeconds
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (timeRemaining <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleSelectAnswer = (answerId: string) => {
    if (isSubmitted) return;
    setSelectedAnswerId(answerId);
  };

  const handleSubmit = async () => {
    if (!selectedAnswerId || isSubmitted) return;
    setIsSubmitted(true);
    setSubmitError(null);


    if (onAnswerSubmit) {
      onAnswerSubmit(selectedAnswerId);
    }


    if (sessionWebSocket) {
      try {
        if (!sessionCode && !sessionId) {
          console.warn('Thiếu cả sessionCode và sessionId');
          setSubmitError('Không thể xác định phiên. Vui lòng thử lại.');
          return;
        }

        const payload = {
          sessionCode: sessionCode,
          activityId: activity.activityId,
          answerContent: selectedAnswerId,
        };

        await sessionWebSocket.submitActivity(payload);

        console.log('Đã gửi câu trả lời:', payload);
      } catch (error) {
        console.error('Lỗi khi gửi câu trả lời:', error);
        setSubmitError('Không thể gửi câu trả lời. Vui lòng thử lại.');
      }
    } else {
      console.warn('Không có kết nối WebSocket');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };


  const progressPercentage = Math.max(
    0,
    (timeRemaining / activity.quiz.timeLimitSeconds) * 100
  );

  return (
    <div
      className='flex flex-col h-full w-full p-4'
      style={{
        backgroundColor: activity.backgroundColor || '#FFFFFF',
        backgroundImage: activity.backgroundImage
          ? `url(${activity.backgroundImage})`
          : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Card className='p-6 max-w-4xl mx-auto w-full'>
        <div className='mb-6'>
          <div className='flex justify-between items-center mb-2'>
            <h3 className='text-xl font-bold'>{activity.title}</h3>
            <div className='text-xl font-semibold'>
              {formatTime(timeRemaining)}
            </div>
          </div>
          <Progress value={progressPercentage} className='h-2' />
        </div>

        <div className='mb-8'>
          <h2 className='text-2xl font-bold mb-2'>
            {activity.quiz.questionText}
          </h2>
          <p className='text-gray-600'>{activity.description}</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-6'>
          {activity.quiz.quizAnswers
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((answer) => (
              <Button
                key={answer.quizAnswerId}
                variant={
                  selectedAnswerId === answer.quizAnswerId
                    ? 'default'
                    : 'outline'
                }
                className={`p-6 h-auto text-lg justify-start ${
                  isSubmitted && answer.isCorrect
                    ? 'bg-green-100 border-green-500'
                    : isSubmitted &&
                      selectedAnswerId === answer.quizAnswerId &&
                      !answer.isCorrect
                    ? 'bg-red-100 border-red-500'
                    : ''
                }`}
                onClick={() => handleSelectAnswer(answer.quizAnswerId)}
                disabled={isSubmitted}
              >
                {answer.answerText}
              </Button>
            ))}
        </div>

        {submitError && (
          <div className='mb-4 p-3 text-sm bg-red-100 text-red-800 rounded-md'>
            {submitError}
          </div>
        )}

        <Button
          className='w-full py-6'
          size='lg'
          disabled={!selectedAnswerId || isSubmitted}
          onClick={handleSubmit}
        >
          {isSubmitted ? 'Đã gửi câu trả lời' : 'Gửi câu trả lời'}
        </Button>

        {isSubmitted && selectedAnswerId && (
          <div className='mt-4 p-4 rounded-md bg-gray-100'>
            <p className='font-semibold'>
              {activity.quiz.quizAnswers.find(
                (a) => a.quizAnswerId === selectedAnswerId
              )?.isCorrect
                ? '✅ Đúng!'
                : '❌ Sai!'}
            </p>
            <p>
              {
                activity.quiz.quizAnswers.find(
                  (a) => a.quizAnswerId === selectedAnswerId
                )?.explanation
              }
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default QuizButtonViewer;
