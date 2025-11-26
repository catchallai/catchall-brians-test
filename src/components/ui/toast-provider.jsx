import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const toastStyles = {
  success: { bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle, iconColor: 'text-emerald-500' },
  error: { bg: 'bg-red-50 border-red-200', icon: XCircle, iconColor: 'text-red-500' },
  warning: { bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500' },
  info: { bg: 'bg-blue-50 border-blue-200', icon: Info, iconColor: 'text-blue-500' }
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg) => addToast(msg, 'success'),
    error: (msg) => addToast(msg, 'error'),
    warning: (msg) => addToast(msg, 'warning'),
    info: (msg) => addToast(msg, 'info')
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map(t => {
          const style = toastStyles[t.type];
          const Icon = style.icon;
          return (
            <div 
              key={t.id} 
              className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${style.bg} animate-in slide-in-from-right`}
            >
              <Icon className={`w-5 h-5 ${style.iconColor}`} />
              <p className="text-sm text-gray-800">{t.message}</p>
              <button onClick={() => removeToast(t.id)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { success: () => {}, error: () => {}, warning: () => {}, info: () => {} };
  }
  return context;
}