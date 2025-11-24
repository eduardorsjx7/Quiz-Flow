import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastSeverity } from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, options?: ToastOptions) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
}

interface ToastOptions {
  title?: string;
  severity?: ToastSeverity;
  duration?: number;
}

interface ToastState extends ToastOptions {
  open: boolean;
  message: string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    open: false,
    message: '',
    severity: 'info',
    duration: 5000,
  });

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    setToast({
      open: true,
      message,
      title: options?.title,
      severity: options?.severity || 'info',
      duration: options?.duration || 5000,
    });
  }, []);

  const showSuccess = useCallback((message: string, title?: string) => {
    showToast(message, { severity: 'success', title });
  }, [showToast]);

  const showError = useCallback((message: string, title?: string) => {
    showToast(message, { severity: 'error', title });
  }, [showToast]);

  const showWarning = useCallback((message: string, title?: string) => {
    showToast(message, { severity: 'warning', title });
  }, [showToast]);

  const showInfo = useCallback((message: string, title?: string) => {
    showToast(message, { severity: 'info', title });
  }, [showToast]);

  const handleClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <Toast
        open={toast.open}
        message={toast.message}
        title={toast.title}
        severity={toast.severity}
        duration={toast.duration}
        onClose={handleClose}
      />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
};

