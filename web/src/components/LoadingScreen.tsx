import React from 'react';
import { Box, Typography } from '@mui/material';
import { LogoLoading } from './LogoLoading';

export const LoadingScreen: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        color: '#011b49',
      }}
    >
      <LogoLoading size={140} />
      <Typography
        variant="body1"
        sx={{
          fontSize: '1rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          opacity: 0.7,
          fontWeight: 500,
          color: '#011b49',
        }}
      >
        Carregando seu painel...
      </Typography>
    </Box>
  );
};

