'use client';

import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { useAchievements } from '../context/achievements-context';
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
import { Textarea } from '@/components/ui/textarea';
import type { Achievement } from '../data/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { storageApi } from '@/api-client/storage-api';
import { useLanguage } from '@/contexts/language-context';

// Custom hook để xử lý preview URL
function useIconUrlPreview(
  iconUrl: string,
  localFile: File | null,
  setPreviewUrl: (url: string) => void
): void {
  useEffect(() => {
    if (iconUrl && !localFile) {
      setPreviewUrl(iconUrl);
    }
  }, [iconUrl, localFile, setPreviewUrl]);
}

// Component con để xử lý FormField cho iconUrl
function IconUrlFormField({
  control,
  localFile,
  setLocalFile,
  previewUrl,
  setPreviewUrl,
  isUploadingIcon,
  handleFileChange,
  form,
}: {
  control: any; // Thay bằng kiểu chính xác từ react-hook-form
  localFile: File | null;
  setLocalFile: (file: File | null) => void;
  previewUrl: string;
  setPreviewUrl: (url: string) => void;
  isUploadingIcon: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  form: any; // Thay bằng kiểu chính xác từ react-hook-form
}) {
  useIconUrlPreview(form.getValues('iconUrl') || '', localFile, setPreviewUrl);

  const { t } = useLanguage();

  return (
    <FormField
      control={control}
      name="iconUrl"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-slate-700 dark:text-slate-300">
            {t('iconUpload.title')}
          </FormLabel>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Avatar className="h-20 w-20 rounded-md border-2 border-slate-200 dark:border-slate-700">
              <AvatarImage
                src={
                  previewUrl ||
                  '/placeholder.svg?height=80&width=80' ||
                  '/placeholder.svg' ||
                  '/placeholder.svg'
                }
                alt={t('iconUpload.preview')}
              />
              <AvatarFallback className="rounded-md bg-primary/10 dark:bg-primary/20">
                <Award className="h-10 w-10 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <FormControl>
                <Input
                  placeholder={t('iconUpload.urlPlaceholder')}
                  {...field}
                  className="bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  onChange={(e) => {
                    field.onChange(e);
                    if (e.target.value) {
                      form.setValue('iconFile', undefined);
                      setLocalFile(null);
                    }
                    setPreviewUrl(e.target.value);
                  }}
                />
              </FormControl>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="icon-upload"
                  className={`flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-600 transition-all cursor-pointer w-full ${
                    isUploadingIcon ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploadingIcon ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-slate-700 dark:text-slate-300"
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
                      <span>{t('iconUpload.uploading')}</span>
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4" />
                      <span>{t('iconUpload.uploadButton')}</span>
                    </>
                  )}
                </label>
                <input
                  id="icon-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.svg"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isUploadingIcon}
                />

                {localFile && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                    <Award className="h-3 w-3 mr-1" />
                    {localFile.name} ({(localFile.size / 1024).toFixed(1)}
                    {t('iconUpload.fileSize')})
                  </div>
                )}

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('iconUpload.formatInfo')}
                </p>
              </div>
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

const formSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên thành tựu'),
  description: z.string().optional(),
  iconUrl: z.string().optional(),
  iconFile: z
    .instanceof(File)
    .optional()
    .refine(
      (file) => !file || file.size <= 5 * 1024 * 1024, // 5MB
      'File không được vượt quá 5MB'
    )
    .refine(
      (file) =>
        !file ||
        ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'].includes(
          file.type
        ),
      'Chỉ chấp nhận file định dạng JPG, JPEG, PNG hoặc SVG'
    ),
  requiredPoints: z.coerce.number().min(1, 'Điểm yêu cầu phải lớn hơn 0'),
});

type AchievementForm = z.infer<typeof formSchema>;

interface Props {
  currentRow?: Achievement | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AchievementActionDialog({
  currentRow,
  open,
  onOpenChange,
}: Props) {
  const { updateAchievement, createAchievement } = useAchievements();
  const isEdit = !!currentRow;
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(
    currentRow?.iconUrl || ''
  );
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const { t } = useLanguage();

  const form = useForm<AchievementForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentRow?.name || '',
      description: currentRow?.description || '',
      iconUrl: currentRow?.iconUrl || '',
      iconFile: undefined,
      requiredPoints: currentRow?.requiredPoints || 100,
    },
  });

  useEffect(() => {
    if (currentRow) {
      form.reset({
        name: currentRow.name || '',
        description: currentRow.description || '',
        iconUrl: currentRow.iconUrl || '',
        iconFile: undefined,
        requiredPoints: currentRow.requiredPoints || 100,
      });
      setPreviewUrl(currentRow.iconUrl || '');
    } else {
      form.reset({
        name: '',
        description: '',
        iconUrl: '',
        iconFile: undefined,
        requiredPoints: 100,
      });
      setPreviewUrl('');
    }
  }, [open, currentRow, form]);

  const onSubmit = async (values: AchievementForm) => {
    try {
      setIsUploading(true);

      // Đã upload ảnh khi chọn file, không cần upload lại
      const iconUrl = values.iconUrl;

      if (isEdit && currentRow?.achievementId) {
        const changedFields: any = {};

        // Kiểm tra từng trường và chỉ thêm vào changedFields nếu có thay đổi
        if (values.name !== currentRow.name) {
          changedFields.name = values.name;
        }
        if (values.description !== currentRow.description) {
          changedFields.description = values.description;
        }
        if (iconUrl !== currentRow.iconUrl) {
          if (currentRow.iconUrl) {
            try {
              await storageApi.deleteSingleFile(currentRow.iconUrl);
              console.log('Old icon deleted successfully', currentRow.iconUrl);
            } catch (error) {
              console.error('Error deleting old icon:', error);
              // Continue with update even if delete fails
            }
          }
          changedFields.iconUrl = iconUrl;
        }
        if (values.requiredPoints !== currentRow.requiredPoints) {
          changedFields.requiredPoints = values.requiredPoints;
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

        await updateAchievement(currentRow.achievementId, changedFields);
      } else {
        const achievementData = {
          ...values,
        };
        delete achievementData.iconFile; // Vẫn xóa trường iconFile vì không cần gửi lên server
        await createAchievement(achievementData);
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

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Check file type
      if (
        !['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'].includes(
          file.type
        )
      ) {
        toast({
          title: 'Định dạng không hỗ trợ',
          description: 'Chỉ chấp nhận file định dạng JPG, JPEG, PNG hoặc SVG',
          variant: 'destructive',
        });
        return;
      }

      // Check file size
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File quá lớn',
          description: 'File không được vượt quá 5MB',
          variant: 'destructive',
        });
        return;
      }

      try {
        setIsUploadingIcon(true);

        // Upload file
        const response = await storageApi.uploadSingleFile(
          file,
          'achievements'
        );

        console.log('Upload response:', response);

        // Sử dụng kiểu any để tránh lỗi kiểu dữ liệu
        const responseData = response.data as any;

        if (
          responseData &&
          responseData.success === true &&
          responseData.data
        ) {
          // Lấy URL từ response data
          const fileUrl = responseData.data.fileUrl;

          if (fileUrl) {
            console.log('File URL:', fileUrl);
            // Cập nhật trường iconUrl trong form
            form.setValue('iconUrl', fileUrl);
            setPreviewUrl(fileUrl);
            setLocalFile(file);

            // Hiển thị thông báo thành công
            toast({
              title: 'Thành công',
              description: 'Đã tải lên biểu tượng thành tựu',
            });
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
        console.error('Error uploading file:', error);
        toast({
          title: 'Lỗi',
          description: 'Đã xảy ra lỗi khi tải lên. Vui lòng thử lại.',
          variant: 'destructive',
        });
      } finally {
        setIsUploadingIcon(false);
      }
    },
    [form, setPreviewUrl, setLocalFile, setIsUploadingIcon]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] p-0 gap-0 overflow-hidden border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-zinc-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="w-full"
        >
          <DialogHeader className="p-6 pb-2 border-b bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-slate-700">
            <DialogTitle className="text-xl text-slate-900 dark:text-slate-100">
              {isEdit ? t('achievementEditTitle') : t('achievementAddTitle')}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {isEdit ? t('achievementEditDesc') : t('achievementAddDesc')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[65vh] px-6 py-4 bg-white dark:bg-zinc-900">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-white dark:bg-zinc-800 p-5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <h3 className="text-md font-medium text-slate-900 dark:text-slate-100 mb-4">
                    {t('achievementBasicInfo')}
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300">
                            {t('achievementName')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('achievementNamePlaceholder')}
                              {...field}
                              className="bg-slate-50 dark:bg-zinc-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300">
                            {t('achievementDescription')}
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t(
                                'achievementDescriptionPlaceholder'
                              )}
                              {...field}
                              className="bg-slate-50 dark:bg-zinc-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="requiredPoints"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 dark:text-slate-300">
                            {t('achievementRequiredPoints')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder={t(
                                'achievementRequiredPointsPlaceholder'
                              )}
                              {...field}
                              className="bg-slate-50 dark:bg-zinc-700 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
                            />
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
                  className="bg-white dark:bg-zinc-800 p-5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <h3 className="text-md font-medium text-slate-900 dark:text-slate-100 mb-4">
                    {t('achievementIcon')}
                  </h3>
                  <IconUrlFormField
                    control={form.control}
                    localFile={localFile}
                    setLocalFile={setLocalFile}
                    previewUrl={previewUrl}
                    setPreviewUrl={setPreviewUrl}
                    isUploadingIcon={isUploadingIcon}
                    handleFileChange={handleFileChange}
                    form={form}
                  />
                </motion.div>
              </form>
            </Form>
          </ScrollArea>
          <DialogFooter className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-2 bg-white dark:bg-zinc-900">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-900 dark:hover:text-slate-100 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
            >
              {t('achievementCancel')}
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
                  {t('achievementUpdating')}
                </div>
              ) : isEdit ? (
                t('achievementSubmit')
              ) : (
                t('achievementAdd')
              )}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
