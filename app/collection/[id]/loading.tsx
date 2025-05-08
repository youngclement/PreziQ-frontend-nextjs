export default function CollectionLoading() {
    return (
        <div className="container max-w-7xl mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                <p className="mt-4 text-muted-foreground">Loading collection...</p>
            </div>
        </div>
    );
} 