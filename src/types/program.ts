import type { CartesianCoords, JointAnglesDeg } from './robot';

export type MotionType = 'MOVJ' | 'MOVL' | 'JUMP';

export interface TeachingPoint {
  id: string;
  index: number;
  name: string;
  motionType: MotionType;
  coords: CartesianCoords;
  joints: JointAnglesDeg;
  pauseMs: number;
  gripperAction?: 'none' | 'suction_on' | 'suction_off' | 'gripper_open' | 'gripper_close';
}

export interface ProgramData {
  id: string;
  name: string;
  version: string;
  created: string;
  updated: string;
  description?: string;
  points: TeachingPoint[];
  settings: {
    loopCount: number;
    speedPercent: number;
    accelPercent: number;
    jumpHeightMm: number;
  };
}

export type PlaybackState = 'idle' | 'running' | 'paused' | 'stopped';
