import { Check, Eye } from 'lucide-react';
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
			className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center hover:shadow-sm transition-all"
		>
			<div>
				<div className="flex items-center">
					<p className="font-medium">{activity.title}</p>
					{activity.is_published && (
						<Badge className="ml-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 rounded-none">
							<Check className="h-3 w-3 mr-1" />
							Published
						</Badge>
					)}
				</div>
				<p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
					{activity.description}
				</p>
			</div>
			<Button
				variant="outline"
				size="sm"
				className="shrink-0 ml-2 rounded-none"
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
