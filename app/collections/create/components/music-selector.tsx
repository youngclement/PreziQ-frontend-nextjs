import { useState, useEffect } from 'react';
import { Music, Upload, Play, Pause } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

interface MusicSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

interface MusicFile {
  fileName: string;
  fileUrl: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: {
    timestamp: string;
    instance: string;
  };
}

interface SingleFileResponse {
  fileName: string;
  fileUrl: string;
}

interface MultipleFilesResponse {
  files: MusicFile[];
}

export function MusicSelector({ value, onChange }: MusicSelectorProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(new Audio());
  const [musicList, setMusicList] = useState<MusicFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = (e: ErrorEvent) => {
      console.error('Audio playback error:', e);
      setIsPlaying(false);
      toast({
        title: t('collectionForm.playbackError'),
        description: t('collectionForm.playbackErrorDesc'),
        variant: 'destructive',
      });
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [audio, t, toast]);

  useEffect(() => {
    if (value) {
      audio.src = value;
    }
  }, [value, audio]);

  useEffect(() => {
    const fetchMusicList = async () => {
      try {
        const response = await storageApi.uploadMultipleFiles([], 'sounds');
        const apiResponse = response.data as ApiResponse<MultipleFilesResponse>;

        if (apiResponse.success && apiResponse.data.files) {
          setMusicList(apiResponse.data.files);
        }
      } catch (error) {
        console.error('Error fetching music list:', error);
        toast({
          title: t('collectionForm.fetchError'),
          description: t('collectionForm.musicListError'),
          variant: 'destructive',
        });
      }
    };

    fetchMusicList();
  }, [t, toast]);

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
      const response = await storageApi.uploadSingleFile(file, 'sounds');
      const apiResponse = response.data as ApiResponse<SingleFileResponse>;

      if (apiResponse.success && apiResponse.data) {
        const { fileUrl, fileName } = apiResponse.data;
        if (fileUrl) {
          onChange(fileUrl);
          // Add the new music to the list
          setMusicList((prev) => [...prev, { fileName, fileUrl }]);
          toast({
            title: t('collectionForm.uploadSuccess'),
            description: t('collectionForm.musicUploadSuccess'),
          });
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: t('collectionForm.uploadError'),
        description: t('collectionForm.musicUploadError'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  const handleMusicSelect = (musicUrl: string) => {
    onChange(musicUrl);
  };

  const togglePlayback = async () => {
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
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={value} onValueChange={handleMusicSelect}>
          <SelectTrigger className="flex-1">
            <SelectValue
              placeholder={t('collectionForm.backgroundMusicPlaceholder')}
            />
          </SelectTrigger>
          <SelectContent>
            {musicList.map((music) => (
              <SelectItem key={music.fileName} value={music.fileUrl}>
                {music.fileName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={togglePlayback}
          disabled={!value}
        >
          {isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
          id="music-upload"
          disabled={isUploading}
        />
        <label
          htmlFor="music-upload"
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {isUploading ? (
            <>
              <svg
                className="animate-spin h-4 w-4"
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
              {t('collectionForm.uploading')}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {t('collectionForm.uploadMusic')}
            </>
          )}
        </label>
      </div>

      {value && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('collectionForm.selectedMusic')}: {value.split('/').pop()}
        </div>
      )}
    </div>
  );
}
