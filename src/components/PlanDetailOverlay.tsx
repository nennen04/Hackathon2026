import DetailedSchedule from './DetailedSchedule';
import type { TravelPlan } from '../types';

interface PlanDetailOverlayProps {
  plan: TravelPlan | null;
  onClose: () => void;
}

function PlanDetailOverlay({ plan, onClose }: PlanDetailOverlayProps) {
  if (!plan) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <p className="drawer-header__title">{plan.name}</p>
          <button className="drawer-close" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>
        <div className="drawer-body">
          <DetailedSchedule plan={plan} />
        </div>
      </div>
    </>
  );
}

export default PlanDetailOverlay;
