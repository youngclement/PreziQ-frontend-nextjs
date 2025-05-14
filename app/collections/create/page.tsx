'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { CollectionFormValues, collectionSchema } from './types';
import { collectionsApi } from '@/api-client';

// Import các component đã tách
import { CollectionFormHeader } from './components/collection-form-header';
import { FormFields } from './components/form-fields';
import { ImageUpload } from './components/image-upload';
import { FormActions } from './components/form-actions';

export default function CreateCollectionPage() {
	const router = useRouter();
	const { toast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);

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

	const onSubmit = async (data: CollectionFormValues) => {
		setIsSubmitting(true);
		try {
			toast({
				title: 'Đang tạo bộ sưu tập...',
				description: 'Vui lòng đợi trong khi chúng tôi tạo bộ sưu tập của bạn.',
			});

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

			// Gọi API tạo collection
			const response = await collectionsApi.createCollection(payload);
			console.log('API Response:', response);

			// Xử lý phản hồi API
			const apiResponse = response.data;

			// Kiểm tra response
			if (typeof apiResponse === 'string') {
				try {
					const parsedResponse = JSON.parse(apiResponse);
					if (parsedResponse.success) {
						toast({
							title: 'Đã tạo bộ sưu tập!',
							description: 'Bộ sưu tập của bạn đã được tạo thành công.',
						});
						router.push('/collections');
					} else {
						throw new Error(
							parsedResponse.message || 'Có lỗi xảy ra khi tạo bộ sưu tập'
						);
					}
				} catch (parseError) {
					console.error('JSON Parse Error:', parseError);
					throw new Error('Dữ liệu trả về không hợp lệ');
				}
			} else if (apiResponse && apiResponse.success) {
				toast({
					title: 'Đã tạo bộ sưu tập!',
					description: 'Bộ sưu tập của bạn đã được tạo thành công.',
				});
				router.push('/collections');
			} else {
				throw new Error(
					apiResponse?.message || 'Có lỗi xảy ra khi tạo bộ sưu tập'
				);
			}
		} catch (error) {
			console.error('Lỗi khi tạo bộ sưu tập:', error);
			toast({
				title: 'Lỗi khi tạo bộ sưu tập',
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

	return (
		<div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
			<div className="max-w-screen-2xl mx-auto">
				<CollectionFormHeader
					title="Tạo bộ sưu tập mới"
					subtitle="Xây dựng một bộ sưu tập tuyệt vời cho người xem của bạn"
				/>

				<Card className="w-full shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden rounded-xl">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<div className="flex flex-col md:flex-row">
								{/* Left Column - Form Fields */}
								<div className="flex-1 p-8">
									<FormFields control={form.control} />
									<FormActions isSubmitting={isSubmitting} />
								</div>

								{/* Right Column - Image Upload */}
								<div className="md:w-[40%] bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-900/50 dark:to-purple-900/20 p-8 flex flex-col">
									<div className="flex-1">
										<ImageUpload control={form.control} />
									</div>

									<div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-indigo-100 dark:border-gray-700">
										<h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
											Lưu ý quan trọng
										</h3>
										<p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
											Khi tạo bộ sưu tập mới, hệ thống sẽ tự động thêm một hoạt động quiz mặc định.
											Bạn có thể chỉnh sửa hoặc xóa hoạt động này sau khi tạo xong bộ sưu tập.
										</p>
										<div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
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
