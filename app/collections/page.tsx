'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MOCK_ACTIVITIES } from '../collection/components/mock-data';
import {
  Collection,
  Activity,
  ApiCollectionResponse,
} from './components/types';
import { collectionsApi } from '@/api-client';

// Import các component đã tách
import { CollectionHeader } from './components/collection-header';
import { CollectionFilters } from './components/collection-filters';
import { EmptyCollections } from './components/empty-collections';
import { CollectionGridItem } from './components/collection-grid-item';
import { CollectionListItem } from './components/collection-list-item';
import { CollectionPreviewDialog } from './components/collection-preview-dialog';

export default function PublishedCollectionsPage() {
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

  // Fetch published collections when component mounts
  useEffect(() => {
    fetchPublishedCollections();
  }, []);

  // Fetch published collections from API
  const fetchPublishedCollections = async (page = 1, size = 100) => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the query parameter approach for filtering published collections
      const response = await collectionsApi.getPublishedCollections({
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

        // Get collections list from the API response
        const collectionsData = apiResponse.data.content;

        // Handle invalid dates in the collections data
        const sanitizedCollections = collectionsData.map(collection => ({
          ...collection,
          // Ensure createdAt and updatedAt are valid dates or null
          createdAt: validateDateTime(collection.createdAt),
          updatedAt: validateDateTime(collection.updatedAt)
        }));

        setCollections(sanitizedCollections);

        // Update pagination info
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
      setError('Không thể tải danh sách collections. Vui lòng thử lại sau.');
      setCollections([]);
      toast({
        title: 'Lỗi',
        description:
          typeof err === 'object' && err !== null && 'message' in err
            ? String((err as Error).message)
            : 'Không thể tải danh sách collections.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to validate datetime strings
  const validateDateTime = (dateTimeString?: string): string | undefined => {
    if (!dateTimeString) return undefined;

    // Try to create a valid Date object
    const date = new Date(dateTimeString);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date detected:', dateTimeString);
      return undefined;
    }

    return dateTimeString;
  };

  // Effect to search when searchQuery changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPublishedCollections(pagination.currentPage, pagination.pageSize);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // We can still have local filtering as a fallback, but the primary search should be done by the API
  const filteredCollections = Array.isArray(collections)
    ? collections
    : [];

  // Get activities for a specific collection
  const getCollectionActivities = (collectionId: string): Activity[] => {
    // TODO: Replace with actual API call when available
    return MOCK_ACTIVITIES.filter(
      (activity) => activity.collection_id === collectionId
    );
  };

  const handleCreateCollection = () => {
    router.push('/collection/create');
  };

  const handleEditCollection = (id: string) => {
    router.push(`/collection/edit/${id}`);
  };

  const handleViewActivities = (id: string) => {
    router.push(`/collection?collectionId=${id}`);
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

  console.log('Published Collections data:', collections);
  console.log('Pagination:', pagination);

  return (
    <div className="flex justify-center">
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        {/* Header Section */}
        <CollectionHeader
          onCreateCollection={handleCreateCollection}
          title="Published Collections"
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
              onClick={() => fetchPublishedCollections()}
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
                      onDelete={() => { }} // Published collections shouldn't be deleted directly
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
                      onDelete={() => { }} // Published collections shouldn't be deleted directly
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
                        fetchPublishedCollections(
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
                        fetchPublishedCollections(
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
