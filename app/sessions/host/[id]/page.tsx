'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Copy,
  QrCode,
  Users,
  Settings,
  LinkIcon,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { sessionsApi } from '@/api-client';
import { authApi } from '@/api-client/auth-api';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import HostActivities from '../../components/HostActivities';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [copySuccess, setCopySuccess] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [hidePin, setHidePin] = useState(false);

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
        const responseQrCodeUrl = response.data.joinSessionQrUrl;

        console.log('Session created with ID:', responseSessionId);
        console.log('Session created with Code:', responseSessionCode);
        console.log('Session QR code URL:', responseQrCodeUrl);

        localStorage.setItem('sessionCode', responseSessionCode);
        localStorage.setItem('sessionId', responseSessionId);

        setSessionCode(responseSessionCode);
        setSessionId(responseSessionId);
        setQrCodeUrl(responseQrCodeUrl);
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
      sessionWsRef.current.getSessionCode() === sessionCode &&
      sessionWsRef.current.isClientConnected()
    ) {
      console.log('WebSocket already connected, skipping new connection');
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
          sessionWsRef.current
            .joinSession(hostName, userId)
            .then(() => {
              console.log('Host joined session successfully');
              setHasJoined(true);
            })
            .catch((err) => {
              console.error('Failed to join session as host:', err);
            });
        }, 1000);
      }
    });

    // Kết nối WebSocket
    sessionWs
      .connect()
      .then(() => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        actualConnectedRef.current = true;
      })
      .catch((err) => {
        console.error('Failed to connect WebSocket:', err);
        setError('Failed to connect to session');
      });

    return () => {
      // Không đóng kết nối khi component unmount
      console.log('Component unmounted, keeping WebSocket connection alive');
    };
  }, [
    sessionCode,
    sessionId,
    isInitializing,
    hostName,
    hasJoined,
    userAccount?.userId,
  ]);

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

  const handleCopy = () => {
    if (sessionCode) {
      navigator.clipboard.writeText(sessionCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const toggleHidePin = () => {
    setHidePin(!hidePin);
  };

  // Format session code for display (add space in the middle)
  const formatSessionCode = (code: string) => {
    if (!code || code.length < 6) return code;
    // Không chia code thành 2 phần nữa
    return code;
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-[#0a1b25] to-[#0f2231] flex flex-col items-center justify-center p-4'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className='text-center text-white px-4 sm:px-6'
        >
          <div className='relative'>
            <Loader2 className='h-12 w-12 sm:h-16 sm:w-16 animate-spin mx-auto mb-4 sm:mb-6 text-blue-400' />
            <div className='absolute inset-0 bg-gradient-to-r from-[#aef359]/30 to-[#e4f88d]/30 blur-xl rounded-full' />
          </div>
          <h2 className='text-xl sm:text-2xl font-bold mb-2'>
            Đang thiết lập phiên
          </h2>
          <p className='text-white/70 text-sm sm:text-base'>
            PreziQ đang chuẩn bị phòng chờ của bạn...
          </p>
        </motion.div>
      </div>
    );
  }

  // Hiển thị giao diện sau khi đã bắt đầu session, sử dụng component HostActivities
  if (isSessionStarted && sessionId && sessionCode && sessionWsRef.current) {
    console.log('Rendering host activities with session ID:', sessionId);
    return (
      <div className='min-h-screen w-full max-w-full overflow-hidden'>
        <HostActivities
          sessionId={sessionId}
          sessionCode={sessionCode}
          sessionWs={sessionWsRef.current}
          onSessionEnd={handleSessionEnd}
        />
      </div>
    );
  }

  // Hiển thị giao diện phòng chờ theo mẫu quiz.com
  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0a1b25] to-[#0f2231] p-4 sm:p-6'>
      {/* Container chính */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='w-full max-w-xs sm:max-w-xl md:max-w-3xl lg:max-w-4xl bg-[#0e1c26] rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 flex flex-col items-center shadow-2xl shadow-black/30 border border-white/5 backdrop-blur-sm'
      >
        {/* Top Section - Join at, PIN code, QR Code */}
        <div className='w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10 md:mb-14'>
          {/* Left - Join at */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className='flex flex-col items-center sm:items-start'
          >
            <h2 className='text-white/80 mb-2 text-xl font-medium'>Join at:</h2>
            <div className='mb-2'>
              <span className='text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-300 via-yellow-300 to-green-200 text-transparent bg-clip-text drop-shadow-md'>
                preziq.com
              </span>
            </div>
          </motion.div>

          {/* Middle - PIN code */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className='flex flex-col items-center col-span-1 md:col-span-1 order-first sm:order-none'
          >
            <h2 className='text-white/80 mb-2 text-xl font-medium'>
              PIN code:
            </h2>
            <motion.div
              className='relative'
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.5,
                duration: 0.4,
                type: 'spring',
                stiffness: 120,
              }}
            >
              <AnimatePresence mode='wait'>
                {!hidePin ? (
                  <motion.h1
                    key='visible-pin'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#aef359] to-[#e4f88d] drop-shadow-lg'
                    style={{ letterSpacing: '0.05em' }}
                  >
                    {sessionCode ? formatSessionCode(sessionCode) : 'XXXXXX'}
                  </motion.h1>
                ) : (
                  <motion.h1
                    key='hidden-pin'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className='text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#aef359] to-[#e4f88d] drop-shadow-lg'
                    style={{ letterSpacing: '0.05em' }}
                  >
                    ⬤⬤⬤⬤⬤⬤
                  </motion.h1>
                )}
              </AnimatePresence>
            </motion.div>
            <div className='flex gap-6 mt-3'>
              <motion.button
                onClick={handleCopy}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='text-white/80 hover:text-white flex items-center gap-1.5 text-sm transition-colors duration-200'
              >
                <LinkIcon className='w-4 h-4' />
                Copy
              </motion.button>
              <motion.button
                onClick={toggleHidePin}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='text-white/80 hover:text-white flex items-center gap-1.5 text-sm transition-colors duration-200'
              >
                <EyeOff className='w-4 h-4' />
                Hide
              </motion.button>
              <AnimatePresence>
                {copySuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className='text-white/90 text-sm flex items-center gap-1'
                  >
                    <CheckCircle2 className='w-3.5 h-3.5 text-green-400' />
                    Copied!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Right - QR code */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className='flex justify-center sm:justify-end'
          >
            <div className='bg-[#f0f1e1] p-3 md:p-4 rounded-xl shadow-lg border border-white/10'>
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt='QR Code'
                  width={120}
                  height={120}
                  className='w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] md:w-[150px] md:h-[150px]'
                />
              ) : (
                <div className='w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] md:w-[150px] md:h-[150px] bg-gray-200 flex items-center justify-center'>
                  <QrCode className='w-8 h-8 md:w-10 md:h-10 text-gray-400' />
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Middle line */}
        <div className='w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8 md:mb-10'></div>

        {/* Players Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className='w-full flex flex-col items-center mb-10 md:mb-14'
        >
          <h2 className='text-xl md:text-2xl font-semibold text-white mb-6 text-center'>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className='px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-gradient-to-r from-[#0e2838]/50 to-[#183244]/50 border border-white/10 shadow-inner flex items-center justify-center gap-2'
            >
              <motion.span
                key={participants.length}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className='text-[#aef359] font-bold'
              >
                {participants.length}
              </motion.span>
              <span>of 300 players:</span>
            </motion.div>
          </h2>

          {participants.length === 0 ? (
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{
                repeat: Infinity,
                repeatType: 'reverse',
                duration: 2,
              }}
              className='flex justify-center items-center p-6 md:p-8 mt-2 md:mt-4'
            >
              <button
                onClick={() => {}}
                className='flex items-center gap-2 text-white/70 hover:text-white/90 transition-colors duration-300'
              >
                <Users className='w-5 h-5' />
                Join on this device
              </button>
            </motion.div>
          ) : (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 lg:gap-6 justify-items-center max-w-full overflow-y-auto max-h-[300px] md:max-h-[360px] pr-2 pb-2'>
              <AnimatePresence>
                {participants.map((participant, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.1 * Math.min(index, 10),
                      duration: 0.4,
                    }}
                    className='relative'
                  >
                    <motion.div
                      whileHover={{ y: -5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className='relative w-16 sm:w-18 md:w-20 h-20 md:h-24 flex flex-col items-center'
                    >
                      <motion.div
                        className='relative'
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 15,
                          delay: 0.1 * Math.min(index, 10),
                        }}
                      >
                        <div className='absolute inset-0 bg-gradient-to-br from-[#aef359]/30 to-[#e4f88d]/30 rounded-full blur-md -z-10'></div>
                        <Avatar className='h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full border-2 border-white/20 shadow-lg'>
                          <AvatarImage
                            src={participant.guestAvatar}
                            alt={participant.guestName}
                          />
                          <AvatarFallback className='bg-gradient-to-br from-green-500 to-green-700 text-white text-base md:text-lg'>
                            {participant.guestName
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {participant.guestName === hostName && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: 0.2 + 0.1 * Math.min(index, 10),
                              type: 'spring',
                              stiffness: 200,
                            }}
                            className='absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full border-2 border-[#0e1c26] shadow-lg'
                          >
                            <motion.div
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [1, 0.7, 1],
                              }}
                              transition={{
                                repeat: Infinity,
                                duration: 2,
                                ease: 'easeInOut',
                              }}
                              className='w-1.5 h-1.5 md:w-2 md:h-2'
                            />
                          </motion.div>
                        )}
                      </motion.div>
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          delay: 0.3 + 0.1 * Math.min(index, 10),
                          duration: 0.3,
                        }}
                        className='text-xs sm:text-sm text-white/90 mt-2 truncate max-w-full text-center font-medium tracking-tight'
                      >
                        {participant.guestName}
                      </motion.span>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Start Game Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className='w-full px-2 sm:px-6 md:px-10'
        >
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Button
              onClick={handleStartSession}
              disabled={!isConnected || !hasJoined}
              className={`w-full py-5 sm:py-6 md:py-7 text-lg md:text-xl font-bold rounded-full shadow-xl transition-all duration-300 ${
                isConnected && hasJoined
                  ? 'bg-gradient-to-r from-[#c5ee4f] to-[#8fe360] text-[#0f2231] hover:shadow-[#aef359]/20 hover:shadow-2xl'
                  : 'bg-gradient-to-r from-[#c5ee4f]/60 to-[#8fe360]/60 text-[#0f2231]/70'
              }`}
            >
              {!isConnected ? (
                <span className='flex items-center justify-center gap-2'>
                  <Loader2 className='h-5 w-5 animate-spin' />
                  Đang kết nối...
                </span>
              ) : !hasJoined ? (
                'Vui lòng tham gia trước'
              ) : (
                'Start game'
              )}
            </Button>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className='mt-4 sm:mt-6 w-full px-2 sm:px-0'
            >
              <Alert
                variant='destructive'
                className='bg-red-500/20 border border-red-500 text-white text-sm'
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phiên bản */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className='mt-4 sm:mt-6 text-white/40 text-xs'
        >
          PreziQ v1.0
        </motion.div>
      </motion.div>
    </div>
  );
}
