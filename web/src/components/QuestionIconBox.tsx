import React from 'react';
import './question-icon-box.css';

// Função para escurecer a cor
const getDarkerColor = (color: string): string => {
  // Se for uma cor hexadecimal
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Escurecer em 30%
    const darkerR = Math.max(0, Math.floor(r * 0.7));
    const darkerG = Math.max(0, Math.floor(g * 0.7));
    const darkerB = Math.max(0, Math.floor(b * 0.7));
    
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
  }
  // Fallback para cores nomeadas
  return '#b01313';
};

interface QuestionIconBoxProps {
  color?: string;           // cor principal da caixa
  width?: number;           // largura em px
  rotate?: number;          // rotação em graus
  className?: string;
  style?: React.CSSProperties;
}

export const QuestionIconBox: React.FC<QuestionIconBoxProps> = ({
  color = '#E62816',        // tom vermelho da logo
  width = 110,
  rotate = -8,
  className,
  style
}) => {
  const height = width * 0.68; // proporção similar à da logo

  // Calcular tamanho da fonte baseado na largura
  const fontSize = Math.max(width * 0.35, 24);

  return (
    <div
      className={`qib-wrapper ${className || ''}`}
      style={{
        width,
        height,
        transform: `rotate(${rotate}deg)`,
        ...style
      }}
    >
      <div
        className="qib-box"
        style={{
          background: `linear-gradient(135deg, ${color}, ${getDarkerColor(color)})`
        }}
      >
        <span 
          className="qib-question-mark"
          style={{
            fontSize: `${fontSize}px`
          }}
        >
          ?
        </span>
      </div>
    </div>
  );
};

