'use client';

import React, { useState } from 'react';
import PexelsSidebar from './pexels-sidebar';
import { ImageIcon, X } from 'lucide-react';

function PexelsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger icon */}
      <button
        className="flex items-center gap-2 text-sm px-3 py-2 rounded-md hover:bg-muted border bg-background"
        onClick={() => setOpen(true)}
      >
        <ImageIcon className="h-4 w-4" />
        Ảnh từ Pexels
      </button>

      {/* Slide-over panel */}
      {open && (
        <div className="fixed top-0 right-0 w-80 h-full bg-white dark:bg-gray-900 shadow-lg z-50 border-l">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h2 className="text-sm font-medium">Chọn ảnh từ Pexels</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {/* h-[calc(100%-12px)] */}
          <div className="h-[20rem] overflow-y-auto">
            <PexelsSidebar />
          </div>
        </div>
      )}
    </>
  );
}

export default PexelsPanel