import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const ToastContext = createContext(null);
let nextId = 1;

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

/**
 * Global toast notifications.
 * Usage: const toast = useToast(); toast.success('Saved'); toast.error(err.message);
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback((type, message, duration = 4000) => {
    const id = nextId++;
    setToasts((list) => [...list.slice(-3), { id, type, message }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const value = {
    success: useCallback((message, duration) => push('success', message, duration), [push]),
    error: useCallback((message, duration) => push('error', message, duration ?? 5000), [push]),
    info: useCallback((message, duration) => push('info', message, duration), [push]),
    dismiss,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map(({ id, type, message }) => {
          const Icon = ICONS[type] || Info;
          return (
            <div key={id} className={`toast toast-${type}`}>
              <Icon size={17} />
              <span>{message}</span>
              <button type="button" className="toast-close" onClick={() => dismiss(id)} aria-label="Dismiss notification">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
