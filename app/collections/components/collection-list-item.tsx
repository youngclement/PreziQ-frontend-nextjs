import {
  BookOpen,
  CalendarIcon,
  Eye,
  Presentation,
  Trash2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collection, Activity } from './types';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getTopicImageUrl } from '../constants/topic-images';
import { Switch } from '@/components/ui/switch';

interface CollectionListItemProps {
  collection: Collection;
  activities?: Activity[];
  onEdit?: () => void;
  onView?: (id: string) => void;
  onViewCollection?: () => void;
  onDelete?: (id: string) => void;
  onTogglePublish?: () => void;
  showPublishToggle?: boolean;
}

export function CollectionListItem({
  collection,
  activities,
  onEdit,
  onView,
  onViewCollection,
  onDelete,
  onTogglePublish,
  showPublishToggle = false,
}: CollectionListItemProps) {
  const router = useRouter();

  // Get topic image
  const topicImageUrl = collection.topic
    ? getTopicImageUrl(collection.topic)
    : null;

  const handleHostSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/sessions/host/${collection.collectionId}`);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView(collection.collectionId);
    }
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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      if (
        window.confirm(`Bạn có chắc chắn muốn xoá "${collection.title}" không?`)
      ) {
        onDelete(collection.collectionId);
      }
    }
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
    <div
      className="group cursor-pointer bg-white dark:bg-[#17494D] overflow-hidden hover:shadow-md transition-all rounded-xl shadow-md"
      onClick={handleViewDetails}
    >
      <div className="flex flex-col sm:flex-row h-full">
        <div
          className="sm:w-64 h-40 sm:h-auto bg-cover bg-center relative"
          style={{
            backgroundImage: `url(${
              collection.coverImage ||
              'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&h=250&auto=format&fit=crop'
            })`,
          }}
        >
          {/* Topic Badge */}
          {collection.topic && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-white dark:bg-[#17494D] text-gray-800 dark:text-white py-1 px-3 rounded-full text-xs font-semibold shadow-md">
              {topicImageUrl && (
                <div className="relative w-4 h-4 rounded-full overflow-hidden">
                  <Image
                    src={topicImageUrl}
                    alt={collection.topic}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              {collection.topic}
            </div>
          )}
        </div>

        <div className="flex-1 p-5">
          <div className="flex flex-col sm:flex-row justify-between gap-2 mb-3">
            <h3 className="font-bold text-xl dark:text-white">
              {collection.title}
            </h3>
            <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-300">
              <div className="flex items-center gap-1">
                <BookOpen className="h-3.5 w-3.5" />
                <span>
                  {collection?.activities?.length || activities?.length || 0} activities
                </span>
              </div>
              <div className="flex items-center">
                <CalendarIcon className="h-3.5 w-3.5 mr-1" />
                {formatDate(collection.createdAt)}
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-5 line-clamp-2">
            {collection.description || 'No description available'}
          </p>

          <div className="flex flex-wrap gap-3">
            <PlayButton
              onClick={handleHostSession}
              className="flex-1 min-w-0 sm:flex-none sm:w-auto px-3 max-w-[calc(50%-0.25rem)] sm:max-w-none"
            >
              HOST
            </PlayButton>

            {onEdit && (
              <EditButton
                onClick={handleEdit}
                className="flex-1 min-w-0 sm:flex-none sm:w-auto px-3 max-w-[calc(50%-0.25rem)] sm:max-w-none"
              >
                EDIT
              </EditButton>
            )}

            {onDelete && (
              <DeleteButton
                onClick={handleDelete}
                className="flex-1 min-w-0 sm:flex-none sm:w-auto px-3 max-w-[calc(50%-0.25rem)] sm:max-w-none"
              >
                DELETE
              </DeleteButton>
            )}

            {onViewCollection && (
              <ViewButton
                onClick={handleViewCollection}
                className="flex-1 min-w-0 sm:flex-none sm:w-auto px-3 max-w-[calc(50%-0.25rem)] sm:max-w-none"
              >
                VIEW
              </ViewButton>
            )}
          </div>

          {/* Publish toggle */}
          {showPublishToggle && onTogglePublish && (
            <div
              className="flex items-center gap-2 mt-2"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {collection.isPublished ? 'Đã xuất bản' : 'Chưa xuất bản'}
              </span>
              <Switch
                checked={collection.isPublished}
                onCheckedChange={() => {
                  onTogglePublish();
                }}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}
        </div>
      </div>
    </div>
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
        className="-inset-1 absolute z-0"
        style={{ borderRadius: '2.875rem' }}
      ></div>
      <div
        className="absolute inset-x-0 top-0 bottom-0 transform button-group-active:translate-y-0.5 button-group-active:bottom-0.5 z-1 bg-black"
        style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
      >
        <div className="relative w-full h-full">
          <div
            className="top-1 absolute inset-x-0 bottom-0 overflow-hidden"
            style={{ backgroundColor: '#00a76d', borderRadius: '2.8125rem' }}
          >
            <div className="bg-opacity-30 absolute inset-0 bg-black"></div>
          </div>
          <div
            className="bottom-1 absolute inset-x-0 top-0 overflow-hidden button-group-active:bottom-0.5"
            style={{ backgroundColor: '#00a76d', borderRadius: '2.8125rem' }}
          >
            <div className="button-group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0"></div>
          </div>
        </div>
      </div>
      <div
        className="relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 button-group-active:translate-y-0"
        style={{ padding: '0.25rem' }}
      >
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
        className="-inset-1 absolute z-0"
        style={{ borderRadius: '2.875rem' }}
      ></div>
      <div
        className="absolute inset-x-0 top-0 bottom-0 transform button-group-active:translate-y-0.5 button-group-active:bottom-0.5 z-1 bg-black"
        style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
      >
        <div className="relative w-full h-full">
          <div
            className="top-1 absolute inset-x-0 bottom-0 overflow-hidden"
            style={{ backgroundColor: '#FFD166', borderRadius: '2.8125rem' }}
          >
            <div className="bg-opacity-30 absolute inset-0 bg-black"></div>
          </div>
          <div
            className="bottom-1 absolute inset-x-0 top-0 overflow-hidden button-group-active:bottom-0.5"
            style={{ backgroundColor: '#FFD166', borderRadius: '2.8125rem' }}
          >
            <div className="button-group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0"></div>
          </div>
        </div>
      </div>
      <div
        className="relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 button-group-active:translate-y-0"
        style={{ padding: '0.25rem' }}
      >
        <div className="flex flex-col flex-1 items-center">
          <div className="relative">
            <div className="relative flex items-center justify-center">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
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
        className="-inset-1 absolute z-0"
        style={{ borderRadius: '2.875rem' }}
      ></div>
      <div
        className="absolute inset-x-0 top-0 bottom-0 transform button-group-active:translate-y-0.5 button-group-active:bottom-0.5 z-1 bg-black"
        style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
      >
        <div className="relative w-full h-full">
          <div
            className="top-1 absolute inset-x-0 bottom-0 overflow-hidden"
            style={{ backgroundColor: '#6FEEFF', borderRadius: '2.8125rem' }}
          >
            <div className="bg-opacity-30 absolute inset-0 bg-black"></div>
          </div>
          <div
            className="bottom-1 absolute inset-x-0 top-0 overflow-hidden button-group-active:bottom-0.5"
            style={{ backgroundColor: '#6FEEFF', borderRadius: '2.8125rem' }}
          >
            <div className="button-group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0"></div>
          </div>
        </div>
      </div>
      <div
        className="relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 button-group-active:translate-y-0"
        style={{ padding: '0.25rem' }}
      >
        <div className="flex flex-col flex-1 items-center">
          <div className="relative">
            <div className="relative">{children}</div>
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
        className="-inset-1 absolute z-0"
        style={{ borderRadius: '2.875rem' }}
      ></div>
      <div
        className="absolute inset-x-0 top-0 bottom-0 transform button-group-active:translate-y-0.5 button-group-active:bottom-0.5 z-1 bg-black"
        style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
      >
        <div className="relative w-full h-full">
          <div
            className="top-1 absolute inset-x-0 bottom-0 overflow-hidden"
            style={{ backgroundColor: '#F87171', borderRadius: '2.8125rem' }}
          >
            <div className="bg-opacity-30 absolute inset-0 bg-black"></div>
          </div>
          <div
            className="bottom-1 absolute inset-x-0 top-0 overflow-hidden button-group-active:bottom-0.5"
            style={{ backgroundColor: '#F87171', borderRadius: '2.8125rem' }}
          >
            <div className="button-group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0"></div>
          </div>
        </div>
      </div>
      <div
        className="relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 button-group-active:translate-y-0"
        style={{ padding: '0.25rem' }}
      >
        <div className="flex flex-col flex-1 items-center">
          <div className="relative">
            <div className="relative flex items-center justify-center">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {children}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
