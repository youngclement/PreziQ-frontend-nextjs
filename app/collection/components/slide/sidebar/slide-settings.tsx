'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, Palette, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storageApi } from '@/api-client/storage-api';
import { activitiesApi } from '@/api-client/activities-api';
import { useToast } from '@/hooks/use-toast';

// Common background colors for slides
const backgroundColors = [
  '#FFFFFF',
  '#F8F9FA',
  '#E9ECEF',
  '#DEE2E6',
  '#CED4DA',
  '#ADB5BD',
  '#6C757D',
  '#343A40',
  '#212529',
  '#000000',
  '#F8F0E3',
  '#FFEBEE',
  '#FCE4EC',
  '#F3E5F5',
  '#E8EAF6',
  '#E3F2FD',
  '#E0F7FA',
  '#E0F2F1',
  '#E8F5E9',
  '#F1F8E9',
  '#F9FBE7',
  '#FFFDE7',
  '#FFF8E1',
  '#FFF3E0',
];

interface SlideSettingsProps {
  slideId: string;
  backgroundColor: string;
  backgroundImage: string;
  questionType: string;
  activeQuestionIndex: number;
  handleSlideBackgroundChange: (color: string, index: number) => void;
  handleSlideBackgroundImageChange: (url: string, index: number) => void;
}

export const SlideSettings: React.FC<SlideSettingsProps> = ({
  slideId,
  backgroundColor,
  backgroundImage,
  questionType,
  activeQuestionIndex,
  handleSlideBackgroundChange = () => {},
  handleSlideBackgroundImageChange = () => {},
}) => {
  const [backgroundTab, setBackgroundTab] = useState<'color' | 'image'>(
    'color'
  );
  const [customColor, setCustomColor] = useState(backgroundColor || '#FFFFFF');
  const { toast } = useToast();
  const [currentBackgroundImage, setCurrentBackgroundImage] = useState(backgroundImage);
  // useEffect(() => {
  //   setCustomColor(backgroundColor || '#FFFFFF');

  //   // Cập nhật global storage
  //   if (typeof window !== 'undefined' && slideId) {
  //     if (!window.savedBackgroundColors) {
  //       window.savedBackgroundColors = {};
  //     }
  //     window.savedBackgroundColors[slideId] = backgroundColor || '#FFFFFF';
  //   }
  // }, [backgroundColor, slideId]);

  useEffect(() => {
    // Khi slideId thay đổi hoặc component mount
    if (typeof window !== 'undefined') {
      if (backgroundImage) {
        // Nếu có background image, ưu tiên hiển thị nó
        setCustomColor('');
        if (window.savedBackgroundColors) {
          window.savedBackgroundColors[slideId] = '';
        }
      } else if (window.savedBackgroundColors?.[slideId]) {
        // Nếu không có background image, kiểm tra savedBackgroundColors
        const savedColor = window.savedBackgroundColors[slideId];
        setCustomColor(savedColor);
      } else if (backgroundColor) {
        // Nếu không có cả hai, sử dụng backgroundColor từ props
        setCustomColor(backgroundColor);
      }
    }
  }, [slideId, backgroundColor, backgroundImage]);


  const onBackgroundColorChange = async (color: string) => {
    setCustomColor(color);

    if (typeof window !== 'undefined') {
      if (!window.savedBackgroundColors) {
        window.savedBackgroundColors = {};
      }
      window.savedBackgroundColors[slideId] = color;
    }

    window.dispatchEvent(
      new CustomEvent('slide:background:update', {
        detail: {
          activityId: slideId,
          properties: {
            backgroundColor: color,
            backgroundImage: '',
          },
        },
      })
    );

    handleSlideBackgroundChange(color, activeQuestionIndex);

    // Dispatch event cho Fabric canvas
    window.dispatchEvent(
      new CustomEvent('fabric:set-background-color', {
        detail: { color, slideId },
      })
    );

    if (typeof window !== 'undefined' && window.updateActivityBackground) {
      window.updateActivityBackground(slideId, {
        backgroundColor: color,
        backgroundImage: '',
      });
    }

    try {
      await activitiesApi.updateActivity(slideId, {
        backgroundColor: color,
        backgroundImage: '',
      });
    } catch (err) {
      console.error('Error saving background color:', err);
    }
  };

  const onBackgroundImageChange = async (url: string) => {
    setCurrentBackgroundImage(url);

    setCustomColor('');
    if (typeof window !== 'undefined' && window.savedBackgroundColors) {
      window.savedBackgroundColors[slideId] = '';
    }

    handleSlideBackgroundImageChange(url, activeQuestionIndex);
    handleSlideBackgroundChange('', activeQuestionIndex);

    // Khi chọn image, xóa background color
    if (typeof window !== 'undefined' && window.updateActivityBackground) {
      window.updateActivityBackground(slideId, {
        backgroundImage: url,
        backgroundColor: '', // Xóa background color
      });
    }

    // Dispatch event để cập nhật đồng bộ với question list
    window.dispatchEvent(
      new CustomEvent('slide:background:update', {
        detail: {
          activityId: slideId,
          properties: {
            backgroundImage: url,
            backgroundColor: '', // Xóa background color
          },
        },
      })
    );

    // Dispatch event cho Fabric canvas
    window.dispatchEvent(
      new CustomEvent('fabric:set-background-image', {
        detail: { url, slideId },
      })
    );

    // Cập nhật activity background
    if (typeof window !== 'undefined' && window.updateActivityBackground) {
      window.updateActivityBackground(slideId, {
        backgroundImage: url,
        backgroundColor: '', // Xóa background color
      });
    }

    // // Clear savedBackgroundColors cho slide này
    // if (typeof window !== 'undefined' && window.savedBackgroundColors) {
    //   window.savedBackgroundColors[slideId] = '';
    // }
  };

  // Handle file upload for background
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Validate file size (1KB to 5MB)
    if (file.size < 1024 || file.size > 5 * 1024 * 1024) {
      return;
    }

    try {
      if (currentBackgroundImage) {
        try {
          await storageApi.deleteSingleFile(currentBackgroundImage);
        } catch (error) {
          console.error('Error deleting old background image:', error);
        }
      }
      // Upload file to S3
      const response = await storageApi.uploadSingleFile(file, 'slides');
      const res = response.data as any;
      const fileUrl = res.data?.fileUrl;

      if (!fileUrl) {
        throw new Error('Invalid response: fileUrl not found');
      }
      setCurrentBackgroundImage(fileUrl);

      // Update canvas and activity
      await onBackgroundImageChange(fileUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button
              variant={backgroundTab === 'color' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBackgroundTab('color')}
              className="flex-1"
            >
              <Palette className="h-4 w-4 mr-2" />
              Color
            </Button>
            <Button
              variant={backgroundTab === 'image' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBackgroundTab('image')}
              className="flex-1"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Image
            </Button>
          </div>

          {backgroundTab === 'color' && (
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="custom-color"
                  className="text-sm font-medium mb-2 block"
                >
                  Custom Color
                </Label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-md border"
                    style={{ backgroundColor: customColor }}
                  />
                  <Input
                    id="custom-color"
                    type="color"
                    value={customColor}
                    onChange={(e) => onBackgroundColorChange(e.target.value)}
                    className="w-full h-10"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Color Presets
                </Label>
                <div className="grid grid-cols-6 gap-2">
                  {backgroundColors.map((color, index) => (
                    <button
                      key={index}
                      className={cn(
                        'w-full aspect-square rounded-md border transition-all hover:scale-110',
                        customColor === color &&
                          'ring-2 ring-primary ring-offset-2'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => onBackgroundColorChange(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {backgroundTab === 'image' && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Upload Image
                </Label>
                <div className="border border-dashed rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag and drop or click to upload
                  </p>
                  <input
                    type="file"
                    id="bg-image-upload"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById('bg-image-upload')?.click()
                    }
                    className="w-full"
                  >
                    Select from computer
                  </Button>
                </div>
              </div>

              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBackgroundImageChange('')}
                  className="w-full"
                >
                  Remove Background Image
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(SlideSettings, (prevProps, nextProps) => {
  return (
    prevProps.slideId === nextProps.slideId &&
    prevProps.backgroundColor === nextProps.backgroundColor &&
    prevProps.backgroundImage === nextProps.backgroundImage &&
    prevProps.questionType === nextProps.questionType &&
    prevProps.activeQuestionIndex === nextProps.activeQuestionIndex &&
    prevProps.handleSlideBackgroundChange ===
      nextProps.handleSlideBackgroundChange &&
    prevProps.handleSlideBackgroundImageChange ===
      nextProps.handleSlideBackgroundImageChange
  );
});
