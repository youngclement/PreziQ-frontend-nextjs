'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { authApi } from '@/api-client';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token'); 
  const [message, setMessage] = useState('Đang xác minh email...');
  const router = useRouter();
  useEffect(() => {
    if (!token) {
      setMessage('Token không hợp lệ.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await authApi.verifyEmail(token);
        setMessage(res.data.message || 'Xác minh email thành công!');
        router.push('/auth/login');
      } catch (error: any) {
        setMessage(error.response?.data?.message || 'Lỗi xác minh email.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex flex-col justify-center items-center mt-80">
      <h1 className="text-xl font-bold text-center">Xác minh email</h1>
      <p className='text-center'>{message}</p>
    </div>
  );
}
