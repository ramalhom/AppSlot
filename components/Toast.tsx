'use client';

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

const ICONS: Record<ToastItem['type'], string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
};

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`} role="alert">
          <span className="toast-icon">{ICONS[toast.type]}</span>
          <span className="toast-message">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0 0 0 0.5rem',
              fontSize: '0.9rem',
              fontFamily: 'inherit',
              flexShrink: 0,
            }}
            aria-label="Fermer la notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
