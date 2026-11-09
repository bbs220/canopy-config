import { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
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

// pan limits boundary to keep camera centered around model
const PAN_LIMITS = {
  x: 2.0,
  y: 1.2,
  z: 1.5,
};

// scene center target coordinates
const SCENE_CENTER: [number, number, number] = [0, 1.2, 0];

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

  // clamp orbit controls pan target within bounding boundaries
  useFrame((state) => {
    if (!controlsRef.current) return;

    const currentX = controlsRef.current.target.x;
    const currentY = controlsRef.current.target.y;
    const currentZ = controlsRef.current.target.z;

    const clampedX = THREE.MathUtils.clamp(
      currentX,
      SCENE_CENTER[0] - PAN_LIMITS.x,
      SCENE_CENTER[0] + PAN_LIMITS.x,
    );
    const clampedY = THREE.MathUtils.clamp(
      currentY,
      SCENE_CENTER[1] - PAN_LIMITS.y,
      SCENE_CENTER[1] + PAN_LIMITS.y,
    );
    const clampedZ = THREE.MathUtils.clamp(
      currentZ,
      SCENE_CENTER[2] - PAN_LIMITS.z,
      SCENE_CENTER[2] + PAN_LIMITS.z,
    );

    const diffX = clampedX - currentX;
    const diffY = clampedY - currentY;
    const diffZ = clampedZ - currentZ;

    if (diffX !== 0 || diffY !== 0 || diffZ !== 0) {
      controlsRef.current.target.set(clampedX, clampedY, clampedZ);
      state.camera.position.x += diffX;
      state.camera.position.y += diffY;
      state.camera.position.z += diffZ;
    }
  });

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
