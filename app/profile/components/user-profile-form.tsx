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
import { Loader2, Camera, User, Calendar, Globe } from 'lucide-react';
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

// Schema validation - đã xóa phoneNumber
const profileFormSchema = z.object({
  firstName: z
    .string()
    .min(1, {
      message: 'Tên không được để trống.',
    })
    .max(50, {
      message: 'Tên không được vượt quá 50 ký tự.',
    }),
  lastName: z
    .string()
    .min(1, {
      message: 'Họ không được để trống.',
    })
    .max(50, {
      message: 'Họ không được vượt quá 50 ký tự.',
    }),
  nickname: z
    .string()
    .max(30, {
      message: 'Biệt danh không được vượt quá 30 ký tự.',
    })
    .optional()
    .or(z.literal('')),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  nationality: z
    .string()
    .max(50, {
      message: 'Quốc tịch không được vượt quá 50 ký tự.',
    })
    .optional(),
  avatar: z.string().optional(),
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    userProfile?.avatar || undefined
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoadingCountries, setIsLoadingCountries] = useState(false);

  // Log để kiểm tra dữ liệu
  console.log('UserProfile from props:', userProfile);

  // Test toast khi component mount
  useEffect(() => {
    console.log('UserProfileForm mounted');
    // Test toast để đảm bảo nó hoạt động
    // sonnerToast.info('Component đã được tải');
  }, []);

  // Fetch countries data
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
        sonnerToast.error('Không thể tải danh sách quốc gia');
      } finally {
        setIsLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  // Hàm format ngày từ ISO string sang định dạng yyyy-MM-dd
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      return format(date, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Lỗi khi format ngày:', error);
      return '';
    }
  };

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
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Kiểm tra định dạng file
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      sonnerToast.error('Chỉ chấp nhận file ảnh JPG, PNG hoặc GIF');
      return;
    }

    // Kiểm tra kích thước file (tối đa 5MB)
    if (file.size > 5 * 1024 * 1024) {
      sonnerToast.error('Kích thước file không được vượt quá 5MB');
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target) {
        setAvatarPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  async function onSubmit(data: ProfileFormValues) {
    try {
      setIsSubmitting(true);

      if (data.avatar !== userProfile.avatar && userProfile.avatar) {
        try {
          await storageApi.deleteSingleFile(userProfile.avatar);
        } catch (error) {
          console.error('Lỗi khi xóa avatar cũ:', error);
          // Tiếp tục cập nhật ngay cả khi xóa thất bại
        }
      }

      // Chuyển đổi lại định dạng ngày sinh (nếu có)
      const formattedData = {
        firstName: data.firstName,
        lastName: data.lastName,
        nickname: data.nickname || '',
        avatar: data.avatar || '',
        gender: data.gender || '',
        nationality: data.nationality || '',
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

  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Tính tên hiển thị từ firstName và lastName
  const displayName = `${userProfile?.firstName || ''} ${userProfile?.lastName || ''
    }`.trim();

  return (
    <Card className='border-0 shadow-none'>
      <CardHeader className='space-y-1'>
        <CardTitle className='text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent'>
          Thông tin cá nhân
        </CardTitle>
        <CardDescription className='text-base'>
          Cập nhật và quản lý thông tin cá nhân của bạn
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
                Nhấn vào ảnh để thay đổi
              </p>
              <h3 className='text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200'>
                {userProfile?.email}
              </h3>
              {userProfile?.createdAt && (
                <p className='text-xs sm:text-sm text-muted-foreground'>
                  Thành viên từ{' '}
                  {new Date(userProfile.createdAt).toLocaleDateString('vi-VN')}
                </p>
              )}
            </div>
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
                        Họ
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Nguyễn'
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
                        Tên
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Văn A'
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
                        Biệt danh
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Nhập biệt danh (tùy chọn)'
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
                        Ngày sinh
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
                        Giới tính
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg'>
                            <SelectValue placeholder='Chọn giới tính' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Nam'>Nam</SelectItem>
                          <SelectItem value='Nữ'>Nữ</SelectItem>
                          <SelectItem value='Khác'>Khác</SelectItem>
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
                        Quốc tịch
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className='h-11 transition-all duration-200 focus:ring-2 focus:ring-primary/20 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg'>
                            <SelectValue
                              placeholder={
                                isLoadingCountries
                                  ? 'Đang tải...'
                                  : 'Chọn quốc tịch'
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
                  disabled={isLoading}
                  className='min-w-[140px] h-11 text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 bg-primary hover:bg-primary/90 rounded-lg'
                >
                  {isLoading ? (
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
        </div>
      </CardContent>
    </Card>
  );
}
