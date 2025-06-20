'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { Upload, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLanguage } from '@/contexts/language-context';
import { storageApi } from '@/api-client/storage-api';
import { collectionsApi } from '@/api-client/collections-api';
import { useToast } from '@/hooks/use-toast';

interface MusicSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

interface MusicFile {
  fileUrl: string;
  name?: string;
  fileName?: string;
}

export function MusicSelector({ value, onChange }: MusicSelectorProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());
  const [musicList, setMusicList] = useState<MusicFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [customMusic, setCustomMusic] = useState<MusicFile | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    const handleEnded = () => {
      setIsPlaying(false);
    };
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('ended', handleEnded);

      audio.pause();
      audio.src = '';
    };
  }, [audio, t, toast]);

  useEffect(() => {
    if (value) {
      audio.src = value;
    } else {
      audio.src = '';
      setIsPlaying(false);
    }
    setIsInitialized(true);
  }, [value, audio]);

  useEffect(() => {
    const fetchMusicList = async () => {
      try {
        const response = await collectionsApi.getDefaultBackgroundMusic();
        const apiResponse = response.data.data;

        if (apiResponse) {
          // Combine default music with custom music if exists
          const defaultMusic = apiResponse.map((music: any) => ({
            fileUrl: music.fileUrl,
            name: music.name || music.fileName || 'Unknown',
          }));

          setMusicList(
            customMusic ? [...defaultMusic, customMusic] : defaultMusic
          );
        } else {
          toast({
            title: 'Error get list music',
            description: apiResponse.message || 'Failed to fetch music list.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error fetching music list:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch music list.',
          variant: 'destructive',
        });
      }
    };

    fetchMusicList();
  }, [customMusic, t, toast]);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('collectionForm.invalidFormat'),
        description: t('collectionForm.audioFormatError'),
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('collectionForm.fileTooLarge'),
        description: t('collectionForm.audioSizeError'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsUploading(true);

      // Delete the old custom music file if it exists
      if (customMusic?.fileUrl) {
        try {
          await storageApi.deleteSingleFile(customMusic.fileUrl);
          console.log('Old custom music file deleted successfully');
        } catch (error) {
          console.error('Error deleting old custom music file:', error);
          // Continue with upload even if delete fails
        }
      }

      const response = (await storageApi.uploadSingleFile(
        file,
        'sounds/custom'
      )) as any;

      if (response?.fileUrl) {
        const newName = response.name || response.fileName || file.name;
        const newCustomMusic = {
          fileUrl: response.fileUrl,
          name: newName.replace('.mp3', ''),
          fileName: file.name,
        };
        // First update the music list
        setMusicList((prev) => [...prev, newCustomMusic]);

        // Then set the selected value
        onChange(newCustomMusic.fileUrl);

        // Set this as the custom music for future reference
        setCustomMusic(newCustomMusic);

        toast({
          title: 'Upload music file',
          description: 'Upload music file successfully!',
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Failed to upload music file',
        description: 'An error occurred while trying to upload the file.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleMusicSelect = (musicUrl: string) => {
    onChange(musicUrl);
    // Stop playback when selecting new music
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const togglePlayback = async () => {
    if (!isInitialized) return;

    try {
      if (isPlaying) {
        await audio.pause();
      } else {
        if (audio.readyState === 0) {
          await audio.load();
        }
        await audio.play();
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('Error toggling playback:', error);
      setIsPlaying(false);
      toast({
        title: t('collectionForm.playbackError'),
        description: t('collectionForm.playbackErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-4'>
        <Select
          value={value}
          onValueChange={handleMusicSelect}
          key={musicList.length} // Add a key that changes when the music list updates
        >
          <SelectTrigger className='flex-1'>
            <SelectValue
              placeholder={t('collectionForm.backgroundMusicPlaceholder')}
            />
          </SelectTrigger>
          <SelectContent>
            {musicList.map((music, index) => (
              <SelectItem
                key={`${music.fileUrl}-${index}`}
                value={music.fileUrl}
              >
                {music.name || music.fileName || `Music ${index + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type='button'
          variant='outline'
          size='icon'
          onClick={togglePlayback}
          disabled={!value}
        >
          {isPlaying ? (
            <Pause className='h-4 w-4' />
          ) : (
            <Play className='h-4 w-4' />
          )}
        </Button>
      </div>

      <div className='flex items-center gap-2'>
        <Input
          type='file'
          accept='audio/*'
          onChange={handleFileUpload}
          className='hidden'
          id='music-upload'
          disabled={isUploading}
        />
        <label
          htmlFor='music-upload'
          className='flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors'
        >
          {isUploading ? (
            <>
              <svg
                className='animate-spin h-4 w-4'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
              >
                <circle
                  className='opacity-25'
                  cx='12'
                  cy='12'
                  r='10'
                  stroke='currentColor'
                  strokeWidth='4'
                ></circle>
                <path
                  className='opacity-75'
                  fill='currentColor'
                  d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                ></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              <Upload className='h-4 w-4' />
              {t('collectionForm.uploadMusic')}
            </>
          )}
        </label>
      </div>
    </div>
  );
}
