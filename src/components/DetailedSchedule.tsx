import type { ReactNode } from 'react';
import type { TravelPlan } from '../types';

interface DetailedScheduleProps {
  plan: TravelPlan;
  departureLocation?: string;
  footer?: ReactNode;
}

function DetailedSchedule({ plan, departureLocation, footer }: DetailedScheduleProps) {
  return (
    <div>
      {departureLocation && (
        <p className="departure-context-note" style={{ textAlign: 'center' }}>
          出発地：{departureLocation}
        </p>
      )}
      <p className="schedule-title">{plan.name}</p>

      <div className="timeline">
        {plan.schedule.map((item) => (
          <div className="timeline-item" key={item.time}>
            <span className="timeline-item__dot">{item.icon ?? '📍'}</span>
            <p className="timeline-item__time">{item.time}</p>
            <p className="timeline-item__title">{item.title}</p>
            {item.description && <p className="timeline-item__desc">{item.description}</p>}
          </div>
        ))}
      </div>

      <div className="summary-grid">
        <div className="summary-grid__box">
          <p className="summary-grid__label">CO₂総排出量</p>
          <p className="summary-grid__value">{plan.co2}kg</p>
        </div>
        <div className="summary-grid__box">
          <p className="summary-grid__label">予算目安</p>
          <p className="summary-grid__value">¥{plan.cost.toLocaleString()}</p>
        </div>
        <div className="summary-grid__box">
          <p className="summary-grid__label">体力消耗度</p>
          <p className="summary-grid__value">{plan.fatigue}/5</p>
        </div>
        <div className="summary-grid__box">
          <p className="summary-grid__label">リラックス度</p>
          <p className="summary-grid__value">{plan.relaxScore}/5</p>
        </div>
      </div>

      {footer}
    </div>
  );
}

export default DetailedSchedule;
