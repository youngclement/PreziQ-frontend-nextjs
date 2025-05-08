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
} from '@/websocket/sessionWebSocket';
import InfoSlideViewer from '../show/components/info-slide-viewer';
import QuizButtonViewer from './QuizButtonViewer';
import { Loader2 } from 'lucide-react';
import SessionResultSummary from './SessionResultSummary';
import QuizCheckboxViewer from './QuizCheckboxViewer';
import QuizTypeAnswerViewer from './QuizTypeAnswerViewer';
import QuizReorderViewer from './QuizReorderViewer';
import QuizTrueOrFalseViewer from './QuizTrueOrFalseViewer';

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
  const [isLoading, setIsLoading] = useState(false);
  const currentActivityIdRef = useRef<string | null>(null);
  const isMounted = useRef(true);
  const wsInitialized = useRef(false);

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
      console.log('Khởi tạo WebSocket handlers trong ParticipantActivities');
      wsInitialized.current = true;

      // Đăng ký các event handlers cho socket đã được kết nối
      sessionWs.onParticipantsUpdateHandler((updatedParticipants) => {
        console.log(
          'Nhận cập nhật danh sách người tham gia:',
          updatedParticipants
        );

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

        // Cập nhật state với danh sách mới
        setParticipants(participantsWithRanking);

        // Cập nhật điểm của người dùng hiện tại
        if (displayName) {
          const me = participantsWithRanking.find(
            (p) => p.displayName === displayName
          );
          if (me) {
            console.log('Cập nhật thông tin người dùng:', me);
            setMyScore(me.realtimeScore);
            setMyId(me.id);
          }
        }
      });

      sessionWs.onSessionEndHandler((session) => {
        if (!isMounted.current) return;
        console.log('Session ended:', session);
        setIsSessionEnded(true);
        setError('Phiên đã kết thúc. Cảm ơn bạn đã tham gia!');
      });

      sessionWs.onSessionSummaryHandler((summaries: EndSessionSummary[]) => {
        if (!isMounted.current) return;
        console.log('Session summaries received:', summaries);

        if (myId) {
          const mySummary = summaries.find((s) => s.participantId === myId);
          if (mySummary) {
            console.log('Kết quả cuối cùng của bạn:', mySummary);
            setSessionSummary(mySummary);
          }
        }
      });

      sessionWs.onNextActivityHandler((activity) => {
        if (!isMounted.current) return;
        console.log('Next activity received:', activity);
        setIsLoading(false);

        if (activity) {
          const processedActivity = {
            ...activity,
            sessionId: activity.sessionId || sessionCode,
            activityType: activity.activityType || 'UNKNOWN',
          };

          currentActivityIdRef.current = activity.id || null;
          setCurrentActivity(processedActivity);
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
        console.log('WebSocket connection status changed:', status);
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
      // Không hủy đăng ký handlers khi unmount để duy trì kết nối
      console.log('Component unmounted, giữ nguyên kết nối WebSocket');
    };
  }, [sessionWs, displayName, sessionCode, myId]);

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
      console.log('Rời khỏi phiên');
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
      console.log('Đã gửi câu trả lời thành công');
    } catch (err) {
      setError('Không thể gửi câu trả lời');
      console.error('Error submitting answer:', err);
    } finally {
      setIsSubmitting(false);
    }
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
        userResult={{
          userId: sessionSummary.participantId || '',
          totalPoints: sessionSummary.finalScore,
          newAchievements: [], // Không cần xử lý achievements nữa
        }}
        rank={sessionSummary.finalRanking}
        totalParticipants={participants.length}
        onNavigateToHome={onLeaveSession}
      />
    );
  }

  // Hiển thị kết quả phiên học khi kết thúc
  const renderSessionSummary = () => {
    if (!isSessionEnded || !sessionSummary) return null;

    return (
      <Card className='p-6 mb-6 bg-green-50'>
        <h2 className='text-xl font-bold mb-4'>Kết quả của bạn</h2>
        <div className='space-y-2'>
          <p>
            <span className='font-medium'>Tổng điểm:</span>{' '}
            {sessionSummary.totalScore}
          </p>
          <p>
            <span className='font-medium'>Xếp hạng cuối cùng:</span>{' '}
            {sessionSummary.finalRanking}
          </p>
          <p className='mt-4 text-sm text-gray-500'>
            Cảm ơn bạn đã tham gia phiên này!
          </p>
        </div>
      </Card>
    );
  };

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
          <p className='mb-2 text-lg'>Đang đợi hoạt động tiếp theo...</p>
          <p className='text-sm'>
            Giáo viên sẽ bắt đầu hoạt động trong chốc lát
          </p>
        </div>
      );
    }

    switch (currentActivity.activityType) {
      case 'INFO_SLIDE':
        return <InfoSlideViewer activity={currentActivity} />;
      case 'QUIZ_BUTTONS':
        return (
          <QuizButtonViewer
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
      default:
        return (
          <div className='p-6 bg-gray-50 rounded-lg'>
            <h3 className='font-medium text-lg mb-2'>
              {currentActivity.title || 'Hoạt động chưa được hỗ trợ'}
            </h3>
            <p className='mb-4'>
              {currentActivity.description ||
                'Không có mô tả cho hoạt động này'}
            </p>
            <div className='bg-gray-100 p-4 rounded-md'>
              <p className='text-sm text-gray-500 mb-2'>Chi tiết hoạt động:</p>
              <pre className='text-xs whitespace-pre-wrap overflow-auto max-h-60 bg-white p-2 rounded border'>
                {JSON.stringify(currentActivity, null, 2)}
              </pre>
            </div>
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
            <Avatar className='h-10 w-10 border-2 border-white'>
              <AvatarFallback className='bg-white/20 text-white'>
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className='font-semibold text-white'>{displayName}</p>
              <div className='flex items-center'>
                <span className='text-xs text-white/80'>Điểm: </span>
                <span className='text-xs font-bold ml-1 bg-white/20 text-white px-2 py-0.5 rounded-full'>
                  {myScore}
                </span>
              </div>
            </div>
          </div>

          <div className='text-xs text-white/80 hidden md:block'>
            {connectionStatus}
          </div>

          <Button
            variant='secondary'
            onClick={handleLeaveSession}
            disabled={!isConnected || isSubmitting}
            className='bg-white/20 text-white hover:bg-white/30'
          >
            {isSubmitting ? (
              <span className='flex items-center gap-2'>
                <Loader2 className='h-4 w-4 animate-spin' />
                Đang xử lý...
              </span>
            ) : (
              'Rời phiên'
            )}
          </Button>
        </div>
      </div>

      <div className='container mx-auto px-4 py-6'>
        {error && (
          <Alert
            variant={isSessionEnded ? 'default' : 'destructive'}
            className='mb-6 animate-fadeIn'
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className='text-xs text-center text-gray-500 mb-4 md:hidden'>
          {connectionStatus}
        </div>

        {/* Hiển thị kết quả khi phiên kết thúc */}
        {renderSessionSummary()}

        {/* Grid layout với 2 cột hoặc 1 cột trên mobile */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          {/* Cột chính - Hoạt động hiện tại */}
          <div className='lg:col-span-2'>
            <div className='bg-white rounded-xl shadow-lg overflow-hidden mb-6'>
              <div className='bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4'>
                <h2 className='text-xl font-bold text-white flex items-center'>
                  <span className='mr-2'>Hoạt động hiện tại</span>
                  {isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
                </h2>
              </div>
              <div className='p-6'>{renderActivityContent()}</div>
            </div>
          </div>

          {/* Cột phụ - Danh sách người tham gia */}
          <div className='lg:col-span-1'>
            <div className='bg-white rounded-xl shadow-lg overflow-hidden'>
              <div className='bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4'>
                <h2 className='text-xl font-bold text-white'>
                  Người tham gia ({participants.length})
                </h2>
              </div>
              <div className='p-4'>
                {participants.length === 0 ? (
                  <div className='text-center py-8 text-gray-500'>
                    <p>Chưa có người tham gia nào</p>
                  </div>
                ) : (
                  <div className='space-y-3 max-h-[400px] overflow-y-auto pr-2'>
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                          participant.displayName === displayName
                            ? 'bg-indigo-50 border border-indigo-200'
                            : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <Avatar
                          className={`h-10 w-10 ${
                            participant.displayName === displayName
                              ? 'border-2 border-indigo-300'
                              : ''
                          }`}
                        >
                          <AvatarImage
                            src={participant.displayAvatar}
                            alt={participant.displayName}
                          />
                          <AvatarFallback>
                            {participant.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className='flex-1'>
                          <div className='flex items-center'>
                            <p className='font-medium'>
                              {participant.displayName}
                              {participant.displayName === displayName && (
                                <span className='ml-1 text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded'>
                                  Bạn
                                </span>
                              )}
                            </p>
                          </div>
                          <div className='flex items-center space-x-2 text-sm text-gray-500'>
                            <span>Điểm: {participant.realtimeScore}</span>
                            {participant.realtimeRanking > 0 && (
                              <>
                                <span className='text-gray-300'>•</span>
                                <span>Hạng: {participant.realtimeRanking}</span>
                              </>
                            )}
                          </div>
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
