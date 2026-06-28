import type { TravelIntent } from '../types';

interface IntentExtractionProps {
  intent: TravelIntent;
  departureLocation: string;
  onSubmit: () => void;
}

function IntentExtraction({ intent, departureLocation, onSubmit }: IntentExtractionProps) {
  return (
    <div>
      <p className="section-title">あなたの旅の意図</p>
      <p className="departure-context-note">出発地：{departureLocation}</p>

      <div className="intent-list">
        <div className="intent-row">
          <span className="intent-row__icon">📍</span>
          <div>
            <p className="intent-row__label">行き先</p>
            <p className="intent-row__value">{intent.destination}</p>
          </div>
        </div>
        <div className="intent-row">
          <span className="intent-row__icon">🎯</span>
          <div>
            <p className="intent-row__label">目的</p>
            <p className="intent-row__value">{intent.purposes.join(' / ')}</p>
          </div>
        </div>
        <div className="intent-row">
          <span className="intent-row__icon">🚗</span>
          <div>
            <p className="intent-row__label">移動の希望</p>
            <p className="intent-row__value">{intent.transportWish}</p>
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
            <p className="intent-row__label">体力</p>
            <p className="intent-row__value">{intent.stamina}</p>
          </div>
        </div>
      </div>

      <div className="co2-banner">
        <p className="co2-banner__label">この旅のCO₂排出量（目安）</p>
        <span className="co2-banner__value">約{intent.co2Kg}kg</span>
        <span className="co2-banner__unit">CO₂e</span>
      </div>

      <div className="metric-pair">
        <div className="metric-box">
          <p className="metric-box__label">予算目安</p>
          <p className="metric-box__value">¥{intent.budgetYen.toLocaleString()}</p>
        </div>
        <div className="metric-box">
          <p className="metric-box__label">体力消耗度</p>
          <p className="metric-box__value">{intent.fatigueScore}/5</p>
        </div>
      </div>

      <div className="advice-card">
        <span className="advice-card__icon">💡</span>
        <p className="advice-card__text">{intent.aiComment}</p>
      </div>

      <button className="primary-button" onClick={onSubmit}>
        プランを比較してみましょう →
      </button>
    </div>
  );
}

export default IntentExtraction;
