import { useCallback, useEffect, useRef, useState } from 'react';
import type { PlaybackState, ProgramData, TeachingPoint } from '../types/program';
import type { CartesianCoords, JointAnglesDeg, MotionType, RobotPose } from '../types/robot';
import {
  exportProgramFile,
  importProgramFile,
  loadProgramFromStorage,
  saveProgramToStorage,
} from '../utils/programStorage';
import { generateJumpPath } from '../robotics/kinematics';

interface PlaybackProps {
  currentCoords: CartesianCoords;
  currentJoints: JointAnglesDeg;
  emergencyStop: boolean;
  virtualConnected: boolean;
  moveToTarget: (
    target: { coords?: CartesianCoords; pose?: RobotPose; motionType?: MotionType },
    customDuration?: number
  ) => Promise<boolean>;
  setEndEffectorAction: (action: any) => void;
  setStatus: (status: any) => void;
  setStatusDetail: (msg: string) => void;
}

export function useProgramPlayback({
  currentCoords,
  currentJoints,
  emergencyStop,
  virtualConnected,
  moveToTarget,
  setEndEffectorAction,
  setStatus,
  setStatusDetail,
}: PlaybackProps) {
  const [program, setProgram] = useState<ProgramData>(() => loadProgramFromStorage());
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentPointIndex, setCurrentPointIndex] = useState<number>(-1);
  const [currentLoop, setCurrentLoop] = useState<number>(1);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // References for continuous loop control
  const stopRequestedRef = useRef<boolean>(false);
  const pauseRequestedRef = useRef<boolean>(false);
  const resumeResolverRef = useRef<(() => void) | null>(null);
  const pointIndexRef = useRef<number>(-1);
  const loopRef = useRef<number>(1);
  const progRef = useRef<ProgramData>(program);

  progRef.current = program;

  // Sync selected point on load
  useEffect(() => {
    if (program.points.length > 0 && !selectedPointId) {
      setSelectedPointId(program.points[0].id);
    }
  }, [program.points, selectedPointId]);

  // If emergency stop fires, stop playback immediately
  useEffect(() => {
    if (emergencyStop && playbackState === 'running') {
      stopRequestedRef.current = true;
      setPlaybackState('stopped');
      setStatus('Emergency stop active');
      setStatusDetail('Playback aborted by Emergency Stop.');
    }
  }, [emergencyStop, playbackState, setStatus, setStatusDetail]);

  // Autosave to localStorage on program modification
  const updateProgram = useCallback((updater: (prev: ProgramData) => ProgramData) => {
    setProgram((prev) => {
      const next = updater(prev);
      saveProgramToStorage(next);
      return next;
    });
  }, []);

  // Point Operations:
  // Add current live position as a new point
  const addCurrentPositionAsPoint = useCallback(
    (name?: string, motionType: MotionType = 'MOVJ') => {
      updateProgram((prev) => {
        const nextIndex = prev.points.length + 1;
        const newPoint: TeachingPoint = {
          id: `pt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          index: nextIndex,
          name: name || `Point ${nextIndex}`,
          motionType,
          coords: { ...currentCoords },
          joints: { ...currentJoints },
          pauseMs: 500,
          gripperAction: 'none',
        };
        const updatedPoints = [...prev.points, newPoint];
        setSelectedPointId(newPoint.id);
        setStatusDetail(`Added point #${nextIndex} (${newPoint.name}): X=${newPoint.coords.x} Y=${newPoint.coords.y} Z=${newPoint.coords.z}`);
        return { ...prev, points: updatedPoints };
      });
    },
    [currentCoords, currentJoints, updateProgram, setStatusDetail]
  );

  // Delete point by ID
  const deletePoint = useCallback(
    (id: string) => {
      updateProgram((prev) => {
        const filtered = prev.points.filter((p) => p.id !== id);
        const reindexed = filtered.map((p, idx) => ({ ...p, index: idx + 1 }));
        if (selectedPointId === id) {
          setSelectedPointId(reindexed[0]?.id || null);
        }
        setStatusDetail('Point deleted.');
        return { ...prev, points: reindexed };
      });
    },
    [selectedPointId, updateProgram, setStatusDetail]
  );

  // Move point Up
  const movePointUp = useCallback(
    (index: number) => {
      if (index <= 0) return;
      updateProgram((prev) => {
        const pts = [...prev.points];
        const temp = pts[index];
        pts[index] = pts[index - 1];
        pts[index - 1] = temp;
        const reindexed = pts.map((p, i) => ({ ...p, index: i + 1 }));
        return { ...prev, points: reindexed };
      });
    },
    [updateProgram]
  );

  // Move point Down
  const movePointDown = useCallback(
    (index: number) => {
      updateProgram((prev) => {
        if (index >= prev.points.length - 1) return prev;
        const pts = [...prev.points];
        const temp = pts[index];
        pts[index] = pts[index + 1];
        pts[index + 1] = temp;
        const reindexed = pts.map((p, i) => ({ ...p, index: i + 1 }));
        return { ...prev, points: reindexed };
      });
    },
    [updateProgram]
  );

  // Update specific point fields
  const updatePoint = useCallback(
    (id: string, updates: Partial<TeachingPoint>) => {
      updateProgram((prev) => {
        const updatedPoints = prev.points.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        );
        return { ...prev, points: updatedPoints };
      });
    },
    [updateProgram]
  );

  // New Program
  const newProgram = useCallback(() => {
    const blank: ProgramData = {
      id: `prog-${Date.now()}`,
      name: 'Untitled Program',
      version: '1.0.0',
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      description: 'New Dobot teaching program',
      settings: {
        loopCount: 1,
        speedPercent: 50,
        accelPercent: 50,
        jumpHeightMm: 35,
      },
      points: [],
    };
    setProgram(blank);
    saveProgramToStorage(blank);
    setSelectedPointId(null);
    setCurrentPointIndex(-1);
    setStatusDetail('Created new empty program.');
  }, [setStatusDetail]);

  // Export / Save As
  const exportProgram = useCallback(
    (customName?: string) => {
      exportProgramFile(progRef.current, customName);
      setStatusDetail(`Exported program "${progRef.current.name}" as JSON.`);
    },
    [setStatusDetail]
  );

  // Import / Open Program
  const loadProgramFile = useCallback(
    async (file: File) => {
      try {
        const loaded = await importProgramFile(file);
        setProgram(loaded);
        saveProgramToStorage(loaded);
        setSelectedPointId(loaded.points[0]?.id || null);
        setStatus('Program loaded successfully');
        setStatusDetail(`Loaded program: ${loaded.name} (${loaded.points.length} points)`);
      } catch (err: any) {
        setStatus('Program load failed');
        setStatusDetail(`Load error: ${err.message || 'Corrupt program file.'}`);
      }
    },
    [setStatus, setStatusDetail]
  );

  // Move directly to selected point pose
  const jumpToPoint = useCallback(
    async (point: TeachingPoint) => {
      if (playbackState === 'running') return;
      setSelectedPointId(point.id);
      setStatus('Executing program');
      setStatusDetail(`Moving to ${point.name} (${point.motionType})...`);
      await moveToTarget({ coords: point.coords, motionType: point.motionType });
      if (point.gripperAction && point.gripperAction !== 'none') {
        setEndEffectorAction(point.gripperAction);
      }
      setStatus('Ready');
      setStatusDetail(`Arrived at ${point.name}.`);
    },
    [playbackState, moveToTarget, setEndEffectorAction, setStatus, setStatusDetail]
  );

  // Playback Execution Loop
  const startPlayback = useCallback(async () => {
    if (!virtualConnected) {
      setStatus('Virtual robot disconnected');
      setStatusDetail('Cannot start playback: Virtual robot is disconnected.');
      return;
    }
    if (emergencyStop) {
      setStatus('Emergency stop active');
      setStatusDetail('Cannot start playback: Emergency stop is active.');
      return;
    }
    const currentPoints = progRef.current.points;
    if (currentPoints.length === 0) {
      setStatusDetail('No points in teaching table to play. Add points first.');
      return;
    }

    stopRequestedRef.current = false;
    pauseRequestedRef.current = false;
    setPlaybackState('running');
    setStatus('Executing program');

    const totalLoops = progRef.current.settings.loopCount || 1;

    for (let loop = 1; loop <= totalLoops; loop++) {
      if (stopRequestedRef.current) break;
      loopRef.current = loop;
      setCurrentLoop(loop);

      for (let i = 0; i < currentPoints.length; i++) {
        if (stopRequestedRef.current) break;

        // Check for pause
        if (pauseRequestedRef.current) {
          setPlaybackState('paused');
          setStatus('Playback paused');
          setStatusDetail(`Playback paused at point ${i + 1}/${currentPoints.length} (Loop ${loop}/${totalLoops}).`);
          await new Promise<void>((resolve) => {
            resumeResolverRef.current = resolve;
          });
          if (stopRequestedRef.current) break;
          setPlaybackState('running');
          setStatus('Executing program');
        }

        const pt = currentPoints[i];
        pointIndexRef.current = i;
        setCurrentPointIndex(i);
        setSelectedPointId(pt.id);

        setStatusDetail(
          `Executing Loop ${loop}/${totalLoops} · Point ${i + 1}/${currentPoints.length}: "${pt.name}" [${pt.motionType}]`
        );

        // Execute motion based on motionType
        let success = false;
        if (pt.motionType === 'JUMP') {
          // JUMP motion: Vertical lift -> Horizontal traverse -> Lower to target
          const jumpPlan = generateJumpPath(
            currentCoords,
            pt.coords,
            progRef.current.settings.jumpHeightMm
          );
          if (jumpPlan.valid) {
            for (const waypoint of jumpPlan.waypoints) {
              if (stopRequestedRef.current) break;
              await moveToTarget({ coords: waypoint, motionType: 'MOVJ' });
            }
            success = true;
          } else {
            // Fallback directly to MOVJ if jump calculation encounters bounds
            success = await moveToTarget({ coords: pt.coords, motionType: 'MOVJ' });
          }
        } else {
          // MOVJ or MOVL
          success = await moveToTarget({
            coords: pt.coords,
            motionType: pt.motionType,
          });
        }

        if (!success && !stopRequestedRef.current) {
          setStatus('Position unreachable');
          setStatusDetail(`Point "${pt.name}" is unreachable! Halting playback safely.`);
          setPlaybackState('stopped');
          return;
        }

        // Apply gripper / suction action if specified
        if (pt.gripperAction && pt.gripperAction !== 'none') {
          setEndEffectorAction(pt.gripperAction);
        }

        // Dwell / pause time at point
        if (pt.pauseMs > 0 && !stopRequestedRef.current) {
          await new Promise((r) => setTimeout(r, pt.pauseMs));
        }
      }
    }

    if (stopRequestedRef.current) {
      setPlaybackState('stopped');
      setStatus('Program stopped');
      setStatusDetail('Playback halted.');
    } else {
      setPlaybackState('idle');
      setCurrentPointIndex(-1);
      setStatus('Program completed');
      setStatusDetail(`Program "${progRef.current.name}" finished all ${totalLoops} loop(s) successfully.`);
    }
  }, [
    virtualConnected,
    emergencyStop,
    currentCoords,
    moveToTarget,
    setEndEffectorAction,
    setStatus,
    setStatusDetail,
  ]);

  // Pause Playback
  const pausePlayback = useCallback(() => {
    if (playbackState === 'running') {
      pauseRequestedRef.current = true;
    }
  }, [playbackState]);

  // Resume Playback
  const resumePlayback = useCallback(() => {
    if (playbackState === 'paused' && resumeResolverRef.current) {
      pauseRequestedRef.current = false;
      resumeResolverRef.current();
      resumeResolverRef.current = null;
      setPlaybackState('running');
    }
  }, [playbackState]);

  // Stop Playback
  const stopPlayback = useCallback(() => {
    stopRequestedRef.current = true;
    pauseRequestedRef.current = false;
    if (resumeResolverRef.current) {
      resumeResolverRef.current();
      resumeResolverRef.current = null;
    }
    setPlaybackState('stopped');
    setCurrentPointIndex(-1);
    setStatus('Program stopped');
    setStatusDetail('Program playback stopped.');
  }, [setStatus, setStatusDetail]);

  return {
    program,
    playbackState,
    currentPointIndex,
    currentLoop,
    selectedPointId,
    setSelectedPointId,
    updateProgram,
    addCurrentPositionAsPoint,
    deletePoint,
    movePointUp,
    movePointDown,
    updatePoint,
    newProgram,
    exportProgram,
    loadProgramFile,
    jumpToPoint,
    startPlayback,
    pausePlayback,
    resumePlayback,
    stopPlayback,
  };
}
