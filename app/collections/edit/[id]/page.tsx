'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { CollectionFormValues, collectionSchema } from './types';
import { collectionsApi } from '@/api-client';
import { storageApi } from '@/api-client/storage-api';
// Import các component đã tách
import { CollectionFormHeader } from './components/collection-form-header';
import { FormFields } from './components/form-fields';
import { ImageUpload } from './components/image-upload';
import { FormActions } from './components/form-actions';

interface EditCollectionPageProps {
  params: {
    id: string;
  };
}

export default function EditCollectionPage({
  params,
}: EditCollectionPageProps) {
  const router = useRouter();
  const collectionId = params.id;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      title: '',
      description: '',
      coverImage: '',
      isPublished: false,
      defaultBackgroundMusic: '',
      topic: undefined,
    },
  });

  // Fetch collection data when component mounts
  useEffect(() => {
    if (!collectionId) {
      toast({
        title: 'Lỗi',
        description: 'Không tìm thấy ID bộ sưu tập',
        variant: 'destructive',
      });
      router.push('/collections');
      return;
    }

    const fetchCollection = async () => {
      setIsLoading(true);
      try {
        const response = await collectionsApi.getCollectionById(collectionId);

        if (response?.data?.success && response.data.data) {
          const collection = response.data.data;

          // Cập nhật form với dữ liệu hiện có
          form.reset({
            title: collection.title,
            description: collection.description || '',
            coverImage: collection.coverImage || '',
            isPublished: collection.isPublished || false,
            defaultBackgroundMusic: collection.defaultBackgroundMusic || '',
            topic: collection.topic as any,
          });
        } else {
          throw new Error('Không thể tải dữ liệu bộ sưu tập');
        }
      } catch (error) {
        console.error('Lỗi khi tải bộ sưu tập:', error);
        toast({
          title: 'Lỗi khi tải dữ liệu',
          description:
            'Không thể tải thông tin bộ sưu tập. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
        router.push('/collections');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollection();
  }, [collectionId, form, router, toast]);

  const onSubmit = async (data: CollectionFormValues) => {
    if (!collectionId) return;

    setIsSubmitting(true);
    try {
      toast({
        title: 'Đang cập nhật bộ sưu tập...',
        description:
          'Vui lòng đợi trong khi chúng tôi cập nhật bộ sưu tập của bạn.',
      });

      const currentCollection = await collectionsApi.getCollectionById(collectionId);
      const currentData = currentCollection.data.data;
  
      // Kiểm tra và xóa ảnh cũ nếu có thay đổi
      if (data.coverImage !== currentData.coverImage && currentData.coverImage) {
        try {
          await storageApi.deleteSingleFile(currentData.coverImage);
        } catch (error) {
          console.error('Lỗi khi xóa ảnh bìa cũ:', error);
        }
      }

      // Chuẩn bị dữ liệu cho API
      const payload = {
        title: data.title,
        description: data.description,
        coverImage: data.coverImage,
        isPublished: data.isPublished,
        defaultBackgroundMusic: data.defaultBackgroundMusic || undefined,
        topic: data.topic,
      };

      console.log('Payload gửi đi:', payload);

      // Gọi API cập nhật collection
      const response = await collectionsApi.updateCollection(
        collectionId,
        payload
      );
      console.log('API Response:', response);

      // Xử lý phản hồi API
      const apiResponse = response.data;

      // Kiểm tra response
      if (typeof apiResponse === 'string') {
        try {
          const parsedResponse = JSON.parse(apiResponse);
          if (parsedResponse.success) {
            toast({
              title: 'Đã cập nhật bộ sưu tập!',
              description: 'Bộ sưu tập của bạn đã được cập nhật thành công.',
            });
            router.push('/collections');
          } else {
            throw new Error(
              parsedResponse.message || 'Có lỗi xảy ra khi cập nhật bộ sưu tập'
            );
          }
        } catch (parseError) {
          console.error('JSON Parse Error:', parseError);
          throw new Error('Dữ liệu trả về không hợp lệ');
        }
      } else if (apiResponse && apiResponse.success) {
        toast({
          title: 'Đã cập nhật bộ sưu tập!',
          description: 'Bộ sưu tập của bạn đã được cập nhật thành công.',
        });
        router.push('/collections');
      } else {
        throw new Error(
          apiResponse?.message || 'Có lỗi xảy ra khi cập nhật bộ sưu tập'
        );
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật bộ sưu tập:', error);
      toast({
        title: 'Lỗi khi cập nhật bộ sưu tập',
        description:
          error instanceof Error
            ? error.message
            : 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 p-4 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600'></div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 p-4'>
      <div className='max-w-screen-2xl mx-auto'>
        <CollectionFormHeader
          title='Chỉnh sửa bộ sưu tập'
          subtitle='Cập nhật thông tin cho bộ sưu tập của bạn'
        />

        <Card className='w-full shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden rounded-xl'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className='flex flex-col md:flex-row'>
                {/* Left Column - Form Fields */}
                <div className='flex-1 p-8'>
                  <FormFields control={form.control} />
                  <FormActions
                    isSubmitting={isSubmitting}
                    collectionId={collectionId}
                  />
                </div>

                {/* Right Column - Image Upload */}
                <div className='md:w-[40%] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900/50 dark:to-purple-900/20 p-8 flex flex-col'>
                  <div className='flex-1'>
                    <ImageUpload control={form.control} />
                  </div>

                  <div className='mt-8 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-indigo-100 dark:border-gray-700'>
                    <h3 className='text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2'>
                      Lưu ý quan trọng
                    </h3>
                    <p className='text-xs text-gray-600 dark:text-gray-300 mb-3'>
                      Khi chỉnh sửa bộ sưu tập, các hoạt động quiz hiện có sẽ
                      được giữ nguyên. Bạn có thể quản lý các hoạt động sau khi
                      cập nhật bộ sưu tập.
                    </p>
                    <div className='text-xs text-indigo-600 dark:text-indigo-400 font-medium'>
                      Các trường bắt buộc: Tiêu đề, Mô tả, Ảnh bìa, Chủ đề
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
