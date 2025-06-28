'use client';

import  React from 'react';
import { useState } from 'react';
import PexelsSidebar from './pexels-sidebar';
import { ImageIcon, X, Upload } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { storageApi } from '@/api-client/storage-api'; // Import storageApi
import { useLanguage } from '@/contexts/language-context';

const PexelsPanel = React.memo(({ slideId }: { slideId: string }) => {
  const { t } = useLanguage();
  // Gửi sự kiện để thêm ảnh vào canvas
  const handleAddToCanvas = (url: string) => {
    const event = new CustomEvent('fabric:add-image', {
      detail: { url, slideId: slideId },
    });
    window.dispatchEvent(event);
  };

  // Xử lý khi người dùng chọn file từ máy tính
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return; // Nếu không có file, thoát

    try {
      const response = await storageApi.uploadSingleFile(file, 'slides');

      const res = response.data as any;
      const fileUrl = res.data.fileUrl;

      handleAddToCanvas(fileUrl); // Gửi URL từ AWS S3 vào canvas
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="pexels">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="pexels" className="flex-1 border">
            Pexels
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex-1 border border-zinc-200">
            {t('activity.upload')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pexels" className="mt-0">
          <div className="h-[calc(100%-3.5rem)]">
            <PexelsSidebar />
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-0">
          <div className="border border-dashed rounded-lg p-4 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              {t('activity.slide.dragAndDropUpload')}
            </p>
            <input
              type="file"
              id="image-upload"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('image-upload')?.click()}
              className="w-full border bg-black text-white"
            >
              {t('activity.slide.selectFromComputer')}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

PexelsPanel.displayName = 'PexelsPanel';
export default PexelsPanel;

