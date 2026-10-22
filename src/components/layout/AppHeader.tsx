import { useState } from 'react';
import {
  AlertOctagon,
  Bot,
  Camera,
  Home,
  Power,
  Settings,
  Sliders,
} from 'lucide-react';
import { ROBOT_CONFIG } from '../../config/robotConfig';
import type { EndEffectorType, VirtualConnectionState } from '../../types/robot';

interface AppHeaderProps {
  virtualConnection: VirtualConnectionState;
  selectedPort: string;
  onPortChange: (port: string) => void;
  selectedBaud: number;
  onBaudChange: (baud: number) => void;
  onToggleConnection: () => void;
  emergencyStop: boolean;
  onTriggerEmergencyStop: () => void;
  onResetEmergencyStop: () => void;
  onResetRobotHome: () => void;
  onResetCameraView: () => void;
  endEffectorType: EndEffectorType;
  onEndEffectorTypeChange: (type: EndEffectorType) => void;
  isBusy: boolean;
}

export default function AppHeader({
  virtualConnection,
  selectedPort,
  onPortChange,
  selectedBaud,
  onBaudChange,
  onToggleConnection,
  emergencyStop,
  onTriggerEmergencyStop,
  onResetEmergencyStop,
  onResetRobotHome,
  onResetCameraView,
  endEffectorType,
  onEndEffectorTypeChange,
  isBusy,
}: AppHeaderProps) {
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const isConnected = virtualConnection === 'connected';

  return (
    <header className="dobot-header">
      {/* Left: Brand Identity */}
      <div className="header-left">
        <div className="dobot-logo">
          <div className="logo-hex">
            <Bot size={20} className="logo-icon" />
          </div>
          <div className="logo-text">
            <span className="logo-title">RoboSim <strong>3D</strong></span>
            <span className="logo-sub">DOBOTSTUDIO SIMULATION SUITE V1.9.4</span>
          </div>
        </div>

        {/* Robot Model Selector */}
        <div className="model-selector-pill">
          <span className="pill-dot" />
          <span className="pill-label">MODEL:</span>
          <span className="pill-name">Dobot Magician Virtual</span>
        </div>
      </div>

      {/* Center: Virtual Connection Control Widget (Modeled after DobotStudio Topbar) */}
      <div className="header-center">
        <div className="connection-bar">
          <div className="conn-status-indicator">
            <span className={`status-led ${isConnected ? 'connected' : 'disconnected'}`} />
            <span className="status-text">
              {isConnected ? 'VIRTUAL CONNECTED' : 'VIRTUAL DISCONNECTED'}
            </span>
          </div>

          <div className="conn-selects">
            <div className="custom-select-wrapper">
              <select
                value={selectedPort}
                onChange={(e) => onPortChange(e.target.value)}
                disabled={isConnected || emergencyStop}
                className="header-select"
                title="Select Virtual Communication Port"
              >
                {ROBOT_CONFIG.virtualPorts.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="custom-select-wrapper">
              <select
                value={selectedBaud}
                onChange={(e) => onBaudChange(Number(e.target.value))}
                disabled={isConnected || emergencyStop}
                className="header-select baud-select"
                title="Select Virtual Baud Rate"
              >
                {ROBOT_CONFIG.virtualBaudRates.map((b) => (
                  <option key={b} value={b}>
                    {b} baud
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className={`conn-btn ${isConnected ? 'disconnect' : 'connect'}`}
              onClick={onToggleConnection}
              disabled={emergencyStop}
              title={isConnected ? 'Disconnect Virtual Robot' : 'Connect to Virtual Robot'}
            >
              <Power size={13} />
              <span>{isConnected ? 'Disconnect' : 'Connect'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right: Quick Actions & Industrial Emergency Stop */}
      <div className="header-right">
        {/* Reset Camera View */}
        <button
          type="button"
          className="header-tool-btn"
          onClick={onResetCameraView}
          title="Reset 3D Camera View (Does NOT change robot pose)"
        >
          <Camera size={14} />
          <span>Cam Home</span>
        </button>

        {/* Reset Robot Arm Home */}
        <button
          type="button"
          className="header-tool-btn"
          onClick={onResetRobotHome}
          disabled={!isConnected || emergencyStop || isBusy}
          title="Smoothly Move Robot Arm to Default Home Pose"
        >
          <Home size={14} />
          <span>Robot Home</span>
        </button>

        {/* Settings button */}
        <button
          type="button"
          className="header-tool-btn"
          onClick={() => setShowSettingsModal(true)}
          title="Simulator Settings & End-Effector Setup"
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>

        {/* Industrial Emergency Stop Button (Prominent Red Push Button with Latch) */}
        <div className="estop-container">
          {emergencyStop ? (
            <button
              type="button"
              className="estop-btn latched"
              onClick={onResetEmergencyStop}
              title="Emergency Stop is Active! Click to Reset/Release E-Stop."
            >
              <div className="estop-inner">
                <AlertOctagon size={16} className="estop-icon pulse" />
                <span className="estop-text">RESET E-STOP</span>
              </div>
            </button>
          ) : (
            <button
              type="button"
              className="estop-btn ready"
              onClick={onTriggerEmergencyStop}
              title="EMERGENCY STOP: Click to immediately halt all motion"
            >
              <div className="estop-inner">
                <AlertOctagon size={16} className="estop-icon" />
                <span className="estop-text">EMERGENCY STOP</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="modal-backdrop" onClick={() => setShowSettingsModal(false)}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Sliders size={16} />
                <span>Robot & Tool Configuration</span>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowSettingsModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="settings-section">
                <h3>End Effector Tool Selection</h3>
                <p className="settings-desc">Choose active simulated tool mounted to Joint 4 flange.</p>
                <div className="tool-radio-group">
                  <label className={`tool-option ${endEffectorType === 'suction' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="endEffector"
                      value="suction"
                      checked={endEffectorType === 'suction'}
                      onChange={() => onEndEffectorTypeChange('suction')}
                    />
                    <div className="tool-info">
                      <strong>Pneumatic Suction Cup</strong>
                      <small>Standard Dobot industrial vacuum cup with air valve actuation.</small>
                    </div>
                  </label>

                  <label className={`tool-option ${endEffectorType === 'gripper' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="endEffector"
                      value="gripper"
                      checked={endEffectorType === 'gripper'}
                      onChange={() => onEndEffectorTypeChange('gripper')}
                    />
                    <div className="tool-info">
                      <strong>2-Finger Servo Gripper</strong>
                      <small>Parallel dual-jaw mechanical gripper with animated open/close.</small>
                    </div>
                  </label>
                </div>
              </div>

              <div className="settings-section">
                <h3>Kinematic Model Specifications</h3>
                <div className="specs-table">
                  <div className="spec-row">
                    <span>Upper Arm (L1):</span>
                    <strong>175.0 mm</strong>
                  </div>
                  <div className="spec-row">
                    <span>Forearm (L2):</span>
                    <strong>142.0 mm</strong>
                  </div>
                  <div className="spec-row">
                    <span>Tool Reach (L_tool):</span>
                    <strong>95.0 mm</strong>
                  </div>
                  <div className="spec-row">
                    <span>Horizontal Radius Range:</span>
                    <strong>150 mm — 395 mm</strong>
                  </div>
                  <div className="spec-row">
                    <span>Vertical Range (Z):</span>
                    <strong>-40 mm — 320 mm</strong>
                  </div>
                  <div className="spec-row">
                    <span>Joint 1 (Base Yaw):</span>
                    <strong>-135° to +135°</strong>
                  </div>
                  <div className="spec-row">
                    <span>Joint 2 (Shoulder):</span>
                    <strong>0° to +85°</strong>
                  </div>
                  <div className="spec-row">
                    <span>Joint 3 (Elbow):</span>
                    <strong>-10° to +90°</strong>
                  </div>
                  <div className="spec-row">
                    <span>Joint 4 (Wrist Roll):</span>
                    <strong>-135° to +135°</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setShowSettingsModal(false)}
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
