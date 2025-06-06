'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Home,
} from 'lucide-react';
import { userApi } from '@/api-client/user-update-api';
import { toast } from 'sonner';

export default function VerifyChangeEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyChangeEmail = async () => {
      if (!token) return;

      try {
        setIsVerifying(true);
        setError(null);
        setSuccess(false);

        const response = await userApi.verifyChangeEmail({ token });

        if (response && response.data) {
          setSuccess(true);
          toast.success('Email mới của bạn đã được xác thực thành công!');
        } else {
          const errorMessage = 'Có lỗi xảy ra khi xác thực email mới';
          setError(errorMessage);
          toast.error(errorMessage);
        }
      } catch (err: any) {
        const errorMessage =
          err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          err.message ||
          'Có lỗi xảy ra khi xác thực email mới';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyChangeEmail();
  }, [token]);

  const handleBackToProfile = () => {
    router.push('/profile');
  };

  const handleBackToLogin = () => {
    router.push('/auth/login');
  };

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

      {/* Main Content */}
      <div className='relative z-10 w-full max-w-md'>
        <Card className='shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl overflow-hidden'>
          <CardHeader className='text-center pb-6 pt-8 px-8'>
            <div className='mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg'>
              <svg
                className='w-8 h-8 text-white'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                />
              </svg>
            </div>
            <CardTitle className='text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent'>
              Xác thực Email
            </CardTitle>
          </CardHeader>

          <CardContent className='px-8 pb-8'>
            {isVerifying ? (
              <div className='flex flex-col items-center space-y-6 py-8'>
                <div className='relative'>
                  <div className='w-20 h-20 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-600 dark:border-t-blue-400'></div>
                  <div className='absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-ping border-t-blue-400'></div>
                </div>
                <div className='text-center space-y-2'>
                  <h3 className='text-lg font-semibold text-gray-800 dark:text-gray-200'>
                    Đang xác thực...
                  </h3>
                  <p className='text-gray-600 dark:text-gray-400 text-sm'>
                    Vui lòng chờ trong giây lát
                  </p>
                </div>
              </div>
            ) : success ? (
              <div className='space-y-6'>
                <div className='text-center space-y-4'>
                  <div className='mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg animate-bounce'>
                    <CheckCircle className='w-10 h-10 text-white' />
                  </div>
                  <div className='space-y-2'>
                    <h3 className='text-xl font-bold text-green-600 dark:text-green-400'>
                      Xác thực thành công!
                    </h3>
                    <p className='text-gray-600 dark:text-gray-300 text-sm leading-relaxed'>
                      Email mới của bạn đã được xác thực thành công. Bạn có thể
                      sử dụng email mới để đăng nhập vào tài khoản.
                    </p>
                  </div>
                </div>
                <div className='space-y-3'>
                  <Button
                    onClick={handleBackToProfile}
                    className='w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl'
                  >
                    <Home className='w-4 h-4 mr-2' />
                    Quay lại Hồ sơ
                  </Button>
                </div>
              </div>
            ) : error ? (
              <div className='space-y-6'>
                <div className='text-center space-y-4'>
                  <div className='mx-auto w-20 h-20 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse'>
                    <XCircle className='w-10 h-10 text-white' />
                  </div>
                  <div className='space-y-2'>
                    <h3 className='text-xl font-bold text-red-600 dark:text-red-400'>
                      Xác thực thất bại
                    </h3>
                    <div className='bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl p-4'>
                      <p className='text-red-700 dark:text-red-300 text-sm leading-relaxed'>
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
                <div className='space-y-3'>
                  <Button
                    onClick={handleBackToProfile}
                    className='w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl'
                  >
                    <Home className='w-4 h-4 mr-2' />
                    Quay lại Hồ sơ
                  </Button>
                  <Button
                    onClick={handleBackToLogin}
                    variant='outline'
                    className='w-full py-3 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium rounded-xl transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                  >
                    <ArrowLeft className='w-4 h-4 mr-2' />
                    Quay lại đăng nhập
                  </Button>
                </div>
              </div>
            ) : (
              <div className='space-y-6'>
                <div className='text-center space-y-4'>
                  <div className='mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse'>
                    <AlertTriangle className='w-10 h-10 text-white' />
                  </div>
                  <div className='space-y-2'>
                    <h3 className='text-xl font-bold text-yellow-600 dark:text-yellow-400'>
                      Token không hợp lệ
                    </h3>
                    <div className='bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4'>
                      <p className='text-yellow-700 dark:text-yellow-300 text-sm leading-relaxed'>
                        Không tìm thấy token xác thực hoặc token đã hết hạn. Vui
                        lòng kiểm tra lại đường link hoặc yêu cầu gửi lại email
                        xác thực.
                      </p>
                    </div>
                  </div>
                </div>
                <div className='space-y-3'>
                  <Button
                    onClick={handleBackToProfile}
                    className='w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl'
                  >
                    <Home className='w-4 h-4 mr-2' />
                    Quay lại Hồ sơ
                  </Button>
                  <Button
                    onClick={handleBackToLogin}
                    variant='outline'
                    className='w-full py-3 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium rounded-xl transition-all duration-300 hover:bg-blue-50 dark:hover:bg-blue-950/20'
                  >
                    <ArrowLeft className='w-4 h-4 mr-2' />
                    Quay lại đăng nhập
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className='text-center mt-8'>
          <p className='text-gray-500 dark:text-gray-400 text-sm'>
            © 2025 PreziQ. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </div>
  );
}
