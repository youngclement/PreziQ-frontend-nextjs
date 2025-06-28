'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { collectionsApi } from '@/api-client';
import { useLanguage } from '@/contexts/language-context';
import {
  Clock,
  User,
  Share2,
  Heart,
  BookOpen,
  Play,
  Users,
  Calendar,
  Award,
  Target,
  TrendingUp,
  Eye,
  Download,
  Bookmark,
  ArrowLeft,
  ChevronRight,
  Grid3X3,
  List,
  Search,
  Filter,
  Copy,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DefaultLayout from '@/app/default-layout';
import { QuestionViewerComponent } from '../components/question-viewer';

interface CollectionStats {
  totalActivities: number;
  totalQuestions: number;
  estimatedDuration: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  activityTypes: { [key: string]: number };
}

export default function ViewCollectionPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { t } = useLanguage();
  const collectionId = params.id;

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [collection, setCollection] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'list' | 'grid'>(
    'preview'
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivityType, setSelectedActivityType] =
    useState<string>('all');
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [isCoying, setIsCoying] = useState(false);

  // Memoized calculations
  const collectionStats: CollectionStats = useMemo(() => {
    if (!activities.length) {
      return {
        totalActivities: 0,
        totalQuestions: 0,
        estimatedDuration: 0,
        difficulty: 'Easy',
        activityTypes: {},
      };
    }

    const totalActivities = activities.length;
    const totalQuestions = activities.filter((a) =>
      a.activityType.startsWith('QUIZ')
    ).length;
    const estimatedDuration = activities.reduce((acc, activity) => {
      return acc + (activity.quiz?.timeLimitSeconds || 30);
    }, 0);

    const activityTypes = activities.reduce((acc, activity) => {
      const type = activity.activityType;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    // Simple difficulty calculation based on time limits and question types
    const avgTimeLimit = estimatedDuration / totalActivities;
    const difficulty =
      avgTimeLimit > 60 ? 'Hard' : avgTimeLimit > 30 ? 'Medium' : 'Easy';

    return {
      totalActivities,
      totalQuestions,
      estimatedDuration,
      difficulty,
      activityTypes,
    };
  }, [activities]);

  // Filtered activities based on search and filters
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch =
        activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.quiz?.questionText
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesType =
        selectedActivityType === 'all' ||
        activity.activityType === selectedActivityType;
      return matchesSearch && matchesType;
    });
  }, [activities, searchTerm, selectedActivityType]);

  // Activity type options for filtering
  const activityTypeOptions = useMemo(() => {
    const types = Array.from(new Set(activities.map((a) => a.activityType)));
    return [
      {
        value: 'all',
        label: t('viewCollection.all'),
        count: activities.length,
      },
      ...types.map((type) => ({
        value: type,
        label: getActivityTypeLabel(type),
        count: activities.filter((a) => a.activityType === type).length,
      })),
    ];
  }, [activities, t]);

  function getActivityTypeLabel(type: string): string {
    const typeMap: Record<string, string> = {
      QUIZ_BUTTONS: t('quiz.type.quiz_buttons'),
      QUIZ_CHECKBOXES: t('quiz.type.quiz_checkboxes'),
      QUIZ_TRUE_OR_FALSE: t('quiz.type.quiz_true_or_false'),
      QUIZ_TYPE_ANSWER: t('quiz.type.quiz_type_answer'),
      QUIZ_REORDER: t('quiz.type.quiz_reorder'),
      QUIZ_LOCATION: t('quiz.type.quiz_location'),
      QUIZ_MATCHING_PAIRS: t('quiz.type.quiz_matching_pairs'),
      INFO_SLIDE: t('quiz.type.info_slide'),
      SLIDE: t('quiz.type.info_slide'),
    };
    return typeMap[type] || type;
  }

  useEffect(() => {
    const fetchCollectionData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch collection details
        const response = await collectionsApi.getCollectionById(collectionId);

        console.log('Collection API Response:', response);

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

        if (processedData?.success && processedData?.data) {
          const collectionData = processedData.data;
          setCollection(collectionData);

          // Set activities directly from API response
          if (
            collectionData.activities &&
            collectionData.activities.length > 0
          ) {
            setActivities(collectionData.activities);
          }

          // Dismiss loading toast
          // toast({
          //   title: 'Thành công',
          //   description: 'Đã tải collection thành công',
          // });
        } else {
          throw new Error('Collection data structure is invalid');
        }
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError('Could not load collection details. Please try again later.');
        // toast({
        //   title: 'Lỗi',
        //   description:
        //     'Không thể tải thông tin collection. Vui lòng thử lại sau.',
        //   variant: 'destructive',
        // });
      } finally {
        setIsLoading(false);
      }
    };

    if (collectionId) {
      fetchCollectionData();
    }
  }, [collectionId, toast]);

  // Handle URL query parameters for deep linking
  useEffect(() => {
    const activityIndex = searchParams.get('activity');
    if (activityIndex && !isNaN(Number(activityIndex))) {
      setCurrentActivityIndex(Number(activityIndex));
      setViewMode('preview');
    }
  }, [searchParams]);

  const formatDateToLocale = (dateString?: string) => {
    if (!dateString) return t('common.unknownDate') || 'Ngày không xác định';
    try {
      // Xử lý format đặc biệt từ API: "2025-06-28 16:34:01 PM"
      // Loại bỏ PM/AM vì đã dùng 24h format
      let cleanedDateString = dateString.replace(/\s+(AM|PM)$/i, '');

      const date = new Date(cleanedDateString);
      if (isNaN(date.getTime()))
        return t('common.invalidDate') || 'Ngày không hợp lệ';
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return t('common.invalidDate') || 'Ngày không hợp lệ';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}p ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: collection.title,
          text: collection.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: t('viewCollection.shareSuccess'),
        description: t('viewCollection.shareSuccessDescription'),
      });
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked
        ? t('viewCollection.bookmarkRemoved')
        : t('viewCollection.bookmarkAdded'),
      description: isBookmarked
        ? t('viewCollection.bookmarkRemovedDescription')
        : t('viewCollection.bookmarkAddedDescription'),
    });
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? t('viewCollection.unliked') : t('viewCollection.liked'),
      description: isLiked
        ? t('viewCollection.unlikedDescription')
        : t('viewCollection.likedDescription'),
    });
  };

  const handleCopy = async () => {
    setIsCoying(true);

    try {
      const response = await collectionsApi.copyCollection(collectionId);

      // Hiển thị toast thành công
      toast({
        title: t('viewCollection.copySuccess'),
        description: t('viewCollection.copySuccessDescription', {
          title: response.data.data.title,
        }),
        duration: 3000,
      });

      // Redirect đến collection mới
      router.push(
        `/collection?collectionId=${response.data.data.collectionId}`
      );
    } catch (error) {
      console.error('Error copying collection:', error);

      // Hiển thị toast lỗi
      toast({
        title: t('viewCollection.copyError'),
        description: t('viewCollection.copyErrorDescription'),
        variant: 'destructive',
        duration: 3000,
      });
    } finally {
      setIsCoying(false);
    }
  };

  // Enhanced loading state with skeleton
  if (isLoading) {
    return (
      <DefaultLayout showBackButton={true} title={t('viewCollection.loading')}>
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-teal-900'>
          <div className='container max-w-7xl mx-auto px-4 py-8'>
            <div className='animate-pulse'>
              {/* Header skeleton */}
              <div className='flex flex-col md:flex-row gap-8 mb-8'>
                <div className='w-full md:w-1/3 aspect-video bg-gray-300 dark:bg-gray-700 rounded-lg'></div>
                <div className='w-full md:w-2/3 space-y-4'>
                  <div className='h-8 bg-gray-300 dark:bg-gray-700 rounded'></div>
                  <div className='h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4'></div>
                  <div className='h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2'></div>
                </div>
              </div>

              {/* Stats skeleton */}
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'>
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className='h-20 bg-gray-300 dark:bg-gray-700 rounded-lg'
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  // Error state
  if (error || !collection) {
    return (
      <DefaultLayout showBackButton={true} title={t('viewCollection.error')}>
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-teal-900'>
          <div className='container max-w-7xl mx-auto px-4 py-16 text-center'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='max-w-md mx-auto'
            >
              <div className='w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4'>
                <Eye className='w-8 h-8 text-red-600 dark:text-red-400' />
              </div>
              <h1 className='text-2xl font-bold mb-4 text-gray-900 dark:text-white'>
                {t('viewCollection.oopsError')}
              </h1>
              <p className='text-muted-foreground mb-6'>
                {error || t('viewCollection.collectionNotFound')}
              </p>
              <Button onClick={() => router.back()} variant='outline'>
                <ArrowLeft className='w-4 h-4 mr-2' />
                {t('viewCollection.goBack')}
              </Button>
            </motion.div>
          </div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout showBackButton={true} title={collection.title}>
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-teal-50 dark:from-slate-900 dark:via-slate-800 dark:to-teal-900'>
        <div className='container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Enhanced Collection Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='relative'
          >
            {/* Hero Section */}
            <div className='relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600'>
              <div className='absolute inset-0 bg-black/30'></div>

              {collection.coverImage && (
                <div className='absolute inset-0'>
                  <Image
                    src={collection.coverImage}
                    alt={collection.title}
                    className='object-cover'
                    fill
                    sizes='100vw'
                    priority
                  />
                  <div className='absolute inset-0 bg-gradient-to-r from-black/60 to-transparent'></div>
                </div>
              )}

              <div className='relative z-10 p-8 md:p-12 text-white'>
                <div className='max-w-3xl'>
                  <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className='text-4xl md:text-5xl font-bold mb-4'
                  >
                    {collection.title}
                  </motion.h1>

                  <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className='text-xl text-white/90 mb-6 leading-relaxed'
                  >
                    {collection.description}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className='grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl'
                  >
                    <Button
                      size='lg'
                      className='bg-black/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-gray-900 dark:bg-gray-800/70 dark:border-gray-200 dark:text-white dark:hover:bg-white dark:hover:text-gray-900 font-semibold shadow-lg w-full'
                      onClick={() =>
                        router.push(`/sessions/host/${collectionId}`)
                      }
                    >
                      <Play className='w-4 h-4 mr-1.5' />
                      {t('viewCollection.startLearning')}
                    </Button>

                    <Button
                      size='lg'
                      variant='outline'
                      className='bg-black/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-gray-900 dark:bg-gray-800/70 dark:border-gray-200 dark:text-white dark:hover:bg-white dark:hover:text-gray-900 font-semibold shadow-lg w-full'
                      onClick={handleShare}
                    >
                      <Share2 className='w-4 h-4 mr-1.5' />
                      {t('viewCollection.share')}
                    </Button>

                    <Button
                      size='lg'
                      variant='outline'
                      className='bg-black/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-gray-900 dark:bg-gray-800/70 dark:border-gray-200 dark:text-white dark:hover:bg-white dark:hover:text-gray-900 font-semibold shadow-lg w-full'
                      onClick={toggleBookmark}
                    >
                      <Bookmark
                        className={`w-4 h-4 mr-1.5 ${
                          isBookmarked ? 'fill-current' : ''
                        }`}
                      />
                      {isBookmarked
                        ? t('viewCollection.saved')
                        : t('viewCollection.save')}
                    </Button>

                    <Button
                      size='lg'
                      variant='outline'
                      className='bg-black/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-gray-900 dark:bg-gray-800/70 dark:border-gray-200 dark:text-white dark:hover:bg-white dark:hover:text-gray-900 font-semibold shadow-lg w-full'
                      onClick={toggleLike}
                    >
                      <Heart
                        className={`w-4 h-4 mr-1.5 ${
                          isLiked ? 'fill-current text-red-400' : ''
                        }`}
                      />
                      {t('viewCollection.like')}
                    </Button>

                    <Button
                      size='lg'
                      variant='outline'
                      className='bg-black/20 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-gray-900 dark:bg-gray-800/70 dark:border-gray-200 dark:text-white dark:hover:bg-white dark:hover:text-gray-900 font-semibold shadow-lg w-full col-span-2 md:col-span-1'
                      onClick={handleCopy}
                      disabled={isCoying}
                    >
                      <Copy className='w-4 h-4 mr-1.5' />
                      {isCoying
                        ? t('viewCollection.copying')
                        : t('viewCollection.copy')}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-8'
            >
              <Card className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
                <CardContent className='p-4 text-center'>
                  <BookOpen className='w-8 h-8 text-blue-600 mx-auto mb-2' />
                  <div className='text-2xl font-bold text-blue-900'>
                    {collectionStats.totalActivities}
                  </div>
                  <div className='text-sm text-blue-700'>
                    {t('viewCollection.activities')}
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
                <CardContent className='p-4 text-center'>
                  <Target className='w-8 h-8 text-green-600 mx-auto mb-2' />
                  <div className='text-2xl font-bold text-green-900'>
                    {collectionStats.totalQuestions}
                  </div>
                  <div className='text-sm text-green-700'>
                    {t('viewCollection.questions')}
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
                <CardContent className='p-4 text-center'>
                  <Clock className='w-8 h-8 text-purple-600 mx-auto mb-2' />
                  <div className='text-2xl font-bold text-purple-900'>
                    {formatDuration(collectionStats.estimatedDuration)}
                  </div>
                  <div className='text-sm text-purple-700'>
                    {t('viewCollection.time')}
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
                <CardContent className='p-4 text-center'>
                  <Award className='w-8 h-8 text-orange-600 mx-auto mb-2' />
                  <div className='text-2xl font-bold text-orange-900'>
                    {collectionStats.difficulty}
                  </div>
                  <div className='text-sm text-orange-700'>
                    {t('viewCollection.difficulty')}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Collection Metadata */}
            <Card className='mb-8'>
              <CardContent className='p-6'>
                <div className='grid md:grid-cols-3 gap-6'>
                  <div className='space-y-3'>
                    <h3 className='font-semibold text-lg mb-3'>
                      {t('viewCollection.information')}
                    </h3>
                    <div className='flex items-center text-sm text-muted-foreground'>
                      <Calendar className='mr-2 h-4 w-4' />
                      {t('viewCollection.createdAt')}{' '}
                      {formatDateToLocale(collection.createdAt)}
                    </div>
                    {collection.createdBy && (
                      <div className='flex items-center text-sm text-muted-foreground'>
                        <User className='mr-2 h-4 w-4' />
                        {t('viewCollection.author')} {collection.createdBy}
                      </div>
                    )}
                    <div className='flex items-center text-sm text-muted-foreground'>
                      <Users className='mr-2 h-4 w-4' />
                      {t('viewCollection.students', { count: '0' })}
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <h3 className='font-semibold text-lg mb-3'>
                      {t('viewCollection.contentTypes')}
                    </h3>
                    <div className='flex flex-wrap gap-2'>
                      {Object.entries(collectionStats.activityTypes).map(
                        ([type, count]) => (
                          <Badge
                            key={type}
                            variant='secondary'
                            className='text-xs'
                          >
                            {getActivityTypeLabel(type)} ({count})
                          </Badge>
                        )
                      )}
                    </div>
                  </div>

                  <div className='space-y-3'>
                    <h3 className='font-semibold text-lg mb-3'>
                      {t('viewCollection.progress')}
                    </h3>
                    <div className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span>{t('viewCollection.completed')}</span>
                        <span>0/{collectionStats.totalActivities}</span>
                      </div>
                      <Progress value={0} className='h-2' />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Separator className='my-8' />

          {/* Enhanced Content Section */}
          {activities.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Tabs
                value={viewMode}
                onValueChange={(value: any) => setViewMode(value)}
                className='w-full'
              >
                {/* Tab Navigation with Search and Filters */}
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6'>
                  <TabsList className='grid w-full lg:w-auto grid-cols-3'>
                    <TabsTrigger
                      value='preview'
                      className='flex items-center gap-2'
                    >
                      <Eye className='w-4 h-4' />
                      {t('viewCollection.preview')}
                    </TabsTrigger>
                    <TabsTrigger
                      value='list'
                      className='flex items-center gap-2'
                    >
                      <List className='w-4 h-4' />
                      {t('viewCollection.list')}
                    </TabsTrigger>
                    <TabsTrigger
                      value='grid'
                      className='flex items-center gap-2'
                    >
                      <Grid3X3 className='w-4 h-4' />
                      {t('viewCollection.grid')}
                    </TabsTrigger>
                  </TabsList>

                  <div className='flex flex-col sm:flex-row gap-4 lg:flex-1 lg:max-w-lg lg:ml-6'>
                    <div className='relative flex-1'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                      <Input
                        placeholder={t('viewCollection.searchActivities')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className='pl-10'
                      />
                    </div>

                    <select
                      value={selectedActivityType}
                      onChange={(e) => setSelectedActivityType(e.target.value)}
                      className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                    >
                      {activityTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} ({option.count})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tab Contents */}
                <TabsContent value='preview' className='mt-0'>
                  <QuestionViewerComponent
                    activities={filteredActivities}
                    collectionTitle={collection.title}
                  />
                </TabsContent>

                <TabsContent value='list' className='mt-0'>
                  <div className='space-y-4'>
                    {filteredActivities.map((activity, index) => (
                      <motion.div
                        key={activity.activityId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className='hover:shadow-md transition-shadow cursor-pointer'>
                          <CardContent className='p-6'>
                            <div className='flex items-center justify-between'>
                              <div className='flex-1'>
                                <div className='flex items-center gap-3 mb-2'>
                                  <Badge variant='outline'>
                                    {getActivityTypeLabel(
                                      activity.activityType
                                    )}
                                  </Badge>
                                  <span className='text-sm text-muted-foreground'>
                                    {t('viewCollection.activity', {
                                      number: (index + 1).toString(),
                                    })}
                                  </span>
                                </div>
                                <h3 className='font-semibold text-lg mb-2'>
                                  {activity.quiz?.questionText ||
                                    activity.title ||
                                    t('viewCollection.activity', {
                                      number: (index + 1).toString(),
                                    })}
                                </h3>
                                {activity.description && (
                                  <p className='text-muted-foreground text-sm mb-3'>
                                    {activity.description}
                                  </p>
                                )}
                                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                                  <div className='flex items-center gap-1'>
                                    <Clock className='w-4 h-4' />
                                    {formatDuration(
                                      activity.quiz?.timeLimitSeconds || 30
                                    )}
                                  </div>
                                  <div className='flex items-center gap-1'>
                                    <Target className='w-4 h-4' />
                                    {activity.quiz?.pointType || 'STANDARD'}
                                  </div>
                                </div>
                              </div>
                              <ChevronRight className='w-5 h-5 text-muted-foreground' />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value='grid' className='mt-0'>
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {filteredActivities.map((activity, index) => (
                      <motion.div
                        key={activity.activityId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className='hover:shadow-lg transition-all cursor-pointer group'>
                          <CardHeader className='pb-3'>
                            <div className='flex items-center justify-between mb-2'>
                              <Badge variant='outline' className='text-xs'>
                                {getActivityTypeLabel(activity.activityType)}
                              </Badge>
                              <span className='text-xs text-muted-foreground'>
                                #{index + 1}
                              </span>
                            </div>
                            <CardTitle className='text-lg group-hover:text-primary transition-colors'>
                              {activity.quiz?.questionText ||
                                activity.title ||
                                t('viewCollection.activity', {
                                  number: (index + 1).toString(),
                                })}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {activity.description && (
                              <p className='text-sm text-muted-foreground mb-4 line-clamp-3'>
                                {activity.description}
                              </p>
                            )}
                            <div className='flex items-center justify-between text-sm text-muted-foreground'>
                              <div className='flex items-center gap-1'>
                                <Clock className='w-4 h-4' />
                                {formatDuration(
                                  activity.quiz?.timeLimitSeconds || 30
                                )}
                              </div>
                              <div className='flex items-center gap-1'>
                                <TrendingUp className='w-4 h-4' />
                                {activity.quiz?.pointType || 'STANDARD'}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className='text-center py-16'
            >
              <div className='max-w-md mx-auto'>
                <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                  <BookOpen className='w-8 h-8 text-gray-400' />
                </div>
                <h3 className='text-xl font-semibold mb-2'>
                  {t('viewCollection.noContent')}
                </h3>
                <p className='text-muted-foreground mb-6'>
                  {t('viewCollection.noContentDescription')}
                </p>
                <Button variant='outline' onClick={() => router.back()}>
                  <ArrowLeft className='w-4 h-4 mr-2' />
                  {t('viewCollection.goBack')}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
}
