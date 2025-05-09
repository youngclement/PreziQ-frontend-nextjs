import { motion } from 'framer-motion';
import { BookOpen, CalendarIcon, Eye, Heart, Play, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collection, Activity } from './types';

interface CollectionGridItemProps {
  collection: Collection;
  index: number;
  activities: Activity[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onPreview: (collection: Collection) => void;
  collectionVariants: any;
}

export function CollectionGridItem({
  collection,
  index,
  activities,
  onEdit,
  onDelete,
  onView,
  onPreview,
  collectionVariants,
}: CollectionGridItemProps) {
  // Default image if collection.coverImage is empty
  const imageUrl = collection.coverImage || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=400&h=250&auto=format&fit=crop';

  return (
    <motion.div
      key={collection.id}
      variants={collectionVariants}
      initial='hidden'
      animate='visible'
      custom={index}
      className='group w-full h-full'
    >
      <div className="flex flex-col transform transition-all duration-300 group-hover:scale-105">
        {/* Image Section */}
        <div className="relative overflow-hidden rounded-lg mb-3 shadow-md">
          {/* Image */}
          <div
            className="w-full h-48 bg-cover bg-center rounded-lg transform transition-transform duration-500 group-hover:scale-110"
            style={{ backgroundImage: `url(${imageUrl})` }}
            onClick={() => onPreview(collection)}
          />

          {/* Overlay on hover */}
          <div
            className="z-3 absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300 ease-in-out bg-gradient-to-t from-indigo-900/80 via-indigo-800/60 to-indigo-700/30 dark:from-indigo-800/90 dark:via-indigo-700/70 dark:to-indigo-600/40 opacity-0 group-hover:opacity-100 rounded-lg cursor-pointer"
            onClick={() => onPreview(collection)}
          >
            <Button
              variant='outline'
              size='sm'
              className='text-white border-white hover:bg-white/20 hover:text-white mb-3 text-xs px-3 py-1 h-8 font-medium'
            >
              <Play className='h-3.5 w-3.5 mr-1.5 fill-white' />
              Preview
            </Button>

            <div className='flex space-x-3 mt-2'>
              <Button
                variant='outline'
                size='sm'
                className='text-white border-white hover:bg-white/20 hover:text-white h-7 w-7 p-0'
                onClick={(e) => {
                  e.stopPropagation();
                  onView(collection.id);
                }}
              >
                <Eye className='h-3.5 w-3.5' />
              </Button>

              <Button
                variant='outline'
                size='sm'
                className='text-white border-white hover:bg-white/20 hover:text-white h-7 w-7 p-0'
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(collection.id);
                }}
              >
                <Users className='h-3.5 w-3.5' />
              </Button>
            </div>
          </div>

          {/* Status Badge */}
          {collection.isPublished && (
            <Badge className='absolute top-2 right-2 bg-emerald-500 text-white shadow-md z-10 text-[11px] px-2 py-0.5 font-medium rounded-full'>
              Published
            </Badge>
          )}
        </div>

        {/* Content Section */}
        <div className="px-1">
          {/* Title */}
          <h3 className='font-semibold text-sm mb-1.5 line-clamp-1 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors'>
            {collection.title}
          </h3>

          {/* Description */}
          <p className='text-xs text-zinc-600 dark:text-zinc-300 mb-3 line-clamp-2 min-h-[2.5rem] leading-relaxed'>
            {collection.description}
          </p>

          {/* Info */}
          <div className='flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800'>
            <div className='flex items-center space-x-3'>
              <div className='flex items-center'>
                <BookOpen className='h-3 w-3 mr-1 text-indigo-600 dark:text-indigo-400' />
                <span>{activities.length} activities</span>
              </div>

              {/* Show views if available */}
              {'views' in collection && (
                <div className='flex items-center'>
                  <Eye className='h-3 w-3 mr-1 text-indigo-600 dark:text-indigo-400' />
                  <span>{collection.views}+ views</span>
                </div>
              )}

              {/* Show likes if available */}
              {'likes' in collection && collection.likes > 0 && (
                <div className='flex items-center'>
                  <Heart className='h-3 w-3 mr-1 text-indigo-600 dark:text-indigo-400' />
                  <span>{collection.likes}</span>
                </div>
              )}

              {/* Show date as fallback */}
              {!('views' in collection) && !('likes' in collection) && (
                <div className='flex items-center'>
                  <CalendarIcon className='h-3 w-3 mr-1 text-indigo-600 dark:text-indigo-400' />
                  <span>{new Date(collection.createdAt || new Date()).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })}</span>
                </div>
              )}
            </div>

            {/* Show participants if available */}
            {'participants' in collection && collection.participants > 0 && (
              <div className='flex items-center'>
                <Users className='h-3 w-3 mr-1 text-indigo-600 dark:text-indigo-400' />
                <span>{collection.participants}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
