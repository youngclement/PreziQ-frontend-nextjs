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
  const [showSettings, setShowSettings] = useState(false);


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


    return () => { };
  }, [
    sessionCode,
    sessionId,
    isInitializing,
    participantName,
    willParticipate,
  ]);


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
        <VolumeX className='w-5 h-5 text-gray-400 group-hover:text-gray-600' />
      );
    } else if (volume < 30) {
      return (
        <Volume className='w-5 h-5 text-[#c6ea84] group-hover:text-[#d7f595]' />
      );
    } else if (volume < 70) {
      return (
        <Volume1 className='w-5 h-5 text-[#c6ea84] group-hover:text-[#d7f595]' />
      );
    } else {
      return (
        <Volume2 className='w-5 h-5 text-[#c6ea84] group-hover:text-[#d7f595]' />
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


  const handleSessionEnd = () => { };


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
    return code; // Return the code as is without adding space
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
      <div className='min-h-screen bg-[#133338] flex flex-col items-center justify-center p-4'>
        <div className='text-center text-white px-4 sm:px-6 relative'>
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/10 rounded-full' />
          <div className='relative'>
            <Loader2 className='h-12 w-12 sm:h-16 sm:w-16 animate-spin mx-auto mb-4 sm:mb-6 text-white' />
          </div>
          <h2 className='text-xl sm:text-2xl font-bold mb-2 text-white'>
            Đang thiết lập phiên
          </h2>
          <p className='text-white/70 text-sm sm:text-base'>
            PreziQ đang chuẩn bị phòng chờ của bạn...
          </p>
        </div>
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
    <div className='min-h-screen bg-[#133338] p-4 md:p-6 overflow-hidden'>
      {/* CSS cho volume slider */}
      <style jsx global>{`
        .volume-slider .slider-thumb {
          background: rgba(198, 234, 132, 0.9) !important;
          height: 12px !important;
          width: 12px !important;
          transition: transform 0.2s !important;
        }


        .volume-slider .slider-thumb:hover {
          transform: scale(1.2) !important;
        }


        .volume-slider .slider-track {
          background: rgba(198, 234, 132, 0.15) !important;
          height: 3px !important;
          transition: all 0.2s !important;
        }


        .volume-slider .slider-range {
          background: rgba(198, 234, 132, 0.6) !important;
          transition: all 0.2s !important;
        }


        .volume-slider:hover .slider-range {
          background: rgba(198, 234, 132, 0.8) !important;
        }
       
        .input-range {
          -webkit-appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: rgba(198, 234, 132, 0.2);
          outline: none;
        }
       
        .input-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #c6ea84;
          cursor: pointer;
        }
       
        .input-range::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #c6ea84;
          cursor: pointer;
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
                  className='text-[10px] text-gray-500 mt-1 text-center'
                >
                  {volume}%
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>


          <motion.button
            className='bg-white shadow-md p-2 rounded-full border border-gray-100 flex items-center justify-center group transition-colors hover:bg-gray-50'
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


      <div className='md:container flex flex-col lg:flex-row w-full h-full gap-6 lg:gap-8 pt-10 md:pt-16 mb:pb-8 pb-4 lg:px-8 px-4 lg:mx-auto lg:max-h-[60rem]'>
        {/* Animated background elements */}
        <motion.div
          className='absolute inset-0 opacity-20'
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.2 }}
          transition={{ duration: 1 }}
        >
          {/* Gradient orbs with reduced opacity */}
          <motion.div
            className='absolute top-10 left-10 w-32 h-32 bg-[#d5456c] rounded-full filter blur-[80px]'
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
            className='absolute bottom-10 right-10 w-32 h-32 bg-[#9d366d] rounded-full filter blur-[80px]'
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
            className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#7a8deb] rounded-full filter blur-[120px]'
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
        <div className='absolute inset-0 overflow-hidden'>
          {/* Dotted grid */}
          <div className='absolute inset-0 bg-[radial-gradient(rgba(90,116,193,0.03)_1px,transparent_1px)] bg-[size:20px_20px]' />


          {/* Hexagon grid */}
          <div
            className='absolute inset-0'
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-opacity='0.02' fill='%23d5456c'/%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px',
            }}
          />


          {/* Animated lines */}
          <div className='absolute inset-0'>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`line-${i}`}
                className='absolute h-[1px] w-full bg-gradient-to-r from-transparent via-[#d5456c]/5 to-transparent'
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
        </div>


        {/* Container chính */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='w-full max-w-[100%] sm:max-w-xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl bg-black bg-opacity-25 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10 flex flex-col items-center shadow-xl border border-[#1e4b51] relative mx-auto'
        >
          {/* Container glow effect với độ sáng giảm */}
          <motion.div
            className='absolute -inset-px rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#d5456c]/20 to-[#9d366d]/20 z-[-1]'
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
          <div className='absolute inset-0 rounded-2xl sm:rounded-3xl shadow-inner pointer-events-none' />


          {/* Floating particles with reduced opacity */}
          <motion.div
            className='absolute inset-0 overflow-hidden pointer-events-none'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-1 h-1 ${i % 3 === 0
                  ? 'bg-[#d5456c]/20 w-1.5 h-1.5'
                  : i % 3 === 1
                    ? 'bg-[#9d366d]/15 w-1 h-1'
                    : 'bg-[#7a8deb]/10 w-0.5 h-0.5'
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


          {/* Left Panel */}
          <div className='bg-[#133338] rounded-2xl flex flex-col justify-center w-full overflow-hidden shadow-lg border border-[#1e4b51]'>
            <div className='flex flex-col items-center w-full h-full'>
              <div className='flex flex-col items-center w-full h-full'>
                <div className='w-full px-4 sm:px-6 md:px-8 lg:px-10 py-8 bg-black bg-opacity-25 rounded-xl mb-6'>                    <div className='lg:flex-row lg:gap-6 xl:gap-8 lg:items-stretch flex flex-col items-center w-full gap-6'>



                  {/* PIN code section */}
                  <div className='flex flex-col items-center justify-center flex-1 gap-4 bg-black bg-opacity-25 p-5 rounded-xl backdrop-blur-sm shadow-sm border border-[#1e4b51] min-h-[200px]'>
                    <div className='text-lg font-bold text-center text-white'>PIN code:</div>
                    <div className='flex flex-row items-center justify-center flex-1 w-full'>
                      <h1 className='xl:text-6xl lg:text-5xl text-gray-800 text-6xl font-black leading-none text-center'>
                        <div className='relative inline-block'>
                          <div className='relative'>
                            <div className='flex flex-row items-center justify-center flex-1'>
                              {!hidePin ? (
                                sessionCode ? (
                                  <div className="min-w-[12rem] text-center text-[#c6ea84]">{sessionCode}</div>
                                ) : (
                                  <div className="min-w-[12rem] text-center bg-gradient-to-r from-[#ffd1dc] to-[#c8fff0] bg-clip-text text-transparent">XXXXXX</div>
                                )
                              ) : (
                                <div className="min-w-[12rem] text-center text-gray-300">XXXXXX</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </h1>
                    </div>


                    <div className='flex flex-row items-center gap-4 mt-2'>
                      <button className='group flex flex-row items-center hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200' onClick={handleCopy}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className='w-6 h-6 text-gray-500 mr-2 group-hover:text-[#d5456c]'>
                          <path fill="currentColor" d="M22.41 16.34c.297.168.541.344.724.527.786.785 1.312 1.655 1.579 2.608a5.207 5.207 0 0 1 0 2.86c-.267.953-.786 1.83-1.571 2.615l-3.272 3.248c-.777.786-1.647 1.304-2.6 1.571a5.206 5.206 0 0 1-2.86 0c-.953-.267-1.822-.793-2.623-1.586-.785-.785-1.319-1.662-1.586-2.615a5.307 5.307 0 0 1-.007-2.868c.259-.953.785-1.822 1.586-2.608l2.287-2.264a4.016 4.016 0 0 0-.175 1.738 5.57 5.57 0 0 0 .427 1.632l-.64.64c-.443.435-.733.916-.878 1.442a2.94 2.94 0 0 0 0 1.563c.145.519.443 1 .893 1.441.434.443.915.732 1.433.877a2.838 2.838 0 0 0 1.556 0c.518-.145.999-.434 1.441-.869l3.119-3.111c.435-.435.724-.915.87-1.441a2.893 2.893 0 0 0 0-1.571c-.146-.526-.443-1-.885-1.434a2.611 2.611 0 0 0-.778-.518 4.316 4.316 0 0 0-.953-.305l2.013-1.983c.297.084.595.206.9.374zm-4.812 7.329c-.297-.168-.541-.343-.71-.526-.792-.786-1.326-1.647-1.585-2.608a5.307 5.307 0 0 1 0-2.867c.259-.954.785-1.823 1.57-2.608l3.264-3.249c.786-.793 1.647-1.32 2.6-1.586a5.353 5.353 0 0 1 2.86 0c.953.267 1.83.793 2.616 1.586.793.786 1.319 1.655 1.586 2.608.267.96.267 1.914.007 2.867-.259.953-.785 1.823-1.578 2.6L25.94 22.16c.19-.557.252-1.144.176-1.746a6.089 6.089 0 0 0-.427-1.632l.655-.64c.435-.435.725-.916.87-1.434a2.893 2.893 0 0 0 0-1.571 3.285 3.285 0 0 0-.885-1.441c-.442-.443-.922-.732-1.441-.877a2.838 2.838 0 0 0-1.556 0c-.518.145-.991.434-1.433.869l-3.127 3.119c-.434.435-.724.915-.87 1.433a2.795 2.795 0 0 0 .009 1.564c.152.518.442.999.876 1.44a2.9 2.9 0 0 0 .778.512c.32.145.64.244.953.29l-2.013 1.99a4.255 4.255 0 0 1-.9-.374z"></path>
                        </svg>
                        <div className='group-hover:underline text-base font-medium text-gray-600 group-hover:text-gray-800'>Copy</div>
                      </button>
                      <button className='group flex flex-row items-center hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200' onClick={toggleHidePin}>
                        <svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className='w-6 h-6 text-gray-500 mr-2 group-hover:text-[#d5456c]'>
                          <g fill="currentColor">
                            <path d="m11.497 10.326-1.171 1.171L28.49 29.661l1.171-1.171z"></path>
                            <path d="M20.026 12.8c-.343 0-.714.026-1.042.064l.196 1.628c.264-.03.569 0 .846 0 4.937 0 7.667 5.17 7.943 5.664-.2.35-.426.883-1.302 1.888l1.237 1.107c1.254-1.44 1.953-2.734 1.953-2.734l.195-.391-.195-.39s-3.435-6.837-9.831-6.837zm-5.273 1.692c-2.985 2.03-4.558 5.143-4.558 5.143l-.195.391.195.39s3.435 6.771 9.831 6.771c2.06 0 3.785-.728 5.208-1.692l-.911-1.367c-1.22.826-2.63 1.432-4.297 1.432-4.892 0-7.619-5.023-7.943-5.6.272-.482 1.294-2.545 3.581-4.1z"></path>
                            <path d="M17.487 17.487a3.646 3.646 0 0 0-1.042 2.539c0 1.957 1.624 3.516 3.581 3.516.907 0 1.715-.349 2.344-.912l-1.107-1.237c-.336.3-.747.521-1.237.521a1.871 1.871 0 0 1-1.888-1.888c0-.525.18-1.024.52-1.367z"></path>
                          </g>
                        </svg>
                        <div className='group-hover:underline text-base font-medium text-gray-600 group-hover:text-gray-800'>Hide</div>
                      </button>
                      {copySuccess && (
                        <div className='text-gray-700 text-base flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200'>
                          <CheckCircle2 className='w-5 h-5 text-[#d5456c]' />
                          Copied!
                        </div>
                      )}
                    </div>
                  </div>


                  {/* QR Code section */}
                  <div className='flex-col items-center justify-center lg:block flex w-full lg:w-64 bg-black bg-opacity-25 p-5 rounded-xl backdrop-blur-sm shadow-sm border border-[#1e4b51]'>
                    <div className='text-lg font-bold text-center text-white mb-3'>QR Code:</div>
                    <div className='flex justify-center'>
                      <div className='p-3 bg-white rounded-xl shadow-md border border-gray-200'>
                        {qrCodeUrl ? (
                          <img
                            src={qrCodeUrl}
                            alt='QR Code'
                            className='w-[160px] h-[160px] md:w-[180px] md:h-[180px] lg:w-[160px] lg:h-[160px] xl:w-[180px] xl:h-[180px]'
                          />
                        ) : (
                          <div className='w-[160px] h-[160px] md:w-[180px] md:h-[180px] lg:w-[160px] lg:h-[160px] xl:w-[180px] xl:h-[180px] bg-gray-100 flex items-center justify-center'>
                            <QrCode className='w-14 h-14 text-gray-400' />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>


          {/* Middle line divider - simple version without gradient */}
          <motion.div
            className='w-full h-px bg-white bg-opacity-20 mb-6 md:mb-8 relative overflow-hidden'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
          </motion.div>


          {/* Players Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className='w-full flex flex-col items-center mb-8 md:mb-10'
          >
            <motion.h2
              className='text-xl md:text-2xl font-semibold text-white mb-5 text-center'
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <motion.div
                className='px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center gap-2 relative group'
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <motion.span
                  key={participants.length}
                  initial={{ scale: 1.2, rotate: 10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className='text-[rgb(255,182,193)] font-bold relative'
                >
                  {participants.length}
                  <motion.div
                    className='absolute -top-1 -right-1 w-2 h-2 bg-[rgb(255,182,193)] rounded-full'
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
                <span className='relative text-gray-600'>of 300 players:</span>
              </motion.div>
            </motion.h2>


            <div className='flex flex-col w-full'>
              {/* Middle section - Waiting for players - FIXED to use vertical scrolling instead of horizontal */}
              <div className='relative w-full'>
                {/* Removed the problematic hidden div with fixed width that was causing horizontal scroll */}
                <div className='flex flex-col items-center justify-center w-full py-8'>
                  <h1 className='font-bold text-white md:text-2xl text-xl'>
                    <div className='relative inline-block'>
                      <div className='relative top-0 left-0'>
                        Waiting for players
                        <span>
                          <span style={{ opacity: 1 }}>.</span>
                          <span style={{ opacity: 0 }}>.</span>
                          <span style={{ opacity: 0 }}>.</span>
                        </span>
                      </div>
                    </div>
                  </h1>
                  {participants.length === 0 && (
                    <button className='group flex flex-row items-center mt-4 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200'>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className='group-hover:opacity-100 w-6 h-6 text-gray-400 opacity-50 mr-2 group-hover:text-[#d5456c]'>
                        <path fill="currentColor" d="M20 10a5.412 5.412 0 0 0 0 10.824A5.412 5.412 0 0 0 20 10zm0 12.706c-3.53 0-6.848 1.74-8.825 4.635a3.482 3.482 0 0 0-.587 1.976c0 .377.329.683.705.683h17.412c.376 0 .706-.306.706-.683a3.26 3.26 0 0 0-.589-1.976c-1.976-2.894-5.293-4.635-8.823-4.635zm-5.273 1.692c-2.985 2.03-4.558 5.143-4.558 5.143l-.195.391.195.39s3.435 6.771 9.831 6.771c2.06 0 3.785-.728 5.208-1.692l-.911-1.367c-1.22.826-2.63 1.432-4.297 1.432-4.892 0-7.619-5.023-7.943-5.6.272-.482 1.294-2.545 3.581-4.1z"></path>
                      </svg>

                    </button>
                  )}
                </div>
              </div>


              {/* Participants Grid - Updated to scroll vertically with max height */}
              {participants.length > 0 && (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-5 justify-items-center w-full mt-6 overflow-y-auto max-h-[300px] md:max-h-[360px] pr-2 pb-2 bg-black bg-opacity-25 rounded-xl p-4 backdrop-blur-sm border border-[#1e4b51] shadow-sm'>
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
                            <Avatar className='h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-full border-2 border-gray-200 shadow-md relative group'>
                              <AvatarImage
                                src={participant.guestAvatar}
                                alt={participant.guestName}
                                className='group-hover:scale-110 transition-transform duration-300'
                              />
                              <AvatarFallback className='bg-gradient-to-br from-[#d5456c]/80 to-[#9d366d]/80 text-white text-base md:text-lg'>
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
                                className='absolute -bottom-1 -right-1 bg-white p-1 rounded-full border-2 border-[#d5456c] shadow-lg'
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
                                  className='w-1.5 h-1.5 md:w-2 md:h-2 bg-[#d5456c] rounded-full'
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
                            className='mt-2 text-center'
                          >                          <motion.span
                            className='text-xs sm:text-sm text-white font-medium tracking-tight block'
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


              {/* Start Button */}
              <div className='flex flex-col items-center justify-center mb-6 mt-8'>
                <button
                  onClick={handleStartSession}
                  disabled={isJoining}
                  className='bg-[#c6ea84] hover:bg-[#d7f595] text-black py-3 px-8 rounded-full w-full md:w-72 lg:w-80 text-base font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 backdrop-blur-sm'
                >
                  {isJoining ? (
                    <>
                      <Loader2 className='h-5 w-5 animate-spin' />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>Start game</span>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6.75 9.25a.75.75 0 000 1.5h4.59l-2.1 1.95a.75.75 0 001.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 10-1.02 1.1l2.1 1.95H6.75z" clipRule="evenodd" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>


          {/* Phiên bản với animation */}
          {/* <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className='mt-2 sm:mt-3 text-gray-400 text-xs relative group cursor-pointer'
            whileHover={{ scale: 1.05 }}
          >
            <motion.div className='absolute inset-0 bg-gradient-to-r from-[#ffd6e0]/5 to-[#c8eaff]/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
            <span className='relative'>PreziQ v1.0</span>
            <motion.div
              className='absolute -top-1 -right-1 w-1 h-1 bg-[#d5456c] rounded-full'
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
          </motion.div> */}


          {/* Nút Start Session */}
          {/* {isConnected && !isSessionStarted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className='w-full flex justify-center'
            >
              <Button
                className='bg-[rgb(198,234,132)] hover:bg-[rgb(198,234,132)]/90 text-black text-lg px-8 py-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3 font-medium'
                onClick={handleStartSession}
                disabled={isJoining}
              >
                {isJoining ? (
                  <>
                    <Loader2 className='w-5 h-5 animate-spin' />
                    <span>Đang khởi động...</span>
                  </>
                ) : (
                  <>
                    <Settings className='w-5 h-5' />
                    <span>Bắt đầu phiên</span>
                  </>
                )}
              </Button>
            </motion.div>
          )} */}
        </motion.div>


        {/* Right Settings Panel */}
        <div className='xl:w-1/4 lg:w-1/3 flex flex-col w-full max-w-md mx-auto lg:mx-0'>
          {/* Collection Info */}
          <div className='bg-black bg-opacity-30 rounded-2xl overflow-hidden rounded-t-2xl rounded-b-none shadow-md border border-white/10'>
            <div className='flex flex-col items-start justify-start flex-1 h-full gap-4 px-6 py-6 bg-black bg-opacity-20'>
              <div className='w-28 aspect-[4/3] bg-opacity-30 rounded-lg flex justify-center items-center border border-gray-200 shadow-sm bg-white'>
                <div className='pb-4/3 relative overflow-hidden rounded-lg z-1 w-full h-full'>
                  <div className='absolute inset-0 p-0'>
                    <div className='flex items-center justify-center w-full h-full overflow-hidden'>
                      <div className='w-full h-full'>
                        <div className='relative top-0 left-0 flex items-center justify-center w-full h-full'>
                          <div className='relative w-full h-full bg-black bg-opacity-5 flex items-center justify-center'>
                            <Settings className='text-gray-600 w-10 h-10' />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='flex flex-col items-start justify-center w-full'>
                <h3 className='pb-2 font-sans text-xl font-bold leading-none text-white'>PreziQ Collection</h3>
                <div className='flex flex-row items-center justify-start w-full gap-4'>
                  <p className='font-sans text-sm leading-tight text-white'>6 activities</p>
                  <button className='group flex flex-row items-center hover:bg-gray-200 p-1.5 rounded-lg transition-colors duration-200'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className='group-hover:opacity-100 w-5 h-5 text-white opacity-50 group-hover:text-[rgb(255,182,193)]'>
                      <path fill="none" d="M0 0h40v40H0z"></path>
                      <path fill="currentColor" d="M18.18 27.82a8.55 8.55 0 0 1-3.41-.68A8.86 8.86 0 0 1 12 25.23a9 9 0 0 1-1.9-2.81 8.89 8.89 0 0 1 0-6.82 8.86 8.86 0 0 1 1.9-2.81 9.17 9.17 0 0 1 2.81-1.9 8.75 8.75 0 0 1 6.81 0 9.1 9.1 0 0 1 2.82 1.9 8.9 8.9 0 0 1 1.89 2.82 8.75 8.75 0 0 1 0 6.81 9 9 0 0 1-1.89 2.81 8.79 8.79 0 0 1-2.82 1.91 8.48 8.48 0 0 1-3.44.68Zm0-2.54a6 6 0 0 0 2.44-.49A6.36 6.36 0 0 0 24 21.44a6.25 6.25 0 0 0 0-4.85 6.09 6.09 0 0 0-1.35-2 6.35 6.35 0 0 0-2-1.36 6.3 6.3 0 0 0-4.87 0 6.39 6.39 0 0 0-2 1.36 6.22 6.22 0 0 0-1.34 2 6.25 6.25 0 0 0 0 4.85 6.33 6.33 0 0 0 1.34 2 6.2 6.2 0 0 0 2 1.35 6 6 0 0 0 2.4.49Zm10.69 6.36a2 2 0 0 1-.69-.12 1.62 1.62 0 0 1-.59-.38l-5.74-5.73 2.56-2.53 5.72 5.72a1.62 1.62 0 0 1 .38.59 2 2 0 0 1 .12.67 1.83 1.83 0 0 1-.22.91 1.78 1.78 0 0 1-.64.64 1.72 1.72 0 0 1-.9.23Z"></path>
                    </svg>
                    <div className='group-hover:underline group-hover:text-opacity-100 text-sm font-bold leading-none text-center text-white '>Preview</div>
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* Settings Panel */}
          <div className='bg-black bg-opacity-30 rounded-b-2xl rounded-t-none md:mb-0 flex-1 w-full px-4 py-6 order-3 mb-0 shadow-md border border-white/10 border-t-0'>
            <div className='relative w-full h-full'>
              <div className='md:overscroll-y-auto scrollbar-thin md:scrollbar-thumb-gray-300 md:scrollbar-track-transparent lg:absolute relative inset-0 overflow-x-hidden'>
                <div className='px-4'>
                  <div className='relative flex flex-col space-y-4'>
                    {/* Sound settings */}
                    <div className='relative flex flex-col space-y-4'>
                      <label className='group flex flex-row items-start pl-1 space-x-3 cursor-pointer'>
                        <h1 className='xl:text-xl lg:text-lg text-xl font-bold text-white mt-0'>
                          Sound
                        </h1>
                      </label>
                      <label className='group flex flex-row items-start pl-1 space-x-3 cursor-pointer'>
                        <div className='flex flex-col w-full'>
                          <div className='flex flex-row items-center flex-grow px-0 py-0 overflow-hidden my-1.5'>
                            <label className='w-20 font-medium text-white'>Music</label>
                            <input className='input-range select-none touch-manipulation disabled:opacity-50 settings-slider'
                              type='range' min='0' max='1' step='0.01' value={volume / 100} />
                          </div>
                          <div className='flex flex-row items-center flex-grow px-0 py-0 overflow-hidden my-1.5'>
                            <label className='w-20 font-medium text-white'>Voice</label>
                            <input className='input-range select-none touch-manipulation disabled:opacity-50 settings-slider'
                              type='range' min='0' max='1' step='0.01' value='0.7' />
                          </div>
                          <div className='flex flex-row items-center flex-grow px-0 py-0 overflow-hidden my-1.5'>
                            <label className='w-20 font-medium text-white'>Effects</label>
                            <input className='input-range select-none touch-manipulation disabled:opacity-50 settings-slider'
                              type='range' min='0' max='1' step='0.01' value='0.5' />
                          </div>
                        </div>
                      </label>


                      {/* Settings section can be empty since the app doesn't have these features */}
                    </div>
                  </div>


                  {/* Remove the reset settings button and just add PreziQ info */}
                  <div className='pb-2 mt-6'>
                    <h1 className='xl:text-xl lg:text-lg text-lg font-bold text-white'>
                      PreziQ v1.0
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Dialog chọn vai trò */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[425px] bg-[#0f2a2e] text-white border border-[#c6ea84]/30 shadow-xl rounded-xl overflow-hidden">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-[#c6ea84] to-[#a8d662] bg-clip-text text-transparent">
              Thiết lập vai trò
            </DialogTitle>
            <DialogDescription className="text-center text-gray-300">
              Chọn cách bạn muốn tham gia vào phiên này
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#f2f9e4] border border-[#c6ea84]/40 hover:border-[#c6ea84]/70 transition-colors shadow-sm">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-[#133338]/80" />
                <Label htmlFor="participate-mode" className="font-medium text-[#133338]">
                  Tham gia trả lời
                </Label>
              </div>
              <Switch
                id="participate-mode"
                checked={willParticipate}
                onCheckedChange={setWillParticipate}
                className="data-[state=checked]:bg-[#c6ea84] data-[state=unchecked]:bg-gray-200"
              />
            </div>

            <AnimatePresence>
              {willParticipate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
                  className="space-y-5"
                >
                  <div className="flex flex-col items-center gap-5">
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="relative group cursor-pointer"
                      onClick={handleChangeAvatar}
                    >
                      <div className="absolute inset-0 bg-[#c6ea84]/30 rounded-full blur-xl -z-10"></div>
                      <Avatar className="w-24 h-24 border-2 border-[#c6ea84]/50 shadow-lg transition-all duration-300 group-hover:border-[#c6ea84] group-hover:shadow-[#c6ea84]/20">
                        <AvatarImage
                          src={participantAvatar}
                          className={isChangingAvatar ? 'animate-pulse' : ''}
                        />
                        <AvatarFallback className="bg-[#133338] text-white font-medium">
                          {participantName
                            ? participantName.substring(0, 2).toUpperCase()
                            : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#133338]/70 to-[#133338]/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-white text-sm font-medium flex items-center gap-1.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <path d="M12 20h9"></path>
                            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                          </svg>
                          Đổi avatar
                        </motion.div>
                      </div>
                    </motion.div>

                    <div className="w-full space-y-2.5">
                      <Label
                        htmlFor="participant-name"
                        className="text-sm text-gray-200 font-medium"
                      >
                        Tên của bạn
                      </Label>
                      <Input
                        id="participant-name"
                        value={participantName}
                        onChange={(e) => setParticipantName(e.target.value)}
                        placeholder="Nhập tên của bạn"
                        className="bg-[#1a3c41] border-[#c6ea84]/40 focus:border-[#c6ea84] focus:ring-[#c6ea84]/20 placeholder:text-gray-400 text-white transition-all duration-300"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#c6ea84]/20">
            <Button
              variant="outline"
              onClick={() => setShowRoleDialog(false)}
              className="bg-[#1a3c41] border-[#c6ea84]/30 text-gray-200 hover:bg-[#254a50] hover:border-[#c6ea84]/40 transition-all duration-300"
            >
              Hủy
            </Button>
            <Button
              onClick={handleRoleConfirm}
              disabled={willParticipate && !participantName}
              className="bg-[#c6ea84] hover:bg-[#d7f595] text-[#133338] font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md hover:shadow-[#c6ea84]/20"
            >
              {isJoining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-[#133338]/70" />
                  Đang xử lý...
                </>
              ) : (
                'Xác nhận'
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
            className='fixed bottom-4 left-4 right-4 sm:left-auto sm:right-auto sm:bottom-8 sm:w-96 px-2 sm:px-0 z-50'
          >
            <Alert
              variant='destructive'
              className='bg-black bg-opacity-40 border border-[rgb(255,198,121)] text-white text-sm shadow-lg'
            >
              <AlertDescription className='flex items-center'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="rgb(255,198,121)" className="w-5 h-5 mr-2">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



