import React, { useRef } from 'react';
import {
  Download,
  FilePlus,
  FolderOpen,
  Gauge,
  Pause,
  Play,
  Repeat,
  Save,
  Square,
  Zap,
} from 'lucide-react';
import type { PlaybackState } from '../../types/program';

interface MainToolbarProps {
  programName: string;
  onProgramNameChange: (name: string) => void;
  playbackState: PlaybackState;
  onStartPlayback: () => void;
  onPausePlayback: () => void;
  onResumePlayback: () => void;
  onStopPlayback: () => void;
  loopCount: number;
  onLoopCountChange: (count: number) => void;
  speedPercent: number;
  onSpeedChange: (speed: number) => void;
  accelPercent: number;
  onAccelChange: (accel: number) => void;
  onNewProgram: () => void;
  onOpenProgramFile: (file: File) => void;
  onSaveProgram: () => void;
  onSaveAs: () => void;
  disabled: boolean;
}

export default function MainToolbar({
  programName,
  onProgramNameChange,
  playbackState,
  onStartPlayback,
  onPausePlayback,
  onResumePlayback,
  onStopPlayback,
  loopCount,
  onLoopCountChange,
  speedPercent,
  onSpeedChange,
  accelPercent,
  onAccelChange,
  onNewProgram,
  onOpenProgramFile,
  onSaveProgram,
  onSaveAs,
  disabled,
}: MainToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenProgramFile(file);
      e.target.value = '';
    }
  };

  const isRunning = playbackState === 'running';
  const isPaused = playbackState === 'paused';

  return (
    <div className="dobot-secondary-toolbar">
      {/* Mode Tag */}
      <div className="toolbar-section mode-tag-section">
        <span className="mode-badge">TEACHING & PLAYBACK</span>
        <input
          type="text"
          className="program-name-input"
          value={programName}
          onChange={(e) => onProgramNameChange(e.target.value)}
          placeholder="Program Name"
          title="Click to rename current program"
        />
      </div>

      <div className="toolbar-divider" />

      {/* Program File Operations */}
      <div className="toolbar-section file-ops-section">
        <button
          type="button"
          className="tb-btn"
          onClick={onNewProgram}
          disabled={disabled || isRunning}
          title="Create New Blank Program"
        >
          <FilePlus size={15} />
          <span>New</span>
        </button>

        <button
          type="button"
          className="tb-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isRunning}
          title="Open Program from JSON File"
        >
          <FolderOpen size={15} />
          <span>Open</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <button
          type="button"
          className="tb-btn"
          onClick={onSaveProgram}
          disabled={disabled}
          title="Save Program to Local Storage & Download"
        >
          <Save size={15} />
          <span>Save</span>
        </button>

        <button
          type="button"
          className="tb-btn"
          onClick={onSaveAs}
          disabled={disabled}
          title="Save As JSON file"
        >
          <Download size={15} />
          <span>Save As</span>
        </button>
      </div>

      <div className="toolbar-divider" />

      {/* Playback Controls */}
      <div className="toolbar-section playback-ops-section">
        {isRunning ? (
          <button
            type="button"
            className="tb-btn play-btn running"
            onClick={onPausePlayback}
            title="Pause Playback"
          >
            <Pause size={15} />
            <span>Pause</span>
          </button>
        ) : isPaused ? (
          <button
            type="button"
            className="tb-btn play-btn paused"
            onClick={onResumePlayback}
            title="Resume Playback"
          >
            <Play size={15} />
            <span>Resume</span>
          </button>
        ) : (
          <button
            type="button"
            className="tb-btn play-btn"
            onClick={onStartPlayback}
            disabled={disabled}
            title="Start Teaching Program Playback"
          >
            <Play size={15} />
            <span>Start</span>
          </button>
        )}

        <button
          type="button"
          className="tb-btn stop-btn"
          onClick={onStopPlayback}
          disabled={playbackState === 'idle' && !disabled}
          title="Stop Playback"
        >
          <Square size={14} />
          <span>Stop</span>
        </button>

        {/* Loop Count Selector */}
        <div className="tb-widget loop-widget">
          <Repeat size={13} className="widget-icon" />
          <span className="widget-label">Loop:</span>
          <select
            className="tb-select"
            value={loopCount}
            onChange={(e) => onLoopCountChange(Number(e.target.value))}
            disabled={isRunning || disabled}
            title="Number of execution loops"
          >
            <option value={1}>1 time</option>
            <option value={2}>2 times</option>
            <option value={5}>5 times</option>
            <option value={10}>10 times</option>
            <option value={999}>Infinite</option>
          </select>
        </div>
      </div>

      <div className="toolbar-divider" />

      {/* Speed & Acceleration Adjustments */}
      <div className="toolbar-section motion-settings-section">
        <div className="tb-slider-widget" title="Simulated motion speed percentage">
          <div className="slider-header">
            <Gauge size={13} />
            <span>Speed:</span>
            <strong>{speedPercent}%</strong>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={speedPercent}
            onChange={(e) => onSpeedChange(Number(e.target.value))}
            disabled={disabled}
            className="tb-range-slider"
          />
        </div>

        <div className="tb-slider-widget" title="Simulated acceleration percentage">
          <div className="slider-header">
            <Zap size={13} />
            <span>Accel:</span>
            <strong>{accelPercent}%</strong>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={accelPercent}
            onChange={(e) => onAccelChange(Number(e.target.value))}
            disabled={disabled}
            className="tb-range-slider"
          />
        </div>
      </div>
    </div>
  );
}
