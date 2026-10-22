/**
 * Automated Verification Test Suite for Dobot Robotics Lab Project
 * Tests requirements A through G from Section 10 of project specifications.
 */

import { ROBOT_CONFIG } from '../config/robotConfig';
import {
  degToRad,
  forwardKinematics,
  inverseKinematics,
  poseToDegrees,
  validateJointMove,
  generateCartesianLinearPath,
  generateJumpPath,
} from '../robotics/kinematics';
import type { RobotPose, CartesianCoords } from '../types/robot';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
}

function approxEqual(a: number, b: number, tolerance = 0.05): boolean {
  return Math.abs(a - b) <= tolerance;
}

const initialPose: RobotPose = {
  base: ROBOT_CONFIG.initialBase,
  shoulder: ROBOT_CONFIG.initialShoulder,
  elbow: ROBOT_CONFIG.initialElbow,
  wrist: ROBOT_CONFIG.initialWrist,
};

console.log('=== STARTING AUTOMATED TEST SUITE: ROBOT MOVEMENT & KINEMATICS ===\n');

// -------------------------------------------------------------
// Test A: X-axis Jogging
// -------------------------------------------------------------
console.log('--- TEST A: X-Axis Movement ---');
{
  const p0 = forwardKinematics(initialPose);
  console.log(`Initial position: X=${p0.x.toFixed(2)}, Y=${p0.y.toFixed(2)}, Z=${p0.z.toFixed(2)}`);

  const step = 5;
  const targetXPlus: CartesianCoords = { x: p0.x + step, y: p0.y, z: p0.z, r: p0.r };
  const ikPlus = inverseKinematics(targetXPlus, initialPose);
  assert(ikPlus.reachable && !!ikPlus.pose, `X+ jog should be reachable (error: ${ikPlus.error})`);

  const pPlus = forwardKinematics(ikPlus.pose!);
  console.log(`After X+ (+${step}mm): X=${pPlus.x.toFixed(2)}, Y=${pPlus.y.toFixed(2)}, Z=${pPlus.z.toFixed(2)}`);
  assert(approxEqual(pPlus.x, p0.x + step), `X+ moved to ${pPlus.x}, expected ${p0.x + step}`);
  assert(approxEqual(pPlus.y, p0.y), `Y changed during X+ jog: ${pPlus.y} vs ${p0.y}`);
  assert(approxEqual(pPlus.z, p0.z), `Z changed during X+ jog: ${pPlus.z} vs ${p0.z}`);

  // Reverse jog X-
  const targetXMinus: CartesianCoords = { x: pPlus.x - step, y: pPlus.y, z: pPlus.z, r: pPlus.r };
  const ikMinus = inverseKinematics(targetXMinus, ikPlus.pose!);
  assert(ikMinus.reachable && !!ikMinus.pose, `X- jog should be reachable (error: ${ikMinus.error})`);

  const pMinus = forwardKinematics(ikMinus.pose!);
  console.log(`After X- (-${step}mm): X=${pMinus.x.toFixed(2)}, Y=${pMinus.y.toFixed(2)}, Z=${pMinus.z.toFixed(2)}`);
  assert(approxEqual(pMinus.x, p0.x), `X- returned to ${pMinus.x}, expected ${p0.x}`);
  assert(approxEqual(pMinus.y, p0.y), `Y changed during X- jog: ${pMinus.y} vs ${p0.y}`);
  assert(approxEqual(pMinus.z, p0.z), `Z changed during X- jog: ${pMinus.z} vs ${p0.z}`);
  console.log('Test A PASSED!\n');
}

// -------------------------------------------------------------
// Test B: Y-axis Jogging
// -------------------------------------------------------------
console.log('--- TEST B: Y-Axis Movement ---');
{
  const p0 = forwardKinematics(initialPose);
  const step = 5;
  const targetYPlus: CartesianCoords = { x: p0.x, y: p0.y + step, z: p0.z, r: p0.r };
  const ikPlus = inverseKinematics(targetYPlus, initialPose);
  assert(ikPlus.reachable && !!ikPlus.pose, `Y+ jog should be reachable (error: ${ikPlus.error})`);

  const pPlus = forwardKinematics(ikPlus.pose!);
  console.log(`After Y+ (+${step}mm): X=${pPlus.x.toFixed(2)}, Y=${pPlus.y.toFixed(2)}, Z=${pPlus.z.toFixed(2)}`);
  assert(approxEqual(pPlus.y, p0.y + step), `Y+ moved to ${pPlus.y}, expected ${p0.y + step}`);
  assert(approxEqual(pPlus.x, p0.x), `X changed during Y+ jog: ${pPlus.x} vs ${p0.x}`);
  assert(approxEqual(pPlus.z, p0.z), `Z changed during Y+ jog: ${pPlus.z} vs ${p0.z}`);

  // Reverse jog Y-
  const targetYMinus: CartesianCoords = { x: pPlus.x, y: pPlus.y - step, z: pPlus.z, r: pPlus.r };
  const ikMinus = inverseKinematics(targetYMinus, ikPlus.pose!);
  assert(ikMinus.reachable && !!ikMinus.pose, `Y- jog should be reachable (error: ${ikMinus.error})`);

  const pMinus = forwardKinematics(ikMinus.pose!);
  console.log(`After Y- (-${step}mm): X=${pMinus.x.toFixed(2)}, Y=${pMinus.y.toFixed(2)}, Z=${pMinus.z.toFixed(2)}`);
  assert(approxEqual(pMinus.y, p0.y), `Y- returned to ${pMinus.y}, expected ${p0.y}`);
  assert(approxEqual(pMinus.x, p0.x), `X changed during Y- jog: ${pMinus.x} vs ${p0.x}`);
  assert(approxEqual(pMinus.z, p0.z), `Z changed during Y- jog: ${pMinus.z} vs ${p0.z}`);
  console.log('Test B PASSED!\n');
}

// -------------------------------------------------------------
// Test C: Z-axis Jogging
// -------------------------------------------------------------
console.log('--- TEST C: Z-Axis Movement ---');
{
  const p0 = forwardKinematics(initialPose);
  const step = 5;
  const targetZPlus: CartesianCoords = { x: p0.x, y: p0.y, z: p0.z + step, r: p0.r };
  const ikPlus = inverseKinematics(targetZPlus, initialPose);
  assert(ikPlus.reachable && !!ikPlus.pose, `Z+ jog should be reachable (error: ${ikPlus.error})`);

  const pPlus = forwardKinematics(ikPlus.pose!);
  console.log(`After Z+ (+${step}mm): X=${pPlus.x.toFixed(2)}, Y=${pPlus.y.toFixed(2)}, Z=${pPlus.z.toFixed(2)}`);
  assert(approxEqual(pPlus.z, p0.z + step), `Z+ moved to ${pPlus.z}, expected ${p0.z + step}`);
  assert(approxEqual(pPlus.x, p0.x), `X changed during Z+ jog: ${pPlus.x} vs ${p0.x}`);
  assert(approxEqual(pPlus.y, p0.y), `Y changed during Z+ jog: ${pPlus.y} vs ${p0.y}`);

  // Reverse jog Z-
  const targetZMinus: CartesianCoords = { x: pPlus.x, y: pPlus.y, z: pPlus.z - step, r: pPlus.r };
  const ikMinus = inverseKinematics(targetZMinus, ikPlus.pose!);
  assert(ikMinus.reachable && !!ikMinus.pose, `Z- jog should be reachable (error: ${ikMinus.error})`);

  const pMinus = forwardKinematics(ikMinus.pose!);
  console.log(`After Z- (-${step}mm): X=${pMinus.x.toFixed(2)}, Y=${pMinus.y.toFixed(2)}, Z=${pMinus.z.toFixed(2)}`);
  assert(approxEqual(pMinus.z, p0.z), `Z- returned to ${pMinus.z}, expected ${p0.z}`);
  assert(approxEqual(pMinus.x, p0.x), `X changed during Z- jog: ${pMinus.x} vs ${p0.x}`);
  assert(approxEqual(pMinus.y, p0.y), `Y changed during Z- jog: ${pMinus.y} vs ${p0.y}`);
  console.log('Test C PASSED!\n');
}

// -------------------------------------------------------------
// Test D: Absolute Positioning
// -------------------------------------------------------------
console.log('--- TEST D: Absolute Positioning ---');
{
  const reachableTargets: CartesianCoords[] = [
    { x: 280, y: 0, z: 150, r: 0 },
    { x: 300, y: 100, z: 120, r: 15 },
    { x: 260, y: -80, z: 60, r: -20 },
    { x: 350, y: 0, z: 220, r: 0 },
  ];

  for (const target of reachableTargets) {
    const ik = inverseKinematics(target, initialPose);
    assert(ik.reachable && !!ik.pose, `Target (${target.x}, ${target.y}, ${target.z}) should be reachable`);
    const achieved = forwardKinematics(ik.pose!);
    console.log(`Target: (${target.x}, ${target.y}, ${target.z}, ${target.r}) -> Achieved: (${achieved.x.toFixed(2)}, ${achieved.y.toFixed(2)}, ${achieved.z.toFixed(2)}, ${achieved.r.toFixed(2)})`);
    assert(approxEqual(achieved.x, target.x, 0.1), `Target X error too large: ${achieved.x} vs ${target.x}`);
    assert(approxEqual(achieved.y, target.y, 0.1), `Target Y error too large: ${achieved.y} vs ${target.y}`);
    assert(approxEqual(achieved.z, target.z, 0.1), `Target Z error too large: ${achieved.z} vs ${target.z}`);
    assert(approxEqual(achieved.r, target.r, 0.1), `Target R error too large: ${achieved.r} vs ${target.r}`);
  }
  console.log('Test D PASSED!\n');
}

// -------------------------------------------------------------
// Test E: Validation of Missing, Non-numeric & Out-of-Bounds Targets
// -------------------------------------------------------------
console.log('--- TEST E: Target Validation ---');
{
  // 1. Non-finite / missing coordinates
  const nanTarget: CartesianCoords = { x: NaN, y: 0, z: 100, r: 0 };
  const nanIK = inverseKinematics(nanTarget);
  assert(!nanIK.reachable, 'NaN target must be rejected');
  console.log(`NaN coordinate correctly rejected: "${nanIK.error}"`);

  // 2. Far out of radius (beyond 405mm)
  const farTarget: CartesianCoords = { x: 500, y: 0, z: 100, r: 0 };
  const farIK = inverseKinematics(farTarget);
  assert(!farIK.reachable, 'Target at 500mm radius must be rejected');
  console.log(`Excessive radius target correctly rejected: "${farIK.error}"`);

  // 3. Below minimum radius (inside base cylinder < 160mm)
  const closeTarget: CartesianCoords = { x: 50, y: 0, z: 100, r: 0 };
  const closeIK = inverseKinematics(closeTarget);
  assert(!closeIK.reachable, 'Target inside min radius (<160mm) must be rejected');
  console.log(`Inside base cylinder correctly rejected: "${closeIK.error}"`);

  // 4. Out of vertical workspace (Z > 380mm or Z < -40mm)
  const highTarget: CartesianCoords = { x: 280, y: 0, z: 450, r: 0 };
  const highIK = inverseKinematics(highTarget);
  assert(!highIK.reachable, 'Target Z=450 must be rejected');
  console.log(`High Z target correctly rejected: "${highIK.error}"`);

  const lowTarget: CartesianCoords = { x: 280, y: 0, z: -100, r: 0 };
  const lowIK = inverseKinematics(lowTarget);
  assert(!lowIK.reachable, 'Target Z=-100 must be rejected');
  console.log(`Low Z target correctly rejected: "${lowIK.error}"`);

  console.log('Test E PASSED!\n');
}

// -------------------------------------------------------------
// Test F: Repeated Commands & Chained Jogging (No Float Accumulation)
// -------------------------------------------------------------
console.log('--- TEST F: Repeated Jogging & State Synchronization ---');
{
  // Start from a comfortable mid-workspace pose (X=280, Y=0, Z=150)
  const midTarget: CartesianCoords = { x: 280, y: 0, z: 150, r: 0 };
  const midIK = inverseKinematics(midTarget, initialPose);
  assert(midIK.reachable && !!midIK.pose, 'Mid target should be reachable');

  let currentPose = { ...midIK.pose! };
  const step = 5;
  const numSteps = 10;

  console.log(`Executing ${numSteps} consecutive X+ jogs of +${step}mm from X=280...`);
  for (let i = 0; i < numSteps; i++) {
    const cur = forwardKinematics(currentPose);
    const target: CartesianCoords = {
      x: parseFloat((cur.x + step).toFixed(2)),
      y: parseFloat(cur.y.toFixed(2)),
      z: parseFloat(cur.z.toFixed(2)),
      r: parseFloat(cur.r.toFixed(2)),
    };
    const ik = inverseKinematics(target, currentPose);
    assert(ik.reachable && !!ik.pose, `Step ${i + 1} should succeed (error: ${ik.error})`);
    currentPose = ik.pose!;
  }

  const finalPos = forwardKinematics(currentPose);
  const initialMidPos = forwardKinematics(midIK.pose!);
  console.log(`Position after ${numSteps} X+ steps: X=${finalPos.x.toFixed(2)}, Y=${finalPos.y.toFixed(2)}, Z=${finalPos.z.toFixed(2)}`);
  assert(approxEqual(finalPos.x, initialMidPos.x + numSteps * step), `Final X should be ${initialMidPos.x + numSteps * step}`);
  assert(approxEqual(finalPos.y, initialMidPos.y), 'Y should remain unchanged');
  assert(approxEqual(finalPos.z, initialMidPos.z), 'Z should remain unchanged');

  console.log(`Executing ${numSteps} consecutive X- jogs of -${step}mm back...`);
  for (let i = 0; i < numSteps; i++) {
    const cur = forwardKinematics(currentPose);
    const target: CartesianCoords = {
      x: parseFloat((cur.x - step).toFixed(2)),
      y: parseFloat(cur.y.toFixed(2)),
      z: parseFloat(cur.z.toFixed(2)),
      r: parseFloat(cur.r.toFixed(2)),
    };
    const ik = inverseKinematics(target, currentPose);
    assert(ik.reachable && !!ik.pose, `Reverse step ${i + 1} should succeed (error: ${ik.error})`);
    currentPose = ik.pose!;
  }

  const returnedPos = forwardKinematics(currentPose);
  console.log(`Position after returning: X=${returnedPos.x.toFixed(2)}, Y=${returnedPos.y.toFixed(2)}, Z=${returnedPos.z.toFixed(2)}`);
  assert(approxEqual(returnedPos.x, initialMidPos.x), 'X should return exactly to start');
  assert(approxEqual(returnedPos.y, initialMidPos.y), 'Y should remain exactly at start');
  assert(approxEqual(returnedPos.z, initialMidPos.z), 'Z should remain exactly at start');

  console.log('Test F PASSED!\n');
}

// -------------------------------------------------------------
// Test G: Regression & Extended Controls
// -------------------------------------------------------------
console.log('--- TEST G: Regression & Subsystem Checks ---');
{
  // 1. Home / Reset verification
  const homeCoords = forwardKinematics(initialPose);
  const homeDegrees = poseToDegrees(initialPose);
  console.log(`Home joints: J1=${homeDegrees.j1}°, J2=${homeDegrees.j2}°, J3=${homeDegrees.j3}°, J4=${homeDegrees.j4}°`);
  console.log(`Home XYZ: X=${homeCoords.x.toFixed(2)}, Y=${homeCoords.y.toFixed(2)}, Z=${homeCoords.z.toFixed(2)}`);
  assert(homeDegrees.j1 === 0 && homeDegrees.j2 === 35 && homeDegrees.j3 === 35 && homeDegrees.j4 === 0, 'Home joints match robot config');

  // 2. Joint jogging validation
  const validJ1 = validateJointMove('j1', homeDegrees.j1 + 5);
  assert(validJ1.valid, 'J1+ jog should be valid');
  const validJ2 = validateJointMove('j2', homeDegrees.j2 + 5);
  assert(validJ2.valid, 'J2+ jog should be valid');
  const validJ3 = validateJointMove('j3', homeDegrees.j3 + 5);
  assert(validJ3.valid, 'J3+ jog should be valid');
  const validJ4 = validateJointMove('j4', homeDegrees.j4 + 5);
  assert(validJ4.valid, 'J4+ jog should be valid');

  // Test joint limit violation
  const invalidJ1 = validateJointMove('j1', 140);
  assert(!invalidJ1.valid, 'J1+ beyond limit should be rejected');
  console.log(`Joint limit violation correctly caught: "${invalidJ1.message}"`);

  // 3. Trajectory Generation: MOVL linear interpolation
  const startTarget: CartesianCoords = { x: 300, y: 0, z: 150, r: 0 };
  const endTarget: CartesianCoords = { x: 300, y: 100, z: 120, r: 20 };
  const linearResult = generateCartesianLinearPath(startTarget, endTarget, 10);
  assert(linearResult.valid && linearResult.poses.length === 10, `Linear path should produce 10 poses, got ${linearResult.poses.length}`);
  console.log(`MOVL trajectory generated ${linearResult.poses.length} smooth waypoints.`);

  // 4. Trajectory Generation: JUMP arc interpolation
  const jumpResult = generateJumpPath(startTarget, endTarget, 30);
  assert(jumpResult.valid && jumpResult.waypoints.length === 3, `JUMP path should produce 3 waypoints, got ${jumpResult.waypoints.length}`);
  console.log(`JUMP trajectory generated ${jumpResult.waypoints.length} clearance waypoints.`);

  console.log('Test G PASSED!\n');
}

console.log('=============================================================');
console.log('ALL TESTS A THROUGH G PASSED WITH 100% SUCCESS!');
console.log('=============================================================');
