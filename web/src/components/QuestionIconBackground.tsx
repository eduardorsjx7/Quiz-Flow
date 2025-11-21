import React from 'react';
import { QuestionIconFloating } from './QuestionIconFloating';
import './question-icon-floating.css';

export const QuestionIconBackground: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        background: '#ffffff',
        zIndex: 0,
        pointerEvents: 'none'
      }}
    >
      <QuestionIconFloating
        color="#E62816"  // vermelho
        width={130}
        top="22%"
        left="12%"
        duration={18}
        delay={0}
        rotate={-8}
      />
      <QuestionIconFloating
        color="#011b49"  // azul escuro
        width={140}
        top="70%"
        left="80%"
        duration={20}
        delay={3}
        rotate={6}
      />
      <QuestionIconFloating
        color="#ff2c19"  // vermelho claro
        width={110}
        top="55%"
        left="30%"
        duration={17}
        delay={1}
        rotate={-4}
      />
      <QuestionIconFloating
        color="#ff7a59"  // laranja
        width={120}
        top="38%"
        left="60%"
        duration={22}
        delay={5}
        rotate={8}
      />
      <QuestionIconFloating
        color="#E62816"
        width={150}
        top="10%"
        left="75%"
        duration={19}
        delay={7}
        rotate={-10}
      />
      <QuestionIconFloating
        color="#011b49"
        width={100}
        top="85%"
        left="25%"
        duration={16}
        delay={2}
        rotate={5}
      />
      <QuestionIconFloating
        color="#ff2c19"
        width={125}
        top="45%"
        left="85%"
        duration={21}
        delay={4}
        rotate={-6}
      />
      <QuestionIconFloating
        color="#ff7a59"
        width={115}
        top="15%"
        left="45%"
        duration={15}
        delay={6}
        rotate={7}
      />
    </div>
  );
};

