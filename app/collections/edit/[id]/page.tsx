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
        <div className='container py-10 max-w-3xl'>
          <Card className='w-full'>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CollectionFormHeader
                  title='Chỉnh sửa bộ sưu tập'
                  subtitle='Chỉnh sửa thông tin bộ sưu tập của bạn'
                />
                <div className='p-6 space-y-6'>
                  <ImageUpload control={form.control} />
                  <FormFields
                    control={form.control}
                    form={form}
                    collectionId={collectionId}
                  />
                </div>
                <FormActions
                  isSubmitting={isSubmitting}
                  collectionId={collectionId}
                />
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </div>
  );
}
