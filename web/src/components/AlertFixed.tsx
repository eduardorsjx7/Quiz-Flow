import React from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

interface AlertFixedProps {
  severity: 'error' | 'warning' | 'info' | 'success';
  title?: string;
  message: string;
  onClose?: () => void;
}

const AlertFixed: React.FC<AlertFixedProps> = ({ severity, title, message, onClose }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: { xs: 80, sm: 90, md: 100 },
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 99998, // Abaixo apenas do Toast (99999)
        width: '90%',
        maxWidth: '600px',
        animation: 'slideDown 0.3s ease-out',
        '@keyframes slideDown': {
          '0%': {
            opacity: 0,
            transform: 'translateX(-50%) translateY(-20px)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateX(-50%) translateY(0)',
          },
        },
      }}
    >
      <Alert
        severity={severity}
        onClose={onClose}
        sx={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
          '& .MuiAlert-icon': {
            fontSize: 28,
          },
        }}
      >
        {title && <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>}
        {message}
      </Alert>
    </Box>
  );
};

export default AlertFixed;

