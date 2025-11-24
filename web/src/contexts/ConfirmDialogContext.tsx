import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConfirmDialog } from '../components/ConfirmDialog';

interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'delete' | 'warning' | 'info';
}

interface ConfirmDialogContextType {
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextType | undefined>(undefined);

export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    options: ConfirmDialogOptions | null;
    resolve: ((value: boolean) => void) | null;
    loading: boolean;
  }>({
    open: false,
    options: null,
    resolve: null,
    loading: false,
  });

  const confirm = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        options,
        resolve,
        loading: false,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialogState.resolve) {
      setDialogState((prev) => ({ ...prev, loading: true }));
      // Pequeno delay para feedback visual
      setTimeout(() => {
        if (dialogState.resolve) {
          dialogState.resolve(true);
        }
        setDialogState({
          open: false,
          options: null,
          resolve: null,
          loading: false,
        });
      }, 300);
    }
  }, [dialogState]);

  const handleCancel = useCallback(() => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState({
      open: false,
      options: null,
      resolve: null,
      loading: false,
    });
  }, [dialogState]);

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      {dialogState.options && (
        <ConfirmDialog
          open={dialogState.open}
          title={dialogState.options.title}
          message={dialogState.options.message}
          confirmText={dialogState.options.confirmText}
          cancelText={dialogState.options.cancelText}
          type={dialogState.options.type}
          loading={dialogState.loading}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmDialogContext.Provider>
  );
};

export const useConfirmDialog = (): ConfirmDialogContextType => {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog deve ser usado dentro de um ConfirmDialogProvider');
  }
  return context;
};

