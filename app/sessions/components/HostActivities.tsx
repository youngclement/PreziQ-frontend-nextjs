'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import InfoSlideViewer from '../show/components/info-slide-viewer';
import QuizButtonViewer from './QuizButtonViewer';
import HostSessionSummary from './HostSessionSummary';
import RealtimeLeaderboard from './RealtimeLeaderboard';
import HostRankingChange from './HostRankingChange';

import QuizCheckboxViewer from './QuizCheckboxViewer';
import QuizTypeAnswerViewer from './QuizTypeAnswerViewer';
import { QuizReorderViewer } from './QuizReorderViewer';
import QuizTrueOrFalseViewer from './QuizTrueOrFalseViewer';
import CountdownOverlay from './CountdownOverlay';
import {
  Loader2,
  ArrowRight,
  Users,
  Award,
  Clock,
  ArrowUpDown,
  BarChart,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Participant {
  guestName: string;
  guestAvatar: string;
  userId: string | null;
  realtimeScore: number;
  realtimeRanking: number;
}

interface HostActivitiesProps {
  sessionId: string;
  sessionCode: string;
  sessionWs: SessionWebSocket;
  onSessionEnd?: () => void;
  onNextActivityLog?: (activity: any) => void;
  isParticipating?: boolean;
}

interface ParticipantSummary {
  displayName: string;
  displayAvatar: string;
  finalScore: number;
  finalRanking: number;
  finalCorrectCount: number;
  finalIncorrectCount: number;
  participantId?: string;
  participantName?: string;
  totalScore?: number;
}

export default function HostActivities({
  sessionId,
  sessionCode,
  sessionWs,
  onSessionEnd,
  onNextActivityLog,
  isParticipating = true,
}: HostActivitiesProps) {
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Đã kết nối');
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [noMoreActivities, setNoMoreActivities] = useState(false);
  const [sessionSummaries, setSessionSummaries] = useState<
    ParticipantSummary[]
  >([]);
  const isMounted = useRef(true);
  const hasStartedFirstActivity = useRef(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [participantsEventCount, setParticipantsEventCount] = useState(0);
  const lastActivityIdRef = useRef<string | null>(null);

  // Thêm state để quản lý hiển thị bảng xếp hạng
  const [showRankingChange, setShowRankingChange] = useState(false);
  // Thêm state để lưu trữ id activity hiện tại để hiển thị bảng xếp hạng
  const [currentRankingActivityId, setCurrentRankingActivityId] = useState<
    string | null
  >(null);
  // Thêm state để kiểm soát thời điểm hiển thị nút xem bảng xếp hạng
  const [canShowRanking, setCanShowRanking] = useState(false);
  // State lưu trữ tỷ lệ người dùng đã trả lời
  const [responseRatio, setResponseRatio] = useState<{
    count: number;
    total: number;
    percentage: number;
  }>({
    count: 0,
    total: 0,
    percentage: 0,
  });

  // Thêm ref để theo dõi participants
  const prevParticipantsRef = useRef<{ [key: string]: number }>({});

  // Thêm ref để theo dõi element của quiz cho chế độ toàn màn hình
  const quizContainerRef = useRef<HTMLDivElement>(null);

  // Thêm biến state để theo dõi trạng thái luồng hoạt động
  const [activityTransitionState, setActivityTransitionState] = useState<
    'showing_current' | 'showing_ranking' | 'transitioning_to_next'
  >('showing_current');

  // Hàm toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Vào chế độ toàn màn hình
      if (quizContainerRef.current?.requestFullscreen) {
        quizContainerRef.current
          .requestFullscreen()
          .then(() => {
            setIsFullscreenMode(true);
          })
          .catch((err) => {
            console.error('Không thể mở chế độ toàn màn hình:', err);
          });
      }
    } else {
      // Thoát chế độ toàn màn hình
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => {
            setIsFullscreenMode(false);
          })
          .catch((err) => {
            console.error('Không thể thoát chế độ toàn màn hình:', err);
          });
      }
    }
  };

  // Theo dõi sự kiện fullscreenchange
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenMode(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    isMounted.current = true;

    if (!sessionWs) return;

    // Đăng ký các event handlers cho socket đã được kết nối
    sessionWs.onParticipantsUpdateHandler((updatedParticipants) => {
      if (!isMounted.current) return;

      console.log(
        '[HostActivities] Nhận cập nhật danh sách người tham gia:',
        updatedParticipants
      );

      if (
        !Array.isArray(updatedParticipants) ||
        updatedParticipants.length === 0
      ) {
        console.warn(
          '[HostActivities] Dữ liệu participants không hợp lệ hoặc rỗng:',
          updatedParticipants
        );
        return;
      }

      // Lấy thông tin tỷ lệ tham gia từ WebSocket
      const participantsRatio = sessionWs.getParticipantsEventRatio();
      setParticipantsEventCount(participantsRatio.count);
      setResponseRatio(participantsRatio); // Cập nhật state lưu trữ tỷ lệ

      console.log(
        `[HostActivities] Đã nhận sự kiện participants lần thứ ${
          participantsRatio.count
        }/${participantsRatio.total} (${
          participantsRatio.percentage
        }%) cho activity: ${sessionWs.getCurrentActivityId()}`
      );

      // Nếu tất cả người dùng đã phản hồi, cho phép hiển thị bảng xếp hạng
      if (participantsRatio.percentage >= 100 && currentActivity) {
        setCanShowRanking(true);
        setCurrentRankingActivityId(currentActivity.activityId);
      }

      // Đảm bảo các trường dữ liệu được chuẩn hóa
      const sanitizedParticipants = updatedParticipants.map((p) => ({
        ...p,
        realtimeScore:
          typeof p.realtimeScore === 'number' ? p.realtimeScore : 0,
        displayName: p.displayName || 'Unknown',
        displayAvatar:
          p.displayAvatar || 'https://api.dicebear.com/9.x/pixel-art/svg',
      }));

      // Sắp xếp người tham gia theo điểm số giảm dần
      const sortedParticipants = [...sanitizedParticipants].sort(
        (a, b) => b.realtimeScore - a.realtimeScore
      );

      // Cập nhật thứ hạng cho mỗi người tham gia
      const participantsWithRanking = sortedParticipants.map(
        (participant, index) => ({
          ...participant,
          realtimeRanking: index + 1,
        })
      );

      // Chuyển đổi sang định dạng cần thiết cho HostActivities
      const participantsData = participantsWithRanking.map((p) => ({
        guestName: p.displayName,
        guestAvatar: p.displayAvatar,
        userId: p.user?.userId || null,
        realtimeScore: p.realtimeScore,
        realtimeRanking: p.realtimeRanking,
      }));

      console.log(
        '[HostActivities] Đã xử lý dữ liệu participants:',
        participantsData
      );
      setParticipants(participantsData);
    });

    sessionWs.onSessionEndHandler((session) => {
      if (!isMounted.current) return;

      // Chỉ gọi callback onSessionEnd
      if (onSessionEnd) onSessionEnd();
    });

    sessionWs.onSessionSummaryHandler((summaries) => {
      if (!isMounted.current) return;

      if (Array.isArray(summaries) && summaries.length > 0) {
        setSessionSummaries(summaries);
      }
    });

    sessionWs.onNextActivityHandler((activity) => {
      if (!isMounted.current) return;
      console.log('Next activity received:', activity);
      if (onNextActivityLog) onNextActivityLog(activity);

      if (!activity) {
        console.log('No more activities in session, preparing to end session');
        setNoMoreActivities(true);

        setTimeout(() => {
          if (isMounted.current && sessionId) {
            sessionWs.endSession(sessionId).catch((err) => {
              console.error('Error ending session automatically:', err);
            });
          }
        }, 1000);
      } else {
        // Reset state khi nhận activity mới
        setCanShowRanking(false);

        // Cập nhật số đếm trên UI dựa trên giá trị từ WebSocket
        setParticipantsEventCount(sessionWs.getParticipantsEventCount());
        lastActivityIdRef.current = activity.activityId || null;
        console.log(
          `[HostActivities] Chuyển sang activity mới: ${activity.activityId}, reset bộ đếm participants events`
        );

        setCurrentActivity(activity);
        setNoMoreActivities(false);
      }
    });

    sessionWs.onErrorHandler((error) => {
      if (!isMounted.current) return;

      if (error && error.includes('No more activities in session')) {
        setNoMoreActivities(true);

        setTimeout(() => {
          if (isMounted.current && sessionId) {
            sessionWs.endSession(sessionId).catch((err) => {
              console.error('Error ending session automatically:', err);
            });
          }
        }, 1000);
      }

      setError(error);
    });

    sessionWs.onConnectionStatusChangeHandler((status) => {
      if (!isMounted.current) return;
      setConnectionStatus(status);
      setIsConnected(status === 'Connected');
    });

    if (!hasStartedFirstActivity.current && sessionWs && sessionId) {
      hasStartedFirstActivity.current = true;
      setTimeout(() => {
        setShowCountdown(true);
        sessionWs.nextActivity(sessionId).catch((err) => {
          console.error('Error starting first activity:', err);
          setError('Failed to start first activity');
        });
      }, 100);
    }

    return () => {
      isMounted.current = false;
      // Không hủy đăng ký handlers khi unmount để duy trì kết nối
    };
  }, [sessionWs, sessionId, onSessionEnd, onNextActivityLog]);

  // Thêm useEffect để xử lý theo dõi sự thay đổi xếp hạng
  useEffect(() => {
    if (!sessionWs || !currentActivity) return;

    // Lắng nghe sự kiện thay đổi xếp hạng
    const unsubscribe = sessionWs.subscribeToRankingChanges((data) => {
      // Khi nhận được dữ liệu thay đổi xếp hạng mới, cho phép hiển thị nút bảng xếp hạng
      if (responseRatio.percentage >= 100) {
        setCanShowRanking(true);
        setCurrentRankingActivityId(currentActivity.activityId);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionWs, currentActivity, responseRatio.percentage]);

  // Cập nhật phần hiển thị bảng xếp hạng
  useEffect(() => {
    if (!sessionWs) return;

    // Khi tỷ lệ phản hồi đạt 100%, tự động lưu snapshot xếp hạng
    if (responseRatio.percentage >= 100 && currentActivity?.activityId) {
      // Tự động lưu snapshot
      sessionWs.saveCurrentRankingSnapshot(currentActivity.activityId);
      setCurrentRankingActivityId(currentActivity.activityId);
      setCanShowRanking(true);
    }
  }, [responseRatio.percentage, sessionWs, currentActivity]);

  const handleNextActivity = async () => {
    if (!sessionWs || !sessionWs.isClientConnected()) {
      setError('Không thể chuyển hoạt động lúc này');
      return;
    }

    // Nếu đang trong trạng thái hiển thị activity hiện tại, chuyển sang hiển thị bảng xếp hạng
    if (activityTransitionState === 'showing_current') {
      if (currentActivity && currentActivity.activityId) {
        // Lưu snapshot thứ hạng hiện tại và thông báo cho subscribers
        sessionWs.requestRankingUpdate(currentActivity.activityId);
        setCurrentRankingActivityId(currentActivity.activityId);
        setShowRankingChange(true);
        setActivityTransitionState('showing_ranking');
      } else {
        // Trường hợp không có dữ liệu để hiển thị bảng xếp hạng, chuyển thẳng sang activity tiếp theo
        proceedToNextActivity();
      }
      return;
    }

    // Nếu đang hiển thị bảng xếp hạng, đóng bảng xếp hạng và chuyển sang activity tiếp theo
    if (activityTransitionState === 'showing_ranking') {
      setShowRankingChange(false);
      proceedToNextActivity();
      return;
    }
  };

  // Hàm thực hiện việc chuyển sang activity tiếp theo
  const proceedToNextActivity = async () => {
    try {
      setShowCountdown(true);
      setIsLoading(true);
      setActivityTransitionState('transitioning_to_next');

      const currentActivityId = currentActivity?.activityId;
      console.log(
        `[HostActivities] Bắt đầu chuyển sang activity mới, reset bộ đếm participants events`
      );

      await sessionWs.nextActivity(sessionId, currentActivityId);

      // Cập nhật UI với giá trị mới từ WebSocket
      setParticipantsEventCount(sessionWs.getParticipantsEventCount());
    } catch (err) {
      setError('Không thể chuyển hoạt động');
      console.error('Error moving to next activity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Cập nhật hàm đóng bảng xếp hạng
  const handleCloseRankingChange = () => {
    setShowRankingChange(false);
    setActivityTransitionState('showing_current');
  };

  // Cập nhật hàm handleCountdownComplete
  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setActivityTransitionState('showing_current');
  };

  const handleEndSession = async () => {
    if (!isConnected || !sessionWs || !sessionId) {
      setError(
        'WebSocket không được kết nối. Vui lòng đợi hoặc làm mới trang.'
      );
      return;
    }

    try {
      await sessionWs.endSession(sessionId);
      if (onSessionEnd) onSessionEnd();
    } catch (err) {
      setError('Không thể kết thúc phiên');
    }
  };

  const handleScoreUpdate = (score: number, id: string | undefined) => {
    // Host không cần cập nhật score của chính mình
    console.log(
      '[HostActivities] Nhận cập nhật điểm trong host view:',
      score,
      id
    );
  };

  useEffect(() => {
    // Kiểm tra thay đổi điểm số giữa các cập nhật
    const participantScoreChanged = participants.some((p) => {
      const prevScore = prevParticipantsRef.current[p.guestName];
      return prevScore !== undefined && prevScore !== p.realtimeScore;
    });

    if (participantScoreChanged && participants.length > 0) {
      console.log(
        '[HostActivities] Phát hiện thay đổi điểm số:',
        participants.map((p) => ({ name: p.guestName, score: p.realtimeScore }))
      );
    }

    // Cập nhật ref cho lần kiểm tra tiếp theo
    const newScores: { [key: string]: number } = {};
    participants.forEach((p) => {
      newScores[p.guestName] = p.realtimeScore;
    });
    prevParticipantsRef.current = newScores;
  }, [participants]);

  // Thêm lại useEffect để phát hiện phím mũi tên sang phải
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isConnected && !noMoreActivities) {
        // Xử lý phím mũi tên phải
        if (event.key === 'ArrowRight') {
          // Sử dụng handleNextActivity thay vì tự xử lý
          handleNextActivity();
        }

        // Thêm xử lý phím mũi tên trái - logic tương tự mũi tên phải
        if (event.key === 'ArrowLeft') {
          // Nếu đang ở trạng thái hiển thị activity hiện tại, chuyển sang hiển thị bảng xếp hạng
          if (activityTransitionState === 'showing_current') {
            if (
              currentActivity &&
              currentActivity.activityId &&
              canShowRanking
            ) {
              // Lưu snapshot thứ hạng hiện tại và thông báo cho subscribers
              sessionWs.requestRankingUpdate(currentActivity.activityId);
              setCurrentRankingActivityId(currentActivity.activityId);
              setShowRankingChange(true);
              setActivityTransitionState('showing_ranking');
            }
          }
          // Nếu đang hiển thị bảng xếp hạng, đóng bảng xếp hạng và chuyển sang activity tiếp theo
          else if (activityTransitionState === 'showing_ranking') {
            setShowRankingChange(false);
            proceedToNextActivity();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isConnected,
    noMoreActivities,
    activityTransitionState,
    handleNextActivity,
    canShowRanking,
    currentActivity,
    sessionWs,
  ]);

  // Thêm lại useEffect để cập nhật participantsEventCount định kỳ
  useEffect(() => {
    if (!sessionWs) return;

    const intervalId = setInterval(() => {
      const participantsRatio = sessionWs.getParticipantsEventRatio();
      setParticipantsEventCount(participantsRatio.count);
    }, 2000); // Cập nhật mỗi 2 giây

    return () => {
      clearInterval(intervalId);
    };
  }, [sessionWs]);

  // Thêm lại câu điều kiện để hiển thị HostSessionSummary
  if (sessionSummaries.length > 0) {
    return (
      <HostSessionSummary
        sessionId={sessionId}
        sessionCode={sessionCode}
        participants={sessionSummaries}
        onNavigateToHome={() => (window.location.href = '/sessions/host')}
      />
    );
  }

  // Thêm lại hàm renderActivityContent
  const renderActivityContent = () => {
    if (isLoading) {
      return (
        <div className='flex flex-col items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin mb-2 text-[#aef359]' />
          <p className='text-white/70'>Đang tải hoạt động...</p>
        </div>
      );
    }

    if (!currentActivity) {
      return (
        <div className='text-center py-12'>
          <p className='mb-2 text-lg text-white/70'>Chưa có hoạt động nào</p>
          <p className='text-sm text-white/50'>
            Bắt đầu phiên học để hiển thị hoạt động đầu tiên
          </p>
        </div>
      );
    }

    return renderActivityByType();
  };

  // Thêm lại hàm renderActivityByType
  const renderActivityByType = () => {
    // Nếu host không tham gia, hiển thị chỉ xem cho tất cả các hoạt động
    if (!isParticipating) {
      return (
        <div className='relative'>
          {/* Overlay trong suốt để ngăn tương tác nhưng không che nội dung */}
          <div className='absolute inset-0 z-10 pointer-events-auto'></div>

          {/* Nút hiển thị đáp án cho host không tham gia */}
          {isQuizActivity(currentActivity?.activityType) && (
            <div className='absolute top-4 right-4 z-20'>
              <Button
                onClick={() => {
                  // Chuyển thông tin showAnswer = true vào component Quiz
                  const updatedActivity = {
                    ...currentActivity,
                    hostShowAnswer: true,
                  };
                  setCurrentActivity(updatedActivity);
                }}
                className='bg-gradient-to-r from-[#aef359] to-[#e4f88d] hover:from-[#9ee348] hover:to-[#d3e87c] text-slate-900 font-medium shadow-md border border-[#aef359]/20'
              >
                Hiển thị đáp án
              </Button>
            </div>
          )}

          {/* Hiển thị nội dung activity bình thường nhưng vô hiệu hóa tương tác */}
          <div className='pointer-events-none'>{renderRegularActivity()}</div>
        </div>
      );
    }

    return renderRegularActivity();
  };

  // Thêm hàm kiểm tra loại activity là quiz hay không
  const isQuizActivity = (activityType?: string): boolean => {
    return (
      activityType === 'QUIZ_BUTTONS' ||
      activityType === 'QUIZ_CHECKBOXES' ||
      activityType === 'QUIZ_REORDER' ||
      activityType === 'QUIZ_TYPE_ANSWER' ||
      activityType === 'QUIZ_TRUE_OR_FALSE' ||
      activityType === 'QUIZ_LOCATION'
    );
  };

  // Thêm lại hàm renderRegularActivity
  const renderRegularActivity = () => {
    switch (currentActivity.activityType) {
      case 'INFO_SLIDE':
        return <InfoSlideViewer activity={currentActivity} />;
      case 'QUIZ_BUTTONS':
        return (
          <QuizButtonViewer
            activity={currentActivity}
            sessionCode={sessionCode}
            sessionWebSocket={sessionWs}
          />
        );
      case 'QUIZ_CHECKBOXES':
        return (
          <QuizCheckboxViewer
            key={currentActivity.activityId}
            activity={currentActivity}
            sessionId={sessionId}
            sessionWebSocket={sessionWs}
          />
        );
      case 'QUIZ_TYPE_ANSWER':
        return (
          <QuizTypeAnswerViewer
            key={currentActivity.activityId}
            activity={currentActivity}
            sessionId={sessionId}
            sessionWebSocket={sessionWs}
          />
        );
      case 'QUIZ_REORDER':
        return (
          <QuizReorderViewer
            key={currentActivity.activityId}
            activity={currentActivity}
            sessionId={sessionId}
            sessionWebSocket={sessionWs}
          />
        );
      case 'QUIZ_TRUE_OR_FALSE':
        return (
          <QuizTrueOrFalseViewer
            key={currentActivity.activityId}
            activity={currentActivity}
            sessionId={sessionId}
            sessionWebSocket={sessionWs}
          />
        );
      default:
        return (
          <div className='text-center py-6 text-white/70'>
            Loại hoạt động không được hỗ trợ
          </div>
        );
    }
  };

  // Đặt CountdownOverlay ở mức cao nhất với vị trí z-index lớn để luôn hiển thị đè lên mọi phần tử
  return (
    <div className='min-h-screen bg-gradient-to-b from-[#0a1b25] to-[#0f2231] text-white'>
      {/* Hiển thị CountdownOverlay với z-index cao hơn các phần tử khác khi KHÔNG ở chế độ toàn màn hình */}
      {showCountdown && !isFullscreenMode && (
        <div className='fixed inset-0 z-[9999]'>
          <CountdownOverlay onComplete={handleCountdownComplete} />
        </div>
      )}

      {/* Hiển thị component HostRankingChange khi showRankingChange = true và KHÔNG ở chế độ toàn màn hình */}
      {showRankingChange && currentRankingActivityId && !isFullscreenMode && (
        <HostRankingChange
          sessionWebSocket={sessionWs}
          currentActivityId={currentRankingActivityId}
          onClose={handleCloseRankingChange}
          isFullscreenMode={false}
        />
      )}

      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        {/* Gradient orbs with reduced opacity */}
        <motion.div
          className='absolute top-10 left-10 w-32 h-32 bg-[#aef359] rounded-full filter blur-[80px]'
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className='absolute bottom-10 right-10 w-32 h-32 bg-[#e4f88d] rounded-full filter blur-[80px]'
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />

        {/* Dotted grid */}
        <div className='absolute inset-0 bg-[radial-gradient(rgba(174,243,89,0.03)_1px,transparent_1px)] bg-[size:20px_20px]' />
      </div>

      {/* Header - ẩn trong chế độ toàn màn hình */}
      {!isFullscreenMode && (
        <div className='bg-[#0e1c26]/90 backdrop-blur-md border-b border-white/5 p-4 shadow-lg sticky top-0 z-50'>
          <div className='container mx-auto flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <motion.h1
                className='text-xl md:text-2xl font-bold bg-gradient-to-r from-[#aef359] to-[#e4f88d] text-transparent bg-clip-text'
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                PreziQ Host
              </motion.h1>
              <motion.div
                className='bg-[#0e2838]/80 px-3 py-1 rounded-full text-sm text-white/80 border border-white/10 shadow-inner'
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                Mã: {sessionCode}
              </motion.div>
            </div>

            <div className='flex items-center gap-2'>
              <div className='text-sm text-white/60 hidden md:block'>
                {connectionStatus}
              </div>

              <motion.div
                key={`${participantsEventCount}-${participants.length}`}
                className={`px-3 py-1 rounded-full text-sm text-white/80 border shadow-inner hidden md:block ${
                  sessionWs.getParticipantsEventRatio().percentage >= 100
                    ? 'bg-[#0e2838]/80 border-[#aef359]/30 shadow-[#aef359]/10'
                    : 'bg-[#0e2838]/80 border-amber-500/30 shadow-amber-500/10'
                }`}
                animate={{
                  scale: [1, 1.05, 1],
                  transition: { duration: 0.3 },
                }}
              >
                <span
                  className={
                    sessionWs.getParticipantsEventRatio().percentage >= 100
                      ? 'text-[#aef359]'
                      : 'text-amber-400'
                  }
                >
                  Đã trả lời:
                </span>{' '}
                <span className='font-medium'>
                  {sessionWs.getParticipantsEventRatio().count}
                </span>
                <span className='text-white/50'>
                  /{sessionWs.getParticipantsEventRatio().total}
                </span>
                <span className='ml-1 text-xs opacity-75'>
                  ({sessionWs.getParticipantsEventRatio().percentage}%)
                </span>
              </motion.div>

              {/* Thêm nút hiển thị bảng xếp hạng (chỉ hiển thị khi canShowRanking = true) */}
              {canShowRanking && (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='ml-2'
                >
                  <Button
                    onClick={handleNextActivity}
                    className='bg-gradient-to-r from-purple-600/70 to-blue-500/70 hover:from-purple-600/80 hover:to-blue-500/80 text-white border border-purple-400/30 flex items-center gap-2'
                  >
                    <BarChart className='h-4 w-4' />
                    <span>Xếp hạng</span>
                  </Button>
                </motion.div>
              )}
            </div>

            <div className='flex space-x-3'>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={handleNextActivity}
                  disabled={!isConnected || noMoreActivities}
                  className='bg-gradient-to-r from-[#aef359] to-[#e4f88d] hover:from-[#9ee348] hover:to-[#d3e87c] text-slate-900 font-medium disabled:opacity-50 flex items-center gap-2'
                >
                  Hoạt động tiếp theo
                  <ArrowRight className='h-4 w-4' />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  variant='destructive'
                  onClick={handleEndSession}
                  disabled={!isConnected}
                  className='bg-red-500/80 hover:bg-red-600/90 text-white border border-red-600/30'
                >
                  Kết thúc phiên
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`${
          isFullscreenMode ? 'p-0' : 'container mx-auto px-4 py-6'
        }`}
      >
        {!isFullscreenMode && (
          <div className='text-sm text-center text-white/50 mb-4 md:hidden'>
            {connectionStatus}
          </div>
        )}

        <AnimatePresence>
          {error && !noMoreActivities && !isFullscreenMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className='mb-6'
            >
              <Alert
                variant='destructive'
                className='bg-red-500/20 border border-red-500 text-white'
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Controls - fixed position buttons for fullscreen & sidebar toggle */}
        <motion.div
          className='fixed top-4 right-4 z-50 flex flex-col gap-2'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {/* Fullscreen Toggle Button */}
          <motion.button
            onClick={toggleFullscreen}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`p-2 rounded-full ${
              isFullscreenMode
                ? 'bg-[#aef359] text-[#0a1b25]'
                : 'bg-[#0e2838] text-[#aef359]'
            } shadow-lg border border-white/10`}
            title={
              isFullscreenMode ? 'Thoát toàn màn hình' : 'Chế độ toàn màn hình'
            }
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              strokeLinecap='round'
              strokeLinejoin='round'
            >
              {isFullscreenMode ? (
                <>
                  <path d='M8 3v4a1 1 0 0 1-1 1H3'></path>
                  <path d='M21 8h-4a1 1 0 0 1-1-1V3'></path>
                  <path d='M3 16h4a1 1 0 0 1 1 1v4'></path>
                  <path d='M16 21v-4a1 1 0 0 1 1-1h4'></path>
                </>
              ) : (
                <>
                  <path d='M3 8V5a2 2 0 0 1 2-2h3'></path>
                  <path d='M19 8V5a2 2 0 0 0-2-2h-3'></path>
                  <path d='M3 16v3a2 2 0 0 0 2 2h3'></path>
                  <path d='M19 16v3a2 2 0 0 1-2 2h-3'></path>
                </>
              )}
            </svg>
          </motion.button>
        </motion.div>

        {/* Floating Controls for fullscreen mode - fixed position always visible */}
        {isFullscreenMode && (
          <motion.div
            className='fixed top-4 left-4 z-50 flex items-center gap-3 bg-[#0e1c26]/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl'
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className='bg-[#0e2838]/80 px-3 py-1 rounded-full text-sm text-white/80 border border-white/10 shadow-inner'>
              Mã: {sessionCode}
            </div>
            <motion.div
              key={`${participantsEventCount}-${participants.length}`}
              className={`px-3 py-1 rounded-full text-sm text-white/80 border shadow-inner ${
                sessionWs.getParticipantsEventRatio().percentage >= 100
                  ? 'bg-[#0e2838]/80 border-[#aef359]/30 shadow-[#aef359]/10'
                  : 'bg-[#0e2838]/80 border-amber-500/30 shadow-amber-500/10'
              }`}
              animate={{
                scale: [1, 1.05, 1],
                transition: { duration: 0.3 },
              }}
            >
              <span
                className={
                  sessionWs.getParticipantsEventRatio().percentage >= 100
                    ? 'text-[#aef359]'
                    : 'text-amber-400'
                }
              >
                Đã trả lời:
              </span>{' '}
              <span className='font-medium'>
                {sessionWs.getParticipantsEventRatio().count}
              </span>
              <span className='text-white/50'>
                /{sessionWs.getParticipantsEventRatio().total}
              </span>
              <span className='ml-1 text-xs opacity-75'>
                ({sessionWs.getParticipantsEventRatio().percentage}%)
              </span>
            </motion.div>

            {/* Nút xem bảng xếp hạng - hiển thị khi activityTransitionState = 'showing_current' và canShowRanking = true */}
            {canShowRanking &&
              activityTransitionState === 'showing_current' && (
                <motion.button
                  onClick={() => {
                    if (currentActivity && currentActivity.activityId) {
                      sessionWs.requestRankingUpdate(
                        currentActivity.activityId
                      );
                      setCurrentRankingActivityId(currentActivity.activityId);
                      setShowRankingChange(true);
                      setActivityTransitionState('showing_ranking');
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className='bg-gradient-to-r from-purple-600/70 to-blue-500/70 hover:from-purple-600/80 hover:to-blue-500/80 text-white border border-purple-400/30 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md'
                >
                  <BarChart className='h-4 w-4' />
                  <span className='font-medium'>Bảng xếp hạng</span>
                </motion.button>
              )}

            {/* Nút chuyển sang activity tiếp theo - hiển thị khi activityTransitionState = 'showing_ranking' */}
            {activityTransitionState === 'showing_ranking' && (
              <motion.button
                onClick={() => {
                  setShowRankingChange(false);
                  proceedToNextActivity();
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className='bg-gradient-to-r from-[#aef359] to-[#e4f88d] hover:from-[#9ee348] hover:to-[#d3e87c] text-slate-900 font-medium disabled:opacity-50 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-md'
              >
                <span className='font-medium'>Tiếp theo</span>
                <ArrowRight className='h-4 w-4' />
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Always visible Next Activity button in fullscreen mode */}
        {isFullscreenMode &&
          activityTransitionState === 'showing_current' &&
          !canShowRanking && (
            <motion.div
              className='fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 bg-[#0e1c26]/90 backdrop-blur-md px-4 py-3 rounded-full border border-white/10 shadow-xl'
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <motion.button
                onClick={handleNextActivity}
                disabled={!isConnected || noMoreActivities}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='bg-gradient-to-r from-[#aef359] to-[#e4f88d] hover:from-[#9ee348] hover:to-[#d3e87c] text-slate-900 font-bold disabled:opacity-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg'
              >
                <span className='text-base'>Hoạt động tiếp theo</span>
                <ArrowRight className='h-5 w-5' />
              </motion.button>

              <motion.button
                onClick={handleEndSession}
                disabled={!isConnected}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='bg-red-500/80 hover:bg-red-600/90 text-white font-medium border border-red-600/30 flex items-center gap-2 px-4 py-3 rounded-full shadow-md'
              >
                <span>Kết thúc phiên</span>
              </motion.button>
            </motion.div>
          )}

        {/* Hiển thị nút xác nhận tiếp tục khi đang xem bảng xếp hạng */}
        {isFullscreenMode && activityTransitionState === 'showing_ranking' && (
          <motion.div
            className='fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 bg-[#0e1c26]/90 backdrop-blur-md px-4 py-3 rounded-full border border-white/10 shadow-xl'
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <motion.button
              onClick={() => {
                setShowRankingChange(false);
                proceedToNextActivity();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className='bg-gradient-to-r from-[#aef359] to-[#e4f88d] hover:from-[#9ee348] hover:to-[#d3e87c] text-slate-900 font-bold flex items-center gap-2 px-5 py-3 rounded-full shadow-lg'
            >
              <span className='text-base'>Tiếp tục</span>
              <ArrowRight className='h-5 w-5' />
            </motion.button>

            <motion.button
              onClick={handleEndSession}
              disabled={!isConnected}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className='bg-red-500/80 hover:bg-red-600/90 text-white font-medium border border-red-600/30 flex items-center gap-2 px-4 py-3 rounded-full shadow-md'
            >
              <span>Kết thúc phiên</span>
            </motion.button>
          </motion.div>
        )}

        {/* Main layout with sidebar */}
        <div className='relative flex' ref={quizContainerRef}>
          {/* Main quiz content - adjusts width based on sidebar */}
          <div
            className={`flex-grow transition-all duration-300 ease-in-out ${
              isSidebarCollapsed ? 'w-full' : 'w-2/3 md:w-3/4'
            }`}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`
                bg-[#0e1c26]/80 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-white/5
                ${isFullscreenMode ? 'h-screen rounded-none border-0' : ''}
              `}
            >
              {!isFullscreenMode && (
                <div className='bg-gradient-to-r from-[#0e2838]/80 to-[#183244]/80 px-6 py-4 border-b border-white/10'>
                  <h2 className='text-xl font-bold bg-gradient-to-r from-[#aef359] to-[#e4f88d] text-transparent bg-clip-text'>
                    Hoạt động hiện tại
                  </h2>
                </div>
              )}
              <div
                className={`${
                  isFullscreenMode
                    ? 'h-screen flex items-center justify-center'
                    : 'p-6'
                }`}
              >
                {/* Hiển thị CountdownOverlay trong phần nội dung khi ở chế độ toàn màn hình */}
                {showCountdown && isFullscreenMode && (
                  <div className='absolute inset-0 z-50'>
                    <CountdownOverlay onComplete={handleCountdownComplete} />
                  </div>
                )}

                {/* Hiển thị HostRankingChange trong phần nội dung khi ở chế độ toàn màn hình */}
                {showRankingChange &&
                  currentRankingActivityId &&
                  isFullscreenMode && (
                    <div className='absolute inset-0 z-50'>
                      <HostRankingChange
                        sessionWebSocket={sessionWs}
                        currentActivityId={currentRankingActivityId}
                        onClose={handleCloseRankingChange}
                        isFullscreenMode={true}
                      />
                    </div>
                  )}

                {noMoreActivities ? (
                  <div className='text-center py-8 bg-[#0e2838]/30 rounded-lg border border-yellow-500/20'>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Clock className='h-12 w-12 text-yellow-500/70 mx-auto mb-4' />
                      <p className='text-lg font-medium text-yellow-500/90 mb-2'>
                        Không còn hoạt động nào nữa
                      </p>
                      <p className='text-white/50'>
                        Phiên học sẽ tự động kết thúc trong giây lát...
                      </p>
                    </motion.div>
                  </div>
                ) : (
                  <div
                    className={`
                    ${
                      isFullscreenMode
                        ? 'max-w-[90%] w-full transition-all duration-300 transform scale-110'
                        : ''
                    }
                  `}
                  >
                    {renderActivityContent()}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar toggle button positioned on the boundary */}
          <div className='fixed right-0 top-1/2 transform -translate-y-1/2 z-50'>
            <motion.button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`p-3 rounded-l-xl ${
                isSidebarCollapsed
                  ? 'bg-[#aef359] text-[#0e1c26]'
                  : 'bg-[#0e2838] text-[#aef359]'
              } shadow-lg border border-r-0 border-[#aef359]/30 flex items-center justify-center`}
              title={
                isSidebarCollapsed ? 'Hiện bảng xếp hạng' : 'Ẩn bảng xếp hạng'
              }
            >
              {isSidebarCollapsed ? (
                <Users className='h-5 w-5' />
              ) : (
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  width='20'
                  height='20'
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  strokeWidth='2'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                >
                  <polyline points='15 18 9 12 15 6'></polyline>
                </svg>
              )}
            </motion.button>
          </div>

          {/* Leaderboard sidebar */}
          <motion.div
            className={`fixed right-0 top-0 bottom-0 bg-[#0e1c26]/95 backdrop-blur-md z-40 shadow-xl border-l border-white/10
              overflow-hidden ${
                isFullscreenMode ? 'top-0 h-full' : 'top-[73px]'
              }`}
            initial={false}
            animate={{
              width: isSidebarCollapsed ? '0' : 'min(85vw, 350px)',
              opacity: isSidebarCollapsed ? 0 : 1,
              x: isSidebarCollapsed ? '100%' : '0%',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className='p-4 h-full flex flex-col'>
              <div className='mb-4 flex items-center justify-between'>
                <h2 className='text-lg font-semibold flex items-center gap-2 text-white/90'>
                  <Users className='h-5 w-5 text-[#aef359]' />
                  <span>Người tham gia</span>
                  <motion.span
                    key={participants.length}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className='ml-2 bg-[#0e2838]/80 px-2 py-0.5 rounded-full text-sm text-[#aef359] border border-[#aef359]/20'
                  >
                    {participants.length}
                  </motion.span>
                </h2>

                <motion.button
                  className='bg-[#0e2838]/50 p-1.5 rounded-full border border-white/10 shadow-inner'
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSidebarCollapsed(true)}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='16'
                    height='16'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='text-[#aef359]'
                  >
                    <line x1='18' y1='6' x2='6' y2='18'></line>
                    <line x1='6' y1='6' x2='18' y2='18'></line>
                  </svg>
                </motion.button>
              </div>

              <div className='flex-grow overflow-auto pr-1 custom-scrollbar'>
                <RealtimeLeaderboard
                  participants={participants.map((p) => ({
                    displayName: p.guestName,
                    displayAvatar: p.guestAvatar,
                    realtimeScore: p.realtimeScore,
                    realtimeRanking: p.realtimeRanking,
                    id: p.userId || undefined,
                  }))}
                  onScoreUpdate={handleScoreUpdate}
                  // Host không cần currentUserName vì đây là view của host
                  currentUserName=''
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Add custom scrollbar style */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(14, 28, 38, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(174, 243, 89, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(174, 243, 89, 0.4);
        }
      `}</style>
    </div>
  );
}
