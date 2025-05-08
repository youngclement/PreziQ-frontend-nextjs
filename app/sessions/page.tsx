'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, KeyRound, Code } from 'lucide-react';

const SessionPage = () => {
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode.trim()) {
      setError('Vui lòng nhập mã phiên tham gia');
      return;
    }

    // Chỉ chuyển hướng đến trang sessions/[code], không tạo WebSocket ở đây
    router.push(`/sessions/${sessionCode}`);
  };

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#0a1b25] to-[#0f2231] flex flex-col items-center justify-center p-6'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className='w-full max-w-md'
      >
        <div className='bg-[#0e1c26] shadow-2xl rounded-3xl overflow-hidden border border-white/5 backdrop-blur-sm'>
          <div className='bg-gradient-to-r from-[#1d364a] to-[#0e1c26] p-8 text-white text-center relative'>
            <div className='absolute inset-0 overflow-hidden'>
              <div className='absolute top-6 left-10 w-12 h-12 rounded-full bg-white/5'></div>
              <div className='absolute bottom-10 right-6 w-20 h-20 rounded-full bg-white/5'></div>
              <div className='absolute top-20 right-20 w-8 h-8 rounded-full bg-white/5'></div>
            </div>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className='relative z-10'
            >
              <div className='w-16 h-16 bg-gradient-to-r from-[#aef359] to-[#8fe360] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg'>
                <KeyRound className='h-8 w-8 text-[#0f2231]' />
              </div>
              <h1 className='text-3xl font-bold mb-2'>PreziQ</h1>
              <p className='text-white/70'>
                Tham gia phiên và bắt đầu cuộc vui
              </p>
            </motion.div>
          </div>

          <div className='p-8'>
            <form onSubmit={handleJoinSession} className='space-y-6'>
              <div className='space-y-2'>
                <label
                  htmlFor='sessionCode'
                  className='text-white/80 font-medium text-sm'
                >
                  Nhập mã phiên
                </label>
                <div className='relative'>
                  <Input
                    id='sessionCode'
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value)}
                    placeholder='Nhập mã PIN'
                    className='h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 rounded-xl pl-10 focus:border-[#aef359] focus:ring-[#aef359]/20'
                  />
                  <Code className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/50' />
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  type='submit'
                  className='w-full py-5 text-lg font-bold rounded-full bg-gradient-to-r from-[#c5ee4f] to-[#8fe360] text-[#0f2231] hover:shadow-[#aef359]/20 hover:shadow-2xl transition-all duration-300'
                >
                  <span className='flex items-center justify-center gap-2'>
                    Tham gia ngay
                    <ArrowRight className='h-5 w-5' />
                  </span>
                </Button>
              </motion.div>
            </form>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className='mt-6'
              >
                <Alert
                  variant='destructive'
                  className='bg-red-500/20 border border-red-500 text-white rounded-xl'
                >
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <div className='mt-8 text-center'>
              <p className='text-white/60'>Tạo phiên học mới?</p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className='mt-2'
              >
                <Button
                  variant='outline'
                  className='border border-white/20 text-white hover:bg-white/10 rounded-xl font-medium transition-all'
                  onClick={() => router.push('/collections')}
                >
                  Tạo phiên mới
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className='mt-10 text-white text-center max-w-md'
      >
        <h2 className='text-xl font-semibold mb-2'>
          Nền tảng tạo và tham gia bài kiểm tra
        </h2>
        <p className='text-white/70'>
          Tham gia các phiên học tương tác, trả lời câu hỏi và kiểm tra kiến
          thức của bạn trong một môi trường thú vị.
        </p>
      </motion.div>
    </div>
  );
};

export default SessionPage;
