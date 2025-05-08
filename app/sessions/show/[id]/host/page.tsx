'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  SessionWebSocket,
  SessionParticipant,
} from '@/websocket/sessionWebSocket';
import { useParams } from 'next/navigation';
import InfoSlideViewer from '../../components/info-slide-viewer';
import QuizViewer from '../../components/quiz-button-viewer';

const HostPage = () => {
  const params = useParams();
  const sessionId = params.id as string;
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [currentActivity, setCurrentActivity] = useState<any>(null);

  const sessionWsRef = useRef<SessionWebSocket | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const sessionCode = localStorage.getItem('sessionCode');
    if (!sessionCode) {
      setError('Session code not found');
      return;
    }

    const sessionWs = new SessionWebSocket(sessionCode);
    sessionWsRef.current = sessionWs;

    sessionWs.onErrorHandler((error) => {
      if (!isMounted.current) return;
      console.log('WebSocket error:', error);
      setError(error);
    });

    sessionWs.onParticipantsUpdateHandler((updatedParticipants) => {
      if (!isMounted.current) return;
      console.log('Participants updated:', updatedParticipants);
      setParticipants(updatedParticipants);
    });

    sessionWs.onNextActivityHandler((activity) => {
      if (!isMounted.current) return;
      console.log('Next activity received:', activity);
      setCurrentActivity(activity);
    });

    sessionWs.onSessionEndHandler((session) => {
      if (!isMounted.current) return;
      console.log('Session ended:', session);
    });

    sessionWs.onSessionSummaryHandler((summaries) => {
      if (!isMounted.current) return;
      console.log('Session summaries:', summaries);
    });

    sessionWs.onConnectionStatusChangeHandler((status) => {
      if (!isMounted.current) return;
      setConnectionStatus(status);
      setIsConnected(status === 'Connected');
      if (status === 'Connected') {
        setTimeout(() => {
          sessionWs.nextActivity(sessionId).catch((err) => {
            console.error('Error starting first activity:', err);
            setError('Failed to start first activity');
          });
        }, 1000);
      }
    });

    sessionWs.connect().catch((err) => {
      if (!isMounted.current) return;
      setError('Failed to connect to WebSocket');
      console.error('WebSocket connection error:', err);
    });

    return () => {
      isMounted.current = false;
      if (sessionWsRef.current) {
        sessionWsRef.current.disconnect();
      }
    };
  }, [sessionId]);

  const handleNextActivity = async () => {
    if (!isConnected || !sessionWsRef.current) {
      setError('WebSocket not connected. Please wait or refresh the page.');
      return;
    }

    try {
      const currentActivityId = currentActivity?.activityId;
      await sessionWsRef.current.nextActivity(sessionId, currentActivityId);
    } catch (err) {
      setError('Failed to move to next activity');
      console.error('Error moving to next activity:', err);
    }
  };

  const handleEndSession = async () => {
    if (!isConnected || !sessionWsRef.current) {
      setError('WebSocket not connected. Please wait or refresh the page.');
      return;
    }

    try {
      await sessionWsRef.current.endSession(sessionId);
    } catch (err) {
      setError('Failed to end session');
      console.error('Error ending session:', err);
    }
  };

  const renderActivityContent = () => {
    if (!currentActivity) {
      return (
        <div className='text-center text-gray-500'>
          No activity currently active
        </div>
      );
    }

    switch (currentActivity.activityType) {
      case 'INFO_SLIDE':
        return <InfoSlideViewer activity={currentActivity} />;
      case 'QUIZ_BUTTONS':
        return (
          <QuizViewer
            activity={currentActivity}
            sessionWebSocket={sessionWsRef.current || undefined}
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

      {error && (
        <Alert variant='destructive' className='mb-4'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='max-w-4xl mx-auto'>
        <Card className='p-6 mb-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-semibold'>Current Activity</h2>
            <div className='space-x-2'>
              <Button onClick={handleNextActivity} disabled={!isConnected}>
                Next Activity
              </Button>
              <Button
                variant='destructive'
                onClick={handleEndSession}
                disabled={!isConnected}
              >
                End Session
              </Button>
            </div>
          </div>
          {renderActivityContent()}
        </Card>

        <Card className='p-6'>
          <h2 className='text-xl font-semibold mb-4'>Participants</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {participants.map((participant) => (
              <div
                key={participant.id}
                className='flex items-center space-x-3 p-3 bg-gray-50 rounded-lg'
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
                  <p className='font-medium'>{participant.displayName}</p>
                  <p className='text-sm text-gray-500'>
                    Score: {participant.realtimeScore}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default HostPage;
