'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { MOCK_ACTIVITIES } from '../collection/components/mock-data';
import {
  Collection,
  Activity,
  ApiCollectionResponse,
  Category,
} from './components/types';
import { collectionsApi } from '@/api-client';

// Import các component đã tách
import { CollectionHeader } from './components/collection-header';
import { CollectionFilters } from './components/collection-filters';
import { EmptyCollections } from './components/empty-collections';
import { CollectionGridItem } from './components/collection-grid-item';
import { CollectionListItem } from './components/collection-list-item';
import { CollectionPreviewDialog } from './components/collection-preview-dialog';
import { Button } from '@/components/ui/button';

export default function PublishedCollectionsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

  // Add refs for each category carousel
  const carouselRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Scroll functions for the carousel
  const scrollCarousel = (categoryId: string, direction: 'left' | 'right') => {
    const container = carouselRefs.current.get(categoryId);
    if (!container) return;

    const scrollAmount = 320; // Width of a card plus gap
    const scrollPosition = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    });
  };

  // Fetch published collections when component mounts
  useEffect(() => {
    fetchPublishedCollections();
  }, []);

  // Fetch published collections from API first, then add mock data
  const fetchPublishedCollections = async (page = 1, size = 100) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get real collections from API first
      try {
        const response = await collectionsApi.getPublishedCollections({
          page,
          size,
          query: searchQuery
        });

        console.log('Raw API Response:', response);

        if (response && response.data) {
          let processedData;
          if (typeof response.data === 'string') {
            try {
              const cleanedData = response.data.trim();
              processedData = JSON.parse(cleanedData);
            } catch (parseError) {
              console.error('JSON Parse Error:', parseError);
              console.log('Problematic JSON string:', response.data);
            }
          } else {
            processedData = response.data;
          }

          if (processedData?.success && processedData?.data?.content) {
            const apiResponse = processedData;
            const realCollections = apiResponse.data.content;

            // Create sanitized collections from API data
            const apiCollections = realCollections.map((collection: any) => {
              return {
                ...collection,
                // Make sure IDs are set properly
                id: collection.id || collection.collectionId || `api-coll-${Math.random().toString(36).substring(7)}`,
                collectionId: collection.collectionId || collection.id || `api-coll-${Math.random().toString(36).substring(7)}`
              };
            });

            // Now generate mock categories and collections
            const mockCategories = generateMockCategories();
            const mockCollections = generateMockCollections(mockCategories);

            // Combine API collections with mock collections
            // API collections will be at the top
            setCollections([...apiCollections, ...mockCollections]);

            // Set categories
            setCategories(mockCategories);

            // Set pagination (from API if available, otherwise mock)
            setPagination({
              currentPage: apiResponse.data.meta?.currentPage || page,
              pageSize: apiResponse.data.meta?.pageSize || size,
              totalPages: apiResponse.data.meta?.totalPages || 3,
              totalElements: apiResponse.data.meta?.totalElements || 120,
              hasNext: apiResponse.data.meta?.hasNext || page < 3,
              hasPrevious: apiResponse.data.meta?.hasPrevious || page > 1,
            });

            setIsLoading(false);
            return;
          }
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // If API call fails, we'll just use mock data
      }

      // If we reach here, the API call failed or returned invalid data
      // Generate mock categories and collections
      const mockCategories = generateMockCategories();
      const mockCollections = generateMockCollections(mockCategories);

      setCategories(mockCategories);
      setCollections(mockCollections);

      // Set mock pagination
      setPagination({
        currentPage: page,
        pageSize: size,
        totalPages: 3,
        totalElements: 120,
        hasNext: page < 3,
        hasPrevious: page > 1,
      });

    } catch (err) {
      console.error('Lỗi khi lấy danh sách collections:', err);
      setError('Không thể tải danh sách collections. Vui lòng thử lại sau.');
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách collections.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock categories
  const generateMockCategories = () => {
    return [
      { id: 'cat1', name: 'Trending Collections', description: 'The most popular and well-used collections', orderIndex: 1 },
      { id: 'cat2', name: 'Communication Skills', description: 'Improve your presentation and public speaking', orderIndex: 2 },
      { id: 'cat3', name: 'Business & Management', description: 'Leadership development and team building', orderIndex: 3 },
      { id: 'cat4', name: 'Computer Science', description: 'Programming, algorithms and data science', orderIndex: 4 },
      { id: 'cat5', name: 'Language Learning', description: 'Learning new languages efficiently', orderIndex: 5 },
      { id: 'cat6', name: 'Mathematics', description: 'Numbers, formulas, and problem solving', orderIndex: 6 },
      { id: 'cat7', name: 'Art & Design', description: 'Creative arts and visual design principles', orderIndex: 7 },
      { id: 'cat8', name: 'Health & Wellness', description: 'Mental and physical wellbeing techniques', orderIndex: 8 },
      { id: 'cat9', name: 'Music & Audio', description: 'Sound production, music theory and audio engineering', orderIndex: 9 },
      { id: 'cat10', name: 'Photography & Film', description: 'Visual storytelling and camera techniques', orderIndex: 10 },
      { id: 'cat11', name: 'Marketing & Advertising', description: 'Promotional strategies and brand building', orderIndex: 11 },
      { id: 'cat12', name: 'Education & Teaching', description: 'Effective teaching methods and curriculum design', orderIndex: 12 },
    ];
  };

  // Generate mock collections
  const generateMockCollections = (mockCategories: Category[]) => {
    const mockImages = [
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1608403890284-86660c14c4e1?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1596496181871-9681eacf9764?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1589652717521-10c0d092dea9?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1568992687947-868a62a9f521?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1564410267841-915d8e4d71ea?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544717305-2782549b5136?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1598520106830-8c45c2035460?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1587691592099-24045742c181?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?q=80&w=500&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533228876829-65c94e7b5025?q=80&w=500&auto=format&fit=crop'
    ];

    const mockTitles = [
      "Effective Presentation Skills",
      "Python Programming Basics",
      "Team Leadership Essentials",
      "Data Science with R",
      "Public Speaking Mastery",
      "Web Development Bootcamp",
      "Marketing Fundamentals",
      "Graphic Design Principles",
      "Financial Literacy",
      "Mobile App Development",
      "Creative Writing Workshop",
      "Business Ethics",
      "Environmental Science",
      "Digital Marketing Strategy",
      "Professional Networking",
      "Personal Productivity",
      "Project Management",
      "UI/UX Design Fundamentals",
      "Photography Basics",
      "Video Editing Techniques",
      "Machine Learning Introduction",
      "French Language Starter",
      "Spanish for Beginners",
      "Mental Health Awareness",
      "Fitness and Nutrition",
      "Stock Market Investing",
      "Blockchain Technology",
      "Artificial Intelligence Ethics",
      "Content Creation Strategy",
      "Social Media Marketing",
      "Email Marketing Techniques",
      "Remote Team Management",
      "Cloud Computing Basics",
      "Cybersecurity Introduction",
      "First Aid Essentials",
      "Psychology of Learning",
      "Music Theory Basics",
      "Guitar for Beginners",
      "Interior Design Fundamentals",
      "Sustainable Living"
    ];

    const mockDescriptions = [
      "Learn how to create and deliver compelling presentations that engage your audience",
      "Master the basics of Python programming with hands-on exercises and projects",
      "Develop essential leadership skills to guide your team to success",
      "Explore data analysis techniques using R programming language",
      "Overcome fear of public speaking and captivate your audience",
      "Build responsive websites using modern web technologies",
      "Understand core marketing concepts and strategies",
      "Learn visual design principles and techniques for effective communication",
      "Build financial knowledge for personal and professional growth",
      "Create mobile applications for iOS and Android platforms",
      "Develop your creative writing skills across different genres",
      "Explore ethical considerations in business decision-making",
      "Study environmental systems and sustainability practices",
      "Build effective digital marketing strategies for online success",
      "Build and maintain professional relationships effectively",
      "Improve personal productivity and time management",
      "Learn project management methodologies and tools",
      "Design user-friendly interfaces and experiences",
      "Master the fundamentals of photography and camera settings",
      "Learn professional video editing techniques and software",
      "Understand the basics of machine learning algorithms and applications",
      "Get started with French vocabulary, grammar, and pronunciation",
      "Learn essential Spanish for everyday conversations",
      "Understand mental health issues and develop coping strategies",
      "Build a balanced approach to nutrition and exercise",
      "Learn investment strategies for the stock market",
      "Understand blockchain technology and its applications",
      "Explore ethical considerations in AI development",
      "Develop strategies for creating engaging content",
      "Learn how to effectively market on social media platforms",
      "Master email campaign creation and optimization",
      "Build skills for managing remote and distributed teams",
      "Understand cloud platforms and their business applications",
      "Learn about cybersecurity threats and prevention",
      "Master essential first aid techniques and emergency response",
      "Understand how humans learn and retain information",
      "Learn fundamental music theory concepts",
      "Master basic guitar chords and techniques",
      "Learn principles of interior design and space planning",
      "Develop practices for environmentally conscious living"
    ];

    const mockCollections = [];
    // Generate collections - 120 collections
    for (let i = 1; i <= 120; i++) {
      const titleIndex = Math.floor(Math.random() * mockTitles.length);
      const title = mockTitles[titleIndex];
      const description = mockDescriptions[titleIndex];
      const imageIndex = Math.floor(Math.random() * mockImages.length);
      const categoryIndex = Math.floor(Math.random() * mockCategories.length);
      const activityCount = Math.floor(Math.random() * 20) + 1; // Up to 20 activities per collection

      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 120)); // Spread out over 4 months

      mockCollections.push({
        id: `mock-coll-${i}`,
        collectionId: `mock-coll-${i}`,
        title: `[MOCK] ${title}`,  // Add [MOCK] prefix to distinguish from real data
        description: description,
        coverImage: mockImages[imageIndex],
        isPublished: Math.random() > 0.15, // 85% are published
        createdAt: date.toISOString(),
        updatedAt: date.toISOString(),
        categoryId: mockCategories[categoryIndex].id,
        createdBy: Math.random() > 0.7 ? "User123" : Math.random() > 0.5 ? "Admin" : "Teacher",
        _activityCount: activityCount, // Used just for mock data
        views: Math.floor(Math.random() * 5000),
        likes: Math.floor(Math.random() * 1000),
        participants: Math.floor(Math.random() * 500)
      });
    }

    return mockCollections;
  };

  // Effect to search when searchQuery changes (with debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPublishedCollections(pagination.currentPage, pagination.pageSize);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Mock function to fetch categories only
  const fetchCategories = async () => {
    // Set mock categories
    setCategories(generateMockCategories());
  };

  // Local filtering as a fallback
  const filteredCollections = Array.isArray(collections)
    ? collections
    : [];

  // Group collections by category
  const getCollectionsByCategory = () => {
    const collectionsMap = new Map<string, Collection[]>();

    // Initialize with empty arrays for all categories
    categories.forEach(category => {
      collectionsMap.set(category.id, []);
    });

    // Add a category for collections with no category
    collectionsMap.set('uncategorized', []);

    // Group collections by categoryId
    filteredCollections.forEach(collection => {
      const categoryId = collection.categoryId || 'uncategorized';
      if (collectionsMap.has(categoryId)) {
        collectionsMap.get(categoryId)?.push(collection);
      } else {
        collectionsMap.set('uncategorized', [
          ...(collectionsMap.get('uncategorized') || []),
          collection
        ]);
      }
    });

    return collectionsMap;
  };

  // Get activities for a specific collection
  const getCollectionActivities = (collectionId: string): Activity[] => {
    // Find the collection
    const collection = collections.find(c => c.id === collectionId || c.collectionId === collectionId);

    // If we have mock activity count, generate that many mock activities
    if (collection && '_activityCount' in collection) {
      const count = collection._activityCount as number || 0;
      const mockActivities: Activity[] = [];

      const activityTypes = [
        "Quiz", "Poll", "Discussion", "Case Study", "Assignment",
        "Presentation", "Video", "Reading", "Exercise", "Game"
      ];

      for (let i = 0; i < count; i++) {
        const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        mockActivities.push({
          id: `act-${collectionId}-${i}`,
          collection_id: collectionId,
          title: `${activityType}: ${collection.title} - Part ${i + 1}`,
          description: `Interactive ${activityType.toLowerCase()} about ${collection.title} concepts and applications`,
          is_published: Math.random() > 0.2,
          created_at: collection.createdAt,
          updated_at: collection.updatedAt,
          duration: Math.floor(Math.random() * 30) + 5 // 5-35 minutes
        });
      }

      return mockActivities;
    }

    // Use mock activities as fallback
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

  // Get collections grouped by category
  const collectionsByCategory = getCollectionsByCategory();

  // Sort categories by orderIndex
  const sortedCategories = [...categories].sort((a, b) =>
    (a.orderIndex || 999) - (b.orderIndex || 999)
  );

  console.log('Published Collections data:', collections);
  console.log('Pagination:', pagination);

  return (
    <div className="flex justify-center font-nunito">
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5">


        {/* Custom Header Banner */}
        <div className="mb-12 relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10 opacity-20"></div>

          <div className="relative px-6 py-12 sm:px-10 md:py-16 lg:py-20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left max-w-xl">
                <h1 className="text-3xl sm:text-4xl font-black text-white mb-4 font-nunito">Discover Interactive Collections</h1>
                <p className="text-indigo-100 mb-6 font-nunito font-semibold">
                  Explore curated content designed to make learning engaging and effective through interactive experiences.
                </p>
                <Button
                  onClick={handleCreateCollection}
                  className="bg-white hover:bg-indigo-50 text-indigo-600 shadow-lg hover:shadow-xl transition-all rounded-full px-6 py-3 font-bold font-nunito"
                  size="lg"
                >
                  Create New Collection
                </Button>
              </div>

              {/* Game PIN Input Form */}
              <div className="rounded-xl bg-white dark:bg-black md:p-4 flex flex-col items-center justify-center w-full md:w-auto gap-2 p-4 overflow-hidden shadow-lg">
                <div className="justify-evenly flex flex-row items-center w-full px-2">
                  <div className="whitespace-nowrap flex flex-row items-center gap-4 font-nunito md:text-base lg:text-xl text-base font-black leading-tight tracking-normal text-black dark:text-white capitalize">
                    <div className="md:flex-row md:gap-2 flex flex-col items-center">
                      <div className="lg:block md:hidden block">Join game?</div>
                      <div className="lg:hidden md:block hidden">Join?</div>
                      <div className="lg:block md:hidden block">Enter PIN:</div>
                      <div className="lg:hidden md:block hidden">PIN:</div>
                    </div>
                    <form className="md:max-w-md justify-center w-full" action="#">
                      <input
                        className="focus:placeholder:text-transparent w-full my-auto font-black text-center rounded-full h-12 lg:h-14 text-base lg:text-xl bg-zinc-50 dark:bg-black shadow-inner border-zinc-300 dark:border-zinc-700 border-solid border-2 dark:text-white font-nunito"
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck="false"
                        placeholder="123ABC"
                        maxLength={6}
                        pattern="[0-9A-Za-z]{6}"
                        value=""
                      />
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Categories Quick Links */}
        <div className="mb-12 flex flex-wrap gap-2 justify-center">
          <h2 className="sr-only">Browse Categories</h2>
          {sortedCategories.map((category) => (
            <button
              key={category.id}
              className="px-4 py-2 bg-white dark:bg-black hover:bg-primary hover:text-white rounded-full text-sm font-bold transition-colors border border-zinc-200 dark:border-black font-nunito"
              onClick={() => document.getElementById(category.id)?.scrollIntoView({ behavior: 'smooth' })}
            >
              {category.name}
            </button>
          ))}
        </div>
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
            <h3 className="text-xl font-extrabold mb-2 font-nunito">Đã xảy ra lỗi</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4 font-nunito font-semibold">{error}</p>
            <button
              onClick={() => fetchPublishedCollections()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none font-bold font-nunito"
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
            <div className="space-y-12">
              {/* Render collections by category */}
              {sortedCategories.map(category => {
                const categoryCollections = collectionsByCategory.get(category.id) || [];
                if (categoryCollections.length === 0) return null;

                return (
                  <div key={category.id} id={category.id} className="mb-8">
                    <h2 className="text-2xl font-black mb-3 text-gray-800 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2 font-nunito">
                      {category.name}
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-300 mb-3 text-sm font-nunito font-semibold">
                      {category.description}
                    </p>

                    {viewMode === 'grid' ? (
                      <div className="relative">
                        {/* Left navigation button */}
                        <button
                          className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white dark:bg-zinc-800 rounded-full shadow-md p-2 opacity-70 hover:opacity-100"
                          onClick={() => scrollCarousel(category.id, 'left')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>

                        {/* Carousel container */}
                        <div
                          className="overflow-x-auto pb-4 hide-scrollbar"
                          ref={el => el && carouselRefs.current.set(category.id, el)}
                        >
                          <div className="flex space-x-6 snap-x snap-mandatory">
                            {categoryCollections.map((collection, i) => (
                              <div key={collection.id} className="w-80 flex-shrink-0 snap-start">
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
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right navigation button */}
                        <button
                          className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 bg-white dark:bg-zinc-800 rounded-full shadow-md p-2 opacity-70 hover:opacity-100"
                          onClick={() => scrollCarousel(category.id, 'right')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {categoryCollections.map((collection, i) => (
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
                  </div>
                );
              })}

              {/* Uncategorized collections */}
              {(collectionsByCategory.get('uncategorized') || []).length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-black mb-3 text-gray-800 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-2 font-nunito">
                    Other Collections
                  </h2>
                  <p className="text-zinc-600 dark:text-zinc-300 mb-3 text-sm font-nunito font-semibold">
                    Collections that haven't been categorized yet
                  </p>

                  {viewMode === 'grid' ? (
                    <div className="relative">
                      {/* Left navigation button */}
                      <button
                        className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white dark:bg-zinc-800 rounded-full shadow-md p-2 opacity-70 hover:opacity-100"
                        onClick={() => scrollCarousel('uncategorized', 'left')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>

                      {/* Carousel container */}
                      <div
                        className="overflow-x-auto pb-4 hide-scrollbar"
                        ref={el => el && carouselRefs.current.set('uncategorized', el)}
                      >
                        <div className="flex space-x-6 snap-x snap-mandatory">
                          {(collectionsByCategory.get('uncategorized') || []).map((collection, i) => (
                            <div key={collection.id} className="w-80 flex-shrink-0 snap-start">
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
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right navigation button */}
                      <button
                        className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 bg-white dark:bg-zinc-800 rounded-full shadow-md p-2 opacity-70 hover:opacity-100"
                        onClick={() => scrollCarousel('uncategorized', 'right')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {(collectionsByCategory.get('uncategorized') || []).map((collection, i) => (
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
                      className={`px-4 py-2 rounded-md font-nunito font-bold ${!pagination.hasPrevious
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                    >
                      Trang trước
                    </button>
                    <div className="px-4 py-2 bg-gray-100 rounded-md font-nunito font-bold">
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
                      className={`px-4 py-2 rounded-md font-nunito font-bold ${!pagination.hasNext
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                    >
                      Trang sau
                    </button>
                  </div>
                </div>
              )}
            </div>
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
