'use client';

/**
 * QuizLocationViewer Component
 *
 * Component hiển thị quiz location trong session.
 *
 * Payload format khi submit:
 * {
 *   "sessionCode": "ABC123",
 *   "activityId": "550e8400-e29b-41d4-a716-446655440001",
 *   "answerContent": "105.8342,21.0278" // longitude,latitude
 * }
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  X,
} from 'lucide-react';
import { LocationQuestionPlayer } from './QuizLocationMap';

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
  quizLocationAnswers?: LocationAnswer[];
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
  isParticipating?: boolean;
}

export default function QuizLocationViewer({
  activity,
  sessionId,
  sessionCode,
  onAnswerSubmit,
  sessionWebSocket,
  isParticipating = true,
}: QuizActivityProps) {
  // State cho nhiều vị trí user chọn (thay đổi từ single location thành array)
  const [userSelectedLocations, setUserSelectedLocations] = useState<
    LocationData[]
  >([]);
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
    setUserSelectedLocations([]);
    setSelectedLocation(null);
    setTimeLeft(activity?.quiz?.timeLimitSeconds || 60);
    setIsSubmitted(false);
    setShowResults(false);
    setIsSubmitting(false);
    setError(null);
  }, [activity.activityId]);

  // Memoize locationData để tránh tạo object mới mỗi lần render
  const locationData = useMemo(() => {
    // Ưu tiên sử dụng quizLocationAnswers từ server
    if (activity.quiz.quizLocationAnswers?.[0]) {
      console.log(
        '[QuizLocation] Sử dụng quizLocationAnswers từ server:',
        activity.quiz.quizLocationAnswers[0]
      );
      return {
        lat: activity.quiz.quizLocationAnswers[0].latitude,
        lng: activity.quiz.quizLocationAnswers[0].longitude,
        radius: activity.quiz.quizLocationAnswers[0].radius,
      };
    }

    // Fallback sang locationAnswers (tương thích ngược)
    if (activity.quiz.locationAnswers?.[0]) {
      console.log(
        '[QuizLocation] Sử dụng locationAnswers (fallback):',
        activity.quiz.locationAnswers[0]
      );
      return {
        lat: activity.quiz.locationAnswers[0].latitude,
        lng: activity.quiz.locationAnswers[0].longitude,
        radius: activity.quiz.locationAnswers[0].radius,
      };
    }

    // Fallback cuối cùng sang quizAnswers
    if (activity.quiz.quizAnswers[0]?.locationData) {
      console.log(
        '[QuizLocation] Sử dụng quizAnswers.locationData (fallback cuối):',
        activity.quiz.quizAnswers[0].locationData
      );
      return activity.quiz.quizAnswers[0].locationData;
    }

    // Default location nếu không có dữ liệu
    console.warn(
      '[QuizLocation] Không tìm thấy dữ liệu location, sử dụng default'
    );
    return {
      lat: 0,
      lng: 0,
      radius: 10,
    };
  }, [
    activity.quiz.quizLocationAnswers,
    activity.quiz.locationAnswers,
    activity.quiz.quizAnswers,
  ]);

  // Lấy tất cả đáp án đúng để validation multiple selection
  const correctAnswers = useMemo(() => {
    // Ưu tiên sử dụng quizLocationAnswers (multiple answers)
    if (
      activity.quiz.quizLocationAnswers &&
      activity.quiz.quizLocationAnswers.length > 0
    ) {
      return activity.quiz.quizLocationAnswers.map((answer) => ({
        lat: answer.latitude,
        lng: answer.longitude,
        radius: answer.radius,
      }));
    }

    // Fallback về locationAnswers
    if (
      activity.quiz.locationAnswers &&
      activity.quiz.locationAnswers.length > 0
    ) {
      return activity.quiz.locationAnswers.map((answer) => ({
        lat: answer.latitude,
        lng: answer.longitude,
        radius: answer.radius,
      }));
    }

    // Fallback về quizAnswers
    if (activity.quiz.quizAnswers && activity.quiz.quizAnswers.length > 0) {
      return activity.quiz.quizAnswers
        .filter((answer) => answer.locationData)
        .map((answer) => answer.locationData);
    }

    // Default trả về array với location mặc định
    return [locationData];
  }, [
    activity.quiz.quizLocationAnswers,
    activity.quiz.locationAnswers,
    activity.quiz.quizAnswers,
    locationData,
  ]);

  // Validation function để kiểm tra vị trí có trùng lặp không
  const isLocationDuplicate = useCallback(
    (newLocation: LocationData) => {
      const threshold = 0.001; // Khoảng cách tối thiểu giữa 2 điểm (khoảng 100m)
      return userSelectedLocations.some(
        (existing) =>
          Math.abs(existing.lat - newLocation.lat) < threshold &&
          Math.abs(existing.lng - newLocation.lng) < threshold
      );
    },
    [userSelectedLocations]
  );

  // Chuyển handleSubmit thành useCallback
  const handleSubmit = useCallback(async () => {
    if (
      isSubmitting ||
      isSubmitted ||
      userSelectedLocations.length === 0 ||
      isQuizEnded
    )
      return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (onAnswerSubmit && userSelectedLocations.length > 0) {
        onAnswerSubmit(userSelectedLocations[0]); // Gọi với location đầu tiên để tương thích
      }

      if (sessionWebSocket) {
        if (!sessionCode && !sessionId) {
          console.warn('[QuizLocation] Thiếu cả sessionCode và sessionId');
          setError('Không thể xác định phiên. Vui lòng thử lại.');
          return;
        }

        // Validation số lượng đáp án so với yêu cầu
        const maxAnswers = correctAnswers.length;
        if (userSelectedLocations.length > maxAnswers) {
          console.error(
            `[QuizLocation] Quá nhiều đáp án: ${userSelectedLocations.length}/${maxAnswers}`
          );
          setError(`Chỉ được chọn tối đa ${maxAnswers} vị trí.`);
          setIsSubmitting(false);
          return;
        }

        // Validation cơ bản cho từng tọa độ
        for (const location of userSelectedLocations) {
          if (!location.lng || !location.lat) {
            console.error('[QuizLocation] Tọa độ không hợp lệ:', location);
            setError('Tọa độ không hợp lệ. Vui lòng chọn lại vị trí.');
            setIsSubmitting(false);
            return;
          }

          // Kiểm tra phạm vi tọa độ hợp lệ
          if (
            location.lng < -180 ||
            location.lng > 180 ||
            location.lat < -90 ||
            location.lat > 90
          ) {
            console.error(
              '[QuizLocation] Tọa độ ngoài phạm vi hợp lệ:',
              location
            );
            setError('Tọa độ ngoài phạm vi hợp lệ. Vui lòng chọn lại vị trí.');
            setIsSubmitting(false);
            return;
          }

          // Validation 6 chữ số thập phân
          const lngStr = location.lng.toFixed(6);
          const latStr = location.lat.toFixed(6);
          if (
            lngStr.split('.')[1]?.length !== 6 ||
            latStr.split('.')[1]?.length !== 6
          ) {
            console.error(
              '[QuizLocation] Tọa độ phải có đúng 6 chữ số thập phân'
            );
            setError('Coordinates must have exactly 6 decimal places');
            setIsSubmitting(false);
            return;
          }
        }

        // Tạo answerContent theo định dạng: longitude,latitude cho mỗi vị trí
        // Nhiều vị trí được nối bằng dấu phẩy: "lng1,lat1,lng2,lat2,lng3,lat3"
        const formattedCoordinates = userSelectedLocations
          .map(
            (location) =>
              `${location.lng.toFixed(6)},${location.lat.toFixed(6)}`
          )
          .join(',');

        const answerContent = formattedCoordinates;

        const payload = {
          sessionCode: sessionCode,
          activityId: activity.activityId,
          answerContent: answerContent, // Định dạng: "lng1,lat1,lng2,lat2,..." với 6 chữ số thập phân
        };

        console.log(
          '[QuizLocation] Gửi câu trả lời với multiple locations:',
          payload
        );
        console.log(
          '[QuizLocation] Số vị trí đã chọn:',
          userSelectedLocations.length
        );
        console.log('[QuizLocation] Tọa độ gốc:', userSelectedLocations);
        console.log('[QuizLocation] Tọa độ đã định dạng:', {
          answerContent: answerContent,
          locationCount: userSelectedLocations.length,
        });
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
  }, [
    isSubmitting,
    isSubmitted,
    userSelectedLocations,
    isQuizEnded,
    onAnswerSubmit,
    sessionWebSocket,
    sessionCode,
    sessionId,
    activity.activityId,
    correctAnswers.length,
  ]);

  // Cải thiện logic đếm ngược và tự động submit
  useEffect(() => {
    if (timeLeft <= 0) {
      // Khi hết thời gian, đánh dấu quiz kết thúc
      setIsQuizEnded(true);

      // Tự động submit câu trả lời nếu đã chọn nhưng chưa gửi
      if (userSelectedLocations.length && !isSubmitted && !isSubmitting) {
        console.log(
          '[QuizLocationViewer] Tự động gửi đáp án khi hết thời gian'
        );
        handleSubmit();
      }

      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [
    timeLeft,
    userSelectedLocations,
    isSubmitted,
    isSubmitting,
    handleSubmit,
  ]);

  useEffect(() => {
    if (
      timeLeft <= 0 ||
      (answeredCount > 0 && answeredCount >= totalParticipants)
    ) {
      setIsQuizEnded(true);
    }
  }, [timeLeft, answeredCount, totalParticipants]);

  // Tối ưu hóa cập nhật số người tham gia - chỉ cập nhật khi cần thiết
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

      // Chỉ cập nhật nếu có thay đổi
      setAnsweredCount((prev) => {
        if (prev !== participantsRatio.count) {
          return participantsRatio.count;
        }
        return prev;
      });

      setTotalParticipants((prev) => {
        if (prev !== participantsRatio.total) {
          return participantsRatio.total;
        }
        return prev;
      });
    };

    // Cập nhật ban đầu
    updateResponseRatio();

    // Giảm tần suất cập nhật từ 2s xuống 5s để tránh rerender quá nhiều
    const intervalId = setInterval(updateResponseRatio, 5000);

    // Đăng ký lắng nghe sự kiện participants update từ WebSocket
    sessionWebSocket.onParticipantsUpdateHandler(() => {
      updateResponseRatio();
    });

    return () => {
      console.log('[QuizLocation] Dọn dẹp cập nhật số người tham gia');
      clearInterval(intervalId);
    };
  }, [sessionWebSocket]);

  // Debug effect để log props của LocationQuestionPlayer
  useEffect(() => {
    console.log('[QuizLocationViewer] LocationQuestionPlayer props:', {
      locationData,
      userSelectedLocations,
      showCorrectLocation: isQuizEnded || activity.hostShowAnswer,
      disabled: isSubmitted || isQuizEnded,
      isQuizEnded,
      hostShowAnswer: activity.hostShowAnswer,
      isSubmitted,
    });
  }, [
    locationData,
    userSelectedLocations,
    isQuizEnded,
    activity.hostShowAnswer,
    isSubmitted,
  ]);

  // Fix for the handleLocationSelect function
  const handleLocationSelect = useCallback(
    (isCorrect: boolean, distance: number, userLocation?: LocationData) => {
      if (isSubmitted || isQuizEnded) return;

      // Lưu vị trí user chọn với validation
      if (userLocation) {
        // Use functional update to get the latest state
        setUserSelectedLocations((prevLocations) => {
          // Kiểm tra xem vị trí có trùng lặp không
          const isDuplicate = prevLocations.some(
            (existing) =>
              Math.abs(existing.lat - userLocation.lat) < 0.001 &&
              Math.abs(existing.lng - userLocation.lng) < 0.001
          );

          if (isDuplicate) {
            // Set error outside the functional update
            setTimeout(
              () =>
                setError('Vị trí này đã được chọn. Vui lòng chọn vị trí khác.'),
              0
            );
            return prevLocations; // Return unchanged
          }

          // Kiểm tra số lượng tối đa
          if (prevLocations.length >= correctAnswers.length) {
            setTimeout(
              () =>
                setError(
                  `Chỉ được chọn tối đa ${correctAnswers.length} vị trí.`
                ),
              0
            );
            return prevLocations; // Return unchanged
          }

          // Thêm vị trí mới vào danh sách
          const newLocations = [...prevLocations, userLocation];

          // Log after confirming we're going to add
          console.log(
            `[QuizLocation] Đã thêm vị trí ${newLocations.length}/${correctAnswers.length}:`,
            userLocation
          );

          setError(null); // Clear errors
          return newLocations;
        });
      }
    },
    [isSubmitted, isQuizEnded, correctAnswers.length]
  );

  // Fix for the removeSelectedLocation function
  const removeSelectedLocation = useCallback(
    (index: number) => {
      if (isSubmitted || isQuizEnded) return;

      setUserSelectedLocations((prevLocations) => {
        const newLocations = prevLocations.filter((_, i) => i !== index);
        console.log(
          `[QuizLocation] Đã xóa vị trí tại index ${index}, còn lại ${newLocations.length} vị trí`
        );
        return newLocations;
      });

      setError(null);
    },
    [isSubmitted, isQuizEnded]
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper function để tính số lượng đáp án đúng
  const getCorrectAnswersCount = useCallback(() => {
    return userSelectedLocations.filter((userLocation) =>
      correctAnswers.some((correctAnswer) => {
        const distance = getDistanceFromLatLonInKm(
          userLocation.lat,
          userLocation.lng,
          correctAnswer.lat,
          correctAnswer.lng
        );
        return distance <= correctAnswer.radius;
      })
    ).length;
  }, [userSelectedLocations, correctAnswers]);

  const calculateScore = () => {
    if (userSelectedLocations.length === 0) return 0;

    const correctMatches = getCorrectAnswersCount();
    const totalCorrectAnswers = correctAnswers.length;

    // Tính điểm: (số đáp án đúng / tổng số đáp án) * 100
    const score = Math.round((correctMatches / totalCorrectAnswers) * 100);

    console.log('[QuizLocation] Tính điểm multiple selection:', {
      userLocations: userSelectedLocations,
      correctAnswers,
      correctMatches,
      totalCorrectAnswers,
      score,
    });

    return score;
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
    <div
      className='min-h-full bg-transparent'
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <Card className='bg-black bg-opacity-30 backdrop-blur-md shadow-xl border border-white/5 text-white overflow-hidden'>
        {/* Header với thời gian và tiến trình */}
        <motion.div
          className='rounded-t-xl flex flex-col shadow-md relative overflow-hidden'
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
          <div className='absolute inset-0 bg-black bg-opacity-30' />

          {/* Status Bar */}
          <div className='sticky top-0 left-0 right-0 h-12 bg-black bg-opacity-40 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-5 text-white z-20'>
            <div className='flex items-center gap-3'>
              <div className='h-7 w-7 rounded-full bg-[rgb(198,234,132)] flex items-center justify-center shadow-md'>
                <MapPin className='h-4 w-4 text-black' />
              </div>
              <div className='text-xs capitalize font-medium text-white/80'>
                Location Quiz
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <motion.div
                className='flex items-center gap-1.5 bg-black bg-opacity-30 border border-white/10 px-2 py-1 rounded-full text-xs font-medium'
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
                <Clock className='h-3.5 w-3.5 text-[rgb(198,234,132)]' />
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
                        ? 'bg-black bg-opacity-30 border-[rgb(198,234,132)]/30 shadow-[rgb(198,234,132)]/10'
                        : 'bg-black bg-opacity-30 border-[rgb(255,198,121)]/30 shadow-[rgb(255,198,121)]/10'
                    } border border-white/10 px-2 py-1 rounded-full text-xs font-medium`}
                  animate={{
                    scale: answeredCount > 0 ? [1, 1.15, 1] : 1,
                    transition: { duration: 0.5 },
                  }}
                >
                  <Users className='h-3.5 w-3.5 text-[rgb(198,234,132)]' />
                  <span
                    className={
                      answeredCount >= totalParticipants
                        ? 'text-[rgb(198,234,132)]'
                        : 'text-[rgb(255,198,121)]'
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
          <div className='flex flex-col items-center z-10 px-4 md:px-6 py-6 md:py-8'>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className='w-full flex flex-col items-center justify-center'
            >
              <h2 className='text-base md:text-xl lg:text-2xl font-bold text-center text-white drop-shadow-lg'>
                {activity.quiz.questionText}
              </h2>
              {activity.description && (
                <p className='mt-2 text-xs md:text-sm text-white/80 text-center'>
                  {activity.description}
                </p>
              )}
            </motion.div>
          </div>
        </motion.div>

        {/* Progress Bars */}
        <div className='w-full'>
          {/* Time Progress */}
          <motion.div
            className='h-1 bg-[rgb(198,234,132)]'
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
            className='h-1 bg-[rgb(173,216,255)]'
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
        <div className='p-3 sm:p-6 bg-black bg-opacity-20'>
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

          {/* Selected Locations Display */}
          {userSelectedLocations.length > 0 && (
            <motion.div
              className='mt-4 p-4 rounded-xl bg-[#0e2838]/50 border border-[#aef359]/30'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className='flex items-center gap-2 mb-3'>
                <MapPin className='h-5 w-5 text-[#aef359]' />
                <span className='font-semibold text-[#aef359]'>
                  Vị trí đã chọn ({userSelectedLocations.length}/
                  {correctAnswers.length})
                </span>
              </div>
              <div className='space-y-2'>
                {userSelectedLocations.map((location, index) => (
                  <motion.div
                    key={index}
                    className='flex items-center justify-between bg-black/20 p-2 rounded-lg'
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className='flex items-center gap-2'>
                      <div className='h-3 w-3 rounded-full bg-[#aef359]'></div>
                      <span className='text-white/80 text-sm'>
                        Vị trí {index + 1}: {location.lat.toFixed(6)},{' '}
                        {location.lng.toFixed(6)}
                      </span>
                    </div>
                    {!isSubmitted && !isQuizEnded && (
                      <button
                        onClick={() => removeSelectedLocation(index)}
                        className='text-red-400 hover:text-red-300 p-1 rounded transition-colors'
                        title='Xóa vị trí này'
                      >
                        <X className='h-4 w-4' />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
              {userSelectedLocations.length < correctAnswers.length &&
                !isSubmitted &&
                !isQuizEnded && (
                  <p className='text-white/60 text-xs mt-2'>
                    Bạn có thể chọn thêm{' '}
                    {correctAnswers.length - userSelectedLocations.length} vị
                    trí nữa
                  </p>
                )}
            </motion.div>
          )}

          {/* Map */}
          <motion.div
            className='rounded-xl overflow-hidden shadow-xl border border-white/10'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <LocationQuestionPlayer
              questionText={activity.quiz.questionText}
              locationData={locationData}
              onAnswer={handleLocationSelect}
              showCorrectLocation={isQuizEnded || activity.hostShowAnswer}
              disabled={isSubmitted || isQuizEnded}
              userSelectedLocations={userSelectedLocations}
              correctAnswers={correctAnswers}
            />
          </motion.div>

          {/* Submit Button */}
          {!isSubmitted &&
            !isQuizEnded &&
            isParticipating &&
            userSelectedLocations.length > 0 && (
              <motion.div
                className='mt-6 w-full'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  className='w-full px-8 py-6 text-lg font-bold bg-gradient-to-r from-[#aef359] to-[#e4f88d] hover:from-[#9ee348] hover:to-[#d3e87c] text-slate-900 shadow-lg flex items-center justify-center gap-2'
                  disabled={isSubmitting || timeLeft <= 0}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: 'linear',
                        }}
                      >
                        <Loader2 className='h-5 w-5' />
                      </motion.div>
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

          {/* Show Time Expired Message when quiz has ended but not submitted
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
          )} */}

          {/* Results */}
          <AnimatePresence>
            {(isSubmitted && isQuizEnded) ||
            activity.hostShowAnswer ||
            isQuizEnded ? (
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
                      <span className='font-semibold'>Đáp án chính xác:</span>
                    </div>
                    <div className='space-y-2'>
                      {activity.quiz.quizAnswers
                        .filter((answer) => answer.isCorrect)
                        .map((answer, idx) => (
                          <div
                            key={idx}
                            className='flex items-center gap-2 text-white/80'
                          >
                            <div className='h-2 w-2 rounded-full bg-[#aef359]'></div>
                            <p>{answer.answerText}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                ) : isQuizEnded && !isSubmitted ? (
                  <div>
                    <div className='flex items-center gap-2 mb-3 text-[#aef359]'>
                      <CheckCircle className='h-5 w-5' />
                      <span className='font-semibold'>Vị trí chính xác:</span>
                    </div>
                    <p className='text-white/70 mb-3'>
                      Đây là vị trí đúng được hiển thị trên bản đồ.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className='flex items-center gap-2 mb-3'>
                      <CheckCircle className='h-5 w-5 text-[#aef359]' />
                      <span className='font-semibold text-[#aef359]'>
                        Đã gửi câu trả lời
                      </span>
                    </div>
                    {userSelectedLocations.length > 0 && (
                      <div className='space-y-3'>
                        <div className='bg-black/20 p-3 rounded-lg'>
                          <p className='text-white/90 font-medium mb-2'>
                            Kết quả phân tích:
                          </p>
                          <div className='grid grid-cols-3 gap-4 text-center'>
                            <div>
                              <p className='text-2xl font-bold text-[#aef359]'>
                                {getCorrectAnswersCount()}
                              </p>
                              <p className='text-xs text-white/60'>Đúng</p>
                            </div>
                            <div>
                              <p className='text-2xl font-bold text-white/90'>
                                {userSelectedLocations.length}
                              </p>
                              <p className='text-xs text-white/60'>Đã chọn</p>
                            </div>
                            <div>
                              <p className='text-2xl font-bold text-white/90'>
                                {correctAnswers.length}
                              </p>
                              <p className='text-xs text-white/60'>Tổng số</p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className='text-white/70 mb-2'>
                            {calculateScore() === 0
                              ? 'Chưa có vị trí nào đúng.'
                              : calculateScore() < 50
                              ? `Bạn đã đúng ${getCorrectAnswersCount()}/${
                                  correctAnswers.length
                                } vị trí. Cần cải thiện thêm!`
                              : calculateScore() < 100
                              ? `Khá tốt! Bạn đã đúng ${getCorrectAnswersCount()}/${
                                  correctAnswers.length
                                } vị trí.`
                              : `Xuất sắc! Bạn đã đúng tất cả ${correctAnswers.length} vị trí!`}
                          </p>
                          <div className='flex items-center justify-between'>
                            <p className='font-medium text-white/90'>
                              Điểm số:{' '}
                              <span className='text-[#aef359] text-xl font-bold'>
                                {calculateScore()}%
                              </span>
                            </p>
                            {calculateScore() === 100 && (
                              <div className='flex items-center gap-1 text-[#aef359]'>
                                <CheckCircle className='h-4 w-4' />
                                <span className='text-sm font-medium'>
                                  Hoàn hảo!
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
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
