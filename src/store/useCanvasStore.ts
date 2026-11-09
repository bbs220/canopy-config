import { create } from 'zustand';
import type { CameraPreset } from '../components/3d/ViewControls';

type CanvasState = {
  isAutoRotating: boolean;
  setIsAutoRotating: (value: boolean | ((prev: boolean) => boolean)) => void;
  toggleAutoRotate: () => void;
  resetCamera: () => void;
  takeSnapshot: (preset?: CameraPreset) => Promise<string>;
  setResetCameraHandler: (fn: () => void) => void;
  setSnapshotHandler: (fn: (preset?: CameraPreset) => Promise<string>) => void;
};

// store for decoupling threed canvas actions from parent dom components
export const useCanvasStore = create<CanvasState>((set, get) => ({
  isAutoRotating: false,
  setIsAutoRotating: (value) => {
    if (typeof value === 'function') {
      set({ isAutoRotating: value(get().isAutoRotating) });
    } else {
      set({ isAutoRotating: value });
    }
  },
  toggleAutoRotate: () => {
    set({ isAutoRotating: !get().isAutoRotating });
  },
  resetCamera: () => {},
  takeSnapshot: async () => '',
  setResetCameraHandler: (fn) => {
    set({ resetCamera: fn });
  },
  setSnapshotHandler: (fn) => {
    set({ takeSnapshot: fn });
  },
}));
