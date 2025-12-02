import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { Box } from '@mui/material';

interface ConfettiOverlayProps {
  duration?: number; // Duração em milissegundos
  onConfettiEnd?: () => void;
  intensity?: 'light' | 'medium' | 'heavy';
}

const ConfettiOverlay: React.FC<ConfettiOverlayProps> = ({
  duration = 5000,
  onConfettiEnd,
  intensity = 'heavy',
}) => {
  const [isActive, setIsActive] = useState(true);
  const [numberOfPieces, setNumberOfPieces] = useState(200);
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Configurações de intensidade
  const intensityConfig = {
    light: { initial: 100, fadeOut: 20 },
    medium: { initial: 200, fadeOut: 50 },
    heavy: { initial: 400, fadeOut: 100 },
  };

  const config = intensityConfig[intensity];

  // Atualizar dimensões da janela
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Controlar animação de confetes
  useEffect(() => {
    // Iniciar com número total
    setNumberOfPieces(config.initial);

    // Após metade do tempo, começar a reduzir
    const fadeOutTimer = setTimeout(() => {
      setNumberOfPieces(config.fadeOut);
    }, duration / 2);

    // Após o tempo total, parar completamente
    const endTimer = setTimeout(() => {
      setIsActive(false);
      setNumberOfPieces(0);
      if (onConfettiEnd) {
        onConfettiEnd();
      }
    }, duration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(endTimer);
    };
  }, [duration, onConfettiEnd, config.initial, config.fadeOut]);

  if (!isActive && numberOfPieces === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <Confetti
        width={windowDimensions.width}
        height={windowDimensions.height}
        numberOfPieces={numberOfPieces}
        recycle={isActive}
        gravity={0.3}
        colors={[
          '#FFD700', // Ouro
          '#FFA500', // Laranja
          '#FF6B6B', // Vermelho
          '#4ECDC4', // Turquesa
          '#45B7D1', // Azul
          '#96CEB4', // Verde
          '#FFEAA7', // Amarelo claro
          '#DFE6E9', // Cinza claro
          '#74B9FF', // Azul claro
          '#A29BFE', // Roxo
        ]}
        tweenDuration={5000}
        wind={0}
        opacity={numberOfPieces > config.fadeOut ? 1 : 0.6}
      />
    </Box>
  );
};

export default ConfettiOverlay;

