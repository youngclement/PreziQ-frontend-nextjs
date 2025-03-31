'use client';

import { Square, Circle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import React from 'react';

export default function ShapeToolbar() {
  const handleAddRect = () => {
    window.dispatchEvent(new CustomEvent('fabric:add-rect'));
  };

  const handleAddCircle = () => {
    window.dispatchEvent(new CustomEvent('fabric:add-circle'));
  };

  const handleClearCanvas = () => {
    window.dispatchEvent(new CustomEvent('fabric:clear'));
  };

  return (
    <TooltipProvider>
      <div className="flex gap-2 p-2 border rounded-md shadow bg-muted/20">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="outline" onClick={handleAddRect}>
              <Square className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Rectangle</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="outline" onClick={handleAddCircle}>
              <Circle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add Circle</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="destructive"
              onClick={handleClearCanvas}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Clear Objects</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
