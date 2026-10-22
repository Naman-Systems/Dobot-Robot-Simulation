import type { MotionType, ProgramData, TeachingPoint } from '../types/program';
import { ROBOT_CONFIG } from '../config/robotConfig';

export interface ValidationResult {
  valid: boolean;
  program?: ProgramData;
  error?: string;
}

export function validateProgramData(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid file format: JSON root must be an object' };
  }

  const data = input as Partial<ProgramData>;

  if (!data.name || typeof data.name !== 'string') {
    return { valid: false, error: 'Program missing valid "name" field' };
  }

  if (!Array.isArray(data.points)) {
    return { valid: false, error: 'Program points must be an array' };
  }

  const validMotionTypes: MotionType[] = ['MOVJ', 'MOVL', 'JUMP'];
  const sanitizedPoints: TeachingPoint[] = [];

  for (let i = 0; i < data.points.length; i++) {
    const p = data.points[i] as Partial<TeachingPoint>;
    if (!p || typeof p !== 'object') {
      return { valid: false, error: `Point ${i + 1} is invalid or null` };
    }

    if (!validMotionTypes.includes(p.motionType as MotionType)) {
      return { valid: false, error: `Point ${i + 1} has unsupported motion type: ${p.motionType}` };
    }

    if (
      !p.coords ||
      typeof p.coords.x !== 'number' ||
      typeof p.coords.y !== 'number' ||
      typeof p.coords.z !== 'number' ||
      typeof p.coords.r !== 'number' ||
      isNaN(p.coords.x) ||
      isNaN(p.coords.y) ||
      isNaN(p.coords.z) ||
      isNaN(p.coords.r)
    ) {
      return { valid: false, error: `Point ${i + 1} (${p.name || 'unnamed'}) contains invalid Cartesian coordinates` };
    }

    // Check coordinate limits sanity
    if (
      p.coords.z < ROBOT_CONFIG.minZMm - 20 ||
      p.coords.z > ROBOT_CONFIG.maxZMm + 20
    ) {
      return {
        valid: false,
        error: `Point ${i + 1} Z coordinate (${p.coords.z}mm) exceeds safe range`,
      };
    }

    sanitizedPoints.push({
      id: p.id || `pt-${Date.now()}-${i}`,
      index: i + 1,
      name: typeof p.name === 'string' && p.name.trim() ? p.name.trim() : `Point ${i + 1}`,
      motionType: p.motionType as MotionType,
      coords: {
        x: Number(p.coords.x.toFixed(2)),
        y: Number(p.coords.y.toFixed(2)),
        z: Number(p.coords.z.toFixed(2)),
        r: Number(p.coords.r.toFixed(2)),
      },
      joints: p.joints && typeof p.joints.j1 === 'number'
        ? {
            j1: Number(p.joints.j1.toFixed(2)),
            j2: Number(p.joints.j2.toFixed(2)),
            j3: Number(p.joints.j3.toFixed(2)),
            j4: Number(p.joints.j4.toFixed(2)),
          }
        : { j1: 0, j2: 0, j3: 0, j4: 0 },
      pauseMs: typeof p.pauseMs === 'number' && p.pauseMs >= 0 ? Math.min(p.pauseMs, 30000) : 500,
      gripperAction: p.gripperAction || 'none',
    });
  }

  const sanitizedProgram: ProgramData = {
    id: data.id || `prog-${Date.now()}`,
    name: data.name.slice(0, 60),
    version: data.version || '1.0.0',
    created: data.created || new Date().toISOString(),
    updated: new Date().toISOString(),
    description: data.description ? data.description.slice(0, 200) : '',
    points: sanitizedPoints,
    settings: {
      loopCount: data.settings?.loopCount && data.settings.loopCount > 0 ? Math.min(data.settings.loopCount, 100) : 1,
      speedPercent: data.settings?.speedPercent ? Math.min(100, Math.max(1, data.settings.speedPercent)) : ROBOT_CONFIG.defaultSpeedPercent,
      accelPercent: data.settings?.accelPercent ? Math.min(100, Math.max(1, data.settings.accelPercent)) : ROBOT_CONFIG.defaultAccelPercent,
      jumpHeightMm: data.settings?.jumpHeightMm ? Math.min(100, Math.max(10, data.settings.jumpHeightMm)) : ROBOT_CONFIG.defaultJumpHeightMm,
    },
  };

  return { valid: true, program: sanitizedProgram };
}
