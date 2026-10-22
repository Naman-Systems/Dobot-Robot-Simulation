import { Home, Minus, Plus } from 'lucide-react';
import { ROBOT_CONFIG } from '../config/robotConfig';
import type { MovementCommand } from '../types/robot';

interface Props {
  onMove: (command: MovementCommand) => void;
  stepMm: number;
  onStepChange: (step: number) => void;
  disabled: boolean;
}

export default function DirectionControls({
  onMove,
  stepMm,
  onStepChange,
  disabled,
}: Props) {
  const press = (cmd: MovementCommand) => () => onMove(cmd);

  return (
    <div className="dobot-controls">
      {/* Step Size Selector (DobotStudio-style) */}
      <div className="step-selector-row">
        <span className="step-selector-label">STEP INCREMENT</span>
        <div className="step-button-group">
          {ROBOT_CONFIG.stepOptionsMm.map((s) => (
            <button
              key={s}
              type="button"
              className={`step-btn ${stepMm === s ? 'active' : ''}`}
              onClick={() => onStepChange(s)}
              disabled={disabled}
            >
              {s} mm
            </button>
          ))}
        </div>
      </div>

      {/* Axis Jog Controls Table */}
      <div className="axis-jog-panel" role="region" aria-label="Cartesian axis jogging controls">
        {/* X Axis Row */}
        <div className="axis-row x-axis">
          <button
            type="button"
            className="axis-btn minus"
            onClick={press('x-')}
            disabled={disabled}
            title={`Move End Effector -X by ${stepMm}mm`}
            aria-label="Move X negative"
          >
            <Minus size={15} />
            <span>X−</span>
          </button>
          <div className="axis-title">
            <span className="axis-badge red">X</span>
            <div className="axis-text">
              <strong>X AXIS</strong>
              <small>Horizontal Front/Back</small>
            </div>
          </div>
          <button
            type="button"
            className="axis-btn plus"
            onClick={press('x+')}
            disabled={disabled}
            title={`Move End Effector +X by ${stepMm}mm`}
            aria-label="Move X positive"
          >
            <span>X+</span>
            <Plus size={15} />
          </button>
        </div>

        {/* Y Axis Row */}
        <div className="axis-row y-axis">
          <button
            type="button"
            className="axis-btn minus"
            onClick={press('y-')}
            disabled={disabled}
            title={`Move End Effector -Y by ${stepMm}mm`}
            aria-label="Move Y negative"
          >
            <Minus size={15} />
            <span>Y−</span>
          </button>
          <div className="axis-title">
            <span className="axis-badge green">Y</span>
            <div className="axis-text">
              <strong>Y AXIS</strong>
              <small>Horizontal Lateral</small>
            </div>
          </div>
          <button
            type="button"
            className="axis-btn plus"
            onClick={press('y+')}
            disabled={disabled}
            title={`Move End Effector +Y by ${stepMm}mm`}
            aria-label="Move Y positive"
          >
            <span>Y+</span>
            <Plus size={15} />
          </button>
        </div>

        {/* Z Axis Row */}
        <div className="axis-row z-axis">
          <button
            type="button"
            className="axis-btn minus"
            onClick={press('z-')}
            disabled={disabled}
            title={`Move End Effector -Z by ${stepMm}mm`}
            aria-label="Move Z negative"
          >
            <Minus size={15} />
            <span>Z−</span>
          </button>
          <div className="axis-title">
            <span className="axis-badge blue">Z</span>
            <div className="axis-text">
              <strong>Z AXIS</strong>
              <small>Vertical Height</small>
            </div>
          </div>
          <button
            type="button"
            className="axis-btn plus"
            onClick={press('z+')}
            disabled={disabled}
            title={`Move End Effector +Z by ${stepMm}mm`}
            aria-label="Move Z positive"
          >
            <span>Z+</span>
            <Plus size={15} />
          </button>
        </div>
      </div>

      {/* Dobot Home / Reset Action */}
      <button
        type="button"
        className="dobot-home-btn"
        onClick={press('reset')}
        disabled={disabled}
      >
        <Home size={16} />
        <span>Return to Home Pose</span>
      </button>
    </div>
  );
}
