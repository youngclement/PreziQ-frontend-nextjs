import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface FormActionsProps {
  isSubmitting: boolean;
  collectionId: string;
}

export function FormActions({ isSubmitting, collectionId }: FormActionsProps) {
  const router = useRouter();

  return (
    <div className='flex justify-between mt-8'>
      <Button
        type='button'
        variant='outline'
        className='rounded-md border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors'
        onClick={() => router.push('/collections')}
        disabled={isSubmitting}
      >
        Hủy
      </Button>
      <Button
        type='submit'
        className='rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white transition-colors'
        disabled={isSubmitting}
      >
        <Save className='mr-2 h-4 w-4' />
        {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật'}
      </Button>
    </div>
  );
}
