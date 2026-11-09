import { useEffect, useState } from 'react';
import { useProgress, useGLTF } from '@react-three/drei';
import { tentPaths } from '../../utils/assetPaths';

export type ModelLoaderProps = {
  title?: string;
};

export const ModelLoader = ({ title = 'INITIALIZING 3D ENVIRONMENT...' }: ModelLoaderProps) => {
  const { progress, active } = useProgress();

  // decouple visibility from fading to ensure we cover the threed canvas setup
  const [visible, setVisible] = useState<boolean>(true);
  const [isFading, setIsFading] = useState<boolean>(false);

  useEffect(() => {
    // only trigger the exit sequence when all assets are fully loaded
    if (!active && progress === 100) {
      // grace period before starting fade out
      const fadeTimer = setTimeout(() => setIsFading(true), 1200);

      // unmount the component entirely after the css transition finishes
      const unmountTimer = setTimeout(() => setVisible(false), 1200 + 700);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [active, progress]);

  // remove from dom entirely once fade is complete
  if (!visible) return null;

  return (
    <div
      role="progressbar"
      aria-label={title}
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-live="polite"
      className={`absolute inset-0 z-50 flex flex-col items-center justify-center bg-base-100/90 backdrop-blur-md transition-opacity duration-700 pointer-events-none select-none ${
        isFading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex w-72 sm:w-80 flex-col items-center p-6 rounded-2xl bg-base-200/70 border border-base-content/10 shadow-2xl">
        <span className="loading loading-spinner loading-md text-primary mb-3" />

        <div className="text-xs font-bold tracking-[0.25em] text-base-content uppercase mb-3 text-center">
          {title}
        </div>

        {/* progress track */}
        <div className="h-2 w-full rounded-full bg-base-300 overflow-hidden relative">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(progress, 5)}%` }}
          />
        </div>

        {/* status indicators */}
        <div className="mt-3 flex w-full justify-between items-center text-[11px] font-mono text-base-content/60">
          <span className="font-semibold">
            {progress >= 100 ? 'FINALIZING TEXTURES' : 'STREAMING ASSETS'}
          </span>
          <span className="font-bold text-primary">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

export default ModelLoader;

// preload all three size variant gltf models
useGLTF.preload(tentPaths.fiveByFive);
useGLTF.preload(tentPaths.sixByFive);
useGLTF.preload(tentPaths.eightByEight);
