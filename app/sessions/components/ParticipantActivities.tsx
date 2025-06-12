'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  SessionWebSocket,
  SessionParticipant,
  EndSessionSummary,
  UserAchievements,
} from '@/websocket/sessionWebSocket';
import InfoSlideViewer from '../show/components/info-slide-viewer';
import QuizButtonViewer from './QuizButtonViewer';
import { Loader2, ExternalLink, Users, LogOut, Clock } from 'lucide-react';
import SessionResultSummary from './SessionResultSummary';
import QuizCheckboxViewer from './QuizCheckboxViewer';
import QuizTypeAnswerViewer from './QuizTypeAnswerViewer';
import { QuizReorderViewer } from './QuizReorderViewer';
import QuizTrueOrFalseViewer from './QuizTrueOrFalseViewer';
import QuizLocationViewer from './QuizLocationViewer';
import CountdownOverlay from './CountdownOverlay';
import RealtimeLeaderboard from './RealtimeLeaderboard';
import { motion, AnimatePresence } from 'framer-motion';
import QuizMatchingPairViewer from './QuizMatchingPairViewer';

interface ParticipantActivitiesProps {
  sessionCode: string;
  sessionWs: SessionWebSocket;
  displayName: string;
  onLeaveSession?: () => void;
}

export default function ParticipantActivities({
  sessionCode,
  sessionWs,
  displayName,
  onLeaveSession,
}: ParticipantActivitiesProps) {
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Đã kết nối');
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [myId, setMyId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [sessionSummary, setSessionSummary] =
    useState<EndSessionSummary | null>(null);
  const [achievementsData, setAchievementsData] =
    useState<UserAchievements | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const currentActivityIdRef = useRef<string | null>(null);
  const isMounted = useRef(true);
  const wsInitialized = useRef(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [noMoreActivities, setNoMoreActivities] = useState(false);
  const lastScoreUpdateTimeRef = useRef(Date.now());
  const [isFullscreenMode, setIsFullscreenMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  const quizContainerRef = useRef<HTMLDivElement>(null);

  // Hàm kiểm tra loại activity là info slide hay không
  const isInfoSlideActivity = (activityType?: string): boolean => {
    return activityType === 'INFO_SLIDE';
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenMode(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Xử lý cập nhật điểm số từ RealtimeLeaderboard
  const handleScoreUpdate = (score: number, id: string | undefined) => {
    console.log(
      '[ParticipantActivities] Cập nhật điểm từ RealtimeLeaderboard:',
      {
        newScore: score,
        userId: id,
        prevScore: myScore,
        timeSinceLastUpdate: Date.now() - lastScoreUpdateTimeRef.current,
      }
    );

    if (score !== myScore) {
      setMyScore(score);
      if (id) setMyId(id);
      lastScoreUpdateTimeRef.current = Date.now();
    }
  };

  // Thêm hàm riêng để xử lý cập nhật từ WebSocket
  const handleWebSocketScoreUpdate = (newScore: number, id?: string) => {
    console.log('[ParticipantActivities] Cập nhật điểm từ WebSocket:', {
      oldScore: myScore,
      newScore: newScore,
      timeSinceLastUpdate: Date.now() - lastScoreUpdateTimeRef.current,
    });

    setMyScore(newScore);
    if (id) setMyId(id);
    lastScoreUpdateTimeRef.current = Date.now();
  };

  useEffect(() => {
    isMounted.current = true;
    setIsLoading(true);

    if (!sessionWs) {
      console.error('Không có kết nối WebSocket');
      setIsLoading(false);
      return;
    }

    // Chỉ khởi tạo handlers một lần
    if (!wsInitialized.current) {
      wsInitialized.current = true;

      // Đăng ký các event handlers cho socket đã được kết nối
      sessionWs.onParticipantsUpdateHandler((updatedParticipants) => {
        if (!isMounted.current) return;

        console.log(
          '[ParticipantActivities] Nhận cập nhật danh sách người tham gia:',
          updatedParticipants
        );

        if (!Array.isArray(updatedParticipants)) {
          console.warn(
            '[ParticipantActivities] Dữ liệu participants không hợp lệ:',
            updatedParticipants
          );
          return;
        }

        // Chuẩn hóa dữ liệu
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

        // Cập nhật điểm của người dùng hiện tại
        if (displayName) {
          const currentUser = participantsWithRanking.find(
            (p) => p.displayName === displayName
          );
          if (currentUser && currentUser.realtimeScore !== myScore) {
            // Sử dụng hàm riêng để cập nhật điểm từ WebSocket
            handleWebSocketScoreUpdate(
              currentUser.realtimeScore,
              currentUser.id || undefined
            );
          }
        }

        console.log(
          '[ParticipantActivities] Participants sau khi xử lý:',
          participantsWithRanking
        );

        // Cập nhật state với danh sách mới
        setParticipants(participantsWithRanking);
      });

      sessionWs.onSessionEndHandler((session) => {
        if (!isMounted.current) return;
        setIsSessionEnded(true);
        setError('Phiên đã kết thúc. Cảm ơn bạn đã tham gia!');
      });

      sessionWs.onSessionSummaryHandler((summaries: EndSessionSummary[]) => {
        if (!isMounted.current) return;

        if (displayName) {
          const mySummary = summaries.find(
            (s) => s.displayName === displayName
          );
          if (mySummary) {
            console.log('Kết quả cuối cùng của bạn:', mySummary);
            setSessionSummary(mySummary);
            setIsSessionEnded(true);
          }
        }
      });

      sessionWs.onNextActivityHandler((activity) => {
        if (!isMounted.current) return;
        console.log('Next activity received:', activity);

        if (!activity) {
          setNoMoreActivities(true);
        } else {
          // Reset state khi nhận activity mới - tương tự như HostActivities

          // Đặt lại bộ đếm sự kiện của người tham gia về 0 khi nhận activity mới
          // Trước khi gọi getParticipantsEventCount(), hãy reset giá trị đếm để đảm bảo nó bắt đầu từ 0
          sessionWs.resetParticipantsEventCount();

          // Sau đó đọc giá trị - điều này đảm bảo trang hiển thị giá trị 0/x khi bắt đầu
          const participantsCount = sessionWs.getParticipantsEventCount();
          console.log(
            '[ParticipantActivities] Số người đã trả lời sau khi reset:',
            participantsCount
          );

          // Lưu activityId vào ref để có thể theo dõi thay đổi
          currentActivityIdRef.current = activity.activityId || null;

          console.log(
            `[ParticipantActivities] Chuyển sang activity mới: ${activity.activityId}, reset bộ đếm participants events`
          );

          // Hiển thị countdown chỉ khi activity không phải là INFO_SLIDE
          if (!isInfoSlideActivity(activity.activityType)) {
            setShowCountdown(true);
          } else {
            setShowCountdown(false);
          }

          setCurrentActivity(activity);
          setNoMoreActivities(false);
        }
      });

      sessionWs.onErrorHandler((error) => {
        if (!isMounted.current) return;
        console.log('WebSocket error:', error);
        setError(error);
        setIsLoading(false);
      });

      sessionWs.onConnectionStatusChangeHandler((status) => {
        if (!isMounted.current) return;
        let translatedStatus = status;
        if (status === 'Connected') translatedStatus = 'Đã kết nối';
        else if (status === 'Connecting...')
          translatedStatus = 'Đang kết nối...';
        else if (status === 'Disconnected') translatedStatus = 'Mất kết nối';
        setConnectionStatus(translatedStatus);
        setIsConnected(status === 'Connected');

        if (status === 'Connected') {
          setIsLoading(false);
        }
      });

      sessionWs.onAchievementHandler((achievement) => {
        if (!isMounted.current) return;
        console.log('Received achievement data:', achievement);
        setAchievementsData(achievement);
      });
    }

    // Sau 5 giây nếu không nhận được hoạt động nào, tắt loading
    const timer = setTimeout(() => {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
    };
  }, []);

  const handleLeaveSession = async () => {
    if (!sessionWs) {
      setError('Không có kết nối WebSocket');
      return;
    }

    if (!sessionWs.isClientConnected()) {
      setError('Đang mất kết nối. Vui lòng đợi hoặc làm mới trang.');
      return;
    }

    try {
      await sessionWs.leaveSession();
      if (onLeaveSession) onLeaveSession();
    } catch (err) {
      setError('Không thể rời khỏi phiên');
      console.error('Error leaving session:', err);
    }
  };

  const handleSubmitActivity = async (answer: string) => {
    if (!sessionWs || !sessionWs.isClientConnected() || !currentActivity) {
      setError('Không thể gửi câu trả lời lúc này');
      return;
    }

    setIsSubmitting(true);

    try {
      //   const activityId = currentActivityIdRef.current || currentActivity.id;
      //   console.log('Gửi câu trả lời cho hoạt động:', activityId);
      //   await sessionWs.submitActivity({
      //     sessionCode: sessionCode,
      //     activityId: activityId,
      //     answerContent: answer,
      //   });
    } catch (err) {
      setError('Không thể gửi câu trả lời');
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
    setIsLoading(false);
  };

  // Hiển thị màn hình kết quả khi kết thúc phiên
  if (isSessionEnded && sessionSummary) {
    return (
      <SessionResultSummary
        sessionCode={sessionCode}
        displayName={displayName}
        avatar={
          participants.find((p) => p.displayName === displayName)
            ?.displayAvatar || ''
        }
        userResult={sessionSummary}
        totalParticipants={participants.length}
        onNavigateToHome={onLeaveSession}
        achievements={achievementsData || undefined}
      />
    );
  }

  // Hiển thị kết quả phiên học khi kết thúc
  const renderSessionSummary = () => {
    if (!isSessionEnded || !sessionSummary) return null;

    return (
      <Card className="p-6 mb-6 bg-green-50">
        <h2 className="text-xl font-bold mb-4">Kết quả của bạn</h2>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Tổng điểm:</span>{' '}
            {sessionSummary.finalScore}
          </p>
          <p>
            <span className="font-medium">Xếp hạng cuối cùng:</span>{' '}
            {sessionSummary.finalRanking}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Cảm ơn bạn đã tham gia phiên này!
          </p>
        </div>
      </Card>
    );
  };

  const renderActivityContent = () => {
    if (!currentActivity) {
      return (
        <div className="text-center py-12">
          <p className="mb-2 text-lg text-white/70">Chưa có hoạt động nào</p>
          <p className="text-sm text-white/50">Đợi host bắt đầu phiên học</p>
        </div>
      );
    }

    return renderActivityByType();
  };

  const renderActivityByType = () => {
    return (
      <>
        {(() => {
          switch (currentActivity.activityType) {
            case 'INFO_SLIDE':
              return (
                <InfoSlideViewer
                  key={currentActivity.activityId}
                  activity={currentActivity}
                />
              );
            case 'QUIZ_BUTTONS':
              return (
                <QuizButtonViewer
                  key={currentActivity.activityId}
                  activity={currentActivity}
                  sessionCode={sessionCode}
                  sessionWebSocket={sessionWs}
                  onAnswerSubmit={handleSubmitActivity}
                />
              );
            case 'QUIZ_CHECKBOXES':
              return (
                <QuizCheckboxViewer
                  key={currentActivity.activityId}
                  activity={currentActivity}
                  sessionCode={sessionCode}
                  sessionWebSocket={sessionWs}
                />
              );
            case 'QUIZ_TYPE_ANSWER':
              return (
                <QuizTypeAnswerViewer
                  key={currentActivity.activityId}
                  activity={currentActivity}
                  sessionId={sessionCode}
                  sessionWebSocket={sessionWs}
                />
              );
            case 'QUIZ_REORDER':
              return (
                <QuizReorderViewer
                  key={currentActivity.activityId}
                  activity={currentActivity}
                  sessionId={sessionCode}
                  sessionWebSocket={sessionWs}
                />
              );
            case 'QUIZ_TRUE_OR_FALSE':
              return (
                <QuizTrueOrFalseViewer
                  key={currentActivity.activityId}
                  activity={currentActivity}
                  sessionId={sessionCode}
                  sessionWebSocket={sessionWs}
                />
              );
            case 'QUIZ_LOCATION':
              return (
                <QuizLocationViewer
                  key={currentActivity.activityId}
                  activity={currentActivity}
                  sessionId={sessionCode}
                  sessionWebSocket={sessionWs}
                />
              );
            case 'QUIZ_MATCHING_PAIR':
              return (
                <QuizMatchingPairViewer
                  key={currentActivity.activityId}
                  activity={currentActivity}
                  sessionId={sessionCode}
                  sessionWebSocket={sessionWs}
                />
              );
            default:
              return (
                <div className="p-6 bg-black bg-opacity-20 rounded-lg border border-white/10">
                  <h3 className="font-medium text-lg mb-2 text-white/90">
                    {currentActivity.title || 'Hoạt động chưa được hỗ trợ'}
                  </h3>
                  <p className="mb-4 text-white/70">
                    {currentActivity.description ||
                      'Không có mô tả cho hoạt động này'}
                  </p>
                  <div className="bg-black bg-opacity-30 p-4 rounded-md border border-white/10">
                    <p className="text-sm text-white/50 mb-2">
                      Chi tiết hoạt động:
                    </p>
                    <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-60 bg-black bg-opacity-40 p-2 rounded border border-white/10 text-white/60">
                      {JSON.stringify(currentActivity, null, 2)}
                    </pre>
                  </div>
                </div>
              );
          }
        })()}
      </>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hiển thị CountdownOverlay ở mức cao nhất để che phủ toàn màn hình khi KHÔNG ở chế độ toàn màn hình */}
      {showCountdown && !isFullscreenMode && (
        <div className="fixed inset-0 z-[9999]">
          <CountdownOverlay onComplete={handleCountdownComplete} />
        </div>
      )}

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs with reduced opacity */}
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-[rgb(198,234,132)] rounded-full filter blur-[80px]"
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
          className="absolute bottom-10 right-10 w-32 h-32 bg-[rgb(255,244,180)] rounded-full filter blur-[80px]"
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
        <div className="absolute inset-0 bg-[radial-gradient(rgba(198,234,132,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {/* Moving light beam with reduced opacity */}
        <motion.div
          className="absolute top-0 left-0 w-[200vw] h-[200vh] bg-[radial-gradient(circle,rgba(198,234,132,0.015)_0%,transparent_20%)] pointer-events-none"
          animate={{
            x: ['-50%', '0%'],
            y: ['-50%', '0%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Header - ẩn trong chế độ toàn màn hình */}
      {!isFullscreenMode && (
        <div className="bg-[#0e1c26]/90 backdrop-blur-md border-b border-white/5 p-4 shadow-lg sticky top-0 z-50">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="relative"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-[#aef359]/30 to-[#e4f88d]/30 rounded-full blur-md -z-10"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                <Avatar className="h-10 w-10 border-2 border-white/10 shadow-inner group">
                  <AvatarFallback className="bg-[#0e2838]/80 text-white group-hover:bg-[#0e2838]/60 transition-colors">
                    {displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <div>
                <motion.p
                  className="font-semibold text-white bg-gradient-to-r from-[#aef359]/90 to-[#e4f88d]/90 text-transparent bg-clip-text"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  {displayName}
                </motion.p>
                <div className="flex items-center">
                  <span className="text-xs text-white/50">Điểm: </span>
                  <motion.span
                    className="text-xs font-bold ml-1 bg-[#0e2838]/80 text-[#aef359] px-2 py-0.5 rounded-full border border-[#aef359]/20"
                    key={myScore}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    {myScore}
                  </motion.span>
                </div>
              </div>
            </div>

            <div className="text-xs text-white/50 hidden md:block">
              {connectionStatus}
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="secondary"
                onClick={handleLeaveSession}
                disabled={!isConnected || isSubmitting}
                className="bg-[#0e2838]/50 text-white hover:bg-[#0e2838]/70 border border-white/10 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-[#aef359]" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4 text-[#aef359]" />
                    <span>Rời phiên</span>
                  </>
                )}
              </Button>
            </motion.div>
          </div>
        </div>
      )}

      <div
        className={`${
          isFullscreenMode ? 'p-0' : 'container mx-auto px-4 py-6'
        }`}
      >
        {!isFullscreenMode && (
          <div className="text-xs text-center text-white/50 mb-4 md:hidden">
            {connectionStatus}
          </div>
        )}

        <AnimatePresence>
          {error && !isFullscreenMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <Alert
                variant={isSessionEnded ? 'default' : 'destructive'}
                className={
                  isSessionEnded
                    ? 'bg-green-500/20 border border-green-500/50 text-white'
                    : 'bg-red-500/20 border border-red-500 text-white'
                }
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Controls - fixed position buttons for fullscreen & sidebar toggle */}
        <motion.div
          className="fixed top-4 right-4 z-50 flex flex-col gap-2"
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
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isFullscreenMode ? (
                <>
                  <path d="M8 3v4a1 1 0 0 1-1 1H3"></path>
                  <path d="M21 8h-4a1 1 0 0 1-1-1V3"></path>
                  <path d="M3 16h4a1 1 0 0 1 1 1v4"></path>
                  <path d="M16 21v-4a1 1 0 0 1 1-1h4"></path>
                </>
              ) : (
                <>
                  <path d="M3 8V5a2 2 0 0 1 2-2h3"></path>
                  <path d="M19 8V5a2 2 0 0 0-2-2h-3"></path>
                  <path d="M3 16v3a2 2 0 0 0 2 2h3"></path>
                  <path d="M19 16v3a2 2 0 0 1-2 2h-3"></path>
                </>
              )}
            </svg>
          </motion.button>
        </motion.div>

        {/* Floating Controls for fullscreen mode - fixed position always visible */}
        {isFullscreenMode && (
          <motion.div
            className="fixed top-4 left-4 z-50 flex items-center gap-3 bg-[#0e1c26]/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border-2 border-white/10 shadow-inner">
                <AvatarFallback className="bg-[#0e2838]/80 text-white text-xs">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-white">{displayName}</p>
                <div className="flex items-center">
                  <span className="text-xs text-white/50">Điểm: </span>
                  <span className="text-xs font-bold ml-1 bg-[#0e2838]/80 text-[#aef359] px-2 py-0.5 rounded-full">
                    {myScore}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#0e2838]/80 px-3 py-1 rounded-full text-sm text-white/80 border border-white/10 shadow-inner">
              Mã: {sessionCode}
            </div>

            <motion.button
              onClick={handleLeaveSession}
              disabled={!isConnected || isSubmitting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-red-500/80 hover:bg-red-600/90 text-white border border-red-600/30 flex items-center gap-1 px-3 py-1.5 rounded-full shadow-md"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Rời phiên</span>
            </motion.button>
          </motion.div>
        )}

        {/* Main layout with sidebar */}
        <div className="relative" ref={quizContainerRef}>
          <div className="w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`
                bg-[#0e1c26]/80 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-white/5 mb-6
                ${isFullscreenMode ? 'h-screen rounded-none border-0 mb-0' : ''}
              `}
            >
              {!isFullscreenMode && (
                <div className="bg-gradient-to-r from-[#0e2838]/80 to-[#183244]/80 px-6 py-4 border-b border-white/10">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-[#aef359] to-[#e4f88d] text-transparent bg-clip-text flex items-center">
                    <span className="mr-2">Hoạt động hiện tại</span>
                    {isLoading && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      >
                        <Loader2 className="h-4 w-4 text-[#aef359]" />
                      </motion.div>
                    )}
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
                  <div className="absolute inset-0 z-50">
                    <CountdownOverlay onComplete={handleCountdownComplete} />
                  </div>
                )}

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
              </div>
            </motion.div>
          </div>

          {/* Leaderboard sidebar - fixed trên mobile */}
          <motion.div
            className={`backdrop-blur-md shadow-xl border-l border-white/10 
              overflow-hidden transition-all duration-300 ease-in-out
              ${isFullscreenMode ? 'h-screen' : 'h-full'}
              fixed inset-y-0 right-0 z-50 bg-[#0e1c26]/95 max-w-[90vw]
              md:absolute md:bottom-0 md:top-0 md:z-20 md:max-w-[350px]
            `}
            initial={false}
            animate={{
              width: isSidebarCollapsed ? '0' : 'min(85vw, 350px)',
              opacity: isSidebarCollapsed ? 0 : 1,
              pointerEvents: isSidebarCollapsed ? 'none' : 'auto',
            }}
          >
            <div className="p-4 h-full flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white/90">
                  <Users className="h-5 w-5 text-[#aef359]" />
                  <span>Người tham gia</span>
                  <motion.span
                    key={participants.length}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="ml-2 bg-[#0e2838]/80 px-2 py-0.5 rounded-full text-sm text-[#aef359] border border-[#aef359]/20"
                  >
                    {participants.length}
                  </motion.span>
                </h2>

                <motion.button
                  className="bg-[#0e2838]/50 p-1.5 rounded-full border border-white/10 shadow-inner"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsSidebarCollapsed(true)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#aef359]"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </motion.button>
              </div>

              <div className="flex-grow overflow-auto pr-1 custom-scrollbar">
                <RealtimeLeaderboard
                  participants={participants}
                  currentUserName={displayName}
                  onScoreUpdate={handleScoreUpdate}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        {!isFullscreenMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-xs text-white/30">
              PreziQ! &copy; {new Date().getFullYear()}
            </p>
          </motion.div>
        )}

        {/* Sidebar toggle button positioned on the boundary */}
        <div className="fixed right-0 top-1/2 transform -translate-y-1/2 z-50">
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
              <Users className="h-5 w-5" />
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            )}
          </motion.button>
        </div>

        {/* Hiển thị kết quả khi phiên kết thúc */}
        {renderSessionSummary()}
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
