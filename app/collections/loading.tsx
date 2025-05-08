import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';

export default function CollectionsLoading() {
    return (
        <div className="container mx-auto px-4 pt-24 pb-16">
            <div className="mb-8 text-center">
                <Skeleton className="h-12 w-64 mx-auto" />
                <Skeleton className="h-6 w-96 mx-auto mt-3" />
            </div>

            <div className="mx-auto w-full max-w-3xl">
                <Skeleton className="h-12 w-full mb-8" />

                <div className="mt-8">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="flex flex-col space-y-3">
                                <Skeleton className="aspect-video w-full rounded-t-lg" />
                                <Skeleton className="h-8 w-5/6 rounded-md" />
                                <Skeleton className="h-16 w-full rounded-md" />
                                <div className="flex justify-between">
                                    <Skeleton className="h-4 w-20 rounded-md" />
                                    <Skeleton className="h-4 w-16 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
} 