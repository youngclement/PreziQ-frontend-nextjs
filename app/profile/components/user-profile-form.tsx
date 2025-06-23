'use client';

import { useState, useRef, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { userApi } from '@/api-client/user-update-api';
import { storageApi } from '@/api-client/storage-api';
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
import {
  Loader2,
  Camera,
  User,
  Calendar,
  Globe,
  Upload,
  Image,
  AlertCircle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { toast as sonnerToast } from 'sonner';
import dynamic from 'next/dynamic';
import { getCroppedImg } from '../../../utils/crop-image';
import { useLanguage } from '@/contexts/language-context';

// Dùng dynamic import cho Cropper để tránh lỗi SSR
const Cropper = dynamic(
  () => import('react-easy-crop').then((mod) => mod.default),
  {
    ssr: false,
  }
);

// Interface cho profile người dùng
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  nickname?: string;
  avatar?: string;
  birthDate?: string;
  gender?: string;
  nationality?: string;
  createdAt?: string;
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
}

// Type cho quốc gia
type Country = {
  id: number;
  name: string;
  abbreviation: string;
  capital: string;
  currency: string;
  phone: string;
  population: number;
  image: string;
};

// Interface cho kết quả crop
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface UserProfileFormProps {
  userProfile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
}

export function UserProfileForm({
  userProfile,
  onProfileUpdated,
}: UserProfileFormProps) {
  const { t } = useLanguage();

  // Schema validation - giữ nguyên logic gốc nhưng dùng text đa ngôn ngữ
  const profileFormSchema = z.object({
    firstName: z
      .string()
      .min(1, {
        message: t('profile.firstNameRequired'),
      })
      .max(50, {
        message: t('profile.firstNameTooLong'),
      }),
    lastName: z
      .string()
      .min(1, {
        message: t('profile.lastNameRequired'),
      })
      .max(50, {
        message: t('profile.lastNameTooLong'),
      }),
    nickname: z
      .string()
      .max(30, {
        message: t('profile.nicknameTooLong'),
      })
      .optional()
      .or(z.literal('')),
    birthDate: z.string().optional(),
    gender: z.string().optional(),
    nationality: z
      .string()
      .max(50, {
        message: t('profile.nationalityTooLong'),
      })
      .optional(),
    avatar: z.string().optional(),
    avatarFile: z
      .instanceof(File)
      .optional()
      .refine(
        (file) => !file || file.size >= 1024, // 1KB
        t('profile.fileMinSize')
      )
      .refine(
        (file) => !file || file.size <= 5 * 1024 * 1024, // 5MB
        t('profile.fileMaxSize')
      )
      .refine(
        (file) =>
          !file || ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
        t('profile.fileType')
      ),
  });

  type ProfileFormValues = z.infer<typeof profileFormSchema>;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    userProfile?.avatar || undefined
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);

  // Thêm các state cho việc crop ảnh
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(
    null
  );
  const [originalImageUrl, setOriginalImageUrl] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Log để kiểm tra dữ liệu
  console.log('UserProfile from props:', userProfile);

  // Test toast khi component mount
  useEffect(() => {
    console.log('UserProfileForm mounted');
    console.log('UserProfile from props:', userProfile);
    console.log('UserProfile birthDate:', userProfile?.birthDate);
    // Test toast để đảm bảo nó hoạt động
    // sonnerToast.info('Component đã được tải');
  }, [userProfile]);

  // Fetch countries data - khôi phục logic gốc
  useEffect(() => {
    const fetchCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const response = await fetch(
          'https://api.sampleapis.com/countries/countries'
        );
        const data = await response.json();

        // Sắp xếp danh sách theo bảng chữ cái
        const sortedData = [...data].sort((a, b) =>
          a.name.localeCompare(b.name)
        );

        // Tìm và đưa Việt Nam lên đầu danh sách nếu có
        const vietnamIndex = sortedData.findIndex(
          (country) => country.name === 'Vietnam' || country.name === 'Viet Nam'
        );

        if (vietnamIndex !== -1) {
          const vietnam = sortedData.splice(vietnamIndex, 1)[0];
          sortedData.unshift(vietnam);
        }

        setCountries(sortedData);
      } catch (error) {
        console.error('Lỗi khi tải danh sách quốc gia:', error);
        sonnerToast.error(t('profile.couldNotLoadCountries'));
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, [t]);

  // Hàm format ngày từ ISO string sang định dạng yyyy-MM-dd
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      console.log('Original dateString:', dateString);

      // Xử lý format từ API: "2025-06-11 07:00:00 AM"
      // Chuyển thành format chuẩn để parse
      let formattedDateString = dateString;

      // Kiểm tra nếu là format "YYYY-MM-DD HH:mm:ss AM/PM"
      if (dateString.includes(' AM') || dateString.includes(' PM')) {
        // Tách lấy phần ngày và chuyển thành ISO format
        const datePart = dateString.split(' ')[0]; // "2025-06-11"
        const timePart = dateString.split(' ')[1]; // "07:00:00"
        const ampm = dateString.split(' ')[2]; // "AM"

        // Chuyển thành format ISO
        formattedDateString = `${datePart}T${timePart}${
          ampm === 'AM' ? '+00:00' : '+00:00'
        }`;
        console.log('Formatted dateString:', formattedDateString);

        // Hoặc đơn giản hơn, chỉ lấy phần ngày
        const simpleDate = datePart;
        console.log('Simple date:', simpleDate);
        return simpleDate;
      }

      // Nếu là ISO string thì parse như cũ
      const date = parseISO(formattedDateString);
      const result = format(date, 'yyyy-MM-dd');
      console.log('Parsed result:', result);
      return result;
    } catch (error) {
      console.error('Lỗi khi format ngày:', error);
      console.error('Input dateString:', dateString);

      // Fallback: thử extract ngày từ string nếu có pattern YYYY-MM-DD
      const dateMatch = dateString.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        console.log('Fallback date:', dateMatch[1]);
        return dateMatch[1];
      }

      return '';
    }
  };

  // Debug useEffect sau khi formatDate đã được định nghĩa
  useEffect(() => {
    if (userProfile?.birthDate) {
      console.log('=== DEBUG BIRTHDATE ===');
      console.log('Raw birthDate từ API:', userProfile.birthDate);
      console.log(
        'Formatted birthDate cho form:',
        formatDate(userProfile.birthDate)
      );
      console.log('========================');
    }
  }, [userProfile?.birthDate]);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: userProfile?.firstName || '',
      lastName: userProfile?.lastName || '',
      nickname: userProfile?.nickname || '',
      birthDate: formatDate(userProfile?.birthDate),
      gender: userProfile?.gender || '',
      nationality: userProfile?.nationality || '',
      avatar: userProfile?.avatar || '',
      avatarFile: undefined,
    },
  });

  // Logic xử lý file change từ users-action-dialog - giữ nguyên
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast({
        title: t('profile.fileFormatNotSupported'),
        description: t('profile.fileType'),
        variant: 'destructive',
      });
      return;
    }

    // Check file size
    if (file.size < 1024) {
      toast({
        title: t('profile.fileTooSmall'),
        description: t('profile.fileMinSize'),
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('profile.fileTooLarge'),
        description: t('profile.fileMaxSize'),
        variant: 'destructive',
      });
      return;
    }

    // Tạo preview URL
    const objectUrl = URL.createObjectURL(file);
    setOriginalImageUrl(objectUrl);
    setShowCropper(true);
    setAvatarFile(file);
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const uploadCroppedImage = async () => {
    try {
      if (!croppedAreaPixels || !avatarFile || !originalImageUrl) return;

      setIsUploadingAvatar(true);

      // Tạo ảnh đã crop
      const croppedImageBlob = await getCroppedImg(
        originalImageUrl,
        croppedAreaPixels
      );

      if (!croppedImageBlob) {
        throw new Error(t('profile.cannotCreateCroppedImage'));
      }

      // Tạo file từ blob
      const croppedFile = new File([croppedImageBlob], avatarFile.name, {
        type: avatarFile.type,
      });

      // Tạo preview URL
      const croppedPreviewUrl = URL.createObjectURL(croppedImageBlob);
      setAvatarPreview(croppedPreviewUrl);

      // Upload file đã cắt
      const uploadResponse = await storageApi.uploadSingleFile(
        croppedFile,
        'users'
      );

      console.log('Upload response:', uploadResponse);

      // Sử dụng kiểu any để tránh lỗi kiểu dữ liệu
      const responseData = uploadResponse.data as any;

      if (responseData && responseData.success === true && responseData.data) {
        // Lấy URL từ response data
        const fileUrl = responseData.data.fileUrl;

        if (fileUrl) {
          console.log('File URL:', fileUrl);
          // Cập nhật trường avatar trong form
          form.setValue('avatar', fileUrl);

          // Hiển thị thông báo thành công
          toast({
            title: t('profile.uploadSuccess'),
            description: t('profile.cropUploadSuccess'),
          });

          // Đóng cropper
          setShowCropper(false);
        } else {
          toast({
            title: t('profile.genericError'),
            description: t('profile.fileUrlNotFound'),
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: t('profile.genericError'),
          description: t('profile.uploadError'),
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error uploading cropped file:', error);
      toast({
        title: t('profile.genericError'),
        description: t('profile.uploadError'),
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  async function onSubmit(data: ProfileFormValues) {
    try {
      setIsSubmitting(true);

      // Helper function để kiểm tra giá trị có rỗng không
      const isEmpty = (value: any) => {
        return value === '' || value === null || value === undefined;
      };

      // Helper function để kiểm tra trường có thay đổi không
      const hasChanged = (newValue: any, oldValue: any) => {
        // Nếu cả hai đều rỗng thì không coi là thay đổi
        if (isEmpty(newValue) && isEmpty(oldValue)) {
          return false;
        }
        return newValue !== oldValue;
      };

      // Tạo object chỉ chứa những trường thay đổi
      const changedFields: any = {};

      // Kiểm tra từng trường và chỉ thêm vào changedFields nếu có thay đổi
      if (hasChanged(data.firstName, userProfile.firstName)) {
        changedFields.firstName = data.firstName;
      }

      if (hasChanged(data.lastName, userProfile.lastName)) {
        changedFields.lastName = data.lastName;
      }

      if (
        hasChanged(data.nickname, userProfile.nickname) &&
        !isEmpty(data.nickname)
      ) {
        changedFields.nickname = data.nickname;
      }

      if (
        hasChanged(data.gender, userProfile.gender) &&
        !isEmpty(data.gender)
      ) {
        changedFields.gender = data.gender;
      }

      if (
        hasChanged(data.nationality, userProfile.nationality) &&
        !isEmpty(data.nationality)
      ) {
        changedFields.nationality = data.nationality;
      }

      // Xử lý birthDate - so sánh với giá trị đã format
      const currentFormattedBirthDate = formatDate(userProfile.birthDate);
      if (
        hasChanged(data.birthDate, currentFormattedBirthDate) &&
        !isEmpty(data.birthDate)
      ) {
        changedFields.birthDate = format(
          new Date(data.birthDate!),
          "yyyy-MM-dd'T'HH:mm:ssXXX"
        );
      }

      // Xử lý avatar
      if (hasChanged(data.avatar, userProfile.avatar)) {
        if (!isEmpty(data.avatar)) {
          changedFields.avatar = data.avatar;
        }
      }

      // Nếu không có trường nào thay đổi, không gửi request
      if (Object.keys(changedFields).length === 0) {
        toast({
          title: 'Thông báo',
          description: t('profile.noChanges'),
        });
        setIsSubmitting(false);
        return;
      }

      console.log('Payload sẽ gửi:', changedFields);

      // Lưu avatar cũ để xóa sau khi cập nhật thành công
      const oldAvatar =
        userProfile.avatar && userProfile.avatar.trim() !== ''
          ? userProfile.avatar
          : null;

      // Gọi API cập nhật thông tin với chỉ những trường thay đổi
      const response = await userApi.updateProfile(changedFields);
      console.log('API Response:', response);

      // Xóa avatar cũ sau khi cập nhật thành công (không phụ thuộc vào response structure)
      if (oldAvatar && data.avatar && data.avatar !== oldAvatar) {
        try {
          console.log('Đang xóa avatar cũ:', oldAvatar);
          await storageApi.deleteSingleFile(oldAvatar);
          console.log('Đã xóa avatar cũ thành công');
        } catch (deleteError) {
          console.error('Lỗi khi xóa avatar cũ:', deleteError);
          // Không throw lỗi vì cập nhật đã thành công, chỉ ghi log
          toast({
            title: 'Cảnh báo',
            description: t('profile.oldAvatarDeleteWarning'),
            variant: 'destructive',
          });
        }
      }

      // Cập nhật state nếu API trả về thành công
      if (response && response.data && response.success) {
        // Ép kiểu response data
        const profileData = response.data as ProfileResponse;
        console.log('Profile Data:', profileData);

        // Cập nhật UserProfile trong parent component - chỉ cập nhật những trường thay đổi
        const updatedProfile = { ...userProfile };

        if (changedFields.firstName)
          updatedProfile.firstName = profileData.firstName;
        if (changedFields.lastName)
          updatedProfile.lastName = profileData.lastName;
        if (changedFields.nickname !== undefined)
          updatedProfile.nickname = profileData.nickname || '';
        if (changedFields.avatar !== undefined)
          updatedProfile.avatar = profileData.avatar || '';
        if (changedFields.birthDate !== undefined)
          updatedProfile.birthDate = profileData.birthDate || '';
        if (changedFields.gender !== undefined)
          updatedProfile.gender = profileData.gender || '';
        if (changedFields.nationality !== undefined)
          updatedProfile.nationality = profileData.nationality || '';

        onProfileUpdated(updatedProfile);
      }

      // Cập nhật preview với avatar mới
      if (changedFields.avatar) {
        setAvatarPreview(data.avatar);
      }

      toast({
        title: 'Thành công',
        description: t('profile.updateSuccess'),
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      toast({
        title: 'Lỗi',
        description: t('profile.updateError'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Tính tên hiển thị từ firstName và lastName
  const displayName = `${userProfile?.firstName || ''} ${
    userProfile?.lastName || ''
  }`.trim();

  return (
    <Card className='border-0 shadow-none'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
          {t('profile.personalInfoTitle')}
        </CardTitle>
        <CardDescription className='text-base'>
          {t('profile.personalInfoDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {/* Avatar Section */}
          <div className='flex flex-col items-center space-y-4 px-2 sm:px-4'>
            <div className='relative group'>
              <Avatar
                className='h-24 w-24 sm:h-28 sm:w-28 cursor-pointer border-4 border-white dark:border-gray-800 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105'
                onClick={handleAvatarClick}
              >
                <AvatarImage
                  src={avatarPreview || undefined}
                  alt={displayName}
                  className='object-cover'
                />
                <AvatarFallback className='text-lg sm:text-xl bg-gradient-to-br from-primary to-primary/80 text-white'>
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div
                className='absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center cursor-pointer backdrop-blur-sm'
                onClick={handleAvatarClick}
              >
                <Camera className='h-6 w-6 sm:h-7 sm:w-7 text-white' />
              </div>
              <input
                type='file'
                ref={fileInputRef}
                className='hidden'
                accept='image/*'
                onChange={handleFileChange}
              />
            </div>
            <div className='text-center space-y-2'>
              <p className='text-xs sm:text-sm text-gray-500 dark:text-gray-400'>
                {t('profile.clickToChange')}
              </p>
              <h3 className='text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200'>
                {userProfile?.email}
              </h3>
              {userProfile?.createdAt && (
                <p className='text-xs sm:text-sm text-muted-foreground'>
                  {t('profile.memberSince')}{' '}
                  {new Date(userProfile.createdAt).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>

            {/* Cropper Section */}
            {showCropper && (
              <div className='mt-4 border rounded-md p-4 bg-slate-50 w-full'>
                <h4 className='text-sm font-medium mb-2'>
                  {t('profile.cropAvatar')}
                </h4>
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
                  <span className='text-xs'>{t('profile.zoom')}:</span>
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
                      setAvatarFile(null);
                    }}
                  >
                    {t('profile.cancel')}
                  </Button>
                  <Button
                    type='button'
                    variant='default'
                    size='sm'
                    onClick={uploadCroppedImage}
                    disabled={isUploadingAvatar}
                  >
                    {isUploadingAvatar
                      ? t('profile.processing')
                      : t('profile.cropAndUpload')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
                {/* Họ */}
                <FormField
                  control={form.control}
                  name='lastName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2'>
                        <User className='h-4 w-4' />
                        {t('profile.lastName')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('profile.lastNamePlaceholder')}
                          {...field}
                          className='h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg'
                        />
                      </FormControl>
                      <FormMessage className='text-xs text-red-500 dark:text-red-400' />
                    </FormItem>
                  )}
                />

                {/* Tên */}
                <FormField
                  control={form.control}
                  name='firstName'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2'>
                        <User className='h-4 w-4' />
                        {t('profile.firstName')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('profile.firstNamePlaceholder')}
                          {...field}
                          className='h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg'
                        />
                      </FormControl>
                      <FormMessage className='text-xs text-red-500 dark:text-red-400' />
                    </FormItem>
                  )}
                />

                {/* Biệt danh */}
                <FormField
                  control={form.control}
                  name='nickname'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        {t('profile.nickname')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('profile.nicknamePlaceholder')}
                          {...field}
                          className='h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg'
                        />
                      </FormControl>
                      <FormMessage className='text-xs text-red-500 dark:text-red-400' />
                    </FormItem>
                  )}
                />

                {/* Ngày sinh */}
                <FormField
                  control={form.control}
                  name='birthDate'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2'>
                        <Calendar className='h-4 w-4' />
                        {t('profile.birthDate')}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type='date'
                          {...field}
                          className='h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg'
                        />
                      </FormControl>
                      <FormMessage className='text-xs text-red-500 dark:text-red-400' />
                    </FormItem>
                  )}
                />

                {/* Giới tính */}
                <FormField
                  control={form.control}
                  name='gender'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                        {t('profile.gender')}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg'>
                            <SelectValue
                              placeholder={t('profile.selectGender')}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='male'>
                            {t('profile.male')}
                          </SelectItem>
                          <SelectItem value='female'>
                            {t('profile.female')}
                          </SelectItem>
                          <SelectItem value='other'>
                            {t('profile.other')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className='text-xs text-red-500 dark:text-red-400' />
                    </FormItem>
                  )}
                />

                {/* Quốc tịch */}
                <FormField
                  control={form.control}
                  name='nationality'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2'>
                        <Globe className='h-4 w-4' />
                        {t('profile.nationality')}
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoadingCountries}
                      >
                        <FormControl>
                          <SelectTrigger className='h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg'>
                            <SelectValue
                              placeholder={
                                isLoadingCountries
                                  ? t('profile.loading')
                                  : t('profile.selectNationality')
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className='max-h-[200px]'>
                          {countries.map((country) => (
                            <SelectItem key={country.id} value={country.name}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className='text-xs text-red-500 dark:text-red-400' />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <div className='flex justify-end pt-4'>
                <Button
                  type='submit'
                  disabled={isSubmitting || isUploadingAvatar}
                  className='min-w-[140px] h-11 text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 bg-primary hover:bg-primary/90 rounded-lg'
                >
                  {isSubmitting || isUploadingAvatar ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      {t('profile.updating')}
                    </>
                  ) : (
                    t('profile.updateInfo')
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
