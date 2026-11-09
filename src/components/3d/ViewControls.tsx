import React from 'react';
import { RotateCw, Compass } from 'lucide-react';

export type CameraPreset = 'isometric' | 'front' | 'back' | 'left' | 'right' | 'top';

interface ViewControlsProps {
  currentPreset?: CameraPreset;
  isAutoRotating: boolean;
  onSelectPreset: (preset: CameraPreset) => void;
  onToggleAutoRotate: () => void;
  onResetView?: () => void;
}

export const ViewControls: React.FC<ViewControlsProps> = ({
  currentPreset = 'isometric',
  isAutoRotating,
  onSelectPreset,
  onToggleAutoRotate,
  onResetView,
}) => {
  const presets: { id: CameraPreset; label: string; short: string }[] = [
    { id: 'isometric', label: '3D Angle', short: '3D' },
    { id: 'front', label: 'Front', short: 'F' },
    { id: 'right', label: 'Right', short: 'R' },
    { id: 'back', label: 'Back', short: 'B' },
    { id: 'left', label: 'Left', short: 'L' },
    { id: 'top', label: 'Top', short: 'Top' },
  ];

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-lg shadow-black/5">
      {/* Preset View Buttons */}
      <div className="flex items-center gap-1 bg-zinc-100/80 dark:bg-zinc-800/80 p-1 rounded-xl">
        {presets.map((preset) => {
          const isActive = currentPreset === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-700/50'
              }`}
              title={`View ${preset.label}`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-700 mx-1" />

      {/* Auto-Rotate 360 Toggle */}
      <button
        onClick={onToggleAutoRotate}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
          isAutoRotating
            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        }`}
        title="Toggle 360° Auto-Rotation"
      >
        <RotateCw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
        <span>360°</span>
      </button>

      {/* Zoom / Reset Quick Actions */}
      {onResetView && (
        <button
          onClick={onResetView}
          className="p-1.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Reset Camera View"
        >
          <Compass className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
