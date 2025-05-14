'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MOCK_ACTIVITIES } from '../collection/components/mock-data';
import {
    Collection,
    Activity,
    ApiCollectionResponse,
} from '../collections/components/types';
import { collectionsApi } from '@/api-client';

// Import the components
import { CollectionHeader } from '../collections/components/collection-header';
import { CollectionFilters } from '../collections/components/collection-filters';
import { EmptyCollections } from '../collections/components/empty-collections';
import { CollectionGridItem } from '../collections/components/collection-grid-item';
import { CollectionListItem } from '../collections/components/collection-list-item';
import { CollectionPreviewDialog } from '../collections/components/collection-preview-dialog';

export default function MyCollectionsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [collections, setCollections] = useState<Collection[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCollection, setSelectedCollection] =
        useState<Collection | null>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [viewMode, setViewMode] = useState('grid');
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 100,
        totalPages: 0,
        totalElements: 0,
        hasNext: false,
        hasPrevious: false,
    });

    // Fetch collections when component mounts
    useEffect(() => {
        fetchMyCollections();
    }, []);

    // Fetch user's collections from API
    const fetchMyCollections = async (page = 1, size = 100) => {
        setIsLoading(true);
        setError(null);
        try {
            // Pass the search query to the API
            const response = await collectionsApi.getMyCollections({
                page,
                size,
                query: searchQuery
            });

            console.log('Raw API Response:', response);

            if (!response || !response.data) {
                throw new Error('Không nhận được dữ liệu từ API');
            }

            let processedData;
            if (typeof response.data === 'string') {
                try {
                    const cleanedData = response.data.trim();
                    processedData = JSON.parse(cleanedData);
                    console.log('Parsed data:', processedData);
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    console.log('Problematic JSON string:', response.data);
                    throw new Error('Dữ liệu JSON không hợp lệ từ API');
                }
            } else {
                processedData = response.data;
            }

            if (processedData?.success && processedData?.data?.content) {
                const apiResponse = processedData as ApiCollectionResponse;

                const collectionsData = apiResponse.data.content;
                setCollections(collectionsData);

                setPagination({
                    currentPage: apiResponse.data.meta.currentPage,
                    pageSize: apiResponse.data.meta.pageSize,
                    totalPages: apiResponse.data.meta.totalPages,
                    totalElements: apiResponse.data.meta.totalElements,
                    hasNext: apiResponse.data.meta.hasNext,
                    hasPrevious: apiResponse.data.meta.hasPrevious,
                });

                console.log('Processed API Response:', apiResponse);
            } else {
                console.error('Cấu trúc dữ liệu không đúng:', processedData);
                setCollections([]);
                setError('Định dạng dữ liệu không đúng từ API. Vui lòng thử lại sau.');
            }
        } catch (err) {
            console.error('Lỗi khi lấy danh sách collections:', err);
            setError('Không thể tải danh sách collections của bạn. Vui lòng thử lại sau.');
            setCollections([]);
            toast({
                title: 'Lỗi',
                description:
                    typeof err === 'object' && err !== null && 'message' in err
                        ? String((err as Error).message)
                        : 'Không thể tải danh sách collections của bạn.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Effect to search when searchQuery changes (with debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMyCollections(pagination.currentPage, pagination.pageSize);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // We can still have local filtering as a fallback, but the primary search should be done by the API
    const filteredCollections = Array.isArray(collections)
        ? collections
        : [];

    // Get activities for a specific collection
    const getCollectionActivities = (collectionId: string): Activity[] => {
        // TODO: Replace with API call to get activities when available
        return MOCK_ACTIVITIES.filter(
            (activity) => activity.collection_id === collectionId
        );
    };

    const handleCreateCollection = () => {
        router.push('/collections/create');
    };

    const handleEditCollection = (id: string) => {
        router.push(`/collection?collectionId=${id}`);
    };

    const handleViewActivities = (id: string) => {
        router.push(`/collection?collectionId=${id}`);
    };

    const handleDeleteCollection = async (id: string) => {
        try {
            const response = await collectionsApi.deleteCollection(id);

            console.log('Delete response:', response);

            let responseData;
            if (typeof response.data === 'string') {
                try {
                    responseData = JSON.parse(response.data.trim());
                } catch (parseError) {
                    console.error('JSON Parse Error on delete:', parseError);
                    throw new Error('Dữ liệu JSON không hợp lệ từ API khi xóa');
                }
            } else {
                responseData = response.data;
            }

            if (responseData?.success) {
                setCollections(
                    collections.filter((collection) => collection.id !== id)
                );
                toast({
                    title: 'Đã xóa',
                    description: 'Collection đã được xóa thành công.',
                    variant: 'default',
                });
            } else {
                throw new Error('API trả về thành công nhưng không có dữ liệu success');
            }
        } catch (err) {
            console.error('Lỗi khi xóa collection:', err);
            toast({
                title: 'Lỗi',
                description:
                    typeof err === 'object' && err !== null && 'message' in err
                        ? String((err as Error).message)
                        : 'Không thể xóa collection. Vui lòng thử lại sau.',
                variant: 'destructive',
            });
        }
    };

    const handlePreviewCollection = async (collection: Collection) => {
        setSelectedCollection(collection);
        setPreviewOpen(true);
    };

    const handlePreviewActivity = (activityId: string) => {
        router.push(`/activity/${activityId}`);
    };

    const collectionVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.3,
            },
        }),
    };

    // Get activities for the selected collection preview
    const selectedCollectionActivities = selectedCollection
        ? getCollectionActivities(selectedCollection.id)
        : [];

    console.log('My Collections data:', collections);
    console.log('Pagination:', pagination);

    return (
        <div className="flex justify-center">
            <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                {/* Header Section */}
                <CollectionHeader
                    onCreateCollection={handleCreateCollection}
                    title="My Collections"
                />

                {/* Filters Section */}
                <CollectionFilters
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                {/* Loading state */}
                {isLoading && (
                    <div className="flex items-center justify-center py-32">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                    </div>
                )}

                {/* Error state */}
                {!isLoading && error && (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-16 w-16 text-red-500 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h3 className="text-xl font-semibold mb-2">Đã xảy ra lỗi</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 mb-4">{error}</p>
                        <button
                            onClick={() => fetchMyCollections()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Collections Display */}
                {!isLoading && !error && filteredCollections?.length === 0 ? (
                    <EmptyCollections
                        searchQuery={searchQuery}
                        onCreateCollection={handleCreateCollection}
                    />
                ) : (
                    !isLoading &&
                    !error && (
                        <>
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredCollections.map((collection, i) => (
                                        <CollectionGridItem
                                            key={collection.id}
                                            collection={collection}
                                            index={i}
                                            activities={getCollectionActivities(collection.id)}
                                            onEdit={handleEditCollection}
                                            onDelete={handleDeleteCollection}
                                            onView={handleViewActivities}
                                            onPreview={handlePreviewCollection}
                                            collectionVariants={collectionVariants}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredCollections.map((collection, i) => (
                                        <CollectionListItem
                                            key={collection.id}
                                            collection={collection}
                                            index={i}
                                            activities={getCollectionActivities(collection.id)}
                                            onEdit={handleEditCollection}
                                            onDelete={handleDeleteCollection}
                                            onView={handleViewActivities}
                                            onPreview={handlePreviewCollection}
                                            collectionVariants={collectionVariants}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Pagination UI */}
                            {pagination.totalPages > 1 && (
                                <div className="flex justify-center mt-8">
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() =>
                                                fetchMyCollections(
                                                    pagination.currentPage - 1,
                                                    pagination.pageSize
                                                )
                                            }
                                            disabled={!pagination.hasPrevious}
                                            className={`px-4 py-2 rounded-md ${!pagination.hasPrevious
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                }`}
                                        >
                                            Trang trước
                                        </button>
                                        <div className="px-4 py-2 bg-gray-100 rounded-md">
                                            Trang {pagination.currentPage} / {pagination.totalPages}
                                        </div>
                                        <button
                                            onClick={() =>
                                                fetchMyCollections(
                                                    pagination.currentPage + 1,
                                                    pagination.pageSize
                                                )
                                            }
                                            disabled={!pagination.hasNext}
                                            className={`px-4 py-2 rounded-md ${!pagination.hasNext
                                                ? 'bg-gray-300 cursor-not-allowed'
                                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                }`}
                                        >
                                            Trang sau
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )
                )}

                {/* Collection Preview Dialog */}
                <CollectionPreviewDialog
                    open={previewOpen}
                    onOpenChange={setPreviewOpen}
                    selectedCollection={selectedCollection}
                    activities={selectedCollectionActivities}
                    onViewActivities={handleViewActivities}
                    onEditCollection={handleEditCollection}
                    onPreviewActivity={handlePreviewActivity}
                />
            </div>
        </div>
    );
} 