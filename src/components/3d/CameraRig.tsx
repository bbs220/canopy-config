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
import { useTweakpane } from "../../hooks/useTweakepane";

export type CameraRigRef = {
  focusSection: (sectionId: string) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  takeSnapshot: (preset?: CameraPreset) => Promise<string>;
};

type CameraRigProps = {
  isAutoRotating?: boolean;
  autoRotateSpeed?: number;
};

// pan limits boundary to keep camera centered around model
const PAN_LIMITS = {
  x: 2.0,
  y: 1.2,
  z: 1.5,
};

// scene center target coordinates
const SCENE_CENTER: [number, number, number] = [0, 0, 0];

export const CameraRig = ({
  isAutoRotating: propIsAutoRotating,
  autoRotateSpeed = 1.5,
}: CameraRigProps = {}) => {
  const { camera, gl, scene } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const selectedVariantId = useConfiguratorStore((s) => s.selectedVariantId);
  const activeSectionId = useConfiguratorStore((s) => s.activeSectionId);

  // live tweakpane parameters partitioned per model variant
  const tweakParams = useTweakpane("3D Studio", {
    fov5x5: {
      value: 60,
      min: 15,
      max: 100,
      step: 1,
      label: "fov",
      folder: "5x5 Tent",
    },
    zoom5x5: {
      value: 0.7,
      min: 0.5,
      max: 3.0,
      step: 0.05,
      label: "zoom",
      folder: "5x5 Tent",
    },
    minDist5x5: {
      value: 1.6,
      min: 0.5,
      max: 5.0,
      step: 0.1,
      label: "min distance",
      folder: "5x5 Tent",
    },
    maxDist5x5: {
      value: 10.0,
      min: 2.0,
      max: 20.0,
      step: 0.5,
      label: "max distance",
      folder: "5x5 Tent",
    },
    targetY5x5: {
      value: 0.9,
      min: -2.0,
      max: 3.0,
      step: 0.05,
      label: "target y",
      folder: "5x5 Tent",
    },
    posX5x5: {
      value: 0,
      min: -10.0,
      max: 10.0,
      step: 0.1,
      label: "pos x",
      folder: "5x5 Tent",
    },
    posY5x5: {
      value: 0,
      min: -10.0,
      max: 10.0,
      step: 0.1,
      label: "pos y",
      folder: "5x5 Tent",
    },
    posZ5x5: {
      value: 3.0,
      min: -10.0,
      max: 10.0,
      step: 0.1,
      label: "pos z",
      folder: "5x5 Tent",
    },

    fov6x5: {
      value: 60,
      min: 15,
      max: 100,
      step: 1,
      label: "fov",
      folder: "6.5x6.5 Tent",
    },
    zoom6x5: {
      value: 1.0,
      min: 0.5,
      max: 3.0,
      step: 0.05,
      label: "zoom",
      folder: "6.5x6.5 Tent",
    },
    minDist6x5: {
      value: 1.4,
      min: 0.5,
      max: 5.0,
      step: 0.1,
      label: "min distance",
      folder: "6.5x6.5 Tent",
    },
    maxDist6x5: {
      value: 8.5,
      min: 2.0,
      max: 20.0,
      step: 0.5,
      label: "max distance",
      folder: "6.5x6.5 Tent",
    },
    targetY6x5: {
      value: 0.9,
      min: -2.0,
      max: 3.0,
      step: 0.05,
      label: "target y",
      folder: "6.5x6.5 Tent",
    },
    posX6x5: {
      value: 0,
      min: -10.0,
      max: 10.0,
      step: 0.1,
      label: "pos x",
      folder: "6.5x6.5 Tent",
    },
    posY6x5: {
      value: 0,
      min: -10.0,
      max: 10.0,
      step: 0.1,
      label: "pos y",
      folder: "6.5x6.5 Tent",
    },
    posZ6x5: {
      value: 3.0,
      min: -10.0,
      max: 10.0,
      step: 0.1,
      label: "pos z",
      folder: "6.5x6.5 Tent",
    },

    fov8x8: {
      value: 60,
      min: 15,
      max: 100,
      step: 1,
      label: "fov",
      folder: "8x8 Tent",
    },
    zoom8x8: {
      value: 0.7,
      min: 0.5,
      max: 3.0,
      step: 0.05,
      label: "zoom",
      folder: "8x8 Tent",
    },
    minDist8x8: {
      value: 1.6,
      min: 0.5,
      max: 5.0,
      step: 0.1,
      label: "min distance",
      folder: "8x8 Tent",
    },
    maxDist8x8: {
      value: 10.0,
      min: 2.0,
      max: 20.0,
      step: 0.5,
      label: "max distance",
      folder: "8x8 Tent",
    },
    targetY8x8: {
      value: 0.9,
      min: -2.0,
      max: 3.0,
      step: 0.05,
      label: "target y",
      folder: "8x8 Tent",
    },
    posX8x8: {
      value: 0,
      min: -10.0,
      max: 10.0,
      step: 0.1,
      label: "pos x",
      folder: "8x8 Tent",
    },
    posY8x8: {
      value: 0,
      min: -10.0,
      max: 10.0,
      step: 0.1,
      label: "pos y",
      folder: "8x8 Tent",
    },
    posZ8x8: {
      value: 3.0,
      min: -10.0,
      max: 10.0,
      step: 0.1,
      label: "pos z",
      folder: "8x8 Tent",
    },
  });

  // select active camera config for current variant
  const activeConfig = useMemo(() => {
    if (selectedVariantId === "tent-8x8") {
      return {
        fov: tweakParams.fov8x8,
        zoom: tweakParams.zoom8x8,
        minDistance: tweakParams.minDist8x8,
        maxDistance: tweakParams.maxDist8x8,
        targetY: tweakParams.targetY8x8,
        posX: tweakParams.posX8x8,
        posY: tweakParams.posY8x8,
        posZ: tweakParams.posZ8x8,
      };
    }
    if (selectedVariantId === "tent-6.5x6.5") {
      return {
        fov: tweakParams.fov6x5,
        zoom: tweakParams.zoom6x5,
        minDistance: tweakParams.minDist6x5,
        maxDistance: tweakParams.maxDist6x5,
        targetY: tweakParams.targetY6x5,
        posX: tweakParams.posX6x5,
        posY: tweakParams.posY6x5,
        posZ: tweakParams.posZ6x5,
      };
    }
    return {
      fov: tweakParams.fov5x5,
      zoom: tweakParams.zoom5x5,
      minDistance: tweakParams.minDist5x5,
      maxDistance: tweakParams.maxDist5x5,
      targetY: tweakParams.targetY5x5,
      posX: tweakParams.posX5x5,
      posY: tweakParams.posY5x5,
      posZ: tweakParams.posZ5x5,
    };
  }, [selectedVariantId, tweakParams]);

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
        position: [posX, posY * 0.5, 0],
        target: [0, targetY, 0],
      },
      back: {
        position: [0, posY * 0.5, -posZ],
        target: [0, targetY, 0],
      },
      left: {
        position: [-posX, posY * 0.5, 0],
        target: [0, targetY, 0],
      },
      top: {
        position: [0, posY * 1.5, 0.01],
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
    async (preset: CameraPreset = "isometric"): Promise<string> => {
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
      console.log(`[Reset Camera - ${selectedVariantId}]`);
      console.log(`  position: [${presetViews.front.position.join(", ")}]`);
      console.log(`  target: [0, ${activeConfig.targetY}, 0]`);
      console.log(`  fov: ${activeConfig.fov}, zoom: ${activeConfig.zoom}`);
      console.log(
        `  minDistance: ${activeConfig.minDistance}, maxDistance: ${activeConfig.maxDistance}`,
      );
    });
    setSnapshotHandler(takeSnapshot);
  }, [
    setResetCameraHandler,
    setSnapshotHandler,
    setCameraPreset,
    takeSnapshot,
    selectedVariantId,
    presetViews.front.position,
    activeConfig,
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
