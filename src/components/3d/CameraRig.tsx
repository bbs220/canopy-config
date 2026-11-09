import { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraPreset } from './ViewControls';
import { TENT_PRODUCT } from '../../config/tentProduct';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

export type CameraRigRef = {
  focusSection: (sectionId: string) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  takeSnapshot: (preset?: CameraPreset) => Promise<string>;
};

type CameraRigProps = {
  isAutoRotating: boolean;
  autoRotateSpeed: number;
};

const PRESET_CAMERA_VIEWS: Record<
  CameraPreset,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  isometric: { position: [2.8, 2.2, 3.2], target: [0, 1.2, 0] },
  front: { position: [0, 1.4, 3.4], target: [0, 1.2, 0] },
  right: { position: [3.4, 1.4, 0], target: [0, 1.2, 0] },
  back: { position: [0, 1.4, -3.4], target: [0, 1.2, 0] },
  left: { position: [-3.4, 1.4, 0], target: [0, 1.2, 0] },
  top: { position: [0, 4.2, 0.01], target: [0, 1.2, 0] },
};

export const CameraRig = forwardRef<CameraRigRef, CameraRigProps>(({
  isAutoRotating,
  autoRotateSpeed,
}, ref) => {
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  useGSAP();

  const focusSection = useCallback((sectionId: string) => {
    const section = TENT_PRODUCT.sections.find((s) => s.id === sectionId);
    if (!section) return;

    gsap.to(camera.position, {
      x: section.cameraView.position[0],
      y: section.cameraView.position[1],
      z: section.cameraView.position[2],
      duration: 1.0,
      ease: 'power2.out',
    });

    if (controlsRef.current) {
      gsap.to(controlsRef.current.target, {
        x: section.cameraView.target[0],
        y: section.cameraView.target[1],
        z: section.cameraView.target[2],
        duration: 1.0,
        ease: 'power2.out',
      });
    }
  }, [camera]);

  const setCameraPreset = useCallback((preset: CameraPreset) => {
    const view = PRESET_CAMERA_VIEWS[preset];
    if (!view) return;

    gsap.to(camera.position, {
      x: view.position[0],
      y: view.position[1],
      z: view.position[2],
      duration: 1.1,
      ease: 'power2.out',
    });

    if (controlsRef.current) {
      gsap.to(controlsRef.current.target, {
        x: view.target[0],
        y: view.target[1],
        z: view.target[2],
        duration: 1.1,
        ease: 'power2.out',
      });
    }
  }, [camera]);

  const takeSnapshot = useCallback(async (preset: CameraPreset = 'isometric'): Promise<string> => {
    if (!controlsRef.current) return '';

    const view = PRESET_CAMERA_VIEWS[preset];
    const originalPos = camera.position.clone();
    const originalTarget = controlsRef.current.target.clone();

    camera.position.set(...view.position);
    controlsRef.current.target.set(...view.target);
    camera.lookAt(...view.target);
    controlsRef.current.update();

    gl.render(scene, camera);
    const dataUrl = gl.domElement.toDataURL('image/png');

    camera.position.copy(originalPos);
    controlsRef.current.target.copy(originalTarget);
    controlsRef.current.update();

    return dataUrl;
  }, [camera, gl, scene]);

  useImperativeHandle(ref, () => ({
    focusSection,
    setCameraPreset,
    takeSnapshot,
  }), [focusSection, setCameraPreset, takeSnapshot]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[2.8, 2.2, 3.2]} fov={40} />
      <OrbitControls
        ref={controlsRef}
        enableRotate={true}
        enableZoom={true}
        enablePan={true}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={1.4}
        maxDistance={7.5}
        maxPolarAngle={Math.PI / 2 + 0.02}
        target={[0, 1.2, 0]}
        autoRotate={isAutoRotating}
        autoRotateSpeed={autoRotateSpeed}
      />
    </>
  );
});

CameraRig.displayName = 'CameraRig';
