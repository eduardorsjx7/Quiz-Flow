import React from 'react';
import './question-background.css';

type QuestionCard = {
  id: number;
  text: string;
  color: string;
  top: string;
  left: string;
  duration: number;
  delay: number;
};

const cards: QuestionCard[] = [
  {
    id: 1,
    text: 'Como está seu conhecimento hoje?',
    color: '#011b49',
    top: '10%',
    left: '8%',
    duration: 14,
    delay: 0
  },
  {
    id: 2,
    text: 'Onde você quer chegar em capacitação?',
    color: '#ff2c19',
    top: '20%',
    left: '65%',
    duration: 16,
    delay: 2
  },
  {
    id: 3,
    text: 'Suas habilidades estão atualizadas?',
    color: '#e62816',
    top: '35%',
    left: '20%',
    duration: 18,
    delay: 4
  },
  {
    id: 4,
    text: 'Você está preparado para novos desafios?',
    color: '#ff7a59',
    top: '60%',
    left: '10%',
    duration: 20,
    delay: 1
  },
  {
    id: 5,
    text: 'Quais são suas áreas de melhoria?',
    color: '#6c5ce7',
    top: '70%',
    left: '55%',
    duration: 19,
    delay: 3
  },
  {
    id: 6,
    text: 'Você tem visão clara do seu progresso?',
    color: '#fdcb6e',
    top: '45%',
    left: '75%',
    duration: 17,
    delay: 5
  },
  {
    id: 7,
    text: 'Está pronto para a próxima fase?',
    color: '#00b894',
    top: '80%',
    left: '30%',
    duration: 15,
    delay: 2.5
  },
  {
    id: 8,
    text: 'Como você avalia seu desempenho?',
    color: '#011b49',
    top: '15%',
    left: '50%',
    duration: 21,
    delay: 1.5
  }
];

export const QuestionBackground: React.FC = () => {
  return (
    <div className="qb-root">
      {cards.map(card => (
        <div
          key={card.id}
          className="qb-card"
          style={{
            top: card.top,
            left: card.left,
            animationDuration: `${card.duration}s`,
            animationDelay: `${card.delay}s`,
            backgroundColor: card.color
          }}
        >
          <span className="qb-card-text">{card.text}</span>
        </div>
      ))}
    </div>
  );
};

