import React from 'react';
import { Box } from '@mui/material';

type LogoLoadingProps = {
  size?: number;
  className?: string;
};

export const LogoLoading: React.FC<LogoLoadingProps> = ({ size = 140, className }) => {
  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
      }}
    >
      {/* Anel girando atrás da logo */}
      <Box
        sx={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: '50%',
          border: '3px solid rgba(255, 44, 25, 0.15)',
          borderTopColor: '#ff2c19',
          animation: 'logo-spin 1.2s linear infinite',
          '@keyframes logo-spin': {
            '0%': {
              transform: 'rotate(0deg)',
            },
            '100%': {
              transform: 'rotate(360deg)',
            },
          },
        }}
      />
      {/* Logo com efeito de pulsar */}
      <Box
        component="img"
        src="/logo/logo1.svg"
        alt="Logo"
        sx={{
          position: 'relative',
          width: size * 0.7,
          height: size * 0.7,
          objectFit: 'contain',
          animation: 'logo-pulse 1.6s ease-in-out infinite',
          '@keyframes logo-pulse': {
            '0%': {
              transform: 'scale(0.97)',
              opacity: 0.85,
            },
            '50%': {
              transform: 'scale(1)',
              opacity: 1,
            },
            '100%': {
              transform: 'scale(0.97)',
              opacity: 0.85,
            },
          },
        }}
      />
    </Box>
  );
};

