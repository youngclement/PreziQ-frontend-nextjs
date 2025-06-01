import {
  BookOpen,
  CalendarIcon,
  Eye,
  Heart,
  MoreVertical,
  Presentation,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collection, Activity } from './types';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { getTopicImageUrl } from '../constants/topic-images';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';

interface CollectionGridItemProps {
  collection: Collection;
  activities?: Activity[];
  onEdit?: () => void;
  onView?: () => void;
  onViewCollection?: () => void;
  onDelete?: (id: string) => void;
  onTogglePublish?: (e: React.MouseEvent) => void;
  showPublishToggle?: boolean;
}

export function CollectionGridItem({
  collection,
  activities,
  onEdit,
  onView,
  onViewCollection,
  onDelete,
  onTogglePublish,
  showPublishToggle = false,
}: CollectionGridItemProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Default image if collection.coverImage is empty
  const imageUrl =
    collection.coverImage ||
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&h=250&auto=format&fit=crop';

  // Get topic image
  const topicImageUrl = collection.topic ? getTopicImageUrl(collection.topic) : null;

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      onEdit();
    }
  };

  const handleViewCollection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewCollection) {
      onViewCollection();
    }
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteDialog(true);
    setShowMenu(false);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(collection.collectionId);
    }
    setShowDeleteDialog(false);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      // Xử lý chuỗi ngày tháng từ định dạng "YYYY-MM-DD HH:MM:SS AM/PM"
      const parts = dateString.split(' ');
      if (parts.length >= 2) {
        const datePart = parts[0]; // YYYY-MM-DD
        return new Date(datePart).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }
      return dateString;
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return dateString; // Trả về chuỗi gốc nếu có lỗi
    }
  };

  return (
    <>
      <div
        className='group w-full h-full cursor-pointer'
        onClick={handleViewActivities}
      >
        <div className='bg-white dark:bg-[#17494D] rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300'>
          {/* Image Section */}
          <div className='relative overflow-hidden'>
            {/* Image */}
            <div
              className='w-full h-48 bg-cover bg-center transform transition-transform duration-500 group-hover:scale-105'
              style={{ backgroundImage: `url(${imageUrl})` }}
            />

            {/* Topic Badge */}
            {collection.topic && (
              <div className='absolute top-3 left-3 flex items-center gap-2 bg-white dark:bg-[#17494D] text-gray-800 dark:text-white py-1 px-3 rounded-full text-xs font-semibold'>
                {topicImageUrl && (
                  <div className='relative w-4 h-4 rounded-full overflow-hidden'>
                    <Image
                      src={topicImageUrl}
                      alt={collection.topic}
                      fill
                      className='object-cover'
                    />
                  </div>
                )}
                {collection.topic}
              </div>
            )}

            {/* More menu button */}
            {onDelete && (
              <div className='absolute top-3 right-3' ref={menuRef}>
                <button
                  onClick={toggleMenu}
                  className='bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-white p-1.5 rounded-full hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all duration-200'
                >
                  <MoreVertical className='h-4 w-4' />
                </button>

                {/* Dropdown menu */}
                {showMenu && (
                  <div className='absolute right-0 top-8 z-10 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl overflow-hidden w-32 animate-in fade-in zoom-in-95 duration-200'>
                    <button
                      onClick={handleOpenDeleteDialog}
                      className='flex items-center w-full px-4 py-2.5 text-sm text-red-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150'
                    >
                      <Trash2 className='h-4 w-4 mr-2' />
                      Xoá
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className='p-4'>
            {/* Title */}
            <h3 className='font-bold text-base line-clamp-1 dark:text-white mb-2'>
              {collection.title}
            </h3>

            {/* Description */}
            <p className='text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 min-h-[2.5rem]'>
              {collection.description || 'No description available'}
            </p>

            {/* Activity count */}
            {/* <div className='flex items-center justify-between mb-4'>
              <div className='flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400'>
                <BookOpen className='h-3.5 w-3.5' />
                <span>{activities.length || 0} activities</span>
              </div>
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                {formatDate(collection.createdAt)}
              </div>
            </div> */}

            {/* Action buttons */}
            <div className='flex flex-wrap gap-2'>
              <PlayButton onClick={handleHostSession} className='flex-1'>
                HOST
              </PlayButton>

              {onViewCollection && (
                <ViewButton onClick={handleViewCollection} className='flex-1'>
                  VIEW
                </ViewButton>
              )}

              {onEdit && (
                <EditButton onClick={handleEdit} className='flex-1'>
                  EDIT
                </EditButton>
              )}
            </div>

            {/* Publish toggle */}
            {showPublishToggle && onTogglePublish && (
              <div className='flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  {collection.isPublished ? 'Đã xuất bản' : 'Chưa xuất bản'}
                </span>
                <Switch
                  checked={collection.isPublished}
                  onCheckedChange={(checked, e) => {
                    e?.stopPropagation();
                    onTogglePublish(e as React.MouseEvent);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className='bg-white dark:bg-gray-800 border-none shadow-lg'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-gray-900 dark:text-white text-xl'>
              Xác nhận xoá
            </AlertDialogTitle>
            <AlertDialogDescription className='text-gray-600 dark:text-gray-300'>
              Bạn có chắc chắn muốn xoá{' '}
              <span className='font-medium text-gray-900 dark:text-white'>
                "{collection.title}"
              </span>{' '}
              không? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className='border border-gray-200 dark:border-gray-700 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg'>
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-red-500 hover:bg-red-600 text-white border-none rounded-lg transition-colors'
            >
              Xoá bộ sưu tập
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Custom button components to match QUIZ.COM style
function PlayButton({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex button-group text-sm leading-5 touch-manipulation cursor-pointer font-bold text-white h-10 ${className}`}
      style={{ borderRadius: 0 }}
    >
      <div
        className='-inset-1 absolute z-0'
        style={{ borderRadius: '2.875rem' }}
      ></div>
      <div
        className='absolute inset-x-0 top-0 bottom-0 transform button-group-active:translate-y-0.5 button-group-active:bottom-0.5 z-1 bg-black'
        style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
      >
        <div className='relative w-full h-full'>
          <div
            className='top-1 absolute inset-x-0 bottom-0 overflow-hidden'
            style={{ backgroundColor: '#00a76d', borderRadius: '2.8125rem' }}
          >
            <div className='bg-opacity-30 absolute inset-0 bg-black'></div>
          </div>
          <div
            className='bottom-1 absolute inset-x-0 top-0 overflow-hidden button-group-active:bottom-0.5'
            style={{ backgroundColor: '#00a76d', borderRadius: '2.8125rem' }}
          >
            <div className='button-group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0'></div>
          </div>
        </div>
      </div>
      <div
        className='relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 button-group-active:translate-y-0'
        style={{ padding: '0.25rem' }}
      >
        <div className='flex flex-col flex-1 items-center'>
          <div className='relative'>
            <div className='relative flex items-center justify-center'>
              <Presentation className='h-3.5 w-3.5 mr-1.5' />
              {children}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function ViewButton({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex button-group text-sm leading-5 touch-manipulation cursor-pointer font-bold text-black h-10 ${className}`}
      style={{ borderRadius: 0 }}
    >
      <div
        className='-inset-1 absolute z-0'
        style={{ borderRadius: '2.875rem' }}
      ></div>
      <div
        className='absolute inset-x-0 top-0 bottom-0 transform button-group-active:translate-y-0.5 button-group-active:bottom-0.5 z-1 bg-black'
        style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
      >
        <div className='relative w-full h-full'>
          <div
            className='top-1 absolute inset-x-0 bottom-0 overflow-hidden'
            style={{ backgroundColor: '#FFD166', borderRadius: '2.8125rem' }}
          >
            <div className='bg-opacity-30 absolute inset-0 bg-black'></div>
          </div>
          <div
            className='bottom-1 absolute inset-x-0 top-0 overflow-hidden button-group-active:bottom-0.5'
            style={{ backgroundColor: '#FFD166', borderRadius: '2.8125rem' }}
          >
            <div className='button-group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0'></div>
          </div>
        </div>
      </div>
      <div
        className='relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 button-group-active:translate-y-0'
        style={{ padding: '0.25rem' }}
      >
        <div className='flex flex-col flex-1 items-center'>
          <div className='relative'>
            <div className='relative flex items-center justify-center'>
              <Eye className='h-3.5 w-3.5 mr-1.5' />
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
  className = '',
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex button-group text-sm leading-5 touch-manipulation cursor-pointer font-bold text-black h-10 ${className}`}
      style={{ borderRadius: 0 }}
    >
      <div
        className='-inset-1 absolute z-0'
        style={{ borderRadius: '2.875rem' }}
      ></div>
      <div
        className='absolute inset-x-0 top-0 bottom-0 transform button-group-active:translate-y-0.5 button-group-active:bottom-0.5 z-1 bg-black'
        style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
      >
        <div className='relative w-full h-full'>
          <div
            className='top-1 absolute inset-x-0 bottom-0 overflow-hidden'
            style={{ backgroundColor: '#6FEEFF', borderRadius: '2.8125rem' }}
          >
            <div className='bg-opacity-30 absolute inset-0 bg-black'></div>
          </div>
          <div
            className='bottom-1 absolute inset-x-0 top-0 overflow-hidden button-group-active:bottom-0.5'
            style={{ backgroundColor: '#6FEEFF', borderRadius: '2.8125rem' }}
          >
            <div className='button-group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0'></div>
          </div>
        </div>
      </div>
      <div
        className='relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 button-group-active:translate-y-0'
        style={{ padding: '0.25rem' }}
      >
        <div className='flex flex-col flex-1 items-center'>
          <div className='relative'>
            <div className='relative'>{children}</div>
          </div>
        </div>
      </div>
    </button>
  );
}

function DeleteButton({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex button-group text-sm leading-5 touch-manipulation cursor-pointer font-bold text-white h-10 ${className}`}
      style={{ borderRadius: 0 }}
    >
      <div
        className='-inset-1 absolute z-0'
        style={{ borderRadius: '2.875rem' }}
      ></div>
      <div
        className='absolute inset-x-0 top-0 bottom-0 transform button-group-active:translate-y-0.5 button-group-active:bottom-0.5 z-1 bg-black'
        style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
      >
        <div className='relative w-full h-full'>
          <div
            className='top-1 absolute inset-x-0 bottom-0 overflow-hidden'
            style={{ backgroundColor: '#F87171', borderRadius: '2.8125rem' }}
          >
            <div className='bg-opacity-30 absolute inset-0 bg-black'></div>
          </div>
          <div
            className='bottom-1 absolute inset-x-0 top-0 overflow-hidden button-group-active:bottom-0.5'
            style={{ backgroundColor: '#F87171', borderRadius: '2.8125rem' }}
          >
            <div className='button-group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0'></div>
          </div>
        </div>
      </div>
      <div
        className='relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 button-group-active:translate-y-0'
        style={{ padding: '0.25rem' }}
      >
        <div className='flex flex-col flex-1 items-center'>
          <div className='relative'>
            <div className='relative flex items-center justify-center'>
              <Trash2 className='h-3.5 w-3.5 mr-1.5' />
              {children}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
