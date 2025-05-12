'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  MapPin,
  Users,
  Loader2,
  AlertCircle,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
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
    hostShowAnswer?: boolean;
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
  const [isQuizEnded, setIsQuizEnded] = useState(false);

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

  useEffect(() => {
    if (
      timeLeft <= 0 ||
      (answeredCount > 0 && answeredCount >= totalParticipants)
    ) {
      setIsQuizEnded(true);
    }
  }, [timeLeft, answeredCount, totalParticipants]);

  // Lắng nghe cập nhật số người tham gia
  useEffect(() => {
    if (!sessionWebSocket) return;

    console.log('[QuizLocation] Khởi tạo cập nhật số người tham gia');

    // Hàm cập nhật responseRatio - lấy trực tiếp từ WebSocket
    const updateResponseRatio = () => {
      // Lấy giá trị từ WebSocket
      const participantsRatio = sessionWebSocket.getParticipantsEventRatio();

      console.log(
        `[QuizLocation] Số người tham gia đã trả lời: ${participantsRatio.count}/${participantsRatio.total} (${participantsRatio.percentage}%)`
      );

      // Cập nhật số lượng đếm
      setAnsweredCount(participantsRatio.count);
      setTotalParticipants(participantsRatio.total);
    };

    // Cập nhật ban đầu
    updateResponseRatio();

    // Thiết lập interval để cập nhật liên tục
    const intervalId = setInterval(updateResponseRatio, 2000);

    // Đăng ký lắng nghe sự kiện participants update từ WebSocket
    sessionWebSocket.onParticipantsUpdateHandler(() => {
      updateResponseRatio();
    });

    return () => {
      console.log('[QuizLocation] Dọn dẹp cập nhật số người tham gia');
      clearInterval(intervalId);
    };
  }, [sessionWebSocket]);

  const handleLocationSelect = (isCorrect: boolean, distance: number) => {
    if (isSubmitted || isQuizEnded) return;
    const location = activity.quiz.quizAnswers[0]?.locationData;
    if (location) {
      setSelectedLocation(location);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting || isSubmitted || !selectedLocation || isQuizEnded) return;

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
      setShowResults(isQuizEnded);
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
    <div className='min-h-full bg-transparent'>
      <Card className='bg-[#0e1c26]/80 backdrop-blur-md shadow-xl border border-white/5 text-white overflow-hidden'>
        {/* Header với thời gian và tiến trình */}
        <motion.div
          className='aspect-[16/4] rounded-t-xl flex flex-col shadow-md relative overflow-hidden'
          style={{
            backgroundImage: activity.backgroundImage
              ? `url(${activity.backgroundImage})`
              : undefined,
            backgroundColor: activity.backgroundColor || '#0e2838',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay */}
          <div className='absolute inset-0 bg-gradient-to-b from-[#0a1b25]/80 to-[#0f2231]/70' />

          {/* Status Bar */}
          <div className='absolute top-0 left-0 right-0 h-12 bg-[#0e1c26]/80 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-5 text-white z-10'>
            <div className='flex items-center gap-3'>
              <div className='h-7 w-7 rounded-full bg-gradient-to-r from-[#aef359] to-[#e4f88d] flex items-center justify-center shadow-md'>
                <MapPin className='h-4 w-4 text-[#0e1c26]' />
              </div>
              <div className='text-xs capitalize font-medium text-white/80'>
                Location Quiz
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <motion.div
                className='flex items-center gap-1.5 bg-[#0e2838]/80 border border-white/10 px-2 py-1 rounded-full text-xs font-medium'
                animate={{
                  opacity: timeLeft < 10 ? [0.7, 1] : 1,
                  scale: timeLeft < 10 ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  repeat: timeLeft < 10 ? Infinity : 0,
                  repeatType: 'reverse',
                }}
              >
                <Clock className='h-3.5 w-3.5 text-[#aef359]' />
                <span
                  className={timeLeft < 10 ? 'text-red-300' : 'text-white/90'}
                >
                  {formatTime(timeLeft)}
                </span>
              </motion.div>
              {sessionWebSocket && (
                <motion.div
                  key={`${answeredCount}-${totalParticipants}`}
                  className={`
                    flex items-center gap-1.5 mr-2 ${
                      answeredCount >= totalParticipants
                        ? 'bg-[#0e2838]/80 border-[#aef359]/30 shadow-[#aef359]/10'
                        : 'bg-[#0e2838]/80 border-amber-500/30 shadow-amber-500/10'
                    } border border-white/10 px-2 py-1 rounded-full text-xs font-medium`}
                  animate={{
                    scale: answeredCount > 0 ? [1, 1.15, 1] : 1,
                    transition: { duration: 0.5 },
                  }}
                >
                  <Users className='h-3.5 w-3.5 text-[#aef359]' />
                  <span
                    className={
                      answeredCount >= totalParticipants
                        ? 'text-[#aef359]'
                        : 'text-amber-400'
                    }
                  >
                    {answeredCount}
                  </span>
                  <span className='text-white/50'>/{totalParticipants}</span>
                  <span className='ml-1 text-xs opacity-75'>
                    (
                    {Math.round(
                      (answeredCount / Math.max(1, totalParticipants)) * 100
                    )}
                    %)
                  </span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Question Text */}
          <div className='flex-1 flex flex-col items-center justify-center z-10 py-8 px-5'>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='text-xl md:text-2xl font-bold text-center max-w-2xl text-white drop-shadow-lg'
            >
              {activity.quiz.questionText}
            </motion.h2>
            {activity.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className='mt-2 text-sm text-white/80 text-center max-w-xl'
              >
                {activity.description}
              </motion.p>
            )}
          </div>
        </motion.div>

        {/* Progress Bars */}
        <div className='w-full'>
          {/* Time Progress */}
          <motion.div
            className='h-1 bg-gradient-to-r from-[#aef359] to-[#e4f88d]'
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
          {/* Participants Progress - Đổi màu thành xanh dương thay vì cyan */}
          <motion.div
            className='h-1 bg-blue-500/70'
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
        <div className='p-6 bg-[#0e1c26]/70'>
          <AnimatePresence>
            {error && (
              <motion.div
                className='mb-4 p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-white/90'
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className='flex items-center gap-2'>
                  <AlertCircle className='h-5 w-5 text-red-400' />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className='rounded-xl overflow-hidden shadow-xl border border-white/10'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
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
                if (isSubmitted || isQuizEnded) return;
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
          </motion.div>

          {/* Submit Button */}
          {!isSubmitted && !isQuizEnded && !activity.hostShowAnswer && (
            <motion.div
              className='mt-6'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                className={`w-full py-5 text-lg font-semibold rounded-xl flex items-center justify-center gap-2 ${
                  !selectedLocation || isSubmitting
                    ? 'bg-[#0e2838]/50 text-white/50 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#aef359] to-[#e4f88d] text-[#0e1c26] hover:from-[#9ee348] hover:to-[#d3e87c] hover:shadow-lg hover:shadow-[#aef359]/20'
                }`}
                disabled={!selectedLocation || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='h-5 w-5 animate-spin' />
                    <span>Đang gửi...</span>
                  </>
                ) : (
                  <>
                    <span>Gửi câu trả lời</span>
                    <ArrowRight className='h-5 w-5' />
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Thông báo đã gửi câu trả lời khi submit nhưng chưa kết thúc quiz */}
          {isSubmitted && !showResults && !isQuizEnded && (
            <motion.div
              className='mt-6 p-4 rounded-xl bg-[#0e2838]/50 border border-[#aef359]/30 text-white/90'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className='flex items-center gap-2 mb-2 text-[#aef359]'>
                <CheckCircle className='h-5 w-5' />
                <span className='font-semibold'>Đã gửi câu trả lời!</span>
              </div>
              <p className='text-white/70'>
                Câu trả lời của bạn đã được ghi nhận. Kết quả sẽ được hiển thị
                khi tất cả người tham gia đã trả lời hoặc hết thời gian.
              </p>
            </motion.div>
          )}

          {/* Show Time Expired Message when quiz has ended but not submitted */}
          {isQuizEnded && !isSubmitted && (
            <motion.div
              className='mt-6 p-4 rounded-xl bg-[#0e2838]/50 border border-amber-500/30 text-white/90'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className='flex items-center gap-2 mb-2 text-amber-400'>
                <Clock className='h-5 w-5' />
                <span className='font-semibold'>Hết thời gian!</span>
              </div>
              <p className='text-white/70'>
                Thời gian trả lời đã hết hoặc tất cả người tham gia đã trả lời.
                Bạn không thể nộp câu trả lời nữa.
              </p>
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence>
            {(isSubmitted && isQuizEnded) || activity.hostShowAnswer ? (
              <motion.div
                className='mt-6 p-4 rounded-xl bg-[#0e2838]/50 border border-white/10'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {activity.hostShowAnswer && !isSubmitted ? (
                  <div>
                    <div className='flex items-center gap-2 mb-3 text-[#aef359]'>
                      <CheckCircle className='h-5 w-5' />
                      <span className='font-semibold'>Vị trí chính xác:</span>
                    </div>
                    {activity.quiz.quizAnswers[0]?.locationData && (
                      <p className='text-white/70'>
                        Tọa độ đúng:{' '}
                        {activity.quiz.quizAnswers[0].locationData.lat.toFixed(
                          6
                        )}
                        ,{' '}
                        {activity.quiz.quizAnswers[0].locationData.lng.toFixed(
                          6
                        )}{' '}
                        (bán kính{' '}
                        {activity.quiz.quizAnswers[0].locationData.radius} km)
                      </p>
                    )}
                  </div>
                ) : (
                  <>
                    <div className='flex items-center gap-2 mb-3'>
                      <div className='flex items-center gap-2 text-[#aef359]'>
                        <CheckCircle className='h-5 w-5' />
                        <span className='font-semibold'>
                          Điểm số: {calculateScore()}%
                        </span>
                      </div>
                    </div>
                    {selectedLocation &&
                      activity.quiz.quizAnswers[0]?.locationData && (
                        <p className='text-white/70'>
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
                  </>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
