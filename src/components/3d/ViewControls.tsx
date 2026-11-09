import React from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';

export type CameraPreset = 'isometric' | 'front' | 'back' | 'left' | 'right' | 'top';

type ViewControlsProps = {
  isAutoRotating: boolean;
  onToggleAutoRotate: () => void;
  onResetCamera: () => void;
};

export const ViewControls: React.FC<ViewControlsProps> = ({
  isAutoRotating,
  onToggleAutoRotate,
  onResetCamera,
}) => {
  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-base-100/85 backdrop-blur-md rounded-2xl border border-base-content/10 shadow-xl select-none">
      {/* auto rotate toggle */}
      <button
        type="button"
        onClick={onToggleAutoRotate}
        className={`btn btn-xs h-8 px-3 rounded-xl gap-1.5 font-medium transition-all ${
          isAutoRotating
            ? 'btn-primary shadow-sm'
            : 'btn-ghost text-base-content/75 hover:text-base-content'
        }`}
        title="Toggle 360° Auto-Rotation"
      >
        <RotateCw
          className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`}
          style={{ animationDuration: '6s' }}
        />
        <span>Auto-Rotate</span>
      </button>

      <div className="h-4 w-px bg-base-content/15 mx-0.5" />

      {/* reset camera button */}
      <button
        type="button"
        onClick={onResetCamera}
        className="btn btn-xs h-8 px-3 rounded-xl gap-1.5 font-medium btn-ghost text-base-content/75 hover:text-base-content hover:bg-base-200 transition-all"
        title="Reset Camera Position and Zoom"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset Camera</span>
      </button>
    </div>
  );
};
