import { PlusCircle, Search, Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CollectionHeaderProps {
	onCreateCollection: () => void;
	title?: string;
	description?: string;
	searchQuery?: string;
	onSearch?: (query: string) => void;
	viewMode?: string;
	onViewModeChange?: (mode: string) => void;
}

export function CollectionHeader({
	onCreateCollection,
	title = 'Collections',
	description,
	searchQuery = '',
	onSearch,
	viewMode = 'grid',
	onViewModeChange,
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
						{description || (isMyCollectionsPage
							? 'Create and manage your interactive learning collections'
							: 'Explore published interactive learning collections'
						)}
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

			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				{onSearch && (
					<div className="relative w-full sm:w-80">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
						<Input
							placeholder="Search collections..."
							className="pl-10"
							value={searchQuery}
							onChange={(e) => onSearch(e.target.value)}
						/>
					</div>
				)}

				{onViewModeChange && (
					<Tabs
						value={viewMode}
						onValueChange={onViewModeChange}
						className="w-auto"
					>
						<TabsList className="grid w-[180px] grid-cols-2">
							<TabsTrigger value="grid" className="flex items-center">
								<Grid className="h-4 w-4 mr-2" />
								Grid
							</TabsTrigger>
							<TabsTrigger value="list" className="flex items-center">
								<List className="h-4 w-4 mr-2" />
								List
							</TabsTrigger>
						</TabsList>
					</Tabs>
				)}
			</div>
		</div>
	);
}
