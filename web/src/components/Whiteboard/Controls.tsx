import React from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Trash2,
  Brain,
  Loader2,
} from 'lucide-react';

interface ControlsProps {
  color: string;
  size: number;
  onColorChange: (color: string) => void;
  onSizeChange: (size: number) => void;
  onClear: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const colors = [
  // '#000000',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#FFFF00',
  '#FF00FF',
  '#00FFFF',
];

export const Controls: React.FC<ControlsProps> = ({
  color,
  size,
  onColorChange,
  onSizeChange,
  onClear,
  onAnalyze,
  isAnalyzing,
}) => {
  return (
    <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg shadow-sm">
      <div className="flex gap-2">
        {colors.map((c) => (
          <button
            key={c}
            className={`w-8 h-8 rounded-full border-2 ${
              color === c ? 'border-primary' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
            onClick={() => onColorChange(c)}
          />
        ))}
      </div>

      <div className="flex items-center gap-4 min-w-[200px]">
        <span className="text-sm">Size:</span>
        <Slider
          value={[size]}
          onValueChange={(value) => onSizeChange(value[0])}
          min={1}
          max={20}
          step={1}
          className="w-32"
        />
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onClear}
        title="Clear"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <Button
        onClick={onAnalyze}
        disabled={isAnalyzing}
        className="ml-auto"
      >
        {isAnalyzing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Brain className="mr-2 h-4 w-4" />
        )}
        Analyze Drawing
      </Button>
    </div>
  );
};