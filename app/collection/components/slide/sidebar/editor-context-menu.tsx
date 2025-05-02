'use client';

import type React from 'react';

import {
  Copy,
  ClipboardPasteIcon as Paste,
  Trash2,
  Layers,
  Group,
  Ungroup,
  AlignHorizontalJustifyCenter,
  Lock,
  Unlock,
  MoveUp,
  MoveDown,
  CopyIcon as Duplicate,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
} from 'lucide-react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface EditorContextMenuProps {
  children: React.ReactNode;
}

export function EditorContextMenu({ children }: EditorContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem className="hover:bg-slate-300">
          <Copy className="mr-2 h-4 w-4" />
          Copy
          <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <Paste className="mr-2 h-4 w-4" />
          Paste
          <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <Duplicate className="mr-2 h-4 w-4" />
          Duplicate
          <ContextMenuShortcut>⌘D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />

        <ContextMenuItem
          onSelect={() => window.dispatchEvent(new Event('fabric:group'))}
        >
          <Group className="mr-2 h-4 w-4" />
          Group
          <ContextMenuShortcut>⌘G</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem
          onSelect={() => window.dispatchEvent(new Event('fabric:ungroup'))}
        >
          <Ungroup className="mr-2 h-4 w-4" />
          Ungroup
          <ContextMenuShortcut>⇧⌘G</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Layers className="mr-2 h-4 w-4" />
            Arrange
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem onSelect={() => window.dispatchEvent(new CustomEvent('fabric:arrange', { detail: { action: 'bringToFront' } }))}>
              <MoveUp className="mr-2 h-4 w-4" />
              Bring to Front
              <ContextMenuShortcut>⇧⌘]</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => window.dispatchEvent(new CustomEvent('fabric:arrange', { detail: { action: 'bringToForward' } }))}>
              <MoveUp className="mr-2 h-4 w-4" />
              Bring Forward
              <ContextMenuShortcut>⌘]</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => window.dispatchEvent(new CustomEvent('fabric:arrange', { detail: { action: 'sendBackwards' } }))}>
              <MoveDown className="mr-2 h-4 w-4" />
              Send Backward
              <ContextMenuShortcut>⌘[</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onSelect={() => window.dispatchEvent(new CustomEvent('fabric:arrange', { detail: { action: 'sendToBack' } }))}>
              <MoveDown className="mr-2 h-4 w-4" />
              Send to Back
              <ContextMenuShortcut>⇧⌘[</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <AlignHorizontalJustifyCenter className="mr-2 h-4 w-4" />
            Align
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>Align Left</ContextMenuItem>
            <ContextMenuItem>Align Center</ContextMenuItem>
            <ContextMenuItem>Align Right</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>Align Top</ContextMenuItem>
            <ContextMenuItem>Align Middle</ContextMenuItem>
            <ContextMenuItem>Align Bottom</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <RotateCw className="mr-2 h-4 w-4" />
            Rotate & Flip
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>
              <RotateCw className="mr-2 h-4 w-4" />
              Rotate 90° Right
            </ContextMenuItem>
            <ContextMenuItem>
              <RotateCcw className="mr-2 h-4 w-4" />
              Rotate 90° Left
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <FlipHorizontal className="mr-2 h-4 w-4" />
              Flip Horizontal
            </ContextMenuItem>
            <ContextMenuItem>
              <FlipVertical className="mr-2 h-4 w-4" />
              Flip Vertical
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator />

        <ContextMenuItem>
          <Lock className="mr-2 h-4 w-4" />
          Lock
          <ContextMenuShortcut>⌘L</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <Unlock className="mr-2 h-4 w-4" />
          Unlock
          <ContextMenuShortcut>⇧⌘L</ContextMenuShortcut>
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => window.dispatchEvent(new Event('fabric:delete'))}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
