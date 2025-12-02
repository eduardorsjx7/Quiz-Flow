import React from 'react';
import { Box, Typography } from '@mui/material';

interface TituloRankingFinalProps {
  texto?: string;
}

const TituloRankingFinal: React.FC<TituloRankingFinalProps> = ({ texto = 'Ranking Final' }) => {
  return (
    <Box
      sx={{
        textAlign: 'center',
        animation: 'titleEntrance 1s ease-out',
        '@keyframes titleEntrance': {
          '0%': {
            opacity: 0,
            transform: 'translateY(-30px) scale(0.9)',
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0) scale(1)',
          },
        },
      }}
    >
      {/* Brilho de Fundo */}
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '200px', sm: '300px', md: '400px' },
          height: { xs: '80px', sm: '100px', md: '120px' },
          background: 'radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%)',
          filter: 'blur(30px)',
          animation: 'glowPulse 3s ease-in-out infinite',
          '@keyframes glowPulse': {
            '0%, 100%': {
              opacity: 0.5,
              transform: 'translate(-50%, -50%) scale(1)',
            },
            '50%': {
              opacity: 0.8,
              transform: 'translate(-50%, -50%) scale(1.1)',
            },
          },
        }}
      />

      {/* Título Principal */}
      <Typography
        sx={{
          position: 'relative',
          fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem' },
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: '#fff',
          textShadow: `
            0 0 15px rgba(255, 215, 0, 0.3),
            0 0 30px rgba(255, 215, 0, 0.2),
            0 4px 20px rgba(0, 0, 0, 0.5)
          `,
          animation: 'textBreath 3s ease-in-out infinite',
          '@keyframes textBreath': {
            '0%, 100%': {
              transform: 'scale(1)',
              textShadow: `
                0 0 15px rgba(255, 215, 0, 0.3),
                0 0 30px rgba(255, 215, 0, 0.2),
                0 4px 20px rgba(0, 0, 0, 0.5)
              `,
            },
            '50%': {
              transform: 'scale(1.02)',
              textShadow: `
                0 0 20px rgba(255, 215, 0, 0.5),
                0 0 40px rgba(255, 215, 0, 0.3),
                0 6px 30px rgba(0, 0, 0, 0.6)
              `,
            },
          },
        }}
      >
        {texto}
      </Typography>

      {/* Linha Decorativa Inferior */}
      <Box
        sx={{
          position: 'relative',
          width: { xs: '280px', sm: '450px', md: '700px' },
          height: '5px',
          mx: 'auto',
          background: 'linear-gradient(90deg, transparent 0%, #FFD700 10%, #FFF 50%, #FFD700 90%, transparent 100%)',
          borderRadius: '3px',
          boxShadow: `
            0 0 15px rgba(255, 215, 0, 0.7),
            0 0 30px rgba(255, 215, 0, 0.5),
            0 4px 10px rgba(0, 0, 0, 0.3)
          `,
          animation: 'lineExpand 1s ease-out 0.5s both, linePulse 3s ease-in-out infinite 1.5s',
          '@keyframes lineExpand': {
            '0%': {
              width: '0px',
              opacity: 0,
            },
            '100%': {
              opacity: 1,
            },
          },
          '@keyframes linePulse': {
            '0%, 100%': {
              boxShadow: `
                0 0 15px rgba(255, 215, 0, 0.7),
                0 0 30px rgba(255, 215, 0, 0.5),
                0 4px 10px rgba(0, 0, 0, 0.3)
              `,
            },
            '50%': {
              boxShadow: `
                0 0 25px rgba(255, 215, 0, 1),
                0 0 50px rgba(255, 215, 0, 0.8),
                0 6px 20px rgba(0, 0, 0, 0.4)
              `,
            },
          },
        }}
      />

    </Box>
  );
};

export default TituloRankingFinal;

