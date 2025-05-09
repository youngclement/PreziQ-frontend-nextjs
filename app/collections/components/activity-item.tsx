import { Check, Clock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity } from './types';

interface ActivityItemProps {
	activity: Activity;
	onPreview: (id: string) => void;
	closePreview: () => void;
}

export function ActivityItem({
	activity,
	onPreview,
	closePreview,
}: ActivityItemProps) {
	return (
		<div
			key={activity.id}
			className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center hover:shadow-md transition-all rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
		>
			<div className="flex-1">
				<div className="flex items-center flex-wrap gap-2">
					<p className="font-medium text-base">{activity.title}</p>
					{activity.is_published && (
						<Badge className="ml-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 rounded-full">
							<Check className="h-3 w-3 mr-1" />
							Published
						</Badge>
					)}
					{'duration' in activity && activity.duration && (
						<Badge className="ml-0 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-100 rounded-full">
							<Clock className="h-3 w-3 mr-1" />
							{activity.duration} min
						</Badge>
					)}
				</div>
				<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 line-clamp-2">
					{activity.description}
				</p>
			</div>
			<Button
				variant="outline"
				size="sm"
				className="shrink-0 ml-4 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400"
				onClick={() => {
					closePreview();
					onPreview(activity.id);
				}}
			>
				<Eye className="h-3.5 w-3.5 mr-1.5" />
				Preview
			</Button>
		</div>
	);
}
