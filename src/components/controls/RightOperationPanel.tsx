import { useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Compass,
  Grab,
  Home,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
  RotateCw,
  Sparkles,
  Wind,
} from 'lucide-react';
import { ROBOT_CONFIG } from '../../config/robotConfig';
import type {
  CartesianCommand,
  CartesianCoords,
  EndEffectorType,
  JointAnglesDeg,
  JointCommand,
} from '../../types/robot';

interface RightOperationPanelProps {
  coords: CartesianCoords;
  joints: JointAnglesDeg;
  cartesianStepMm: number;
  onCartesianStepChange: (step: number) => void;
  jointStepDeg: number;
  onJointStepChange: (step: number) => void;
  onJogCartesian: (cmd: CartesianCommand, customStep?: number) => void;
  onJogJoint: (cmd: JointCommand, customStep?: number) => void;
  onResetRobotHome: () => void;
  onMoveToPosition?: (x: number, y: number, z: number, r?: number) => Promise<boolean>;
  endEffectorType: EndEffectorType;
  suctionActive: boolean;
  onToggleSuction: () => void;
  gripperOpen: boolean;
  onToggleGripper: () => void;
  disabled: boolean;
  onSaveCurrentPoint?: () => void;
}

export default function RightOperationPanel({
  coords,
  joints,
  cartesianStepMm,
  onCartesianStepChange,
  jointStepDeg,
  onJointStepChange,
  onJogCartesian,
  onJogJoint,
  onResetRobotHome,
  onMoveToPosition,
  endEffectorType,
  suctionActive,
  onToggleSuction,
  gripperOpen,
  onToggleGripper,
  disabled,
  onSaveCurrentPoint,
}: RightOperationPanelProps) {
  const [activeTab, setActiveTab] = useState<'cartesian' | 'joint'>('cartesian');
  const [absX, setAbsX] = useState<string>(() => coords.x.toFixed(1));
  const [absY, setAbsY] = useState<string>(() => coords.y.toFixed(1));
  const [absZ, setAbsZ] = useState<string>(() => coords.z.toFixed(1));
  const [absR, setAbsR] = useState<string>(() => coords.r.toFixed(1));

  const handleExecuteAbsoluteMove = () => {
    const xNum = parseFloat(absX);
    const yNum = parseFloat(absY);
    const zNum = parseFloat(absZ);
    const rNum = absR !== '' ? parseFloat(absR) : coords.r;
    if (onMoveToPosition) {
      onMoveToPosition(xNum, yNum, zNum, rNum);
    }
  };

  return (
    <aside className="dobot-operation-panel">
      {/* Panel Top Title */}
      <div className="op-panel-header">
        <div className="op-header-title">
          <Compass size={15} />
          <span>OPERATION PANEL</span>
        </div>
        <div className="op-mode-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'cartesian' ? 'active' : ''}`}
            onClick={() => setActiveTab('cartesian')}
          >
            Cartesian
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'joint' ? 'active' : ''}`}
            onClick={() => setActiveTab('joint')}
          >
            Joint
          </button>
        </div>
      </div>

      <div className="op-panel-scroll">
        {/* Section 1: Live Digital Readouts (DobotStudio-Style Cyan Displays) */}
        <div className="readouts-section">
          <div className="section-title-bar">
            <span>COORDINATE READOUT</span>
            <span className="live-pill">LIVE</span>
          </div>

          <div className="readouts-grid">
            <div className="readout-card">
              <span className="axis-tag red">X</span>
              <div className="readout-val-wrap">
                <span className="digital-val cyan">{coords.x.toFixed(2)}</span>
                <span className="unit-label">mm</span>
              </div>
            </div>

            <div className="readout-card">
              <span className="axis-tag green">Y</span>
              <div className="readout-val-wrap">
                <span className="digital-val cyan">{coords.y.toFixed(2)}</span>
                <span className="unit-label">mm</span>
              </div>
            </div>

            <div className="readout-card">
              <span className="axis-tag blue">Z</span>
              <div className="readout-val-wrap">
                <span className="digital-val cyan">{coords.z.toFixed(2)}</span>
                <span className="unit-label">mm</span>
              </div>
            </div>

            <div className="readout-card">
              <span className="axis-tag yellow">R</span>
              <div className="readout-val-wrap">
                <span className="digital-val cyan">{coords.r.toFixed(2)}</span>
                <span className="unit-label">°</span>
              </div>
            </div>
          </div>

          {/* Joint angles summary row */}
          <div className="joints-compact-summary">
            <div className="joint-badge" title="Joint 1 (Base Yaw)">
              <span>J1:</span> <strong>{joints.j1.toFixed(1)}°</strong>
            </div>
            <div className="joint-badge" title="Joint 2 (Shoulder Pitch)">
              <span>J2:</span> <strong>{joints.j2.toFixed(1)}°</strong>
            </div>
            <div className="joint-badge" title="Joint 3 (Elbow Pitch)">
              <span>J3:</span> <strong>{joints.j3.toFixed(1)}°</strong>
            </div>
            <div className="joint-badge" title="Joint 4 (Wrist Roll)">
              <span>J4:</span> <strong>{joints.j4.toFixed(1)}°</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Jog Controls (Cartesian or Joint) */}
        {activeTab === 'cartesian' ? (
          <div className="jog-section cartesian-jog-section">
            <div className="section-title-bar">
              <span>CARTESIAN JOG CONTROLS</span>
              <div className="step-picker">
                <span className="step-lbl">Step:</span>
                {ROBOT_CONFIG.cartesianStepOptionsMm.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`step-chip ${cartesianStepMm === s ? 'active' : ''}`}
                    onClick={() => onCartesianStepChange(s)}
                    disabled={disabled}
                  >
                    {s}mm
                  </button>
                ))}
              </div>
            </div>

            {/* Circular Jog D-Pad (DobotStudio iconic circular directional control) */}
            <div className="circular-dpad-container">
              <div className="dpad-circular-ring">
                {/* Y+ (Top / Forward) */}
                <button
                  type="button"
                  className="dpad-btn dpad-up"
                  onClick={() => onJogCartesian('y+')}
                  disabled={disabled}
                  title={`Jog Y+ (+${cartesianStepMm}mm)`}
                >
                  <ChevronUp size={18} />
                  <span>Y+</span>
                </button>

                {/* Y- (Bottom / Backward) */}
                <button
                  type="button"
                  className="dpad-btn dpad-down"
                  onClick={() => onJogCartesian('y-')}
                  disabled={disabled}
                  title={`Jog Y- (-${cartesianStepMm}mm)`}
                >
                  <span>Y−</span>
                  <ChevronDown size={18} />
                </button>

                {/* X- (Left) */}
                <button
                  type="button"
                  className="dpad-btn dpad-left"
                  onClick={() => onJogCartesian('x-')}
                  disabled={disabled}
                  title={`Jog X- (-${cartesianStepMm}mm)`}
                >
                  <ChevronLeft size={18} />
                  <span>X−</span>
                </button>

                {/* X+ (Right) */}
                <button
                  type="button"
                  className="dpad-btn dpad-right"
                  onClick={() => onJogCartesian('x+')}
                  disabled={disabled}
                  title={`Jog X+ (+${cartesianStepMm}mm)`}
                >
                  <span>X+</span>
                  <ChevronRight size={18} />
                </button>

                {/* Central Hub */}
                <div className="dpad-center-hub">
                  <span className="dpad-hub-label">X/Y</span>
                </div>
              </div>

              {/* Z and R Vertical Dual Columns */}
              <div className="vertical-jog-columns">
                {/* Vertical Z Axis Jog Column */}
                <div className="axis-column-group">
                  <span className="axis-col-title">Z AXIS</span>
                  <button
                    type="button"
                    className="col-jog-btn plus"
                    onClick={() => onJogCartesian('z+')}
                    disabled={disabled}
                    title={`Jog Z+ (+${cartesianStepMm}mm)`}
                  >
                    <Plus size={15} />
                    <span>Z+</span>
                  </button>
                  <button
                    type="button"
                    className="col-jog-btn minus"
                    onClick={() => onJogCartesian('z-')}
                    disabled={disabled}
                    title={`Jog Z- (-${cartesianStepMm}mm)`}
                  >
                    <Minus size={15} />
                    <span>Z−</span>
                  </button>
                </div>

                {/* Tool Rotation R Column */}
                <div className="axis-column-group">
                  <span className="axis-col-title">R AXIS</span>
                  <button
                    type="button"
                    className="col-jog-btn plus"
                    onClick={() => onJogCartesian('r+')}
                    disabled={disabled}
                    title={`Rotate Tool R+ (+${jointStepDeg}°)`}
                  >
                    <RotateCw size={14} />
                    <span>R+</span>
                  </button>
                  <button
                    type="button"
                    className="col-jog-btn minus"
                    onClick={() => onJogCartesian('r-')}
                    disabled={disabled}
                    title={`Rotate Tool R- (-${jointStepDeg}°)`}
                  >
                    <RotateCcw size={14} />
                    <span>R−</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Absolute Coordinate Positioning Input */}
            <div style={{ marginTop: '12px', background: '#191c23', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--text-dim)' }}>
                <span>ABSOLUTE POSITIONING (TARGET XYZ)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px' }}>X (mm)</span>
                  <input
                    type="number"
                    className="table-num-input"
                    style={{ width: '100%' }}
                    value={absX}
                    onChange={(e) => setAbsX(e.target.value)}
                    disabled={disabled}
                    step={1}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px' }}>Y (mm)</span>
                  <input
                    type="number"
                    className="table-num-input"
                    style={{ width: '100%' }}
                    value={absY}
                    onChange={(e) => setAbsY(e.target.value)}
                    disabled={disabled}
                    step={1}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px' }}>Z (mm)</span>
                  <input
                    type="number"
                    className="table-num-input"
                    style={{ width: '100%' }}
                    value={absZ}
                    onChange={(e) => setAbsZ(e.target.value)}
                    disabled={disabled}
                    step={1}
                  />
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '2px' }}>R (°)</span>
                  <input
                    type="number"
                    className="table-num-input"
                    style={{ width: '100%' }}
                    value={absR}
                    onChange={(e) => setAbsR(e.target.value)}
                    disabled={disabled}
                    step={1}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="tb-btn"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => {
                    setAbsX(coords.x.toFixed(1));
                    setAbsY(coords.y.toFixed(1));
                    setAbsZ(coords.z.toFixed(1));
                    setAbsR(coords.r.toFixed(1));
                  }}
                  disabled={disabled}
                  title="Copy current live coordinates into inputs"
                >
                  Sync Live
                </button>
                <button
                  type="button"
                  className="tb-btn play-btn"
                  style={{ flex: 1.4, justifyContent: 'center', background: '#0284c7', borderColor: '#0369a1' }}
                  onClick={handleExecuteAbsoluteMove}
                  disabled={disabled}
                  title="Execute motion to absolute target coordinate"
                >
                  <Navigation size={13} />
                  <span>Move XYZ</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Joint Jog Panel */
          <div className="jog-section joint-jog-section">
            <div className="section-title-bar">
              <span>INDEPENDENT JOINT JOG</span>
              <div className="step-picker">
                <span className="step-lbl">Step:</span>
                {ROBOT_CONFIG.jointStepOptionsDeg.map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    className={`step-chip ${jointStepDeg === deg ? 'active' : ''}`}
                    onClick={() => onJointStepChange(deg)}
                    disabled={disabled}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            <div className="joint-jog-list">
              {/* Joint 1 Row */}
              <div className="joint-jog-row">
                <div className="jj-info">
                  <span className="jj-name">Joint 1 (Base)</span>
                  <span className="jj-val cyan">{joints.j1.toFixed(1)}°</span>
                </div>
                <div className="jj-btns">
                  <button
                    type="button"
                    className="jj-btn minus"
                    onClick={() => onJogJoint('j1-')}
                    disabled={disabled}
                    title="Jog Base J1-"
                  >
                    <Minus size={14} /> J1−
                  </button>
                  <button
                    type="button"
                    className="jj-btn plus"
                    onClick={() => onJogJoint('j1+')}
                    disabled={disabled}
                    title="Jog Base J1+"
                  >
                    J1+ <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Joint 2 Row */}
              <div className="joint-jog-row">
                <div className="jj-info">
                  <span className="jj-name">Joint 2 (Shoulder)</span>
                  <span className="jj-val cyan">{joints.j2.toFixed(1)}°</span>
                </div>
                <div className="jj-btns">
                  <button
                    type="button"
                    className="jj-btn minus"
                    onClick={() => onJogJoint('j2-')}
                    disabled={disabled}
                    title="Jog Shoulder J2-"
                  >
                    <Minus size={14} /> J2−
                  </button>
                  <button
                    type="button"
                    className="jj-btn plus"
                    onClick={() => onJogJoint('j2+')}
                    disabled={disabled}
                    title="Jog Shoulder J2+"
                  >
                    J2+ <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Joint 3 Row */}
              <div className="joint-jog-row">
                <div className="jj-info">
                  <span className="jj-name">Joint 3 (Elbow)</span>
                  <span className="jj-val cyan">{joints.j3.toFixed(1)}°</span>
                </div>
                <div className="jj-btns">
                  <button
                    type="button"
                    className="jj-btn minus"
                    onClick={() => onJogJoint('j3-')}
                    disabled={disabled}
                    title="Jog Elbow J3-"
                  >
                    <Minus size={14} /> J3−
                  </button>
                  <button
                    type="button"
                    className="jj-btn plus"
                    onClick={() => onJogJoint('j3+')}
                    disabled={disabled}
                    title="Jog Elbow J3+"
                  >
                    J3+ <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Joint 4 Row */}
              <div className="joint-jog-row">
                <div className="jj-info">
                  <span className="jj-name">Joint 4 (Wrist)</span>
                  <span className="jj-val cyan">{joints.j4.toFixed(1)}°</span>
                </div>
                <div className="jj-btns">
                  <button
                    type="button"
                    className="jj-btn minus"
                    onClick={() => onJogJoint('j4-')}
                    disabled={disabled}
                    title="Jog Wrist J4-"
                  >
                    <Minus size={14} /> J4−
                  </button>
                  <button
                    type="button"
                    className="jj-btn plus"
                    onClick={() => onJogJoint('j4+')}
                    disabled={disabled}
                    title="Jog Wrist J4+"
                  >
                    J4+ <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: End Effector Actuation Controls */}
        <div className="end-effector-section">
          <div className="section-title-bar">
            <span>END EFFECTOR OPERATION</span>
            <span className="tool-type-tag">
              {endEffectorType === 'suction' ? 'SUCTION CUP' : 'SERVO GRIPPER'}
            </span>
          </div>

          <div className="effector-controls-row">
            {endEffectorType === 'suction' ? (
              <button
                type="button"
                className={`effector-actuate-btn ${suctionActive ? 'active' : ''}`}
                onClick={onToggleSuction}
                disabled={disabled}
              >
                <Wind size={16} />
                <span>{suctionActive ? 'Suction ON (Vacuum Holding)' : 'Suction OFF (Release)'}</span>
                <span className={`effector-led ${suctionActive ? 'on' : 'off'}`} />
              </button>
            ) : (
              <button
                type="button"
                className={`effector-actuate-btn ${gripperOpen ? '' : 'active'}`}
                onClick={onToggleGripper}
                disabled={disabled}
              >
                <Grab size={16} />
                <span>{gripperOpen ? 'Gripper OPEN (Release)' : 'Gripper CLOSED (Grip)'}</span>
                <span className={`effector-led ${!gripperOpen ? 'on' : 'off'}`} />
              </button>
            )}
          </div>
        </div>

        {/* Section 4: Fast Action Buttons */}
        <div className="action-buttons-section">
          {onSaveCurrentPoint && (
            <button
              type="button"
              className="save-current-point-btn"
              onClick={onSaveCurrentPoint}
              disabled={disabled}
              title="Save current robot position into Teaching Point Table"
            >
              <Sparkles size={15} />
              <span>Save Current Point</span>
            </button>
          )}

          <button
            type="button"
            className="panel-home-btn"
            onClick={onResetRobotHome}
            disabled={disabled}
            title="Return robot arm to home configuration"
          >
            <Home size={15} />
            <span>Return to Home Pose</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
