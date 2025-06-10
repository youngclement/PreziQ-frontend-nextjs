'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  sessionsApi,
  SessionHistoryResponse,
} from '@/app/api-client/sessions-api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  Users,
  Eye,
  ClipboardList,
  Clock,
  FileBarChart,
  ArrowRight,
  BarChart2,
  History,
  Search,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import SimpleHeader from '@/components/simple-header';
import { useLanguage } from '@/contexts/language-context';

export default function SessionHistoryListPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [sessionHistory, setSessionHistory] =
    useState<SessionHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100);

  // Helper function để parse thời gian với nhiều format khác nhau
  const parseDateTime = (dateTimeStr: string) => {
    // Thử parse trực tiếp trước
    let date = new Date(dateTimeStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Xử lý format có AM/PM với giờ 24h (lỗi từ backend)
    // Ví dụ: "2025-05-15 14:14:46 PM" -> "2025-05-15 14:14:46"
    let cleanedStr = dateTimeStr.replace(/\s+(AM|PM)$/i, '');
    date = new Date(cleanedStr);
    if (!isNaN(date.getTime())) {
      return date;
    }

    // Thử các format khác
    const formats = [
      // ISO format
      dateTimeStr,
      // Remove trailing PM/AM if present with 24h format
      dateTimeStr.replace(/\s+(AM|PM)$/i, ''),
      // Try with T instead of space
      dateTimeStr.replace(' ', 'T'),
    ];

    for (const format of formats) {
      date = new Date(format);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }

    throw new Error(`Unable to parse date: ${dateTimeStr}`);
  };

  useEffect(() => {
    fetchSessionHistory();
  }, [currentPage]);

  const fetchSessionHistory = async () => {
    try {
      setLoading(true);
      const response = await sessionsApi.getMySessionsHistory(
        currentPage,
        itemsPerPage
      );
      setSessionHistory(response);
    } catch (error) {
      console.error('Error fetching session history:', error);
      toast({
        title: t('error'),
        description: t('sessionHistory.error.fetchFailed'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM dd, yyyy - h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return t('sessionHistory.duration.ongoing');

    try {
      const start = parseDateTime(startTime);
      const end = parseDateTime(endTime);

      console.log(`Calculating duration for session:`, {
        startTime: startTime,
        endTime: endTime,
        parsedStart: start.toISOString(),
        parsedEnd: end.toISOString(),
      });

      const diffMs = end.getTime() - start.getTime();

      // Nếu thời gian âm (end time < start time), return "Không xác định"
      if (diffMs < 0) {
        console.warn(`Negative duration detected:`, {
          startTime,
          endTime,
          diffMs,
        });
        return t('sessionHistory.duration.unknown');
      }

      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      // Nếu dưới 1 phút
      if (diffMins < 1) {
        return diffSeconds < 30
          ? t('sessionHistory.duration.lessThan30Seconds')
          : t('sessionHistory.duration.lessThan1Minute');
      } else if (diffMins < 60) {
        // Nếu dưới 1 giờ
        return `${diffMins} ${t('sessionHistory.duration.minutes')}`;
      } else if (diffHours < 24) {
        // Nếu dưới 1 ngày
        const remainingMins = diffMins % 60;
        return remainingMins > 0
          ? `${diffHours} ${t(
              'sessionHistory.duration.hours'
            )} ${remainingMins} ${t('sessionHistory.duration.minutes')}`
          : `${diffHours} ${t('sessionHistory.duration.hours')}`;
      } else {
        // Nếu hơn 1 ngày
        const remainingHours = diffHours % 24;
        if (remainingHours > 0) {
          return `${diffDays} ${t(
            'sessionHistory.duration.days'
          )} ${remainingHours} ${t('sessionHistory.duration.hours')}`;
        } else {
          return `${diffDays} ${t('sessionHistory.duration.days')}`;
        }
      }
    } catch (error) {
      console.error('Error calculating duration:', error, {
        startTime,
        endTime,
      });
      return t('sessionHistory.duration.unknown');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return (
          <Badge className='bg-green-500 hover:bg-green-600 text-white'>
            {t('sessionHistory.status.active')}
          </Badge>
        );
      case 'ENDED':
        return (
          <Badge className='bg-blue-500 hover:bg-blue-600 text-white'>
            {t('sessionHistory.status.ended')}
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className='bg-yellow-500 hover:bg-yellow-600 text-white'>
            {t('sessionHistory.status.pending')}
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge className='bg-red-500 hover:bg-red-600 text-white'>
            {t('sessionHistory.status.cancelled')}
          </Badge>
        );
      default:
        return (
          <Badge className='bg-gray-500 hover:bg-gray-600 text-white'>
            {status}
          </Badge>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE':
        return (
          <div className='w-2 h-2 rounded-full bg-green-500 animate-pulse'></div>
        );
      case 'ENDED':
        return <div className='w-2 h-2 rounded-full bg-blue-500'></div>;
      case 'PENDING':
        return <div className='w-2 h-2 rounded-full bg-yellow-500'></div>;
      case 'CANCELLED':
        return <div className='w-2 h-2 rounded-full bg-red-500'></div>;
      default:
        return <div className='w-2 h-2 rounded-full bg-gray-500'></div>;
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Calculate quick stats from session history data
  const getStats = () => {
    if (!sessionHistory || !sessionHistory.data.content.length) {
      return {
        total: 0,
        active: 0,
        ended: 0,
        avgDuration: `0 ${t('sessionHistory.duration.minutes')}`,
      };
    }

    const total = sessionHistory.data.meta.totalElements;
    const active = sessionHistory.data.content.filter(
      (s) => s.sessionStatus.toUpperCase() === 'ACTIVE'
    ).length;
    const ended = sessionHistory.data.content.filter(
      (s) => s.sessionStatus.toUpperCase() === 'ENDED'
    ).length;

    // Calculate average duration for ended sessions only
    const endedSessions = sessionHistory.data.content.filter(
      (s) => s.endTime && s.startTime
    );
    let totalMinutes = 0;
    let validSessionsCount = 0;

    console.log(
      `Total sessions: ${total}, Active: ${active}, Ended: ${ended}, Sessions with endTime: ${endedSessions.length}`
    );

    if (endedSessions.length > 0) {
      endedSessions.forEach((session) => {
        try {
          const start = parseDateTime(session.startTime);
          const end = parseDateTime(session.endTime!);

          const durationMs = end.getTime() - start.getTime();

          // Chỉ tính những session có thời gian hợp lệ (> 0)
          if (durationMs > 0) {
            const diffMins = Math.floor(durationMs / 60000);
            totalMinutes += diffMins;
            validSessionsCount++;
            console.log(`Session ${session.sessionId}: ${diffMins} minutes`);
          } else {
            console.warn(
              `Session ${session.sessionId} has invalid duration (negative or zero)`,
              {
                startTime: session.startTime,
                endTime: session.endTime,
                diffMs: durationMs,
              }
            );
          }
        } catch (error) {
          console.error(
            'Error calculating duration for session:',
            session.sessionId,
            error,
            {
              startTime: session.startTime,
              endTime: session.endTime,
            }
          );
        }
      });

      console.log(
        `Valid sessions: ${validSessionsCount}, Total minutes: ${totalMinutes}`
      );

      if (validSessionsCount > 0) {
        const avgMinutes = Math.round(totalMinutes / validSessionsCount);
        console.log(`Average minutes: ${avgMinutes}`);

        // Đảm bảo avgMinutes là số hợp lệ
        if (!isNaN(avgMinutes) && avgMinutes >= 0) {
          const hours = Math.floor(avgMinutes / 60);
          const mins = avgMinutes % 60;

          return {
            total,
            active,
            ended,
            avgDuration:
              hours > 0
                ? `${hours} ${t('sessionHistory.duration.hours')} ${mins} ${t(
                    'sessionHistory.duration.minutes'
                  )}`
                : `${mins} ${t('sessionHistory.duration.minutes')}`,
          };
        }
      }
    }

    return {
      total,
      active,
      ended,
      avgDuration: `0 ${t('sessionHistory.duration.minutes')}`,
    };
  };

  const stats = getStats();

  return (
    <>
      <SimpleHeader showBackButton title={t('sessionHistory.title')} />
      <div className='pt-[52px] bg-slate-50 dark:bg-slate-950 min-h-screen'>
        <div className='container mx-auto py-8'>
          <div className='flex flex-col space-y-6'>
            {/* Stats Overview */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <Card className='shadow-sm bg-white dark:bg-slate-900'>
                <CardContent className='p-4 flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>
                      {t('sessionHistory.totalSessions')}
                    </p>
                    <h3 className='text-2xl font-bold'>{stats.total}</h3>
                  </div>
                  <div className='h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500 dark:text-blue-300'>
                    <History className='h-6 w-6' />
                  </div>
                </CardContent>
              </Card>

              <Card className='shadow-sm bg-white dark:bg-slate-900'>
                <CardContent className='p-4 flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>
                      {t('sessionHistory.activeSessions')}
                    </p>
                    <h3 className='text-2xl font-bold'>{stats.active}</h3>
                  </div>
                  <div className='h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-500 dark:text-green-300'>
                    <Users className='h-6 w-6' />
                  </div>
                </CardContent>
              </Card>

              <Card className='shadow-sm bg-white dark:bg-slate-900'>
                <CardContent className='p-4 flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>
                      {t('sessionHistory.completedSessions')}
                    </p>
                    <h3 className='text-2xl font-bold'>{stats.ended}</h3>
                  </div>
                  <div className='h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500 dark:text-blue-300'>
                    <ClipboardList className='h-6 w-6' />
                  </div>
                </CardContent>
              </Card>

              <Card className='shadow-sm bg-white dark:bg-slate-900'>
                <CardContent className='p-4 flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>
                      {t('sessionHistory.averageDuration')}
                    </p>
                    <h3 className='text-2xl font-bold'>{stats.avgDuration}</h3>
                  </div>
                  <div className='h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-500 dark:text-amber-300'>
                    <Clock className='h-6 w-6' />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Card className='w-full shadow-sm border border-slate-200 dark:border-slate-800'>
              <CardHeader className='pb-2 border-b border-slate-200 dark:border-slate-800'>
                <CardTitle className='text-xl font-bold flex items-center gap-2'>
                  <FileBarChart className='h-5 w-5 text-slate-500' />
                  <span>{t('sessionHistory.title')}</span>
                </CardTitle>
                <CardDescription>
                  {t('sessionHistory.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className='p-0'>
                {loading ? (
                  <SessionHistoryTableSkeleton />
                ) : sessionHistory && sessionHistory.data.content.length > 0 ? (
                  <div className='rounded-md overflow-hidden'>
                    <Table>
                      <TableHeader className='bg-slate-50 dark:bg-slate-900'>
                        <TableRow>
                          <TableHead className='w-[100px]'>
                            {t('sessionHistory.table.status')}
                          </TableHead>
                          <TableHead className='w-[140px]'>
                            {t('sessionHistory.table.sessionCode')}
                          </TableHead>
                          <TableHead>
                            {t('sessionHistory.table.collectionTitle')}
                          </TableHead>
                          <TableHead className='w-[200px]'>
                            {t('sessionHistory.table.startTime')}
                          </TableHead>
                          <TableHead className='w-[120px]'>
                            {t('sessionHistory.table.duration')}
                          </TableHead>
                          <TableHead className='w-[120px] text-right'>
                            {t('sessionHistory.table.actions')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessionHistory.data.content.map((session) => (
                          <TableRow
                            key={session.sessionId}
                            className='hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer'
                            onClick={() =>
                              router.push(
                                `/session-history/${session.sessionId}`
                              )
                            }
                          >
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                {getStatusIcon(session.sessionStatus)}
                                {getStatusBadge(session.sessionStatus)}
                              </div>
                            </TableCell>
                            <TableCell className='font-medium'>
                              {session.sessionCode}
                            </TableCell>
                            <TableCell>
                              <div className='flex flex-col'>
                                <span className='font-medium'>
                                  {session.collection.title}
                                </span>
                                <span className='text-xs text-muted-foreground truncate max-w-[250px]'>
                                  {session.collection.description}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-1'>
                                <CalendarIcon className='h-3.5 w-3.5 text-slate-400' />
                                <span className='text-sm'>
                                  {formatDate(session.startTime)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-1'>
                                <Clock className='h-3.5 w-3.5 text-slate-400' />
                                <span className='text-sm'>
                                  {calculateDuration(
                                    session.startTime,
                                    session.endTime
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className='text-right'>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(
                                    `/session-history/${session.sessionId}`
                                  );
                                }}
                                className='flex items-center gap-1'
                              >
                                <Eye className='h-3.5 w-3.5' />
                                <span className='hidden sm:inline'>
                                  {t('sessionHistory.table.details')}
                                </span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className='flex flex-col items-center justify-center py-16 px-4'>
                    <div className='h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 mb-4'>
                      <Search className='h-8 w-8' />
                    </div>
                    <h3 className='text-lg font-medium mb-2'>
                      {t('sessionHistory.noSessions.title')}
                    </h3>
                    <p className='text-muted-foreground text-center mb-6 max-w-md'>
                      {t('sessionHistory.noSessions.description')}
                    </p>
                    <Link href='/dashboard'>
                      <Button className='flex items-center gap-2'>
                        <span>
                          {t('sessionHistory.noSessions.goToDashboard')}
                        </span>
                        <ArrowRight className='h-4 w-4' />
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
              {sessionHistory && sessionHistory.data.meta.totalPages > 1 && (
                <CardFooter className='border-t border-slate-200 dark:border-slate-800 py-4 flex justify-center'>
                  <Pagination>
                    <PaginationContent>
                      {sessionHistory.data.meta.hasPrevious && (
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                            className='cursor-pointer'
                          />
                        </PaginationItem>
                      )}

                      {Array.from(
                        { length: sessionHistory.data.meta.totalPages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => handlePageChange(page)}
                            className='cursor-pointer'
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}

                      {sessionHistory.data.meta.hasNext && (
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                            className='cursor-pointer'
                          />
                        </PaginationItem>
                      )}
                    </PaginationContent>
                  </Pagination>
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function SessionHistoryTableSkeleton() {
  return (
    <div className='space-y-4 p-6'>
      <div className='space-y-3'>
        <Skeleton className='h-8 w-72' />
        <Skeleton className='h-4 w-96' />
      </div>

      <div className='space-y-2'>
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <div key={index} className='flex items-center space-x-4 py-3'>
              <Skeleton className='h-6 w-20' />
              <Skeleton className='h-6 w-28' />
              <Skeleton className='h-6 w-40 flex-1' />
              <Skeleton className='h-6 w-40' />
              <Skeleton className='h-6 w-24' />
              <Skeleton className='h-8 w-24' />
            </div>
          ))}
      </div>
    </div>
  );
}
