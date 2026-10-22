import type { ProgramData } from '../types/program';
import { validateProgramData } from './programValidation';

const STORAGE_KEY = 'robosim3d_dobot_program';

export const DEFAULT_PROGRAM: ProgramData = {
  id: 'prog-demo-pick-place',
  name: 'Dobot Pick & Place Demo',
  version: '1.0.0',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  description: 'Industrial 4-point pick and place sequence with JUMP and MOVJ motions.',
  settings: {
    loopCount: 1,
    speedPercent: 60,
    accelPercent: 50,
    jumpHeightMm: 35,
  },
  points: [
    {
      id: 'pt-1-standby',
      index: 1,
      name: 'Standby Home',
      motionType: 'MOVJ',
      coords: { x: 380.35, y: 0, z: 205.38, r: 0 },
      joints: { j1: 0, j2: 35, j3: 35, j4: 0 },
      pauseMs: 400,
      gripperAction: 'none',
    },
    {
      id: 'pt-2-pick',
      index: 2,
      name: 'Pick Approach',
      motionType: 'MOVJ',
      coords: { x: 280, y: 120, z: 80, r: 23.2 },
      joints: { j1: 23.2, j2: 45.9, j3: 85.4, j4: 23.2 },
      pauseMs: 600,
      gripperAction: 'suction_on',
    },
    {
      id: 'pt-3-lift',
      index: 3,
      name: 'Jump Transition',
      motionType: 'JUMP',
      coords: { x: 280, y: -120, z: 80, r: -23.2 },
      joints: { j1: -23.2, j2: 45.9, j3: 85.4, j4: -23.2 },
      pauseMs: 600,
      gripperAction: 'suction_off',
    },
    {
      id: 'pt-4-return',
      index: 4,
      name: 'Return Standby',
      motionType: 'MOVL',
      coords: { x: 380.35, y: 0, z: 205.38, r: 0 },
      joints: { j1: 0, j2: 35, j3: 35, j4: 0 },
      pauseMs: 300,
      gripperAction: 'none',
    },
  ],
};

/**
 * Load program from localStorage or fall back to default program
 */
export function loadProgramFromStorage(): ProgramData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRAM;
    const parsed = JSON.parse(raw);
    const result = validateProgramData(parsed);
    if (result.valid && result.program) {
      return result.program;
    }
  } catch (err) {
    console.warn('Failed to load program from localStorage:', err);
  }
  return DEFAULT_PROGRAM;
}

/**
 * Save program to localStorage
 */
export function saveProgramToStorage(program: ProgramData): void {
  try {
    const toSave: ProgramData = {
      ...program,
      updated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.error('Failed to save program to localStorage:', err);
  }
}

/**
 * Download program as JSON file
 */
export function exportProgramFile(program: ProgramData, customFilename?: string): void {
  const filename = customFilename || `${program.name.replace(/\s+/g, '_').toLowerCase()}.dobot.json`;
  const blob = new Blob([JSON.stringify(program, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Read and validate JSON program file from an HTML File object
 */
export async function importProgramFile(file: File): Promise<ProgramData> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const result = validateProgramData(parsed);
  if (!result.valid || !result.program) {
    throw new Error(result.error || 'Invalid program file format');
  }
  return result.program;
}
