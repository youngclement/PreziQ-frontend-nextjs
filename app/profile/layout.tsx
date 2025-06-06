'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

import Loading from '@/components/common/loading';
import Header from '@/components/header';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoggedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra xác thực và chuyển hướng nếu chưa đăng nhập
    const checkAuth = () => {
      if (!isLoggedIn) {
        router.push('/auth/login');
      } else {
        setLoading(false);
      }
    };

    // Đặt timeout ngắn để đảm bảo trạng thái auth đã được cập nhật
    const timer = setTimeout(checkAuth, 500);
    return () => clearTimeout(timer);
  }, [isLoggedIn, router]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className='min-h-screen relative overflow-hidden'>
      {/* Animated Background */}
      <div className='fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20'>
        {/* Floating shapes */}
        <div className='absolute top-20 left-10 w-72 h-72 bg-blue-300/20 dark:bg-blue-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob'></div>
        <div className='absolute top-40 right-10 w-72 h-72 bg-purple-300/20 dark:bg-purple-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000'></div>
        <div className='absolute -bottom-8 left-20 w-72 h-72 bg-pink-300/20 dark:bg-pink-500/10 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000'></div>

        {/* Grid pattern */}
        <div className='absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10'></div>
      </div>

      {/* Content */}
      <div className='relative z-10'>
        <Header />
        <div className='pt-24 pb-8 px-4 md:px-6 lg:px-8'>
          <div className='max-w-4xl mx-auto'>{children}</div>
        </div>
      </div>
    </div>
  );
}
