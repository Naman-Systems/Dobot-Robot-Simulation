import { useCallback, useEffect, useRef, useState } from 'react';
import { ROBOT_CONFIG } from '../config/robotConfig';
import {
  degToRad,
  forwardKinematics,
  generateCartesianLinearPath,
  inverseKinematics,
  poseToDegrees,
  validateJointMove,
} from '../robotics/kinematics';
import type {
  CartesianCommand,
  CartesianCoords,
  EndEffectorAction,
  EndEffectorType,
  IKResult,
  JointAnglesDeg,
  JointCommand,
  MotionType,
  RobotPose,
  SimulationStatus,
  VirtualConnectionState,
} from '../types/robot';

export const HOME_POSE: RobotPose = {
  base: ROBOT_CONFIG.initialBase,
  shoulder: ROBOT_CONFIG.initialShoulder,
  elbow: ROBOT_CONFIG.initialElbow,
  wrist: ROBOT_CONFIG.initialWrist,
};

export interface MotionAnimation {
  from: RobotPose;
  to: RobotPose;
  started: number;
  duration: number;
  id: number;
  waypoints?: RobotPose[];
  motionType: MotionType;
}

export function useRobotState() {
  const [pose, setPose] = useState<RobotPose>(HOME_POSE);
  const [liveCartesian, setLiveCartesian] = useState<CartesianCoords>(() =>
    forwardKinematics(HOME_POSE)
  );
  const [liveJoints, setLiveJoints] = useState<JointAnglesDeg>(() =>
    poseToDegrees(HOME_POSE)
  );
  const [status, setStatus] = useState<SimulationStatus>('Ready');
  const [statusDetail, setStatusDetail] = useState<string>('System initialized and ready.');

  // Virtual Connection state
  const [virtualConnection, setVirtualConnection] = useState<VirtualConnectionState>('connected');
  const [selectedPort, setSelectedPort] = useState<string>(ROBOT_CONFIG.virtualPorts[0]);
  const [selectedBaud, setSelectedBaud] = useState<number>(115200);

  // Emergency Stop state (latched)
  const [emergencyStop, setEmergencyStop] = useState<boolean>(false);

  // End Effector state
  const [endEffectorType, setEndEffectorType] = useState<EndEffectorType>('suction');
  const [suctionActive, setSuctionActive] = useState<boolean>(false);
  const [gripperOpen, setGripperOpen] = useState<boolean>(true);

  // Increments and Speeds
  const [cartesianStepMm, setCartesianStepMm] = useState<number>(ROBOT_CONFIG.defaultCartesianStepMm);
  const [jointStepDeg, setJointStepDeg] = useState<number>(ROBOT_CONFIG.defaultJointStepDeg);
  const [speedPercent, setSpeedPercent] = useState<number>(ROBOT_CONFIG.defaultSpeedPercent);
  const [accelPercent, setAccelPercent] = useState<number>(ROBOT_CONFIG.defaultAccelPercent);

  // Active animation
  const [animation, setAnimation] = useState<MotionAnimation | null>(null);

  // Refs for instantaneous state checks
  const poseRef = useRef<RobotPose>(HOME_POSE);
  const currentAnimatedPoseRef = useRef<RobotPose>(HOME_POSE);
  const animRef = useRef<MotionAnimation | null>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const busyRef = useRef<boolean>(false);
  const idRef = useRef<number>(0);
  const emergencyRef = useRef<boolean>(false);
  const connectionRef = useRef<VirtualConnectionState>('connected');

  emergencyRef.current = emergencyStop;
  connectionRef.current = virtualConnection;
  animRef.current = animation;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // Compute movement duration based on configured speed and distance
  const calculateDuration = useCallback(
    (customDuration?: number) => {
      if (customDuration !== undefined && customDuration > 0) return customDuration;
      // speedPercent 1-100 mapped between maxDuration and minDuration
      const t = (speedPercent - 1) / 99;
      const baseMs =
        ROBOT_CONFIG.maxDurationMs -
        t * (ROBOT_CONFIG.maxDurationMs - ROBOT_CONFIG.minDurationMs);
      return Math.round(baseMs);
    },
    [speedPercent]
  );

  // Real-time animation frame callback from 3D canvas
  const onLiveFrame = useCallback((currentAnimatedPose: RobotPose) => {
    currentAnimatedPoseRef.current = currentAnimatedPose;
    setLiveCartesian(forwardKinematics(currentAnimatedPose));
    setLiveJoints(poseToDegrees(currentAnimatedPose));
  }, []);

  // Emergency Stop Trigger
  const triggerEmergencyStop = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    emergencyRef.current = true;
    setEmergencyStop(true);
    busyRef.current = false;
    setAnimation(null);
    setStatus('Emergency stop active');
    setStatusDetail('EMERGENCY STOP ENGAGED: All motion interrupted. Reset to restore operation.');
  }, []);

  // Emergency Stop Reset
  const resetEmergencyStop = useCallback(() => {
    emergencyRef.current = false;
    setEmergencyStop(false);
    busyRef.current = false;
    setStatus('Ready');
    setStatusDetail('Emergency stop cleared. Virtual robot ready.');
  }, []);

  // Connect / Disconnect Virtual Robot
  const toggleVirtualConnection = useCallback(() => {
    if (virtualConnection === 'connected') {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      busyRef.current = false;
      setAnimation(null);
      setVirtualConnection('disconnected');
      setStatus('Virtual robot disconnected');
      setStatusDetail(`Virtual port ${selectedPort} closed.`);
    } else {
      setStatus('Virtual robot connected');
      setStatusDetail(`Connected to virtual robot on ${selectedPort} @ ${selectedBaud} baud.`);
      setVirtualConnection('connected');
    }
  }, [virtualConnection, selectedPort, selectedBaud]);

  // Execute motion from current pose to a target pose
  const executeMotionToPose = useCallback(
    (
      toPose: RobotPose,
      newStatus: SimulationStatus,
      detailMsg: string,
      motionType: MotionType = 'MOVJ',
      waypoints?: RobotPose[],
      customDuration?: number,
      allowChaining = false
    ): boolean => {
      if (emergencyRef.current) {
        setStatus('Emergency stop active');
        setStatusDetail('Cannot move: Emergency stop is active. Reset to continue.');
        return false;
      }

      if (connectionRef.current !== 'connected') {
        setStatus('Virtual robot disconnected');
        setStatusDetail('Cannot move: Virtual robot is disconnected. Click Connect.');
        return false;
      }

      if (busyRef.current && !allowChaining) return false;

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }

      // If already animating, start smoothly from current physical position
      const fromPose = animRef.current
        ? { ...currentAnimatedPoseRef.current }
        : { ...poseRef.current };

      const duration = calculateDuration(customDuration);
      const animId = ++idRef.current;

      busyRef.current = true;
      setStatus(newStatus);
      setStatusDetail(detailMsg);

      setAnimation({
        from: fromPose,
        to: toPose,
        started: performance.now(),
        duration,
        id: animId,
        motionType,
        waypoints,
      });

      // Update target pose ref
      poseRef.current = toPose;
      setPose(toPose);

      const targetCartesian = forwardKinematics(toPose);
      const targetJoints = poseToDegrees(toPose);

      timerRef.current = window.setTimeout(() => {
        busyRef.current = false;
        setAnimation(null);
        currentAnimatedPoseRef.current = toPose;
        setLiveCartesian(targetCartesian);
        setLiveJoints(targetJoints);
        setStatus('Ready');
        setStatusDetail(`Position reached: X=${targetCartesian.x.toFixed(1)} Y=${targetCartesian.y.toFixed(1)} Z=${targetCartesian.z.toFixed(1)} R=${targetCartesian.r.toFixed(1)}°`);
      }, duration + 30);

      return true;
    },
    [calculateDuration]
  );

  // Reset Robot Arm to Home Pose
  const resetRobotHome = useCallback(() => {
    return executeMotionToPose(
      HOME_POSE,
      'Returning to home',
      'Moving smoothly to Dobot default home position...',
      'MOVJ'
    );
  }, [executeMotionToPose]);

  // Cartesian Jog Command (X+, X-, Y+, Y-, Z+, Z-, R+, R-)
  const jogCartesian = useCallback(
    (cmd: CartesianCommand, customStep?: number): boolean => {
      if (cmd === 'reset') {
        return resetRobotHome();
      }

      if (emergencyRef.current) {
        setStatus('Emergency stop active');
        setStatusDetail('Emergency stop is active! Release E-Stop before jogging.');
        return false;
      }

      if (connectionRef.current !== 'connected') {
        setStatus('Virtual robot disconnected');
        setStatusDetail('Virtual robot disconnected. Connect before jogging.');
        return false;
      }

      // Read authoritative coordinates from latest target pose to prevent stale state on rapid clicks
      const currentCoords = forwardKinematics(poseRef.current);
      const targetCoords: CartesianCoords = {
        x: Number(currentCoords.x.toFixed(2)),
        y: Number(currentCoords.y.toFixed(2)),
        z: Number(currentCoords.z.toFixed(2)),
        r: Number(currentCoords.r.toFixed(2)),
      };

      const step = customStep ?? cartesianStepMm;
      if (!Number.isFinite(step) || step <= 0) {
        setStatusDetail('Invalid step size: must be a positive finite number.');
        return false;
      }

      let moveStatus: SimulationStatus = 'Ready';
      let detail = '';

      switch (cmd) {
        case 'x+':
          targetCoords.x = Number((targetCoords.x + step).toFixed(2));
          moveStatus = 'Moving X+';
          detail = `Jogging TCP X+ by ${step}mm to X=${targetCoords.x.toFixed(1)}mm`;
          break;
        case 'x-':
          targetCoords.x = Number((targetCoords.x - step).toFixed(2));
          moveStatus = 'Moving X-';
          detail = `Jogging TCP X- by ${step}mm to X=${targetCoords.x.toFixed(1)}mm`;
          break;
        case 'y+':
          targetCoords.y = Number((targetCoords.y + step).toFixed(2));
          moveStatus = 'Moving Y+';
          detail = `Jogging TCP Y+ by ${step}mm to Y=${targetCoords.y.toFixed(1)}mm`;
          break;
        case 'y-':
          targetCoords.y = Number((targetCoords.y - step).toFixed(2));
          moveStatus = 'Moving Y-';
          detail = `Jogging TCP Y- by ${step}mm to Y=${targetCoords.y.toFixed(1)}mm`;
          break;
        case 'z+':
          targetCoords.z = Number((targetCoords.z + step).toFixed(2));
          moveStatus = 'Moving Z+';
          detail = `Jogging TCP Z+ by ${step}mm to Z=${targetCoords.z.toFixed(1)}mm`;
          break;
        case 'z-':
          targetCoords.z = Number((targetCoords.z - step).toFixed(2));
          moveStatus = 'Moving Z-';
          detail = `Jogging TCP Z- by ${step}mm to Z=${targetCoords.z.toFixed(1)}mm`;
          break;
        case 'r+':
          targetCoords.r = Number((targetCoords.r + jointStepDeg).toFixed(2));
          moveStatus = 'Rotating R+';
          detail = `Rotating Tool R+ by ${jointStepDeg}° to R=${targetCoords.r.toFixed(1)}°`;
          break;
        case 'r-':
          targetCoords.r = Number((targetCoords.r - jointStepDeg).toFixed(2));
          moveStatus = 'Rotating R-';
          detail = `Rotating Tool R- by ${jointStepDeg}° to R=${targetCoords.r.toFixed(1)}°`;
          break;
        default:
          return false;
      }

      // Calculate Inverse Kinematics
      const ik = inverseKinematics(targetCoords, poseRef.current);
      if (!ik.reachable || !ik.pose) {
        setStatus('Position unreachable');
        setStatusDetail(ik.error || 'Requested coordinate is outside robot reachable workspace.');
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          setStatus('Ready');
        }, 2200);
        return false;
      }

      // Responsive duration for jogging feedback
      const jogDuration = Math.round(140 + ((100 - speedPercent) / 99) * 220);

      return executeMotionToPose(ik.pose, moveStatus, detail, 'MOVJ', undefined, jogDuration, true);
    },
    [cartesianStepMm, jointStepDeg, speedPercent, resetRobotHome, executeMotionToPose]
  );

  // Dedicated single-axis movement functions (Section 7)
  const movePositiveX = useCallback((step?: number) => jogCartesian('x+', step), [jogCartesian]);
  const moveNegativeX = useCallback((step?: number) => jogCartesian('x-', step), [jogCartesian]);
  const movePositiveY = useCallback((step?: number) => jogCartesian('y+', step), [jogCartesian]);
  const moveNegativeY = useCallback((step?: number) => jogCartesian('y-', step), [jogCartesian]);
  const movePositiveZ = useCallback((step?: number) => jogCartesian('z+', step), [jogCartesian]);
  const moveNegativeZ = useCallback((step?: number) => jogCartesian('z-', step), [jogCartesian]);

  const getCurrentPosition = useCallback((): CartesianCoords => {
    return forwardKinematics(poseRef.current);
  }, []);

  const validateTargetPosition = useCallback(
    (x: number, y: number, z: number, r?: number): IKResult => {
      return inverseKinematics({ x, y, z, r }, poseRef.current);
    },
    []
  );

  const stopMovement = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    busyRef.current = false;
    setAnimation(null);
    setStatus('Ready');
    setStatusDetail('Robot movement stopped.');
  }, [setStatus, setStatusDetail]);

  // Joint Jog Command (J1+, J1-, J2+, J2-, J3+, J3-, J4+, J4-)
  const jogJoint = useCallback(
    (cmd: JointCommand, customStep?: number) => {
      if (emergencyRef.current) {
        setStatus('Emergency stop active');
        setStatusDetail('Emergency stop is active! Release E-Stop before jogging.');
        return false;
      }

      if (connectionRef.current !== 'connected') {
        setStatus('Virtual robot disconnected');
        setStatusDetail('Virtual robot disconnected. Connect before jogging.');
        return false;
      }

      const currentDeg = poseToDegrees(poseRef.current);
      const newDeg: JointAnglesDeg = { ...currentDeg };
      const step = customStep ?? jointStepDeg;
      if (!Number.isFinite(step) || step <= 0) return false;

      let jointKey: 'j1' | 'j2' | 'j3' | 'j4' = 'j1';
      let moveStatus: SimulationStatus = 'Jogging Joint 1';
      let label = 'Base J1';

      switch (cmd) {
        case 'j1+':
          newDeg.j1 = Number((newDeg.j1 + step).toFixed(2));
          jointKey = 'j1';
          moveStatus = 'Jogging Joint 1';
          label = 'Base J1+';
          break;
        case 'j1-':
          newDeg.j1 = Number((newDeg.j1 - step).toFixed(2));
          jointKey = 'j1';
          moveStatus = 'Jogging Joint 1';
          label = 'Base J1-';
          break;
        case 'j2+':
          newDeg.j2 = Number((newDeg.j2 + step).toFixed(2));
          jointKey = 'j2';
          moveStatus = 'Jogging Joint 2';
          label = 'Shoulder J2+';
          break;
        case 'j2-':
          newDeg.j2 = Number((newDeg.j2 - step).toFixed(2));
          jointKey = 'j2';
          moveStatus = 'Jogging Joint 2';
          label = 'Shoulder J2-';
          break;
        case 'j3+':
          newDeg.j3 = Number((newDeg.j3 + step).toFixed(2));
          jointKey = 'j3';
          moveStatus = 'Jogging Joint 3';
          label = 'Elbow J3+';
          break;
        case 'j3-':
          newDeg.j3 = Number((newDeg.j3 - step).toFixed(2));
          jointKey = 'j3';
          moveStatus = 'Jogging Joint 3';
          label = 'Elbow J3-';
          break;
        case 'j4+':
          newDeg.j4 = Number((newDeg.j4 + step).toFixed(2));
          jointKey = 'j4';
          moveStatus = 'Jogging Joint 4';
          label = 'Wrist J4+';
          break;
        case 'j4-':
          newDeg.j4 = Number((newDeg.j4 - step).toFixed(2));
          jointKey = 'j4';
          moveStatus = 'Jogging Joint 4';
          label = 'Wrist J4-';
          break;
        default:
          return false;
      }

      // Check joint limits
      const validation = validateJointMove(jointKey, newDeg[jointKey]);
      if (!validation.valid) {
        setStatus('Joint limit reached');
        setStatusDetail(validation.message || `${label} joint limit reached.`);
        if (timerRef.current) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          setStatus('Ready');
        }, 2000);
        return false;
      }

      const targetPose: RobotPose = {
        base: degToRad(newDeg.j1),
        shoulder: degToRad(newDeg.j2),
        elbow: degToRad(newDeg.j3),
        wrist: degToRad(newDeg.j4),
      };

      const jogDuration = Math.round(140 + ((100 - speedPercent) / 99) * 220);

      return executeMotionToPose(
        targetPose,
        moveStatus,
        `Jogging ${label} by ${step}° to ${newDeg[jointKey].toFixed(1)}°`,
        'MOVJ',
        undefined,
        jogDuration,
        true
      );
    },
    [jointStepDeg, speedPercent, executeMotionToPose]
  );

  // Move directly to target pose or coordinates with given motion type (for playback or jump-to-point)
  const moveToTarget = useCallback(
    (
      target: { coords?: CartesianCoords; pose?: RobotPose; motionType?: MotionType },
      customDuration?: number
    ): Promise<boolean> => {
      return new Promise((resolve) => {
        let finalPose: RobotPose | undefined = target.pose;
        const motionType: MotionType = target.motionType || 'MOVJ';

        if (!finalPose && target.coords) {
          const ik = inverseKinematics(target.coords, poseRef.current);
          if (!ik.reachable || !ik.pose) {
            setStatus('Position unreachable');
            setStatusDetail(ik.error || 'Target coordinate is unreachable.');
            resolve(false);
            return;
          }
          finalPose = ik.pose;
        }

        if (!finalPose) {
          resolve(false);
          return;
        }

        let waypoints: RobotPose[] | undefined = undefined;

        if (motionType === 'MOVL' && target.coords) {
          const startCoords = forwardKinematics(poseRef.current);
          const path = generateCartesianLinearPath(startCoords, target.coords, 12);
          if (path.valid && path.poses.length > 0) {
            waypoints = path.poses;
          }
        }

        const success = executeMotionToPose(
          finalPose,
          'Executing program',
          `Moving to target pose (${motionType})...`,
          motionType,
          waypoints,
          customDuration
        );

        if (!success) {
          resolve(false);
          return;
        }

        const duration = calculateDuration(customDuration);
        window.setTimeout(() => {
          resolve(true);
        }, duration + 35);
      });
    },
    [calculateDuration, executeMotionToPose]
  );

  // End Effector controls
  const toggleSuction = useCallback(() => {
    setSuctionActive((prev) => {
      const next = !prev;
      setStatusDetail(`Suction Cup ${next ? 'ACTIVATED (Vacuum On)' : 'DEACTIVATED (Vacuum Off)'}`);
      return next;
    });
  }, []);

  const toggleGripper = useCallback(() => {
    setGripperOpen((prev) => {
      const next = !prev;
      setStatusDetail(`Gripper ${next ? 'OPENED' : 'CLOSED'}`);
      return next;
    });
  }, []);

  const setEndEffectorAction = useCallback((action: EndEffectorAction) => {
    if (action === 'suction_on') setSuctionActive(true);
    if (action === 'suction_off') setSuctionActive(false);
    if (action === 'gripper_open') setGripperOpen(true);
    if (action === 'gripper_close') setGripperOpen(false);
  }, []);

  // Move directly to absolute coordinates (Section 7)
  const moveToPosition = useCallback(
    (x: number, y: number, z: number, r?: number, motionType: MotionType = 'MOVJ'): Promise<boolean> => {
      if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
        setStatus('Position unreachable');
        setStatusDetail('Target coordinates must be finite numeric values.');
        return Promise.resolve(false);
      }
      return moveToTarget({
        coords: { x, y, z, r: r !== undefined && Number.isFinite(r) ? r : forwardKinematics(poseRef.current).r },
        motionType,
      });
    },
    [moveToTarget, setStatus, setStatusDetail]
  );

  return {
    pose,
    liveCartesian,
    liveJoints,
    status,
    statusDetail,
    setStatus,
    setStatusDetail,

    // Virtual connection
    virtualConnection,
    selectedPort,
    setSelectedPort,
    selectedBaud,
    setSelectedBaud,
    toggleVirtualConnection,

    // Safety
    emergencyStop,
    triggerEmergencyStop,
    resetEmergencyStop,

    // Controls
    cartesianStepMm,
    setCartesianStepMm,
    jointStepDeg,
    setJointStepDeg,
    speedPercent,
    setSpeedPercent,
    accelPercent,
    setAccelPercent,

    // End-effector
    endEffectorType,
    setEndEffectorType,
    suctionActive,
    gripperOpen,
    toggleSuction,
    toggleGripper,
    setEndEffectorAction,

    // Animation & Motion
    animation,
    onLiveFrame,
    jogCartesian,
    jogJoint,
    resetRobotHome,
    moveToTarget,
    moveToPosition,
    movePositiveX,
    moveNegativeX,
    movePositiveY,
    moveNegativeY,
    movePositiveZ,
    moveNegativeZ,
    getCurrentPosition,
    validateTargetPosition,
    stopMovement,
    isBusy: busyRef.current || status === 'Executing program' || status === 'Returning to home',
  };
}
