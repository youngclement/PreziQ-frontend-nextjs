'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { sessionsApi } from '@/api-client';
import {
  SessionWebSocket,
  SessionParticipant,
} from '@/websocket/sessionWebSocket';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

export default function HostSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionId = searchParams.get('collectionId');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const sessionWsRef = useRef<SessionWebSocket | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const createSession = async () => {
      if (!collectionId) {
        setError('Collection ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const response = await sessionsApi.createSession({
          collectionId: collectionId.trim(),
        });

        setSessionCode(response.data.sessionCode);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to create session');
      } finally {
        setIsLoading(false);
      }
    };

    createSession();
  }, [collectionId]);

  useEffect(() => {
    return () => {
      if (sessionWsRef.current) {
        sessionWsRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (!sessionCode) return;

    const sessionWs = new SessionWebSocket(sessionCode);
    sessionWsRef.current = sessionWs;

    sessionWs.onParticipantsUpdateHandler((updatedParticipants) => {
      console.log('Participants updated:', updatedParticipants);
      setParticipants(updatedParticipants);
    });

    sessionWs.onSessionStartHandler((session) => {
      console.log('Session started:', session);
      if (session.sessionId) {
        localStorage.setItem('sessionCode', session.sessionCode);
        router.push(`/sessions/show/${session.sessionId}/host`);
      }
    });

    sessionWs.onSessionEndHandler((session) => {
      console.log('Session ended:', session);
    });

    sessionWs.onSessionSummaryHandler((summaries) => {
      console.log('Session summaries:', summaries);
    });

    sessionWs
      .connect()
      .then(() => {
        setIsConnected(true);
      })
      .catch((err) => {
        setError('Failed to connect to WebSocket');
        console.error('WebSocket connection error:', err);
      });

    return () => {
      if (sessionWsRef.current) {
        sessionWsRef.current.disconnect();
      }
    };
  }, [sessionCode]);

  const handleStartSession = async () => {
    if (!sessionWsRef.current) {
      setError('WebSocket not connected');
      return;
    }

    if (!sessionCode) {
      setError('Session code is missing');
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      await sessionWsRef.current.startSession();
      // router.push(`/sessions/show?code=${sessionCode}`);
    } catch (err) {
      setError('Failed to start session');
      console.error('Error starting session:', err);
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-2xl mx-auto text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p className='text-lg'>Creating your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-center mb-8'>Host Session</h1>

      <div className='max-w-2xl mx-auto'>
        <Card className='p-6'>
          {sessionCode ? (
            <div className='space-y-4'>
              <div className='text-center'>
                <h2 className='text-xl font-semibold mb-2'>
                  Session Created Successfully!
                </h2>
                <p className='text-gray-600 mb-4'>
                  Share this code with your participants:
                </p>
                <div className='bg-gray-100 p-4 rounded-lg'>
                  <span className='text-2xl font-mono font-bold'>
                    {sessionCode}
                  </span>
                </div>
              </div>

              {participants.length > 0 && (
                <div className='mt-6'>
                  <h3 className='text-lg font-semibold mb-3'>
                    Participants ({participants.length})
                  </h3>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
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
                          <p className='font-medium'>
                            {participant.displayName}
                          </p>
                          <p className='text-sm text-gray-500'>
                            Score: {participant.realtimeScore}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className='flex gap-4'>
                <Button
                  onClick={handleStartSession}
                  disabled={!isConnected || isStarting}
                  className='flex-1'
                >
                  {!isConnected ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Connecting...
                    </span>
                  ) : isStarting ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Starting Session...
                    </span>
                  ) : (
                    'Start Session'
                  )}
                </Button>
                <Button
                  onClick={() => router.push('/collections')}
                  variant='outline'
                  className='flex-1'
                >
                  Back to Collections
                </Button>
              </div>
            </div>
          ) : null}

          {error && (
            <Alert variant='destructive' className='mt-4'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </Card>
      </div>
    </div>
  );
}
