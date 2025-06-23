'use client';

import { useEffect, useState } from 'react';
import { UserProfileForm } from './user-profile-form';
import { UserEmailForm } from './user-email-form';
import { UserPasswordForm } from './user-password-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { User, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '@/api-client';
import Loading from '@/components/common/loading';
import { useLanguage } from '@/contexts/language-context';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  avatar?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  createdAt?: string;
}

export function UserProfileClient() {
  const { t } = useLanguage();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleProfileUpdate = (updatedProfile: UserProfile) => {
    setUserProfile(updatedProfile);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await authApi.getAccount();
        if (response?.data?.success) {
          const userData = response.data.data;
          const avatarUrl =
            userData.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              `${userData.firstName || ''} ${userData.lastName || ''}`
            )}&background=random&size=200`;

          const userProfileData: UserProfile = {
            id: userData.id || '',
            email: userData.email || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            nickname: userData.nickname || '',
            avatar: avatarUrl,
            birthDate: userData.birthDate || '',
            gender: userData.gender || '',
            nationality: userData.nationality || '',
          };

          setUserProfile(userProfileData);
        } else {
          setError(t('profile.loadingError'));
        }
      } catch (err) {
        setError(t('profile.loadingError'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [t]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className='w-full h-96 flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-lg'
      >
        <div className='text-center'>
          <p className='text-red-500 dark:text-red-400'>{error}</p>
        </div>
      </motion.div>
    );
  }

  if (!userProfile) {
    return null;
  }

  return (
    <AnimatePresence mode='wait'>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Tabs defaultValue='profile' className='w-full'>
          <TabsList className='grid w-full grid-cols-3 mb-8 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm'>
            <TabsTrigger
              value='profile'
              className='flex items-center space-x-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-200 rounded-lg py-2'
            >
              <User className='h-4 w-4' />
              <span>{t('profile.personalInfo')}</span>
            </TabsTrigger>
            <TabsTrigger
              value='email'
              className='flex items-center space-x-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-200 rounded-lg py-2'
            >
              <Mail className='h-4 w-4' />
              <span>{t('profile.email')}</span>
            </TabsTrigger>
            <TabsTrigger
              value='password'
              className='flex items-center space-x-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary transition-all duration-200 rounded-lg py-2'
            >
              <Lock className='h-4 w-4' />
              <span>{t('profile.password')}</span>
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode='wait'>
            <TabsContent value='profile'>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700'
              >
                <Card className='p-8'>
                  <UserProfileForm
                    userProfile={userProfile}
                    onProfileUpdated={handleProfileUpdate}
                  />
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value='email'>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700'
              >
                <Card className='p-8'>
                  <UserEmailForm email={userProfile.email} />
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value='password'>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700'
              >
                <Card className='p-8'>
                  <UserPasswordForm />
                </Card>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
}
