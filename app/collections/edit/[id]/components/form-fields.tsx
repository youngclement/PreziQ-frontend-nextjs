import { Sparkles } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Control } from 'react-hook-form';
import { CollectionFormValues, TopicType } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { collectionsApi } from '@/api-client';
import { Loader2 } from 'lucide-react';

interface FormFieldsProps {
  control: Control<CollectionFormValues>;
  form: any;
  collectionId: string;
}

export function FormFields({ control, form, collectionId }: FormFieldsProps) {
  const [isUpdatingPublishStatus, setIsUpdatingPublishStatus] = useState(false);
  const { toast } = useToast();

  const topics: TopicType[] = [
    'ART',
    'SCIENCE',
    'TECHNOLOGY',
    'HISTORY',
    'LITERATURE',
    'ENTERTAINMENT',
    'SPORTS',
    'GEOGRAPHY',
    'HEALTH',
    'EDUCATION',
    'NATURE',
    'CULTURE',
    'BUSINESS',
    'PHILOSOPHY',
    'FOOD',
    'TRIVIA',
  ];

  const getTopicLabel = (topic: TopicType): string => {
    return topic.charAt(0) + topic.slice(1).toLowerCase();
  };

  const handlePublishToggle = async (checked: boolean) => {
    if (!collectionId) return;

    setIsUpdatingPublishStatus(true);
    try {
      // Call API to update just the isPublished field
      const response = await collectionsApi.updateCollection(collectionId, {
        isPublished: checked,
      });

      // Update the form value
      form.setValue('isPublished', checked);

      toast({
        title: checked ? 'Đã xuất bản bộ sưu tập' : 'Đã hủy xuất bản bộ sưu tập',
        description: checked
          ? 'Bộ sưu tập của bạn hiện đang công khai'
          : 'Bộ sưu tập của bạn đang ở chế độ riêng tư',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating publish status:', error);

      // Revert the form value on error
      form.setValue('isPublished', !checked);

      toast({
        title: 'Cập nhật thất bại',
        description: 'Không thể cập nhật trạng thái bộ sưu tập. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPublishStatus(false);
    }
  };

  return (
    <div className='space-y-6'>
      <FormField
        control={control}
        name='title'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              Tiêu đề <span className='text-red-500'>*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder='Nhập tiêu đề bộ sưu tập'
                className='border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 rounded-md'
                {...field}
              />
            </FormControl>
            <FormDescription className='text-xs text-gray-500 dark:text-gray-400'>
              Giữ ngắn gọn và dễ nhớ
            </FormDescription>
            <FormMessage className='text-xs' />
          </FormItem>
        )}
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <FormField
          control={control}
          name='topic'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Chủ đề <span className='text-red-500'>*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className='border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 rounded-md'>
                    <SelectValue placeholder='Chọn chủ đề' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {topics.map((topic) => (
                    <SelectItem key={topic} value={topic}>
                      {getTopicLabel(topic)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription className='text-xs text-gray-500 dark:text-gray-400'>
                Chọn chủ đề phù hợp với nội dung
              </FormDescription>
              <FormMessage className='text-xs' />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name='defaultBackgroundMusic'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Nhạc nền
              </FormLabel>
              <FormControl>
                <Input
                  placeholder='Nhập tên file nhạc (ví dụ: technology.mp3)'
                  className='border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 rounded-md'
                  {...field}
                />
              </FormControl>
              <FormDescription className='text-xs text-gray-500 dark:text-gray-400'>
                Nhạc nền khi trình chiếu
              </FormDescription>
              <FormMessage className='text-xs' />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name='description'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              Mô tả <span className='text-red-500'>*</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder='Mô tả về bộ sưu tập của bạn'
                className='min-h-[150px] border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 rounded-md resize-y'
                {...field}
              />
            </FormControl>
            <FormDescription className='text-xs text-gray-500 dark:text-gray-400'>
              Điều gì làm cho bộ sưu tập này đặc biệt?
            </FormDescription>
            <FormMessage className='text-xs' />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name='isPublished'
        render={({ field }) => (
          <FormItem className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700/50'>
            <div className='space-y-1'>
              <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Công khai bộ sưu tập
              </FormLabel>
              <FormDescription className='text-xs text-gray-500 dark:text-gray-400'>
                Hiển thị với tất cả mọi người
              </FormDescription>
            </div>
            <FormControl>
              <div className='flex items-center'>
                {isUpdatingPublishStatus && (
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                )}
                <Switch
                  checked={field.value}
                  onCheckedChange={handlePublishToggle}
                  disabled={isUpdatingPublishStatus}
                  className='data-[state=checked]:bg-indigo-600'
                />
              </div>
            </FormControl>
          </FormItem>
        )}
      />

      {/* Tips Section */}
      <div className='p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-200 dark:border-indigo-900/50'>
        <div className='flex items-center gap-2 mb-2'>
          <Sparkles className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
          <h3 className='text-sm font-medium text-indigo-700 dark:text-indigo-300'>
            Mẹo chuyên gia
          </h3>
        </div>
        <ul className='text-xs text-gray-600 dark:text-gray-300 space-y-1 ml-6 list-disc'>
          <li>Chọn tiêu đề gây ấn tượng</li>
          <li>Viết mô tả rõ ràng và hấp dẫn</li>
          <li>Chọn chủ đề phù hợp với nội dung của bạn</li>
          <li>Sử dụng hình ảnh chất lượng cao, liên quan</li>
          <li>
            Khi chỉnh sửa collection, các hoạt động quiz sẽ được giữ nguyên
          </li>
          <li>Chỉ công khai khi đã sẵn sàng</li>
        </ul>
      </div>
    </div>
  );
}
