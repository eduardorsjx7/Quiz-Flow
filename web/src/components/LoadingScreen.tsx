import React, { useState, useEffect } from 'react';
import { Box, Typography, Backdrop } from '@mui/material';
import { LogoLoading } from './LogoLoading';

/**
 * LoadingScreen - Componente de carregamento unificado
 * 
 * @example
 * // Mensagem fixa simples
 * <LoadingScreen message="Carregando dados..." />
 * 
 * @example
 * // Mensagens rotativas personalizadas com callback ao finalizar
 * <LoadingScreen 
 *   messages={['Salvando dados', 'Validando informações', 'Concluindo']}
 *   messageInterval={1000}
 *   onComplete={() => console.log('Todas as mensagens foram exibidas!')}
 * />
 * 
 * @example
 * // Overlay com mensagem personalizada
 * <LoadingScreen 
 *   variant="overlay"
 *   open={isLoading}
 *   message="Processando pagamento..."
 * />
 */
interface LoadingScreenProps {
  /** Mensagem fixa. Se fornecida, sobrescreve 'messages' e não rotaciona */
  message?: string;
  
  /** Array de mensagens rotativas. Usado apenas se 'message' não for fornecida */
  messages?: string[];
  
  /** Tipo de exibição: 'fullscreen' para tela cheia ou 'overlay' para sobrepor conteúdo */
  variant?: 'fullscreen' | 'overlay';
  
  /** Controla visibilidade (usado principalmente com variant='overlay') */
  open?: boolean;
  
  /** Intervalo em milissegundos para troca de mensagens rotativas (padrão: 3500ms) */
  messageInterval?: number;
  
  /** Callback chamado após exibir todas as mensagens rotativas (calculado automaticamente) */
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message,
  messages = ['Salvando', 'Processando', 'Aguarde'],
  variant = 'fullscreen',
  open = true,
  messageInterval = 3500, // Padrão 3.5 segundos
  onComplete,
}) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [dots, setDots] = useState('');

  // Animação de mensagens rotativas apenas quando não há mensagem fixa
  useEffect(() => {
    if (!open || message) {
      setCurrentMessageIndex(0);
      setDots('');
      return;
    }

    // Alternar entre mensagens com intervalo customizável
    const msgInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, messageInterval);

    // Animar os pontos a cada 800ms
    const dotsInterval = setInterval(() => {
      setDots((prev) => {
        if (prev === '') return '.';
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '';
      });
    }, 800);

    return () => {
      clearInterval(msgInterval);
      clearInterval(dotsInterval);
    };
  }, [open, messages.length, message, messageInterval]);

  // Timer para chamar onComplete após exibir todas as mensagens
  useEffect(() => {
    if (!open || message || !onComplete) {
      return;
    }

    // Calcular tempo total: número de mensagens * intervalo
    // Tempo total = tempo para exibir todas as mensagens uma vez
    const tempoTotal = messages.length * messageInterval;

    const completeTimer = setTimeout(() => {
      onComplete();
    }, tempoTotal);

    return () => {
      clearTimeout(completeTimer);
    };
  }, [open, messages.length, messageInterval, message, onComplete]);

  const displayMessage = message || messages[currentMessageIndex];
  const showDots = !message; // Só mostra pontos quando usando mensagens rotativas

  const content = (
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
          minHeight: '24px',
          transition: 'opacity 0.3s ease',
        }}
      >
        {displayMessage}{showDots ? dots : ''}
      </Typography>
    </Box>
  );

  if (variant === 'overlay') {
    if (!open) return null;
    
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
        {content}
      </Backdrop>
    );
  }

  // variant === 'fullscreen'
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
      {content}
    </Box>
  );
};

