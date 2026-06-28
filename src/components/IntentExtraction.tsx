import type { TravelIntent, TravelPlan } from '../types';

interface IntentExtractionProps {
  intent: TravelIntent;
  plan: TravelPlan;
  departureLocation: string;
  onSubmit: () => void;
}

function IntentExtraction({ intent, plan, departureLocation, onSubmit }: IntentExtractionProps) {
  return (
    <div>
      <p className="section-title">選択中のプラン</p>
      <p className="departure-context-note">出発地：{departureLocation}</p>

      <div className="intent-list">
        <div className="intent-row">
          <span className="intent-row__icon">📍</span>
          <div>
            <p className="intent-row__label">プラン</p>
            <p className="intent-row__value">{plan.name}</p>
          </div>
        </div>
        <div className="intent-row">
          <span className="intent-row__icon">🎯</span>
          <div>
            <p className="intent-row__label">体験</p>
            <p className="intent-row__value">
              {plan.tags.length > 0 ? plan.tags.join(' / ') : intent.purposes.join(' / ')}
            </p>
          </div>
        </div>
        <div className="intent-row">
          <span className="intent-row__icon">🚗</span>
          <div>
            <p className="intent-row__label">移動手段</p>
            <p className="intent-row__value">{plan.transport}</p>
          </div>
        </div>
        <div className="intent-row">
          <span className="intent-row__icon">🧭</span>
          <div>
            <p className="intent-row__label">旅行スタイル</p>
            <p className="intent-row__value">{intent.travelStyle}</p>
          </div>
        </div>
        <div className="intent-row">
          <span className="intent-row__icon">🚶</span>
          <div>
            <p className="intent-row__label">徒歩距離</p>
            <p className="intent-row__value">約{plan.walkingDistance}km</p>
          </div>
        </div>
      </div>

      <div className="co2-banner">
        <p className="co2-banner__label">この旅のCO₂排出量（目安）</p>
        <span className="co2-banner__value">約{plan.co2}kg</span>
        <span className="co2-banner__unit">CO₂e</span>
      </div>

      <div className="metric-pair">
        <div className="metric-box">
          <p className="metric-box__label">予算目安</p>
          <p className="metric-box__value">¥{plan.cost.toLocaleString()}</p>
        </div>
        <div className="metric-box">
          <p className="metric-box__label">体力消耗度</p>
          <p className="metric-box__value">{plan.fatigue}/5</p>
        </div>
      </div>

      <div className="advice-card">
        <span className="advice-card__icon">💡</span>
        <p className="advice-card__text">{plan.description}</p>
      </div>

      <button className="primary-button" onClick={onSubmit}>
        プランを比較してみましょう →
      </button>
    </div>
  );
}

export default IntentExtraction;
