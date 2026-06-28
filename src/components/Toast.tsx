interface ToastProps {
  message: string;
}

function Toast({ message }: ToastProps) {
  return (
    <div className="toast" role="status">
      <span>✅</span>
      <span>{message}</span>
    </div>
  );
}

export default Toast;
