'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
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
import { JoinSessionBanner } from './components/join-session-banner';
import { Button } from '@/components/ui/button';

export default function PublishedCollectionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [collectionsByTopic, setCollectionsByTopic] = useState<Record<string, Collection[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalPages: 0,
    totalElements: 0,
    hasNext: false,
    hasPrevious: false,
  });

  // Add refs for each topic carousel
  const carouselRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll functions for the carousel
  const scrollCarousel = (topicId: string, direction: 'left' | 'right') => {
    const container = carouselRefs.current.get(topicId);
    if (!container) return;

    const scrollAmount = 600; // Scroll by approximately 2 cards at once
    const scrollPosition = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchTopics();
    fetchGroupedCollections();
  }, []);

  // Fetch topics from API
  const fetchTopics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await collectionsApi.getCollectionTopics();
      if (response?.data?.success && Array.isArray(response.data.data)) {
        setTopics(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
      setError('Could not load topics. Please try again later.');
      toast({
        title: 'Error',
        description: 'Could not load topics.',
        variant: 'destructive',
      });
    }
  };

  // Fetch collections grouped by topic
  const fetchGroupedCollections = async (page = 1, size = 10) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await collectionsApi.getGroupedCollectionsByTopic({
        page,
        size
      });

      if (response?.data?.success && response.data.data) {
        setCollectionsByTopic(response.data.data);

        // Extract all collections for search functionality
        const allCollections: Collection[] = [];
        Object.values(response.data.data).forEach((topicCollections: any) => {
          if (Array.isArray(topicCollections)) {
            topicCollections.forEach(collection => {
              allCollections.push({
                ...collection,
                id: collection.collectionId || collection.id,
              });
            });
          }
        });

        setCollections(allCollections);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Error fetching collections by topic:', err);
      setError('Could not load collections. Please try again later.');
      toast({
        title: 'Error',
        description: 'Could not load collections.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const getCollectionActivities = (collectionId: string): Activity[] => {
    // Return empty array for now as we don't have actual activities data yet
    return [];
  };

  const handleCreateCollection = () => {
    router.push('/collections/create');
  };

  const handleEditCollection = (id: string) => {
    router.push(`/collection?collectionId=${id}`);
  };

  const handleViewActivities = (id: string) => {
    router.push(`/collections/${id}`);
  };

  // Filter collections by search query
  const filteredCollections = searchQuery
    ? collections.filter(collection =>
      collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (collection.description && collection.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    : collections;

  // Handle topic change
  const handleTopicChange = (topic: string) => {
    setSelectedTopic(topic);
  };

  // Group by topic
  const groupedCollections = () => {
    if (searchQuery) {
      // If searching, just return filtered collections in a single group
      return {
        "Search Results": filteredCollections
      };
    }

    if (selectedTopic) {
      // If a topic is selected, only return collections for that topic
      return {
        [selectedTopic]: collectionsByTopic[selectedTopic] || []
      };
    }

    return collectionsByTopic;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Search and View Mode Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
          Collections
        </h1>

        <div className="flex items-center gap-4">
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-8 pr-4 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div className="flex items-center space-x-2 border rounded-lg overflow-hidden">
            <button
              className={`flex items-center justify-center w-10 h-10 ${viewMode === 'grid' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}
              onClick={() => setViewMode('grid')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              className={`flex items-center justify-center w-10 h-10 ${viewMode === 'list' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'}`}
              onClick={() => setViewMode('list')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Topic Filters */}
      <div className="mb-8">
        <CollectionFilters
          topics={topics}
          selectedTopic={selectedTopic}
          onTopicChange={handleTopicChange}
        />
      </div>

      {/* Join Session Banner */}
      <JoinSessionBanner />

      {/* Collection Content */}
      <div className="mt-10">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500 mb-4">{error}</p>
            <Button
              onClick={() => {
                fetchTopics();
                fetchGroupedCollections();
              }}
            >
              Try Again
            </Button>
          </div>
        ) : Object.keys(groupedCollections()).length === 0 ? (
          <EmptyCollections onCreateCollection={handleCreateCollection} searchQuery={searchQuery} />
        ) : (
          <div className="space-y-12">
            {Object.entries(groupedCollections()).map(([topic, topicCollections]) => (
              <section key={topic} className="mb-10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">{topic}</h2>
                  {topicCollections.length > 3 && (
                    <div className="flex space-x-2">
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                        onClick={() => scrollCarousel(topic, 'left')}
                      >
                        <span className="sr-only">Scroll left</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                        onClick={() => scrollCarousel(topic, 'right')}
                      >
                        <span className="sr-only">Scroll right</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {viewMode === 'grid' ? (
                  <div
                    className="flex overflow-x-auto pb-4 space-x-4 hide-scrollbar"
                    ref={el => el && carouselRefs.current.set(topic, el)}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {topicCollections.map(collection => (
                      <div key={collection.collectionId} className="flex-none w-[300px]">
                        <CollectionGridItem
                          collection={collection}
                          activities={getCollectionActivities(collection.collectionId)}
                          onView={() => handleViewActivities(collection.collectionId)}
                          onEdit={() => handleEditCollection(collection.collectionId)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {topicCollections.map(collection => (
                      <CollectionListItem
                        key={collection.collectionId}
                        collection={collection}
                        activities={getCollectionActivities(collection.collectionId)}
                        onView={() => handleViewActivities(collection.collectionId)}
                        onEdit={() => handleEditCollection(collection.collectionId)}
                      />
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>

      {/* CSS for hiding scrollbar */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
