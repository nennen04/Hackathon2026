import type { TravelPlan } from '../types';

interface SimilarPlanDrawerProps {
  open: boolean;
  onClose: () => void;
  plans: TravelPlan[];
  addedPlanIds: Set<string>;
  onAddToComparison: (plan: TravelPlan) => void;
  onChangeConditions: () => void;
}

function co2LevelLabel(co2: number) {
  if (co2 < 10) return '少なめ';
  if (co2 < 25) return '中程度';
  return '多め';
}

function co2TagClass(co2: number) {
  if (co2 < 10) return 'tag-pill tag-pill--co2-low';
  if (co2 < 25) return 'tag-pill tag-pill--co2-mid';
  return 'tag-pill tag-pill--co2-high';
}

function SimilarPlanDrawer({
  open,
  onClose,
  plans,
  addedPlanIds,
  onAddToComparison,
  onChangeConditions,
}: SimilarPlanDrawerProps) {
  if (!open) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer-panel">
        <div className="drawer-header">
          <p className="drawer-header__title">この希望に近い他のプラン</p>
          <button className="drawer-close" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>
        <div className="drawer-body">
          <p className="drawer-note">現在の希望条件に近い代替候補です。</p>

          {plans.map((plan) => {
            const added = addedPlanIds.has(plan.id);
            return (
              <div
                className={added ? 'similar-card similar-card--selected' : 'similar-card'}
                key={plan.id}
              >
                <div className="similar-card__top">
                  <span className="similar-card__emoji">{plan.icon}</span>
                  <div>
                    <p className="similar-card__title">{plan.name}</p>
                    <div className="similar-card__tags">
                      {plan.tags.map((tag) => (
                        <span className="tag-pill tag-pill--neutral" key={tag}>
                          {tag}
                        </span>
                      ))}
                      <span className={co2TagClass(plan.co2)}>CO₂ {co2LevelLabel(plan.co2)}</span>
                      <span className="tag-pill tag-pill--fatigue">体力 {plan.fatigue}/5</span>
                    </div>
                  </div>
                </div>
                <p className="similar-card__desc">{plan.description}</p>
                <div className="similar-card__actions">
                  <button
                    className={added ? 'btn-view btn-view--active' : 'btn-view'}
                    onClick={() => onAddToComparison(plan)}
                    disabled={added}
                  >
                    {added ? '追加済み ✓' : '比較に追加'}
                  </button>
                  <button className="btn-change" onClick={onChangeConditions}>
                    条件を変更して探す
                  </button>
                </div>
                {added && (
                  <p className="similar-card__confirm">
                    「代替プランを比較」に追加しました。比較ページで確認できます。
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default SimilarPlanDrawer;
