import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ROBOT_CONFIG } from '../../config/robotConfig';
import type { EndEffectorType, RobotPose } from '../../types/robot';

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

// Industrial PBR Materials for Dobot Aesthetic
const whitePlastic = new THREE.MeshStandardMaterial({
  color: '#f0f3f6',
  metalness: 0.25,
  roughness: 0.35,
});

const darkCharcoal = new THREE.MeshStandardMaterial({
  color: '#282c34',
  metalness: 0.65,
  roughness: 0.38,
});

const anodizedBlue = new THREE.MeshStandardMaterial({
  color: '#0084ff',
  metalness: 0.55,
  roughness: 0.28,
});

const polishedMetal = new THREE.MeshStandardMaterial({
  color: '#c2cbd4',
  metalness: 0.88,
  roughness: 0.18,
});

const brushedSteel = new THREE.MeshStandardMaterial({
  color: '#8e9aa8',
  metalness: 0.82,
  roughness: 0.28,
});

const siliconeCupMat = new THREE.MeshStandardMaterial({
  color: '#2563eb',
  metalness: 0.1,
  roughness: 0.6,
  transparent: true,
  opacity: 0.92,
});

const suctionActiveGlow = new THREE.MeshStandardMaterial({
  color: '#38bdf8',
  metalness: 0.3,
  roughness: 0.2,
  emissive: '#0284c7',
  emissiveIntensity: 0.8,
});

const tcpPointerMat = new THREE.MeshStandardMaterial({
  color: '#ef4444',
  metalness: 0.3,
  roughness: 0.2,
  emissive: '#ef4444',
  emissiveIntensity: 0.6,
});

function Cylinder({
  args,
  position,
  material = darkCharcoal,
  rotation,
}: {
  args: [number, number, number, number?];
  position: [number, number, number];
  material?: THREE.Material;
  rotation?: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow receiveShadow>
      <cylinderGeometry args={args} />
    </mesh>
  );
}

function BoltRing({
  radius,
  count,
  y,
  z = 0,
}: {
  radius: number;
  count: number;
  y: number;
  z?: number;
}) {
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * radius, y, z + Math.sin(a) * radius]}
            material={polishedMetal}
            castShadow
          >
            <cylinderGeometry args={[0.028, 0.028, 0.015, 10]} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function RobotArm3D({
  pose,
  animation,
  onLiveFrame,
  endEffectorType = 'suction',
  suctionActive = false,
  gripperOpen = true,
}: Props) {
  const basePivot = useRef<THREE.Group>(null);
  const shoulderPivot = useRef<THREE.Group>(null);
  const elbowPivot = useRef<THREE.Group>(null);
  const wristPivot = useRef<THREE.Group>(null);
  const leftFinger = useRef<THREE.Group>(null);
  const rightFinger = useRef<THREE.Group>(null);

  const current = useRef<RobotPose>({ ...pose });
  const target = useRef<RobotPose>({ ...pose });
  const anim = useRef<Props['animation']>(animation);

  if (animation?.id !== anim.current?.id) anim.current = animation;
  target.current = pose;

  useFrame(() => {
    const a = anim.current;
    if (a) {
      const elapsed = performance.now() - a.started;
      const t = THREE.MathUtils.clamp(elapsed / a.duration, 0, 1);

      // Check if this is a multi-waypoint straight-line MOVL path
      if (a.waypoints && a.waypoints.length > 0) {
        const totalWp = a.waypoints.length;
        const exactIndex = t * (totalWp - 1);
        const idxA = Math.floor(exactIndex);
        const idxB = Math.min(totalWp - 1, idxA + 1);
        const subT = exactIndex - idxA;

        const wpA = a.waypoints[idxA];
        const wpB = a.waypoints[idxB];

        current.current.base = THREE.MathUtils.lerp(wpA.base, wpB.base, subT);
        current.current.shoulder = THREE.MathUtils.lerp(wpA.shoulder, wpB.shoulder, subT);
        current.current.elbow = THREE.MathUtils.lerp(wpA.elbow, wpB.elbow, subT);
        current.current.wrist = THREE.MathUtils.lerp(wpA.wrist, wpB.wrist, subT);
      } else {
        // Smooth quintic ease-in-out for MOVJ
        const eased = t * t * t * (t * (t * 6 - 15) + 10);
        current.current.base = THREE.MathUtils.lerp(a.from.base, a.to.base, eased);
        current.current.shoulder = THREE.MathUtils.lerp(a.from.shoulder, a.to.shoulder, eased);
        current.current.elbow = THREE.MathUtils.lerp(a.from.elbow, a.to.elbow, eased);
        current.current.wrist = THREE.MathUtils.lerp(a.from.wrist, a.to.wrist, eased);
      }

      if (onLiveFrame) {
        onLiveFrame(current.current);
      }
    } else {
      current.current = { ...target.current };
    }

    // Apply joint rotations through hierarchy
    if (basePivot.current) basePivot.current.rotation.y = current.current.base;
    if (shoulderPivot.current) shoulderPivot.current.rotation.z = current.current.shoulder;
    // Elbow angle flexes downward relative to upper arm: rotate clockwise around local Z
    if (elbowPivot.current) elbowPivot.current.rotation.z = -current.current.elbow;
    if (wristPivot.current) wristPivot.current.rotation.x = current.current.wrist;

    // Smoothly actuate 2-Finger Gripper if present
    if (endEffectorType === 'gripper' && leftFinger.current && rightFinger.current) {
      const targetOffset = gripperOpen ? 0.08 : 0.02;
      leftFinger.current.position.y = THREE.MathUtils.lerp(leftFinger.current.position.y, targetOffset, 0.2);
      rightFinger.current.position.y = THREE.MathUtils.lerp(rightFinger.current.position.y, -targetOffset, 0.2);
    }
  });

  const upper = ROBOT_CONFIG.upperLength;
  const fore = ROBOT_CONFIG.forearmLength;

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Fixed Base Mounting Assembly (Square Chamfered Industrial Pedestal) */}
      <group position={[0, 0, 0]}>
        {/* Ground mounting plate */}
        <mesh position={[0, 0.06, 0]} material={darkCharcoal} castShadow receiveShadow>
          <boxGeometry args={[1.7, 0.12, 1.7]} />
        </mesh>
        {/* 4 Corner mounting holes */}
        {[[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]].map(([x, z], i) => (
          <group key={i} position={[x, 0.125, z]}>
            <Cylinder args={[0.045, 0.045, 0.03, 16]} position={[0, 0, 0]} material={polishedMetal} />
            <Cylinder args={[0.025, 0.025, 0.032, 12]} position={[0, 0, 0]} material={darkCharcoal} />
          </group>
        ))}

        {/* Circular base collar */}
        <Cylinder args={[0.82, 0.88, 0.16, 48]} position={[0, 0.2, 0]} material={whitePlastic} />
        <Cylinder args={[0.72, 0.72, 0.08, 48]} position={[0, 0.32, 0]} material={anodizedBlue} />
        <Cylinder args={[0.62, 0.65, 0.28, 48]} position={[0, 0.48, 0]} material={darkCharcoal} />
        <BoltRing radius={0.56} count={8} y={0.63} />

        {/* Status LED ring on base */}
        <mesh position={[0, 0.34, 0]} material={suctionActiveGlow}>
          <torusGeometry args={[0.73, 0.015, 12, 48]} />
        </mesh>
      </group>

      {/* 2. Base Turntable Assembly: Rotates horizontally around Three.js Y (Joint 1 Yaw) */}
      <group ref={basePivot} position={[0, 0.64, 0]}>
        {/* Rotating body casting */}
        <Cylinder args={[0.55, 0.58, 0.24, 36]} position={[0, 0.12, 0]} material={whitePlastic} />

        {/* Rear Motor Housing with Heat Sink Ribs (Characteristic Dobot Magician detail) */}
        <group position={[-0.42, 0.32, 0]}>
          <mesh material={darkCharcoal} castShadow>
            <boxGeometry args={[0.42, 0.45, 0.48]} />
          </mesh>
          {/* Motor cooling fins */}
          {[-0.16, -0.08, 0, 0.08, 0.16].map((z, idx) => (
            <mesh key={idx} position={[0.01, 0, z]} material={brushedSteel}>
              <boxGeometry args={[0.43, 0.43, 0.02]} />
            </mesh>
          ))}
          {/* Motor rear cable gland */}
          <Cylinder args={[0.06, 0.06, 0.14, 16]} position={[-0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={polishedMetal} />
        </group>

        {/* Twin upright shoulder bearing pillars */}
        <mesh position={[0.02, 0.35, 0.24]} material={whitePlastic} castShadow>
          <boxGeometry args={[0.36, 0.46, 0.12]} />
        </mesh>
        <mesh position={[0.02, 0.35, -0.24]} material={whitePlastic} castShadow>
          <boxGeometry args={[0.36, 0.46, 0.12]} />
        </mesh>

        {/* 3. Shoulder Pivot (Joint 2 Pitch): Height = 0.64 + 0.41 = 1.05 */}
        <group ref={shoulderPivot} position={[0.02, 0.41, 0]}>
          {/* Joint 2 Cap Hubs */}
          <Cylinder args={[0.32, 0.32, 0.58, 36]} position={[0, 0, 0]} material={darkCharcoal} rotation={[Math.PI / 2, 0, 0]} />
          <Cylinder args={[0.24, 0.24, 0.61, 32]} position={[0, 0, 0]} material={anodizedBlue} rotation={[Math.PI / 2, 0, 0]} />
          <Cylinder args={[0.15, 0.15, 0.63, 24]} position={[0, 0, 0]} material={polishedMetal} rotation={[Math.PI / 2, 0, 0]} />

          {/* 4. Upper Arm Link (L1 = 1.75) */}
          <group position={[0, upper / 2, 0]} rotation={[0, 0, -Math.PI / 2]}>
            {/* Primary Twin Truss Structural Beams */}
            <mesh position={[0, 0, 0.15]} material={whitePlastic} castShadow receiveShadow>
              <boxGeometry args={[0.36, upper, 0.12]} />
            </mesh>
            <mesh position={[0, 0, -0.15]} material={whitePlastic} castShadow receiveShadow>
              <boxGeometry args={[0.36, upper, 0.12]} />
            </mesh>

            {/* Inner CNC Milled Pocket Inlays (Dark anodized) */}
            <mesh position={[0, 0, 0.215]} material={darkCharcoal} castShadow>
              <boxGeometry args={[0.22, upper * 0.78, 0.03]} />
            </mesh>
            <mesh position={[0, 0, -0.215]} material={darkCharcoal} castShadow>
              <boxGeometry args={[0.22, upper * 0.78, 0.03]} />
            </mesh>

            {/* Dobot Blue Side Stripe Badge */}
            <mesh position={[0, 0.08, 0.235]} material={anodizedBlue}>
              <boxGeometry args={[0.1, upper * 0.45, 0.02]} />
            </mesh>
            <mesh position={[0, 0.08, -0.235]} material={anodizedBlue}>
              <boxGeometry args={[0.1, upper * 0.45, 0.02]} />
            </mesh>

            {/* Parallel mechanical linkage bar (Dobot rear slave push-rod) */}
            <Cylinder args={[0.045, 0.045, upper * 0.88, 16]} position={[-0.16, 0, 0]} material={brushedSteel} />
          </group>

          {/* 5. Elbow Pivot (Joint 3 Pitch): Positioned at upper arm tip [upper, 0, 0] */}
          <group ref={elbowPivot} position={[upper, 0, 0]}>
            {/* Elbow Joint Pivot Housing */}
            <Cylinder args={[0.28, 0.28, 0.54, 32]} position={[0, 0, 0]} material={darkCharcoal} rotation={[Math.PI / 2, 0, 0]} />
            <Cylinder args={[0.21, 0.21, 0.57, 32]} position={[0, 0, 0]} material={anodizedBlue} rotation={[Math.PI / 2, 0, 0]} />
            <Cylinder args={[0.12, 0.12, 0.59, 24]} position={[0, 0, 0]} material={polishedMetal} rotation={[Math.PI / 2, 0, 0]} />

            {/* 6. Forearm Link (L2 = 1.42) */}
            <group position={[fore / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              {/* Main structural forearm casting */}
              <mesh material={whitePlastic} castShadow receiveShadow>
                <boxGeometry args={[0.34, fore, 0.28]} />
              </mesh>
              {/* Lateral dark accent covers */}
              <mesh position={[0, 0, 0.15]} material={darkCharcoal} castShadow>
                <boxGeometry args={[0.18, fore * 0.74, 0.04]} />
              </mesh>
              <mesh position={[0, 0, -0.15]} material={darkCharcoal} castShadow>
                <boxGeometry args={[0.18, fore * 0.74, 0.04]} />
              </mesh>
              {/* Forearm Dobot decorative emblem */}
              <mesh position={[0, -0.06, 0.175]} material={anodizedBlue}>
                <boxGeometry args={[0.07, fore * 0.32, 0.015]} />
              </mesh>
            </group>

            {/* 7. Wrist Pivot (Joint 4 Tool Roll / Heading): Positioned at [fore, 0, 0] */}
            <group position={[fore, 0, 0]}>
              {/* Forearm end knuckle */}
              <Cylinder args={[0.16, 0.18, 0.22, 24]} position={[0.08, 0, 0]} material={darkCharcoal} rotation={[0, 0, Math.PI / 2]} />

              {/* Wrist Rotation Group (Roll around X axis) */}
              <group ref={wristPivot} position={[0.22, 0, 0]}>
                {/* Servo Rotary Coupling & Flange */}
                <Cylinder args={[0.14, 0.14, 0.12, 24]} position={[0.06, 0, 0]} material={polishedMetal} rotation={[0, 0, Math.PI / 2]} />
                <Cylinder args={[0.11, 0.11, 0.08, 24]} position={[0.16, 0, 0]} material={anodizedBlue} rotation={[0, 0, Math.PI / 2]} />

                {/* Quick-Change Tool Mounting Hub */}
                <mesh position={[0.24, 0, 0]} material={darkCharcoal} castShadow>
                  <boxGeometry args={[0.12, 0.24, 0.24]} />
                </mesh>
                <BoltRing radius={0.09} count={4} y={0.25} />

                {/* 8. End Effector Assemblies */}
                {endEffectorType === 'suction' ? (
                  /* Pneumatic Suction Cup Tool */
                  <group position={[0.3, 0, 0]}>
                    {/* Metal vacuum stem */}
                    <Cylinder args={[0.04, 0.04, 0.28, 16]} position={[0.14, 0, 0]} material={polishedMetal} rotation={[0, 0, Math.PI / 2]} />
                    {/* Air fitting elbow on side */}
                    <Cylinder args={[0.025, 0.025, 0.12, 12]} position={[0.08, 0.08, 0]} material={anodizedBlue} />

                    {/* Blue Silicone Suction Cup */}
                    <mesh position={[0.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={suctionActive ? suctionActiveGlow : siliconeCupMat} castShadow>
                      <coneGeometry args={[0.14, 0.14, 24, 1, true]} />
                    </mesh>
                    <mesh position={[0.37, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={suctionActive ? suctionActiveGlow : siliconeCupMat}>
                      <torusGeometry args={[0.14, 0.025, 12, 24]} />
                    </mesh>

                    {/* Tool Center Point (TCP) Tip Marker */}
                    <mesh position={[0.42, 0, 0]} material={tcpPointerMat}>
                      <sphereGeometry args={[0.03, 16, 16]} />
                    </mesh>
                  </group>
                ) : (
                  /* 2-Finger Servo Gripper Tool */
                  <group position={[0.3, 0, 0]}>
                    {/* Gripper actuator base block */}
                    <mesh position={[0.08, 0, 0]} material={darkCharcoal} castShadow>
                      <boxGeometry args={[0.16, 0.26, 0.22]} />
                    </mesh>
                    <Cylinder args={[0.05, 0.05, 0.2, 16]} position={[0.08, 0, 0]} material={anodizedBlue} />

                    {/* Left Finger Linkage */}
                    <group ref={leftFinger} position={[0.16, 0.06, 0]}>
                      <mesh material={brushedSteel} castShadow>
                        <boxGeometry args={[0.22, 0.035, 0.08]} />
                      </mesh>
                      <mesh position={[0.11, -0.04, 0]} material={darkCharcoal} castShadow>
                        <boxGeometry args={[0.04, 0.08, 0.07]} />
                      </mesh>
                    </group>

                    {/* Right Finger Linkage */}
                    <group ref={rightFinger} position={[0.16, -0.06, 0]}>
                      <mesh material={brushedSteel} castShadow>
                        <boxGeometry args={[0.22, 0.035, 0.08]} />
                      </mesh>
                      <mesh position={[0.11, 0.04, 0]} material={darkCharcoal} castShadow>
                        <boxGeometry args={[0.04, 0.08, 0.07]} />
                      </mesh>
                    </group>

                    {/* Tool Center Point (TCP) Tip Marker */}
                    <mesh position={[0.42, 0, 0]} material={tcpPointerMat}>
                      <sphereGeometry args={[0.03, 16, 16]} />
                    </mesh>
                  </group>
                )}
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
