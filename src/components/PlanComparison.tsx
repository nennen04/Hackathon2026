import { COMPARISON_NOTE } from '../mockData';
import type { TravelPlan } from '../types';

interface PlanComparisonProps {
  plans: TravelPlan[];
  departureLocation: string;
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  onViewDetail: (plan: TravelPlan) => void;
  onSubmit: () => void;
}

const ROWS: Array<{
  label: string;
  render: (plan: TravelPlan) => string;
}> = [
  { label: 'CO₂排出量', render: (p) => `${p.co2}kg` },
  { label: '体力消耗度', render: (p) => `${p.fatigue}/5` },
  { label: '所要費用', render: (p) => `¥${p.cost.toLocaleString()}` },
  { label: '訪問スポット数', render: (p) => p.spotCount },
  { label: '徒歩距離', render: (p) => `${p.walkingDistance}km` },
  { label: 'リラックス度', render: (p) => `${p.relaxScore}/5` },
];

function planCardClassName(plan: TravelPlan, selected: boolean) {
  const classes = ['plan-card'];
  if (plan.category === 'recommended') classes.push('plan-card--recommended');
  if (plan.category === 'original') classes.push('plan-card--original');
  if (selected) classes.push('plan-card--selected');
  return classes.join(' ');
}

function PlanCard({
  plan,
  selected,
  onSelect,
  onViewDetail,
}: {
  plan: TravelPlan;
  selected: boolean;
  onSelect: () => void;
  onViewDetail: () => void;
}) {
  return (
    <div
      className={planCardClassName(plan, selected)}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {selected && <span className="plan-card__selected-badge">✓ 選択中</span>}
      {plan.label && <span className="plan-card__badge">{plan.label}</span>}
      <div className="plan-card__emoji">{plan.icon}</div>
      <p className="plan-card__name">{plan.name}</p>
      <div className="plan-card__tags">
        {plan.tags.map((tag) => (
          <span className="plan-card__tag" key={tag}>
            {tag}
          </span>
        ))}
      </div>
      <p className="plan-card__transport">移動：{plan.transport}</p>
      <button
        className="plan-card__detail-btn"
        onClick={(e) => {
          e.stopPropagation();
          onViewDetail();
        }}
      >
        詳細を見る
      </button>
    </div>
  );
}

function PlanComparison({
  plans,
  departureLocation,
  selectedPlanId,
  onSelectPlan,
  onViewDetail,
  onSubmit,
}: PlanComparisonProps) {
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div>
      <p className="section-title">プランを見比べてみましょう</p>
      <p className="departure-context-note">
        ※ すべてのプランは「{departureLocation}」出発で比較しています。
      </p>
      <div className="plan-card-row">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            selected={plan.id === selectedPlanId}
            onSelect={() => onSelectPlan(plan.id)}
            onViewDetail={() => onViewDetail(plan)}
          />
        ))}
      </div>

      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>項目</th>
              {plans.map((plan) => (
                <th key={plan.id} className={plan.id === selectedPlanId ? 'col--selected' : undefined}>
                  {plan.id === selectedPlanId ? '✓ ' : ''}
                  {plan.label ?? plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                {plans.map((plan) => (
                  <td key={plan.id} className={plan.id === selectedPlanId ? 'cell--selected' : undefined}>
                    {row.render(plan)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="comparison-note">
        <span>🌱</span>
        <p>{COMPARISON_NOTE}</p>
      </div>

      <div className="plan-selection-status">
        <span className="plan-selection-status__label">選択中：</span>
        <span className="plan-selection-status__value">{selectedPlan ? selectedPlan.name : '未選択'}</span>
      </div>

      <button className="primary-button" onClick={onSubmit} disabled={!selectedPlanId}>
        このプランで次へ進む →
      </button>
    </div>
  );
}

export default PlanComparison;
