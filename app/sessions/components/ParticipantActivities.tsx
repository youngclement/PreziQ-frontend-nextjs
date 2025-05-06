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
  const [isConnected, setIsConnected] = useState(true); // Mặc định là đã kết nối
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
  const [achievementResults, setAchievementResults] = useState<any>(null);
  const currentActivityIdRef = useRef<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    setIsLoading(true);

    if (!sessionWs) {
      console.error('Không có kết nối WebSocket');
      setIsLoading(false);
      return;
    }

    console.log(
      'Đăng ký các handlers cho WebSocket trong ParticipantActivities'
    );

    // Đăng ký các event handlers cho socket đã được kết nối
    sessionWs.onParticipantsUpdateHandler((updatedParticipants) => {
      if (!isMounted.current) return;
      console.log(
        'Nhận cập nhật danh sách người tham gia:',
        updatedParticipants.length
      );
      setParticipants(updatedParticipants);

      // Cập nhật điểm của người dùng hiện tại
      if (displayName) {
        const me = updatedParticipants.find(
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

      // Tìm thông tin điểm và xếp hạng của mình trong bảng tổng kết
      if (myId) {
        const mySummary = summaries.find((s) => s.participantId === myId);
        if (mySummary) {
          console.log('Kết quả cuối cùng của bạn:', mySummary);
          setSessionSummary(mySummary);
        }
      }
    });

    sessionWs.onAchievementHandler((achievements) => {
      if (!isMounted.current) return;
      console.log('Achievement results received:', achievements);
      setAchievementResults(achievements);
    });

    sessionWs.onNextActivityHandler((activity) => {
      if (!isMounted.current) return;
      console.log('Next activity received:', activity);
      setIsLoading(false);

      // Xử lý dữ liệu hoạt động
      if (activity) {
        const processedActivity = {
          ...activity,
          sessionId: activity.sessionId || sessionCode,
          activityType: activity.activityType || 'UNKNOWN',
        };

        // Lưu ID của hoạt động hiện tại để dùng khi submit
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
      else if (status === 'Connecting...') translatedStatus = 'Đang kết nối...';
      else if (status === 'Disconnected') translatedStatus = 'Mất kết nối';
      setConnectionStatus(translatedStatus);
      setIsConnected(status === 'Connected');

      if (status === 'Connected') {
        setIsLoading(false);
      }
    });

    // Sau 5 giây nếu không nhận được hoạt động nào, tắt loading
    const timer = setTimeout(() => {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      console.log('Hủy đăng ký các handlers trong ParticipantActivities');
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
  if (isSessionEnded && (sessionSummary || achievementResults)) {
    // Chuẩn bị dữ liệu để hiển thị kết quả
    let userResult = null;

    // Nếu có kết quả thành tựu, sử dụng dữ liệu đó
    if (achievementResults && Array.isArray(achievementResults)) {
      // Tìm kết quả của người dùng hiện tại trong mảng
      const myAchievement = achievementResults.find(
        (result: any) =>
          result.userId === myId ||
          (myId === null && result.totalPoints === myScore)
      );

      if (myAchievement) {
        userResult = {
          userId: myAchievement.userId,
          totalPoints: myAchievement.totalPoints,
          newAchievements: myAchievement.newAchievements || [],
        };
      }
    }

    // Nếu không có kết quả thành tựu nhưng có kết quả tổng kết
    if (!userResult && sessionSummary) {
      userResult = {
        userId: sessionSummary.participantId,
        totalPoints: sessionSummary.totalScore,
        newAchievements: [],
      };
    }

    // Nếu không có kết quả nào, tạo kết quả mặc định
    if (!userResult) {
      userResult = {
        userId: myId || '',
        totalPoints: myScore,
        newAchievements: [],
      };
    }

    return (
      <SessionResultSummary
        sessionCode={sessionCode}
        displayName={displayName}
        avatar={
          participants.find((p) => p.displayName === displayName)
            ?.displayAvatar || ''
        }
        userResult={userResult}
        rank={sessionSummary?.finalRanking || 0}
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
    <div className='space-y-6'>
      {/* Thông tin người dùng */}
      <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg'>
        <div className='flex items-center gap-4'>
          <Avatar>
            <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className='font-medium'>{displayName}</p>
            <p className='text-sm text-gray-500'>Điểm: {myScore}</p>
          </div>
        </div>
        <Button
          variant='destructive'
          onClick={handleLeaveSession}
          disabled={!isConnected || isSubmitting}
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

      {error && (
        <Alert variant={isSessionEnded ? 'default' : 'destructive'}>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='text-sm text-center text-gray-500 mb-4'>
        {connectionStatus}
      </div>

      {/* Hiển thị kết quả khi phiên kết thúc */}
      {renderSessionSummary()}

      {/* Hiển thị hoạt động hiện tại */}
      <Card>
        <div className='border-b p-4'>
          <h2 className='text-xl font-semibold'>Hoạt động hiện tại</h2>
        </div>
        <div className='p-4'>{renderActivityContent()}</div>
      </Card>

      {/* Danh sách người tham gia */}
      <Card>
        <div className='border-b p-4'>
          <h2 className='text-xl font-semibold'>
            Người tham gia ({participants.length})
          </h2>
        </div>
        <div className='p-4'>
          {participants.length === 0 ? (
            <div className='text-center py-6 text-gray-500'>
              <p>Chưa có người tham gia nào</p>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    participant.displayName === displayName
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <Avatar>
                    <AvatarImage
                      src={participant.displayAvatar}
                      alt={participant.displayName}
                    />
                    <AvatarFallback>
                      {participant.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>
                      {participant.displayName}
                      {participant.displayName === displayName && ' (Bạn)'}
                    </p>
                    <p className='text-sm text-gray-500'>
                      Điểm: {participant.realtimeScore}
                      {participant.realtimeRanking > 0 &&
                        ` | Hạng: ${participant.realtimeRanking}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
