// slide-settings-component.tsx
import React from 'react';
import { Label } from '@/components/ui/label';
import TextEditorToolbar from './text-editor-toolbar';
import PexelsPanel from './pexels-panel';
import AnimationToolbar from './animation-toolbar';
import type { SlideElementPayload } from '@/types/slideInterface';

interface SlideToolbarProps {
  slideId: string;
  slideElements: SlideElementPayload[];
  onSlideElementsUpdate: (elements: SlideElementPayload[]) => void;
}

const SlideToolbar = React.memo(
  ({ slideId, slideElements, onSlideElementsUpdate }: SlideToolbarProps) => {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-100 dark:border-yellow-800">
        <div className="mb-4">
          <TextEditorToolbar slideId={slideId} />
        </div>
        <div className="mb-4">
          <Label
            htmlFor="slide-image-url"
            className="text-yellow-800 dark:text-yellow-300"
          >
            Slide Image URL
          </Label>
          <PexelsPanel slideId={slideId} />
        </div>
        {/* <div className="mt-5 pt-4 border-t border-yellow-200 dark:border-yellow-800">
          <div className="mb-4">
            <AnimationToolbar
              slideId={slideId}
              slideElements={slideElements}
              onSlideElementsUpdate={onSlideElementsUpdate}
            />
          </div>
        </div> */}
      </div>
    );
  }
);

SlideToolbar.displayName = 'SlideToolbar';

export default SlideToolbar;
