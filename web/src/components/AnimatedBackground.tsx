import React, { useMemo } from 'react';
import { QuestionIconFloating } from './QuestionIconFloating';
import './animated-background.css';

interface AnimatedBackgroundProps {
  dark?: boolean;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ dark = false }) => {
  // Gerar formas geométricas aleatórias (valores estáveis)
  const shapes = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 60 + 30,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: Math.random() * 10 + 15,
    delay: Math.random() * 5,
    color: ['#2196F3', '#E62816', '#4CAF50', '#FFC107'][i % 4],
    rotate: Math.random() * 360,
  })), []);

  // Gerar partículas pequenas (valores estáveis)
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 8 + 4,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: Math.random() * 8 + 10,
    delay: Math.random() * 5,
    color: ['#2196F3', '#E62816', '#4CAF50', '#FFC107', '#FF9800', '#9C27B0'][i % 6],
  })), []);

  // Configurações das interrogações com delays e durações aleatórias
  const questions = useMemo(() => [
    // Canto superior esquerdo
    { color: "#2196F3", width: 100, top: "5%", left: "5%", rotate: -15 },
    { color: "#E62816", width: 120, top: "12%", left: "8%", rotate: 10 },
    // Canto superior direito
    { color: "#4CAF50", width: 110, top: "5%", left: "95%", rotate: 15 },
    { color: "#FFC107", width: 130, top: "10%", left: "92%", rotate: -12 },
    // Canto inferior esquerdo
    { color: "#E62816", width: 115, top: "95%", left: "5%", rotate: -8 },
    { color: "#2196F3", width: 105, top: "88%", left: "8%", rotate: 12 },
    // Canto inferior direito
    { color: "#FFC107", width: 125, top: "95%", left: "95%", rotate: -10 },
    { color: "#4CAF50", width: 110, top: "90%", left: "92%", rotate: 8 },
    // Bordas
    { color: "#E62816", width: 140, top: "3%", left: "50%", rotate: -5 },
    { color: "#2196F3", width: 135, top: "97%", left: "50%", rotate: 7 },
    { color: "#4CAF50", width: 120, top: "50%", left: "2%", rotate: -12 },
    { color: "#FFC107", width: 115, top: "50%", left: "98%", rotate: 14 },
    // Meios
    { color: "#2196F3", width: 100, top: "20%", left: "15%", rotate: -6 },
    { color: "#E62816", width: 110, top: "25%", left: "85%", rotate: 9 },
    { color: "#4CAF50", width: 105, top: "75%", left: "12%", rotate: -11 },
    { color: "#FFC107", width: 125, top: "80%", left: "88%", rotate: 13 },
    // Centro da tela
    { color: "#2196F3", width: 95, top: "45%", left: "45%", rotate: -8 },
    { color: "#E62816", width: 110, top: "50%", left: "50%", rotate: 12 },
    { color: "#4CAF50", width: 100, top: "55%", left: "55%", rotate: -10 },
    { color: "#FFC107", width: 115, top: "48%", left: "52%", rotate: 8 },
    // Meio superior
    { color: "#2196F3", width: 90, top: "30%", left: "30%", rotate: -5 },
    { color: "#E62816", width: 105, top: "35%", left: "70%", rotate: 7 },
    { color: "#4CAF50", width: 100, top: "32%", left: "50%", rotate: -9 },
    // Meio inferior
    { color: "#FFC107", width: 95, top: "65%", left: "30%", rotate: 6 },
    { color: "#2196F3", width: 110, top: "70%", left: "70%", rotate: -7 },
    { color: "#E62816", width: 105, top: "68%", left: "50%", rotate: 10 },
    // Mais distribuição
    { color: "#4CAF50", width: 100, top: "40%", left: "25%", rotate: -4 },
    { color: "#FFC107", width: 115, top: "60%", left: "75%", rotate: 9 },
    { color: "#2196F3", width: 90, top: "42%", left: "75%", rotate: -6 },
    { color: "#E62816", width: 105, top: "58%", left: "25%", rotate: 8 },
  ].map((q, i) => ({
    ...q,
    delay: Math.random() * 3,
    duration: Math.random() * 1.5 + 5.5,
  })), []);

  return (
    <div className="animated-background">
      {/* Gradiente de fundo */}
      <div 
        className="bg-gradient" 
        style={{
          background: dark 
            ? 'linear-gradient(135deg, #011b49 0%, #0a2a5a 25%, #132f5e 50%, #1a3a6b 75%, #2d5a8f 100%)'
            : undefined,
        }}
      />
      
      {/* Formas geométricas flutuantes */}
      {shapes.map((shape) => (
        <div
          key={`shape-${shape.id}`}
          className="floating-shape"
          style={{
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            top: `${shape.top}%`,
            left: `${shape.left}%`,
            backgroundColor: shape.color,
            animationDuration: `${shape.duration}s`,
            animationDelay: `${shape.delay}s`,
            transform: `rotate(${shape.rotate}deg)`,
          }}
        />
      ))}

      {/* Partículas pequenas */}
      {particles.map((particle) => (
        <div
          key={`particle-${particle.id}`}
          className="floating-particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            top: `${particle.top}%`,
            left: `${particle.left}%`,
            backgroundColor: particle.color,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}

      {/* Interrogações com delays e durações aleatórias */}
      {questions.map((q, i) => (
        <QuestionIconFloating
          key={`question-${i}`}
          color={q.color}
          width={q.width}
          top={q.top}
          left={q.left}
          duration={q.duration}
          delay={q.delay}
          rotate={q.rotate}
        />
      ))}
    </div>
  );
};

