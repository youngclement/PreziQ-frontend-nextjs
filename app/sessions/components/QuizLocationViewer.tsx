'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { motion } from 'framer-motion';
import { Clock, MapPin, Users } from 'lucide-react';
import { LocationQuestionPlayer } from '@/app/collection/components/question-player/location-question-player';

interface LocationAnswer {
  longitude: number;
  latitude: number;
  radius: number;
}

interface LocationData {
  lat: number;
  lng: number;
  radius: number;
}

interface QuizAnswer {
  quizAnswerId: string;
  answerText: string;
  isCorrect: boolean;
  explanation: string;
  orderIndex: number;
  locationData: LocationData;
}

interface Quiz {
  quizId: string;
  questionText: string;
  timeLimitSeconds: number;
  pointType: string;
  locationAnswers?: LocationAnswer[];
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
  onAnswerSubmit?: (locationData: LocationData) => void;
  sessionWebSocket?: SessionWebSocket;
}

export default function QuizLocationViewer({
  activity,
  sessionId,
  sessionCode,
  onAnswerSubmit,
  sessionWebSocket,
}: QuizActivityProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(
    null
  );
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
    setSelectedLocation(null);
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
      console.log('[QuizLocation] Nhận cập nhật participants:', {
        totalParticipants: participants.length,
        participants,
      });

      setTotalParticipants(participants.length);
      const answered = participants.filter((p) => p.hasAnswered).length;
      console.log('[QuizLocation] Số người đã trả lời:', answered);
      setAnsweredCount(answered);
    };

    sessionWebSocket.onParticipantsUpdateHandler(handleParticipantsUpdate);

    return () => {
      // Cleanup subscription if needed
    };
  }, [sessionWebSocket]);

  const handleLocationSelect = (isCorrect: boolean, distance: number) => {
    if (isSubmitted) return;
    const location = activity.quiz.quizAnswers[0]?.locationData;
    if (location) {
      setSelectedLocation(location);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isSubmitted || !selectedLocation) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (onAnswerSubmit) {
        onAnswerSubmit(selectedLocation);
      }

      if (sessionWebSocket) {
        if (!sessionCode && !sessionId) {
          console.warn('[QuizLocation] Thiếu cả sessionCode và sessionId');
          setError('Không thể xác định phiên. Vui lòng thử lại.');
          return;
        }

        const payload = {
          sessionCode: sessionCode,
          activityId: activity.activityId,
          type: 'LOCATION',
          locationAnswers: [
            {
              latitude: selectedLocation.lat,
              longitude: selectedLocation.lng,
              radius: selectedLocation.radius,
            },
          ],
        };

        console.log('[QuizLocation] Gửi câu trả lời:', payload);
        await sessionWebSocket.submitActivity(payload);
        console.log('[QuizLocation] Đã gửi câu trả lời thành công');
      } else {
        console.warn('[QuizLocation] Không có kết nối WebSocket');
      }

      setIsSubmitted(true);
      setShowResults(true);
    } catch (err) {
      console.error('[QuizLocation] Lỗi khi gửi câu trả lời:', err);
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
    if (!selectedLocation || !activity.quiz.quizAnswers[0]?.locationData)
      return 0;

    const correctLocation = activity.quiz.quizAnswers[0].locationData;
    const distance = getDistanceFromLatLonInKm(
      selectedLocation.lat,
      selectedLocation.lng,
      correctLocation.lat,
      correctLocation.lng
    );

    // Tính điểm dựa trên khoảng cách và bán kính cho phép
    const maxDistance = correctLocation.radius; // Bán kính tính bằng km
    const score = Math.max(0, 100 - (distance / maxDistance) * 100);
    return Math.round(score);
  };

  // Hàm tính khoảng cách giữa 2 điểm trên bản đồ
  function getDistanceFromLatLonInKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371; // Bán kính trái đất tính bằng km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Khoảng cách tính bằng km
  }

  function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }

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
              <div className='h-7 w-7 rounded-full bg-cyan-500 flex items-center justify-center shadow-sm'>
                <MapPin className='h-4 w-4' />
              </div>
              <div className='text-xs capitalize font-medium'>
                Location Quiz
              </div>
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
                Math.max(
                  0,
                  (timeLeft / (activity?.quiz?.timeLimitSeconds || 20)) * 100
                )
              )}%`,
            }}
            transition={{ duration: 0.1 }}
          />
          {/* Participants Progress */}
          <motion.div
            className='h-1 bg-cyan-500'
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

        {/* Map */}
        <div className='p-4 bg-white dark:bg-gray-800'>
          {error && (
            <motion.div
              className='mb-4 p-3 text-sm bg-red-100 text-red-800 rounded-md'
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          <div className='rounded-lg overflow-hidden shadow-lg'>
            <LocationQuestionPlayer
              questionText={activity.quiz.questionText}
              locationData={
                activity.quiz.locationAnswers?.[0]
                  ? {
                      lat: activity.quiz.locationAnswers[0].latitude,
                      lng: activity.quiz.locationAnswers[0].longitude,
                      radius: activity.quiz.locationAnswers[0].radius,
                    }
                  : activity.quiz.quizAnswers[0]?.locationData || {
                      lat: 0,
                      lng: 0,
                      radius: 10,
                    }
              }
              onAnswer={(isCorrect, distance) => {
                if (isSubmitted) return;
                const location = activity.quiz.locationAnswers?.[0]
                  ? {
                      lat: activity.quiz.locationAnswers[0].latitude,
                      lng: activity.quiz.locationAnswers[0].longitude,
                      radius: activity.quiz.locationAnswers[0].radius,
                    }
                  : activity.quiz.quizAnswers[0]?.locationData;
                if (location) {
                  setSelectedLocation(location);
                  if (onAnswerSubmit) {
                    onAnswerSubmit(location);
                  }
                }
              }}
            />
          </div>

          {/* Submit Button */}
          {!isSubmitted && (
            <motion.div
              className='mt-6'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                className='w-full py-6 text-lg font-semibold'
                disabled={!selectedLocation || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? 'Đang gửi...' : 'Gửi câu trả lời'}
              </Button>
            </motion.div>
          )}

          {/* Results */}
          {isSubmitted && showResults && (
            <motion.div
              className='mt-6 p-4 rounded-lg bg-gray-50 dark:bg-gray-900/50'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className='flex items-center gap-2 mb-2'>
                <div className='flex items-center gap-2 text-primary'>
                  <MapPin className='h-5 w-5' />
                  <span className='font-semibold'>
                    Điểm số: {calculateScore()}%
                  </span>
                </div>
              </div>
              {selectedLocation &&
                activity.quiz.quizAnswers[0]?.locationData && (
                  <p className='text-gray-600 dark:text-gray-300'>
                    Khoảng cách từ vị trí bạn chọn đến vị trí đúng là{' '}
                    {getDistanceFromLatLonInKm(
                      selectedLocation.lat,
                      selectedLocation.lng,
                      activity.quiz.quizAnswers[0].locationData.lat,
                      activity.quiz.quizAnswers[0].locationData.lng
                    ).toFixed(2)}{' '}
                    km.
                  </p>
                )}
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
}
