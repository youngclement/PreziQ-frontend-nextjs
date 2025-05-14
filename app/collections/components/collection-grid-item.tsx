import { BookOpen, CalendarIcon, Eye, Heart, Presentation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collection, Activity } from './types';
import { useRouter } from 'next/navigation';

interface CollectionGridItemProps {
  collection: Collection;
  activities: Activity[];
  onEdit?: (id: string) => void;
  onView: (id: string) => void;
}

export function CollectionGridItem({
  collection,
  activities,
  onEdit,
  onView,
}: CollectionGridItemProps) {
  const router = useRouter();
  // Default image if collection.coverImage is empty
  const imageUrl = collection.coverImage || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&h=250&auto=format&fit=crop';

  const handleHostSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/sessions/host/${collection.collectionId}`);
  };

  const handleViewActivities = (e: React.MouseEvent) => {
    e.stopPropagation();
    onView(collection.collectionId);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(collection.collectionId);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className='group w-full h-full cursor-pointer' onClick={handleViewActivities}>
      <div className="bg-white dark:bg-[#17494D] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
        {/* Image Section */}
        <div className="relative overflow-hidden">
          {/* Image */}
          <div
            className="w-full h-48 bg-cover bg-center transform transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />

          {/* Topic Badge */}
          {collection.topic && (
            <div className='absolute top-3 left-3 bg-white dark:bg-[#17494D] text-gray-800 dark:text-white py-1 px-3 rounded-full text-xs font-semibold '>
              {collection.topic}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Title */}
          <h3 className='font-bold text-base line-clamp-1 dark:text-white mb-2'>
            {collection.title}
          </h3>

          {/* Description */}
          <p className='text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 min-h-[2.5rem]'>
            {collection.description || 'No description available'}
          </p>

          {/* Activity count */}
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
              <BookOpen className='h-3.5 w-3.5' />
              <span>{activities.length || 0} activities</span>
            </div>
            <div className='text-xs text-gray-500 dark:text-gray-400'>
              {formatDate(collection.createdAt)}
            </div>
          </div>

          {/* Action buttons */}
          <div className='flex space-x-2'>
            <PlayButton onClick={handleHostSession} className="w-full">
              HOST
            </PlayButton>

            {onEdit && (
              <EditButton onClick={handleEdit} className="w-2/5">
                EDIT
              </EditButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom button components to match QUIZ.COM style
function PlayButton({
  children,
  onClick,
  className = ""
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex group text-sm leading-5 touch-manipulation cursor-pointer font-bold text-white h-10 ${className}`}
      style={{ borderRadius: 0 }}
    >
      <div className="-inset-1 absolute z-0" style={{ borderRadius: "2.875rem" }}></div>
      <div
        className="absolute inset-x-0 top-0 bottom-0 transform group-active:translate-y-0.5 group-active:bottom-0.5 z-1 bg-black"
        style={{ borderRadius: "3.125rem", padding: "0.25rem" }}
      >
        <div className="relative w-full h-full">
          <div
            className="top-1 absolute inset-x-0 bottom-0 overflow-hidden"
            style={{ backgroundColor: "#00a76d", borderRadius: "2.8125rem" }}
          >
            <div className="bg-opacity-30 absolute inset-0 bg-black"></div>
          </div>
          <div
            className="bottom-1 absolute inset-x-0 top-0 overflow-hidden group-active:bottom-0.5"
            style={{ backgroundColor: "#00a76d", borderRadius: "2.8125rem" }}
          >
            <div className="group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0"></div>
          </div>
        </div>
      </div>
      <div className="relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 group-active:translate-y-0" style={{ padding: "0.25rem" }}>
        <div className="flex flex-col flex-1 items-center">
          <div className="relative">
            <div className="relative flex items-center justify-center">
              <Presentation className="h-3.5 w-3.5 mr-1.5" />
              {children}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function EditButton({
  children,
  onClick,
  className = ""
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex group text-sm leading-5 touch-manipulation cursor-pointer font-bold text-black h-10 ${className}`}
      style={{ borderRadius: 0 }}
    >
      <div className="-inset-1 absolute z-0" style={{ borderRadius: "2.875rem" }}></div>
      <div
        className="absolute inset-x-0 top-0 bottom-0 transform group-active:translate-y-0.5 group-active:bottom-0.5 z-1 bg-black"
        style={{ borderRadius: "3.125rem", padding: "0.25rem" }}
      >
        <div className="relative w-full h-full">
          <div
            className="top-1 absolute inset-x-0 bottom-0 overflow-hidden"
            style={{ backgroundColor: "#6FEEFF", borderRadius: "2.8125rem" }}
          >
            <div className="bg-opacity-30 absolute inset-0 bg-black"></div>
          </div>
          <div
            className="bottom-1 absolute inset-x-0 top-0 overflow-hidden group-active:bottom-0.5"
            style={{ backgroundColor: "#6FEEFF", borderRadius: "2.8125rem" }}
          >
            <div className="group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0"></div>
          </div>
        </div>
      </div>
      <div className="relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 group-active:translate-y-0" style={{ padding: "0.25rem" }}>
        <div className="flex flex-col flex-1 items-center">
          <div className="relative">
            <div className="relative">{children}</div>
          </div>
        </div>
      </div>
    </button>
  );
}
