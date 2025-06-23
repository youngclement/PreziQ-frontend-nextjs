'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { authApi } from '@/api/index';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ForgotPasswordDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export default function ForgotPasswordDialog({
  isOpen,
  setIsOpen,
}: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState('');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLanguage();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await authApi.forgotPassword(email);
      toast({
        title: res.data.message,
      });
      setIsOpen(false);
    } catch (error: any) {
      const errorMessages =
        error.response?.data?.errors
          ?.map((err: any) => err.message)
          .join('\n') ||
        error.response?.data?.message ||
        t('forgotPasswordGenericError');

      toast({
        variant: 'destructive',
        title: t('forgotPasswordFailed'),
        description: errorMessages,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('forgotPasswordTitle')}</DialogTitle>
          <DialogDescription>
            {t('forgotPasswordDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleForgotPassword} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>{t('email')}</Label>
            <Input
              id='email'
              placeholder={t('emailPlaceholderForgot')}
              type='email'
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className='focus:outline-none'
            />
          </div>
          <Button type='submit' className='w-full' disabled={isLoading}>
            {isLoading ? t('sending') : t('sendResetLink')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
