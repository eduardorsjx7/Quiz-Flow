import React from 'react';
import { LoadingScreen } from './LoadingScreen';

/**
 * LoadingOverlay - Wrapper do LoadingScreen com variant='overlay'
 * Mantido para retrocompatibilidade
 * 
 * @example
 * // Mensagem fixa
 * <LoadingOverlay open={isLoading} message="Salvando..." />
 * 
 * @example
 * // Mensagens rotativas com callback ao finalizar
 * <LoadingOverlay 
 *   open={isProcessing}
 *   messages={['Processando', 'Validando', 'Concluindo']}
 *   messageInterval={1000}
 *   onComplete={() => setIsProcessing(false)}
 * />
 */
interface LoadingOverlayProps {
  /** Controla visibilidade do overlay */
  open: boolean;
  
  /** Mensagem fixa. Se fornecida, sobrescreve 'messages' */
  message?: string;
  
  /** Array de mensagens rotativas */
  messages?: string[];
  
  /** Intervalo de troca de mensagens em ms (padrão: 3500) */
  messageInterval?: number;
  
  /** Callback chamado após exibir todas as mensagens */
  onComplete?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  open,
  message,
  messages,
  messageInterval,
  onComplete
}) => {
  return (
    <LoadingScreen 
      variant="overlay"
      open={open}
      message={message}
      messages={messages}
      messageInterval={messageInterval}
      onComplete={onComplete}
    />
  );
};

