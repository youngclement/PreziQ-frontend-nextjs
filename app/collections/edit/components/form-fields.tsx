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
import { useLanguage } from '@/contexts/language-context';
import { MusicSelector } from './music-selector';

interface FormFieldsProps {
  control: Control<CollectionFormValues>;
}

export function FormFields({ control }: FormFieldsProps) {
  const { t } = useLanguage();

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

  return (
    <div className='space-y-6'>
      <FormField
        control={control}
        name='title'
        render={({ field }) => (
          <FormItem>
            <FormLabel className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              {t('collectionForm.titleLabel')}{' '}
              <span className='text-red-500'>*</span>
            </FormLabel>
            <FormControl>
              <Input
                placeholder={t('collectionForm.titlePlaceholder')}
                className='border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 rounded-md'
                {...field}
              />
            </FormControl>
            <FormDescription className='text-xs text-gray-500 dark:text-gray-400'>
              {t('collectionForm.titleDescription')}
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
                {t('collectionForm.topicLabel')}{' '}
                <span className='text-red-500'>*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className='border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 rounded-md'>
                    <SelectValue
                      placeholder={t('collectionForm.topicPlaceholder')}
                    />
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
                {t('collectionForm.topicDescription')}
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
                {t('collectionForm.backgroundMusicLabel')}
              </FormLabel>
              <FormControl>
                <MusicSelector
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription className='text-xs text-gray-500 dark:text-gray-400'>
                {t('collectionForm.backgroundMusicDescription')}
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
              {t('collectionForm.descriptionLabel')}{' '}
              <span className='text-red-500'>*</span>
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder={t('collectionForm.descriptionPlaceholder')}
                className='min-h-[150px] border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 rounded-md resize-y'
                {...field}
              />
            </FormControl>
            <FormDescription className='text-xs text-gray-500 dark:text-gray-400'>
              {t('collectionForm.descriptionDescription')}
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
                {t('collectionForm.publishLabel')}
              </FormLabel>
              <FormDescription className='text-xs text-gray-500 dark:text-gray-400'>
                {t('collectionForm.publishDescription')}
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                className='data-[state=checked]:bg-indigo-600'
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Tips Section */}
      {/* <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-200 dark:border-indigo-900/50">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
            {t('collectionForm.expertTips')}
          </h3>
        </div>
        <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 ml-6 list-disc">
          {((t('collectionForm.tips', { returnObjects: true }) as any) || []).map(
            (tip: string, index: number) => (
              <li key={index}>{tip}</li>
            )
          )}
        </ul>
      </div> */}
    </div>
  );
}
