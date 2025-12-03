import React, { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  IconButton,
  LinearProgress,
  Box,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  open: boolean;
  message: string;
  title?: string;
  severity?: ToastSeverity;
  duration?: number; // em milissegundos
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  open,
  message,
  title,
  severity = 'info',
  duration = 5000,
  onClose,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!open) {
      setProgress(100);
      return;
    }

    // Resetar progresso quando abrir
    setProgress(100);

    // Calcular intervalo para atualizar a barra de progresso
    const interval = 50; // atualizar a cada 50ms
    const decrement = (100 / duration) * interval;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          clearInterval(progressInterval);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    // Fechar automaticamente após a duração
    const timeout = setTimeout(() => {
      onClose();
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timeout);
    };
  }, [open, duration, onClose]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose();
  };

  return (
    <Snackbar
      open={open}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      sx={{
        top: '24px !important',
        right: '24px !important',
        left: 'auto !important',
        transform: 'none !important',
        zIndex: 99999, // Sempre na frente de tudo
      }}
    >
      <Alert
        severity={severity}
        onClose={handleClose}
        sx={{
          minWidth: 320,
          maxWidth: 500,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          '& .MuiAlert-icon': {
            fontSize: 28,
          },
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
        action={
          <IconButton
            aria-label="fechar"
            color="inherit"
            size="small"
            onClick={handleClose}
            sx={{
              color: 'inherit',
              opacity: 0.7,
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {title && (
          <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </AlertTitle>
        )}
        <Box sx={{ pr: 4 }}>
          {message}
        </Box>
        {/* Barra de progresso */}
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            borderRadius: '0 0 4px 4px',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: severity === 'success' ? '#4caf50' :
                              severity === 'error' ? '#f44336' :
                              severity === 'warning' ? '#ff9800' : '#2196f3',
              transition: 'transform 0.05s linear',
            },
          }}
        />
      </Alert>
    </Snackbar>
  );
};

