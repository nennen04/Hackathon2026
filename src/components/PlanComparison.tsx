import { COMPARISON_NOTE } from '../mockData';
import type { TravelPlan } from '../types';

interface PlanComparisonProps {
  plans: TravelPlan[];
  departureLocation: string;
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

function planCardClassName(plan: TravelPlan) {
  if (plan.category === 'recommended') return 'plan-card plan-card--recommended';
  if (plan.category === 'original') return 'plan-card plan-card--original';
  return 'plan-card';
}

function PlanCard({ plan, onViewDetail }: { plan: TravelPlan; onViewDetail: () => void }) {
  return (
    <div className={planCardClassName(plan)}>
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
      <button className="plan-card__detail-btn" onClick={onViewDetail}>
        詳細を見る
      </button>
    </div>
  );
}

function PlanComparison({ plans, departureLocation, onViewDetail, onSubmit }: PlanComparisonProps) {
  return (
    <div>
      <p className="section-title">プランを見比べてみましょう</p>
      <p className="departure-context-note">
        ※ すべてのプランは「{departureLocation}」出発で比較しています。
      </p>
      <div className="plan-card-row">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onViewDetail={() => onViewDetail(plan)} />
        ))}
      </div>

      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>項目</th>
              {plans.map((plan) => (
                <th
                  key={plan.id}
                  className={plan.category === 'recommended' ? 'col--recommended' : undefined}
                >
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
                  <td
                    key={plan.id}
                    className={plan.category === 'recommended' ? 'cell--recommended' : undefined}
                  >
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

      <button className="primary-button" onClick={onSubmit}>
        次のステップに進む →
      </button>
    </div>
  );
}

export default PlanComparison;
