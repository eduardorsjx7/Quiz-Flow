import React from 'react';
import { QuestionIconBox } from './QuestionIconBox';
import './question-icon-floating.css';

interface QuestionIconFloatingProps {
  color?: string;
  width?: number;
  top?: string;
  left?: string;
  duration?: number;
  delay?: number;
  rotate?: number;
}

export const QuestionIconFloating: React.FC<QuestionIconFloatingProps> = ({
  color = '#E62816',
  width = 110,
  top = '50%',
  left = '50%',
  duration = 14,
  delay = 0,
  rotate = -8
}) => {
  return (
    <div
      className="qif-item"
      style={{
        top,
        left,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`
      }}
    >
      <QuestionIconBox color={color} width={width} rotate={rotate} />
    </div>
  );
};

