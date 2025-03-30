import { useState } from 'react';
import { Control } from 'react-hook-form';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImagePlus, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CollectionFormValues } from '../types';

interface ImageUploadProps {
	control: Control<CollectionFormValues>;
}

export function ImageUpload({ control }: ImageUploadProps) {
	const { toast } = useToast();
	const [imagePreview, setImagePreview] = useState<string | null>(null);

	// Xử lý khi chọn file ảnh
	const handleFileChange = (
		event: React.ChangeEvent<HTMLInputElement>,
		onChange: (value: string) => void
	) => {
		const file = event.target.files?.[0];
		if (file) {
			// Kiểm tra định dạng file
			if (!file.type.startsWith('image/')) {
				toast({
					title: 'Định dạng tệp không hợp lệ',
					description: 'Vui lòng tải lên tệp hình ảnh',
					variant: 'destructive',
				});
				return;
			}

			// Kiểm tra kích thước file (ví dụ: giới hạn 5MB)
			if (file.size > 5 * 1024 * 1024) {
				toast({
					title: 'Tệp quá lớn',
					description: 'Vui lòng tải lên ảnh nhỏ hơn 5MB',
					variant: 'destructive',
				});
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result as string;
				setImagePreview(result);
				onChange(result); // Gọi hàm onChange để cập nhật giá trị form
			};
			reader.readAsDataURL(file);
		}
	};

	const handleImagePreview = (url: string) => {
		if (url && url.startsWith('http')) {
			setImagePreview(url);
		} else if (!url.startsWith('data:')) {
			setImagePreview(null);
		}
	};

	return (
		<FormField
			control={control}
			name="coverImage"
			render={({ field }) => (
				<FormItem>
					<FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
						Ảnh bìa
					</FormLabel>
					<div className="space-y-4">
						<div className="flex flex-col gap-4">
							{/* Input URL */}
							<FormControl>
								<Input
									placeholder="Dán URL hình ảnh (vd: https://example.com/image.jpg)"
									className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 rounded-md"
									{...field}
									onChange={(e) => {
										field.onChange(e);
										handleImagePreview(e.target.value);
									}}
								/>
							</FormControl>

							{/* Upload Button */}
							<div className="relative">
								<Input
									type="file"
									accept="image/*"
									className="hidden"
									id="image-upload"
									onChange={(e) => handleFileChange(e, field.onChange)}
								/>
								<Button
									type="button"
									variant="outline"
									className="w-full"
									onClick={() =>
										document.getElementById('image-upload')?.click()
									}
								>
									<Upload className="mr-2 h-4 w-4" />
									Tải ảnh lên
								</Button>
							</div>
						</div>

						{/* Image Preview */}
						<div className="relative rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 aspect-video">
							{imagePreview ? (
								<img
									src={imagePreview}
									alt="Preview"
									className="w-full h-full object-cover transition-opacity hover:opacity-90"
									onError={() => setImagePreview(null)}
								/>
							) : (
								<div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-4">
									<ImagePlus className="h-12 w-12 mb-3" />
									<span className="text-sm text-center">
										Xem trước hình ảnh
									</span>
									<span className="text-xs mt-1 text-center">
										Khuyến nghị: 1200x630px
									</span>
								</div>
							)}
						</div>
					</div>
					<FormDescription className="text-xs text-gray-500 dark:text-gray-400 mt-2">
						Sử dụng một hình ảnh ấn tượng đại diện cho bộ sưu tập của bạn (tối
						đa 5MB)
					</FormDescription>
					<FormMessage className="text-xs" />
				</FormItem>
			)}
		/>
	);
}
