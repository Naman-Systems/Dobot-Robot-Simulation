export type JointName = 'base' | 'shoulder' | 'elbow' | 'wrist';

export type CartesianAxis = 'x' | 'y' | 'z' | 'r';

export type CartesianCommand =
  | 'x+'
  | 'x-'
  | 'y+'
  | 'y-'
  | 'z+'
  | 'z-'
  | 'r+'
  | 'r-'
  | 'reset';

export type JointCommand =
  | 'j1+'
  | 'j1-'
  | 'j2+'
  | 'j2-'
  | 'j3+'
  | 'j3-'
  | 'j4+'
  | 'j4-';

export type LegacyMovementCommand = 'left' | 'right' | 'up' | 'down';

export type MovementCommand = CartesianCommand | JointCommand | LegacyMovementCommand;

export type MotionType = 'MOVJ' | 'MOVL' | 'JUMP';

export type EndEffectorType = 'suction' | 'gripper';

export type EndEffectorAction = 'idle' | 'suction_on' | 'suction_off' | 'gripper_open' | 'gripper_close';

export type VirtualConnectionState = 'connected' | 'disconnected' | 'connecting';

export type SimulationStatus =
  | 'Ready'
  | 'Virtual robot connected'
  | 'Virtual robot disconnected'
  | 'Moving X+'
  | 'Moving X-'
  | 'Moving Y+'
  | 'Moving Y-'
  | 'Moving Z+'
  | 'Moving Z-'
  | 'Rotating R+'
  | 'Rotating R-'
  | 'Jogging Joint 1'
  | 'Jogging Joint 2'
  | 'Jogging Joint 3'
  | 'Jogging Joint 4'
  | 'Returning to home'
  | 'Executing program'
  | 'Playback paused'
  | 'Program completed'
  | 'Program stopped'
  | 'Emergency stop active'
  | 'Emergency stop reset'
  | 'Joint limit reached'
  | 'Position unreachable'
  | 'Program loaded successfully'
  | 'Program load failed'
  | 'Target outside reachable workspace'
  | 'Joint limit reached.';

export type MovementStatus = SimulationStatus;

export interface RobotPose {
  base: number;     // J1: Radians, yaw around World Z / Three Y
  shoulder: number; // J2: Radians, pitch of upper arm
  elbow: number;    // J3: Radians, pitch of forearm relative to upper arm
  wrist: number;    // J4: Radians, roll of tool / end-effector around tool axis
}

export interface JointAnglesDeg {
  j1: number; // Base yaw degrees (-135 to +135)
  j2: number; // Shoulder pitch degrees (0 to 85)
  j3: number; // Elbow pitch degrees (-10 to 90)
  j4: number; // Wrist roll degrees (-135 to +135)
}

export interface CartesianCoords {
  x: number; // Millimeters along World X-axis (transverse / forward)
  y: number; // Millimeters along World Y-axis (lateral / left)
  z: number; // Millimeters along World Z-axis (vertical height above floor)
  r: number; // Degrees, end-effector heading angle
}

export interface IKResult {
  reachable: boolean;
  pose?: RobotPose;
  error?: string;
}

export interface RobotDimensions {
  upperLength: number;    // In Three.js units (e.g. 1.75 = 175 mm)
  forearmLength: number;  // In Three.js units (e.g. 1.42 = 142 mm)
  toolLength: number;     // In Three.js units (e.g. 1.01 = 101 mm)
  shoulderHeight: number; // In Three.js units (e.g. 0.98 = 98 mm)
  scaleMmPerUnit: number; // Conversion factor (1 unit = 100 mm)
}
