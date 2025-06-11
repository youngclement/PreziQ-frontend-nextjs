'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Loader2,
  Copy,
  QrCode,
  Users,
  Settings,
  LinkIcon,
  EyeOff,
  CheckCircle2,
  Volume2,
  VolumeX,
  Volume1,
  Volume,
} from 'lucide-react';
import { sessionsApi } from '@/api-client';
import { authApi } from '@/api-client/auth-api';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import HostActivities from '../../components/HostActivities';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/language-context';

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
  const { t } = useLanguage();
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
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [willParticipate, setWillParticipate] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [participantAvatar, setParticipantAvatar] = useState(
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'
  );
  const [isChangingAvatar, setIsChangingAvatar] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(70);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const volumeControlTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const volumeControlRef = useRef<HTMLDivElement>(null);
  const [isParticipating, setIsParticipating] = useState(true);
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  //luật
  const [musicBackground, setMusicBackground] = useState<string>('');

  // Lấy thông tin tài khoản người dùng khi component mount
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
        return;
      }

      if (!collectionId) {
        setError('Collection ID is required');
        setIsLoading(false);
        setIsInitializing(false);
        return;
      }

      try {
        hasCreatedSessionRef.current = true; // Đánh dấu là đã gọi API

        const response = await sessionsApi.createSession({
          collectionId: collectionId,
        });

        // Lưu sessionCode và sessionId từ response
        const responseSessionId = response.data.sessionId;
        const responseSessionCode = response.data.sessionCode;
        const responseQrCodeUrl = response.data.joinSessionQrUrl;
        const responseMusicBackground =
          response.data.collection.defaultBackgroundMusic;

        localStorage.setItem('sessionCode', responseSessionCode);
        localStorage.setItem('sessionId', responseSessionId);

        setSessionCode(responseSessionCode);
        setSessionId(responseSessionId);
        setQrCodeUrl(responseQrCodeUrl);
        setMusicBackground(responseMusicBackground || '/sounds/background.mp3');
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

  // Sửa lại useEffect cho WebSocket
  useEffect(() => {
    if (!sessionCode || !sessionId || isInitializing) return;
    if (sessionWsRef.current) return;

    const sessionWs = new SessionWebSocket(sessionCode, sessionId);
    sessionWsRef.current = sessionWs;

    sessionWs.onParticipantsUpdateHandler((updatedParticipants) => {
      // Đảm bảo updatedParticipants luôn là một mảng, ngay cả khi rỗng
      const participantsArray = Array.isArray(updatedParticipants)
        ? updatedParticipants
        : [];

      const participantsData = participantsArray.map((p: any) => ({
        guestName: p.displayName || 'Unknown',
        guestAvatar:
          p.displayAvatar || 'https://api.dicebear.com/9.x/pixel-art/svg',
        userId: p.user?.userId || null,
      }));

      console.log(
        `Đã nhận cập nhật participants: ${participantsData.length} người tham gia`
      );

      // Cập nhật state bất kể mảng rỗng hay không
      setParticipants(participantsData);

      // Kiểm tra xem host đã join chưa nếu chọn tham gia
      if (
        willParticipate &&
        participantsArray.some((p) => p.displayName === participantName)
      ) {
        setHasJoined(true);
      }
    });

    sessionWs.onSessionStartHandler((session) => {
      console.log('Session started:', session);
      setIsSessionStarted(true);
    });

    sessionWs.onConnectionStatusChangeHandler((status) => {
      if (
        status === 'Connected' ||
        status === 'Disconnected' ||
        status === 'Connecting...' ||
        status === 'Failed to connect' ||
        status === 'Connection error'
      ) {
        const isConnectedNow = status === 'Connected';
        setIsConnected(isConnectedNow);
        actualConnectedRef.current = isConnectedNow;
      }
    });

    sessionWs
      .connect()
      .then(() => {
        setIsConnected(true);
        actualConnectedRef.current = true;
      })
      .catch((err) => {
        setError('Failed to connect to session');
      });

    return () => {};
  }, [
    sessionCode,
    sessionId,
    isInitializing,
    participantName,
    willParticipate,
  ]);
  console.log(musicBackground);
  // Xử lý âm thanh nền
  useEffect(() => {
    // Tạo audio element

    if (typeof window !== 'undefined' && !audioRef.current) {
      // const audio = new Audio('/sounds/background.mp3');
      const audio = new Audio(musicBackground);

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

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  useEffect(() => {
    // Xử lý click outside để thu gọn thanh volume
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
        <VolumeX className="w-5 h-5 text-white/70 group-hover:text-white" />
      );
    } else if (volume < 30) {
      return (
        <Volume className="w-5 h-5 text-[#aef359] group-hover:text-[#e4f88d]" />
      );
    } else if (volume < 70) {
      return (
        <Volume1 className="w-5 h-5 text-[#aef359] group-hover:text-[#e4f88d]" />
      );
    } else {
      return (
        <Volume2 className="w-5 h-5 text-[#aef359] group-hover:text-[#e4f88d]" />
      );
    }
  };

  // Sửa lại hàm handleStartSession
  const handleStartSession = async () => {
    if (!sessionWsRef.current) {
      setError('WebSocket not connected');
      return;
    }

    if (!sessionId) {
      setError('Session ID is missing');
      return;
    }

    try {
      setShowRoleDialog(true);
    } catch (error) {
      console.error('Failed to start session:', error);
      setError('Failed to start session. Please try again.');
    }
  };

  const handleRoleConfirm = async () => {
    try {
      setIsJoining(true);

      // Lưu trạng thái lựa chọn của host
      setIsParticipating(willParticipate);

      // Đảm bảo đã cập nhật sessionId trong sessionWs
      if (sessionId && sessionWsRef.current) {
        sessionWsRef.current.updateSessionId(sessionId);

        // Nếu host chọn tham gia, join với tên người dùng đã nhập
        if (willParticipate) {
          if (!participantName) {
            setError('Vui lòng nhập tên của bạn');
            return;
          }
          const userId = userAccount?.userId || null;
          await sessionWsRef.current.joinSession(
            participantName,
            userId,
            participantAvatar
          );
          setHasJoined(true);
        } else {
          // Nếu host không tham gia, vẫn join với tên mặc định là "Host"
          const userId = userAccount?.userId || null;
          const defaultHostName = 'Host';
          // Sử dụng avatar mặc định hoặc tạo một avatar ngẫu nhiên cho Host
          const defaultHostAvatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=host-${Date.now()}`;
          await sessionWsRef.current.joinSession(
            defaultHostName,
            userId,
            defaultHostAvatar
          );
          console.log('Host joined as observer with name:', defaultHostName);
          setHasJoined(true);
        }

        // Bắt đầu phiên sau khi đã join
        await sessionWsRef.current.startSession();
      } else {
        throw new Error('Session ID is not available');
      }

      setShowRoleDialog(false);
    } catch (error) {
      console.error('Failed to start session:', error);
      setError('Failed to start session. Please try again.');
    } finally {
      setIsJoining(false);
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

      sessionWsRef.current.joinSession(hostName, userId);
      setHasJoined(true);
      setError(null);
    } catch (err) {
      setError('Failed to join session');
      console.error('Error joining session:', err);
    }
  };

  const handleSessionEnd = () => {};

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

  const generateAvatar = (name: string) => {
    return `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(
      name
    )}-${Date.now()}`;
  };

  const handleChangeAvatar = () => {
    setIsChangingAvatar(true);
    setParticipantAvatar(generateAvatar(participantName || 'default'));
    setTimeout(() => setIsChangingAvatar(false), 500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a1b25] to-[#0f2231] flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center text-white px-4 sm:px-6 relative"
        >
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-gradient-to-r from-[#aef359]/20 to-[#e4f88d]/20 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div className="relative">
            <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 animate-spin mx-auto mb-4 sm:mb-6 text-[#aef359]" />
          </div>
          <motion.h2
            className="text-xl sm:text-2xl font-bold mb-2 bg-gradient-to-r from-[#aef359] to-[#e4f88d] text-transparent bg-clip-text"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {t('hostSession.settingUpSession')}
          </motion.h2>

          <p className='text-white/70 text-sm sm:text-base'>
            {t('hostSession.preparingWaitingRoom')}

          </p>
        </motion.div>
      </div>
    );
  }

  // Hiển thị giao diện sau khi đã bắt đầu session, sử dụng component HostActivities
  if (isSessionStarted && sessionId && sessionCode && sessionWsRef.current) {
    console.log('Rendering host activities with session ID:', sessionId);
    return (
      <div className="min-h-screen w-full max-w-full overflow-hidden">
        <HostActivities
          sessionId={sessionId}
          sessionCode={sessionCode}
          sessionWs={sessionWsRef.current}
          onSessionEnd={handleSessionEnd}
          onNextActivityLog={(activity) => {
            console.log('[Host Page] Next activity logged:', activity);
            setCurrentActivity(activity);
          }}
          isParticipating={isParticipating}
        />
      </div>
    );
  }

  // Hiển thị giao diện phòng chờ theo mẫu quiz.com
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0a1b25] to-[#0f2231] p-4 sm:p-6 relative overflow-hidden">
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
        className="fixed bottom-4 right-4 z-50"
        onMouseEnter={showVolumeControl}
        onMouseMove={resetHideTimeout}
        ref={volumeControlRef}
      >
        <div className="flex items-center gap-2 relative">
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
                className="mr-2"
              >
                <Slider
                  value={[volume]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="w-24 volume-slider"
                  onPointerDown={handleVolumeDragStart}
                  onPointerUp={handleVolumeDragEnd}
                />
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="text-[10px] text-white/60 mt-1 text-center"
                >
                  {volume}%
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            className="bg-[#0e1c26]/70 backdrop-blur-md p-2 rounded-full border border-white/10 shadow-md flex items-center justify-center group transition-colors hover:bg-[#0e1c26]/90"
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

      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 opacity-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ duration: 1 }}
      >
        {/* Gradient orbs with reduced opacity */}
        <motion.div
          className="absolute top-10 left-10 w-32 h-32 bg-[#aef359] rounded-full filter blur-[80px]"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-10 right-10 w-32 h-32 bg-[#e4f88d] rounded-full filter blur-[80px]"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500 rounded-full filter blur-[120px]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.05, 0.1, 0.05],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </motion.div>

      {/* Background patterns */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Dotted grid */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(174,243,89,0.03)_1px,transparent_1px)] bg-[size:20px_20px]" />

        {/* Hexagon grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-opacity='0.02' fill='%23aef359'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Animated lines */}
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`line-${i}`}
              className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-[#aef359]/5 to-transparent"
              style={{ top: `${33 * (i + 1)}%` }}
              animate={{
                x: ['-100%', '100%'],
              }}
              transition={{
                duration: 15 + i * 5,
                repeat: Infinity,
                ease: 'linear',
                delay: i * 2,
              }}
            />
          ))}
        </div>

        {/* Moving light beam with reduced opacity */}
        <motion.div
          className="absolute top-0 left-0 w-[200vw] h-[200vh] bg-[radial-gradient(circle,rgba(174,243,89,0.03)_0%,transparent_20%)] pointer-events-none"
          animate={{
            x: ['-50%', '0%'],
            y: ['-50%', '0%'],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </div>

      {/* Constellation effect */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute w-1 h-1 bg-[#aef359]/10 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Floating code symbols */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {['{ }', '< >', '//', '[]', '()', '&&', '=>'].map((symbol, i) => (
          <motion.div
            key={`symbol-${i}`}
            className="absolute text-[#aef359]/10 font-mono text-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50],
              opacity: [0.1, 0, 0.1],
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              ease: 'linear',
              delay: Math.random() * 5,
            }}
          >
            {symbol}
          </motion.div>
        ))}
      </div>

      {/* Container chính */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-[90%] max-w-[90%] sm:max-w-xl md:max-w-3xl lg:max-w-4xl bg-[#0e1c26]/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-8 md:p-12 flex flex-col items-center shadow-2xl shadow-black/30 border border-white/5 relative"
      >
        {/* Container glow effect với độ sáng giảm */}
        <motion.div
          className="absolute -inset-px rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#aef359]/10 to-[#e4f88d]/10 z-[-1]"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Container inner shadow */}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl shadow-inner pointer-events-none" />

        {/* Floating particles with reduced opacity */}
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-1 h-1 ${
                i % 3 === 0
                  ? 'bg-[#aef359]/20 w-1.5 h-1.5'
                  : i % 3 === 1
                  ? 'bg-[#e4f88d]/15 w-1 h-1'
                  : 'bg-white/10 w-0.5 h-0.5'
              } rounded-full`}
              initial={{
                x: Math.random() * 100 + '%',
                y: Math.random() * 100 + '%',
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                y: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                scale: [
                  Math.random() * 0.5 + 0.5,
                  Math.random() * 1 + 1,
                  Math.random() * 0.5 + 0.5,
                ],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </motion.div>

        {/* Top Section - Join at, PIN code, QR Code */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10 md:mb-14">
          {/* Left - Join at */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex flex-col items-center sm:items-start"
          >
            <motion.h2
              className="text-white/80 mb-2 text-xl font-medium flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span>{t('hostSession.joinAt')}</span>
              <motion.div
                animate={{
                  y: [0, -2, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                👋
              </motion.div>
            </motion.h2>
            <div className="mb-2 relative">
              <motion.div
                className="absolute -inset-1 bg-gradient-to-r from-[#aef359]/20 to-[#e4f88d]/20 rounded-lg blur"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              <span className='relative text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-300 via-yellow-300 to-green-200 text-transparent bg-clip-text drop-shadow-md'>
                {t('hostSession.websiteUrl')}

              </span>
            </div>
          </motion.div>

          {/* Middle - PIN code */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col items-center col-span-1 md:col-span-1 order-first sm:order-none"
          >
            <motion.h2
              className="text-white/80 mb-2 text-xl font-medium flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <span>{t('hostSession.pinCode')}</span>
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                🔑
              </motion.div>
            </motion.h2>
            <motion.div
              className="relative"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.5,
                duration: 0.4,
                type: 'spring',
                stiffness: 120,
              }}
            >
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-[#aef359]/20 to-[#e4f88d]/20 rounded-2xl blur-lg"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [0.95, 1.05, 0.95],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <AnimatePresence mode="wait">
                {!hidePin ? (
                  <motion.h1
                    key="visible-pin"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative mb-4 pb-4 text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#aef359] to-[#e4f88d] drop-shadow-lg"
                    style={{ letterSpacing: '0.05em' }}
                  >
                    {sessionCode ? formatSessionCode(sessionCode) : 'XXXXXX'}
                  </motion.h1>
                ) : (
                  <motion.h1
                    key="hidden-pin"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="relative mb-4 pb-4 text-4xl sm:text-5xl md:text-6xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#aef359] to-[#e4f88d] drop-shadow-lg"
                    style={{ letterSpacing: '0.05em' }}
                  >
                    XXXXXX
                  </motion.h1>
                )}
              </AnimatePresence>
            </motion.div>
            <div className="flex gap-6 mt-3">
              <motion.button
                onClick={handleCopy}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-white/80 hover:text-white flex items-center gap-1.5 text-sm transition-colors duration-200"
              >

                <LinkIcon className='w-4 h-4' />
                {t('hostSession.copy')}

              </motion.button>
              <motion.button
                onClick={toggleHidePin}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="text-white/80 hover:text-white flex items-center gap-1.5 text-sm transition-colors duration-200"
              >

                <EyeOff className='w-4 h-4' />
                {t('hostSession.hide')}

              </motion.button>
              <AnimatePresence>
                {copySuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="text-white/90 text-sm flex items-center gap-1"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 0.3,
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    </motion.div>
                    {t('hostSession.copied')}
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
            className="flex justify-center sm:justify-end"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="relative"
            >
              <motion.div
                className="absolute -inset-2 bg-gradient-to-r from-[#aef359]/20 to-[#e4f88d]/20 rounded-xl blur"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              <div className="relative bg-[#f0f1e1] p-3 md:p-4 rounded-xl shadow-lg border border-white/10">
                {qrCodeUrl ? (
                  <motion.img
                    src={qrCodeUrl}
                    alt="QR Code"
                    width={120}
                    height={120}
                    className="w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] md:w-[150px] md:h-[150px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  />
                ) : (
                  <div className="w-[110px] h-[110px] sm:w-[130px] sm:h-[130px] md:w-[150px] md:h-[150px] bg-gray-200 flex items-center justify-center">
                    <QrCode className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Middle line with animated gradient */}
        <motion.div
          className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8 md:mb-10 relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#aef359]/30 to-transparent"
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* Players Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full flex flex-col items-center mb-10 md:mb-14"
        >
          <motion.h2
            className="text-xl md:text-2xl font-semibold text-white mb-6 text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <motion.div
              className="px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-gradient-to-r from-[#0e2838]/50 to-[#183244]/50 border border-white/10 shadow-inner flex items-center justify-center gap-2 relative group"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <motion.div className="absolute inset-0 bg-gradient-to-r from-[#aef359]/5 to-[#e4f88d]/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <motion.span
                key={participants.length}
                initial={{ scale: 1.2, rotate: 10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="text-[#aef359] font-bold relative"
              >
                {participants.length}
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 bg-[#aef359] rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [1, 0, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.span>

              <span className='relative'>
                {t('hostSession.playersCountOf300')}
              </span>

            </motion.div>
          </motion.h2>

          {participants.length === 0 ? (
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{
                opacity: [0.6, 1, 0.6],
                y: [0, -5, 0],
              }}
              transition={{
                repeat: Infinity,
                repeatType: 'reverse',
                duration: 2,
              }}
              className="flex justify-center items-center p-6 md:p-8 mt-2 md:mt-4"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 text-white/70 hover:text-white/90 transition-colors duration-300 relative group"
              >

                <motion.div className='absolute -inset-2 bg-gradient-to-r from-[#aef359]/10 to-[#e4f88d]/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                <Users className='w-5 h-5 relative' />
                <span className='relative'>
                  {t('hostSession.joinOnThisDevice')}
                </span>

              </motion.button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 md:gap-4 lg:gap-6 justify-items-center max-w-full overflow-y-auto max-h-[300px] md:max-h-[360px] pr-2 pb-2 w-full">
              <AnimatePresence>
                {participants.map((participant, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: 0.1 * Math.min(index, 10),
                      duration: 0.4,
                      type: 'spring',
                      stiffness: 200,
                    }}
                    className="relative"
                  >
                    <motion.div
                      whileHover={{ y: -5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                      className="relative w-16 sm:w-18 md:w-20 h-20 md:h-24 flex flex-col items-center"
                    >
                      <motion.div
                        className="relative"
                        initial={{ y: -20 }}
                        animate={{ y: 0 }}
                        transition={{
                          type: 'spring',
                          stiffness: 400,
                          damping: 15,
                          delay: 0.1 * Math.min(index, 10),
                        }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-br from-[#aef359]/30 to-[#e4f88d]/30 rounded-full blur-md -z-10"
                          animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: index * 0.2,
                          }}
                        />
                        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full border-2 border-white/20 shadow-lg relative group">
                          <AvatarImage
                            src={participant.guestAvatar}
                            alt={participant.guestName}
                            className="group-hover:scale-110 transition-transform duration-300"
                          />
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-700 text-white text-base md:text-lg">
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
                            className="absolute -bottom-1 -right-1 bg-green-500 p-1 rounded-full border-2 border-[#0e1c26] shadow-lg"
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
                              className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full"
                            />
                          </motion.div>
                        )}
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          delay: 0.3 + 0.1 * Math.min(index, 10),
                          duration: 0.3,
                        }}
                        className="mt-2 text-center"
                      >
                        <motion.span
                          className="text-xs sm:text-sm text-white/90 font-medium tracking-tight block"
                          whileHover={{ scale: 1.05 }}
                        >
                          {participant.guestName}
                        </motion.span>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Phiên bản với animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-4 sm:mt-6 text-white/40 text-xs relative group cursor-pointer"
          whileHover={{ scale: 1.05 }}
        >

          <motion.div className='absolute inset-0 bg-gradient-to-r from-[#aef359]/5 to-[#e4f88d]/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
          <span className='relative'>{t('hostSession.preziqVersion')}</span>

          <motion.div
            className="absolute -top-1 -right-1 w-1 h-1 bg-[#aef359] rounded-full"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [1, 0, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        {/* Nút Start Session */}
        {isConnected && !isSessionStarted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="w-full flex justify-center"
          >
            <Button
              className="bg-gradient-to-r from-[#aef359] to-[#e4f88d] hover:from-[#9ee348] hover:to-[#d3e87c] text-slate-900 font-semibold text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3"
              onClick={handleStartSession}
              disabled={isJoining}
            >
              {isJoining ? (
                <>

                  <Loader2 className='w-5 h-5 animate-spin' />
                  <span>{t('hostSession.starting')}</span>
                </>
              ) : (
                <>
                  <Settings className='w-5 h-5' />
                  <span>{t('hostSession.startSession')}</span>

                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Dialog chọn vai trò */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>

          <DialogContent className='sm:max-w-[425px] bg-gradient-to-b from-[#0a1b25] to-[#0f2231] text-white border border-white/10'>
            <DialogHeader className='space-y-4'>
              <DialogTitle className='text-2xl font-bold text-center bg-gradient-to-r from-[#aef359] to-[#e4f88d] text-transparent bg-clip-text'>
                {t('hostSession.setupRole')}
              </DialogTitle>
              <DialogDescription className='text-center text-white/70'>
                {t('hostSession.chooseParticipationMethod')}
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-6 py-6'>
              <div className='flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10'>
                <div className='flex items-center space-x-3'>
                  <Settings className='w-5 h-5 text-[#aef359]' />
                  <Label htmlFor='participate-mode' className='font-medium'>
                    {t('hostSession.participateInAnswers')}

                  </Label>
                </div>
                <Switch
                  id="participate-mode"
                  checked={willParticipate}
                  onCheckedChange={setWillParticipate}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#aef359] data-[state=checked]:to-[#e4f88d] data-[state=unchecked]:bg-white/10"
                />
              </div>

              <AnimatePresence>
                {willParticipate && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="relative group cursor-pointer"
                        onClick={handleChangeAvatar}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-[#aef359]/30 to-[#e4f88d]/30 rounded-full blur-xl -z-10"></div>
                        <Avatar className="w-24 h-24 border-2 border-white/20 shadow-xl transition-transform duration-300 group-hover:scale-105">
                          <AvatarImage
                            src={participantAvatar}
                            className={isChangingAvatar ? 'animate-pulse' : ''}
                          />
                          <AvatarFallback className="bg-white/5">
                            {participantName
                              ? participantName.substring(0, 2).toUpperCase()
                              : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-white/90 text-sm font-medium"
                          >
                            {t('hostSession.changeAvatar')}
                          </motion.div>
                        </div>
                      </motion.div>

                      <div className="w-full space-y-2">
                        <Label
                          htmlFor="participant-name"
                          className="text-sm text-white/70"
                        >
                          {t('hostSession.yourName')}
                        </Label>
                        <Input
                          id="participant-name"
                          value={participantName}
                          onChange={(e) => setParticipantName(e.target.value)}

                          placeholder={t('hostSession.enterYourName')}
                          className='bg-white/5 border-white/10 focus:border-[#aef359]/50 focus:ring-[#aef359]/20 placeholder:text-white/30'

                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={() => setShowRoleDialog(false)}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
              >
                {t('hostSession.cancel')}
              </Button>
              <Button
                onClick={handleRoleConfirm}

                disabled={!participantName.trim() || isJoining}
                className='bg-gradient-to-r from-[#aef359] to-[#e4f88d] text-black font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isJoining ? (
                  <>
                    <Loader2 className='w-4 h-4 animate-spin mr-2' />
                    {t('hostSession.processing')}

                  </>
                ) : (
                  t('hostSession.confirm')
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-4 sm:mt-6 w-full px-2 sm:px-0"
            >
              <Alert
                variant="destructive"
                className="bg-red-500/20 border border-red-500 text-white text-sm"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
