'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Users,
  RefreshCw,
  ArrowRight,
  UserPlus,
  Check,
  Clock,
} from 'lucide-react';
import {
  SessionWebSocket,
  SessionParticipant,
  SessionSummary,
} from '@/websocket/sessionWebSocket';
import { useParams, useRouter } from 'next/navigation';
import ParticipantActivities from '../components/ParticipantActivities';
import { authApi } from '@/api-client/auth-api';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [isFormValid, setIsFormValid] = useState(false);

  const sessionWsRef = useRef<SessionWebSocket | null>(null);
  const isMounted = useRef(true);
  const hasInitialized = useRef(false);

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
          setIsFormValid(true);
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
        console.log('WebSocket connected successfully');
        if (isMounted.current) {
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
        }
      })
      .catch((err) => {
        console.error('Failed to connect WebSocket:', err);
        if (isMounted.current) {
          setError('Không thể kết nối tới phiên. Vui lòng thử lại sau.');
          setIsConnected(false);
          setIsConnecting(false);
        }
      });

    // Clean up khi component unmount
    return () => {
      if (sessionWsRef.current) {
        sessionWsRef.current.disconnect();
        sessionWsRef.current = null;
      }
    };
  }, [sessionCode]);

  // Kiểm tra khi tên hiển thị thay đổi
  useEffect(() => {
    setIsFormValid(displayName.trim().length > 0);
  }, [displayName]);

  // Tham gia phiên
  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }

    if (!sessionWsRef.current) {
      setError('Không có kết nối tới phiên');
      return;
    }

    if (!isConnected) {
      setError('Đang chờ kết nối, vui lòng thử lại sau');
      return;
    }

    try {
      const userId = userAccount?.userId || null;
      console.log(
        `Đang tham gia phiên với displayName=${displayName}, userId=${userId}, avatar=${avatar}`
      );

      // Truyền đủ 3 tham số: displayName, userId, và avatar
      await sessionWsRef.current.joinSession(displayName, userId, avatar);
      setHasJoined(true);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tham gia phiên:', err);
      setError('Không thể tham gia phiên. Vui lòng thử lại sau.');
    }
  };

  // Rời khỏi phiên
  const handleLeaveSession = async () => {
    if (sessionWsRef.current) {
      try {
        await sessionWsRef.current.leaveSession();
        setHasJoined(false);
      } catch (err) {
        console.error('Lỗi khi rời khỏi phiên:', err);
      }
    }
  };

  // Nếu phiên đã bắt đầu và người dùng đã tham gia, hiển thị hoạt động tương ứng
  if (isSessionStarted && hasJoined && sessionWsRef.current) {
    return (
      <ParticipantActivities
        sessionCode={sessionCode}
        displayName={displayName}
        sessionWs={sessionWsRef.current}
        onLeaveSession={() => setHasJoined(false)}
      />
    );
  }

  // Hiển thị form tham gia nếu chưa tham gia, hoặc màn hình chờ nếu đã tham gia
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0a1b25] to-[#0f2231] p-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='w-full max-w-4xl bg-[#0e1c26] rounded-3xl p-8 md:p-12 flex flex-col items-center shadow-2xl shadow-black/30 border border-white/5 backdrop-blur-sm'
      >
        {!hasJoined ? (
          // Form đăng ký tham gia
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='w-full max-w-md mx-auto text-white'
          >
            <div className='text-center mb-8'>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 120 }}
                className='mb-6'
              >
                <h1
                  className='text-6xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#aef359] to-[#e4f88d] drop-shadow-lg'
                  style={{ letterSpacing: '0.05em' }}
                >
                  {sessionCode}
                </h1>
              </motion.div>
              <h2 className='text-2xl font-semibold mb-2'>Tham gia phiên</h2>
              <p className='text-white/70'>Nhập tên của bạn để bắt đầu</p>
            </div>

            {isConnecting ? (
              <div className='flex items-center justify-center space-x-2 my-8'>
                <Loader2 className='h-6 w-6 animate-spin text-blue-400' />
                <p className='text-white/80'>{connectionStatus}</p>
              </div>
            ) : (
              <form onSubmit={handleJoinSession} className='space-y-6'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-white/80'>
                    Tên hiển thị
                  </label>
                  <Input
                    type='text'
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder='Nhập tên của bạn'
                    className='h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-[#aef359] focus:ring-[#aef359]/20'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium text-white/80'>
                    Avatar
                  </label>
                  <div className='flex items-center space-x-4'>
                    <Avatar className='h-16 w-16 rounded-full border-2 border-white/20'>
                      <AvatarImage src={avatar} alt={displayName} />
                      <AvatarFallback className='bg-gradient-to-br from-green-500 to-green-700 text-white text-lg'>
                        {displayName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      type='button'
                      onClick={() => setAvatar(generateAvatar())}
                      variant='outline'
                      className='text-white border-white/30 hover:bg-white/10 rounded-xl'
                    >
                      <RefreshCw className='h-4 w-4 mr-2' />
                      Đổi avatar
                    </Button>
                  </div>
                </div>

                <motion.div
                  whileHover={{ scale: isFormValid ? 1.03 : 1 }}
                  whileTap={{ scale: isFormValid ? 0.97 : 1 }}
                >
                  <Button
                    type='submit'
                    disabled={!isConnected || !isFormValid}
                    className={`w-full py-6 text-lg font-bold rounded-full shadow-xl transition-all duration-300 ${
                      isConnected && isFormValid
                        ? 'bg-gradient-to-r from-[#c5ee4f] to-[#8fe360] text-[#0f2231] hover:shadow-[#aef359]/20 hover:shadow-2xl'
                        : 'bg-gradient-to-r from-[#c5ee4f]/60 to-[#8fe360]/60 text-[#0f2231]/70'
                    }`}
                  >
                    {!isConnected ? (
                      <span className='flex items-center justify-center gap-2'>
                        <Loader2 className='h-5 w-5 animate-spin' />
                        Đang kết nối...
                      </span>
                    ) : (
                      <span className='flex items-center justify-center gap-2'>
                        <UserPlus className='h-5 w-5' />
                        Tham gia ngay
                      </span>
                    )}
                  </Button>
                </motion.div>
              </form>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className='mt-6 w-full'
                >
                  <Alert
                    variant='destructive'
                    className='bg-red-500/20 border border-red-500 text-white'
                  >
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          // Sảnh chờ sau khi đã tham gia
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className='w-full text-white'
          >
            <div className='text-center mb-10'>
              <h2 className='text-2xl font-semibold mb-2'>Sảnh chờ</h2>
              <p className='text-white/70'>Đang chờ host bắt đầu phiên</p>

              <motion.div
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={{
                  repeat: Infinity,
                  repeatType: 'reverse',
                  duration: 2,
                }}
                className='flex items-center justify-center gap-2 mt-4 mb-6 text-white/80'
              >
                <Clock className='h-5 w-5 text-[#aef359]' />
                <span>Phiên sẽ bắt đầu sớm...</span>
              </motion.div>

              <div className='mt-6 flex items-center justify-center gap-3'>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className='bg-white/10 text-white px-5 py-2 rounded-full flex items-center gap-2 border border-white/10'
                >
                  <Check className='h-4 w-4 text-green-400' />
                  <span className='font-medium'>{displayName}</span>
                </motion.div>
              </div>
            </div>

            {/* Danh sách người tham gia */}
            <div className='mt-6'>
              <div className='mb-6 text-center'>
                <h2 className='text-xl font-semibold mb-2 flex items-center justify-center gap-2'>
                  <Users className='h-5 w-5 text-[#aef359]' />
                  <span>Người tham gia ({participants.length})</span>
                </h2>
              </div>

              {participants.length > 0 ? (
                <ScrollArea className='max-h-[280px] pr-4'>
                  <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 justify-items-center'>
                    <AnimatePresence>
                      {participants.map((participant, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 * index, duration: 0.3 }}
                        >
                          <motion.div
                            whileHover={{ y: -5 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            className='flex flex-col items-center w-20 h-24'
                          >
                            <div className='relative'>
                              <Avatar className='h-16 w-16 rounded-full border-2 border-white/20 shadow-lg'>
                                <AvatarImage
                                  src={participant.displayAvatar}
                                  alt={participant.displayName}
                                />
                                <AvatarFallback className='bg-gradient-to-br from-green-500 to-green-700 text-white text-lg'>
                                  {participant.displayName
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {participant.displayName === displayName && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{
                                    delay: 0.2 + 0.05 * index,
                                    type: 'spring',
                                    stiffness: 200,
                                  }}
                                  className='absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full border-2 border-[#0e1c26] shadow-lg'
                                >
                                  <div className='w-2 h-2' />
                                </motion.div>
                              )}
                            </div>
                            <span className='text-xs text-white/80 mt-2 truncate max-w-full text-center font-medium'>
                              {participant.displayName}
                            </span>
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              ) : (
                <div className='text-center text-white/60 py-8'>
                  <p>Chưa có người tham gia nào khác</p>
                </div>
              )}
            </div>

            <div className='mt-10 flex justify-center'>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  onClick={handleLeaveSession}
                  variant='outline'
                  className='text-white border-white/30 hover:bg-white/10 px-6 py-5 rounded-xl'
                >
                  Rời phiên
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default SessionJoinPage;
