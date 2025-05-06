'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

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
    <div className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold text-center mb-8'>Tham gia phiên</h1>

      <div className='max-w-md mx-auto'>
        <Card className='p-6'>
          <form onSubmit={handleJoinSession} className='space-y-4'>
            <div className='space-y-2'>
              <label htmlFor='sessionCode' className='text-sm font-medium'>
                Mã phiên
              </label>
              <Input
                id='sessionCode'
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value)}
                placeholder='Nhập mã phiên tham gia'
              />
            </div>
            <Button type='submit' className='w-full'>
              Tiếp tục
            </Button>
          </form>

          {error && (
            <Alert variant='destructive' className='mt-4'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SessionPage;
