import { motion } from 'framer-motion';
import { BookOpen, CalendarIcon, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collection, Activity } from './types';
import { CollectionActionButtons } from './collection-action-buttons';

interface CollectionGridItemProps {
	collection: Collection;
	index: number;
	activities: Activity[];
	onDelete: (id: string) => void;
	onView: (id: string) => void;
	onPreview: (collection: Collection) => void;
	collectionVariants: any;
}

export function CollectionGridItem({
	collection,
	index,
	activities,
	onDelete,
	onView,
	onPreview,
	collectionVariants,
}: CollectionGridItemProps) {
	return (
		<motion.div
			key={collection.id}
			variants={collectionVariants}
			initial="hidden"
			animate="visible"
			custom={index}
			className="group"
		>
			<Card className="h-full overflow-hidden hover:shadow-lg transition-all border border-zinc-200 dark:border-zinc-800 rounded-none">
				<div
					className="aspect-video w-full bg-cover bg-center relative overflow-hidden cursor-pointer"
					style={{ backgroundImage: `url(${collection.coverImage})` }}
					onClick={() => onPreview(collection)}
				>
					<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
						<Button
							variant="ghost"
							size="sm"
							className="text-white hover:bg-white/20 rounded-none"
						>
							<Eye className="h-4 w-4 mr-2" />
							Preview
						</Button>
					</div>
					{collection.isPublished && (
						<Badge className="absolute top-3 right-3 bg-emerald-500 text-white shadow-sm rounded-none">
							Published
						</Badge>
					)}
				</div>
				<div className="p-5">
					<h3 className="font-semibold text-xl mb-2 line-clamp-1">
						{collection.title}
					</h3>
					<p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">
						{collection.description}
					</p>

					<div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400 space-x-4 mb-4">
						<div className="flex items-center">
							<BookOpen className="h-3.5 w-3.5 mr-1.5" />
							{activities.length} Activities
						</div>
						<div className="flex items-center">
							<CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
							{new Date().toLocaleDateString('en-US')}
						</div>
					</div>

					<CollectionActionButtons
						collectionId={collection.id}
						onDelete={onDelete}
						onPreview={() => onPreview(collection)}
						onView={onView}
						activitiesCount={activities.length}
						isGridView={true}
					/>
				</div>
			</Card>
		</motion.div>
	);
}
