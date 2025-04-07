import { FolderOpen, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyCollectionsProps {
	searchQuery: string;
	onCreateCollection: () => void;
}

export function EmptyCollections({
	searchQuery,
	onCreateCollection,
}: EmptyCollectionsProps) {
	return (
		<div className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
			<FolderOpen className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mb-6" />
			<h3 className="text-xl font-semibold">No collections found</h3>
			<p className="text-muted-foreground text-center mt-2 mb-8 max-w-lg">
				{searchQuery
					? 'Try a different search term or clear your search to see all collections.'
					: 'Create your first collection to start building interactive learning experiences.'}
			</p>
			{!searchQuery && (
				<Button
					onClick={onCreateCollection}
					className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-none"
					size="lg"
				>
					<PlusCircle className="mr-2 h-4 w-4" />
					Create Collection
				</Button>
			)}
		</div>
	);
}
