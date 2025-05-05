'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  SessionWebSocket,
  SessionParticipant,
} from '@/websocket/sessionWebSocket';
import { useRouter } from 'next/navigation';

const LobbyPage = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [hasJoined, setHasJoined] = useState(false);

  const sessionWsRef = useRef<SessionWebSocket | null>(null);
  const isMounted = useRef(true);
  const router = useRouter();

  const generateAvatar = useCallback(() => {
    const randomSeed = Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${randomSeed}`;
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const sessionWs = new SessionWebSocket(sessionCode);
    sessionWsRef.current = sessionWs;

    sessionWs.onConnectionStatusChangeHandler((status) => {
      if (!isMounted.current) return;
      setConnectionStatus(status);
      setIsConnected(status === 'Connected');
    });

    sessionWs.onErrorHandler((error) => {
      if (!isMounted.current) return;
      setError(error);
    });

    sessionWs.onParticipantsUpdateHandler((updatedParticipants) => {
      if (!isMounted.current) return;
      setParticipants(updatedParticipants);
      if (
        guestName &&
        updatedParticipants.some((p) => p.displayName === guestName)
      ) {
        setHasJoined(true);
      }
    });

    sessionWs.onSessionStartHandler((session) => {
      console.log('Session started:', session);
      if (isMounted.current && session.sessionId) {
        router.push(`/sessions/show/${session.sessionId}/participants`);
      }
    });

    sessionWs.onSessionEndHandler((session) => {
      console.log('Session ended:', session);
    });

    sessionWs.onSessionSummaryHandler((summaries) => {
      console.log('Session summaries:', summaries);
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
  }, [sessionCode, router]);

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode.trim()) {
      setError('Session code is required');
      return;
    }
    if (!isConnected || !sessionWsRef.current) {
      setError('WebSocket not connected. Please wait or refresh the page.');
      return;
    }
    setShowGuestForm(true);
    setAvatar(generateAvatar());
  };

  const handleSubmitGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setError('Guest name is required');
      return;
    }
    if (!isConnected || !sessionWsRef.current) {
      setError('WebSocket not connected. Please wait or refresh the page.');
      return;
    }

    try {
      localStorage.setItem('sessionCode', sessionCode);
      sessionWsRef.current.updateSessionCode(sessionCode);
      await sessionWsRef.current.joinSession(guestName);
      setHasJoined(true);
      setError(null);
    } catch (err) {
      setError('Failed to join session');
      console.error('Error joining session:', err);
    }
  };

  const handleLeaveSession = async () => {
    if (!isConnected || !sessionWsRef.current) {
      setError('WebSocket not connected. Please wait or refresh the page.');
      return;
    }

    try {
      await sessionWsRef.current.leaveSession();
      setSessionCode('');
      setShowGuestForm(false);
      setGuestName('');
      setAvatar('');
      setParticipants([]);
      setError(null);
      setHasJoined(false);
      sessionWsRef.current.updateSessionCode('');
    } catch (err) {
      setError('Failed to leave session');
      console.error('Error leaving session:', err);
    }
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-center mb-8'>Lobby</h1>
      <div className='text-sm text-center text-gray-500 mb-4'>
        {connectionStatus}
      </div>

      <div className='max-w-4xl mx-auto'>
        <Card className='p-6'>
          {!showGuestForm ? (
            <form onSubmit={handleJoinSession} className='space-y-4'>
              <div className='space-y-2'>
                <label htmlFor='sessionCode' className='text-sm font-medium'>
                  Session Code
                </label>
                <Input
                  id='sessionCode'
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  placeholder='Enter session code'
                  disabled={!isConnected}
                />
              </div>
              <Button type='submit' className='w-full' disabled={!isConnected}>
                {isConnected ? (
                  'Join Session'
                ) : (
                  <span className='flex items-center gap-2'>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    Waiting for connection...
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <div className='space-y-4'>
              {!hasJoined ? (
                <form onSubmit={handleSubmitGuest} className='space-y-4'>
                  <div className='space-y-2'>
                    <label htmlFor='guestName' className='text-sm font-medium'>
                      Guest Name
                    </label>
                    <Input
                      id='guestName'
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder='Enter your name'
                      disabled={!isConnected}
                    />
                  </div>
                  <div className='flex justify-center'>
                    <Avatar className='h-20 w-20'>
                      <AvatarImage src={avatar} alt='Avatar' />
                      <AvatarFallback>AV</AvatarFallback>
                    </Avatar>
                  </div>
                  <Button
                    type='submit'
                    className='w-full'
                    disabled={!isConnected}
                  >
                    Join as Guest
                  </Button>
                </form>
              ) : (
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <h2 className='text-xl font-semibold'>Participants</h2>
                    <Button
                      variant='destructive'
                      onClick={handleLeaveSession}
                      disabled={!isConnected}
                    >
                      Leave Session
                    </Button>
                  </div>
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
            </div>
          )}

          {error && (
            <Alert variant='destructive' className='mt-4'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </Card>

        {hasJoined && participants.length > 0 && (
          <Card className='p-6 mt-6'>
            <h2 className='text-xl font-semibold mb-4'>
              Participants ({participants.length}/100)
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className='flex flex-col items-center p-4 bg-gray-50 rounded-lg'
                >
                  <Avatar className='h-16 w-16 mb-2'>
                    <AvatarImage
                      src={participant.displayAvatar}
                      alt={participant.displayName}
                    />
                    <AvatarFallback>
                      {participant.displayName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-sm font-medium truncate max-w-full'>
                    {participant.displayName}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LobbyPage;
