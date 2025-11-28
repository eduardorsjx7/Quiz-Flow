import React, { useState, useEffect } from 'react';
import { Box, Typography, Backdrop } from '@mui/material';
import { LogoLoading } from './LogoLoading';

interface LoadingOverlayProps {
  open: boolean;
  message?: string;
  messages?: string[];
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  open,
  message,
  messages = ['Salvando', 'Processando', 'Aguarde']
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!open) {
      setCurrentMessageIndex(0);
      setDots('');
      return;
    }

    // Alternar entre mensagens a cada 3.5 segundos (mais lento)
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3500);

    // Animar os pontos a cada 800ms (mais lento)
    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === '') return '.';
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '';
      });
    }, 800);

    return () => {
      clearInterval(messageInterval);
      clearInterval(dotsInterval);
    };
  }, [open, messages.length]);

  if (!open) return null;

  const displayMessage = message || messages[currentMessageIndex];

  return (
    <Backdrop
      open={open}
      sx={{
        position: 'fixed',
        zIndex: 9999,
        color: '#fff',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <LogoLoading size={120} />
        <Typography
          variant="body1"
          sx={{
            fontSize: '1rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            opacity: 0.8,
            fontWeight: 500,
            color: '#011b49',
            textAlign: 'center',
            minHeight: '24px',
            transition: 'opacity 0.3s ease',
          }}
        >
          {displayMessage}{dots}
        </Typography>
      </Box>
    </Backdrop>
  );
};

