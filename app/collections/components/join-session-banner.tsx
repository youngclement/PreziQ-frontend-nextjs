'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useTheme } from 'next-themes';
import { Code, ArrowRight, Users, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useLanguage } from '@/contexts/language-context';

export function JoinSessionBanner() {
  const [sessionCode, setSessionCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = resolvedTheme === 'dark';

  const handleJoinSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionCode.trim()) {
      setError(t('collections.pleaseEnterSessionCode'));
      return;
    }

    // Redirect to the session page
    router.push(`/sessions/${sessionCode}`);
  };

  const handleCreateCollection = () => {
    router.push('/collections/create');
  };

  return (
    <div className='flex flex-col md:flex-row gap-4 mb-10'>
      {/* Left panel - Join Session */}
      <div
        className={`md:w-1/2 rounded-xl flex flex-row items-center justify-start w-full gap-8 p-4 md:p-8 lg:p-0 ${
          isDark ? 'bg-[#124045]' : 'bg-[#17494D]'
        }`}
      >
        <div className='aspect-square lg:block relative hidden w-5/12 ml-8'>
          <div className='absolute inset-0 flex items-center justify-center'>
            <PlayCircle className='w-24 h-24 text-[#6FEEFF] opacity-80' />
          </div>
        </div>
        <div className='lg:w-7/12 lg:mr-8 lg:my-8 flex flex-col items-center justify-center w-full'>
          <h2 className='md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl md:pb-0 pb-2 text-3xl font-black leading-none text-center text-white tracking-wide'>
            {t('collections.joinSession')}
          </h2>
          <h3 className='md:text-base lg:text-xl flex flex-col items-center justify-center pb-4 text-sm font-bold leading-none text-center text-white tracking-wide'>
            <div>{t('collections.enterPinToParticipate')}</div>
            <div>{t('collections.participateAndAnswer')}</div>
          </h3>

          <form onSubmit={handleJoinSession} className='w-full max-w-[12rem]'>
            <div className='relative mb-3'>
              <Input
                value={sessionCode}
                onChange={(e) => {
                  setSessionCode(e.target.value);
                  setError(null);
                }}
                placeholder={t('collections.enterPinCode')}
                className='pl-10 h-12 bg-white/10 text-white placeholder:text-white/70 border-white/30 focus:border-white focus:ring-white/30 rounded-xl tracking-wide'
              />
              <Code className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70' />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className='text-sm text-white bg-red-500/30 px-3 py-1 rounded text-center mb-3 tracking-wide'
              >
                {error}
              </motion.p>
            )}

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className='w-full'
            >
              <button
                type='submit'
                className='relative flex group text-lg leading-6 py-3 touch-manipulation cursor-pointer md:h-14 whitespace-nowrap md:px-6 md:w-auto md:py-0 px-6 font-bold text-white min-w-[7rem] md:min-w-[12rem] w-full tracking-wide'
                style={{ borderRadius: 0 }}
              >
                <div
                  className='-inset-1 absolute z-0'
                  style={{ borderRadius: '2.875rem' }}
                ></div>
                <div
                  className='absolute inset-x-0 top-0 bottom-0 transform group-active:translate-y-0.5 group-active:bottom-0.5 z-1 bg-black'
                  style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
                >
                  <div className='relative w-full h-full'>
                    <div
                      className='top-1 absolute inset-x-0 bottom-0 overflow-hidden'
                      style={{
                        backgroundColor: '#00a76d',
                        borderRadius: '2.8125rem',
                      }}
                    >
                      <div className='bg-opacity-30 absolute inset-0 bg-black'></div>
                    </div>
                    <div
                      className='bottom-1 absolute inset-x-0 top-0 overflow-hidden group-active:bottom-0.5'
                      style={{
                        backgroundColor: '#00a76d',
                        borderRadius: '2.8125rem',
                      }}
                    >
                      <div className='group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0'></div>
                    </div>
                  </div>
                </div>
                <div
                  className='relative flex flex-row gap-x-4 items-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 group-active:translate-y-0'
                  style={{ padding: '0.25rem' }}
                >
                  <div className='flex flex-col flex-1 items-center'>
                    <div className='relative'>
                      <div className='relative'>{t('collections.joinNow')}</div>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          </form>
        </div>
      </div>

      {/* Right panel - Create Collection */}
      <div
        className={`md:w-1/2 rounded-xl flex flex-row items-center justify-start w-full gap-8 p-4 md:p-0 ${
          isDark ? 'bg-[#124045]' : 'bg-[#17494D]'
        }`}
      >
        <div className='aspect-square lg:block relative hidden w-5/12 ml-8'>
          <div className='absolute inset-0 flex items-center justify-center'>
            <Users className='w-24 h-24 text-[#6FEEFF] opacity-80' />
          </div>
        </div>
        <div className='lg:w-7/12 lg:mr-8 lg:my-8 flex flex-col items-center justify-center w-full'>
          <h2 className='md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl md:pb-0 pb-2 text-3xl font-black leading-none text-center text-white tracking-wide'>
            {t('collections.createCollection')}
          </h2>
          <h3 className='md:text-base lg:text-xl flex flex-col items-center justify-center pb-4 text-sm font-bold leading-none text-center text-white tracking-wide'>
            <div>{t('collections.createYourOwn')}</div>
            <div>{t('collections.questionCollection')}</div>
          </h3>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className='w-full max-w-[12rem]'
          >
            <button
              onClick={handleCreateCollection}
              className='relative flex group text-lg leading-6 py-3 touch-manipulation cursor-pointer md:h-14 whitespace-nowrap md:px-6 md:w-auto md:py-0 px-6 font-bold text-black min-w-[7rem] md:min-w-[12rem] w-full tracking-wide'
              style={{ borderRadius: 0 }}
            >
              <div
                className='-inset-1 absolute z-0'
                style={{ borderRadius: '2.875rem' }}
              ></div>
              <div
                className='absolute inset-x-0 top-0 bottom-0 transform group-active:translate-y-0.5 group-active:bottom-0.5 z-1 bg-black'
                style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
              >
                <div className='relative w-full h-full'>
                  <div
                    className='top-1 absolute inset-x-0 bottom-0 overflow-hidden'
                    style={{
                      backgroundColor: '#6FEEFF',
                      borderRadius: '2.8125rem',
                    }}
                  >
                    <div className='bg-opacity-30 absolute inset-0 bg-black'></div>
                  </div>
                  <div
                    className='bottom-1 absolute inset-x-0 top-0 overflow-hidden group-active:bottom-0.5'
                    style={{
                      backgroundColor: '#6FEEFF',
                      borderRadius: '2.8125rem',
                    }}
                  >
                    <div className='group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0'></div>
                  </div>
                </div>
              </div>
              <div
                className='relative flex flex-row gap-x-4 items-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 group-active:translate-y-0'
                style={{ padding: '0.25rem' }}
              >
                <div className='flex flex-col flex-1 items-center'>
                  <div className='relative'>
                    <div className='relative'>
                      {t('collections.createCollection')}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
