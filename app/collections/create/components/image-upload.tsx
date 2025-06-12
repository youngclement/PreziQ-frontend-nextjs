import { useState, useEffect } from 'react';
import { Control, ControllerRenderProps } from 'react-hook-form';
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
import { ImagePlus, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CollectionFormValues } from '../types';
import { storageApi } from '@/api-client/storage-api';
import dynamic from 'next/dynamic';
import { getCroppedImg } from '@/utils/crop-image';
import { useLanguage } from '@/contexts/language-context';

// Import Cropper một cách dynamic để tránh lỗi SSR
const Cropper = dynamic(
  () => import('react-easy-crop').then((mod) => mod.default),
  {
    ssr: false,
  }
);

// Interface cho kết quả crop
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageUploadProps {
  control: Control<CollectionFormValues>;
}

export function ImageUpload({ control }: ImageUploadProps) {
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { t } = useLanguage();

  // State cho crop
  const [showCropper, setShowCropper] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [localFile, setLocalFile] = useState<File | null>(null);

  // Xử lý khi chọn file ảnh
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: t('collectionForm.imageUpload.invalidFormat'),
          description: t('collectionForm.imageUpload.invalidFormatDesc'),
          variant: 'destructive',
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('collectionForm.imageUpload.fileTooLarge'),
          description: t('collectionForm.imageUpload.fileTooLargeDesc'),
          variant: 'destructive',
        });
        return;
      }

      if (file.size < 1024) {
        toast({
          title: t('collectionForm.imageUpload.fileTooSmall'),
          description: t('collectionForm.imageUpload.fileTooSmallDesc'),
          variant: 'destructive',
        });
        return;
      }

      // Lưu file và mở cropper
      setLocalFile(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImageUrl(result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Xử lý khi crop hoàn tất
  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Xử lý khi cắt và tải lên ảnh
  const uploadCroppedImage = async (onChange: (value: string) => void) => {
    try {
      if (!croppedAreaPixels || !localFile || !originalImageUrl) return;

      setIsUploading(true);

      // Tạo ảnh đã crop
      const croppedImageBlob = await getCroppedImg(
        originalImageUrl,
        croppedAreaPixels
      );

      if (!croppedImageBlob) {
        throw new Error('Không thể tạo ảnh đã cắt');
      }

      // Tạo file từ blob
      const croppedFile = new File([croppedImageBlob], localFile.name, {
        type: localFile.type,
      });

      // Tạo preview URL cho hình ảnh đã cắt
      const croppedPreviewUrl = URL.createObjectURL(croppedImageBlob);
      setImagePreview(croppedPreviewUrl);

      // Upload file đã cắt
      const response = await storageApi.uploadSingleFile(
        croppedFile,
        'collections'
      );

      const responseData = response.data as any;

      if (responseData && responseData.success === true && responseData.data) {
        const fileUrl = responseData.data.fileUrl;

        if (fileUrl) {
          onChange(fileUrl);
          toast({
            title: t('collectionForm.imageUpload.uploadSuccess'),
            description: t('collectionForm.imageUpload.uploadSuccessDesc'),
          });
          setShowCropper(false);
        } else {
          toast({
            title: t('collectionForm.imageUpload.uploadError'),
            description: t('collectionForm.imageUpload.noFileUrl'),
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: t('collectionForm.imageUpload.uploadError'),
          description: t('collectionForm.imageUpload.uploadErrorDesc'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading cropped file:', error);
      toast({
        title: t('collectionForm.imageUpload.uploadError'),
        description: t('collectionForm.imageUpload.uploadErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
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
      render={({
        field,
      }: {
        field: ControllerRenderProps<CollectionFormValues, 'coverImage'>;
      }) => {
        // Đảm bảo hiển thị ảnh hiện tại khi component được tải
        useEffect(() => {
          if (field.value && field.value.startsWith('http')) {
            setImagePreview(field.value);
          }
        }, [field.value]);

        return (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('collectionForm.imageUpload.label')}
            </FormLabel>
            <div className="space-y-4">
              <div className="flex flex-col gap-4">
                <FormControl>
                  <Input
                    placeholder={t('collectionForm.imageUpload.urlPlaceholder')}
                    className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 rounded-md"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      handleImagePreview(e.target.value);
                    }}
                    disabled={isUploading}
                  />
                </FormControl>

                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={(e) => handleFileChange(e, field.onChange)}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      document.getElementById('image-upload')?.click()
                    }
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <svg
                          className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        {t('collectionForm.imageUpload.uploading')}
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        {t('collectionForm.imageUpload.uploadButton')}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {showCropper && (
                <div className="mt-4 border rounded-md p-4 bg-white dark:bg-gray-800">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium">
                      {t('collectionForm.imageUpload.cropTitle')}
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowCropper(false);
                        setOriginalImageUrl('');
                        setLocalFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="relative h-[300px] w-full mb-4">
                    {originalImageUrl && (
                      <Cropper
                        image={originalImageUrl}
                        crop={crop}
                        zoom={zoom}
                        aspect={16 / 9}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        rotation={0}
                        minZoom={1}
                        maxZoom={3}
                        cropShape="rect"
                        {...({} as any)}
                      />
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs">
                      {t('collectionForm.imageUpload.zoomLabel')}
                    </span>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full mx-2"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCropper(false);
                        setOriginalImageUrl('');
                        setLocalFile(null);
                      }}
                    >
                      {t('collectionForm.imageUpload.cancelButton')}
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => uploadCroppedImage(field.onChange)}
                      disabled={isUploading}
                    >
                      {isUploading
                        ? t('collectionForm.imageUpload.uploading')
                        : t('collectionForm.imageUpload.cropButton')}
                    </Button>
                  </div>
                </div>
              )}

              {!showCropper && (
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
                        {t('collectionForm.imageUpload.previewText')}
                      </span>
                      <span className="text-xs mt-1 text-center">
                        {t('collectionForm.imageUpload.recommendedSize')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <FormDescription className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('collectionForm.imageUpload.description')}
            </FormDescription>
            <FormMessage className="text-xs" />
          </FormItem>
        );
      }}
    />
  );
}
