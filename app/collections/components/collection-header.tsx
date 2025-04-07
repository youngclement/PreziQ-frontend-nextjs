import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CollectionHeaderProps {
	onCreateCollection: () => void;
}

export function CollectionHeader({
	onCreateCollection,
}: CollectionHeaderProps) {
	return (
		<div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
			<div>
				<h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
					My Collections
				</h1>
				<p className="text-muted-foreground mt-2 text-lg">
					Create and manage your interactive learning collections
				</p>
			</div>
			<Button
				onClick={onCreateCollection}
				className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all rounded-none"
				size="lg"
			>
				<PlusCircle className="mr-2 h-5 w-5" />
				New Collection
			</Button>
		</div>
	);
}
