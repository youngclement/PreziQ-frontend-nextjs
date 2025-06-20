'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Collection,
  Activity,
  ApiCollectionResponse,
} from '../collections/components/types';
import { collectionsApi } from '@/api-client';
import ClientOnly from '@/components/ClientOnly';
import Loading from '@/components/common/loading';

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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 12,
    totalPages: 0,
    totalElements: 0,
    hasNext: false,
    hasPrevious: false,
  });
  const [selectedTopic, setSelectedTopic] = useState('');

  // Fetch collections when component mounts
  useEffect(() => {
    fetchMyCollections();
  }, []);

  // Fetch user's collections from API
  const fetchMyCollections = async (page = 1, size = 12) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await collectionsApi.getMyCollections({
        page,
        size,
        query: searchQuery,
      });

      if (!response || !response.data) {
        throw new Error('Không nhận được dữ liệu từ API');
      }

      let processedData;
      if (typeof response.data === 'string') {
        try {
          const cleanedData = response.data.trim();
          processedData = JSON.parse(cleanedData);
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
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
      } else {
        setCollections([]);
        throw new Error('Định dạng dữ liệu không đúng từ API');
      }
    } catch (err) {
      console.error('Lỗi khi lấy danh sách collections:', err);
      setError(
        'Không thể tải danh sách bộ sưu tập của bạn. Vui lòng thử lại sau.'
      );
      toast({
        title: 'Lỗi',
        description:
          err instanceof Error
            ? err.message
            : 'Không thể tải danh sách bộ sưu tập của bạn.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to search when searchQuery changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMyCollections(1, pagination.pageSize);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle view activities
  const handleViewActivities = (id: string) => {
    router.push(`/collections/${id}/activities`);
  };

  // Handle preview activity
  const handlePreviewActivity = (id: string) => {
    // Implementation for previewing an activity
    console.log('Previewing activity:', id);
  };

  // Filter collections by search query
  const filteredCollections = collections.filter((collection) =>
    searchQuery
      ? collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (collection.description &&
          collection.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()))
      : true
  );

  // Handle actions
  const handleCreateCollection = () => {
    router.push('/collections/create');
  };

  const handleEditCollection = (id: string) => {
    router.push(`/collections/edit/${id}`);
  };

  const handleViewCollection = (id: string) => {
    router.push(`/collection?collectionId=${id}`);
  };

  const handleDeleteCollection = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bộ sưu tập này?')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await collectionsApi.deleteCollection(id);

      if (response?.data?.success) {
        setCollections((prev) =>
          prev.filter((c) => c.id !== id && c.collectionId !== id)
        );

        toast({
          title: 'Thành công',
          description: 'Đã xóa bộ sưu tập thành công.',
          variant: 'default',
        });
      } else {
        throw new Error(response?.data?.message || 'Có lỗi xảy ra khi xóa');
      }
    } catch (err) {
      console.error('Error deleting collection:', err);
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa bộ sưu tập. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Modify your handleTogglePublish function to stop event propagation
  const handleTogglePublish = async (
    collection: Collection,
    event?: React.MouseEvent
  ) => {
    // Ensure we stop default behavior and propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    try {
      // Don't set isLoading true here as it's causing a page refresh
      // setIsLoading(true);

      const newPublishState = !collection.isPublished;
      const collectionId = collection.collectionId || collection.id;

      // Update UI first to make it feel responsive
      setCollections((prev) =>
        prev.map((c) =>
          c.collectionId === collectionId || c.id === collectionId
            ? { ...c, isPublished: newPublishState }
            : c
        )
      );

      // Then make the API call
      const response = await collectionsApi.updateCollection(collectionId, {
        isPublished: newPublishState,
      });

      if (!response?.data?.success) {
        // If the API call failed, revert the UI change
        setCollections((prev) =>
          prev.map((c) =>
            c.collectionId === collectionId || c.id === collectionId
              ? { ...c, isPublished: !newPublishState }
              : c
          )
        );
        throw new Error(
          response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái'
        );
      }

      toast({
        title: newPublishState ? 'Đã xuất bản' : 'Đã hủy xuất bản',
        description: newPublishState
          ? 'Bộ sưu tập của bạn đã được xuất bản thành công.'
          : 'Bộ sưu tập của bạn đã được chuyển sang chế độ riêng tư.',
        variant: 'default',
      });
    } catch (err) {
      console.error('Error toggling publish state:', err);
      toast({
        title: 'Lỗi',
        description:
          'Không thể cập nhật trạng thái xuất bản. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    }
    // Don't use finally with setIsLoading(false) as it might cause a refresh
  };

  return (
    <ClientOnly>
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        <CollectionHeader
          title='Bộ sưu tập của tôi'
          description='Quản lý và chỉnh sửa các bộ sưu tập của bạn'
          onCreateCollection={handleCreateCollection}
          searchQuery={searchQuery}
          onSearch={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <CollectionFilters
          selectedTopic={selectedTopic}
          onTopicChange={setSelectedTopic}
        />

        {isLoading ? (
          <div className='flex justify-center items-center h-64'>
            <Loading />
          </div>
        ) : error ? (
          <div className='text-center py-12'>
            <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md'>
              <h3 className='text-xl font-semibold mb-2'>Đã xảy ra lỗi</h3>
              <p className='text-zinc-500 dark:text-zinc-400 mb-4'>{error}</p>
              <button
                onClick={() => fetchMyCollections()}
                className='relative flex button-group text-sm leading-5 touch-manipulation cursor-pointer font-bold text-black h-10 px-6'
                style={{ borderRadius: 0 }}
              >
                <div
                  className='-inset-1 absolute z-0'
                  style={{ borderRadius: '2.875rem' }}
                ></div>
                <div
                  className='absolute inset-x-0 top-0 bottom-0 transform button-group-active:translate-y-0.5 button-group-active:bottom-0.5 z-1 bg-black'
                  style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
                >
                  <div className='relative w-full h-full'>
                    <div
                      className='top-1 absolute inset-x-0 bottom-0 overflow-hidden'
                      style={{
                        backgroundColor: '#6FEEFF',
                        borderRadius: '2.8125rem',
                      }}
                    >
                      <div className='bg-opacity-30 absolute inset-0 bg-black'></div>
                    </div>
                    <div
                      className='bottom-1 absolute inset-x-0 top-0 overflow-hidden button-group-active:bottom-0.5'
                      style={{
                        backgroundColor: '#6FEEFF',
                        borderRadius: '2.8125rem',
                      }}
                    >
                      <div className='button-group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0'></div>
                    </div>
                  </div>
                </div>
                <div
                  className='relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 button-group-active:translate-y-0'
                  style={{ padding: '0.25rem' }}
                >
                  <div className='flex flex-col flex-1 items-center'>
                    <div className='relative'>
                      <div className='relative flex items-center justify-center'>
                        THỬ LẠI
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <>
            {filteredCollections.length === 0 ? (
              <EmptyCollections
                searchQuery={searchQuery}
                onCreateCollection={handleCreateCollection}
              />
            ) : (
              <div className='mt-8'>
                {viewMode === 'grid' ? (
                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                    {filteredCollections.map((collection) => (
                      <CollectionGridItem
                        key={collection.id}
                        collection={collection}
                        activities={[]}
                        onEdit={() =>
                          handleEditCollection(collection.collectionId)
                        }
                        onView={() =>
                          handleViewCollection(collection.collectionId)
                        }
                        onDelete={() =>
                          handleDeleteCollection(collection.collectionId)
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {filteredCollections.map((collection) => (
                      <CollectionListItem
                        key={collection.id}
                        collection={collection}
                        onEdit={() =>
                          handleEditCollection(collection.collectionId)
                        }
                        onView={() =>
                          handleViewCollection(collection.collectionId)
                        }
                        onDelete={() =>
                          handleDeleteCollection(collection.collectionId)
                        }
                        onTogglePublish={() => handleTogglePublish(collection)}
                        showPublishToggle={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className='flex justify-center mt-8'>
                <div className='flex space-x-4'>
                  <button
                    onClick={() =>
                      fetchMyCollections(
                        pagination.currentPage - 1,
                        pagination.pageSize
                      )
                    }
                    disabled={!pagination.hasPrevious}
                    className={`relative flex button-group text-sm leading-5 touch-manipulation cursor-pointer font-bold ${
                      !pagination.hasPrevious
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    } text-black h-10 px-6`}
                    style={{ borderRadius: 0 }}
                  >
                    <div
                      className='-inset-1 absolute z-0'
                      style={{ borderRadius: '2.875rem' }}
                    ></div>
                    <div
                      className='absolute inset-x-0 top-0 bottom-0 transform button-group-active:translate-y-0.5 button-group-active:bottom-0.5 z-1 bg-black'
                      style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
                    >
                      <div className='relative w-full h-full'>
                        <div
                          className='top-1 absolute inset-x-0 bottom-0 overflow-hidden'
                          style={{
                            backgroundColor: '#6FEEFF',
                            borderRadius: '2.8125rem',
                          }}
                        >
                          <div className='bg-opacity-30 absolute inset-0 bg-black'></div>
                        </div>
                        <div
                          className='bottom-1 absolute inset-x-0 top-0 overflow-hidden button-group-active:bottom-0.5'
                          style={{
                            backgroundColor: '#6FEEFF',
                            borderRadius: '2.8125rem',
                          }}
                        >
                          <div className='button-group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0'></div>
                        </div>
                      </div>
                    </div>
                    <div
                      className='relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 button-group-active:translate-y-0'
                      style={{ padding: '0.25rem' }}
                    >
                      <div className='flex flex-col flex-1 items-center'>
                        <div className='relative'>
                          <div className='relative flex items-center justify-center'>
                            TRƯỚC
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>

                  <div className='flex items-center justify-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-sm'>
                    <span className='text-sm font-medium'>
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      fetchMyCollections(
                        pagination.currentPage + 1,
                        pagination.pageSize
                      )
                    }
                    disabled={!pagination.hasNext}
                    className={`relative flex button-group text-sm leading-5 touch-manipulation cursor-pointer font-bold ${
                      !pagination.hasNext ? 'opacity-50 cursor-not-allowed' : ''
                    } text-black h-10 px-6`}
                    style={{ borderRadius: 0 }}
                  >
                    <div
                      className='-inset-1 absolute z-0'
                      style={{ borderRadius: '2.875rem' }}
                    ></div>
                    <div
                      className='absolute inset-x-0 top-0 bottom-0 transform button-group-active:translate-y-0.5 button-group-active:bottom-0.5 z-1 bg-black'
                      style={{ borderRadius: '3.125rem', padding: '0.25rem' }}
                    >
                      <div className='relative w-full h-full'>
                        <div
                          className='top-1 absolute inset-x-0 bottom-0 overflow-hidden'
                          style={{
                            backgroundColor: '#00a76d',
                            borderRadius: '2.8125rem',
                          }}
                        >
                          <div className='bg-opacity-30 absolute inset-0 bg-black'></div>
                        </div>
                        <div
                          className='bottom-1 absolute inset-x-0 top-0 overflow-hidden button-group-active:bottom-0.5'
                          style={{
                            backgroundColor: '#00a76d',
                            borderRadius: '2.8125rem',
                          }}
                        >
                          <div className='button-group-hover:bg-opacity-20 bg-fff absolute inset-0 bg-opacity-0'></div>
                        </div>
                      </div>
                    </div>
                    <div
                      className='relative flex flex-row gap-x-4 items-center justify-center w-full min-h-full pointer-events-none z-2 transform -translate-y-0.5 button-group-active:translate-y-0'
                      style={{ padding: '0.25rem' }}
                    >
                      <div className='flex flex-col flex-1 items-center'>
                        <div className='relative'>
                          <div className='relative flex items-center justify-center'>
                            SAU
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Preview Dialog */}
        <CollectionPreviewDialog
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          selectedCollection={selectedCollection}
          activities={activities}
          onViewActivities={handleViewActivities}
          onEditCollection={handleEditCollection}
          onPreviewActivity={handlePreviewActivity}
        />
      </div>
    </ClientOnly>
  );
}
