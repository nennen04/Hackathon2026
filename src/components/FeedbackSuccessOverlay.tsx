interface FeedbackSuccessOverlayProps {
  open: boolean;
  message: string;
}

function FeedbackSuccessOverlay({ open, message }: FeedbackSuccessOverlayProps) {
  if (!open) return null;

  return (
    <>
      <div className="success-overlay-backdrop" />
      <div className="success-overlay-card" role="status">
        <div className="success-overlay-card__icon">✓</div>
        <p className="success-overlay-card__text">{message}</p>
      </div>
    </>
  );
}

export default FeedbackSuccessOverlay;
