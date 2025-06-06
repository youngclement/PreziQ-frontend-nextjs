'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  Users,
  ArrowLeft,
  Download,
  CheckCircle,
  X,
  PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import TopThreePodium from './TopThreePodium';

interface ParticipantSummary {
  displayName: string;
  displayAvatar: string;
  finalScore: number;
  finalRanking: number;
  finalCorrectCount: number;
  finalIncorrectCount: number;
}

interface HostSessionSummaryProps {
  sessionId: string;
  sessionCode: string;
  participants: ParticipantSummary[];
  onNavigateToHome?: () => void;
}

export default function HostSessionSummary({
  sessionId,
  sessionCode,
  participants,
  onNavigateToHome,
}: HostSessionSummaryProps) {
  const [showPodium, setShowPodium] = useState(true);
  const [replayPodium, setReplayPodium] = useState(false);

  // Sắp xếp người tham gia theo thứ hạng
  const sortedParticipants = [...participants].sort(
    (a, b) => a.finalRanking - b.finalRanking
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 },
    },
  };

  // Hàm xuất dữ liệu sang CSV
  const exportToCSV = () => {
    // Tiêu đề các cột
    const headers = ['Thứ hạng', 'Tên', 'Điểm', 'Số câu đúng', 'Số câu sai'];

    // Dữ liệu người tham gia
    const data = sortedParticipants.map((participant) => [
      participant.finalRanking.toString(),
      participant.displayName,
      participant.finalScore.toString(),
      participant.finalCorrectCount.toString(),
      participant.finalIncorrectCount.toString(),
    ]);

    // Ghép tiêu đề và dữ liệu
    const csvContent = [
      headers.join(','),
      ...data.map((row) => row.join(',')),
    ].join('\n');

    // Tạo blob và tải xuống
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `session-${sessionCode}-summary.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Kết thúc hiệu ứng podium và hiển thị bảng xếp hạng
  const handlePodiumComplete = () => {
    setShowPodium(false);
    setReplayPodium(false);
  };

  // Xem lại hiệu ứng top 3
  const handleReplayPodium = () => {
    setReplayPodium(true);
  };

  return (
    <>
      {/* Hiển thị hiệu ứng podium khi component được render lần đầu hoặc khi nhấp nút replay */}
      {(showPodium || replayPodium) && participants.length > 0 && (
        <TopThreePodium
          participants={participants}
          onComplete={handlePodiumComplete}
        />
      )}

      <motion.div
        className='max-w-4xl mx-auto'
        variants={containerVariants}
        initial='hidden'
        animate='visible'
      >
        <motion.div className='text-center mb-8' variants={itemVariants}>
          <div className='inline-flex items-center justify-center p-3 bg-primary/10 text-primary rounded-full mb-4'>
            <Trophy className='h-12 w-12' />
          </div>
          <h1 className='text-3xl md:text-4xl font-bold mb-2'>
            Kết quả phiên học
          </h1>
          <p className='text-muted-foreground mb-1'>Mã phiên: {sessionCode}</p>
          <p className='text-muted-foreground'>
            Số người tham gia: {participants.length}
          </p>
        </motion.div>

        {/* Thanh công cụ */}
        <motion.div
          className='mb-8 flex flex-wrap justify-center gap-3'
          variants={itemVariants}
        >
          <Button variant='outline' onClick={onNavigateToHome}>
            <ArrowLeft className='mr-2 h-4 w-4' /> Quay lại
          </Button>

          <Button
            className='bg-green-600 hover:bg-green-700 text-white'
            onClick={exportToCSV}
          >
            <Download className='mr-2 h-4 w-4' /> Xuất kết quả (CSV)
          </Button>

          <Button variant='outline' asChild>
            <Link href={`/sessions/host/${sessionId}/analytics`}>
              <Users className='mr-2 h-4 w-4' /> Phân tích chi tiết
            </Link>
          </Button>

          {/* Nút xem lại hiệu ứng top 3 */}
          {participants.length > 0 && !replayPodium && (
            <Button
              variant='secondary'
              onClick={handleReplayPodium}
              className='bg-[rgb(255,198,121)]/30 text-[rgb(255,198,121)] hover:bg-[rgb(255,198,121)]/40 border border-[rgb(255,198,121)]/40'
            >
              <PlayCircle className='mr-2 h-4 w-4' /> Xem lại top 3
            </Button>
          )}
        </motion.div>

        {/* Bảng xếp hạng */}
        <Card className='p-6 mb-8'>
          <h2 className='text-xl font-semibold mb-6 flex items-center'>
            <Trophy className='mr-2 h-5 w-5 text-[rgb(255,198,121)]' />
            Bảng xếp hạng
          </h2>

          {participants.length === 0 ? (
            <div className='text-center py-10 text-muted-foreground'>
              <Users className='h-12 w-12 mx-auto mb-4 opacity-20' />
              <p>Không có người tham gia nào trong phiên này</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {/* Hàng tiêu đề cho màn hình lớn */}
              <div className='hidden md:grid md:grid-cols-12 px-4 py-2 text-sm font-medium text-muted-foreground'>
                <div className='md:col-span-1 text-center'>#</div>
                <div className='md:col-span-5'>Người tham gia</div>
                <div className='md:col-span-2 text-center'>Điểm</div>
                <div className='md:col-span-2 text-center'>Đúng</div>
                <div className='md:col-span-2 text-center'>Sai</div>
              </div>

              {/* Danh sách người tham gia */}
              {sortedParticipants.map((participant, index) => (
                <motion.div
                  key={index}
                  className={`grid grid-cols-1 md:grid-cols-12 items-center p-4 rounded-lg ${index === 0
                      ? 'bg-[rgb(255,198,121)]/20 border border-[rgb(255,198,121)]/30'
                      : index === 1
                        ? 'bg-[rgb(173,216,255)]/20 border border-[rgb(173,216,255)]/30'
                        : index === 2
                          ? 'bg-[rgb(255,204,188)]/20 border border-[rgb(255,204,188)]/30'
                          : 'bg-gray-50/10 border border-white/5'
                    }`}
                  variants={itemVariants}
                >
                  {/* Thứ hạng */}
                  <div className='md:col-span-1 flex md:block items-center justify-center text-center mb-2 md:mb-0'>
                    {index === 0 ? (
                      <div className='p-1.5 bg-[rgb(255,198,121)] text-white rounded-full inline-flex'>
                        <Trophy className='h-5 w-5' />
                      </div>
                    ) : index === 1 ? (
                      <div className='p-1.5 bg-[rgb(173,216,255)] text-white rounded-full inline-flex'>
                        <Medal className='h-5 w-5' />
                      </div>
                    ) : index === 2 ? (
                      <div className='p-1.5 bg-[rgb(255,204,188)] text-white rounded-full inline-flex'>
                        <Award className='h-5 w-5' />
                      </div>
                    ) : (
                      <div className='h-8 w-8 bg-black bg-opacity-20 text-white rounded-full inline-flex items-center justify-center font-bold'>
                        {participant.finalRanking}
                      </div>
                    )}
                  </div>

                  {/* Thông tin người tham gia */}
                  <div className='md:col-span-5 flex items-center space-x-3 mb-2 md:mb-0'>
                    <Avatar>
                      <AvatarImage
                        src={participant.displayAvatar}
                        alt={participant.displayName}
                      />
                      <AvatarFallback>
                        {participant.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className='font-medium'>{participant.displayName}</p>
                      <div className='md:hidden flex items-center gap-3 mt-1 text-sm'>
                        <Badge
                          variant='outline'
                          className='bg-[rgb(173,216,255)]/20 text-[rgb(173,216,255)] border-[rgb(173,216,255)]/40'
                        >
                          {participant.finalScore} điểm
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Điểm */}
                  <div className='md:col-span-2 text-center hidden md:block'>
                    <span className='font-bold text-lg'>
                      {participant.finalScore}
                    </span>
                  </div>

                  {/* Số câu đúng */}
                  <div className='md:col-span-2 text-center flex md:block justify-between items-center mb-1 md:mb-0'>
                    <span className='md:hidden text-sm text-muted-foreground'>
                      Đúng:
                    </span>
                    <div className='flex items-center justify-center gap-1'>
                      <CheckCircle className='h-4 w-4 text-green-600' />
                      <span className='font-semibold'>
                        {participant.finalCorrectCount}
                      </span>
                    </div>
                  </div>

                  {/* Số câu sai */}
                  <div className='md:col-span-2 text-center flex md:block justify-between items-center'>
                    <span className='md:hidden text-sm text-muted-foreground'>
                      Sai:
                    </span>
                    <div className='flex items-center justify-center gap-1'>
                      <X className='h-4 w-4 text-red-600' />
                      <span className='font-semibold'>
                        {participant.finalIncorrectCount}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* Thống kê bổ sung */}
        <motion.div
          className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-8'
          variants={itemVariants}
        >
          <Card className='p-4 flex items-center justify-between bg-[rgb(173,216,255)]/10 border-[rgb(173,216,255)]/30'>
            <div>
              <p className='text-muted-foreground text-sm'>
                Tổng người tham gia
              </p>
              <p className='text-2xl font-bold'>{participants.length}</p>
            </div>
            <Users className='h-8 w-8 text-[rgb(173,216,255)]' />
          </Card>

          <Card className='p-4 flex items-center justify-between bg-[rgb(255,198,121)]/10 border-[rgb(255,198,121)]/30'>
            <div>
              <p className='text-muted-foreground text-sm'>Điểm trung bình</p>
              <p className='text-2xl font-bold'>
                {participants.length > 0
                  ? Math.round(
                    participants.reduce((sum, p) => sum + p.finalScore, 0) /
                    participants.length
                  )
                  : 0}
              </p>
            </div>
            <Trophy className='h-8 w-8 text-[rgb(255,198,121)]' />
          </Card>

          <Card className='p-4 flex items-center justify-between'>
            <div>
              <p className='text-muted-foreground text-sm'>
                Tỷ lệ đúng trung bình
              </p>
              <p className='text-2xl font-bold'>
                {participants.length > 0
                  ? Math.round(
                    (participants.reduce(
                      (sum, p) => sum + p.finalCorrectCount,
                      0
                    ) /
                      participants.reduce(
                        (sum, p) =>
                          sum + p.finalCorrectCount + p.finalIncorrectCount,
                        0
                      )) *
                    100 || 0
                  )
                  : 0}
                %
              </p>
            </div>
            <CheckCircle className='h-8 w-8 text-green-500 opacity-80' />
          </Card>
        </motion.div>

        {/* Nút điều hướng và thông tin session */}
        <motion.div className='text-center mb-12' variants={itemVariants}>
          <p className='text-muted-foreground mb-4'>
            Phiên học đã kết thúc. Cảm ơn bạn đã tổ chức phiên này!
          </p>

          <div className='flex flex-col sm:flex-row gap-3 justify-center'>
            <Button
              className='bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
              asChild
            >
              <Link href='/collections'>
                <CheckCircle className='mr-2 h-4 w-4' /> Quay lại
              </Link>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
