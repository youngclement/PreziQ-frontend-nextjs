import { motion } from 'framer-motion';
import { BookOpen, CalendarIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collection, Activity } from './types';
import { CollectionActionButtons } from './collection-action-buttons';

interface CollectionListItemProps {
  collection: Collection;
  index: number;
  activities: Activity[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
  onPreview: (collection: Collection) => void;
  collectionVariants: any;
}

export function CollectionListItem({
  collection,
  index,
  activities,
  onEdit,
  onDelete,
  onView,
  onPreview,
  collectionVariants,
}: CollectionListItemProps) {
  return (
    <motion.div
      key={collection.id}
      variants={collectionVariants}
      initial='hidden'
      animate='visible'
      custom={index}
    >
      <Card className='overflow-hidden hover:shadow-md transition-all border border-zinc-200 dark:border-zinc-800 rounded-none'>
        <div className='flex flex-col sm:flex-row'>
          <div
            className='sm:w-64 h-40 sm:h-auto bg-cover bg-center cursor-pointer relative'
            style={{ backgroundImage: `url(${collection.coverImage})` }}
            onClick={() => onPreview(collection)}
          >
            {collection.isPublished && (
              <Badge className='absolute top-3 right-3 bg-emerald-500 text-white shadow-sm rounded-none'>
                Published
              </Badge>
            )}
          </div>
          <div className='flex-1 p-5'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3'>
              <h3 className='font-semibold text-xl'>{collection.title}</h3>
              <div className='flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400'>
                <div className='flex items-center'>
                  <BookOpen className='h-3.5 w-3.5 mr-1.5' />
                  {activities.length} Activities
                </div>
                <div className='flex items-center'>
                  <CalendarIcon className='h-3.5 w-3.5 mr-1.5' />
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
            <p className='text-sm text-zinc-500 dark:text-zinc-400 mb-5'>
              {collection.description}
            </p>
            <CollectionActionButtons
              collectionId={collection.id}
              onDelete={onDelete}
              onPreview={() => onPreview(collection)}
              onView={onView}
              onEdit={onEdit}
              activitiesCount={activities.length}
              isGridView={false}
            />
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
