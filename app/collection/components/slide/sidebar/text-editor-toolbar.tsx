'use client';

import { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TextEditorToolbar() {
  const [formatting, setFormatting] = useState({
    bold: false,
    italic: false,
    underline: false,
    alignment: 'left',
  });
  const [selectedSize, setSelectedSize] = useState<string>('16');
  const [selectedFont, setSelectedFont] = useState<string>('Roboto');

  const toggleFormat = (format: keyof typeof formatting) => {
    if (format === 'alignment') return;
    setFormatting((prev) => ({
      ...prev,
      [format]: !prev[format],
    }));
  };

  const setAlignment = (alignment: string) => {
    setFormatting((prev) => ({
      ...prev,
      alignment,
    }));
  };

  const dispatchStyle = (style: 'bold' | 'italic' | 'underline') => {
    window.dispatchEvent(
      new CustomEvent('fabric:toggle-style', {
        detail: { style },
      })
    );
  };

  const handleFontSizeChange = (value: string) => {
    setSelectedSize(value);
    window.dispatchEvent(
      new CustomEvent('fabric:font-size', {
        detail: { size: parseInt(value) },
      })
    );
  };

  const handleFontFamilyChange = (font: string) => {
    setSelectedFont(font);
    window.dispatchEvent(
      new CustomEvent('fabric:font-family', {
        detail: { font },
      })
    );
  };

  const dispatchAlign = (align: string) => {
    window.dispatchEvent(
      new CustomEvent('fabric:change-align', {
        detail: { align },
      })
    );
  };

  const fontSizes = [
    '8',
    '9',
    '10',
    '11',
    '12',
    '14',
    '16',
    '18',
    '20',
    '22',
    '24',
    '28',
    '32',
    '36',
    '42',
    '48',
    '56',
    '64',
    '72',
  ];

  const fontFamilies = [
    'Arial',
    'Calibri',
    'Comic Sans MS',
    'Courier New',
    'Georgia',
    'Helvetica',
    'Impact',
    'Roboto',
    'Times New Roman',
    'Verdana',
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border bg-background p-1 shadow-sm">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 px-3 text-sm">
            <span style={{ fontFamily: selectedFont }}>{selectedFont}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {fontFamilies.map((font) => (
            <DropdownMenuItem
              key={font}
              className="py-2"
              onSelect={() => handleFontFamilyChange(font)}
            >
              <span style={{ fontFamily: font }}>{font}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <Select value={selectedSize} onValueChange={handleFontSizeChange}>
        <SelectTrigger className="h-8 w-[70px]">
          <SelectValue placeholder="Size" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Font Size</SelectLabel>
            {fontSizes.map((size) => (
              <SelectItem
                key={size}
                value={size}
              >
                {size}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="flex items-center">
        <Button
          variant={formatting.bold ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            toggleFormat('bold'), dispatchStyle('bold');
          }}
        >
          <Bold className="h-4 w-4" />
          <span className="sr-only">Bold</span>
        </Button>
        <Button
          variant={formatting.italic ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            toggleFormat('italic'), dispatchStyle('italic');
          }}
        >
          <Italic className="h-4 w-4" />
          <span className="sr-only">Italic</span>
        </Button>
        <Button
          variant={formatting.underline ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            toggleFormat('underline'), dispatchStyle('underline');
          }}
        >
          <Underline className="h-4 w-4" />
          <span className="sr-only">Underline</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <div className="flex items-center">
        <Button
          variant={formatting.alignment === 'left' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setAlignment('left'), dispatchAlign('left');
          }}
        >
          <AlignLeft className="h-4 w-4" />
          <span className="sr-only">Align Left</span>
        </Button>
        <Button
          variant={formatting.alignment === 'center' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setAlignment('center'), dispatchAlign('center');
          }}
        >
          <AlignCenter className="h-4 w-4" />
          <span className="sr-only">Align Center</span>
        </Button>
        <Button
          variant={formatting.alignment === 'right' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setAlignment('right'), dispatchAlign('right');
          }}
        >
          <AlignRight className="h-4 w-4" />
          <span className="sr-only">Align Right</span>
        </Button>
        <Button
          variant={formatting.alignment === 'justify' ? 'secondary' : 'ghost'}
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            setAlignment('justify'), dispatchAlign('justify');
          }}
        >
          <AlignJustify className="h-4 w-4" />
          <span className="sr-only">Align Justify</span>
        </Button>
      </div>
    </div>
  );
}
