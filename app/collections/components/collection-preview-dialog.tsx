import { BookOpen, Clock, Edit, Eye, Heart, Users, Users2 } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Collection, Activity } from './types';
import { ActivityItem } from './activity-item';

interface CollectionPreviewDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedCollection: Collection | null;
	activities: Activity[];
	onViewActivities: (id: string) => void;
	onEditCollection: (id: string) => void;
	onPreviewActivity: (id: string) => void;
}

export function CollectionPreviewDialog({
	open,
	onOpenChange,
	selectedCollection,
	activities,
	onViewActivities,
	onEditCollection,
	onPreviewActivity,
}: CollectionPreviewDialogProps) {
	if (!selectedCollection) return null;

	// Calculate average duration if available
	let avgDuration = "--:--";
	if (activities.length > 0 && 'duration' in activities[0]) {
		const totalDuration = activities.reduce((acc, activity) =>
			acc + (activity.duration || 0), 0);
		const averageDuration = Math.round(totalDuration / activities.length);
		avgDuration = `${averageDuration} min`;
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-5xl p-0 overflow-hidden rounded-none">
				<div className="flex flex-col md:flex-row h-full">
					{/* Left Side - Collection Image */}
					<div
						className="md:w-2/5 h-60 md:h-auto bg-cover bg-center relative"
						style={{
							backgroundImage: `url(${selectedCollection.coverImage})`,
						}}
					>
						<div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent md:bg-gradient-to-b flex flex-col justify-end p-6 text-white">
							<Badge
								className={cn(
									'w-fit mb-3 rounded-none',
									selectedCollection.isPublished
										? 'bg-emerald-500/90 hover:bg-emerald-500'
										: 'bg-amber-500/90 hover:bg-amber-500'
								)}
							>
								{selectedCollection.isPublished ? 'Published' : 'Draft'}
							</Badge>
							<h2 className="text-2xl font-bold mb-1 hidden md:block">
								{selectedCollection.title}
							</h2>
							<p className="text-white/80 text-sm line-clamp-2 hidden md:block">
								{selectedCollection.description}
							</p>

							{/* Creator info */}
							<div className="mt-2 text-white/80 text-xs">
								By {selectedCollection.createdBy || 'Unknown'} · {new Date(selectedCollection.createdAt || new Date()).toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric'
								})}
							</div>
						</div>
					</div>

					{/* Right Side - Details and Activities */}
					<div className="flex-1 p-6 max-h-[80vh] overflow-y-auto">
						<DialogHeader className="md:hidden mb-4">
							<DialogTitle className="text-2xl">
								{selectedCollection.title}
							</DialogTitle>
							<DialogDescription>
								{selectedCollection.description}
							</DialogDescription>
						</DialogHeader>

						<DialogHeader className="hidden md:block">
							<DialogTitle className="text-xl">Collection Details</DialogTitle>
						</DialogHeader>

						<div className="space-y-6">
							{/* Stats Section */}
							<div className="grid grid-cols-3 gap-4 py-4">
								<div className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
									<BookOpen className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mb-2" />
									<span className="text-lg font-semibold dark:text-white">
										{activities.length}
									</span>
									<span className="text-xs text-zinc-500 dark:text-zinc-400">
										Activities
									</span>
								</div>
								<div className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
									<Users2 className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mb-2" />
									<span className="text-lg font-semibold dark:text-white">
										{'participants' in selectedCollection ? selectedCollection.participants : 0}
									</span>
									<span className="text-xs text-zinc-500 dark:text-zinc-400">
										Participants
									</span>
								</div>
								<div className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
									<Clock className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mb-2" />
									<span className="text-lg font-semibold dark:text-white">{avgDuration}</span>
									<span className="text-xs text-zinc-500 dark:text-zinc-400">
										Avg. Time
									</span>
								</div>
							</div>

							{/* Additional stats if available */}
							{'views' in selectedCollection && 'likes' in selectedCollection && (
								<div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-300">
									<div className="flex items-center">
										<Eye className="h-4 w-4 mr-1.5 text-indigo-500 dark:text-indigo-400" />
										{selectedCollection.views} views
									</div>
									<div className="flex items-center">
										<Heart className="h-4 w-4 mr-1.5 text-indigo-500 dark:text-indigo-400" />
										{selectedCollection.likes} likes
									</div>
								</div>
							)}

							{/* Activities List */}
							<div>
								<h3 className="text-lg font-semibold mb-3 flex items-center">
									<BookOpen className="mr-2 h-4 w-4 text-indigo-500" />
									Activities in this Collection
								</h3>
								<div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
									{activities.map((activity) => (
										<ActivityItem
											key={activity.id}
											activity={activity}
											onPreview={onPreviewActivity}
											closePreview={() => onOpenChange(false)}
										/>
									))}

									{activities.length === 0 && (
										<div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
											<BookOpen className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />
											<p className="text-zinc-500 dark:text-zinc-400 mb-2">
												No activities in this collection yet
											</p>
											<p className="text-xs text-zinc-400 dark:text-zinc-500">
												Add activities to build your interactive learning
												experience
											</p>
										</div>
									)}
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex flex-col sm:flex-row gap-3 pt-4">
								<Button
									className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
									onClick={() => {
										onOpenChange(false);
										onViewActivities(selectedCollection.id);
									}}
								>
									<BookOpen className="mr-2 h-4 w-4" />
									View Activities
								</Button>
								<Button
									variant="outline"
									className="flex-1 rounded-md border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
									onClick={() => {
										onOpenChange(false);
										onEditCollection(selectedCollection.id);
									}}
								>
									<Edit className="mr-2 h-4 w-4" />
									Edit Collection
								</Button>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
