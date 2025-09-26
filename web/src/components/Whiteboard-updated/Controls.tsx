'use client';

import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Trash, Search, Loader2 } from 'lucide-react';
import { ChatButton } from './ChatButton';

interface ControlsProps {
  color: string;
  size: number;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onClear: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  editorRef: React.MutableRefObject<any>;
}

export const Controls: React.FC<ControlsProps> = ({
  color,
  size,
  onColorChange,
  onSizeChange,
  onClear,
  onAnalyze,
  isAnalyzing,
  editorRef
}) => {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-card shadow-sm">
      <div className="flex items-center gap-2">
        <div
          className="h-8 w-8 rounded-full border border-input"
          style={{ backgroundColor: color }}
        />
        <input
          type="color"
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="sr-only"
          id="color-picker"
        />
        <label
          htmlFor="color-picker"
          className="text-sm font-medium cursor-pointer hover:underline"
        >
          Change Color
        </label>
      </div>

      <div className="flex items-center gap-2 flex-1 max-w-xs">
        <span className="text-sm font-medium">Size:</span>
        <Slider
          value={[size]}
          min={1}
          max={20}
          step={1}
          onValueChange={(values) => onSizeChange(values[0])}
        />
        <span className="text-sm font-medium min-w-[24px] text-right">
          {size}
        </span>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onClear}
        >
          <Trash className="h-4 w-4 mr-2" />
          Clear
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onAnalyze} 
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Analyze
            </>
          )}
        </Button>
        
        <ChatButton editorRef={editorRef} />
      </div>
    </div>
  );
};