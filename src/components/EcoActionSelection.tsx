import { ECO_ACTIONS } from '../mockData';

interface EcoActionSelectionProps {
  planName: string;
  actionStates: Record<string, boolean>;
  onToggle: (id: string) => void;
  totalPoints: number;
  onSubmit: () => void;
}

const ICONS: Record<string, string> = {
  'e-bike': '🚲',
  'local-cafe': '☕',
  'my-bottle': '🧴',
  'eco-inn': '🏡',
};

function EcoActionSelection({
  planName,
  actionStates,
  onToggle,
  totalPoints,
  onSubmit,
}: EcoActionSelectionProps) {
  return (
    <div>
      <p className="section-title">旅をもっとエコにするアクションを選んでみましょう</p>
      <p className="departure-context-note">選択中のプラン：{planName}</p>

      {ECO_ACTIONS.map((action) => {
        const on = actionStates[action.id];
        return (
          <div
            className={on ? 'eco-action-card eco-action-card--on' : 'eco-action-card'}
            key={action.id}
          >
            <span className="eco-action-card__icon">{ICONS[action.id]}</span>
            <div className="eco-action-card__body">
              <p className="eco-action-card__title">{action.title}</p>
              <p className="eco-action-card__desc">{action.description}</p>
              <p className="eco-action-card__points">+{action.points} ecoポイント</p>
            </div>
            <button
              className={on ? 'toggle-switch toggle-switch--on' : 'toggle-switch'}
              onClick={() => onToggle(action.id)}
              aria-label={`${action.title}を切り替える`}
              type="button"
            >
              <span className="toggle-switch__knob" />
            </button>
          </div>
        );
      })}

      <div className="eco-total-card">
        <p className="eco-total-card__label">選択中のエコアクション</p>
        <p className="eco-total-card__value">合計 +{totalPoints} ecoポイント</p>
        <p className="eco-total-card__sub">🌿 CO₂削減に貢献！</p>
      </div>

      <button className="primary-button" onClick={onSubmit}>
        プランを確定する
      </button>
    </div>
  );
}

export default EcoActionSelection;
