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

import QuizCheckboxViewer from './QuizCheckboxViewer';
import QuizTypeAnswerViewer from './QuizTypeAnswerViewer';
import QuizReorderViewer from './QuizReorderViewer';
import QuizTrueOrFalseViewer from './QuizTrueOrFalseViewer';
import CountdownOverlay from './CountdownOverlay';
import { Loader2 } from 'lucide-react';

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

  useEffect(() => {
    isMounted.current = true;

    if (!sessionWs) return;

    // Đăng ký các event handlers cho socket đã được kết nối
    sessionWs.onParticipantsUpdateHandler((updatedParticipants) => {
      if (!isMounted.current) return;

      // Sắp xếp người tham gia theo điểm số giảm dần
      const sortedParticipants = [...updatedParticipants].sort(
        (a, b) => b.realtimeScore - a.realtimeScore
      );

      // Cập nhật thứ hạng cho mỗi người tham gia
      const participantsWithRanking = sortedParticipants.map(
        (participant, index) => ({
          ...participant,
          realtimeRanking: index + 1,
        })
      );

      const participantsData = participantsWithRanking.map((p: any) => ({
        guestName: p.displayName || 'Unknown',
        guestAvatar:
          p.displayAvatar || 'https://api.dicebear.com/9.x/pixel-art/svg',
        userId: p.user?.userId || null,
        realtimeScore: p.realtimeScore,
        realtimeRanking: p.realtimeRanking,
      }));

      setParticipants(participantsData);
    });

    sessionWs.onSessionEndHandler((session) => {
      if (!isMounted.current) return;
      console.log('Session ended:', session);

      // Chỉ gọi callback onSessionEnd
      if (onSessionEnd) onSessionEnd();
    });

    sessionWs.onSessionSummaryHandler((summaries) => {
      if (!isMounted.current) return;
      console.log('Session summaries received:', summaries);

      if (Array.isArray(summaries) && summaries.length > 0) {
        console.log('Setting session summaries:', summaries);
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
            console.log(
              'Automatically ending session due to no more activities'
            );
            sessionWs.endSession(sessionId).catch((err) => {
              console.error('Error ending session automatically:', err);
            });
          }
        }, 1000);
      } else {
        setCurrentActivity(activity);
        setNoMoreActivities(false);
      }
    });

    sessionWs.onErrorHandler((error) => {
      if (!isMounted.current) return;
      console.log('WebSocket error:', error);

      if (error && error.includes('No more activities in session')) {
        console.log('Detected no more activities message in error handler');
        setNoMoreActivities(true);

        setTimeout(() => {
          if (isMounted.current && sessionId) {
            console.log(
              'Automatically ending session due to no more activities (from error)'
            );
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
      console.log('Component unmounted, giữ nguyên kết nối WebSocket');
    };
  }, [sessionWs, sessionId, onSessionEnd, onNextActivityLog]);

  const handleNextActivity = async () => {
    if (!sessionWs || !sessionWs.isClientConnected()) {
      setError('Không thể chuyển hoạt động lúc này');
      return;
    }

    try {
      setShowCountdown(true);

      const currentActivityId = currentActivity?.activityId;
      await sessionWs.nextActivity(sessionId, currentActivityId);
    } catch (err) {
      setError('Không thể chuyển hoạt động');
      console.error('Error moving to next activity:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCountdownComplete = () => {
    setShowCountdown(false);
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
      console.error('Error ending session:', err);
    }
  };

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

  const renderActivityContent = () => {
    if (isLoading) {
      return (
        <div className='flex flex-col items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin mb-2' />
          <p>Đang tải hoạt động...</p>
        </div>
      );
    }

    if (!currentActivity) {
      return (
        <div className='text-center py-12 text-gray-500'>
          <p className='mb-2 text-lg'>Chưa có hoạt động nào</p>
          <p className='text-sm'>
            Bắt đầu phiên học để hiển thị hoạt động đầu tiên
          </p>
        </div>
      );
    }

    return (
      <>
        {showCountdown && (
          <CountdownOverlay onComplete={handleCountdownComplete} />
        )}
        {!showCountdown && renderActivityByType()}
      </>
    );
  };

  const renderActivityByType = () => {
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
          <div className='p-4 bg-gray-50 rounded-lg'>
            <pre className='whitespace-pre-wrap'>
              {JSON.stringify(currentActivity, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-gradient-to-r from-indigo-600 to-violet-600 p-4 shadow-md sticky top-0 z-50'>
        <div className='container mx-auto flex items-center justify-between'>
          <div className='flex items-center space-x-4'>
            <h1 className='text-2xl font-bold text-white'>PreziQ Host</h1>
            <div className='bg-white/20 px-3 py-1 rounded-full text-sm text-white'>
              Mã: {sessionCode}
            </div>
          </div>

          <div className='text-sm text-white/80 hidden md:block'>
            {connectionStatus}
          </div>

          <div className='flex space-x-2'>
            <Button
              onClick={handleNextActivity}
              disabled={!isConnected || noMoreActivities}
              className='bg-white text-indigo-600 hover:bg-white/90'
            >
              Hoạt động tiếp theo
            </Button>
            <Button
              variant='destructive'
              onClick={handleEndSession}
              disabled={!isConnected}
              className='bg-red-500 hover:bg-red-600'
            >
              Kết thúc phiên
            </Button>
          </div>
        </div>
      </div>

      <div className='container mx-auto px-4 py-6'>
        <div className='text-sm text-center text-gray-500 mb-4 md:hidden'>
          {connectionStatus}
        </div>

        {error && !noMoreActivities && (
          <Alert variant='destructive' className='mb-6 animate-fadeIn'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Grid layout với 2 cột hoặc 1 cột trên mobile */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Cột chính - Hoạt động hiện tại */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
              <div className='bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4'>
                <h2 className='text-xl font-bold text-white'>
                  Hoạt động hiện tại
                </h2>
              </div>
              <div className='p-6'>
                {noMoreActivities ? (
                  <div className='text-center py-8 bg-amber-50 rounded-lg'>
                    <p className='text-lg font-medium text-amber-600 mb-2'>
                      Không còn hoạt động nào nữa
                    </p>
                    <p className='text-gray-500'>
                      Phiên học sẽ tự động kết thúc trong giây lát...
                    </p>
                  </div>
                ) : (
                  renderActivityContent()
                )}
              </div>
            </div>
          </div>

          {/* Cột phụ - Danh sách người tham gia */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
              <div className='bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4'>
                <h2 className='text-xl font-bold text-white'>
                  Thành viên ({participants.length}/100)
                </h2>
              </div>
              <div className='p-4'>
                {participants.length === 0 ? (
                  <div className='text-center py-8 text-gray-500'>
                    <p>Chưa có người tham gia nào</p>
                    <p className='text-sm mt-2'>
                      Chia sẻ mã phiên để mọi người tham gia
                    </p>
                  </div>
                ) : (
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2'>
                    {participants.map((participant, index) => (
                      <div
                        key={index}
                        className='flex items-center space-x-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all'
                      >
                        <Avatar className='h-10 w-10 border border-gray-200'>
                          <AvatarImage
                            src={participant.guestAvatar}
                            alt={participant.guestName}
                          />
                          <AvatarFallback className='bg-indigo-100 text-indigo-600'>
                            {participant.guestName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1 truncate'>
                          <p className='font-medium truncate'>
                            {participant.guestName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
