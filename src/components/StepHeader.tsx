interface StepHeaderProps {
  stepNumber: number;
  totalSteps: number;
  title: string;
  stepLabel: string;
  onBack?: () => void;
  rightAction?: 'help' | 'menu' | 'none';
  onRightActionClick?: () => void;
}

function StepHeader({
  stepNumber,
  totalSteps,
  title,
  stepLabel,
  onBack,
  rightAction = 'none',
  onRightActionClick,
}: StepHeaderProps) {
  return (
    <div className="step-header">
      <div className="step-header__top">
        {onBack ? (
          <button className="step-header__back" onClick={onBack} aria-label="戻る">
            ←
          </button>
        ) : (
          <span className="step-header__back step-header__back--placeholder" />
        )}
        <h1 className="step-header__title">{title}</h1>
        {rightAction === 'menu' && (
          <button
            className="step-header__action"
            onClick={onRightActionClick}
            aria-label="メニューを開く"
          >
            ☰
          </button>
        )}
        {rightAction === 'help' && (
          <button
            className="step-header__action"
            onClick={onRightActionClick}
            aria-label="ヘルプ"
          >
            ?
          </button>
        )}
        {rightAction === 'none' && <span className="step-header__action" style={{ visibility: 'hidden' }} />}
      </div>
      <div className="step-header__progress">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const n = index + 1;
          const cls =
            n < stepNumber
              ? 'step-header__dot step-header__dot--done'
              : n === stepNumber
                ? 'step-header__dot step-header__dot--current'
                : 'step-header__dot';
          return <span key={n} className={cls} />;
        })}
      </div>
      <p className="step-header__label">
        ステップ {stepNumber} / {totalSteps} ・ {stepLabel}
      </p>
    </div>
  );
}

export default StepHeader;
