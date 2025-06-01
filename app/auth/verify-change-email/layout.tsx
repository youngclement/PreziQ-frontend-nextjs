import { Metadata } from 'next';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Xác thực thay đổi Email | PreziQ',
  description: 'Xác thực thay đổi địa chỉ email của bạn',
};

function LoadingFallback() {
  return (
    <div className='min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden'>
      {/* Animated Background */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20'>
        <div className='absolute top-0 left-0 w-full h-full'>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000'></div>
          <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-200/20 dark:bg-indigo-500/10 rounded-full blur-2xl animate-pulse delay-500'></div>
        </div>
      </div>

      {/* Loading Content */}
      <div className='relative z-10 flex flex-col items-center space-y-6'>
        <div className='relative'>
          <div className='w-16 h-16 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400'></div>
          <div className='absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-blue-400'></div>
        </div>
        <div className='text-center space-y-2'>
          <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
            Đang tải...
          </h3>
          <p className='text-gray-600 dark:text-gray-400 text-sm'>
            Vui lòng chờ trong giây lát
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyChangeEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}
