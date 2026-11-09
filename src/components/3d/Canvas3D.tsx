import {
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
  Suspense,
  useEffect,
  useMemo,
} from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, useGLTF } from '@react-three/drei';
import { CameraRig, type CameraRigRef } from './CameraRig';
import { ModelLoader } from './ModelLoader';
import { ViewControls, type CameraPreset } from './ViewControls';
import { useTweakpane } from '../../hooks/useTweakepane';
import { useThemeStore } from '../../store/useThemeStore';

export interface Canvas3DRef {
  takeSnapshot: (angle?: CameraPreset) => Promise<string>;
  focusSection: (sectionId: string) => void;
  updateFabricTexture: (textureCanvas: HTMLCanvasElement) => void;
  updateBaseColor: (hexColor: string) => void;
}

interface Canvas3DProps {
  modelUrl: string;
  baseColor?: string;
  activeSectionId?: string;
  className?: string;
}


interface ModelProps {
  url: string;
  baseColor: string;
  fabricTextureCanvas: HTMLCanvasElement | null;
  roughness: number;
  metalness: number;
  onLoaded?: () => void;
}

function TentModel({
  url,
  baseColor,
  fabricTextureCanvas,
  roughness,
  metalness,
  onLoaded,
}: ModelProps) {
  const { scene } = useGLTF(url);
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

  // Setup meshes, shadows, and isolate fabric material
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (
          mesh.name.toLowerCase().includes('fabric') ||
          (mesh.material && (mesh.material as THREE.Material).name === 'fabric_Mat')
        ) {
          if (mesh.material && !Array.isArray(mesh.material)) {
            const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
            mat.color.set(baseColor);
            mat.roughness = roughness;
            mat.metalness = metalness;
            fabricMaterialRef.current = mat;
            mesh.material = mat;
          }
        }
      }
    });

    onLoaded?.();
  }, [clonedScene, baseColor, roughness, metalness, onLoaded]);

  // Update canvas texture on fabric material
  useEffect(() => {
    if (!fabricTextureCanvas || !fabricMaterialRef.current) return;

    if (!canvasTextureRef.current) {
      const texture = new THREE.CanvasTexture(fabricTextureCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      canvasTextureRef.current = texture;
      fabricMaterialRef.current.map = texture;
    } else {
      canvasTextureRef.current.needsUpdate = true;
    }
    fabricMaterialRef.current.needsUpdate = true;
  }, [fabricTextureCanvas]);

  // Update base color
  useEffect(() => {
    if (fabricMaterialRef.current) {
      fabricMaterialRef.current.color.set(baseColor);
      fabricMaterialRef.current.needsUpdate = true;
    }
  }, [baseColor]);

  return <primitive object={clonedScene} />;
}

export const Canvas3D = forwardRef<Canvas3DRef, Canvas3DProps>(({
  modelUrl,
  baseColor = '#FFFFFF',
  activeSectionId,
  className = '',
}, ref) => {
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [activeTextureCanvas, setActiveTextureCanvas] = useState<HTMLCanvasElement | null>(null);
  const [activeBaseColor, setActiveBaseColor] = useState<string>(baseColor);

  const cameraRigRef = useRef<CameraRigRef>(null);

  const theme = useThemeStore((s) => s.theme);
  const bgColor = theme === 'dark' ? '#1d232a' : '#f3f4f6';

  // Tweakpane live controls
  const tweakParams = useTweakpane('3D Studio', {
    exposure: { value: 1.1, min: 0.2, max: 2.5, step: 0.05, folder: 'Environment' },
    ambientIntensity: { value: 1.4, min: 0.1, max: 3.0, step: 0.1, folder: 'Lighting' },
    sunIntensity: { value: 2.2, min: 0.1, max: 5.0, step: 0.1, folder: 'Lighting' },
    fabricRoughness: { value: 0.75, min: 0.0, max: 1.0, step: 0.05, folder: 'Materials' },
    fabricMetalness: { value: 0.05, min: 0.0, max: 1.0, step: 0.05, folder: 'Materials' },
    autoRotateSpeed: { value: 1.5, min: 0.1, max: 6.0, step: 0.2, folder: 'Camera' },
  });

  // Focus Section via CameraRig
  const focusSection = useCallback((sectionId: string) => {
    setIsAutoRotating(false);
    cameraRigRef.current?.focusSection(sectionId);
  }, []);

  const resetCamera = useCallback(() => {
    setIsAutoRotating(false);
    cameraRigRef.current?.setCameraPreset('isometric');
  }, []);

  // High-Res WebGL Snapshot
  const takeSnapshot = useCallback(async (preset: CameraPreset = 'isometric'): Promise<string> => {
    return (await cameraRigRef.current?.takeSnapshot(preset)) ?? '';
  }, []);

  // Update canvas texture
  const updateFabricTexture = useCallback((textureCanvas: HTMLCanvasElement) => {
    setActiveTextureCanvas(textureCanvas);
  }, []);

  // Update base color
  const updateBaseColor = useCallback((hex: string) => {
    setActiveBaseColor(hex);
  }, []);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    takeSnapshot,
    focusSection,
    updateFabricTexture,
    updateBaseColor,
  }), [takeSnapshot, focusSection, updateFabricTexture, updateBaseColor]);

  // Sync camera when active section changes
  useEffect(() => {
    if (activeSectionId) {
      cameraRigRef.current?.focusSection(activeSectionId);
    }
  }, [activeSectionId]);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden ${className}`}>
      {/* Declarative R3F Canvas - no camera prop, PerspectiveCamera is mounted inside CameraRig */}
      <Canvas
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: tweakParams.exposure,
        }}
        shadows
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        {/* Dynamic theme background color */}
        <color attach="background" args={[bgColor]} />

        {/* Studio Lighting */}
        <ambientLight intensity={tweakParams.ambientIntensity} />
        <directionalLight
          position={[4, 7, 5]}
          intensity={tweakParams.sunIntensity}
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
        <directionalLight position={[-5, 4, -4]} intensity={1.0} color="#e0f2fe" />
        <directionalLight position={[0, 6, -5]} intensity={0.8} />

        {/* Encapsulated Camera & OrbitControls Rig with PerspectiveCamera */}
        <CameraRig
          ref={cameraRigRef}
          isAutoRotating={isAutoRotating}
          autoRotateSpeed={tweakParams.autoRotateSpeed}
        />

        {/* Tent Model with Suspense */}
        <Suspense fallback={null}>
          <TentModel
            url={modelUrl}
            baseColor={activeBaseColor}
            fabricTextureCanvas={activeTextureCanvas}
            roughness={tweakParams.fabricRoughness}
            metalness={tweakParams.fabricMetalness}
          />
        </Suspense>

        {/* Photorealistic Drei Contact Shadows */}
        <ContactShadows
          opacity={0.55}
          scale={10}
          blur={2.2}
          far={4}
          resolution={1024}
          position={[0, -0.005, 0]}
        />
      </Canvas>

      {/* Global 3D Asset Stream & Initialization Loader */}
      <ModelLoader />

      {/* Viewport Floating Preset Controls */}
      <ViewControls
        isAutoRotating={isAutoRotating}
        onToggleAutoRotate={() => setIsAutoRotating((prev) => !prev)}
        onResetCamera={resetCamera}
      />
    </div>
  );
});

Canvas3D.displayName = 'Canvas3D';
