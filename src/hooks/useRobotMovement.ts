import { useCallback, useEffect, useRef, useState } from 'react';
import { ROBOT_CONFIG } from '../config/robotConfig';
import { forwardKinematics, inverseKinematics } from '../utils/kinematics';
import type { CartesianCoords, MovementCommand, MovementStatus, RobotPose } from '../types/robot';

const HOME: RobotPose = {
  base: ROBOT_CONFIG.initialBase,
  shoulder: ROBOT_CONFIG.initialShoulder,
  elbow: ROBOT_CONFIG.initialElbow,
  wrist: ROBOT_CONFIG.initialWrist,
};

const HOME_CARTESIAN: CartesianCoords = forwardKinematics(HOME);

export function useRobotMovement() {
  const [pose, setPose] = useState<RobotPose>(HOME);
  const [liveCartesian, setLiveCartesian] = useState<CartesianCoords>(HOME_CARTESIAN);
  const [status, setStatus] = useState<MovementStatus>('Ready');
  const [stepMm, setStepMm] = useState<number>(ROBOT_CONFIG.defaultStepMm);

  const poseRef = useRef<RobotPose>(HOME);
  const cartesianRef = useRef<CartesianCoords>(HOME_CARTESIAN);
  const timerRef = useRef<number | undefined>(undefined);
  const busyRef = useRef(false);
  const [animation, setAnimation] = useState<{
    from: RobotPose;
    to: RobotPose;
    started: number;
    duration: number;
    id: number;
  } | null>(null);
  const idRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // Update live Cartesian coordinates during animation frames
  const onLiveFrame = useCallback((animatedPose: RobotPose) => {
    const live = forwardKinematics(animatedPose);
    setLiveCartesian(live);
  }, []);

  const move = useCallback(
    (command: MovementCommand) => {
      if (busyRef.current) return;

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
        timerRef.current = undefined;
      }

      const fromPose = { ...poseRef.current };
      let toPose: RobotPose = { ...fromPose };
      let nextStatus: MovementStatus = 'Ready';

      if (command === 'reset') {
        toPose = { ...HOME };
        nextStatus = 'Returning to home';
      } else {
        const currentCoord = forwardKinematics(fromPose);
        const targetCoord: CartesianCoords = {
          x: Number(currentCoord.x.toFixed(2)),
          y: Number(currentCoord.y.toFixed(2)),
          z: Number(currentCoord.z.toFixed(2)),
          r: Number(currentCoord.r.toFixed(2)),
        };

        switch (command) {
          case 'x+':
            targetCoord.x = Number((targetCoord.x + stepMm).toFixed(2));
            nextStatus = 'Moving X+';
            break;
          case 'x-':
            targetCoord.x = Number((targetCoord.x - stepMm).toFixed(2));
            nextStatus = 'Moving X-';
            break;
          case 'y+':
            targetCoord.y = Number((targetCoord.y + stepMm).toFixed(2));
            nextStatus = 'Moving Y+';
            break;
          case 'y-':
            targetCoord.y = Number((targetCoord.y - stepMm).toFixed(2));
            nextStatus = 'Moving Y-';
            break;
          case 'z+':
            targetCoord.z = Number((targetCoord.z + stepMm).toFixed(2));
            nextStatus = 'Moving Z+';
            break;
          case 'z-':
            targetCoord.z = Number((targetCoord.z - stepMm).toFixed(2));
            nextStatus = 'Moving Z-';
            break;
          case 'left':
            targetCoord.y = Number((targetCoord.y + stepMm).toFixed(2));
            nextStatus = 'Moving Y+';
            break;
          case 'right':
            targetCoord.y = Number((targetCoord.y - stepMm).toFixed(2));
            nextStatus = 'Moving Y-';
            break;
          case 'up':
            targetCoord.z = Number((targetCoord.z + stepMm).toFixed(2));
            nextStatus = 'Moving Z+';
            break;
          case 'down':
            targetCoord.z = Number((targetCoord.z - stepMm).toFixed(2));
            nextStatus = 'Moving Z-';
            break;
          default:
            return;
        }

        const ikResult = inverseKinematics(targetCoord);

        if (!ikResult.reachable || !ikResult.pose) {
          setStatus('Target outside reachable workspace');
          timerRef.current = window.setTimeout(() => {
            setStatus('Ready');
          }, 1800);
          return;
        }

        toPose = ikResult.pose;
      }

      busyRef.current = true;
      setStatus(nextStatus);

      const animId = ++idRef.current;
      setAnimation({
        from: fromPose,
        to: toPose,
        started: performance.now(),
        duration: ROBOT_CONFIG.animationMs,
        id: animId,
      });

      poseRef.current = toPose;
      setPose(toPose);

      const targetCartesian = forwardKinematics(toPose);
      cartesianRef.current = targetCartesian;

      timerRef.current = window.setTimeout(() => {
        busyRef.current = false;
        setStatus('Ready');
        setAnimation(null);
        setLiveCartesian(targetCartesian);
      }, ROBOT_CONFIG.animationMs + 25);
    },
    [stepMm]
  );

  return {
    pose,
    liveCartesian,
    status,
    stepMm,
    setStepMm,
    animation,
    move,
    onLiveFrame,
    isBusy: busyRef.current || status !== 'Ready',
  };
}
