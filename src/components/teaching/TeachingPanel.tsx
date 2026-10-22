import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Edit2,
  ListPlus,
  Play,
  PlayCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import type { MotionType, TeachingPoint } from '../../types/program';
import { inverseKinematics, poseToDegrees } from '../../robotics/kinematics';

interface TeachingPanelProps {
  points: TeachingPoint[];
  selectedPointId: string | null;
  onSelectPoint: (id: string) => void;
  currentPlaybackIndex: number;
  onAddCurrentPoint: (name?: string, motionType?: MotionType) => void;
  onDeletePoint: (id: string) => void;
  onMovePointUp: (index: number) => void;
  onMovePointDown: (index: number) => void;
  onUpdatePoint: (id: string, updates: Partial<TeachingPoint>) => void;
  onJumpToPoint: (point: TeachingPoint) => void;
  disabled: boolean;
}

export default function TeachingPanel({
  points,
  selectedPointId,
  onSelectPoint,
  currentPlaybackIndex,
  onAddCurrentPoint,
  onDeletePoint,
  onMovePointUp,
  onMovePointDown,
  onUpdatePoint,
  onJumpToPoint,
  disabled,
}: TeachingPanelProps) {
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [tempName, setTempName] = useState<string>('');

  const handleStartRename = (point: TeachingPoint) => {
    setEditingPointId(point.id);
    setTempName(point.name);
  };

  const handleSaveRename = (id: string) => {
    if (tempName.trim()) {
      onUpdatePoint(id, { name: tempName.trim() });
    }
    setEditingPointId(null);
  };

  const selectedPoint = points.find((p) => p.id === selectedPointId);
  const selectedIndex = points.findIndex((p) => p.id === selectedPointId);

  return (
    <div className="dobot-teaching-panel">
      {/* Table Toolbar */}
      <div className="teaching-toolbar">
        <div className="teaching-title">
          <ListPlus size={15} />
          <span>TEACHING & PLAYBACK POINTS</span>
          <span className="point-count-pill">{points.length} Points</span>
        </div>

        <div className="teaching-actions">
          <button
            type="button"
            className="teach-btn primary"
            onClick={() => onAddCurrentPoint()}
            disabled={disabled}
            title="Save current robot position into point table"
          >
            <Plus size={14} />
            <span>Save Current Position</span>
          </button>

          <button
            type="button"
            className="teach-btn"
            onClick={() => selectedPoint && onJumpToPoint(selectedPoint)}
            disabled={!selectedPoint || disabled}
            title="Move robot to selected point"
          >
            <PlayCircle size={14} />
            <span>Move to Point</span>
          </button>

          <button
            type="button"
            className="teach-btn"
            onClick={() => moveSelectedUp()}
            disabled={selectedIndex <= 0 || disabled}
            title="Move Selected Point Up"
          >
            <ArrowUp size={14} />
          </button>

          <button
            type="button"
            className="teach-btn"
            onClick={() => moveSelectedDown()}
            disabled={selectedIndex < 0 || selectedIndex >= points.length - 1 || disabled}
            title="Move Selected Point Down"
          >
            <ArrowDown size={14} />
          </button>

          <button
            type="button"
            className="teach-btn danger"
            onClick={() => selectedPointId && onDeletePoint(selectedPointId)}
            disabled={!selectedPointId || disabled}
            title="Delete Selected Point"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Points Data Table */}
      <div className="points-table-container">
        <table className="dobot-points-table">
          <thead>
            <tr>
              <th className="th-num">#</th>
              <th className="th-name">Point Name</th>
              <th className="th-type">Motion</th>
              <th className="th-coord">X (mm)</th>
              <th className="th-coord">Y (mm)</th>
              <th className="th-coord">Z (mm)</th>
              <th className="th-coord">R (°)</th>
              <th className="th-joints">Joint Angles (J1 / J2 / J3 / J4)</th>
              <th className="th-pause">Pause (ms)</th>
              <th className="th-tool">Tool Action</th>
              <th className="th-action">Test</th>
            </tr>
          </thead>
          <tbody>
            {points.length === 0 ? (
              <tr className="empty-row">
                <td colSpan={11}>
                  <div className="empty-message">
                    <span>No teaching points recorded. Jog the arm and click <b>"Save Current Position"</b> to add points.</span>
                  </div>
                </td>
              </tr>
            ) : (
              points.map((pt, idx) => {
                const isSelected = pt.id === selectedPointId;
                const isExecuting = idx === currentPlaybackIndex;
                const isEditing = pt.id === editingPointId;

                return (
                  <tr
                    key={pt.id}
                    className={`point-row ${isSelected ? 'selected' : ''} ${isExecuting ? 'executing' : ''}`}
                    onClick={() => onSelectPoint(pt.id)}
                  >
                    <td className="td-num">
                      {isExecuting ? (
                        <span className="executing-badge">▶</span>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </td>

                    <td className="td-name">
                      {isEditing ? (
                        <div className="name-edit-box" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(pt.id);
                              if (e.key === 'Escape') setEditingPointId(null);
                            }}
                            autoFocus
                          />
                          <button
                            type="button"
                            className="btn-tick"
                            onClick={() => handleSaveRename(pt.id)}
                          >
                            <Check size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="name-display">
                          <span>{pt.name}</span>
                          <button
                            type="button"
                            className="rename-trigger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartRename(pt);
                            }}
                            title="Rename point"
                          >
                            <Edit2 size={11} />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="td-type" onClick={(e) => e.stopPropagation()}>
                      <select
                        className="table-select motion-select"
                        value={pt.motionType}
                        onChange={(e) =>
                          onUpdatePoint(pt.id, { motionType: e.target.value as MotionType })
                        }
                        disabled={disabled}
                      >
                        <option value="MOVJ">MOVJ (Joint)</option>
                        <option value="MOVL">MOVL (Linear)</option>
                        <option value="JUMP">JUMP (Doorway)</option>
                      </select>
                    </td>

                    <td className="td-coord" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        className="table-num-input"
                        value={pt.coords.x}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const newCoords = { ...pt.coords, x: val };
                          const ik = inverseKinematics(newCoords);
                          onUpdatePoint(pt.id, {
                            coords: newCoords,
                            ...(ik.reachable && ik.pose ? { joints: poseToDegrees(ik.pose) } : {}),
                          });
                        }}
                        disabled={disabled}
                        step={1}
                      />
                    </td>
                    <td className="td-coord" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        className="table-num-input"
                        value={pt.coords.y}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const newCoords = { ...pt.coords, y: val };
                          const ik = inverseKinematics(newCoords);
                          onUpdatePoint(pt.id, {
                            coords: newCoords,
                            ...(ik.reachable && ik.pose ? { joints: poseToDegrees(ik.pose) } : {}),
                          });
                        }}
                        disabled={disabled}
                        step={1}
                      />
                    </td>
                    <td className="td-coord" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        className="table-num-input"
                        value={pt.coords.z}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const newCoords = { ...pt.coords, z: val };
                          const ik = inverseKinematics(newCoords);
                          onUpdatePoint(pt.id, {
                            coords: newCoords,
                            ...(ik.reachable && ik.pose ? { joints: poseToDegrees(ik.pose) } : {}),
                          });
                        }}
                        disabled={disabled}
                        step={1}
                      />
                    </td>
                    <td className="td-coord" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        className="table-num-input"
                        value={pt.coords.r}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const newCoords = { ...pt.coords, r: val };
                          const ik = inverseKinematics(newCoords);
                          onUpdatePoint(pt.id, {
                            coords: newCoords,
                            ...(ik.reachable && ik.pose ? { joints: poseToDegrees(ik.pose) } : {}),
                          });
                        }}
                        disabled={disabled}
                        step={1}
                      />
                    </td>

                    <td className="td-joints">
                      <span className="joints-summary">
                        {pt.joints.j1.toFixed(0)}° / {pt.joints.j2.toFixed(0)}° / {pt.joints.j3.toFixed(0)}° / {pt.joints.j4.toFixed(0)}°
                      </span>
                    </td>

                    <td className="td-pause" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="number"
                        className="table-num-input"
                        value={pt.pauseMs}
                        min={0}
                        max={10000}
                        step={100}
                        onChange={(e) =>
                          onUpdatePoint(pt.id, { pauseMs: Math.max(0, Number(e.target.value)) })
                        }
                        disabled={disabled}
                      />
                    </td>

                    <td className="td-tool" onClick={(e) => e.stopPropagation()}>
                      <select
                        className="table-select tool-select"
                        value={pt.gripperAction || 'none'}
                        onChange={(e) =>
                          onUpdatePoint(pt.id, { gripperAction: e.target.value as any })
                        }
                        disabled={disabled}
                      >
                        <option value="none">No Action</option>
                        <option value="suction_on">Suction ON</option>
                        <option value="suction_off">Suction OFF</option>
                        <option value="gripper_open">Gripper Open</option>
                        <option value="gripper_close">Gripper Close</option>
                      </select>
                    </td>

                    <td className="td-action">
                      <button
                        type="button"
                        className="row-play-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToPoint(pt);
                        }}
                        disabled={disabled}
                        title="Move arm to this point"
                      >
                        <Play size={11} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  function moveSelectedUp() {
    if (selectedIndex > 0) {
      onMovePointUp(selectedIndex);
    }
  }

  function moveSelectedDown() {
    if (selectedIndex >= 0 && selectedIndex < points.length - 1) {
      onMovePointDown(selectedIndex);
    }
  }
}
