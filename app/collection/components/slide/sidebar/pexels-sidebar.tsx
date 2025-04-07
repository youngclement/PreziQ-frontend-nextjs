'use client';

import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search } from 'lucide-react';

interface PexelsImage {
  id: number;
  src: {
    medium: string;
    original: string;
  };
  alt: string;
}

export default function PexelsSidebar() {
  const [images, setImages] = useState<PexelsImage[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchImages = async (search: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${search}&per_page=20`,
        {
          headers: {
            Authorization: process.env.NEXT_PUBLIC_PEXELS_API_KEY || '',
          },
        }
      );
      const data = await res.json();
      setImages(data.photos);
    } catch (err) {
      console.error('Error loading images from Pexels:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages('education'); // default search
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.length > 2) fetchImages(value);
  };

  const handleAddToCanvas = (url: string) => {
    const event = new CustomEvent('fabric:add-image', {
      detail: { url },
    });
    window.dispatchEvent(event);
  };

  return (
    <div className="w-64 h-full bg-white dark:bg-gray-900 border-r border-border shadow-md flex flex-col">
      <div className="flex items-center gap-2 p-4 border-b">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Tìm ảnh trên Pexels"
            value={query}
            onChange={handleSearch}
            className="pl-9 pr-3 py-2 border rounded-md shadow-sm text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
        </div>
      ) : (
        <ScrollArea className="flex-1 p-3">
          <div className="grid grid-cols-2 gap-3">
            {images.map((img) => (
              <img
                key={img.id}
                src={img.src.medium}
                alt={img.alt}
                draggable
                className="rounded-md border cursor-pointer hover:scale-105 transition-transform shadow-sm"
                onDragStart={(e) => {
                  e.dataTransfer.setData('image-url', img.src.original);
                }}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
