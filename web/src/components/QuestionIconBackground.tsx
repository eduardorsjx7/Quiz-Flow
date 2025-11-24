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
      {/* Canto superior esquerdo */}
      <QuestionIconFloating
        color="#2196F3"  // azul
        width={100}
        top="5%"
        left="5%"
        duration={20}
        delay={0}
        rotate={-15}
      />
      <QuestionIconFloating
        color="#E62816"  // vermelho
        width={120}
        top="12%"
        left="8%"
        duration={18}
        delay={2}
        rotate={10}
      />
      
      {/* Canto superior direito */}
      <QuestionIconFloating
        color="#4CAF50"  // verde
        width={110}
        top="5%"
        left="95%"
        duration={22}
        delay={1}
        rotate={15}
      />
      <QuestionIconFloating
        color="#FFC107"  // amarelo
        width={130}
        top="10%"
        left="92%"
        duration={19}
        delay={3}
        rotate={-12}
      />
      
      {/* Canto inferior esquerdo */}
      <QuestionIconFloating
        color="#E62816"  // vermelho
        width={115}
        top="95%"
        left="5%"
        duration={21}
        delay={0.5}
        rotate={-8}
      />
      <QuestionIconFloating
        color="#2196F3"  // azul
        width={105}
        top="88%"
        left="8%"
        duration={17}
        delay={2.5}
        rotate={12}
      />
      
      {/* Canto inferior direito */}
      <QuestionIconFloating
        color="#FFC107"  // amarelo
        width={125}
        top="95%"
        left="95%"
        duration={20}
        delay={1.5}
        rotate={-10}
      />
      <QuestionIconFloating
        color="#4CAF50"  // verde
        width={110}
        top="90%"
        left="92%"
        duration={18}
        delay={3.5}
        rotate={8}
      />
      
      {/* Borda superior central */}
      <QuestionIconFloating
        color="#E62816"  // vermelho
        width={140}
        top="3%"
        left="50%"
        duration={23}
        delay={0.8}
        rotate={-5}
      />
      
      {/* Borda inferior central */}
      <QuestionIconFloating
        color="#2196F3"  // azul
        width={135}
        top="97%"
        left="50%"
        duration={19}
        delay={2.2}
        rotate={7}
      />
      
      {/* Borda esquerda central */}
      <QuestionIconFloating
        color="#4CAF50"  // verde
        width={120}
        top="50%"
        left="2%"
        duration={21}
        delay={1.2}
        rotate={-12}
      />
      
      {/* Borda direita central */}
      <QuestionIconFloating
        color="#FFC107"  // amarelo
        width={115}
        top="50%"
        left="98%"
        duration={22}
        delay={2.8}
        rotate={14}
      />
      
      {/* Meio superior esquerdo */}
      <QuestionIconFloating
        color="#2196F3"  // azul
        width={100}
        top="20%"
        left="15%"
        duration={18}
        delay={1.8}
        rotate={-6}
      />
      
      {/* Meio superior direito */}
      <QuestionIconFloating
        color="#E62816"  // vermelho
        width={110}
        top="25%"
        left="85%"
        duration={20}
        delay={3.2}
        rotate={9}
      />
      
      {/* Meio inferior esquerdo */}
      <QuestionIconFloating
        color="#4CAF50"  // verde
        width={105}
        top="75%"
        left="12%"
        duration={19}
        delay={0.3}
        rotate={-11}
      />
      
      {/* Meio inferior direito */}
      <QuestionIconFloating
        color="#FFC107"  // amarelo
        width={125}
        top="80%"
        left="88%"
        duration={17}
        delay={2.7}
        rotate={13}
      />
    </div>
  );
};

