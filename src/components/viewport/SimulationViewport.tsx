import { forwardRef, Suspense, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Grid, Line, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import RobotArm3D from './RobotArm3D';
import { ROBOT_CONFIG } from '../../config/robotConfig';
import type { EndEffectorType, RobotPose } from '../../types/robot';
import { Eye, Grid3X3, Maximize2, Minimize2, RotateCcw } from 'lucide-react';

export interface ViewportHandle {
  resetCamera: () => void;
  setViewPreset: (preset: 'iso' | 'top' | 'front' | 'side') => void;
}

interface Props {
  pose: RobotPose;
  animation: {
    from: RobotPose;
    to: RobotPose;
    started: number;
    duration: number;
    id: number;
    waypoints?: RobotPose[];
  } | null;
  onLiveFrame?: (currentPose: RobotPose) => void;
  endEffectorType?: EndEffectorType;
  suctionActive?: boolean;
  gripperOpen?: boolean;
}

const DEFAULT_CAMERA_POS: [number, number, number] = [5.2, 4.4, 6.2];
const DEFAULT_TARGET: [number, number, number] = [0.2, 1.4, 0];

// 3D Axis Indicator showing World X (Red), World Y (Green), and World Z (Blue)
function WorldAxisIndicator({ position = [-2.8, 0.02, 2.5] }: { position?: [number, number, number] }) {
  const redMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.3, metalness: 0.2 }), []);
  const greenMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#10b981', roughness: 0.3, metalness: 0.2 }), []);
  const blueMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#38bdf8', roughness: 0.3, metalness: 0.2 }), []);
  const centerMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.3, metalness: 0.6 }), []);

  const axisLength = 0.9;
  const cylinderRadius = 0.022;
  const coneRadius = 0.055;
  const coneHeight = 0.15;

  return (
    <group position={position}>
      {/* Origin sphere */}
      <mesh material={centerMat} position={[0, 0, 0]}>
        <sphereGeometry args={[0.045, 16, 16]} />
      </mesh>

      {/* World +X Axis (Red) -> Three.js +X */}
      <group position={[axisLength / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <mesh material={redMat}>
          <cylinderGeometry args={[cylinderRadius, cylinderRadius, axisLength, 16]} />
        </mesh>
      </group>
      <mesh material={redMat} position={[axisLength, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[coneRadius, coneHeight, 16]} />
      </mesh>

      {/* World +Y Axis (Green) -> Three.js -Z */}
      <group position={[0, 0, -axisLength / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh material={greenMat}>
          <cylinderGeometry args={[cylinderRadius, cylinderRadius, axisLength, 16]} />
        </mesh>
      </group>
      <mesh material={greenMat} position={[0, 0, -axisLength]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[coneRadius, coneHeight, 16]} />
      </mesh>

      {/* World +Z Axis (Blue) -> Three.js +Y */}
      <group position={[0, axisLength / 2, 0]}>
        <mesh material={blueMat}>
          <cylinderGeometry args={[cylinderRadius, cylinderRadius, axisLength, 16]} />
        </mesh>
      </group>
      <mesh material={blueMat} position={[0, axisLength, 0]}>
        <coneGeometry args={[coneRadius, coneHeight, 16]} />
      </mesh>
    </group>
  );
}

// Workspace Reach Envelope Rings
function WorkspaceEnvelope() {
  const minR = ROBOT_CONFIG.minRadiusMm / ROBOT_CONFIG.scaleMmPerUnit;
  const maxR = ROBOT_CONFIG.maxRadiusMm / ROBOT_CONFIG.scaleMmPerUnit;
  const segments = 64;

  const minCircle = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push([minR * Math.cos(theta), 0.012, -minR * Math.sin(theta)]);
    }
    return pts;
  }, [minR]);

  const maxCircle = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push([maxR * Math.cos(theta), 0.012, -maxR * Math.sin(theta)]);
    }
    return pts;
  }, [maxR]);

  return (
    <group>
      <Line points={minCircle} color="#ef4444" lineWidth={1} transparent opacity={0.25} dashed dashScale={16} />
      <Line points={maxCircle} color="#38bdf8" lineWidth={1.2} transparent opacity={0.3} />
    </group>
  );
}

const SimulationViewport = forwardRef<ViewportHandle, Props>(function SimulationViewport(
  { pose, animation, onLiveFrame, endEffectorType, suctionActive, gripperOpen },
  ref
) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showAxes, setShowAxes] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.object.position.set(...DEFAULT_CAMERA_POS);
      controlsRef.current.target.set(...DEFAULT_TARGET);
      controlsRef.current.update();
    }
  };

  const setViewPreset = (preset: 'iso' | 'top' | 'front' | 'side') => {
    if (!controlsRef.current) return;
    const target = DEFAULT_TARGET;
    controlsRef.current.target.set(...target);
    switch (preset) {
      case 'iso':
        controlsRef.current.object.position.set(5.2, 4.4, 6.2);
        break;
      case 'top':
        controlsRef.current.object.position.set(0.01, 8.5, 0.01);
        break;
      case 'front':
        controlsRef.current.object.position.set(0, 2.2, 7.8);
        break;
      case 'side':
        controlsRef.current.object.position.set(7.8, 2.2, 0);
        break;
    }
    controlsRef.current.update();
  };

  useImperativeHandle(ref, () => ({
    resetCamera,
    setViewPreset,
  }));

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div ref={containerRef} className="viewport-canvas-container">
      <Canvas shadows dpr={[1, 1.7]} gl={{ antialias: true, alpha: false }}>
        <color attach="background" args={['#1c2026']} />
        <PerspectiveCamera makeDefault position={DEFAULT_CAMERA_POS} fov={38} near={0.1} far={100} />
        <ambientLight intensity={0.85} />
        <hemisphereLight args={['#dbeafe', '#1f242c', 1.2]} />
        <directionalLight
          position={[6, 9, 6]}
          intensity={2.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <directionalLight position={[-5, 4, -5]} intensity={0.8} color="#8db8ff" />

        <Suspense fallback={null}>
          <RobotArm3D
            pose={pose}
            animation={animation}
            onLiveFrame={onLiveFrame}
            endEffectorType={endEffectorType}
            suctionActive={suctionActive}
            gripperOpen={gripperOpen}
          />
          <Environment preset="city" environmentIntensity={0.25} />
        </Suspense>

        {/* Industrial Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
          <planeGeometry args={[180, 180]} />
          <meshStandardMaterial color="#171a20" roughness={0.92} metalness={0.1} />
        </mesh>

        {showGrid && (
          <Grid
            position={[0, 0.005, 0]}
            args={[28, 28]}
            cellSize={0.5}
            cellThickness={0.4}
            cellColor="#2c333e"
            sectionSize={2}
            sectionThickness={0.75}
            sectionColor="#414c5c"
            fadeDistance={24}
            fadeStrength={1.4}
            infiniteGrid
          />
        )}

        <WorkspaceEnvelope />
        {showAxes && <WorldAxisIndicator position={[-2.4, 0.02, 2.2]} />}
        <ContactShadows position={[0, 0.02, 0]} opacity={0.48} scale={10} blur={2.6} far={5} resolution={512} />

        {/* Camera OrbitControls */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={DEFAULT_TARGET}
          minDistance={2.5}
          maxDistance={16}
          maxPolarAngle={Math.PI * 0.49}
          minPolarAngle={0.05}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {/* Floating Viewport Quick Controls */}
      <div className="viewport-overlay-controls">
        <div className="viewport-view-presets">
          <button type="button" className="vp-btn" onClick={() => setViewPreset('iso')} title="Isometric View">
            ISO
          </button>
          <button type="button" className="vp-btn" onClick={() => setViewPreset('top')} title="Top View">
            TOP
          </button>
          <button type="button" className="vp-btn" onClick={() => setViewPreset('front')} title="Front View">
            FRONT
          </button>
          <button type="button" className="vp-btn" onClick={() => setViewPreset('side')} title="Side View">
            SIDE
          </button>
          <button type="button" className="vp-btn reset-cam" onClick={resetCamera} title="Reset Camera View">
            <RotateCcw size={13} />
            <span>RESET CAM</span>
          </button>
        </div>

        <div className="viewport-view-toggles">
          <button
            type="button"
            className={`vp-toggle-btn ${showGrid ? 'active' : ''}`}
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle Engineering Grid"
          >
            <Grid3X3 size={13} />
          </button>
          <button
            type="button"
            className={`vp-toggle-btn ${showAxes ? 'active' : ''}`}
            onClick={() => setShowAxes(!showAxes)}
            title="Toggle 3D Coordinate Axes"
          >
            <Eye size={13} />
          </button>
          <button
            type="button"
            className="vp-toggle-btn"
            onClick={toggleFullscreen}
            title="Toggle Viewport Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Bottom axis reference legend */}
      <div className="viewport-axes-legend">
        <span className="axis-legend-item"><span className="axis-badge-dot red" /> X: Front (+) / Back (-)</span>
        <span className="axis-legend-item"><span className="axis-badge-dot green" /> Y: Left (+) / Right (-)</span>
        <span className="axis-legend-item"><span className="axis-badge-dot blue" /> Z: Up (+) / Down (-)</span>
      </div>

      <div className="viewport-interaction-hint">
        <span>Orbit: Left-drag · Zoom: Scroll · Pan: Right-drag</span>
      </div>
    </div>
  );
});

export default SimulationViewport;
