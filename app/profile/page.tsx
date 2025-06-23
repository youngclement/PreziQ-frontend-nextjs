'use client';

import { UserProfileClient } from './components/user-profile-client';
import { Suspense } from 'react';
import { UserCircle, Settings, Shield, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Metadata } from 'next';
import Loading from '@/components/common/loading';
import { useLanguage } from '@/contexts/language-context';

export default function ProfilePage() {
  const { t } = useLanguage();

  return (
    <div className='relative'>
      {/* Decorative elements */}
      <div className='absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-3xl'></div>
      <div className='absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-blue-500/10 to-primary/10 rounded-full blur-3xl'></div>

      <div className='relative z-10'>
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='text-center mb-12'
        >
          <div className='inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg mb-6'>
            <UserCircle className='h-10 w-10 text-white' />
          </div>
          <h1 className='text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-4'>
            {t('profile.profilePageTitle')}
          </h1>
          <p className='text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
            {t('profile.profilePageDescription')}
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-12'
        >
          <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center space-x-3 mb-3'>
              <div className='p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg'>
                <User className='h-5 w-5 text-blue-600 dark:text-blue-400' />
              </div>
              <h3 className='font-semibold text-gray-900 dark:text-white'>
                {t('profile.personalInfoCard')}
              </h3>
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-300'>
              {t('profile.personalInfoCardDesc')}
            </p>
          </div>

          <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center space-x-3 mb-3'>
              <div className='p-2 bg-green-100 dark:bg-green-900/30 rounded-lg'>
                <Settings className='h-5 w-5 text-green-600 dark:text-green-400' />
              </div>
              <h3 className='font-semibold text-gray-900 dark:text-white'>
                {t('profile.emailSettingsCard')}
              </h3>
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-300'>
              {t('profile.emailSettingsCardDesc')}
            </p>
          </div>

          <div className='bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center space-x-3 mb-3'>
              <div className='p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg'>
                <Shield className='h-5 w-5 text-purple-600 dark:text-purple-400' />
              </div>
              <h3 className='font-semibold text-gray-900 dark:text-white'>
                {t('profile.securityCard')}
              </h3>
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-300'>
              {t('profile.securityCardDesc')}
            </p>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        >
          <Suspense fallback={<LoadingState />}>
            <UserProfileClient />
          </Suspense>
        </motion.div>
      </div>
    </div>
  );
}

function LoadingState() {
  return <Loading />;
}
