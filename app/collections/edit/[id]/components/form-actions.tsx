import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Eye, Save } from 'lucide-react';

interface FormActionsProps {
  isSubmitting: boolean;
  collectionId: string;
}

export function FormActions({ isSubmitting, collectionId }: FormActionsProps) {
  const router = useRouter();

  const handleView = () => {
    router.push(`/collection?collectionId=${collectionId}`);
  };

  return (
    <div className='flex justify-between mt-8'>
      <div className='flex gap-2'>
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
          type='button'
          variant='secondary'
          className='rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors'
          onClick={handleView}
          disabled={isSubmitting}
        >
          <Eye className='mr-2 h-4 w-4' />
          Xem
        </Button>
      </div>

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
