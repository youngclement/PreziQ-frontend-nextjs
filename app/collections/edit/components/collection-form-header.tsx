import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/language-context';

interface CollectionFormHeaderProps {
  title: string;
  subtitle: string;
}

export function CollectionFormHeader({
  title,
  subtitle,
}: CollectionFormHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <div className='flex items-center gap-4 mb-6'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => router.push('/collections')}
        className='hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors'
      >
        <ArrowLeft className='h-5 w-5' />
      </Button>
      <div>
        <h1 className='text-2xl font-semibold text-gray-800 dark:text-gray-100'>
          {t('collectionForm.title')}
        </h1>
        <p className='text-gray-600 dark:text-gray-400 mt-1'>
          {t('collectionForm.subtitle')}
        </p>
      </div>
    </div>
  );
}
