import React from 'react';
import { Box, Typography } from '@mui/material';
import { LogoLoading } from './LogoLoading';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Carregando seu painel...' 
}) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        color: '#011b49',
        padding: 3,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 7,
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
            marginTop: 0,
            textAlign: 'center',
          }}
        >
          {message}
        </Typography>
      </Box>
    </Box>
  );
};

