'use client';

import React from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  ImageIcon,
  PaintBucket,
  Palette,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TextEditorToolbar } from './text-editor-toolbar';
import PexelsPanel from './pexels-panel';
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
  activeQuestion: any;
  activeQuestionIndex: number;
  handleSlideBackgroundChange?: (color: string, index: number) => void;
  handleSlideBackgroundImageChange?: (url: string, index: number) => void;
}

export const SlideSettings: React.FC<SlideSettingsProps> = ({
  activeQuestion,
  activeQuestionIndex,
  handleSlideBackgroundChange = () => {},
  handleSlideBackgroundImageChange = () => {},
}) => {
  const [backgroundTab, setBackgroundTab] = useState<'color' | 'image'>(
    'color'
  );
  const [customColor, setCustomColor] = useState(
    activeQuestion?.backgroundColor || '#FFFFFF'
  );
  const { toast } = useToast();

  // console.log('activeQuestionnnnn: ', activeQuestion);

  // Đồng bộ customColor với activeQuestion.backgroundColor khi activeQuestion thay đổi
  useEffect(() => {
    if (
      activeQuestion?.backgroundColor &&
      activeQuestion.backgroundColor !== customColor
    ) {
      setCustomColor(activeQuestion.backgroundColor);
      // Gửi sự kiện để cập nhật canvas
      window.dispatchEvent(
        new CustomEvent('fabric:set-background-color', {
          detail: { color: activeQuestion.backgroundColor },
        })
      );
    }
  }, [activeQuestion?.backgroundColor]);

  const updateSlideBackground = async (
    slideId: string,
    backgroundColor: string,
    backgroundImage: string
  ) => {
    console.log('Calling API with payload:', {
      slideId,
      backgroundColor,
      backgroundImage,
    });
    try {
      await activitiesApi.updateActivity(slideId, {
        backgroundColor,
        backgroundImage,
      });

      if (typeof window !== 'undefined') {
        window.savedBackgroundColors = window.savedBackgroundColors || {};
        window.savedBackgroundColors[slideId] = backgroundColor;
      }

      if (window.updateActivityBackground) {
        window.updateActivityBackground(slideId, {
          backgroundColor,
          backgroundImage,
        });
      }
    } catch (error: any) {}
  };

  const onBackgroundColorChange = async (color: string) => {
    setCustomColor(color);
    handleSlideBackgroundChange(color, activeQuestionIndex);
    // Không gọi handleSlideBackgroundImageChange để tránh kích hoạt handleSlideImageChange

    window.dispatchEvent(
      new CustomEvent('fabric:set-background-color', {
        detail: { color, slideId: activeQuestion?.id },
      })
    );

    if (activeQuestion?.id) {
      await updateSlideBackground(activeQuestion.id, color, '');
    }
  };

  const onBackgroundImageChange = async (url: string) => {
    handleSlideBackgroundImageChange(url, activeQuestionIndex);
    handleSlideBackgroundChange('', activeQuestionIndex);

    window.dispatchEvent(
      new CustomEvent('fabric:set-background-image', {
        detail: { url, slideId: activeQuestion?.id },
      })
    );

    if (activeQuestion?.id) {
      await updateSlideBackground(activeQuestion.id, '', url);
    }
  };

  // Handle file upload for background
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Invalid format',
        description: 'Please select an image in PNG or JPG format.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (1KB to 5MB)
    if (file.size < 1024 || file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Invalid file size',
        description: 'Image must be between 1KB and 5MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Upload file to S3
      const response = await storageApi.uploadSingleFile(file, 'slides');
      const res = response.data as any;
      const fileUrl = res.data?.fileUrl;

      if (!fileUrl) {
        throw new Error('Invalid response: fileUrl not found');
      }

      // Update canvas and activity
      await onBackgroundImageChange(fileUrl);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  // Handle toolbar actions
  const handleAddText = () => {
    const event = new CustomEvent('fabric:add-text');
    window.dispatchEvent(event);
  };

  const handleAddImage = (url: string) => {
    const event = new CustomEvent('fabric:add-image', {
      detail: { url },
    });
    window.dispatchEvent(event);
  };

  const handleClear = () => {
    const event = new Event('fabric:clear');
    window.dispatchEvent(event);
  };

  const slideId = useMemo(() => activeQuestion?.id, [activeQuestion?.id]);

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <Tabs defaultValue="toolbar" className="w-full">
          <TabsList className="w-full mb-4 grid grid-cols-2">
            <TabsTrigger value="toolbar" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Content</span>
            </TabsTrigger>
            <TabsTrigger value="background" className="flex items-center gap-2">
              <PaintBucket className="h-4 w-4" />
              <span>Background</span>
            </TabsTrigger>
          </TabsList>

          {/* Toolbar Tab */}
          <TabsContent value="toolbar" className="mt-0 space-y-4">
            <div className="space-y-4">
              {/* Text Tools */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Text Formatting</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddText}
                    className="h-8 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Text
                  </Button>
                </div>
                <TextEditorToolbar slideId={slideId} />
              </div>

              <Separator />

              {/* Image Tools */}
              <div
                style={{
                  display:
                    activeQuestion.question_type === 'slide' ||
                    activeQuestion.question_type === 'info_slide'
                      ? 'block'
                      : 'none',
                }}
              >
                <Label className="text-sm font-medium mb-2 block">Images</Label>
                <PexelsPanel slideId={activeQuestion.activity_id} />
              </div>

              <Separator />

              {/* Clear Canvas */}
              <div className="pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClear}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Canvas
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Background Tab */}
          <TabsContent value="background" className="mt-0 space-y-4">
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
                        onChange={(e) =>
                          onBackgroundColorChange(e.target.value)
                        }
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default React.memo(SlideSettings, (prevProps, nextProps) => {
  return (
    prevProps.activeQuestion?.id === nextProps.activeQuestion?.id &&
    prevProps.activeQuestion?.backgroundColor ===
      nextProps.activeQuestion?.backgroundColor &&
    prevProps.activeQuestion?.backgroundImage ===
      nextProps.activeQuestion?.backgroundImage &&
    prevProps.activeQuestion?.question_type ===
      nextProps.activeQuestion?.question_type &&
    prevProps.activeQuestionIndex === nextProps.activeQuestionIndex &&
    prevProps.handleSlideBackgroundChange ===
      nextProps.handleSlideBackgroundChange &&
    prevProps.handleSlideBackgroundImageChange ===
      nextProps.handleSlideBackgroundImageChange
  );
});
