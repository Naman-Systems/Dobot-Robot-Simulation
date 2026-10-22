import { Activity, AlertTriangle } from 'lucide-react';
import type { MovementStatus } from '../types/robot';

export default function MovementStatusCard({ status }: { status: MovementStatus }) {
  const isReady = status === 'Ready';
  const isWarning =
    status === 'Target outside reachable workspace' ||
    status === 'Joint limit reached.';

  return (
    <div className={`status-card ${isWarning ? 'warning' : ''} ${!isReady && !isWarning ? 'moving' : ''}`}>
      <div className="status-icon">
        {isWarning ? <AlertTriangle size={17} /> : <Activity size={17} />}
      </div>
      <div className="status-copy">
        <span className="eyebrow">MOVEMENT STATUS</span>
        <strong>{status}</strong>
      </div>
      <span
        className={`status-indicator ${!isReady && !isWarning ? 'active' : ''} ${
          isWarning ? 'warning-dot' : ''
        }`}
      />
    </div>
  );
}
