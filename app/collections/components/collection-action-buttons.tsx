import { BookOpen, CalendarIcon, Edit, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';

interface CollectionActionButtonsProps {
	collectionId: string;
	onDelete: (id: string) => void;
	onPreview: () => void;
	onView: (id: string) => void;
	activitiesCount: number;
	isGridView?: boolean;
}

export function CollectionActionButtons({
	collectionId,
	onDelete,
	onPreview,
	onView,
	activitiesCount,
	isGridView = false,
}: CollectionActionButtonsProps) {
	const router = useRouter();

	const handleEdit = () => {
		router.push(`/collection/${collectionId}/edit`);
	};

	return (
		<div className="flex items-center justify-between">
			<div className="flex gap-2">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 dark:text-indigo-300 rounded-none"
								size="sm"
								onClick={() => onView(collectionId)}
							>
								<BookOpen className="mr-2 h-4 w-4" />
								{isGridView ? 'View Activities' : 'Xem hoạt động'}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Xem {activitiesCount} hoạt động trong bộ sưu tập</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="rounded-none"
								onClick={onPreview}
							>
								<Eye className="mr-2 h-4 w-4" />
								{isGridView ? 'Preview' : 'Xem trước'}
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Xem trước bộ sưu tập</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>

			<div className="flex gap-1">
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 rounded-none"
								onClick={handleEdit}
							>
								<Edit className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Chỉnh sửa bộ sưu tập</p>
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-8 w-8 text-zinc-500 hover:text-red-600 dark:hover:text-red-500 rounded-none"
								onClick={() => onDelete(collectionId)}
							>
								<Trash2 className="h-4 w-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Xóa bộ sưu tập</p>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			</div>
		</div>
	);
}
