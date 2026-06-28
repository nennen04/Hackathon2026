interface LoadingScreenProps {
  title: string;
  description: string;
  progress: number;
  message: string;
}

function LoadingScreen({ title, description, progress, message }: LoadingScreenProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="loading-screen">
      <div className="loading-screen__spinner" />
      <h2 className="loading-screen__title">{title}</h2>
      <p className="loading-screen__desc">{description}</p>

      <div className="loading-screen__progress-bar">
        <div className="loading-screen__progress-fill" style={{ width: `${clamped}%` }} />
      </div>
      <div className="loading-screen__progress-meta">
        <span className="loading-screen__progress-percent">{clamped}%</span>
        <span className="loading-screen__progress-message">{message}</span>
      </div>
    </div>
  );
}

export default LoadingScreen;
