import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  ContactShadows,
  GizmoHelper,
  GizmoViewport,
  StatsGl,
  useGLTF,
} from "@react-three/drei";
import { CameraRig } from "./CameraRig";
import { ModelLoader } from "./ModelLoader";
import { ViewControls, type CameraPreset } from "./ViewControls";
import { useTweakpane } from "../../hooks/useTweakepane";
import { useThemeStore } from "../../store/useThemeStore";
import { useConfiguratorStore } from "../../store/useConfiguratorStore";
import { TextureAtlasEngine } from "../../utils/textureAtlas";

export type Canvas3DRef = {
  takeSnapshot: (angle?: CameraPreset) => Promise<string>;
  focusSection: (sectionId: string) => void;
  updateFabricTexture: (textureCanvas: HTMLCanvasElement) => void;
  updateBaseColor: (hexColor: string) => void;
};

type Canvas3DProps = {
  className?: string;
};

const ProductModelLoader = () => {
  const { product, selectedVariantId, baseColor, sections } =
    useConfiguratorStore();
  const currentVariant =
    product.variants.find((v) => v.id === selectedVariantId) ||
    product.variants[0];
  const { scene } = useGLTF(currentVariant.modelUrl);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const center = box.getCenter(new THREE.Vector3());
    clone.position.x = -center.x;
    clone.position.z = -center.z;
    clone.position.y = -box.min.y;
    return clone;
  }, [scene]);

  const fabricMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const canvasTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const atlasEngineRef = useRef<TextureAtlasEngine>(new TextureAtlasEngine());

  // setup meshes shadows and isolate fabric material
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const isFabricMat =
          mesh.material &&
          !Array.isArray(mesh.material) &&
          (mesh.material as THREE.Material).name === "fabric_Mat";

        if (isFabricMat) {
          const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
          mat.color.set(baseColor);
          mat.roughness = 0.75;
          mat.metalness = 0.05;
          if (canvasTextureRef.current) {
            mat.map = canvasTextureRef.current;
            mat.needsUpdate = true;
          }
          fabricMaterialRef.current = mat;
          mesh.material = mat;
        }
      }
    });
  }, [clonedScene, baseColor]);

  // update canvas texture on fabric material
  useEffect(() => {
    let isCancelled = false;
    atlasEngineRef.current
      .bakeAtlas(product.sections, sections, baseColor)
      .then((atlasCanvas) => {
        if (isCancelled) return;
        if (!canvasTextureRef.current) {
          const texture = new THREE.CanvasTexture(atlasCanvas);
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.flipY = false;
          texture.generateMipmaps = true;
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          canvasTextureRef.current = texture;
        } else {
          canvasTextureRef.current.image = atlasCanvas;
          canvasTextureRef.current.needsUpdate = true;
        }

        if (fabricMaterialRef.current) {
          fabricMaterialRef.current.map = canvasTextureRef.current;
          fabricMaterialRef.current.needsUpdate = true;
        }
      })
      .catch((err) => {
        console.error("texture bake failed", err);
      });

    return () => {
      isCancelled = true;
    };
  }, [sections, baseColor, product.sections]);

  // update base color
  useEffect(() => {
    if (fabricMaterialRef.current) {
      fabricMaterialRef.current.color.set(baseColor);
      fabricMaterialRef.current.needsUpdate = true;
    }
  }, [baseColor]);

  return <primitive object={clonedScene} />;
};

const Floor = () => {
  return (
    // photorealistic drei contact shadows
    <ContactShadows
      opacity={0.55}
      scale={10}
      blur={2.2}
      far={4}
      resolution={1024}
      position={[0, -0.005, 0]}
    />
  );
};

export const PrimaryScene = () => {
  const { theme } = useThemeStore();

  const {
    showFPS,
    showGizmo,
    ambientIntensity,
    sunIntensity,
    autoRotateSpeed,
  } = useTweakpane("3D Studio", {
    ambientIntensity: {
      value: 1.4,
      min: 0.1,
      max: 3.0,
      step: 0.1,
      label: "ambient light",
    },
    sunIntensity: {
      value: 2.2,
      min: 0.1,
      max: 5.0,
      step: 0.1,
      label: "sun light",
    },
    autoRotateSpeed: {
      value: 1.5,
      min: 0.1,
      max: 6.0,
      step: 0.2,
      label: "auto rotate speed",
    },
    showGizmo: {
      value: false,
      label: "show gizmo",
    },
    showFPS: {
      value: false,
      label: "show fps",
    },
  });

  const isDark = theme === "dark";
  const bgColor = isDark ? "#1d232a" : "#f3f4f6";

  return (
    <>
      <Suspense fallback={null}>
        {/* tent model with suspense */}
        <ProductModelLoader />
        <Floor />
        {/* visual scene helpers */}
        <StatsGl
          className={`${showFPS ? "block" : "hidden"} fixed top-75 left-4`}
          horizontal={false}
        />
        {/* dynamic theme background color */}
        <color attach="background" args={[bgColor]} />

        {/* studio lighting */}
        <ambientLight intensity={ambientIntensity} />
        <directionalLight
          position={[4, 7, 5]}
          intensity={sunIntensity}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={1}
          shadow-camera-far={18}
          shadow-bias={-0.0005}
          shadow-radius={2.5}
          shadow-camera-left={-3.5}
          shadow-camera-right={3.5}
          shadow-camera-top={3.5}
          shadow-camera-bottom={-3.5}
        />
        <directionalLight
          position={[-5, 4, -4]}
          intensity={1.0}
          color="#e0f2fe"
        />
        <directionalLight position={[0, 6, -5]} intensity={0.8} />

        {/* encapsulated camera and orbit controls rig with perspective camera */}
        <CameraRig autoRotateSpeed={autoRotateSpeed} />

        <GizmoHelper
          renderPriority={2}
          alignment="top-left"
          margin={[160, 289]}
          visible={showGizmo}
        >
          <group scale={[0.9, 0.9, 0.9]}>
            <GizmoViewport disabled visible={showGizmo} labelColor="white" />
          </group>
        </GizmoHelper>
      </Suspense>
    </>
  );
};

export const PrimaryCanvas = ({ className = "" }: Canvas3DProps) => {
  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden ${className}`}
    >
      {/* stream asset and initialization loader */}
      <ModelLoader />

      {/* top left stage navigation instructions without background */}
      <div className="absolute top-4 left-4 z-20 hidden md:flex items-center gap-2 text-[11px] text-base-content/70 select-none drop-shadow-xs pointer-events-none">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-base-content/90">L-Click</span>
          <span>Rotate</span>
        </div>
        <span className="opacity-40">•</span>
        <div className="flex items-center gap-1">
          <span className="font-semibold text-base-content/90">R-Click</span>
          <span>Pan</span>
        </div>
        <span className="opacity-40">•</span>
        <div className="flex items-center gap-1">
          <span className="font-semibold text-base-content/90">Scroll</span>
          <span>Zoom</span>
        </div>
      </div>

      <Canvas
        shadows="soft"
        gl={{
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
        }}
      >
        <PrimaryScene />
      </Canvas>

      {/* viewport floating preset controls */}
      <ViewControls />
    </div>
  );
};

export const Canvas3D = PrimaryCanvas;
export default PrimaryCanvas;
