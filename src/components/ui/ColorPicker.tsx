import React from 'react';
import type { ColorOption } from '../../types/configurator';
import { Check, Pipette } from 'lucide-react';

type ColorPickerProps = {
  colors: ColorOption[];
  selectedColor: string;
  onSelectColor: (hex: string) => void;
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  selectedColor,
  onSelectColor,
}) => {
  const activeColorObj = colors.find((c) => c.hex.toLowerCase() === selectedColor.toLowerCase());

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Base Canopy Fabric Color
        </label>
        <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
          {activeColorObj ? activeColorObj.name : selectedColor}
          {activeColorObj?.pantone && (
            <span className="text-[10px] text-zinc-400 ml-1.5 font-normal">
              ({activeColorObj.pantone})
            </span>
          )}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {colors.map((color) => {
          const isSelected = selectedColor.toLowerCase() === color.hex.toLowerCase();
          const isLight = color.hex.toLowerCase() === '#ffffff' || color.hex.toLowerCase() === '#eab308';

          return (
            <button
              key={color.hex}
              onClick={() => onSelectColor(color.hex)}
              className={`relative w-8 h-8 rounded-full transition-transform border ${
                isSelected
                  ? 'ring-2 ring-blue-600 ring-offset-2 scale-110 shadow-sm'
                  : 'hover:scale-105 border-black/10 dark:border-white/10'
              }`}
              style={{ backgroundColor: color.hex }}
              title={`${color.name} (${color.hex})`}
            >
              {isSelected && (
                <Check
                  className={`w-3.5 h-3.5 absolute inset-0 m-auto ${
                    isLight ? 'text-zinc-900' : 'text-white'
                  }`}
                  strokeWidth={3}
                />
              )}
            </button>
          );
        })}

        {/* custom hex color picker input */}
        <label
          className="relative flex items-center justify-center w-8 h-8 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 cursor-pointer bg-zinc-50 dark:bg-zinc-800 transition-colors"
          title="Pick Custom HEX Color"
        >
          <Pipette className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onSelectColor(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          />
        </label>
      </div>
    </div>
  );
};
