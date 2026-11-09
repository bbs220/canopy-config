import { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ViewControls, type CameraPreset } from './ViewControls';
import { useTweakpane } from '../../hooks/useTweakepane';
import { TENT_PRODUCT } from '../../config/tentProduct';
import { useThemeStore } from '../../store/useThemeStore';
import { Loader2 } from 'lucide-react';
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

const PRESET_CAMERA_VIEWS: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  isometric: { position: [2.8, 2.2, 3.2], target: [0, 1.2, 0] },
  front: { position: [0, 1.4, 3.4], target: [0, 1.2, 0] },
  right: { position: [3.4, 1.4, 0], target: [0, 1.2, 0] },
  back: { position: [0, 1.4, -3.4], target: [0, 1.2, 0] },
  left: { position: [-3.4, 1.4, 0], target: [0, 1.2, 0] },
  top: { position: [0, 4.2, 0.01], target: [0, 1.2, 0] },
};

export const Canvas3D = forwardRef<Canvas3DRef, Canvas3DProps>(({
  modelUrl,
  baseColor = '#FFFFFF',
  activeSectionId,
  className = '',
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPreset, setCurrentPreset] = useState<CameraPreset>('isometric');
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(false);

  // Three.js instances stored in refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelRef = useRef<THREE.Group | null>(null);
  const fabricMeshRef = useRef<THREE.Mesh | null>(null);
  const fabricMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const masterCanvasTextureRef = useRef<THREE.CanvasTexture | null>(null);

  // Connect Tweakpane controls for live scene tuning
  const tweakParams = useTweakpane('3D Studio', {
    exposure: { value: 1.1, min: 0.2, max: 2.5, step: 0.05, folder: 'Environment' },
    ambientIntensity: { value: 1.4, min: 0.1, max: 3.0, step: 0.1, folder: 'Lighting' },
    sunIntensity: { value: 2.2, min: 0.1, max: 5.0, step: 0.1, folder: 'Lighting' },
    fabricRoughness: { value: 0.75, min: 0.0, max: 1.0, step: 0.05, folder: 'Materials' },
    fabricMetalness: { value: 0.05, min: 0.0, max: 1.0, step: 0.05, folder: 'Materials' },
    autoRotateSpeed: { value: 1.5, min: 0.1, max: 6.0, step: 0.2, folder: 'Camera' },
  });

  // Reference for lights to update via Tweakpane
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  const theme = useThemeStore((s) => s.theme);

  // Sync background color with DaisyUI theme
  useEffect(() => {
    const bgColor = theme === 'dark' ? '#1d232a' : '#f3f4f6';
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(bgColor);
    }
    if (rendererRef.current) {
      rendererRef.current.setClearColor(bgColor, 1);
    }
  }, [theme]);

  // Sync Tweakpane values to Three.js scene
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = tweakParams.exposure;
    }
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = tweakParams.ambientIntensity;
    }
    if (sunLightRef.current) {
      sunLightRef.current.intensity = tweakParams.sunIntensity;
    }
    if (fabricMaterialRef.current) {
      fabricMaterialRef.current.roughness = tweakParams.fabricRoughness;
      fabricMaterialRef.current.metalness = tweakParams.fabricMetalness;
    }
    if (controlsRef.current) {
      controlsRef.current.autoRotateSpeed = tweakParams.autoRotateSpeed;
    }
  }, [tweakParams]);

  // Focus on a specific section
  const focusSection = useCallback((sectionId: string) => {
    const section = TENT_PRODUCT.sections.find((s) => s.id === sectionId);
    if (!section || !cameraRef.current || !controlsRef.current) return;

    setIsAutoRotating(false);
    gsap.to(cameraRef.current.position, {
      x: section.cameraView.position[0],
      y: section.cameraView.position[1],
      z: section.cameraView.position[2],
      duration: 1.0,
      ease: 'power2.out',
    });
    gsap.to(controlsRef.current.target, {
      x: section.cameraView.target[0],
      y: section.cameraView.target[1],
      z: section.cameraView.target[2],
      duration: 1.0,
      ease: 'power2.out',
    });
  }, []);

  // Update base color of fabric
  const updateBaseColor = useCallback((hexColor: string) => {
    if (fabricMaterialRef.current) {
      fabricMaterialRef.current.color.set(hexColor);
      fabricMaterialRef.current.needsUpdate = true;
    }
  }, []);

  // Update master canvas texture
  const updateFabricTexture = useCallback((textureCanvas: HTMLCanvasElement) => {
    if (!fabricMaterialRef.current) return;

    if (!masterCanvasTextureRef.current) {
      const texture = new THREE.CanvasTexture(textureCanvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
      masterCanvasTextureRef.current = texture;
      fabricMaterialRef.current.map = texture;
    } else {
      masterCanvasTextureRef.current.needsUpdate = true;
    }
    fabricMaterialRef.current.needsUpdate = true;
  }, []);

  // Set camera view preset
  const setCameraPreset = useCallback((preset: CameraPreset) => {
    const view = PRESET_CAMERA_VIEWS[preset];
    if (!view || !cameraRef.current || !controlsRef.current) return;

    setCurrentPreset(preset);
    setIsAutoRotating(false);
    gsap.to(cameraRef.current.position, {
      x: view.position[0],
      y: view.position[1],
      z: view.position[2],
      duration: 1.1,
      ease: 'power2.out',
    });
    gsap.to(controlsRef.current.target, {
      x: view.target[0],
      y: view.target[1],
      z: view.target[2],
      duration: 1.1,
      ease: 'power2.out',
    });
  }, []);

  // Take high-res snapshot
  const takeSnapshot = useCallback(async (preset: CameraPreset = 'isometric'): Promise<string> => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !controlsRef.current) {
      return '';
    }

    const originalPos = cameraRef.current.position.clone();
    const originalTarget = controlsRef.current.target.clone();

    // Position camera for snapshot
    const view = PRESET_CAMERA_VIEWS[preset];
    cameraRef.current.position.set(...view.position);
    controlsRef.current.target.set(...view.target);
    cameraRef.current.lookAt(...view.target);

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    const dataUrl = rendererRef.current.domElement.toDataURL('image/png');

    // Restore original camera
    cameraRef.current.position.copy(originalPos);
    controlsRef.current.target.copy(originalTarget);
    controlsRef.current.update();

    return dataUrl;
  }, []);

  // Expose imperative methods to parent
  useImperativeHandle(ref, () => ({
    takeSnapshot,
    focusSection,
    updateFabricTexture,
    updateBaseColor,
  }), [takeSnapshot, focusSection, updateFabricTexture, updateBaseColor]);

  // Sync active section camera
  useEffect(() => {
    if (activeSectionId) {
      focusSection(activeSectionId);
    }
  }, [activeSectionId, focusSection]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const initialBg = theme === 'dark' ? '#1d232a' : '#f3f4f6';
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(initialBg);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(2.8, 2.2, 3.2);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true, // Needed for PDF snapshot export
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(initialBg, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = tweakParams.exposure;
    rendererRef.current = renderer;
    container.appendChild(renderer.domElement);

    // 4. Controls (Zoom, Pan, Rotate only)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = true;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1.4;
    controls.maxDistance = 7.5;
    controls.maxPolarAngle = Math.PI / 2 + 0.02; // Bounded to prevent dipping underground
    controls.target.set(0, 1.2, 0);
    controlsRef.current = controls;

    // 5. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0xffffff, tweakParams.ambientIntensity);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    // Primary Sun Light (Soft shadow caster)
    const sunLight = new THREE.DirectionalLight(0xfffbf5, tweakParams.sunIntensity);
    sunLight.position.set(4, 7, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 18;
    sunLight.shadow.bias = -0.0005;
    sunLight.shadow.radius = 2.5;
    const d = 3.5;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // Fill Light (Opposite side)
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.0);
    fillLight.position.set(-5, 4, -4);
    scene.add(fillLight);

    // Rim Light (Top-back for crisp fabric silhouette)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
    rimLight.position.set(0, 6, -5);
    scene.add(rimLight);

    // 6. Ground Shadow Receiver & Radial Contact Circle
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.15 });
    const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = 0;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);

    // Subtle decorative circular podium ring
    const ringGeo = new THREE.RingGeometry(1.6, 1.62, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.001;
    scene.add(ringMesh);

    // 7. Animation & Render Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // 8. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [theme, tweakParams.ambientIntensity, tweakParams.exposure, tweakParams.sunIntensity]);

  // Handle Model Loading when modelUrl changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    setIsLoading(true);
    const loader = new GLTFLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        // Remove existing model and dispose resources
        if (currentModelRef.current) {
          scene.remove(currentModelRef.current);
          currentModelRef.current.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.geometry.dispose();
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach((m) => m.dispose());
              } else {
                mesh.material.dispose();
              }
            }
          });
        }

        const model = gltf.scene;
        currentModelRef.current = model;

        // Traverse model to setup shadows and isolate fabric material
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Detect fabric mesh / material
            if (mesh.name.toLowerCase().includes('fabric') || (mesh.material && (mesh.material as THREE.Material).name === 'fabric_Mat')) {
              fabricMeshRef.current = mesh;

              // Ensure material is cloned and responsive to PBR parameters
              if (mesh.material && !Array.isArray(mesh.material)) {
                const mat = mesh.material as THREE.MeshStandardMaterial;
                fabricMaterialRef.current = mat;
                mat.color.set(baseColor);
                mat.roughness = tweakParams.fabricRoughness;
                mat.metalness = tweakParams.fabricMetalness;
                mat.needsUpdate = true;

                // Re-apply master texture if one already exists
                if (masterCanvasTextureRef.current) {
                  mat.map = masterCanvasTextureRef.current;
                  mat.needsUpdate = true;
                }
              }
            }
          }
        });

        // Compute bounding box and center model at ground Y=0
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.x = -center.x;
        model.position.z = -center.z;
        model.position.y = -box.min.y; // Sit cleanly on ground plane

        scene.add(model);
        setIsLoading(false);
      },
      undefined,
      (error) => {
        console.error('Failed to load GLB model:', modelUrl, error);
        setIsLoading(false);
      }
    );
  }, [modelUrl, baseColor, tweakParams.fabricMetalness, tweakParams.fabricRoughness]);

  // Sync auto-rotation state
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
    }
  }, [isAutoRotating]);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden ${className}`}>
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-30 transition-opacity">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Streaming 3D Canopy Model...
          </span>
        </div>
      )}

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
