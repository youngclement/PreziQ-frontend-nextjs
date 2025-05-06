'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import {
  SessionWebSocket,
  SessionParticipant,
  SessionSummary,
} from '@/websocket/sessionWebSocket';
import { useParams, useRouter } from 'next/navigation';
import ParticipantActivities from '../components/ParticipantActivities';
import { authApi } from '@/api-client/auth-api';

interface UserAccount {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

const SessionJoinPage = () => {
  const params = useParams();
  const sessionCode = params.code as string;
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Đang kết nối...');
  const [hasJoined, setHasJoined] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<any>(null);

  const sessionWsRef = useRef<SessionWebSocket | null>(null);
  const isMounted = useRef(true);
  const router = useRouter();

  const generateAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${randomSeed}`;
  };

  // Lấy thông tin tài khoản người dùng
  useEffect(() => {
    const fetchUserAccount = async () => {
      try {
        setIsLoadingAccount(true);
        const response = await authApi.getAccount();
        const userData = response.data.data;

        console.log('Đã lấy thông tin tài khoản người dùng:', userData);

        setUserAccount({
          userId: userData.userId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });

        // Sử dụng tên đầy đủ làm tên mặc định nếu có
        if (userData.firstName && userData.lastName) {
          setDisplayName(`${userData.firstName} ${userData.lastName}`);
        }
      } catch (err) {
        console.error('Không thể lấy thông tin tài khoản:', err);
        // Không đặt lỗi vì đây không phải lỗi nghiêm trọng
      } finally {
        setIsLoadingAccount(false);
      }
    };

    fetchUserAccount();
  }, []);

  // Khởi tạo avatar và các giá trị ban đầu
  useEffect(() => {
    isMounted.current = true;
    setAvatar(generateAvatar());

    return () => {
      isMounted.current = false;

      // Ngắt kết nối WebSocket khi unmount
      if (sessionWsRef.current) {
        console.log('Ngắt kết nối WebSocket khi unmount');
        sessionWsRef.current.disconnect();
        sessionWsRef.current = null;
      }
    };
  }, []);

  // Khởi tạo kết nối WebSocket khi trang được tải
  useEffect(() => {
    if (!sessionCode) {
      console.error('Không có mã phiên!');
      setError('Vui lòng quay lại trang chính và nhập mã phiên');
      setIsConnecting(false);
      return;
    }

    console.log('Khởi tạo kết nối WebSocket với mã phiên:', sessionCode);
    setIsConnecting(true);

    // Tạo đối tượng WebSocket mới
    const sessionWs = new SessionWebSocket(sessionCode);
    sessionWsRef.current = sessionWs;

    // Thiết lập các handlers
    sessionWs.onConnectionStatusChangeHandler((status) => {
      if (!isMounted.current) return;
      console.log('Trạng thái kết nối thay đổi:', status);

      let translatedStatus = status;
      if (status === 'Connected') translatedStatus = 'Đã kết nối';
      else if (status === 'Connecting...') translatedStatus = 'Đang kết nối...';
      else if (status === 'Disconnected') translatedStatus = 'Mất kết nối';

      setConnectionStatus(translatedStatus);
      setIsConnected(status === 'Connected');
      if (status === 'Connected') {
        setIsConnecting(false);
      }
    });

    sessionWs.onErrorHandler((error) => {
      if (!isMounted.current) return;
      console.error('Lỗi WebSocket:', error);
      setError(error);
      setIsConnecting(false);
    });

    sessionWs.onParticipantsUpdateHandler((updatedParticipants) => {
      if (!isMounted.current) return;
      console.log(
        'Nhận cập nhật danh sách người tham gia:',
        updatedParticipants.length
      );

      // Cập nhật danh sách người tham gia để hiển thị
      setParticipants(updatedParticipants);

      // Cập nhật điểm của người dùng hiện tại
      if (displayName) {
        const me = updatedParticipants.find(
          (p) => p.displayName === displayName
        );
        if (me) {
          console.log('Cập nhật thông tin người dùng:', me);
          setMyScore(me.realtimeScore);
        }
      }

      // Kiểm tra xem người dùng đã tham gia chưa
      if (
        displayName &&
        updatedParticipants.some((p) => p.displayName === displayName)
      ) {
        console.log('Người tham gia đã được phát hiện trong danh sách');
        setHasJoined(true);
      }
    });

    // Theo dõi khi session bắt đầu
    sessionWs.onSessionStartHandler((session: SessionSummary) => {
      if (!isMounted.current) return;
      console.log('Session started:', session);
      setIsSessionStarted(true);
    });

    // Theo dõi hoạt động mới
    sessionWs.onNextActivityHandler((activity) => {
      if (!isMounted.current) return;
      console.log('Next activity received:', activity);

      if (activity) {
        const processedActivity = {
          ...activity,
          sessionId: activity.sessionId || sessionCode,
          activityType: activity.activityType || 'UNKNOWN',
        };

        setCurrentActivity(processedActivity);
        // Đảm bảo rằng phiên đã được bắt đầu khi nhận được hoạt động
        setIsSessionStarted(true);
      }
    });

    // Kết nối đến server
    sessionWs
      .connect()
      .then(() => {
        console.log('Đã kết nối thành công đến server WebSocket');
        setIsConnected(true);
        setIsConnecting(false);
      })
      .catch((err) => {
        console.error('Lỗi khi kết nối đến server WebSocket:', err);
        setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
        setIsConnecting(false);
      });

    return () => {
      // Cleanup callback này chỉ được gọi khi component unmount
      // hoặc khi dependency array thay đổi.
      // Không đóng kết nối ở đây vì nó sẽ được tái sử dụng
    };
  }, [sessionCode]);

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setError('Vui lòng nhập tên hiển thị');
      return;
    }

    if (!sessionWsRef.current) {
      setError('Chưa khởi tạo kết nối WebSocket');
      return;
    }

    if (!sessionWsRef.current.isClientConnected()) {
      setError('Đang mất kết nối. Vui lòng đợi hoặc làm mới trang.');
      return;
    }

    try {
      // Lấy userId từ thông tin tài khoản nếu có
      const userId = userAccount?.userId || null;
      console.log('Gửi yêu cầu tham gia với tên:', displayName);
      console.log('userId:', userId);
      setIsConnecting(true);

      // Gửi sự kiện JOIN đến server với userId
      await sessionWsRef.current.joinSession(displayName, userId);

      console.log('Đã tham gia phiên thành công');
      setHasJoined(true);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tham gia phiên:', err);
      setError('Không thể tham gia phiên');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLeaveSession = async () => {
    router.push('/sessions');
  };

  // Nếu đang tải thông tin tài khoản, hiển thị trạng thái tải
  if (isLoadingAccount) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-2xl mx-auto text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p className='text-lg'>Đang tải thông tin tài khoản...</p>
        </div>
      </div>
    );
  }

  // Hiển thị thông tin người dùng đã tham gia
  const renderUserInfo = () => {
    return (
      <div className='flex items-center justify-between p-4 bg-blue-50 rounded-lg mb-6'>
        <div className='flex items-center gap-4'>
          <Avatar>
            <AvatarImage src={avatar} alt='Avatar' />
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
          disabled={!isConnected}
        >
          Rời phiên
        </Button>
      </div>
    );
  };

  // Hiển thị danh sách người tham gia
  const renderParticipantsList = () => {
    if (participants.length === 0) {
      return (
        <div className='text-center py-6 text-gray-500'>
          <p>Chưa có người tham gia nào trong phiên này</p>
        </div>
      );
    }

    return (
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
    );
  };

  // Hiển thị trạng thái đang chờ host bắt đầu phiên
  const renderWaitingForStart = () => {
    return (
      <div className='text-center py-8'>
        <div className='mb-4'>
          <Loader2 className='h-10 w-10 animate-spin mx-auto text-blue-500' />
        </div>
        <h3 className='text-xl font-medium mb-2'>Đang chờ bắt đầu phiên</h3>
        <p className='text-gray-500'>
          Giáo viên sẽ bắt đầu phiên học trong giây lát. Vui lòng đợi...
        </p>
      </div>
    );
  };

  return (
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-center mb-8'>
        Phiên học: {sessionCode}
      </h1>
      <div className='text-sm text-center text-gray-500 mb-4'>
        {connectionStatus}
      </div>

      {error && !isSessionStarted && (
        <Alert variant='destructive' className='mb-4 max-w-4xl mx-auto'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='max-w-4xl mx-auto'>
        {!hasJoined ? (
          <>
            <Card className='p-6 mb-6'>
              <form onSubmit={handleJoinSession} className='space-y-4'>
                <div className='space-y-2'>
                  <label htmlFor='displayName' className='text-sm font-medium'>
                    Tên hiển thị
                  </label>
                  <Input
                    id='displayName'
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder='Nhập tên của bạn'
                    disabled={isConnecting || !isConnected}
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
                  disabled={isConnecting || !isConnected}
                >
                  {isConnecting ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Đang kết nối...
                    </span>
                  ) : !isConnected ? (
                    <span className='flex items-center gap-2'>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Chưa kết nối
                    </span>
                  ) : (
                    'Tham gia'
                  )}
                </Button>
              </form>
            </Card>

            {/* Hiển thị danh sách người tham gia trong sảnh chờ khi chưa tham gia */}
            {participants.length > 0 && (
              <Card className='p-6'>
                <div className='border-b p-4'>
                  <h2 className='text-xl font-semibold'>
                    Sảnh chờ ({participants.length} người tham gia)
                  </h2>
                </div>
                <div className='p-4'>
                  <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                    {participants.map((participant) => (
                      <div
                        key={participant.id}
                        className='flex flex-col items-center p-4 bg-gray-50 rounded-lg'
                      >
                        <Avatar className='h-16 w-16 mb-2'>
                          <AvatarImage
                            src={participant.displayAvatar}
                            alt={participant.displayName}
                          />
                          <AvatarFallback>
                            {participant.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className='text-sm font-medium truncate max-w-full'>
                          {participant.displayName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Hiển thị khi đã tham gia */}
            {isSessionStarted && sessionWsRef.current ? (
              // Nếu phiên đã bắt đầu, hiển thị hoạt động
              <ParticipantActivities
                sessionCode={sessionCode}
                sessionWs={sessionWsRef.current}
                displayName={displayName}
                onLeaveSession={handleLeaveSession}
              />
            ) : (
              // Nếu chưa bắt đầu, hiển thị danh sách người tham gia và thông báo đang chờ
              <div className='space-y-6'>
                {renderUserInfo()}

                <Card className='p-6'>
                  <div className='border-b p-4'>
                    <h2 className='text-xl font-semibold'>
                      Đang chờ phiên bắt đầu
                    </h2>
                  </div>
                  <div className='p-4'>{renderWaitingForStart()}</div>
                </Card>

                <Card className='p-6'>
                  <div className='border-b p-4'>
                    <h2 className='text-xl font-semibold'>
                      Người tham gia ({participants.length})
                    </h2>
                  </div>
                  <div className='p-4'>{renderParticipantsList()}</div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SessionJoinPage;
