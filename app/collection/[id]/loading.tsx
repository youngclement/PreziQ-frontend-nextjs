import { LoadingIndicator } from '@/components/common/loading-indicator';

export default function CollectionLoading() {
  return (
    <div className='container max-w-7xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]'>
      <LoadingIndicator size="lg" text="Loading collection..." />
    </div>
  );
}
