import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import type { PlaybackState } from '../../types/program';
import type {
  CartesianCoords,
  JointAnglesDeg,
  SimulationStatus,
  VirtualConnectionState,
} from '../../types/robot';

interface StatusBarProps {
  virtualConnection: VirtualConnectionState;
  selectedPort: string;
  status: SimulationStatus;
  statusDetail: string;
  playbackState: PlaybackState;
  currentLoop: number;
  totalLoops: number;
  currentPointIndex: number;
  totalPoints: number;
  emergencyStop: boolean;
  coords: CartesianCoords;
  joints: JointAnglesDeg;
}

export default function StatusBar({
  virtualConnection,
  selectedPort,
  status,
  statusDetail,
  playbackState,
  currentLoop,
  totalLoops,
  currentPointIndex,
  totalPoints,
  emergencyStop,
  coords,
  joints,
}: StatusBarProps) {
  const isConnected = virtualConnection === 'connected';

  let statusBadgeClass = 'normal';
  if (emergencyStop) statusBadgeClass = 'danger';
  else if (status === 'Position unreachable' || status === 'Joint limit reached' || status === 'Program load failed') {
    statusBadgeClass = 'warning';
  } else if (status === 'Executing program' || status === 'Returning to home') {
    statusBadgeClass = 'running';
  }

  return (
    <footer className="dobot-status-bar">
      {/* Left Item: Connection LED */}
      <div className="status-item connection-item">
        {isConnected ? (
          <>
            <span className="status-led connected pulse-slow" />
            <span className="status-label">VIRTUAL LINK:</span>
            <strong className="status-val">{selectedPort} (115200 8-N-1)</strong>
          </>
        ) : (
          <>
            <span className="status-led disconnected" />
            <span className="status-label">VIRTUAL LINK:</span>
            <strong className="status-val offline">DISCONNECTED</strong>
          </>
        )}
      </div>

      <div className="status-bar-divider" />

      {/* Robot Model */}
      <div className="status-item model-item">
        <Bot size={13} className="status-icon" />
        <span className="status-label">ROBOT:</span>
        <span className="status-val">Dobot Magician (4-DOF Articulated)</span>
      </div>

      <div className="status-bar-divider" />

      {/* Kinematics Mode */}
      <div className="status-item kin-item">
        <Cpu size={13} className="status-icon" />
        <span className="status-label">KINEMATICS:</span>
        <span className="status-val">Analytical IK & FK Sync</span>
      </div>

      <div className="status-bar-divider" />

      {/* Playback Execution Progress */}
      <div className="status-item playback-item">
        <Activity size={13} className="status-icon" />
        <span className="status-label">PLAYBACK:</span>
        {playbackState === 'running' ? (
          <span className="status-val running-text">
            Loop {currentLoop}/{totalLoops} · Point {currentPointIndex + 1}/{totalPoints}
          </span>
        ) : playbackState === 'paused' ? (
          <span className="status-val paused-text">PAUSED</span>
        ) : (
          <span className="status-val muted">IDLE</span>
        )}
      </div>

      <div className="status-bar-divider" />

      {/* Main Dynamic Message Log Area */}
      <div className={`status-item message-item ${statusBadgeClass}`}>
        {emergencyStop ? (
          <AlertTriangle size={14} className="msg-icon danger" />
        ) : (
          <CheckCircle2 size={13} className="msg-icon" />
        )}
        <span className="message-content">{statusDetail}</span>
      </div>

      {/* Right Quick Telemetry */}
      <div className="status-right-coords">
        <span className="coord-ticker" title={`J1=${joints.j1.toFixed(1)}° J2=${joints.j2.toFixed(1)}° J3=${joints.j3.toFixed(1)}° J4=${joints.j4.toFixed(1)}°`}>
          X:<span className="ticker-val">{coords.x.toFixed(1)}</span>
        </span>
        <span className="coord-ticker">
          Y:<span className="ticker-val">{coords.y.toFixed(1)}</span>
        </span>
        <span className="coord-ticker">
          Z:<span className="ticker-val">{coords.z.toFixed(1)}</span>
        </span>
        <span className="coord-ticker">
          R:<span className="ticker-val">{coords.r.toFixed(1)}°</span>
        </span>
      </div>
    </footer>
  );
}
