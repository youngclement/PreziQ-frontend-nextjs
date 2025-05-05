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

const ParticipantPage = () => {
  const params = useParams();
  const sessionId = params.id as string;
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [myScore, setMyScore] = useState(0);

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
      // Update my score if I'm in the participants list
      const me = updatedParticipants.find(
        (p) => p.user?.userId === 'my-user-id'
      ); // Replace with actual user ID
      if (me) {
        setMyScore(me.realtimeScore);
      }
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

  const handleSubmitAnswer = async (answer: any) => {
    if (!isConnected || !sessionWsRef.current || !currentActivity) {
      setError('Cannot submit answer at this time');
      return;
    }

    try {
      await sessionWsRef.current.submitActivity({
        sessionId,
        activityId: currentActivity.id,
        responseScore: answer.score,
      });
    } catch (err) {
      setError('Failed to submit answer');
      console.error('Error submitting answer:', err);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-center mb-8'>Session</h1>
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
            <div className='text-lg font-medium'>Your Score: {myScore}</div>
          </div>
          {currentActivity ? (
            <div className='p-4 bg-gray-50 rounded-lg'>
              <pre className='whitespace-pre-wrap'>
                {JSON.stringify(currentActivity, null, 2)}
              </pre>
              {/* Add your quiz/activity UI components here */}
            </div>
          ) : (
            <div className='text-center text-gray-500'>
              Waiting for next activity...
            </div>
          )}
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

export default ParticipantPage;
