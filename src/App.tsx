import { useCallback, useRef } from 'react';
import AppHeader from './components/layout/AppHeader';
import MainToolbar from './components/layout/MainToolbar';
import StatusBar from './components/layout/StatusBar';
import SimulationViewport, { ViewportHandle } from './components/viewport/SimulationViewport';
import RightOperationPanel from './components/controls/RightOperationPanel';
import TeachingPanel from './components/teaching/TeachingPanel';
import { useRobotState } from './hooks/useRobotState';
import { useProgramPlayback } from './hooks/useProgramPlayback';

export default function App() {
  const viewportRef = useRef<ViewportHandle>(null);

  // Authoritative robot state hook
  const {
    pose,
    liveCartesian,
    liveJoints,
    status,
    statusDetail,
    setStatus,
    setStatusDetail,

    virtualConnection,
    selectedPort,
    setSelectedPort,
    selectedBaud,
    setSelectedBaud,
    toggleVirtualConnection,

    emergencyStop,
    triggerEmergencyStop,
    resetEmergencyStop,

    cartesianStepMm,
    setCartesianStepMm,
    jointStepDeg,
    setJointStepDeg,
    speedPercent,
    setSpeedPercent,
    accelPercent,
    setAccelPercent,

    endEffectorType,
    setEndEffectorType,
    suctionActive,
    gripperOpen,
    toggleSuction,
    toggleGripper,
    setEndEffectorAction,

    animation,
    onLiveFrame,
    jogCartesian,
    jogJoint,
    resetRobotHome,
    moveToTarget,
    moveToPosition,
    isBusy,
  } = useRobotState();

  // Teaching and Playback hook
  const {
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
  } = useProgramPlayback({
    currentCoords: liveCartesian,
    currentJoints: liveJoints,
    emergencyStop,
    virtualConnected: virtualConnection === 'connected',
    moveToTarget,
    setEndEffectorAction,
    setStatus,
    setStatusDetail,
  });

  // Handle program name update
  const handleProgramNameChange = useCallback(
    (name: string) => {
      updateProgram((prev) => ({ ...prev, name }));
    },
    [updateProgram]
  );

  // Handle loop count update
  const handleLoopCountChange = useCallback(
    (loopCount: number) => {
      updateProgram((prev) => ({
        ...prev,
        settings: { ...prev.settings, loopCount },
      }));
    },
    [updateProgram]
  );

  // Camera reset
  const handleResetCamera = useCallback(() => {
    if (viewportRef.current) {
      viewportRef.current.resetCamera();
      setStatusDetail('3D camera view reset to default perspective.');
    }
  }, [setStatusDetail]);

  const controlsDisabled =
    virtualConnection !== 'connected' ||
    emergencyStop ||
    isBusy ||
    playbackState === 'running';

  return (
    <div className={`dobot-desktop-app ${emergencyStop ? 'emergency-active' : ''}`}>
      {/* 1. TOP HEADER */}
      <AppHeader
        virtualConnection={virtualConnection}
        selectedPort={selectedPort}
        onPortChange={setSelectedPort}
        selectedBaud={selectedBaud}
        onBaudChange={setSelectedBaud}
        onToggleConnection={toggleVirtualConnection}
        emergencyStop={emergencyStop}
        onTriggerEmergencyStop={triggerEmergencyStop}
        onResetEmergencyStop={resetEmergencyStop}
        onResetRobotHome={resetRobotHome}
        onResetCameraView={handleResetCamera}
        endEffectorType={endEffectorType}
        onEndEffectorTypeChange={setEndEffectorType}
        isBusy={isBusy || playbackState === 'running'}
      />

      {/* 2. SECONDARY TOOLBAR */}
      <MainToolbar
        programName={program.name}
        onProgramNameChange={handleProgramNameChange}
        playbackState={playbackState}
        onStartPlayback={startPlayback}
        onPausePlayback={pausePlayback}
        onResumePlayback={resumePlayback}
        onStopPlayback={stopPlayback}
        loopCount={program.settings.loopCount}
        onLoopCountChange={handleLoopCountChange}
        speedPercent={speedPercent}
        onSpeedChange={setSpeedPercent}
        accelPercent={accelPercent}
        onAccelChange={setAccelPercent}
        onNewProgram={newProgram}
        onOpenProgramFile={loadProgramFile}
        onSaveProgram={() => exportProgram()}
        onSaveAs={() => exportProgram(`${program.name.replace(/\s+/g, '_')}_copy.dobot.json`)}
        disabled={virtualConnection !== 'connected' || emergencyStop}
      />

      {/* 3. MAIN WORKSPACE */}
      <div className="dobot-main-layout">
        {/* Left & Center: 3D Viewport + Teaching Points Table */}
        <div className="dobot-center-area">
          {/* 3D Simulation Viewport */}
          <div className="dobot-viewport-frame">
            <SimulationViewport
              ref={viewportRef}
              pose={pose}
              animation={animation}
              onLiveFrame={onLiveFrame}
              endEffectorType={endEffectorType}
              suctionActive={suctionActive}
              gripperOpen={gripperOpen}
            />
          </div>

          {/* Teaching & Playback Points Table Panel */}
          <div className="dobot-teaching-container">
            <TeachingPanel
              points={program.points}
              selectedPointId={selectedPointId}
              onSelectPoint={setSelectedPointId}
              currentPlaybackIndex={currentPointIndex}
              onAddCurrentPoint={addCurrentPositionAsPoint}
              onDeletePoint={deletePoint}
              onMovePointUp={movePointUp}
              onMovePointDown={movePointDown}
              onUpdatePoint={updatePoint}
              onJumpToPoint={jumpToPoint}
              disabled={controlsDisabled}
            />
          </div>
        </div>

        {/* Right Operation Panel */}
        <RightOperationPanel
          coords={liveCartesian}
          joints={liveJoints}
          cartesianStepMm={cartesianStepMm}
          onCartesianStepChange={setCartesianStepMm}
          jointStepDeg={jointStepDeg}
          onJointStepChange={setJointStepDeg}
          onJogCartesian={jogCartesian}
          onJogJoint={jogJoint}
          onResetRobotHome={resetRobotHome}
          onMoveToPosition={moveToPosition}
          endEffectorType={endEffectorType}
          suctionActive={suctionActive}
          onToggleSuction={toggleSuction}
          gripperOpen={gripperOpen}
          onToggleGripper={toggleGripper}
          disabled={controlsDisabled}
          onSaveCurrentPoint={() => addCurrentPositionAsPoint()}
        />
      </div>

      {/* 4. BOTTOM STATUS BAR */}
      <StatusBar
        virtualConnection={virtualConnection}
        selectedPort={selectedPort}
        status={status}
        statusDetail={statusDetail}
        playbackState={playbackState}
        currentLoop={currentLoop}
        totalLoops={program.settings.loopCount}
        currentPointIndex={currentPointIndex}
        totalPoints={program.points.length}
        emergencyStop={emergencyStop}
        coords={liveCartesian}
        joints={liveJoints}
      />
    </div>
  );
}
