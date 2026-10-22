export const ROBOT_CONFIG = {
  // Mechanical link lengths in Three.js scene units (1 unit = 100 mm)
  upperLength: 1.75,       // 175 mm upper arm link length (L1)
  forearmLength: 1.42,     // 142 mm forearm link length (L2)
  toolLength: 0.95,        // 95 mm end-effector length from wrist pivot to TCP
  shoulderHeight: 1.05,    // 105 mm shoulder pivot height above base mounting plane
  scaleMmPerUnit: 100,     // 1 Three.js unit = 100 mm

  // Default Home Pose (radians)
  initialBase: 0,                           // J1: 0°
  initialShoulder: (35 * Math.PI) / 180,     // J2: 35°
  initialElbow: (35 * Math.PI) / 180,        // J3: 35°
  initialWrist: 0,                          // J4: 0°

  // Joint Angle Limits (in Degrees and Radians)
  limitsDeg: {
    j1: { min: -135, max: 135, label: 'Base J1' },
    j2: { min: 0, max: 85, label: 'Shoulder J2' },
    j3: { min: -10, max: 105, label: 'Elbow J3' },
    j4: { min: -135, max: 135, label: 'Wrist J4' },
  },

  limitsRad: {
    j1: { min: (-135 * Math.PI) / 180, max: (135 * Math.PI) / 180 },
    j2: { min: (0 * Math.PI) / 180, max: (85 * Math.PI) / 180 },
    j3: { min: (-10 * Math.PI) / 180, max: (105 * Math.PI) / 180 },
    j4: { min: (-135 * Math.PI) / 180, max: (135 * Math.PI) / 180 },
  },

  // Reachable Workspace Envelope in Millimeters
  minRadiusMm: 150, // Minimum horizontal distance from base axis
  maxRadiusMm: 405, // Maximum reach (within upper 175mm + forearm 142mm + tool 95mm = 412mm)
  minZMm: -40,      // Allow lowering to workspace table level
  maxZMm: 380,      // Maximum vertical reach

  // Jog Increments
  cartesianStepOptionsMm: [1, 5, 10, 20],
  defaultCartesianStepMm: 5,
  jointStepOptionsDeg: [1, 5, 10, 15],
  defaultJointStepDeg: 5,

  // Legacy aliases
  stepOptionsMm: [1, 5, 10, 20],
  defaultStepMm: 5,
  animationMs: 260,

  // Speed and Acceleration defaults (% scale: 1 - 100)
  defaultSpeedPercent: 50,
  defaultAccelPercent: 50,
  minDurationMs: 120,   // at 100% speed
  maxDurationMs: 1500,  // at 1% speed

  // Jump motion parameters
  defaultJumpHeightMm: 35, // Vertical lift height for JUMP motion

  // Ports for virtual connection simulation
  virtualPorts: [
    'COM3 (Dobot Virtual)',
    'COM4 (USB-Serial)',
    'COM7 (Virtual Link)',
  ],
  virtualBaudRates: [9600, 57600, 115200, 230400],
};
