'use client';

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Plus,
  ImagePlus,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import PexelsPanel from './sidebar/pexels-penel';
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
    'text' | 'colors' | 'images' | null
  >(null);
  const [pinnedTab, setPinnedTab] = useState<
    'text' | 'colors' | 'images' | null
  >(null);
  const [hoverTab, setHoverTab] = useState<'text' | 'colors' | 'images' | null>(
    null
  );

  const toolbarRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle hover interactions with debounce
  const handleMouseEnter = (tab: 'text' | 'colors' | 'images') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!pinnedTab) {
      setHoverTab(tab);
      setActiveTab(tab);
    }
  };

  const handleMouseLeave = () => {
    if (!pinnedTab) {
      timeoutRef.current = setTimeout(() => {
        setHoverTab(null);
        setActiveTab(null);
      }, 200);
    }
  };

  // Keep panel open if mouse enters it
  const handlePanelMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const handlePanelMouseLeave = () => {
    if (!pinnedTab) {
      timeoutRef.current = setTimeout(() => {
        setHoverTab(null);
        setActiveTab(null);
      }, 200);
    }
  };

  // Handle click interactions
  const handleClick = (tab: 'text' | 'colors' | 'images') => {
    if (pinnedTab === tab) {
      setPinnedTab(null);
      setActiveTab(null);
    } else {
      setPinnedTab(tab);
      setActiveTab(tab);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Use pinnedTab only for displayedTab
  const displayedTab = pinnedTab;

  return (
    <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 flex flex-row-reverse items-center gap-2">
      {/* Main vertical toolbar */}
      <motion.div
        ref={toolbarRef}
        className="bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-2 flex flex-col space-y-2"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Text Button */}
        <Button
          variant={activeTab === 'text' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => handleClick('text')}
          onMouseEnter={() => handleMouseEnter('text')}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'h-10 w-10 rounded-lg transition-all duration-200',
            activeTab === 'text'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-gray-300 dark:hover:bg-gray-700'
          )}
          title="Text Options"
        >
          <Plus className="h-5 w-5" />
        </Button>

        {/* Images Button */}
        <Button
          variant={activeTab === 'images' ? 'secondary' : 'ghost'}
          size="icon"
          onClick={() => handleClick('images')}
          onMouseEnter={() => handleMouseEnter('images')}
          onMouseLeave={handleMouseLeave}
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

      {/* Expandable panels */}
      <AnimatePresence>
        {pinnedTab && (
          <motion.div
            ref={panelRef}
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 mr-2 overflow-visible w-96 md:w-[24rem]"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onMouseEnter={handlePanelMouseEnter}
            onMouseLeave={handlePanelMouseLeave}
          >
            {/* Collapse button */}
            {pinnedTab && (
              <div className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2">
                <Button
                  onClick={() => {
                    setPinnedTab(null);
                    setActiveTab(null);
                  }}
                  className="p-1 bg-white rounded-full hover:bg-gray-300 shadow-md"
                >
                  <ChevronRight className="transform transition rotate-180 text-black" />
                </Button>
              </div>
            )}

            {/* Panel content */}
            {displayedTab === 'text' && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium mb-2">Text Options</h3>
                <TextEditorToolbar />
              </div>
            )}

            {displayedTab === 'images' && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium mb-2">Image Options</h3>
                <PexelsPanel />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
