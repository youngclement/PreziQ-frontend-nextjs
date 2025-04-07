import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface CollectionFiltersProps {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	viewMode: string;
	onViewModeChange: (value: string) => void;
}

export function CollectionFilters({
	searchQuery,
	onSearchChange,
	viewMode,
	onViewModeChange,
}: CollectionFiltersProps) {
	return (
		<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
			<div className="relative w-full sm:w-80">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
				<Input
					placeholder="Search collections..."
					className="pl-10 border-zinc-300 dark:border-zinc-700 h-11 rounded-none"
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
				/>
			</div>
			<Tabs
				value={viewMode}
				onValueChange={onViewModeChange}
				className="w-auto"
			>
				<TabsList className="grid w-[180px] grid-cols-2 rounded-none p-0.5 bg-zinc-100 dark:bg-zinc-800">
					<TabsTrigger value="grid" className="flex items-center rounded-none">
						<div className="grid grid-cols-2 gap-0.5 mr-2">
							<div className="w-2 h-2 bg-current"></div>
							<div className="w-2 h-2 bg-current"></div>
							<div className="w-2 h-2 bg-current"></div>
							<div className="w-2 h-2 bg-current"></div>
						</div>
						Grid
					</TabsTrigger>
					<TabsTrigger value="list" className="flex items-center rounded-none">
						<div className="flex flex-col gap-0.5 mr-2">
							<div className="w-4 h-1 bg-current"></div>
							<div className="w-4 h-1 bg-current"></div>
							<div className="w-4 h-1 bg-current"></div>
						</div>
						List
					</TabsTrigger>
				</TabsList>
			</Tabs>
		</div>
	);
}
