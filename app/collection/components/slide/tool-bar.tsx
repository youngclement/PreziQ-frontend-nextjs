'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Plus, ImagePlus, Trash2, Square, Paintbrush } from 'lucide-react';
import PexelsPanel from './sidebar/pexels-penel';
import ShapeToolbar from './sidebar/shape-toolbar';
import ColorToolbar from './sidebar/color-toolbar';
import { TextEditorToolbar } from './sidebar/text-editor-toolbar';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  onAddText: () => void;
  onAddImage: (url: string) => void;
  onClear: () => void;
}

export const FabricToolbar: React.FC<ToolbarProps> = ({
  onAddText,
  onAddImage,
  onClear,
}) => {
  const [activeTab, setActiveTab] = useState<
    'text' | 'shapes' | 'colors' | 'images' | null
  >(null);

  const toggleTab = (tab: 'text' | 'shapes' | 'colors' | 'images') => {
    setActiveTab(activeTab === tab ? null : tab);
  };

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 flex flex-col items-center space-y-2">
      {/* Main vertical toolbar */}
      <motion.div
        className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex flex-col space-y-2"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Text Button */}
        <Button
          variant={activeTab === 'text' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => toggleTab('text')}
          className={cn(
            'h-10 w-10 rounded-lg transition-all duration-200',
            activeTab === 'text'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-gray-300 dark:hover:bg-gray-700'
          )}
          title="Add Text"
        >
          <Plus className="h-5 w-5" />
        </Button>

        {/* Shapes Button */}
        <Button
          variant={activeTab === 'shapes' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => toggleTab('shapes')}
          className={cn(
            'h-10 w-10 rounded-lg transition-all duration-200',
            activeTab === 'shapes'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-gray-300 dark:hover:bg-gray-700'
          )}
          title="Add Shapes"
        >
          <Square className="h-5 w-5" />
        </Button>

        {/* Colors Button */}
        <Button
          variant={activeTab === 'colors' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => toggleTab('colors')}
          className={cn(
            'h-10 w-10 rounded-lg transition-all duration-200',
            activeTab === 'colors'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-gray-300 dark:hover:bg-gray-700'
          )}
          title="Change Colors"
        >
          <Paintbrush className="h-5 w-5" />
        </Button>

        {/* Images Button */}
        <Button
          variant={activeTab === 'images' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => toggleTab('images')}
          className={cn(
            'h-10 w-10 rounded-lg transition-all duration-200',
            activeTab === 'images'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-gray-300 dark:hover:bg-gray-700'
          )}
          title="Add Images"
        >
          <ImagePlus className="h-5 w-5" />
        </Button>

        {/* Clear Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClear}
          className="h-10 w-10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-destructive"
          title="Clear Canvas"
        >
          <Trash2 className="h-5 w-5" />
        </Button>
      </motion.div>

      {/* Expandable panels - Hiển thị dạng sidebar */}
      <AnimatePresence>
        {activeTab && (
          <motion.div
            className="fixed w-[16rem] right-16 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 "
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            // style={{
            //   maxWidth: '90vw', // Không cho nó quá rộng
            //   minWidth: '12rem', // Có chiều rộng tối thiểu đẹp
            //   width: 'fit-content', // Auto theo nội dung
            // }}
          >
            {activeTab === 'text' && (
              <div className="space-y-2">
                <TextEditorToolbar />
              </div>
            )}

            {activeTab === 'shapes' && (
              <div className="space-y-2">
                <ShapeToolbar />
              </div>
            )}

            {activeTab === 'colors' && (
              <div className="space-y-2 overflow-x-auto overflow-y-auto">
                <ColorToolbar />
              </div>
            )}

            {activeTab === 'images' && (
              <div className="space-y-2">
                <PexelsPanel />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
