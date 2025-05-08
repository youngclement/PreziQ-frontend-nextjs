import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CollectionHeaderProps {
	onCreateCollection: () => void;
	title?: string;
}

export function CollectionHeader({
	onCreateCollection,
	title = 'Collections',
}: CollectionHeaderProps) {
	const pathname = usePathname();
	const isPublishedPage = pathname === '/collections';
	const isMyCollectionsPage = pathname === '/my-collections';

	return (
		<div className="space-y-6 mb-10">
			<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
						{title}
					</h1>
					<p className="text-muted-foreground mt-2 text-lg">
						{isMyCollectionsPage
							? 'Create and manage your interactive learning collections'
							: 'Explore published interactive learning collections'
						}
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

			<div className="flex space-x-1 border-b">
				<Link
					href="/collections"
					className={`px-4 py-2 font-medium text-sm ${isPublishedPage
							? 'border-b-2 border-indigo-500 text-indigo-600'
							: 'text-gray-500 hover:text-gray-700'
						}`}
				>
					Published Collections
				</Link>
				<Link
					href="/my-collections"
					className={`px-4 py-2 font-medium text-sm ${isMyCollectionsPage
							? 'border-b-2 border-indigo-500 text-indigo-600'
							: 'text-gray-500 hover:text-gray-700'
						}`}
				>
					My Collections
				</Link>
			</div>
		</div>
	);
}
