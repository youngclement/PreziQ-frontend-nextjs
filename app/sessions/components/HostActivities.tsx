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
import { Loader2 } from 'lucide-react';

interface Participant {
  guestName: string;
  guestAvatar: string;
  userId: string | null;
}

interface HostActivitiesProps {
  sessionId: string;
  sessionCode: string;
  sessionWs: SessionWebSocket;
  onSessionEnd?: () => void;
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

  useEffect(() => {
    isMounted.current = true;

    if (!sessionWs) return;

    // Đăng ký các event handlers cho socket đã được kết nối
    sessionWs.onParticipantsUpdateHandler((updatedParticipants) => {
      if (!isMounted.current) return;
      const participantsData = updatedParticipants.map((p: any) => ({
        guestName: p.displayName || 'Unknown',
        guestAvatar:
          p.displayAvatar || 'https://api.dicebear.com/9.x/pixel-art/svg',
        userId: p.user?.userId || null,
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

    setTimeout(() => {
      sessionWs.nextActivity(sessionId).catch((err) => {
        console.error('Error starting first activity:', err);
        setError('Failed to start first activity');
      });
    }, 1000);

    return () => {
      isMounted.current = false;

    };
  }, [sessionWs, sessionId, onSessionEnd, sessionCode]);

  const handleNextActivity = async () => {
    if (!isConnected || !sessionWs || !sessionId) {
      setError(
        'WebSocket không được kết nối. Vui lòng đợi hoặc làm mới trang.'
      );
      return;
    }

    try {
      const currentActivityId = currentActivity?.activityId;
      await sessionWs.nextActivity(sessionId, currentActivityId);
    } catch (err) {
      setError('Không thể chuyển đến hoạt động tiếp theo');
      console.error('Error moving to next activity:', err);
    }
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
    if (noMoreActivities) {
      return (
        <div className='text-center py-6'>
          <p className='text-lg font-medium text-amber-600 mb-2'>
            Không còn hoạt động nào nữa
          </p>
          <p className='text-gray-500'>
            Phiên học sẽ tự động kết thúc trong giây lát...
          </p>
        </div>
      );
    }

    if (!currentActivity) {
      return (
        <div className='text-center text-gray-500'>
          Chưa có hoạt động nào đang diễn ra
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
            sessionId={sessionId}
            sessionCode={sessionCode}
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
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-center mb-8'>Host Session</h1>
      <div className='text-sm text-center text-gray-500 mb-4'>
        {connectionStatus}
      </div>

      {error && !noMoreActivities && (
        <Alert variant='destructive' className='mb-4'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='max-w-4xl mx-auto'>
        <Card className='p-6 mb-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Hoạt động hiện tại</h2>
            <div className='space-x-2'>
              <Button
                onClick={handleNextActivity}
                disabled={!isConnected || noMoreActivities}
              >
                Hoạt động tiếp theo
              </Button>
              <Button
                variant='destructive'
                onClick={handleEndSession}
                disabled={!isConnected}
              >
                Kết thúc phiên
              </Button>
            </div>
          </div>
          {renderActivityContent()}
        </Card>

        <Card className='p-6'>
          <h2 className='text-xl font-semibold mb-4'>
            Thành viên ({participants.length}/100)
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {participants.map((participant, index) => (
              <div
                key={index}
                className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'
              >
                <Avatar>
                  <AvatarImage
                    src={participant.guestAvatar}
                    alt={participant.guestName}
                  />
                  <AvatarFallback>{participant.guestName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-medium'>{participant.guestName}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
