'use client';

import { useState, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { userApi } from '@/api-client/user-update-api';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Camera, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format, parse } from 'date-fns';
import { vi } from 'date-fns/locale';
import { storageApi } from '@/api-client';
import dynamic from 'next/dynamic';
import { getCroppedImg } from '@/utils/crop-image';

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

// Interface cho profile người dùng
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname: string;
  avatar: string;
  birthDate: string;
  gender: string;
  nationality: string;
  phoneNumber?: string;
}

// Interface cho kết quả trả về từ API
interface ProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  avatar?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  phoneNumber?: string;
}

// Schema validation
const profileFormSchema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập tên'),
  lastName: z.string().min(1, 'Vui lòng nhập họ'),
  nickname: z.string().optional(),
  avatar: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  phoneNumber: z
    .string()
    .optional()
    .refine(
      (phone) =>
        !phone ||
        phone === '' ||
        /^(0|84|\+84)([3|5|7|8|9])([0-9]{8})$/.test(phone.replace(/\s/g, '')),
      {
        message:
          'Số điện thoại không hợp lệ. Định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx',
      }
    ),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface UserProfileFormProps {
  userProfile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
}

export function UserProfileForm({
  userProfile,
  onProfileUpdated,
}: UserProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(userProfile.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log để kiểm tra dữ liệu
  console.log('UserProfile from props:', userProfile);

  // State cho crop ảnh
  const [showCropper, setShowCropper] = useState(false);
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [localFile, setLocalFile] = useState<File | null>(null);

  // Format ngày sinh từ ISO string sang định dạng cho input
  const formatBirthDate = (isoString: string | undefined) => {
    if (!isoString || isoString === '') return '';

    try {
      // Xử lý các trường hợp định dạng khác nhau
      // Nếu chuỗi có dạng yyyy-MM-dd, trả về ngay
      if (/^\d{4}-\d{2}-\d{2}$/.test(isoString)) {
        return isoString;
      }

      // Nếu là ISO string hoặc có thời gian đi kèm
      let dateValue: Date;

      // Trường hợp dạng "2025-01-16 15:00:00 PM" (không phải ISO chuẩn)
      if (isoString.includes(' ')) {
        // Xử lý định dạng có chứa khoảng trắng như "2025-01-16 15:00:00 PM"
        const datePart = isoString.split(' ')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          return datePart;
        }

        // Thử parse lại theo nhiều cách
        try {
          // Cố gắng chuyển sang định dạng ISO
          const cleanDate = isoString.replace(/\s+PM|\s+AM/i, '');
          dateValue = new Date(cleanDate);
        } catch (err) {
          // Fallback, sử dụng chỉ phần ngày nếu có thể
          const parts = isoString.split(' ')[0].split('-');
          if (parts.length === 3) {
            dateValue = new Date(
              Number(parts[0]),
              Number(parts[1]) - 1,
              Number(parts[2])
            );
          } else {
            throw new Error('Không thể parse ngày từ chuỗi');
          }
        }
      } else {
        // ISO string chuẩn
        dateValue = new Date(isoString);
      }

      // Kiểm tra nếu ngày hợp lệ
      if (isNaN(dateValue.getTime())) {
        console.warn('Ngày không hợp lệ từ chuỗi:', isoString);
        return '';
      }

      // Format date thành YYYY-MM-DD cho input type="date"
      return format(dateValue, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Lỗi khi format ngày:', error, 'Chuỗi gốc:', isoString);
      // Trả về chuỗi rỗng nếu có lỗi
      return '';
    }
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: userProfile.firstName || '',
      lastName: userProfile.lastName || '',
      nickname: userProfile.nickname || '',
      avatar: userProfile.avatar || '',
      birthDate: formatBirthDate(userProfile.birthDate),
      gender: userProfile.gender || '',
      nationality: userProfile.nationality || '',
      phoneNumber: userProfile.phoneNumber || '',
    },
  });

  async function onSubmit(data: ProfileFormValues) {
    try {
      setIsSubmitting(true);

      // Chuyển đổi lại định dạng ngày sinh (nếu có)
      const formattedData = {
        firstName: data.firstName,
        lastName: data.lastName,
        nickname: data.nickname || '',
        avatar: data.avatar || '',
        gender: data.gender || '',
        nationality: data.nationality || '',
        phoneNumber: data.phoneNumber || '',
        birthDate: data.birthDate
          ? format(new Date(data.birthDate), "yyyy-MM-dd'T'HH:mm:ssXXX")
          : '',
      };

      // Gọi API cập nhật thông tin
      const response = await userApi.updateProfile(formattedData);
      console.log('API Response:', response);

      // Cập nhật state nếu API trả về thành công
      if (response && response.data && response.success) {
        // Ép kiểu response data
        const profileData = response.data as ProfileResponse;
        console.log('Profile Data:', profileData);

        // Cập nhật UserProfile trong parent component
        onProfileUpdated({
          ...userProfile,
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          nickname: profileData.nickname || '',
          avatar: profileData.avatar || '',
          birthDate: profileData.birthDate || '',
          gender: profileData.gender || '',
          nationality: profileData.nationality || '',
          phoneNumber: profileData.phoneNumber || '',
        });
      }

      toast({
        title: 'Thành công',
        description: 'Thông tin cá nhân đã được cập nhật',
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật thông tin. Vui lòng thử lại sau.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Xử lý khi chọn file ảnh
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng file
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast({
        title: 'Định dạng không hỗ trợ',
        description: 'Chỉ chấp nhận file định dạng JPG, JPEG hoặc PNG',
        variant: 'destructive',
      });
      return;
    }

    // Kiểm tra kích thước file
    if (file.size < 1024) {
      toast({
        title: 'File quá nhỏ',
        description: 'File phải lớn hơn 1KB',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File quá lớn',
        description: 'File không được vượt quá 5MB',
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
  };

  // Xử lý khi crop hoàn tất
  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Xử lý khi cắt và tải lên ảnh
  const uploadCroppedImage = async () => {
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
      setPreviewUrl(croppedPreviewUrl);

      // Upload file đã cắt
      const response = await storageApi.uploadSingleFile(croppedFile, 'users');

      const responseData = response.data as any;

      if (responseData && responseData.success === true && responseData.data) {
        // Lấy URL từ ảnh đã upload
        const fileUrl = responseData.data.fileUrl;

        if (fileUrl) {
          // Cập nhật trường avatar trong form
          form.setValue('avatar', fileUrl);

          // Gọi API cập nhật thông tin avatar người dùng
          try {
            // Tạo payload chỉ bao gồm avatar mới cần cập nhật
            const updateData = {
              avatar: fileUrl // Chỉ cập nhật URL avatar mới
            };

            // Gọi API cập nhật profile
            const updateResponse = await userApi.updateProfile(updateData);

            // Kiểm tra kết quả cập nhật
            if (updateResponse.success && updateResponse.data) {
              // Cập nhật UserProfile trong parent component
              onProfileUpdated({
                ...userProfile,
                avatar: fileUrl,
              });
            }
          } catch (updateError) {
            console.error('Lỗi khi cập nhật thông tin avatar:', updateError);
            // Vẫn giữ URL ảnh đã tải lên dù có lỗi khi cập nhật profile
          }

          // Hiển thị thông báo thành công
          toast({
            title: 'Thành công',
            description: 'Đã tải lên và cập nhật ảnh đại diện',
          });

          // Đóng cropper
          setShowCropper(false);
        } else {
          toast({
            title: 'Lỗi',
            description: 'Không tìm thấy URL file trong phản hồi',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Lỗi',
          description: 'Không thể tải lên hình ảnh. Vui lòng thử lại.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải lên ảnh đã cắt:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi khi tải lên. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className='border-0 shadow-none'>
      <CardHeader>
        <CardTitle className='text-xl'>Thông tin cá nhân</CardTitle>
        <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            <div className='flex flex-col items-center space-y-6'>
              <div className='relative group'>
                <Avatar className='h-32 w-32 border-4 border-white dark:border-gray-800 shadow-xl'>
                  <AvatarImage
                    src={
                      previewUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        `${form.getValues('firstName')} ${form.getValues(
                          'lastName'
                        )}`
                      )}&background=random&size=200`
                    }
                    alt='Avatar'
                  />
                  <AvatarFallback className='text-4xl'>
                    {form.getValues('firstName').charAt(0)}
                    {form.getValues('lastName').charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className='absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200'>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    className='text-white hover:text-white hover:bg-white/20'
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <Loader2 className='h-6 w-6 animate-spin' />
                    ) : (
                      <Camera className='h-6 w-6' />
                    )}
                  </Button>
                </div>
                <input
                  type='file'
                  ref={fileInputRef}
                  className='hidden'
                  accept='image/png, image/jpeg, image/jpg'
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </div>
              <div className='text-center'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                  {userProfile.firstName} {userProfile.lastName}
                </h3>
                <p className='text-sm text-gray-500 dark:text-gray-400'>
                  {userProfile.email}
                </p>
              </div>
            </div>

            {/* Cropper */}
            {showCropper && (
              <div className='mt-4 border rounded-md p-4 bg-white dark:bg-gray-800'>
                <div className='flex justify-between items-center mb-3'>
                  <h4 className='text-sm font-medium'>Cắt ảnh đại diện</h4>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setShowCropper(false);
                      setOriginalImageUrl('');
                      setLocalFile(null);
                    }}
                  >
                    &times;
                  </Button>
                </div>
                <div className='relative h-[300px] w-full mb-4'>
                  {originalImageUrl && (
                    <Cropper
                      image={originalImageUrl}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      rotation={0}
                      minZoom={1}
                      maxZoom={3}
                      cropShape='rect'
                      {...({} as any)}
                    />
                  )}
                </div>
                <div className='flex items-center justify-between mb-4'>
                  <span className='text-xs'>Phóng to:</span>
                  <input
                    type='range'
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby='Zoom'
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className='w-full mx-2'
                  />
                </div>
                <div className='flex justify-end gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      setShowCropper(false);
                      setOriginalImageUrl('');
                      setLocalFile(null);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    type='button'
                    variant='default'
                    size='sm'
                    onClick={uploadCroppedImage}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Đang tải lên...' : 'Cắt và tải lên'}
                  </Button>
                </div>
              </div>
            )}

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>Tên</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className='transition-all duration-200 focus:ring-2 focus:ring-primary/20 border border-gray-200 dark:border-gray-700'
                        placeholder='Nhập tên của bạn'
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>Họ</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className='transition-all duration-200 focus:ring-2 focus:ring-primary/20 border border-gray-200 dark:border-gray-700'
                        placeholder='Nhập họ của bạn'
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='phoneNumber'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      Số điện thoại
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className='transition-all duration-200 focus:ring-2 focus:ring-primary/20 border border-gray-200 dark:border-gray-700'
                        placeholder='Nhập số điện thoại của bạn'
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='nickname'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      Biệt danh
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className='transition-all duration-200 focus:ring-2 focus:ring-primary/20 border border-gray-200 dark:border-gray-700'
                        placeholder='Nhập biệt danh của bạn'
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='birthDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      Ngày sinh
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='date'
                        {...field}
                        className='transition-all duration-200 focus:ring-2 focus:ring-primary/20 border border-gray-200 dark:border-gray-700'
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='gender'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      Giới tính
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className='transition-all duration-200 focus:ring-2 focus:ring-primary/20 border border-gray-200 dark:border-gray-700'>
                          <SelectValue placeholder='Chọn giới tính' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='male'>Nam</SelectItem>
                        <SelectItem value='female'>Nữ</SelectItem>
                        <SelectItem value='other'>Khác</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='nationality'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-sm font-medium'>
                      Quốc tịch
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className='transition-all duration-200 focus:ring-2 focus:ring-primary/20 border border-gray-200 dark:border-gray-700'
                        placeholder='Nhập quốc tịch của bạn'
                      />
                    </FormControl>
                    <FormMessage className='text-xs' />
                  </FormItem>
                )}
              />
            </div>

            <div className='flex justify-end'>
              <Button
                type='submit'
                disabled={isSubmitting}
                className='min-w-[120px] transition-all duration-200 hover:shadow-lg hover:shadow-primary/20'
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Đang cập nhật...
                  </>
                ) : (
                  'Cập nhật thông tin'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
