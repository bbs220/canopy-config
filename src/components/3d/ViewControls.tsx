import React from 'react';
import { RotateCw, RotateCcw } from 'lucide-react';
import { useCanvasStore } from '../../store/useCanvasStore';

export type CameraPreset = 'isometric' | 'front' | 'back' | 'left' | 'right' | 'top';

type ViewControlsProps = {
  isAutoRotating?: boolean;
  onToggleAutoRotate?: () => void;
  onResetCamera?: () => void;
};

export const ViewControls: React.FC<ViewControlsProps> = ({
  isAutoRotating: propIsAutoRotating,
  onToggleAutoRotate: propOnToggleAutoRotate,
  onResetCamera: propOnResetCamera,
}) => {
  const storeIsAutoRotating = useCanvasStore((s) => s.isAutoRotating);
  const storeToggleAutoRotate = useCanvasStore((s) => s.toggleAutoRotate);
  const storeResetCamera = useCanvasStore((s) => s.resetCamera);

  const isAutoRotating = propIsAutoRotating ?? storeIsAutoRotating;
  const onToggleAutoRotate = propOnToggleAutoRotate ?? storeToggleAutoRotate;
  const onResetCamera = propOnResetCamera ?? storeResetCamera;

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-base-100/85 backdrop-blur-md rounded-2xl border border-base-content/10 shadow-xl select-none max-w-[calc(100%-2rem)] flex-nowrap shrink-0">
      {/* auto rotate toggle */}
      <button
        type="button"
        onClick={onToggleAutoRotate}
        className={`btn btn-sm h-8 min-h-8 px-2.5 sm:px-3 rounded-xl gap-1.5 text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
          isAutoRotating
            ? 'btn-primary shadow-sm'
            : 'btn-ghost text-base-content/75 hover:text-base-content'
        }`}
        title="Toggle 360° Auto-Rotation"
      >
        <RotateCw
          className={`w-3.5 h-3.5 shrink-0 ${isAutoRotating ? 'animate-spin' : ''}`}
          style={{ animationDuration: '6s' }}
        />
        <span className="whitespace-nowrap">Auto-Rotate</span>
      </button>

      <div className="h-4 w-px bg-base-content/15 mx-0.5 shrink-0" />

      {/* reset camera button */}
      <button
        type="button"
        onClick={onResetCamera}
        className="btn btn-sm h-8 min-h-8 px-2.5 sm:px-3 rounded-xl gap-1.5 text-xs font-semibold whitespace-nowrap btn-ghost text-base-content/75 hover:text-base-content hover:bg-base-200 transition-all shrink-0"
        title="Reset Camera Position and Zoom"
      >
        <RotateCcw className="w-3.5 h-3.5 shrink-0" />
        <span className="whitespace-nowrap">Reset Camera</span>
      </button>
    </div>
  );
};
