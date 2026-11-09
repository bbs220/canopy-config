import React, { useState } from 'react';
import type { ColorOption } from '../../types/configurator';
import { Check, Palette, Pipette } from 'lucide-react';
import { HexColorPicker, HexColorInput } from 'react-colorful';

type ColorPickerProps = {
  colors: ColorOption[];
  selectedColor: string;
  onSelectColor: (hex: string) => void;
};

// helper function to calculate perceived brightness
const isHexLight = (hex: string) => {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return false;
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
};

export const ColorPicker: React.FC<ColorPickerProps> = ({
  colors,
  selectedColor,
  onSelectColor,
}) => {
  const activeColorObj = colors.find((c) => c.hex.toLowerCase() === selectedColor.toLowerCase());
  const isCustom = !activeColorObj;
  const isLightCustom = isHexLight(selectedColor);
  const [isCustomExpanded, setIsCustomExpanded] = useState<boolean>(isCustom);

  return (
    <div className="space-y-4">
      {/* base canopy color options */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-base-content/70">
          <Palette className="w-3.5 h-3.5 text-primary" />
          <span>Base Canopy Fabric Color</span>
        </div>

        <div className="space-y-2">
          {colors.map((color) => {
            const isSelected = selectedColor.toLowerCase() === color.hex.toLowerCase();
            const isLight = isHexLight(color.hex);

            return (
              <button
                key={color.hex}
                type="button"
                onClick={() => {
                  onSelectColor(color.hex);
                  setIsCustomExpanded(false);
                }}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all bg-base-100 cursor-pointer ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                    : 'border-base-300 hover:border-base-content/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="canopy-color-tier"
                    checked={isSelected}
                    onChange={() => {}}
                    className="radio radio-primary radio-sm pointer-events-none"
                  />
                  <div
                    className="w-6 h-6 rounded-full border border-black/20 dark:border-white/30 shadow-xs shrink-0 relative"
                    style={{ backgroundColor: color.hex }}
                  >
                    {isSelected && (
                      <Check
                        className={`w-3.5 h-3.5 absolute inset-0 m-auto ${
                          isLight ? 'text-zinc-900' : 'text-white'
                        }`}
                        strokeWidth={3}
                      />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-base-content">{color.name}</div>
                    <div className="text-[11px] text-base-content/60 leading-tight">
                      {color.pantone ? `Pantone: ${color.pantone}` : 'Standard Solid Fabric'}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 ml-3">
                  <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-md bg-base-200 text-base-content border border-base-300">
                    {color.hex.toUpperCase()}
                  </span>
                </div>
              </button>
            );
          })}

          {/* custom hex color picker input */}
          <div
            className={`w-full rounded-xl border text-left transition-all bg-base-100 ${
              isCustom
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs'
                : 'border-base-300 hover:border-base-content/30'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setIsCustomExpanded((prev) => !prev);
              }}
              className="w-full flex items-center justify-between p-2.5 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="canopy-color-tier"
                  checked={isCustom}
                  onChange={() => {}}
                  className="radio radio-primary radio-sm pointer-events-none"
                />
                <div
                  className="w-6 h-6 rounded-full border border-black/20 dark:border-white/30 shadow-xs shrink-0 relative flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: isCustom ? selectedColor : 'transparent' }}
                >
                  <Pipette
                    className={`w-3.5 h-3.5 ${
                      isCustom
                        ? (isLightCustom ? 'text-zinc-900' : 'text-white')
                        : 'text-base-content/70'
                    }`}
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-base-content">Custom Color</div>
                  <div className="text-[11px] text-base-content/60 leading-tight">
                    Choose any custom HEX palette color
                  </div>
                </div>
              </div>

              <div className="shrink-0 ml-3">
                <span className="font-mono text-xs font-bold uppercase px-2 py-0.5 rounded-md bg-base-200 text-base-content border border-base-300">
                  CUSTOM
                </span>
              </div>
            </button>

            {isCustomExpanded && (
              <div className="px-3 pb-3 pt-1 border-t border-base-300/60 flex flex-col items-center gap-2.5">
                <div className="w-full pt-1 flex justify-center">
                  <HexColorPicker
                    color={selectedColor}
                    onChange={onSelectColor}
                    style={{ width: '100%', height: '160px' }}
                  />
                </div>
                <div className="w-full flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-bold text-base-content/60 uppercase">HEX Code:</span>
                  <div className="flex items-center">
                    <HexColorInput
                      color={selectedColor}
                      onChange={onSelectColor}
                      prefixed
                      className="input input-xs font-mono font-bold text-xs uppercase w-28 text-center bg-base-200 border-base-300 text-base-content focus:outline-primary"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
