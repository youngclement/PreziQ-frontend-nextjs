'use client';

import { useUsers } from '../context/users-context';
import { useRoles } from '../../roles/context/roles-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PasswordInput } from '@/components/dashboard/password-input';
import { SelectDropdown } from '@/components/dashboard/select-dropdown';
import { userTypes } from '../../users/data/data';
import { User } from '../data/schema';
import { useState, useEffect, useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  IconMail,
  IconPhone,
  IconUser,
  IconCalendar,
  IconFlag,
  IconShield,
  IconPhoto,
  IconUserCircle,
  IconUpload,
  IconAlertCircle,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { storageApi } from '@/api-client/storage-api';
import dynamic from 'next/dynamic';
import { getCroppedImg } from '../../../../utils/crop-image';
import { useLanguage } from '@/contexts/language-context';

// Dùng any thay vì CropperProps để tránh lỗi
const Cropper = dynamic(
  () => import('react-easy-crop').then((mod) => mod.default),
  {
    ssr: false,
  }
);

const formSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
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
  firstName: z.string().min(1, 'Vui lòng nhập tên'),
  lastName: z.string().min(1, 'Vui lòng nhập họ'),
  nickname: z.string().optional(),
  avatar: z.string().optional(),
  avatarFile: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size >= 1024, // 1KB
      'File phải lớn hơn 1KB'
    )
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024, // 5MB
      'File không được vượt quá 5MB'
    )
    .refine(
      (file) =>
        !file || ['image/jpeg', 'image/jpg', 'image/png'].includes(file.type),
      'Chỉ chấp nhận file định dạng JPG, JPEG hoặc PNG'
    ),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  isVerified: z.boolean(),
  roleIds: z.array(z.string()),
});

type UserForm = z.infer<typeof formSchema>;

interface Props {
  currentRow?: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Thêm interface cho kết quả crop
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
  const { updateUser, createUser } = useUsers();
  const { roles } = useRoles();
  const { t } = useLanguage();
  const isEdit = !!currentRow;
  const [isUploading, setIsUploading] = useState(false);

  // Log để debug
  console.log('Current user roles:', currentRow?.roles);
  console.log('Available roles:', roles);

  // Chuẩn bị roleIds mặc định
  const defaultRoleIds = useMemo(() => {
    if (
      currentRow?.roles &&
      Array.isArray(currentRow.roles) &&
      currentRow.roles.length > 0
    ) {
      console.log(
        'Vai trò người dùng chi tiết:',
        JSON.stringify(currentRow.roles, null, 2)
      );

      try {
        // Sử dụng any để lấy id
        return (currentRow.roles as any[])
          .map((role) => {
            return role.roleId || role.id || '';
          })
          .filter(Boolean);
      } catch (error) {
        console.error('Lỗi khi xử lý roleIds:', error);
        return [];
      }
    }
    // Nếu không có role, trả về mảng rỗng
    return [];
  }, [currentRow]);

  console.log('Default roleIds:', defaultRoleIds);

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: currentRow?.email || '',
      phoneNumber: currentRow?.phoneNumber || '',
      firstName: currentRow?.firstName || '',
      lastName: currentRow?.lastName || '',
      nickname: currentRow?.nickname || '',
      avatar: currentRow?.avatar || '',
      avatarFile: undefined,
      birthDate: currentRow?.birthDate || '',
      gender: currentRow?.gender || '',
      nationality: currentRow?.nationality || '',
      isVerified: currentRow?.isVerified || false,
      roleIds: defaultRoleIds,
    },
  });

  const onSubmit = async (values: UserForm) => {
    try {
      console.log('Form values on submit:', values);

      setIsUploading(true);

      // Đã upload ảnh khi chọn file, không cần upload lại
      const avatarUrl = values.avatar;

      if (isEdit && currentRow?.userId) {
        const changedFields: any = {};

        // Kiểm tra từng trường và chỉ thêm vào changedFields nếu có thay đổi
        if (values.email !== currentRow.email) {
          changedFields.email = values.email;
        }
        if (
          values.phoneNumber !== currentRow.phoneNumber &&
          !(
            (!currentRow.phoneNumber || currentRow.phoneNumber === '') &&
            values.phoneNumber === ''
          )
        ) {
          changedFields.phoneNumber = values.phoneNumber;
        }
        if (values.firstName !== currentRow.firstName) {
          changedFields.firstName = values.firstName;
        }
        if (values.lastName !== currentRow.lastName) {
          changedFields.lastName = values.lastName;
        }
        if (values.nickname !== currentRow.nickname) {
          changedFields.nickname = values.nickname;
        }
        if (avatarUrl !== currentRow.avatar) {
          if (currentRow.avatar) {
            try {
              await storageApi.deleteSingleFile(currentRow.avatar);
            } catch (error) {
              console.error('Error deleting old avatar:', error);
              // Tiếp tục cập nhật ngay cả khi xóa thất bại
            }
          }
          changedFields.avatar = avatarUrl;
        }
        if (values.birthDate !== currentRow.birthDate) {
          changedFields.birthDate = values.birthDate;
        }
        if (values.gender !== currentRow.gender) {
          changedFields.gender = values.gender;
        }
        if (values.nationality !== currentRow.nationality) {
          changedFields.nationality = values.nationality;
        }
        if (values.isVerified !== currentRow.isVerified) {
          changedFields.isVerified = values.isVerified;
        }

        // Kiểm tra nếu roleIds đã thay đổi
        let currentRoleIds: string[] = [];
        try {
          currentRoleIds = currentRow.roles
            .map((role) => {
              // Truy cập an toàn các thuộc tính
              const r = role as Record<string, any>;
              return r.roleId || r.id || '';
            })
            .filter((id) => id !== '');
        } catch (error) {
          console.error('Lỗi khi xử lý roleIds:', error);
        }

        // So sánh mảng roleIds
        const hasRoleChanged =
          JSON.stringify(values.roleIds) !== JSON.stringify(currentRoleIds);
        if (hasRoleChanged) {
          console.log('roleIds đã thay đổi:', {
            mới: values.roleIds,
            cũ: currentRoleIds,
          });
          changedFields.roleIds = values.roleIds;
        }

        // Nếu không có trường nào thay đổi, không gửi request
        if (Object.keys(changedFields).length === 0) {
          toast({
            title: 'Thông báo',
            description: 'Không có thông tin nào được thay đổi.',
          });
          setIsUploading(false);
          return;
        }

        await updateUser(currentRow.userId, changedFields);
      } else {
        const userData = {
          ...values,
        };
        delete userData.avatarFile; // Vẫn xóa trường avatarFile vì không cần gửi lên server
        await createUser(userData);
      }
      setIsUploading(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Lỗi',
        description: 'Đã xảy ra lỗi. Vui lòng thử lại.',
        variant: 'destructive',
      });
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[800px] p-0 gap-0 overflow-hidden border-slate-200 shadow-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full"
        >
          <DialogHeader className="p-6 pb-2 border-b bg-slate-50">
            <DialogTitle className="text-xl">
              {isEdit
                ? t('userManagement.editUser')
                : t('userManagement.addUser')}
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              {isEdit
                ? t('userManagement.editUserDesc')
                : t('userManagement.addUserDesc')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[65vh] px-6 py-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white p-5 rounded-md border border-slate-200 shadow-sm"
                >
                  <h3 className="text-md font-medium text-slate-900 mb-4">
                    {t('userManagement.basicInfo')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('userManagement.columns.email')}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IconMail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                              <Input
                                placeholder="example@email.com"
                                {...field}
                                className="bg-slate-50 pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('userManagement.phoneNumber')}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IconPhone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                              <Input
                                placeholder={t(
                                  'userManagement.phoneNumberPlaceholder'
                                )}
                                {...field}
                                className="bg-slate-50 pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('userManagement.columns.lastName')}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IconUser className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                              <Input
                                placeholder={t(
                                  'userManagement.lastNamePlaceholder'
                                )}
                                {...field}
                                className="bg-slate-50 pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('userManagement.columns.firstName')}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IconUser className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                              <Input
                                placeholder={t(
                                  'userManagement.firstNamePlaceholder'
                                )}
                                {...field}
                                className="bg-slate-50 pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="bg-white p-5 rounded-md border border-slate-200 shadow-sm"
                >
                  <h3 className="text-md font-medium text-slate-900 mb-4">
                    {t('userManagement.additionalInfo')}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nickname"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('userManagement.nickname')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t(
                                'userManagement.nicknamePlaceholder'
                              )}
                              {...field}
                              className="bg-slate-50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="birthDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('userManagement.birthDate')}</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IconCalendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                              <Input
                                type="date"
                                placeholder={t(
                                  'userManagement.birthDatePlaceholder'
                                )}
                                {...field}
                                className="bg-slate-50 pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('userManagement.gender')}</FormLabel>
                          <Select
                            value={field.value || ''}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-slate-50">
                                <SelectValue
                                  placeholder={t(
                                    'userManagement.genderPlaceholder'
                                  )}
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">
                                {t('userManagement.genderOptions.male')}
                              </SelectItem>
                              <SelectItem value="female">
                                {t('userManagement.genderOptions.female')}
                              </SelectItem>
                              <SelectItem value="other">
                                {t('userManagement.genderOptions.other')}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="nationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t('userManagement.nationality')}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IconFlag className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                              <Input
                                placeholder={t(
                                  'userManagement.nationalityPlaceholder'
                                )}
                                {...field}
                                className="bg-slate-50 pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                  className="bg-white p-5 rounded-md border border-slate-200 shadow-sm"
                >
                  <h3 className="text-md font-medium text-slate-900 mb-4">
                    {t('userManagement.imageAndPermissions')}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="avatar"
                      render={({ field }) => {
                        const [previewUrl, setPreviewUrl] = useState<string>(
                          field.value || ''
                        );
                        const [localFile, setLocalFile] = useState<File | null>(
                          null
                        );
                        const [isUploadingAvatar, setIsUploadingAvatar] =
                          useState(false);
                        // Thêm các state cho việc crop ảnh
                        const [showCropper, setShowCropper] = useState(false);
                        const [crop, setCrop] = useState({ x: 0, y: 0 });
                        const [zoom, setZoom] = useState(1);
                        const [croppedAreaPixels, setCroppedAreaPixels] =
                          useState<CropArea | null>(null);
                        const [originalImageUrl, setOriginalImageUrl] =
                          useState<string>('');

                        useEffect(() => {
                          if (field.value && !localFile) {
                            setPreviewUrl(field.value);
                          }
                        }, [field.value, localFile]);

                        const handleFileChange = async (
                          e: React.ChangeEvent<HTMLInputElement>
                        ) => {
                          const file = e.target.files?.[0];
                          if (!file) return;

                          // Check file type
                          if (
                            !['image/jpeg', 'image/jpg', 'image/png'].includes(
                              file.type
                            )
                          ) {
                            toast({
                              title: 'Định dạng không hỗ trợ',
                              description:
                                'Chỉ chấp nhận file định dạng JPG, JPEG hoặc PNG',
                              variant: 'destructive',
                            });
                            return;
                          }

                          // Check file size
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

                          // Tạo preview URL
                          const objectUrl = URL.createObjectURL(file);
                          setOriginalImageUrl(objectUrl);
                          setShowCropper(true);
                          setLocalFile(file);
                        };

                        const onCropComplete = (
                          croppedArea: any,
                          croppedAreaPixels: any
                        ) => {
                          setCroppedAreaPixels(croppedAreaPixels);
                        };

                        const uploadCroppedImage = async () => {
                          try {
                            if (
                              !croppedAreaPixels ||
                              !localFile ||
                              !originalImageUrl
                            )
                              return;

                            setIsUploadingAvatar(true);

                            // Tạo ảnh đã crop
                            const croppedImageBlob = await getCroppedImg(
                              originalImageUrl,
                              croppedAreaPixels
                            );

                            if (!croppedImageBlob) {
                              throw new Error('Không thể tạo ảnh đã cắt');
                            }

                            // Tạo file từ blob
                            const croppedFile = new File(
                              [croppedImageBlob],
                              localFile.name,
                              { type: localFile.type }
                            );

                            // Tạo preview URL
                            const croppedPreviewUrl =
                              URL.createObjectURL(croppedImageBlob);
                            setPreviewUrl(croppedPreviewUrl);

                            // Upload file đã cắt
                            const response = await storageApi.uploadSingleFile(
                              croppedFile,
                              'users'
                            );

                            console.log('Upload response:', response);

                            // Sử dụng kiểu any để tránh lỗi kiểu dữ liệu
                            const responseData = response.data as any;

                            if (
                              responseData &&
                              responseData.success === true &&
                              responseData.data
                            ) {
                              // Lấy URL từ response data (với kiểu 'any')
                              const fileUrl = responseData.data.fileUrl;

                              if (fileUrl) {
                                console.log('File URL:', fileUrl);
                                // Cập nhật trường avatar trong form
                                field.onChange(fileUrl);

                                // Hiển thị thông báo thành công
                                toast({
                                  title: 'Thành công',
                                  description: 'Đã tải lên ảnh đại diện đã cắt',
                                });

                                // Đóng cropper
                                setShowCropper(false);
                              } else {
                                toast({
                                  title: 'Lỗi',
                                  description:
                                    'Không tìm thấy URL file trong phản hồi',
                                  variant: 'destructive',
                                });
                              }
                            } else {
                              toast({
                                title: 'Lỗi',
                                description:
                                  'Không thể tải lên hình ảnh. Vui lòng thử lại.',
                                variant: 'destructive',
                              });
                            }
                          } catch (error) {
                            console.error(
                              'Error uploading cropped file:',
                              error
                            );
                            toast({
                              title: 'Lỗi',
                              description:
                                'Đã xảy ra lỗi khi tải lên. Vui lòng thử lại.',
                              variant: 'destructive',
                            });
                          } finally {
                            setIsUploadingAvatar(false);
                          }
                        };

                        return (
                          <FormItem>
                            <FormLabel>{t('userManagement.avatar')}</FormLabel>
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                              <Avatar className="h-20 w-20 rounded-md border-2 border-slate-200">
                                <AvatarImage
                                  src={
                                    previewUrl ||
                                    `https://ui-avatars.com/api/?name=${form.watch(
                                      'firstName'
                                    )}+${form.watch(
                                      'lastName'
                                    )}&size=80&background=random`
                                  }
                                  alt="Avatar preview"
                                />
                                <AvatarFallback className="rounded-md bg-slate-100">
                                  <IconUserCircle className="h-10 w-10 text-slate-400" />
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-2">
                                <FormControl>
                                  <div className="relative">
                                    <IconPhoto className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <Input
                                      placeholder="https://example.com/avatar.jpg"
                                      {...field}
                                      className="bg-slate-50 pl-10"
                                      onChange={(e) => {
                                        field.onChange(e);
                                        if (e.target.value) {
                                          form.setValue(
                                            'avatarFile',
                                            undefined
                                          );
                                          setLocalFile(null);
                                        }
                                        setPreviewUrl(e.target.value);
                                      }}
                                    />
                                  </div>
                                </FormControl>

                                <div className="flex flex-col gap-2">
                                  <label
                                    htmlFor="avatar-upload"
                                    className={`flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition-all cursor-pointer w-full ${
                                      isUploadingAvatar
                                        ? 'opacity-50 cursor-not-allowed'
                                        : ''
                                    }`}
                                  >
                                    {isUploadingAvatar ? (
                                      <>
                                        <svg
                                          className="animate-spin h-4 w-4 text-slate-700"
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
                                        <span>
                                          {t('userManagement.uploading')}
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <IconUpload className="h-4 w-4" />
                                        <span>
                                          {t('userManagement.uploadAvatar')}
                                        </span>
                                      </>
                                    )}
                                  </label>
                                  <input
                                    id="avatar-upload"
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isUploadingAvatar}
                                  />

                                  {localFile && !showCropper && (
                                    <div className="text-xs text-slate-500 flex items-center">
                                      <IconAlertCircle className="h-3 w-3 mr-1" />
                                      {localFile.name} (
                                      {(localFile.size / 1024).toFixed(1)}KB)
                                    </div>
                                  )}

                                  <p className="text-xs text-slate-500">
                                    {t('userManagement.avatarFormat')}
                                  </p>
                                </div>
                              </div>
                            </div>
                            {showCropper && (
                              <div className="mt-4 border rounded-md p-4 bg-slate-50">
                                <h4 className="text-sm font-medium mb-2">
                                  {t('userManagement.cropAvatar')}
                                </h4>
                                <div className="relative h-[300px] w-full mb-4">
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
                                      cropShape="rect"
                                      {...({} as any)}
                                    />
                                  )}
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                  <span className="text-xs">
                                    {t('userManagement.zoom')}:
                                  </span>
                                  <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) =>
                                      setZoom(Number(e.target.value))
                                    }
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
                                    {t('userManagement.cancel')}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="default"
                                    size="sm"
                                    onClick={uploadCroppedImage}
                                    disabled={isUploadingAvatar}
                                  >
                                    {isUploadingAvatar
                                      ? t('userManagement.processing')
                                      : t('userManagement.cropAndUpload')}
                                  </Button>
                                </div>
                              </div>
                            )}
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="roleIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('userManagement.role')}</FormLabel>
                          <Select
                            value={
                              field.value?.length > 0 ? field.value[0] : ''
                            }
                            onValueChange={(value) => {
                              console.log('Role selected:', value);
                              if (value) {
                                field.onChange([value]);
                                console.log('Field after change:', field.value);
                              }
                            }}
                          >
                            <FormControl>
                              <div className="relative">
                                <IconShield className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 z-10" />
                                <SelectTrigger className="bg-slate-50 pl-10">
                                  <SelectValue
                                    placeholder={t(
                                      'userManagement.rolePlaceholder'
                                    )}
                                  />
                                </SelectTrigger>
                              </div>
                            </FormControl>
                            <SelectContent>
                              {roles.map((role) => {
                                const roleIdentifier = role.roleId;
                                return (
                                  <SelectItem
                                    key={roleIdentifier}
                                    value={roleIdentifier || ''}
                                  >
                                    {role.name}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-4">
                    <FormField
                      control={form.control}
                      name="isVerified"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4 bg-slate-50">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              {t('userManagement.emailVerification')}
                            </FormLabel>
                            <div className="text-sm text-slate-500">
                              {field.value
                                ? t('userManagement.userVerified')
                                : t('userManagement.userUnverified')}
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-slate-900"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </motion.div>
              </form>
            </Form>
          </ScrollArea>
          <DialogFooter className="p-6 border-t flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="transition-all duration-200 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900"
            >
              {t('userManagement.cancel')}
            </Button>
            <Button
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={form.formState.isSubmitting || isUploading}
              className="bg-primary transition-all duration-200 hover:bg-primary/90 hover:shadow-lg hover:scale-105"
            >
              {form.formState.isSubmitting || isUploading ? (
                <div className="flex items-center gap-2">
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
                  {t('userManagement.processing')}
                </div>
              ) : isEdit ? (
                t('userManagement.update')
              ) : (
                t('userManagement.add')
              )}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
