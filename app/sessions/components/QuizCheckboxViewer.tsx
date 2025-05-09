'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle2, XCircle, Users } from 'lucide-react';
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
  onAnswerSubmit?: (selectedAnswers: string[]) => void;
  sessionWebSocket?: SessionWebSocket;
}

export default function QuizCheckboxViewer({
  activity,
  sessionId,
  sessionCode,
  onAnswerSubmit,
  sessionWebSocket,
}: QuizActivityProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(
    activity?.quiz?.timeLimitSeconds || 20
  );
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);

  // Reset state when activity changes
  useEffect(() => {
    setSelectedAnswers([]);
    setTimeLeft(activity?.quiz?.timeLimitSeconds || 60);
    setIsSubmitted(false);
    setShowResults(false);
    setIsSubmitting(false);
    setError(null);
  }, [activity.activityId]);

  useEffect(() => {
    if (timeLeft > 0 && !isSubmitted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !isSubmitted) {
      handleSubmit();
    }
  }, [timeLeft, isSubmitted]);

  // Lắng nghe cập nhật số người tham gia
  useEffect(() => {
    if (!sessionWebSocket) return;

    const handleParticipantsUpdate = (participants: any[]) => {
      console.log('[QuizCheckbox] Nhận cập nhật participants:', {
        totalParticipants: participants.length,
        participants,
      });

      setTotalParticipants(participants.length);
      // Đếm số người đã trả lời
      const answered = participants.filter((p) => p.hasAnswered).length;
      console.log('[QuizCheckbox] Số người đã trả lời:', answered);
      setAnsweredCount(answered);
    };

    sessionWebSocket.onParticipantsUpdateHandler(handleParticipantsUpdate);

    return () => {
      // Cleanup subscription if needed
    };
  }, [sessionWebSocket]);

  const handleAnswerChange = (answerId: string) => {
    setSelectedAnswers((prev) => {
      if (prev.includes(answerId)) {
        return prev.filter((id) => id !== answerId);
      } else {
        return [...prev, answerId];
      }
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting || isSubmitted || selectedAnswers.length === 0) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (onAnswerSubmit) {
        onAnswerSubmit(selectedAnswers);
      }

      if (sessionWebSocket) {
        if (!sessionCode && !sessionId) {
          console.warn('[QuizCheckbox] Thiếu cả sessionCode và sessionId');
          setError('Không thể xác định phiên. Vui lòng thử lại.');
          return;
        }

        const payload = {
          sessionCode: sessionCode,
          activityId: activity.activityId,
          answerContent: selectedAnswers.join(','),
        };

        console.log('[QuizCheckbox] Gửi câu trả lời:', payload);
        await sessionWebSocket.submitActivity(payload);
        console.log('[QuizCheckbox] Đã gửi câu trả lời thành công');
      } else {
        console.warn('[QuizCheckbox] Không có kết nối WebSocket');
      }

      setIsSubmitted(true);
      setShowResults(true);
    } catch (err) {
      console.error('[QuizCheckbox] Lỗi khi gửi câu trả lời:', err);
      setError('Không thể gửi câu trả lời. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    const correctAnswers = activity.quiz.quizAnswers.filter(
      (answer) => answer.isCorrect
    );
    const selectedCorrect = selectedAnswers.filter((answerId) => {
      const answer = activity.quiz.quizAnswers.find(
        (a) => a.quizAnswerId === answerId
      );
      return answer?.isCorrect;
    });

    const score = (selectedCorrect.length / correctAnswers.length) * 100;
    return Math.round(score);
  };

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
        <div className='space-y-6'>
          {/* Header */}
          <div className='flex justify-between items-center'>
            <h2 className='text-2xl font-bold'>{activity.title}</h2>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                <span className='text-sm'>
                  {answeredCount}/{totalParticipants} đã trả lời
                </span>
              </div>
              <div className='flex items-center gap-2'>
                <Clock className='h-5 w-5' />
                <span className='font-mono'>{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>

          {/* Progress bars */}
          <div className='space-y-2'>
            <Progress
              value={Math.min(
                100,
                Math.max(
                  0,
                  (timeLeft / (activity?.quiz?.timeLimitSeconds || 20)) * 100
                )
              )}
              className='h-2'
            />
            <Progress
              value={Math.min(
                100,
                Math.max(
                  0,
                  (answeredCount / Math.max(1, totalParticipants)) * 100
                )
              )}
              className='h-2 bg-gray-100'
            />
          </div>

          {/* Question */}
          <div className='space-y-4'>
            <p className='text-lg font-medium'>{activity.quiz.questionText}</p>
            <p className='text-sm text-gray-500'>{activity.description}</p>
          </div>

          {/* Error message */}
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Answers */}
          <div className='space-y-4'>
            {activity.quiz.quizAnswers
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((answer) => (
                <div
                  key={answer.quizAnswerId}
                  className={`flex items-start space-x-3 p-4 rounded-lg border ${
                    showResults
                      ? answer.isCorrect
                        ? 'border-green-500 bg-green-50'
                        : selectedAnswers.includes(answer.quizAnswerId)
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200'
                      : 'border-gray-200'
                  }`}
                >
                  <Checkbox
                    id={answer.quizAnswerId}
                    checked={selectedAnswers.includes(answer.quizAnswerId)}
                    onCheckedChange={() =>
                      handleAnswerChange(answer.quizAnswerId)
                    }
                    disabled={isSubmitted || isSubmitting}
                  />
                  <Label
                    htmlFor={answer.quizAnswerId}
                    className='flex-1 cursor-pointer'
                  >
                    <div className='flex items-center justify-between'>
                      <span>{answer.answerText}</span>
                      {showResults && (
                        <span>
                          {answer.isCorrect ? (
                            <CheckCircle2 className='h-5 w-5 text-green-500' />
                          ) : selectedAnswers.includes(answer.quizAnswerId) ? (
                            <XCircle className='h-5 w-5 text-red-500' />
                          ) : null}
                        </span>
                      )}
                    </div>
                    {showResults && (
                      <p className='text-sm text-gray-500 mt-1'>
                        {answer.explanation}
                      </p>
                    )}
                  </Label>
                </div>
              ))}
          </div>

          {/* Submit button */}
          {!isSubmitted && (
            <Button
              onClick={handleSubmit}
              className='w-full'
              disabled={selectedAnswers.length === 0 || isSubmitting}
            >
              {isSubmitting ? (
                <span className='flex items-center gap-2'>
                  <Clock className='h-4 w-4 animate-spin' />
                  Đang gửi...
                </span>
              ) : (
                'Nộp bài'
              )}
            </Button>
          )}

          {/* Results */}
          {showResults && (
            <Alert className='mt-4'>
              <AlertDescription>
                Điểm số của bạn: {calculateScore()}%
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>
    </div>
  );
}
