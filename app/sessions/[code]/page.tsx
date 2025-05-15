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


  const [participantAvatar, setParticipantAvatar] = useState<string>(
    'https://api.dicebear.com/7.x/pixel-art/svg?seed=default'
  );


  const generateAvatar = (name: string) => {
    const newAvatar = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(
      name
    )}-${Date.now()}`;
    setParticipantAvatar(newAvatar);
    return newAvatar;
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
    setAvatar(generateAvatar(displayName));


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
        <Volume className='w-5 h-5 text-[#d5456c] group-hover:text-[#e24b73]' />
      );
    } else if (volume < 70) {
      return (
        <Volume1 className='w-5 h-5 text-[#d5456c] group-hover:text-[#e24b73]' />
      );
    } else {
      return (
        <Volume2 className='w-5 h-5 text-[#d5456c] group-hover:text-[#e24b73]' />
      );
    }
  };


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


  // When user enters their name or changes it
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setDisplayName(name);


    // Generate a new avatar based on their name
    if (name) {
      generateAvatar(name);
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
    <div className='min-h-screen bg-[#151923] p-0 md:p-6 lg:p-8 overflow-hidden'>
      {/* CSS cho volume slider và các elements */}
      <style jsx global>{`
        .volume-slider .slider-thumb {
          background: #7a8deb !important;
          height: 12px !important;
          width: 12px !important;
          transition: transform 0.2s !important;
        }


        .volume-slider .slider-thumb:hover {
          transform: scale(1.2) !important;
        }


        .volume-slider .slider-track {
          background: rgba(122, 141, 235, 0.15) !important;
          height: 3px !important;
          transition: all 0.2s !important;
        }


        .volume-slider .slider-range {
          background: rgba(122, 141, 235, 0.6) !important;
          transition: all 0.2s !important;
        }


        .volume-slider:hover .slider-range {
          background: rgba(122, 141, 235, 0.8) !important;
        }
       
        .shadow-inner-hard-1 {
          box-shadow: inset 0px 1px 4px rgba(0, 0, 0, 0.2);
        }
       
        .pb-full {
          padding-bottom: 100%;
        }
       
        .inset-2 {
          inset: 0.5rem;
        }
      `}</style>


      {/* Background gradient */}
      <motion.div
        className='fixed inset-0 opacity-30 bg-gradient-to-b from-[#1a1f2c] to-[#151923]'
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1 }}
      />


      {/* Background patterns - subtle */}
      <div className='fixed inset-0 overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(rgba(90,116,193,0.03)_1px,transparent_1px)] bg-[size:20px_20px]' />
        <div className='absolute inset-0 z-10 bg-[#151923]/20 backdrop-blur-[1px]' />
      </div>


      {/* Audio controls */}
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
            className='bg-black/50 shadow-lg p-2 rounded-full border border-white/10 backdrop-blur-sm flex items-center justify-center group transition-colors hover:bg-black/70'
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


      {/* Main Content Structure */}
      <div className="relative flex flex-col items-center justify-start w-full h-full max-w-6xl mx-auto pb-4">
        {/* Top navigation bar */}
        <div className="sm:bg-black sm:bg-opacity-50 sm:pb-4 w-full pt-4">
          <div className="h-14 container flex flex-row w-full gap-4 px-4 md:px-5 mx-auto">
            {!hasJoined ? (
              // Display only title when not joined
              <div className="flex-1 flex flex-col justify-center items-center gap-1">
                <motion.h1
                  className="text-2xl text-white font-bold"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  Tham gia phiên
                </motion.h1>
              </div>
            ) : (
              // Display navigation buttons when joined
              <>
                <motion.button
                  className="relative flex group text-lg font-black leading-6 py-3 touch-manipulation cursor-pointer pointer-events-auto px-6 text-white flex-grow-0"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  onClick={handleLeaveSession}
                >
                  <div className="-inset-1 absolute z-0 rounded-2xl"></div>
                  <div className="absolute inset-x-0 top-0 bottom-0 transform group-active:translate-y-0.5 group-active:bottom-0.5 z-1 bg-black rounded-3xl p-1">
                    <div className="relative w-full h-full">
                      <div className="top-1 absolute inset-x-0 bottom-0 overflow-hidden rounded-2xl" style={{ backgroundColor: 'rgb(213, 69, 108)' }}>
                        <div className="bg-opacity-30 absolute inset-0 bg-black"></div>
                      </div>
                      <div className="bottom-1 absolute inset-x-0 top-0 overflow-hidden group-active:bottom-0.5 rounded-2xl" style={{ backgroundColor: 'rgb(213, 69, 108)' }}>
                        <div className="group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0"></div>
                      </div>
                    </div>
                  </div>
                  <div className="relative flex flex-row gap-x-4 items-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 group-active:translate-y-0 p-1">
                    <div className="flex flex-col flex-1 items-center">
                      <div className="relative">
                        <div className="relative">Rời phòng</div>
                      </div>
                    </div>
                  </div>
                </motion.button>


                <div className="flex-1 flex flex-col justify-center items-center gap-1">
                  <motion.span
                    className="text-white text-lg font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    Đang chờ host bắt đầu...
                  </motion.span>
                </div>


                <div className="flex-grow-0">
                  <motion.div
                    className="w-10 h-10"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </>
            )}
          </div>
        </div>


        {!hasJoined ? (
          // Login form
          <>
            <motion.div
              className="sm:mb-1 mt-3 text-lg font-medium text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {isConnecting ? "Đang kết nối..." : "Nhập tên để tham gia phiên"}
            </motion.div>


            <div className="md:container md:mx-auto sm:mt-1 sm:mb-4 w-full px-4 md:px-5 my-3">
              <div className="w-full">
                <motion.div
                  className="flex flex-col items-center w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="relative w-full">
                    {isConnecting ? (
                      <Loading />
                    ) : (
                      <form onSubmit={handleJoinSession}>
                        <input
                          type="text"
                          inputMode="text"
                          className="font-medium px-4 py-3 w-full text-base text-black placeholder-black placeholder-opacity-50 bg-white focus:placeholder-opacity-0 text-left shadow-inner-hard-1 disabled:brightness-75 hover:bg-white-hover focus:bg-white mb-0"
                          name="name"
                          autoComplete="name"
                          placeholder="Nhấn để nhập tên"
                          maxLength={25}
                          value={displayName}
                          onChange={handleNameChange}
                          style={{ border: '0.25rem solid rgb(0, 0, 0)', borderRadius: '1rem' }}
                        />
                        {displayName && (
                          <button
                            type="button"
                            className="top-1/2 right-2 absolute transform -translate-y-1/2"
                            onClick={() => setDisplayName('')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="h-10 opacity-50">
                              <path fill="currentColor" d="M16 31a11.76 11.76 0 0 1-6.17-6.16 11.48 11.48 0 0 1 0-8.91A11.76 11.76 0 0 1 16 9.81a11.43 11.43 0 0 1 8.89 0 11.73 11.73 0 0 1 3.68 2.49A12 12 0 0 1 31 16a10.94 10.94 0 0 1 .91 4.45 11.18 11.18 0 0 1-.9 4.46A11.85 11.85 0 0 1 24.85 31 11.45 11.45 0 0 1 16 31Zm1.53-6.11L20.41 22l2.93 2.93a1.11 1.11 0 0 0 .8.33 1.07 1.07 0 0 0 .79-.32 1.09 1.09 0 0 0 .31-.79 1.06 1.06 0 0 0-.33-.77L22 20.43l3-2.95a1.1 1.1 0 0 0 0-1.55 1 1 0 0 0-.78-.32 1 1 0 0 0-.78.32l-3 3L17.46 16a1 1 0 0 0-.79-.32 1.09 1.09 0 0 0-.78.31 1.06 1.06 0 0 0-.32.78 1 1 0 0 0 .33.77l2.94 2.94-2.94 3a1 1 0 0 0-.33.76 1.12 1.12 0 0 0 1.91.78Z"></path>
                            </svg>
                          </button>
                        )}
                      </form>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>


            {/* Avatar selector */}
            <motion.div
              className="container relative flex items-center justify-center w-full h-full sm:pb-8 pb-4 mx-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <motion.button
                className="absolute top-0 left-0 w-full h-full cursor-default"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoinSession}
                disabled={!displayName || !isConnected}
              />
              <div className="w-full max-w-xs px-4 mx-auto">
                <div className="pb-full relative w-full">
                  <div className="inset-2 absolute">
                    <motion.div
                      className="z-1 relative flex flex-col items-center justify-center w-full h-full overflow-hidden border-4 border-black rounded-full"
                      style={{ backgroundColor: 'rgb(39, 107, 116)' }}
                      whileHover={{
                        boxShadow: '0 0 20px rgba(122, 141, 235, 0.5)',
                        borderColor: displayName && isConnected ? 'rgb(122, 141, 235)' : 'black'
                      }}
                    >
                      <Avatar className='w-full h-full rounded-full'>
                        <AvatarImage
                          src={avatar}
                          alt={displayName || "Anonymous"}
                          className="object-cover"
                        />
                        <AvatarFallback className='bg-gradient-to-br from-[#7a8deb] to-[#c2d8f7] text-white text-8xl flex items-center justify-center'>
                          {displayName ? displayName.substring(0, 2).toUpperCase() : "?"}
                        </AvatarFallback>
                      </Avatar>


                      {!isConnecting && (
                        <motion.div
                          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/80 px-4 py-2 rounded-full backdrop-blur-sm flex gap-2 items-center border border-white/10"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 0.9, y: 0 }}
                          transition={{ delay: 0.6, duration: 0.3 }}
                          whileHover={{ opacity: 1 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAvatar(generateAvatar(displayName));
                          }}
                        >
                          <RefreshCw className='h-4 w-4 text-white' />
                          <span className="text-white text-sm font-medium">Đổi avatar</span>
                        </motion.div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>


            {/* Join Button */}
            {!isConnecting && (
              <motion.div
                className="flex flex-col items-center w-full px-4 md:px-5 lg:w-3/5 xl:w-2/5 mx-auto mt-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Button
                  type="submit"
                  onClick={handleJoinSession}
                  disabled={!isConnected || !displayName}
                  className={`w-full py-6 text-xl font-bold rounded-full shadow-xl transition-all duration-300 ${isConnected && displayName
                    ? 'bg-gradient-to-r from-[#d5456c] to-[#9d366d] text-white hover:from-[#e24b73] hover:to-[#aa3979] hover:shadow-2xl'
                    : 'bg-gradient-to-r from-[#d5456c]/60 to-[#9d366d]/60 text-white/70'
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
            )}


            {/* Display error if any */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className='mt-6 w-full max-w-md mx-auto px-4'
                >
                  <Alert
                    variant='destructive'
                    className='bg-[#d5456c]/20 backdrop-blur-sm border border-[#d5456c]/40 text-white shadow-md'
                  >
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          // Waiting room screen
          <motion.div
            className="container flex flex-col items-center justify-center w-full h-full mx-auto px-4 md:px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {/* Session code display */}
            <motion.div
              className="flex flex-col items-center mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#d5456c] to-[#9d366d] drop-shadow-md">
                {sessionCode}
              </div>
              <div className="text-white/70 text-lg mt-1">
                Mã phiên
              </div>
            </motion.div>


            {/* Your avatar on waiting screen */}
            <motion.div
              className="container flex items-center justify-center w-full sm:pb-8 pb-4 mx-auto mt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="w-full max-w-[200px] mx-auto">
                <div className="pb-full relative w-full">
                  <div className="inset-2 absolute">
                    <motion.div
                      className="z-1 relative flex flex-col items-center justify-center w-full h-full overflow-hidden border-4 border-[#7a8deb]/80 rounded-full bg-[#276b74]"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <Avatar className='w-full h-full rounded-full'>
                        <AvatarImage
                          src={participantAvatar}
                          alt={displayName}
                          className="object-cover"
                        />
                        <AvatarFallback className='bg-gradient-to-br from-[#d5456c] to-[#9d366d] text-white text-7xl flex items-center justify-center'>
                          {displayName.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>


            {/* Participant name */}
            <motion.div
              className="text-white text-xl font-medium mt-1 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {displayName}
            </motion.div>


            {/* Participants grid */}
            {participants.length > 0 && (
              <motion.div
                className="w-full max-w-4xl mx-auto px-4 mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <div className="mb-2 flex items-center justify-center">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Users className="h-5 w-5 mr-2 text-[#d5456c]" />
                    <span>Người tham gia ({participants.length})</span>
                  </h2>
                </div>


                <ScrollArea className="max-h-[240px] overflow-y-auto pr-2">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 justify-items-center">
                    <AnimatePresence>
                      {participants.map((participant, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.05 * Math.min(index, 10), duration: 0.3 }}
                        >
                          <motion.div
                            whileHover={{ y: -5 }}
                            transition={{ type: 'spring', stiffness: 300 }}
                            className="flex flex-col items-center w-16 sm:w-20"
                          >
                            <div className="relative">
                              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 rounded-full border-2 border-black/40 shadow-lg">
                                <AvatarImage
                                  src={participant.displayAvatar}
                                  alt={participant.displayName}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-gradient-to-br from-[#d5456c] to-[#9d366d] text-white text-lg">
                                  {participant.displayName.substring(0, 2).toUpperCase()}
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
                                  className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full border-2 border-[#d5456c] shadow-lg"
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
                                    className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#d5456c] rounded-full"
                                  />
                                </motion.div>
                              )}
                            </div>
                            <span className="text-xs text-white mt-2 truncate max-w-full text-center font-medium">
                              {participant.displayName}
                            </span>
                          </motion.div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </motion.div>
        )}


        {/* Version tag */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className='absolute bottom-2 left-1/2 transform -translate-x-1/2 text-white/30 text-xs'
        >
          PreziQ v1.0
        </motion.div>
      </div>
    </div>
  );
};


export default SessionJoinPage;



