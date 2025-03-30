import { motion } from 'framer-motion';
import { BookOpen, CalendarIcon, Edit, Eye, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
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

					<div className="flex items-center justify-between">
						<Button
							className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 dark:text-indigo-300 rounded-none"
							size="sm"
							onClick={() => onView(collection.id)}
						>
							<BookOpen className="mr-2 h-4 w-4" />
							View Activities
						</Button>
						<div className="flex gap-1">
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 rounded-none"
								onClick={() => onEdit(collection.id)}
							>
								<Edit className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-zinc-500 hover:text-red-600 dark:hover:text-red-500 rounded-none"
								onClick={() => onDelete(collection.id)}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</Card>
		</motion.div>
	);
}
