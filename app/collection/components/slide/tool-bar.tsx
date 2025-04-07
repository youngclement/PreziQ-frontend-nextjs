'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, ImagePlus, Trash2 } from 'lucide-react';
import PexelsPanel from './sidebar/pexels-penel';
import ShapeToolbar from './sidebar/shape-toolbar';
import ColorToolbar from './sidebar/color-toolbar';
import { TextEditorToolbar } from './sidebar/text-editor-toolbar';
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

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onAddText}
        className="w-full flex items-center gap-2"
      >
        <div className="p-1 border border-gray-200 rounded-full">
          <Plus className="h-4 w-4 " />
        </div>
        Add Text
      </Button>
      <TextEditorToolbar/>
      <PexelsPanel />
      <ShapeToolbar/>
      <ColorToolbar/>
      <Button
        variant="destructive"
        size="sm"
        onClick={onClear}
        className="w-full flex items-center gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Clear Canvas
      </Button>
    </div>
  );
};
