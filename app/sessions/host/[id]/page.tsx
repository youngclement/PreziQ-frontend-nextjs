'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { sessionsApi } from '@/api-client';
import { authApi } from '@/api-client/auth-api';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import HostActivities from '../../components/HostActivities';
import { Input } from '@/components/ui/input';

interface Participant {
  guestName: string;
  guestAvatar: string;
  userId: string | null;
}

interface UserAccount {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
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
  const [isInitializing, setIsInitializing] = useState(true);
  const actualConnectedRef = useRef(false);
  const hasCreatedSessionRef = useRef(false);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);

  // Lấy thông tin tài khoản người dùng khi component mount
  useEffect(() => {
    const fetchUserAccount = async () => {
      try {
        setIsLoadingAccount(true);
        const response = await authApi.getAccount();
        const userData = response.data.data;

        console.log('User account fetched:', userData);

        setUserAccount({
          userId: userData.userId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });

        // Sử dụng tên đầy đủ làm tên mặc định
        if (userData.firstName && userData.lastName) {
          setHostName(`${userData.firstName} ${userData.lastName}`);
        }
      } catch (err) {
        console.error('Failed to fetch user account:', err);
        // Không đặt lỗi vì đây không phải lỗi nghiêm trọng
      } finally {
        setIsLoadingAccount(false);
      }
    };

    fetchUserAccount();
  }, []);

  // Tạo session chỉ một lần khi component mount
  useEffect(() => {
    const createSession = async () => {
      // Nếu đã tạo session rồi, không tạo lại
      if (hasCreatedSessionRef.current) {
        console.log('Session already created, skipping API call');
        return;
      }

      if (!collectionId) {
        setError('Collection ID is required');
        setIsLoading(false);
        setIsInitializing(false);
        return;
      }

      try {
        console.log('Creating new session for collection:', collectionId);
        hasCreatedSessionRef.current = true; // Đánh dấu là đã gọi API

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
        console.error('Error creating session:', err);
        setError(err.response?.data?.message || 'Failed to create session');
        hasCreatedSessionRef.current = false; // Reset để có thể thử lại
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    createSession();

    return () => {
      // Đóng kết nối WebSocket khi component unmount
      if (sessionWsRef.current) {
        sessionWsRef.current.disconnect();
        sessionWsRef.current = null;
      }
      actualConnectedRef.current = false;
    };
  }, [collectionId]);

  // Thiết lập WebSocket khi có sessionCode và sessionId
  useEffect(() => {
    if (!sessionCode || !sessionId || isInitializing) return;

    console.log('Setting up WebSocket connection, isConnected:', isConnected);

    // Nếu đã có WebSocket kết nối với cùng sessionCode, không tạo kết nối mới
    if (
      sessionWsRef.current &&
      sessionWsRef.current.getSessionCode() === sessionCode
    ) {
      console.log(
        'WebSocket with this sessionCode already exists, checking connection'
      );
      const isConnectedNow = sessionWsRef.current.isClientConnected();
      console.log('Current connection status:', isConnectedNow);

      setIsConnected(isConnectedNow);
      actualConnectedRef.current = isConnectedNow;

      // Nếu đã disconnect, thử kết nối lại
      if (!isConnectedNow) {
        console.log('WebSocket disconnected, attempting to reconnect');
        sessionWsRef.current
          .connect()
          .then(() => {
            console.log('WebSocket reconnected successfully');
            setIsConnected(true);
            actualConnectedRef.current = true;
          })
          .catch((err) => {
            console.error('Failed to reconnect WebSocket:', err);
          });
      }
      return;
    }

    // Nếu có kết nối cũ, đóng trước khi tạo kết nối mới
    if (sessionWsRef.current) {
      console.log(
        'Cleaning up old WebSocket connection before creating new one'
      );
      sessionWsRef.current.disconnect();
      sessionWsRef.current = null;
      actualConnectedRef.current = false;
      setIsConnected(false);
    }

    // Log sessionId để debug
    console.log('Creating new WebSocket with sessionId:', sessionId);

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
      if (updatedParticipants.some((p) => p.displayName === hostName)) {
        console.log('Host participation detected in participants list');
        setHasJoined(true);
      }
    });

    sessionWs.onSessionStartHandler((session) => {
      console.log('Session started:', session);
      setIsSessionStarted(true);
    });

    sessionWs.onConnectionStatusChangeHandler((status) => {
      console.log('WebSocket connection status changed:', status);

      // Chỉ cập nhật trạng thái kết nối nếu status là Connected hoặc Disconnected
      if (
        status === 'Connected' ||
        status === 'Disconnected' ||
        status === 'Connecting...' ||
        status === 'Failed to connect' ||
        status === 'Connection error'
      ) {
        const isConnectedNow = status === 'Connected';
        console.log('Setting isConnected to:', isConnectedNow);
        setIsConnected(isConnectedNow);
        actualConnectedRef.current = isConnectedNow;
      }

      // Tự động join host khi kết nối thành công
      if (status === 'Connected' && !hasJoined) {
        setTimeout(() => {
          if (!sessionWsRef.current) return;

          console.log('Auto-joining session as host with name:', hostName);
          const userId = userAccount?.userId || null;
          console.log('Host userId:', userId);

          sessionWsRef.current
            .joinSession(hostName, userId)
            .then(() => {
              console.log('Host joined automatically');
              setHasJoined(true);
              setError(null); // Xóa lỗi nếu có khi tham gia thành công
            })
            .catch((err) => {
              console.error('Error auto-joining host:', err);
              setError(
                'Không thể tự động tham gia. Vui lòng tham gia thủ công.'
              );
            });
        }, 500); // Thêm timeout nhỏ để đảm bảo WS đã sẵn sàng
      }
    });

    // Thêm xử lý lỗi
    sessionWs.onErrorHandler((errorMsg) => {
      console.error('WebSocket error received:', errorMsg);
      setError(errorMsg);
    });

    console.log('Initializing WebSocket connection...');
    sessionWs
      .connect()
      .then(() => {
        console.log('WebSocket connection established');
        // Cập nhật trạng thái kết nối sau khi kết nối thành công
        setIsConnected(true);
        actualConnectedRef.current = true;
        setError(null); // Xóa lỗi hiện tại nếu kết nối thành công
      })
      .catch((err) => {
        console.error('WebSocket connection error:', err);
        setError('Failed to connect to WebSocket');
        setIsConnected(false);
        actualConnectedRef.current = false;
      });
  }, [sessionCode, sessionId, isInitializing]);

  // Sử dụng useEffect riêng cho việc tham gia tự động
  useEffect(() => {
    if (isConnected && !hasJoined && sessionWsRef.current) {
      console.log('Attempting auto-join since connection is established');
      // Auto-join logic would be here if not already handled in connection status change
    }
  }, [isConnected, hasJoined]);

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
      const userId = userAccount?.userId || null;
      console.log('Joining session with userId:', userId);

      await sessionWsRef.current.joinSession(hostName, userId);
      setHasJoined(true);
      setError(null);
    } catch (err) {
      setError('Failed to join session');
      console.error('Error joining session:', err);
    }
  };

  const handleSessionEnd = () => {
    console.log('Session end event received, waiting for summary data...');
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

      {/* Debug info */}
      <div className='text-xs text-gray-500 mb-2 text-center'>
        Connection: {isConnected ? 'Connected' : 'Disconnected'} | Joined:{' '}
        {hasJoined ? 'Yes' : 'No'} | Session: {sessionCode || 'None'}
      </div>

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

              {!hasJoined ? (
                <div className='mt-6'>
                  <div className='flex gap-4 items-center'>
                    <Input
                      type='text'
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder='Nhập tên của bạn'
                      className='flex-1'
                    />
                    <Button
                      onClick={handleJoinSession}
                      disabled={!isConnected || hasJoined}
                    >
                      {!isConnected
                        ? 'Đang kết nối...'
                        : hasJoined
                        ? 'Đã tham gia'
                        : 'Tham gia với tư cách Host'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className='mt-6 text-center text-green-600'>
                  Bạn đã tham gia phiên này với tên "{hostName}"
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
                    'Vui lòng tham gia trước'
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
