import { ROBOT_CONFIG } from '../config/robotConfig';
import type { CartesianCoords, IKResult, JointAnglesDeg, RobotPose } from '../types/robot';

/**
 * Degrees to Radians
 */
export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Radians to Degrees
 */
export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Clamp a number between min and max
 */
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Convert RobotPose (radians) to JointAnglesDeg (degrees)
 */
export function poseToDegrees(pose: RobotPose): JointAnglesDeg {
  return {
    j1: Number(radToDeg(pose.base).toFixed(2)),
    j2: Number(radToDeg(pose.shoulder).toFixed(2)),
    j3: Number(radToDeg(pose.elbow).toFixed(2)),
    j4: Number(radToDeg(pose.wrist).toFixed(2)),
  };
}

/**
 * Convert JointAnglesDeg (degrees) to RobotPose (radians)
 */
export function degreesToPose(deg: JointAnglesDeg): RobotPose {
  return {
    base: degToRad(deg.j1),
    shoulder: degToRad(deg.j2),
    elbow: degToRad(deg.j3),
    wrist: degToRad(deg.j4),
  };
}

/**
 * Forward Kinematics (FK):
 * Given joint angles (base, shoulder, elbow, wrist), computes the exact Tool Center Point (TCP)
 * position in World Cartesian coordinates (X, Y, Z in mm, R in degrees).
 */
export function forwardKinematics(
  pose: RobotPose,
  config = ROBOT_CONFIG
): CartesianCoords {
  const L1 = config.upperLength;
  const L2 = config.forearmLength + config.toolLength;
  const H = config.shoulderHeight;
  const scale = config.scaleMmPerUnit;

  const theta0 = pose.base;      // J1: Base yaw (rad)
  const theta1 = pose.shoulder;  // J2: Shoulder pitch (rad)
  const theta2 = pose.elbow;     // J3: Elbow relative flexion angle (bending down) (rad)
  const theta3 = pose.wrist;     // J4: Wrist tool roll (rad)

  // Forearm absolute pitch angle relative to the horizontal plane:
  // theta1 elevates link 1, theta2 flexes link 2 downward
  const phi = theta1 - theta2;

  // Planar reach distance from base rotation center
  const rUnits = L1 * Math.cos(theta1) + L2 * Math.cos(phi);

  // Vertical height from worktable surface
  const zUnits = H + L1 * Math.sin(theta1) + L2 * Math.sin(phi);

  // World coordinates (mm)
  const xMm = rUnits * Math.cos(theta0) * scale;
  const yMm = rUnits * Math.sin(theta0) * scale;
  const zMm = zUnits * scale;

  // Tool heading angle R: Base angle + Wrist tool angle
  const rDeg = radToDeg(theta0 + theta3);

  return {
    x: Number(xMm.toFixed(2)),
    y: Number(yMm.toFixed(2)),
    z: Number(zMm.toFixed(2)),
    r: Number(rDeg.toFixed(2)),
  };
}

/**
 * Inverse Kinematics (IK):
 * Given target Cartesian coordinates (X, Y, Z in mm, R in degrees),
 * computes the required joint angles (base, shoulder, elbow, wrist in radians).
 * If target is outside reachable workspace or violates joint limits, returns reachable: false.
 */
export function inverseKinematics(
  targetMm: { x: number; y: number; z: number; r?: number },
  currentPose?: RobotPose,
  config = ROBOT_CONFIG
): IKResult {
  if (
    !Number.isFinite(targetMm.x) ||
    !Number.isFinite(targetMm.y) ||
    !Number.isFinite(targetMm.z) ||
    (targetMm.r !== undefined && !Number.isFinite(targetMm.r))
  ) {
    return {
      reachable: false,
      error: 'Target coordinates must be finite numeric values.',
    };
  }

  const scale = config.scaleMmPerUnit;
  const x = targetMm.x / scale;
  const y = targetMm.y / scale;
  const z = targetMm.z / scale;

  // 1. Check workspace vertical bounds
  const minZUnits = config.minZMm / scale;
  const maxZUnits = config.maxZMm / scale;
  if (z < minZUnits || z > maxZUnits) {
    return {
      reachable: false,
      error: `Target Z (${targetMm.z.toFixed(1)}mm) outside vertical limits [${config.minZMm}, ${config.maxZMm}]`,
    };
  }

  // 2. Planar horizontal radius from base rotation axis
  const r = Math.sqrt(x * x + y * y);
  const minRUnits = config.minRadiusMm / scale;
  const maxRUnits = config.maxRadiusMm / scale;

  if (r < minRUnits || r > maxRUnits) {
    return {
      reachable: false,
      error: `Target radius (${(r * scale).toFixed(1)}mm) outside reach limits [${config.minRadiusMm}, ${config.maxRadiusMm}]`,
    };
  }

  // 3. Base joint angle theta0 (yaw)
  const theta0 = Math.atan2(y, x);
  const baseLimits = config.limitsRad.j1;
  if (theta0 < baseLimits.min || theta0 > baseLimits.max) {
    return {
      reachable: false,
      error: `Target requires Base J1 angle (${radToDeg(theta0).toFixed(1)}°) exceeding limits [${config.limitsDeg.j1.min}°, ${config.limitsDeg.j1.max}°]`,
    };
  }

  // 4. Planar 2-link IK from shoulder pivot (0, H) to target (r, z)
  const L1 = config.upperLength;
  const L2 = config.forearmLength + config.toolLength;
  const H = config.shoulderHeight;

  const deltaR = r;
  const deltaZ = z - H;
  const D = Math.sqrt(deltaR * deltaR + deltaZ * deltaZ);

  // Triangle inequality check
  const maxReach = L1 + L2;
  const minReach = Math.abs(L1 - L2);
  if (D > maxReach - 0.005 || D < minReach + 0.005) {
    return {
      reachable: false,
      error: 'Target unreachable: arm length bounds exceeded',
    };
  }

  // 5. Elbow angle theta2 (law of cosines)
  // cosAlpha is the interior angle between L1 and L2
  const cosAlpha = (L1 * L1 + L2 * L2 - D * D) / (2 * L1 * L2);
  if (cosAlpha < -1 || cosAlpha > 1) {
    return {
      reachable: false,
      error: 'Target unreachable: geometrical triangle singularity',
    };
  }

  const alpha = Math.acos(clamp(cosAlpha, -1, 1));
  // In elbow-up posture with positive downward flexion angle J3: theta2 = PI - alpha
  const theta2 = Math.PI - alpha;

  const elbowLimits = config.limitsRad.j3;
  if (theta2 < elbowLimits.min || theta2 > elbowLimits.max) {
    return {
      reachable: false,
      error: `Target requires Elbow J3 angle (${radToDeg(theta2).toFixed(1)}°) outside limits [${config.limitsDeg.j3.min}°, ${config.limitsDeg.j3.max}°]`,
    };
  }

  // 6. Shoulder angle theta1
  const gamma = Math.atan2(deltaZ, deltaR);
  const cosBeta = (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D);
  if (cosBeta < -1 || cosBeta > 1) {
    return {
      reachable: false,
      error: 'Target unreachable: shoulder elevation geometry',
    };
  }

  const beta = Math.acos(clamp(cosBeta, -1, 1));
  const theta1 = gamma + beta;

  const shoulderLimits = config.limitsRad.j2;
  if (theta1 < shoulderLimits.min || theta1 > shoulderLimits.max) {
    return {
      reachable: false,
      error: `Target requires Shoulder J2 angle (${radToDeg(theta1).toFixed(1)}°) outside limits [${config.limitsDeg.j2.min}°, ${config.limitsDeg.j2.max}°]`,
    };
  }

  // 7. Wrist joint angle theta3 (J4)
  // R = theta0 + theta3 (in degrees) -> theta3 = degToRad(R) - theta0
  let theta3 = 0;
  if (targetMm.r !== undefined) {
    const desiredRRad = degToRad(targetMm.r);
    theta3 = desiredRRad - theta0;
  } else if (currentPose) {
    theta3 = currentPose.wrist;
  }

  const wristLimits = config.limitsRad.j4;
  // Normalize theta3 into [-PI, PI] range if needed
  while (theta3 > Math.PI) theta3 -= 2 * Math.PI;
  while (theta3 < -Math.PI) theta3 += 2 * Math.PI;

  if (theta3 < wristLimits.min || theta3 > wristLimits.max) {
    return {
      reachable: false,
      error: `Target requires Wrist J4 angle (${radToDeg(theta3).toFixed(1)}°) outside limits [${config.limitsDeg.j4.min}°, ${config.limitsDeg.j4.max}°]`,
    };
  }

  return {
    reachable: true,
    pose: {
      base: theta0,
      shoulder: theta1,
      elbow: theta2,
      wrist: theta3,
    },
  };
}

/**
 * Check if a single joint move violates limits
 */
export function validateJointMove(
  joint: 'j1' | 'j2' | 'j3' | 'j4',
  newAngleDeg: number,
  config = ROBOT_CONFIG
): { valid: boolean; clampedDeg: number; message?: string } {
  const limits = config.limitsDeg[joint];
  if (newAngleDeg < limits.min) {
    return {
      valid: false,
      clampedDeg: limits.min,
      message: `${limits.label} reached minimum limit of ${limits.min}°`,
    };
  }
  if (newAngleDeg > limits.max) {
    return {
      valid: false,
      clampedDeg: limits.max,
      message: `${limits.label} reached maximum limit of ${limits.max}°`,
    };
  }
  return { valid: true, clampedDeg: newAngleDeg };
}

/**
 * Generate linear Cartesian waypoints (MOVL)
 */
export function generateCartesianLinearPath(
  startCoord: CartesianCoords,
  endCoord: CartesianCoords,
  steps = 15,
  config = ROBOT_CONFIG
): { valid: boolean; poses: RobotPose[]; error?: string } {
  const poses: RobotPose[] = [];

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const interpCoord = {
      x: startCoord.x + (endCoord.x - startCoord.x) * t,
      y: startCoord.y + (endCoord.y - startCoord.y) * t,
      z: startCoord.z + (endCoord.z - startCoord.z) * t,
      r: startCoord.r + (endCoord.r - startCoord.r) * t,
    };

    const ik = inverseKinematics(interpCoord, undefined, config);
    if (!ik.reachable || !ik.pose) {
      return {
        valid: false,
        poses: [],
        error: `MOVL path blocked at step ${i}/${steps}: ${ik.error}`,
      };
    }
    poses.push(ik.pose);
  }

  return { valid: true, poses };
}

/**
 * Generate JUMP trajectory waypoints
 * JUMP raises Z by jumpHeight, moves horizontally to target X-Y, then lowers Z to target Z.
 */
export function generateJumpPath(
  startCoord: CartesianCoords,
  endCoord: CartesianCoords,
  jumpHeightMm = ROBOT_CONFIG.defaultJumpHeightMm,
  config = ROBOT_CONFIG
): { valid: boolean; waypoints: CartesianCoords[]; error?: string } {
  const safeZ = Math.min(
    config.maxZMm - 10,
    Math.max(startCoord.z, endCoord.z) + jumpHeightMm
  );

  const waypoints: CartesianCoords[] = [
    // 1. Lift straight up to safe clearance height
    { x: startCoord.x, y: startCoord.y, z: safeZ, r: startCoord.r },
    // 2. Horizontal transition to above target point
    { x: endCoord.x, y: endCoord.y, z: safeZ, r: endCoord.r },
    // 3. Lower down to target point
    { x: endCoord.x, y: endCoord.y, z: endCoord.z, r: endCoord.r },
  ];

  // Verify all waypoints are reachable
  for (let i = 0; i < waypoints.length; i++) {
    const ik = inverseKinematics(waypoints[i], undefined, config);
    if (!ik.reachable) {
      return {
        valid: false,
        waypoints: [],
        error: `JUMP trajectory waypoint ${i + 1} unreachable: ${ik.error}`,
      };
    }
  }

  return { valid: true, waypoints };
}
