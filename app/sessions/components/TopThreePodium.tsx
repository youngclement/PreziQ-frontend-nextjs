'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award } from 'lucide-react';
import Confetti from 'react-confetti';
import { useWindowSize } from '@/hooks/use-window-size';

interface Participant {
  displayName: string;
  displayAvatar: string;
  finalScore: number;
  finalRanking: number;
}

interface TopThreePodiumProps {
  participants: Participant[];
  onComplete: () => void;
}

export default function TopThreePodium({
  participants,
  onComplete,
}: TopThreePodiumProps) {
  const [step, setStep] = useState(0);
  const { width, height } = useWindowSize();
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRainbowConfetti, setShowRainbowConfetti] = useState(false);

  // Lấy top 3 người chơi
  const topThree = [...participants]
    .sort((a, b) => a.finalRanking - b.finalRanking)
    .slice(0, 3);

  // Đảm bảo luôn có đủ 3 phần tử, nếu không đủ thì fill bằng dữ liệu trống
  while (topThree.length < 3) {
    topThree.push({
      displayName: '',
      displayAvatar: '',
      finalScore: 0,
      finalRanking: topThree.length + 1,
    });
  }

  // Lấy thông tin top 1, 2, 3
  const first = topThree[0]; // Người chơi thứ hạng 1
  const second = topThree[1]; // Người chơi thứ hạng 2
  const third = topThree[2]; // Người chơi thứ hạng 3

  useEffect(() => {
    // Tự động chuyển các bước hiệu ứng
    const sequence = [
      // Bước 0: Màn hình tối, không hiện gì
      () => {
        setTimeout(() => setStep(1), 1500);
      },
      // Bước 1: Hiện top 3 ở giữa
      () => {
        setTimeout(() => setStep(2), 3000);
      },
      // Bước 2: Di chuyển top 3 sang phải và hiện top 2 ở giữa
      () => {
        setTimeout(() => setStep(3), 3000);
      },
      // Bước 3: Di chuyển top 2 sang trái, hiện top 1 ở giữa và confetti
      () => {
        setShowConfetti(true);
        setTimeout(() => {
          setShowRainbowConfetti(true);
          setTimeout(() => {
            setShowConfetti(false);
            setShowRainbowConfetti(false);
            setTimeout(() => onComplete(), 2000);
          }, 4000);
        }, 1000);
      },
    ];

    if (step < sequence.length) {
      sequence[step]();
    }
  }, [step, onComplete]);

  // Lấy màu sắc dựa vào thứ hạng
  const getPodiumColor = (ranking: number) => {
    switch (ranking) {
      case 1:
        return 'bg-[rgb(255,198,121)]';
      case 2:
        return 'bg-[rgb(173,216,255)]';
      case 3:
        return 'bg-[rgb(255,204,188)]';
      default:
        return 'bg-gray-300';
    }
  };

  // Lấy màu viền dựa vào thứ hạng
  const getBorderColor = (ranking: number) => {
    switch (ranking) {
      case 1:
        return 'border-[rgb(255,198,121)] ring-4 ring-[rgb(255,198,121)] ring-opacity-50';
      case 2:
        return 'border-[rgb(173,216,255)] ring-2 ring-[rgb(173,216,255)] ring-opacity-50';
      case 3:
        return 'border-[rgb(255,204,188)] ring-2 ring-[rgb(255,204,188)] ring-opacity-50';
      default:
        return 'border-gray-400';
    }
  };

  // Lấy hiệu ứng glow dựa vào thứ hạng
  const getGlowEffect = (ranking: number) => {
    switch (ranking) {
      case 1:
        return 'shadow-[0_0_35px_rgba(255,198,121,0.7)]';
      case 2:
        return 'shadow-[0_0_25px_rgba(173,216,255,0.7)]';
      case 3:
        return 'shadow-[0_0_20px_rgba(255,204,188,0.7)]';
      default:
        return '';
    }
  };

  // Lấy chiều cao avatar dựa vào thứ hạng
  const getAvatarSize = (ranking: number) => {
    switch (ranking) {
      case 1:
        return 'h-36 w-36';
      case 2:
        return 'h-28 w-28';
      case 3:
        return 'h-24 w-24';
      default:
        return 'h-20 w-20';
    }
  };

  // Beam shape style
  const beamStyle = {
    position: 'absolute' as const,
    top: 0,
    width: '200px',
    height: '400px',
    background:
      'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 80%)',
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    pointerEvents: 'none' as const,
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Overlay tối */}
      <motion.div
        className='absolute inset-0 bg-black'
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.97 }}
        transition={{ duration: 1.5 }}
      />

      {/* Sàn sân khấu */}
      <motion.div
        className='absolute bottom-0 w-full h-[15vh] bg-gradient-to-t from-gray-950 to-transparent'
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 2, delay: 1 }}
      />

      {/* Hiệu ứng pháo hoa */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={showRainbowConfetti ? 300 : 100}
          gravity={0.2}
          tweenDuration={5000}
          colors={
            showRainbowConfetti
              ? [
                '#f59e0b',
                '#d97706',
                '#b45309',
                '#92400e',
                '#fbbf24',
                '#f59e0b',
                '#92400e',
              ]
              : ['#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fff7ed']
          }
        />
      )}

      <div className='relative w-full max-w-4xl mx-auto flex items-end justify-center h-[75vh]'>
        {/* Stage light beams */}
        <AnimatePresence>
          {step >= 1 && (
            <>
              {/* Left beam */}
              <motion.div
                style={{
                  ...beamStyle,
                  left: '35%',
                  transform: 'rotate(-15deg) translateX(-50%)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1 }}
              />
              {/* Center beam */}
              <motion.div
                style={{
                  ...beamStyle,
                  left: '50%',
                  transform: 'translateX(-50%)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
              />
              {/* Right beam */}
              <motion.div
                style={{
                  ...beamStyle,
                  left: '65%',
                  transform: 'rotate(15deg) translateX(-50%)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Đường sân khấu */}
        <motion.div
          className='absolute bottom-0 w-full h-[1px] bg-gradient-to-r from-transparent via-gray-500 to-transparent'
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7, scaleX: 1 }}
          transition={{ duration: 2, delay: 1 }}
        />

        {/* Container cho podium */}
        <div className='relative flex items-end justify-center w-full pb-10'>
          <div className='flex items-end justify-center space-x-6'>
            {/* TOP 2 - Bên trái */}
            <AnimatePresence>
              {step >= 2 && (
                <motion.div
                  className='flex flex-col items-center'
                  initial={{
                    x: 0, // Bắt đầu từ giữa
                    y: 60,
                    opacity: 0,
                    scale: 0.7,
                  }}
                  animate={{
                    x: step >= 3 ? -120 : 0, // Di chuyển sang trái khi step 3
                    y: 0,
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 15,
                    x: { duration: 0.8, delay: step === 2 ? 0 : 0.2 },
                    default: { duration: 0.7 },
                  }}
                >
                  {/* Avatar và thông tin */}
                  <motion.div
                    className='flex flex-col items-center mb-4'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Avatar
                      className={`${getAvatarSize(
                        2
                      )} mb-2 border-4 ${getBorderColor(2)} ${getGlowEffect(
                        2
                      )}`}
                    >
                      <AvatarImage
                        src={second.displayAvatar}
                        alt={second.displayName}
                      />
                      <AvatarFallback>
                        {second.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='text-white text-center'>
                      <div className='font-bold text-xl mb-1 text-[rgb(173,216,255)]'>
                        {second.displayName}
                      </div>
                      <div className='flex items-center justify-center'>
                        <Medal className='h-6 w-6 text-[rgb(173,216,255)] mr-1' />
                        <span className='text-slate-200'>
                          {second.finalScore} điểm
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Bục */}
                  <motion.div
                    className={`relative w-32 ${getPodiumColor(
                      2
                    )} rounded-t-lg overflow-hidden`}
                    initial={{ height: 0 }}
                    animate={{ height: 140 }}
                    transition={{
                      duration: 0.7,
                      delay: 0.3,
                      type: 'spring',
                      stiffness: 200,
                    }}
                  >
                    {/* Hiệu ứng gradient bên trong bục */}
                    <div className='absolute inset-0 bg-gradient-to-b from-transparent to-slate-400/30' />

                    <div className='absolute top-4 left-1/2 transform -translate-x-1/2 text-white font-bold text-2xl'>
                      2
                    </div>
                  </motion.div>

                  {/* Spotlight */}
                  <motion.div
                    className='absolute bottom-0 opacity-0 w-[180px] h-[100%]' style={{
                      background:
                        'conic-gradient(from 90deg at 50% 0%, transparent 340deg, rgba(173, 216, 255, 0.3) 350deg, rgba(173, 216, 255, 0.7) 355deg, rgba(173, 216, 255, 0.3) 360deg, transparent 365deg)',
                      transform: 'translateX(-50%)',
                      left: '50%',
                      transformOrigin: 'top',
                      pointerEvents: 'none',
                    }}
                    initial={{ opacity: 0, scaleY: 0.5 }}
                    animate={{
                      opacity: 0.7,
                      scaleY: 1,
                      transition: {
                        opacity: { duration: 1, delay: 0.5 },
                        scaleY: { duration: 0.8, delay: 0.5 },
                      },
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* TOP 1 - Giữa */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div
                  className='flex flex-col items-center z-20'
                  initial={{
                    y: 60,
                    opacity: 0,
                    scale: 0.7,
                  }}
                  animate={{
                    y: 0,
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 15,
                    delay: 0.2,
                  }}
                >
                  {/* Avatar và thông tin */}
                  <motion.div
                    className='flex flex-col items-center mb-4'
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1.1 }}
                    transition={{
                      duration: 1,
                      delay: 0.4,
                      type: 'spring',
                      stiffness: 70,
                    }}
                  >
                    <Avatar
                      className={`${getAvatarSize(
                        1
                      )} mb-2 border-4 ${getBorderColor(1)} ${getGlowEffect(
                        1
                      )}`}
                    >
                      <AvatarImage
                        src={first.displayAvatar}
                        alt={first.displayName}
                      />
                      <AvatarFallback>
                        {first.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='text-white text-center'>
                      <div className='font-bold text-2xl mb-1 text-[rgb(255,198,121)]'>
                        {first.displayName}
                      </div>
                      <div className='flex items-center justify-center'>
                        <Trophy className='h-7 w-7 text-[rgb(255,198,121)] mr-2' />
                        <span className='text-xl text-yellow-200'>
                          {first.finalScore} điểm
                        </span>
                      </div>
                    </div>

                    {/* Hiệu ứng tỏa sáng xung quanh top 1 */}
                    <motion.div
                      className='absolute inset-0 rounded-full'
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 0.3, 0, 0.3, 0],
                        scale: [1, 1.1, 1, 1.1, 1],
                      }}
                      transition={{
                        duration: 3,
                        times: [0, 0.25, 0.5, 0.75, 1],
                        repeat: Infinity,
                        repeatType: 'loop',
                      }}
                      style={{
                        background:
                          'radial-gradient(circle, rgba(255, 198, 121, 0.3) 0%, rgba(255, 198, 121, 0) 70%)',
                        width: '250px',
                        height: '250px',
                        top: '-20%',
                        zIndex: -1,
                      }}
                    />
                  </motion.div>

                  {/* Bục */}
                  <motion.div
                    className={`relative w-36 ${getPodiumColor(
                      1
                    )} rounded-t-lg overflow-hidden`}
                    initial={{ height: 0 }}
                    animate={{ height: 180 }}
                    transition={{
                      duration: 0.8,
                      delay: 0.3,
                      type: 'spring',
                      stiffness: 150,
                    }}
                  >
                    {/* Hiệu ứng gradient bên trong bục */}
                    <div className='absolute inset-0 bg-gradient-to-b from-transparent to-amber-500/30' />

                    {/* Hiệu ứng lấp lánh trên bục */}
                    <motion.div
                      className='absolute inset-0'
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: [0, 0.5, 0, 0.5, 0],
                      }}
                      transition={{
                        duration: 2,
                        times: [0, 0.25, 0.5, 0.75, 1],
                        repeat: Infinity,
                        repeatType: 'loop',
                      }}
                      style={{
                        background:
                          'linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.2) 25%, transparent 50%, rgba(255, 255, 255, 0.2) 75%, transparent 100%)',
                        backgroundSize: '200% 200%',
                      }}
                    />

                    <div className='absolute top-4 left-1/2 transform -translate-x-1/2 text-white font-bold text-3xl'>
                      1
                    </div>
                  </motion.div>

                  {/* Spotlight */}
                  <motion.div
                    className='absolute bottom-0 opacity-0 w-[250px] h-[100%]' style={{
                      background:
                        'conic-gradient(from 90deg at 50% 0%, transparent 338deg, rgba(255, 198, 121, 0.3) 345deg, rgba(255, 198, 121, 0.8) 350deg, rgba(255, 198, 121, 0.9) 355deg, rgba(255, 198, 121, 0.8) 360deg, rgba(255, 198, 121, 0.3) 365deg, transparent 370deg)',
                      transform: 'translateX(-50%)',
                      left: '50%',
                      transformOrigin: 'top',
                      pointerEvents: 'none',
                    }}
                    initial={{ opacity: 0, scaleY: 0.5 }}
                    animate={{
                      opacity: 0.9,
                      scaleY: 1,
                      transition: {
                        opacity: { duration: 1.5, delay: 0.5 },
                        scaleY: { duration: 1, delay: 0.5 },
                      },
                    }}
                  />

                  {/* Hiệu ứng tia sáng xung quanh top 1 */}
                  <motion.div
                    className='absolute z-0'
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: step >= 3 ? [0, 0.7, 0] : 0,
                    }}
                    transition={{
                      duration: 2,
                      times: [0, 0.5, 1],
                      repeat: Infinity,
                      repeatType: 'loop',
                    }} style={{
                      background:
                        'radial-gradient(circle, rgba(255, 198, 121, 0.8) 0%, rgba(255, 198, 121, 0) 70%)',
                      width: '350px',
                      height: '350px',
                      top: '20%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: -1,
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* TOP 3 - Bên phải */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div
                  className='flex flex-col items-center'
                  initial={{
                    x: 0, // Bắt đầu từ giữa
                    y: 60,
                    opacity: 0,
                    scale: 0.7,
                  }}
                  animate={{
                    x: step >= 2 ? 120 : 0, // Di chuyển sang phải khi step 2
                    y: 0,
                    opacity: 1,
                    scale: 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 15,
                    x: { duration: 0.8, delay: step === 1 ? 0 : 0.2 },
                    default: { duration: 0.7 },
                  }}
                >
                  {/* Avatar và thông tin */}
                  <motion.div
                    className='flex flex-col items-center mb-4'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <Avatar
                      className={`${getAvatarSize(
                        3
                      )} mb-2 border-4 ${getBorderColor(3)} ${getGlowEffect(
                        3
                      )}`}
                    >
                      <AvatarImage
                        src={third.displayAvatar}
                        alt={third.displayName}
                      />
                      <AvatarFallback>
                        {third.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='text-white text-center'>
                      <div className='font-bold text-xl mb-1 text-[rgb(255,204,188)]'>
                        {third.displayName}
                      </div>
                      <div className='flex items-center justify-center'>
                        <Award className='h-5 w-5 text-[rgb(255,204,188)] mr-1' />
                        <span className='text-orange-200'>
                          {third.finalScore} điểm
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Bục */}
                  <motion.div
                    className={`relative w-28 ${getPodiumColor(
                      3
                    )} rounded-t-lg overflow-hidden`}
                    initial={{ height: 0 }}
                    animate={{ height: 100 }}
                    transition={{
                      duration: 0.7,
                      delay: 0.3,
                      type: 'spring',
                      stiffness: 200,
                    }}
                  >
                    {/* Hiệu ứng gradient bên trong bục */}
                    <div className='absolute inset-0 bg-gradient-to-b from-transparent to-orange-500/30' />

                    <div className='absolute top-4 left-1/2 transform -translate-x-1/2 text-white font-bold text-xl'>
                      3
                    </div>
                  </motion.div>

                  {/* Spotlight */}
                  <motion.div
                    className='absolute bottom-0 opacity-0 w-[180px] h-[100%]' style={{
                      background:
                        'conic-gradient(from 90deg at 50% 0%, transparent 340deg, rgba(255, 204, 188, 0.3) 350deg, rgba(255, 204, 188, 0.7) 355deg, rgba(255, 204, 188, 0.3) 360deg, transparent 365deg)',
                      transform: 'translateX(-50%)',
                      left: '50%',
                      transformOrigin: 'top',
                      pointerEvents: 'none',
                    }}
                    initial={{ opacity: 0, scaleY: 0.5 }}
                    animate={{
                      opacity: 0.7,
                      scaleY: 1,
                      transition: {
                        opacity: { duration: 1, delay: 0.5 },
                        scaleY: { duration: 0.8, delay: 0.5 },
                      },
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
