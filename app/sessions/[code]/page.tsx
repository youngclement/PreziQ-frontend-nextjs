'use client';

import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import {
  Loader2,
  Users,
  RefreshCw,
  ArrowRight,
  UserPlus,
  Check,
  Clock,
  Volume2,
  VolumeX,
  Volume1,
  Volume,
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
import Loading from '@/components/common/loading';
import { useLanguage } from '@/contexts/language-context';

interface UserAccount {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

const SessionJoinPage = () => {
  const { t } = useLanguage();
  const params = useParams();
  const sessionCode = params.code as string;
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(
    t('session.connecting')
  );
  const [hasJoined, setHasJoined] = useState(false);
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [userAccount, setUserAccount] = useState<UserAccount | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(false);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [myScore, setMyScore] = useState(0);
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(30);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeControlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const volumeControlRef = useRef<HTMLDivElement>(null);

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

        setUserAccount({
          userId: userData.userId,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
        });
      } catch (err) {
        console.error('Không thể lấy thông tin tài khoản:', err);
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
        sessionWsRef.current.disconnect();
        sessionWsRef.current = null;
      }
    };
  }, []);

  // Khởi tạo kết nối WebSocket khi trang được tải
  useEffect(() => {
    if (!sessionCode) {
      console.error('Không có mã phiên!');
      setError(t('session.noSessionCode'));
      setIsConnecting(false);
      return;
    }

    // Tạo đối tượng WebSocket mới
    const sessionWs = new SessionWebSocket(sessionCode);
    sessionWsRef.current = sessionWs;

    // Thiết lập các handlers
    sessionWs.onConnectionStatusChangeHandler((status) => {
      if (!isMounted.current) return;

      let translatedStatus = status;
      if (status === 'Connected') translatedStatus = t('session.connected');
      else if (status === 'Connecting...')
        translatedStatus = t('session.connecting');
      else if (status === 'Disconnected')
        translatedStatus = t('session.disconnected');

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

      console.log('Cập nhật participants từ server:', {
        updatedParticipants,
        currentDisplayName: displayName,
      });

      // Đảm bảo dữ liệu participants hợp lệ
      if (Array.isArray(updatedParticipants)) {
        setParticipants(updatedParticipants);
      } else {
        console.warn('Dữ liệu participants không hợp lệ:', updatedParticipants);
      }
    });

    // Theo dõi khi session bắt đầu
    sessionWs.onSessionStartHandler((session: SessionSummary) => {
      if (!isMounted.current) return;
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
        if (isMounted.current) {
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted.current) {
          setError(t('session.connectionError'));
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
  }, [sessionCode, t]);

  // Theo dõi và cập nhật điểm số của người tham gia
  useEffect(() => {
    if (!displayName || !participants.length) return;

    // Tìm và cập nhật điểm của người dùng hiện tại
    const currentUser = participants.find((p) => p.displayName === displayName);

    if (currentUser) {
      console.log('Cập nhật thông tin điểm số:', {
        displayName,
        oldScore: myScore,
        newScore: currentUser.realtimeScore,
        allParticipants: participants,
      });
      setMyScore(currentUser.realtimeScore);
    } else {
      console.warn('Không tìm thấy người dùng trong danh sách:', {
        displayName,
        participants,
      });
    }

    // Kiểm tra trạng thái tham gia
    const hasUserJoined = participants.some(
      (p) => p.displayName === displayName
    );
    if (hasUserJoined) {
      setHasJoined(true);
    }
  }, [participants, displayName, myScore]);

  // Kiểm tra khi tên hiển thị thay đổi
  useEffect(() => {
    setIsFormValid(displayName.trim().length > 0);
  }, [displayName]);

  // Xử lý âm thanh nền
  useEffect(() => {
    // Tạo audio element
    if (typeof window !== 'undefined' && !audioRef.current) {
      const audio = new Audio('/sounds/background.mp3');
      audio.loop = true;
      audio.volume = volume / 100; // Âm lượng từ 0-100 chuyển sang 0-1
      audioRef.current = audio;

      // Tự động phát nhạc khi trang được mount
      const playPromise = audio.play();

      // Xử lý lỗi nếu trình duyệt cần sự tương tác của người dùng trước khi phát
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log('Autoplay was prevented, waiting for user interaction');
          // Không cần báo lỗi vì nhiều trình duyệt yêu cầu user interaction trước khi phát
        });
      }
    }

    // Cleanup khi unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (volumeControlTimeoutRef.current) {
        clearTimeout(volumeControlTimeoutRef.current);
      }
    };
  }, [volume]);

  // Xử lý khi trạng thái tắt/mở âm thanh thay đổi
  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = 0;
      } else {
        audioRef.current.volume = volume / 100;
        // Thử phát lại nếu đã bị pause trước đó
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Ignore errors here
          });
        }
      }
    }
  }, [isMuted, volume]);

  // Xử lý click outside để thu gọn thanh volume
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        volumeControlRef.current &&
        !volumeControlRef.current.contains(event.target as Node) &&
        !isDraggingVolume
      ) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDraggingVolume]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    setIsMuted(newVolume === 0);

    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const showVolumeControl = () => {
    setShowVolumeSlider(true);

    // Nếu không đang kéo thanh trượt, thiết lập timeout để ẩn
    if (!isDraggingVolume) {
      resetHideTimeout();
    }
  };

  const resetHideTimeout = () => {
    if (volumeControlTimeoutRef.current) {
      clearTimeout(volumeControlTimeoutRef.current);
    }

    // Chỉ đặt timeout khi không đang kéo thanh trượt
    if (!isDraggingVolume) {
      volumeControlTimeoutRef.current = setTimeout(() => {
        setShowVolumeSlider(false);
      }, 3000);
    }
  };

  const cancelHideTimeout = () => {
    if (volumeControlTimeoutRef.current) {
      clearTimeout(volumeControlTimeoutRef.current);
    }
  };

  const handleVolumeDragStart = () => {
    setIsDraggingVolume(true);
    cancelHideTimeout();
  };

  const handleVolumeDragEnd = () => {
    setIsDraggingVolume(false);
    resetHideTimeout();
  };

  // Hàm chọn icon âm lượng phù hợp
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return (
        <VolumeX className='w-5 h-5 text-white/70 group-hover:text-white' />
      );
    } else if (volume < 30) {
      return (
        <Volume className='w-5 h-5 text-[#aef359] group-hover:text-[#e4f88d]' />
      );
    } else if (volume < 70) {
      return (
        <Volume1 className='w-5 h-5 text-[#aef359] group-hover:text-[#e4f88d]' />
      );
    } else {
      return (
        <Volume2 className='w-5 h-5 text-[#aef359] group-hover:text-[#e4f88d]' />
      );
    }
  };

  // Tham gia phiên
  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setError(t('session.enterName'));
      return;
    }

    if (!sessionWsRef.current) {
      setError(t('session.noConnection'));
      return;
    }

    if (!isConnected) {
      setError(t('session.waitingConnection'));
      return;
    }

    try {
      const userId = userAccount?.userId || null;

      // Truyền đủ 3 tham số: displayName, userId, và avatar
      await sessionWsRef.current.joinSession(displayName, userId, avatar);
      setHasJoined(true);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tham gia phiên:', err);
      setError(t('session.joinError'));
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

  // Hiển thị loading nếu đang tải dữ liệu tài khoản
  if (isLoadingAccount) {
    return <Loading />;
  }

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
      {/* CSS cho volume slider */}
      <style jsx global>{`
        .volume-slider .slider-thumb {
          background: #aef359 !important;
          height: 12px !important;
          width: 12px !important;
          transition: transform 0.2s !important;
        }

        .volume-slider .slider-thumb:hover {
          transform: scale(1.2) !important;
        }

        .volume-slider .slider-track {
          background: rgba(174, 243, 89, 0.2) !important;
          height: 3px !important;
          transition: all 0.2s !important;
        }

        .volume-slider .slider-range {
          background: rgba(174, 243, 89, 0.6) !important;
          transition: all 0.2s !important;
        }

        .volume-slider:hover .slider-range {
          background: rgba(174, 243, 89, 0.8) !important;
        }
      `}</style>

      {/* Audio controls - nhỏ, đặt góc dưới bên phải */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className='fixed bottom-4 right-4 z-50'
        onMouseEnter={showVolumeControl}
        onMouseMove={resetHideTimeout}
        ref={volumeControlRef}
      >
        <div className='flex items-center gap-2 relative'>
          <AnimatePresence>
            {showVolumeSlider && (
              <motion.div
                initial={{ opacity: 0, width: 0, x: 20 }}
                animate={{ opacity: 1, width: 100, x: 0 }}
                exit={{ opacity: 0, width: 0, x: 20 }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 20,
                  mass: 0.8,
                }}
                className='mr-2'
              >
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className='w-24 volume-slider'
                  onPointerDown={handleVolumeDragStart}
                  onPointerUp={handleVolumeDragEnd}
                />
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className='text-[10px] text-white/60 mt-1 text-center'
                >
                  {volume}%
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            className='bg-[#0e1c26]/70 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-md flex items-center justify-center group transition-colors hover:bg-[#0e1c26]/90'
            onClick={toggleMute}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={
                !isMuted
                  ? {
                      scale: [1, 1.2, 1],
                    }
                  : {}
              }
              transition={{
                repeat: Infinity,
                duration: 2,
                repeatDelay: 1,
              }}
            >
              {getVolumeIcon()}
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

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
              <h2 className='text-2xl font-semibold mb-2'>
                {t('session.joinSession')}
              </h2>
              <p className='text-white/70'>{t('session.enterNameToStart')}</p>
            </div>

            {isConnecting ? (
              <Loading />
            ) : (
              <form onSubmit={handleJoinSession} className='space-y-6'>
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-white/80'>
                    {t('session.displayName')}
                  </label>
                  <Input
                    type='text'
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={t('session.enterYourName')}
                    className='h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl focus:border-[#aef359] focus:ring-[#aef359]/20'
                  />
                </div>

                <div className='space-y-2'>
                  <label className='text-sm font-medium text-white/80'>
                    {t('session.avatar')}
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
                      className='text-white bg-[#0E1C26] border-white/30 hover:bg-white/10 rounded-xl'
                    >
                      <RefreshCw className='h-4 w-4 mr-2' />
                      {t('session.changeAvatar')}
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
                        {t('session.connecting')}
                      </span>
                    ) : (
                      <span className='flex items-center justify-center gap-2'>
                        <UserPlus className='h-5 w-5' />
                        {t('session.joinNow')}
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
              <h2 className='text-2xl font-semibold mb-2'>
                {t('session.waitingRoom')}
              </h2>
              <p className='text-white/70'>{t('session.waitingForHost')}</p>

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
                <span>{t('session.sessionStartingSoon')}</span>
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
                  <span>
                    {t('session.participants')} ({participants.length})
                  </span>
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
                  <p>{t('session.noOtherParticipants')}</p>
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
                  className='text-white bg-[#0E1C26] border-white/30 hover:bg-white/10 px-6 py-5 rounded-xl'
                >
                  {t('session.leaveSession')}
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
