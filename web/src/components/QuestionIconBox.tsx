import React from 'react';
import './question-icon-box.css';

interface QuestionIconBoxProps {
  color?: string;           // cor principal da caixa
  width?: number;           // largura em px
  rotate?: number;          // rotação em graus
  className?: string;
  style?: React.CSSProperties;
}

export const QuestionIconBox: React.FC<QuestionIconBoxProps> = ({
  color = '#E62816',
  width = 110,
  rotate = -8,
  className,
  style
}) => {
  // Calcular tamanho da fonte baseado na largura
  const fontSize = Math.max(width * 0.8, 48);

  return (
    <div
      className={`qib-wrapper ${className || ''}`}
      style={{
        width: fontSize,
        height: fontSize,
        transform: `rotate(${rotate}deg)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      {/* Apenas a interrogação sem balão */}
      <span 
        className="qib-question-mark"
        style={{
          fontSize: `${fontSize}px`,
          color: color,
          lineHeight: 1
        }}
      >
        ?
      </span>
    </div>
  );
};

