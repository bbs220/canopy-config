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
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, useGLTF } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ViewControls, type CameraPreset } from './ViewControls';
import { useTweakpane } from '../../hooks/useTweakepane';
import { useThemeStore } from '../../store/useThemeStore';
import { TENT_PRODUCT } from '../../config/tentProduct';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

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

// Preload all 3 size variant GLTF models
useGLTF.preload('/models/Tent_5_5.glb');
useGLTF.preload('/models/Tent_6_5_6_5.glb');
useGLTF.preload('/models/Tent_8_8.glb');

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
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
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

  // Ground and center model at Y=0
  useEffect(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const center = box.getCenter(new THREE.Vector3());
    clonedScene.position.x = -center.x;
    clonedScene.position.z = -center.z;
    clonedScene.position.y = -box.min.y;
  }, [clonedScene]);

  return <primitive object={clonedScene} />;
}

// Scene Bridge to access Three.js state (camera, gl, controls) from parent
interface SceneBridgeProps {
  onReady: (bridge: {
    camera: THREE.PerspectiveCamera;
    gl: THREE.WebGLRenderer;
    controls: OrbitControlsImpl | null;
  }) => void;
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
  isAutoRotating: boolean;
  autoRotateSpeed: number;
}

function SceneBridge({
  onReady,
  controlsRef,
  isAutoRotating,
  autoRotateSpeed,
}: SceneBridgeProps) {
  const { camera, gl } = useThree();

  useEffect(() => {
    onReady({
      camera: camera as THREE.PerspectiveCamera,
      gl,
      controls: controlsRef.current,
    });
  }, [camera, gl, controlsRef, onReady]);

  return (
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
  );
}

export const Canvas3D = forwardRef<Canvas3DRef, Canvas3DProps>(({
  modelUrl,
  baseColor = '#FFFFFF',
  activeSectionId,
  className = '',
}, ref) => {
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>('isometric');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);
  const [activeTextureCanvas, setActiveTextureCanvas] = useState<HTMLCanvasElement | null>(null);
  const [activeBaseColor, setActiveBaseColor] = useState<string>(baseColor);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const sceneBridgeRef = useRef<{
    camera: THREE.PerspectiveCamera;
    gl: THREE.WebGLRenderer;
    controls: OrbitControlsImpl | null;
  } | null>(null);

  // Official @gsap/react hook integration with scoped context & memory-safe cleanup
  const { contextSafe } = useGSAP({ scope: containerRef });

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

  // Focus Section via GSAP contextSafe
  const focusSection = contextSafe((sectionId: string) => {
    const section = TENT_PRODUCT.sections.find((s) => s.id === sectionId);
    const bridge = sceneBridgeRef.current;
    if (!section || !bridge) return;

    setIsAutoRotating(false);
    gsap.to(bridge.camera.position, {
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
  });

  // Set Camera Preset via GSAP contextSafe
  const setCameraPreset = contextSafe((preset: CameraPreset) => {
    const view = PRESET_CAMERA_VIEWS[preset];
    const bridge = sceneBridgeRef.current;
    if (!view || !bridge) return;

    setCurrentPreset(preset);
    setIsAutoRotating(false);
    gsap.to(bridge.camera.position, {
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
  });

  // High-Res WebGL Snapshot
  const takeSnapshot = useCallback(async (preset: CameraPreset = 'isometric'): Promise<string> => {
    const bridge = sceneBridgeRef.current;
    if (!bridge || !controlsRef.current) return '';

    const { camera, gl } = bridge;
    const view = PRESET_CAMERA_VIEWS[preset];

    const originalPos = camera.position.clone();
    const originalTarget = controlsRef.current.target.clone();

    camera.position.set(...view.position);
    controlsRef.current.target.set(...view.target);
    camera.lookAt(...view.target);
    controlsRef.current.update();

    gl.render(gl.domElement as unknown as THREE.Scene, camera);
    const dataUrl = gl.domElement.toDataURL('image/png');

    camera.position.copy(originalPos);
    controlsRef.current.target.copy(originalTarget);
    controlsRef.current.update();

    return dataUrl;
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
      focusSection(activeSectionId);
    }
  }, [activeSectionId, focusSection]);

  return (
    <div ref={containerRef} className={`relative w-full h-full select-none overflow-hidden ${className}`}>
      {/* Declarative R3F Canvas */}
      <Canvas
        camera={{ position: [2.8, 2.2, 3.2], fov: 40 }}
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

        {/* Declarative Drei Controls */}
        <SceneBridge
          onReady={(bridge) => {
            sceneBridgeRef.current = bridge;
          }}
          controlsRef={controlsRef}
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

      {/* Viewport Floating Preset Controls */}
      <ViewControls
        currentPreset={currentPreset}
        isAutoRotating={isAutoRotating}
        onSelectPreset={setCameraPreset}
        onToggleAutoRotate={() => setIsAutoRotating((prev) => !prev)}
        onResetView={() => setCameraPreset('isometric')}
      />
    </div>
  );
});

Canvas3D.displayName = 'Canvas3D';
