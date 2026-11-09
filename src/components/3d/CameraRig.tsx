import { useRef, useCallback, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { CameraPreset } from "./ViewControls";
import { TENT_PRODUCT } from "../../config/tentProduct";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useCanvasStore } from "../../store/useCanvasStore";
import { useConfiguratorStore } from "../../store/useConfiguratorStore";

export type CameraRigRef = {
  focusSection: (sectionId: string) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  takeSnapshot: (preset?: CameraPreset) => Promise<string>;
};

type CameraRigProps = {
  isAutoRotating?: boolean;
  autoRotateSpeed?: number;
};

type VariantCameraConfig = {
  fov: number;
  zoom: number;
  minDistance: number;
  maxDistance: number;
  targetY: number;
  posX: number;
  posY: number;
  posZ: number;
};

// pan limits boundary to keep camera centered around model
const PAN_LIMITS = {
  x: 2.0,
  y: 1.2,
  z: 1.5,
};

// scene center target coordinates
const SCENE_CENTER: [number, number, number] = [0, 0, 0];

// camera parameters partitioned per model variant
const VARIANT_CAMERA_CONFIGS: Record<string, VariantCameraConfig> = {
  "tent-5x5": {
    fov: 60,
    zoom: 0.7,
    minDistance: 1.6,
    maxDistance: 10.0,
    targetY: 0.9,
    posX: 0,
    posY: 0,
    posZ: 3.0,
  },
  "tent-6.5x6.5": {
    fov: 60,
    zoom: 1.0,
    minDistance: 1.4,
    maxDistance: 8.5,
    targetY: 0.9,
    posX: 0,
    posY: 0,
    posZ: 3.0,
  },
  "tent-8x8": {
    fov: 60,
    zoom: 0.7,
    minDistance: 1.6,
    maxDistance: 10.0,
    targetY: 0.9,
    posX: 0,
    posY: 0,
    posZ: 3.0,
  },
};

export const CameraRig = ({
  isAutoRotating: propIsAutoRotating,
  autoRotateSpeed = 1.5,
}: CameraRigProps = {}) => {
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const selectedVariantId = useConfiguratorStore((s) => s.selectedVariantId);
  const activeSectionId = useConfiguratorStore((s) => s.activeSectionId);

  // select active camera config for current variant
  const activeConfig = useMemo(() => {
    return (
      VARIANT_CAMERA_CONFIGS[selectedVariantId] ||
      VARIANT_CAMERA_CONFIGS["tent-5x5"]
    );
  }, [selectedVariantId]);

  const presetViews: Record<
    CameraPreset,
    { position: [number, number, number]; target: [number, number, number] }
  > = useMemo(() => {
    const { posX, posY, posZ, targetY } = activeConfig;
    return {
      isometric: {
        position: [posX, posY, posZ],
        target: [0, targetY, 0],
      },
      front: {
        position: [posX, posY, posZ],
        target: [0, targetY, 0],
      },
      right: {
        position: [posZ, posY, 0],
        target: [0, targetY, 0],
      },
      back: {
        position: [posX, posY, -posZ],
        target: [0, targetY, 0],
      },
      left: {
        position: [-posZ, posY, 0],
        target: [0, targetY, 0],
      },
      top: {
        position: [0, posY + posZ, 0.01],
        target: [0, targetY, 0],
      },
    };
  }, [activeConfig]);

  const storeIsAutoRotating = useCanvasStore((s) => s.isAutoRotating);
  const setIsAutoRotating = useCanvasStore((s) => s.setIsAutoRotating);
  const setResetCameraHandler = useCanvasStore((s) => s.setResetCameraHandler);
  const setSnapshotHandler = useCanvasStore((s) => s.setSnapshotHandler);

  const isAutoRotating = propIsAutoRotating ?? storeIsAutoRotating;

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
      activeConfig.targetY - PAN_LIMITS.y,
      activeConfig.targetY + PAN_LIMITS.y,
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

  // sync camera position when active model configuration changes
  useEffect(() => {
    camera.position.set(
      presetViews.front.position[0],
      presetViews.front.position[1],
      presetViews.front.position[2],
    );
    camera.lookAt(0, activeConfig.targetY, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, activeConfig.targetY, 0);
      controlsRef.current.update();
    }
  }, [camera, presetViews.front.position, activeConfig.targetY]);

  // sync projection matrix on fov or zoom changes
  useEffect(() => {
    camera.updateProjectionMatrix();
  }, [camera, activeConfig.fov, activeConfig.zoom]);

  const focusSection = useCallback(
    (sectionId: string) => {
      const section = TENT_PRODUCT.sections.find((s) => s.id === sectionId);
      if (!section) return;

      gsap.to(camera.position, {
        x: section.cameraView.position[0],
        y: section.cameraView.position[1],
        z: section.cameraView.position[2],
        duration: 1.0,
        ease: "power2.out",
      });

      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x: section.cameraView.target[0],
          y: section.cameraView.target[1],
          z: section.cameraView.target[2],
          duration: 1.0,
          ease: "power2.out",
        });
      }
    },
    [camera],
  );

  const setCameraPreset = useCallback(
    (preset: CameraPreset) => {
      const view = presetViews[preset];
      if (!view) return;

      gsap.to(camera.position, {
        x: view.position[0],
        y: view.position[1],
        z: view.position[2],
        duration: 1.1,
        ease: "power2.out",
      });

      if (controlsRef.current) {
        gsap.to(controlsRef.current.target, {
          x: view.target[0],
          y: view.target[1],
          z: view.target[2],
          duration: 1.1,
          ease: "power2.out",
        });
      }
    },
    [camera, presetViews],
  );

  const takeSnapshot = useCallback(
    async (preset: CameraPreset = "front"): Promise<string> => {
      if (!controlsRef.current) return "";

      const view = presetViews[preset];
      const originalPos = camera.position.clone();
      const originalTarget = controlsRef.current.target.clone();

      camera.position.set(...view.position);
      controlsRef.current.target.set(...view.target);
      camera.lookAt(...view.target);
      controlsRef.current.update();

      gl.render(scene, camera);
      const dataUrl = gl.domElement.toDataURL("image/png");

      camera.position.copy(originalPos);
      controlsRef.current.target.copy(originalTarget);
      controlsRef.current.update();

      return dataUrl;
    },
    [camera, gl, scene, presetViews],
  );

  useEffect(() => {
    setResetCameraHandler(() => {
      setCameraPreset("front");
    });
    setSnapshotHandler(takeSnapshot);
  }, [
    setResetCameraHandler,
    setSnapshotHandler,
    setCameraPreset,
    takeSnapshot,
  ]);

  const prevSectionIdRef = useRef<string>(activeSectionId);

  // only focus section when user changes active section
  useEffect(() => {
    if (prevSectionIdRef.current !== activeSectionId) {
      prevSectionIdRef.current = activeSectionId;
      if (activeSectionId) {
        setIsAutoRotating(false);
        focusSection(activeSectionId);
      }
    }
  }, [activeSectionId, setIsAutoRotating, focusSection]);

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={presetViews.front.position}
        fov={activeConfig.fov}
        zoom={activeConfig.zoom}
      />
      <OrbitControls
        ref={controlsRef}
        enableRotate={true}
        enableZoom={true}
        enablePan={true}
        enableDamping={true}
        dampingFactor={0.05}
        minDistance={activeConfig.minDistance}
        maxDistance={activeConfig.maxDistance}
        maxPolarAngle={Math.PI / 2 + 0.02}
        target={[0, activeConfig.targetY, 0]}
        autoRotate={isAutoRotating}
        autoRotateSpeed={autoRotateSpeed}
      />
    </>
  );
};
