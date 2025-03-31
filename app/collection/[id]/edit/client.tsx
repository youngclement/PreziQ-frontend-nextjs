'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { CollectionFormValues, collectionSchema } from '../../create/types';
import { collectionsApi } from '@/api-client';
import { toast } from 'sonner';
import { z } from 'zod';

// Import các component đã tách
import { CollectionFormHeader } from '../../create/components/collection-form-header';
import { FormFields } from '../../create/components/form-fields';
import { ImageUpload } from '../../create/components/image-upload';
import { FormActions } from '../../create/components/form-actions';

interface EditCollectionClientProps {
	params: {
		id: string;
	};
}

export default function EditCollectionClient({
	params,
}: EditCollectionClientProps) {
	const router = useRouter();
	const { toast } = useToast();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [imageUrl, setImageUrl] = useState<string>('');

	const form = useForm<z.infer<typeof collectionSchema>>({
		resolver: zodResolver(collectionSchema),
		defaultValues: {
			title: '',
			description: '',
			coverImage: '',
			isPublished: false,
			defaultBackgroundMusic: '',
		},
	});

	// Fetch collection data
	useEffect(() => {
		const fetchCollection = async () => {
			try {
				const response = await collectionsApi.getCollectionById(params.id);
				if (response.data.success) {
					const collection = response.data.data;
					form.reset({
						title: collection.title,
						description: collection.description || '',
						coverImage: collection.coverImage || '',
						isPublished: collection.isPublished,
						defaultBackgroundMusic: collection.defaultBackgroundMusic || '',
					});
					setImageUrl(collection.coverImage || '');
				} else {
					toast({
						title: 'Lỗi',
						description: 'Không thể tải thông tin bộ sưu tập',
						variant: 'destructive',
					});
				}
			} catch (error) {
				console.error('Error fetching collection:', error);
				toast({
					title: 'Lỗi',
					description: 'Đã xảy ra lỗi khi tải thông tin bộ sưu tập',
					variant: 'destructive',
				});
			} finally {
				setIsLoading(false);
			}
		};

		fetchCollection();
	}, [params.id, form]);

	const onSubmit = async (values: z.infer<typeof collectionSchema>) => {
		setIsSubmitting(true);
		try {
			toast({
				title: 'Đang cập nhật bộ sưu tập...',
				description:
					'Vui lòng đợi trong khi chúng tôi cập nhật bộ sưu tập của bạn.',
			});

			const payload = {
				...values,
				coverImage: imageUrl,
			};

			console.log('Payload gửi đi:', payload);

			// Gọi API cập nhật collection
			const response = await collectionsApi.updateCollection(
				params.id,
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
			<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
				<div className="max-w-screen-2xl mx-auto">
					<div className="flex items-center justify-center h-[50vh]">
						<div className="text-center">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
							<p className="mt-4 text-gray-600 dark:text-gray-400">
								Đang tải thông tin bộ sưu tập...
							</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
			<div className="max-w-screen-2xl mx-auto">
				<CollectionFormHeader
					title="Chỉnh sửa bộ sưu tập"
					subtitle="Cập nhật thông tin bộ sưu tập của bạn"
				/>

				<Card className="w-full shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<div className="flex flex-col md:flex-row">
								{/* Left Column - Form Fields */}
								<div className="flex-1 p-6">
									<FormFields control={form.control} />
									<FormActions isSubmitting={isSubmitting} />
								</div>

								{/* Right Column - Image Upload */}
								<div className="md:w-[40%] bg-gray-50 dark:bg-gray-900/30 p-6 flex flex-col">
									<div className="flex-1">
										<ImageUpload control={form.control} />
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
