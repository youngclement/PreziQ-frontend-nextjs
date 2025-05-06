'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { sessionsApi } from '@/api-client';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import HostActivities from '../../components/HostActivities';
import { Input } from '@/components/ui/input';

interface Participant {
  guestName: string;
  guestAvatar: string;
  userId: string | null;
}

export default function HostSessionPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const sessionWsRef = useRef<SessionWebSocket | null>(null);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [hostName, setHostName] = useState<string>('Host');
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const createSession = async () => {
      if (!collectionId) {
        setError('Collection ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const response = await sessionsApi.createSession({
          collectionId: collectionId,
        });

        // Lưu sessionCode và sessionId từ response
        const responseSessionId = response.data.sessionId;
        const responseSessionCode = response.data.sessionCode;

        console.log('Session created with ID:', responseSessionId);
        console.log('Session created with Code:', responseSessionCode);

        localStorage.setItem('sessionCode', responseSessionCode);
        localStorage.setItem('sessionId', responseSessionId);

        setSessionCode(responseSessionCode);
        setSessionId(responseSessionId);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to create session');
      } finally {
        setIsLoading(false);
      }
    };

    createSession();

    return () => {
      // Đóng kết nối WebSocket khi component unmount
      if (sessionWsRef.current) {
        sessionWsRef.current.disconnect();
      }
    };
  }, [collectionId]);

  useEffect(() => {
    if (!sessionCode || !sessionId) return;

    // Log sessionId để debug
    console.log('Connecting to WebSocket with sessionId:', sessionId);

    // Nếu đã có WebSocket kết nối, không tạo kết nối mới
    if (sessionWsRef.current) return;

    const sessionWs = new SessionWebSocket(sessionCode, sessionId);
    sessionWsRef.current = sessionWs;

    sessionWs.onParticipantsUpdateHandler((updatedParticipants) => {
      const participantsData = updatedParticipants.map((p: any) => ({
        guestName: p.displayName || 'Unknown',
        guestAvatar:
          p.displayAvatar || 'https://api.dicebear.com/9.x/pixel-art/svg',
        userId: p.user?.userId || null,
      }));
      setParticipants(participantsData);
      // Kiểm tra xem host đã join chưa
      if (updatedParticipants.some(p => p.displayName === hostName)) {
        setHasJoined(true);
      }
    });

    sessionWs.onSessionStartHandler((session) => {
      console.log('Session started:', session);
      setIsSessionStarted(true);
    });

    sessionWs.onConnectionStatusChangeHandler((status) => {
      setIsConnected(status === 'Connected');
      // Tự động join khi kết nối thành công
      if (status === 'Connected' && !hasJoined) {
        handleJoinSession();
      }
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
  }, [sessionCode, sessionId]);

  const handleStartSession = async () => {
    if (!sessionWsRef.current) {
      setError('WebSocket not connected');
      return;
    }

    if (!sessionId) {
      setError('Session ID is missing');
      return;
    }

    if (!hasJoined) {
      setError('Host must join the session first');
      return;
    }

    try {
      // Đảm bảo đã cập nhật sessionId trong sessionWs
      if (sessionId && sessionWsRef.current) {
        console.log('Starting session with ID:', sessionId);
        sessionWsRef.current.updateSessionId(sessionId);
        await sessionWsRef.current.startSession();
      } else {
        throw new Error('Session ID is not available');
      }

      // Đặt trạng thái session đã bắt đầu
      setIsSessionStarted(true);
    } catch (err) {
      setError('Failed to start session');
      console.error('Error starting session:', err);
    }
  };

  const handleJoinSession = async () => {
    if (!sessionWsRef.current) {
      setError('WebSocket not connected');
      return;
    }

    if (!sessionCode) {
      setError('Session code is missing');
      return;
    }

    try {
      await sessionWsRef.current.joinSession(hostName);
      setHasJoined(true);
      setError(null);
    } catch (err) {
      setError('Failed to join session');
      console.error('Error joining session:', err);
    }
  };

  const handleSessionEnd = () => {
    setIsSessionStarted(false);
  };

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-2xl mx-auto text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p className='text-lg'>Đang tạo phiên của bạn...</p>
        </div>
      </div>
    );
  }

  // Hiển thị giao diện sau khi đã bắt đầu session, sử dụng component HostActivities
  if (isSessionStarted && sessionId && sessionCode && sessionWsRef.current) {
    console.log('Rendering host activities with session ID:', sessionId);
    return (
      <HostActivities
        sessionId={sessionId}
        sessionCode={sessionCode}
        sessionWs={sessionWsRef.current}
        onSessionEnd={handleSessionEnd}
      />
    );
  }

  // Hiển thị giao diện trước khi bắt đầu session
  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-center mb-8'>Host Session</h1>

      <div className='max-w-4xl mx-auto'>
        <Card className='p-6 mb-6'>
          {sessionCode ? (
            <div className='space-y-4'>
              <div className='text-center'>
                <h2 className='text-xl font-semibold mb-2'>
                  Phiên đã được tạo thành công!
                </h2>
                <p className='text-gray-600 mb-4'>
                  Chia sẻ mã này với người tham gia:
                </p>
                <div className='bg-gray-100 p-4 rounded-lg'>
                  <span className='text-2xl font-mono font-bold'>
                    {sessionCode}
                  </span>
                </div>
              </div>

              {!hasJoined && (
                <div className='mt-6'>
                  <div className='flex gap-4 items-center'>
                    <Input
                      type='text'
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder='Nhập tên của bạn'
                      className='flex-1'
                    />
                    <Button onClick={handleJoinSession}>
                      Tham gia với tư cách Host
                    </Button>
                  </div>
                </div>
              )}

              <div className='flex gap-4'>
                <Button
                  onClick={handleStartSession}
                  disabled={!isConnected || !hasJoined}
                  className='flex-1'
                >
                  {!isConnected ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Đang kết nối...
                    </span>
                  ) : !hasJoined ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Đang tham gia...
                    </span>
                  ) : (
                    'Bắt đầu phiên'
                  )}
                </Button>
                <Button
                  onClick={() => router.push('/collections')}
                  variant='outline'
                  className='flex-1'
                >
                  Quay lại bộ sưu tập
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

        {participants.length > 0 && (
          <Card className='p-6'>
            <h2 className='text-xl font-semibold mb-4'>
              Thành viên ({participants.length}/100)
            </h2>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
              {participants.map((participant, index) => (
                <div
                  key={index}
                  className='flex flex-col items-center p-4 bg-gray-50 rounded-lg'
                >
                  <Avatar className='h-16 w-16 mb-2'>
                    <AvatarImage
                      src={participant.guestAvatar}
                      alt={participant.guestName}
                    />
                    <AvatarFallback>{participant.guestName[0]}</AvatarFallback>
                  </Avatar>
                  <span className='text-sm font-medium truncate max-w-full'>
                    {participant.guestName}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
