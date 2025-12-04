import React, { useState, useEffect } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import ConfettiOverlay from './ConfettiOverlay';
import TituloRankingFinal from './TituloRankingFinal';

// Interface para dados do usuário
interface Usuario {
  nome: string;
  [key: string]: any;
}

// Interface para dados do ranking
interface RankingItem {
  usuario: Usuario;
  pontuacaoTotal: number;
  [key: string]: any;
}

// Props do UserBadge
interface UserBadgeProps {
  usuario: Usuario;
  pontuacao: number;
  posicao: number;
  cor: string;
  corSombra: string;
}

// Componente UserBadge - Avatar + Nome + Pontuação
const UserBadge: React.FC<UserBadgeProps> = ({ usuario, pontuacao, posicao, cor, corSombra }) => {
  return (
    <>
      {/* Avatar com Auréola Animada */}
      <Box
        sx={{
          position: 'relative',
          mt: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 1, sm: 1.5, md: 2 },
          pt: { xs: 1, sm: 1.5, md: 2 },
          animation: posicao === 1 ? 'avatarPulse 2s ease-in-out infinite' : 'none',
          '@keyframes avatarPulse': {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
          },
        }}
      >
        {/* Auréola Externa Brilhante - Camada 1 */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: posicao === 1 ? 95 : 78, sm: posicao === 1 ? 130 : 105, md: posicao === 1 ? 180 : 145 },
            height: { xs: posicao === 1 ? 95 : 78, sm: posicao === 1 ? 130 : 105, md: posicao === 1 ? 180 : 145 },
            borderRadius: '50%',
            background: `radial-gradient(circle, ${corSombra} 0%, transparent 70%)`,
            opacity: 0.5,
            animation: 'aureaGlow1 3s ease-in-out infinite',
            '@keyframes aureaGlow1': {
              '0%, 100%': { opacity: 0.3, transform: 'translate(-50%, -50%) scale(1)' },
              '50%': { opacity: 0.7, transform: 'translate(-50%, -50%) scale(1.15)' },
            },
          }}
        />

        {/* Auréola Externa Brilhante - Camada 2 */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: posicao === 1 ? 85 : 70, sm: posicao === 1 ? 115 : 92, md: posicao === 1 ? 160 : 125 },
            height: { xs: posicao === 1 ? 85 : 70, sm: posicao === 1 ? 115 : 92, md: posicao === 1 ? 160 : 125 },
            borderRadius: '50%',
            background: `radial-gradient(circle, ${cor} 0%, transparent 65%)`,
            opacity: 0.4,
            animation: 'aureaGlow2 2.5s ease-in-out infinite 0.5s',
            '@keyframes aureaGlow2': {
              '0%, 100%': { opacity: 0.2, transform: 'translate(-50%, -50%) scale(0.95)' },
              '50%': { opacity: 0.6, transform: 'translate(-50%, -50%) scale(1.1)' },
            },
          }}
        />

        {/* Anel Rotativo de Brilho (apenas para 1º lugar) */}
        {posicao === 1 && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: { xs: 80, sm: 110, md: 155 },
              height: { xs: 80, sm: 110, md: 155 },
              borderRadius: '50%',
              border: `2px solid transparent`,
              borderTopColor: cor,
              borderRightColor: cor,
              opacity: 0.5,
              animation: 'ringRotate 3s linear infinite',
              transform: 'translate(-50%, -50%)',
              '@keyframes ringRotate': {
                '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
                '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
              },
            }}
          />
        )}
        
        {/* Avatar */}
        <Avatar
          sx={{
            position: 'relative',
            width: { xs: posicao === 1 ? 70 : 60, sm: posicao === 1 ? 100 : 80, md: posicao === 1 ? 140 : 110 },
            height: { xs: posicao === 1 ? 70 : 60, sm: posicao === 1 ? 100 : 80, md: posicao === 1 ? 140 : 110 },
            bgcolor: `rgba(${posicao === 1 ? '255, 215, 0' : posicao === 2 ? '192, 192, 192' : '205, 127, 50'}, 0.5)`,
            border: `${posicao === 1 ? 5 : 4}px solid ${cor}`,
            boxShadow: posicao === 1 
              ? `
                0 0 15px ${corSombra},
                0 0 30px ${corSombra},
                0 0 45px ${corSombra},
                0 0 60px ${corSombra},
                inset 0 0 25px rgba(255, 255, 255, 0.3),
                inset 0 -5px 15px rgba(0, 0, 0, 0.2)
              `
              : `
                0 0 15px ${corSombra},
                0 0 30px ${corSombra},
                inset 0 0 20px rgba(255, 255, 255, 0.25),
                inset 0 -5px 10px rgba(0, 0, 0, 0.15)
              `,
            fontSize: { xs: posicao === 1 ? '1.8rem' : '1.5rem', sm: posicao === 1 ? '2.5rem' : '2rem', md: posicao === 1 ? '3.5rem' : '2.8rem' },
            fontWeight: 700,
            color: cor,
            zIndex: 2,
            backdropFilter: 'blur(10px)',
            textShadow: posicao === 1 
              ? `0 2px 10px rgba(0, 0, 0, 0.5), 0 0 20px ${corSombra}`
              : `0 2px 8px rgba(0, 0, 0, 0.4)`,
            transition: 'all 0.3s ease',
          }}
        >
          {usuario.nome.charAt(0).toUpperCase()}
        </Avatar>
      </Box>

      {/* Nome */}
      <Typography
        variant={posicao === 1 ? 'h6' : 'body1'}
        sx={{
          color: '#fff',
          fontWeight: posicao === 1 ? 700 : 600,
          mb: { xs: 0.5, sm: 0.75, md: 1 },
          fontSize: { xs: posicao === 1 ? '0.85rem' : '0.75rem', sm: posicao === 1 ? '1.1rem' : '0.95rem', md: posicao === 1 ? '1.3rem' : '1.1rem' },
          textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)',
          zIndex: 2,
        }}
      >
        {usuario.nome}
      </Typography>

      {/* Pontuação */}
      <Typography
        variant={posicao === 1 ? 'h4' : 'h5'}
        sx={{
          color: cor,
          fontWeight: 900,
          fontSize: { xs: posicao === 1 ? '1.4rem' : '1.1rem', sm: posicao === 1 ? '2rem' : '1.5rem', md: posicao === 1 ? '2.8rem' : '2rem' },
          textShadow: `0 3px 15px ${corSombra}`,
          mb: { xs: 1, sm: 1.5, md: 2 },
          zIndex: 2,
        }}
      >
        {pontuacao}
      </Typography>
    </>
  );
};

// Props do PodiumColumn
interface PodiumColumnProps {
  posicao: number;
  cor: string;
  altura: number;
  usuario: Usuario;
  pontuacao: number;
  delay: number;
}

// Componente PodiumColumn - Coluna individual do pódio
const PodiumColumn: React.FC<PodiumColumnProps> = ({ 
  posicao, 
  cor, 
  altura, 
  usuario, 
  pontuacao, 
  delay 
}) => {
  const corMap: { [key: number]: { base: string; brilho: string; sombra: string } } = {
    1: { 
      base: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
      brilho: 'rgba(255, 215, 0, 0.4)',
      sombra: 'rgba(255, 215, 0, 0.6)'
    },
    2: { 
      base: 'linear-gradient(135deg, #E8E8E8 0%, #C0C0C0 50%, #E8E8E8 100%)',
      brilho: 'rgba(192, 192, 192, 0.4)',
      sombra: 'rgba(192, 192, 192, 0.6)'
    },
    3: { 
      base: 'linear-gradient(135deg, #E5A679 0%, #CD7F32 50%, #E5A679 100%)',
      brilho: 'rgba(205, 127, 50, 0.4)',
      sombra: 'rgba(205, 127, 50, 0.6)'
    }
  };

  const cores = corMap[posicao];
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: `slideUpPodium 0.8s ease-out ${delay}s both`,
        '@keyframes slideUpPodium': {
          '0%': { opacity: 0, transform: 'translateY(100px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        m: 0,
        p: 0,
        overflow: 'visible',
      }}
    >
      {/* Badge do Usuário */}
      <UserBadge 
        usuario={usuario}
        pontuacao={pontuacao}
        posicao={posicao}
        cor={cor}
        corSombra={cores.sombra}
      />

      {/* Cilindro */}
      <Box
        sx={{
          position: 'relative',
          width: { xs: 100, sm: 140, md: 220 },
          height: { xs: altura * 0.8, sm: altura, md: altura * 1.3 },
          background: cores.base,
          borderRadius: '15px 15px 0 0',
          boxShadow: `
            0 0 30px ${cores.sombra},
            inset 0 2px 20px rgba(255, 255, 255, 0.3),
            inset 0 -2px 20px rgba(0, 0, 0, 0.3)
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '20%',
            width: '60%',
            height: '40%',
            background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, transparent 100%)',
            borderRadius: '10px',
            filter: 'blur(10px)',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '30%',
            background: 'linear-gradient(0deg, rgba(0, 0, 0, 0.3) 0%, transparent 100%)',
          },
        }}
      >
        {/* Número da Posição */}
        <Typography
          variant="h1"
          sx={{
            fontSize: { xs: '3.5rem', sm: '5rem', md: '7.5rem' },
            fontWeight: 900,
            color: '#fff',
            textShadow: `
              0 5px 20px rgba(0, 0, 0, 0.5),
              0 0 30px ${cores.sombra}
            `,
            zIndex: 1,
            opacity: 0.95,
          }}
        >
          {posicao}
        </Typography>
      </Box>
    </Box>
  );
};

// Props do PodiumBase
interface PodiumBaseProps {
  rankingTop3: RankingItem[];
}

// Componente PodiumBase - Base do pódio com os 3 lugares
const PodiumBase: React.FC<PodiumBaseProps> = ({ rankingTop3 }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: { xs: 2, md: 5 },
        perspective: '1000px',
        m: 0,
        p: 0,
        pt: { xs: 3, sm: 4, md: 5 },
        width: '100%',
        maxWidth: '100vw',
        overflow: 'visible',
      }}
    >
      {/* 2º Lugar */}
      {rankingTop3[1] && (
        <PodiumColumn
          posicao={2}
          cor="#C0C0C0"
          altura={200}
          usuario={rankingTop3[1].usuario}
          pontuacao={rankingTop3[1].pontuacaoTotal}
          delay={0.6}
        />
      )}

      {/* 1º Lugar */}
      {rankingTop3[0] && (
        <PodiumColumn
          posicao={1}
          cor="#FFD700"
          altura={260}
          usuario={rankingTop3[0].usuario}
          pontuacao={rankingTop3[0].pontuacaoTotal}
          delay={0.2}
        />
      )}

      {/* 3º Lugar */}
      {rankingTop3[2] && (
        <PodiumColumn
          posicao={3}
          cor="#CD7F32"
          altura={160}
          usuario={rankingTop3[2].usuario}
          pontuacao={rankingTop3[2].pontuacaoTotal}
          delay={1.0}
        />
      )}
    </Box>
  );
};

// Props do PodiumWithConfetti
interface PodiumWithConfettiProps {
  rankingTop3: RankingItem[];
  nomeFase: string;
  showRedirectMessage?: boolean;
  confettiDuration?: number;
  confettiIntensity?: 'light' | 'medium' | 'heavy';
  onConfettiEnd?: () => void;
}

// Componente principal PodiumWithConfetti
const PodiumWithConfetti: React.FC<PodiumWithConfettiProps> = ({
  rankingTop3,
  nomeFase,
  showRedirectMessage = true,
  confettiDuration = 5000,
  confettiIntensity = 'heavy',
  onConfettiEnd,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  // Ativar confetes quando o componente for montado
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowConfetti(true);
    }, 400); // Pequeno delay para coordenar com a animação do pódio

    return () => clearTimeout(timer);
  }, []);

  // Callback quando confetes terminarem
  const handleConfettiEnd = () => {
    setShowConfetti(false);
    if (onConfettiEnd) {
      onConfettiEnd();
    }
  };

  return (
    <>
      {/* Confetes */}
      {showConfetti && (
        <ConfettiOverlay
          duration={confettiDuration}
          intensity={confettiIntensity}
          onConfettiEnd={handleConfettiEnd}
        />
      )}

      {/* Container Principal */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Título Fixo no Topo */}
        <Box
          sx={{
            position: 'fixed',
            top: { xs: 80, sm: 90, md: 100 },
            left: 0,
            right: 0,
            zIndex: 100,
            px: { xs: 1, sm: 2 },
          }}
        >
          {/* Título Ranking Final */}
          <TituloRankingFinal texto={nomeFase} />
        </Box>

      {/* Conteúdo do Pódio - Alinhado ao fundo */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1,
          p: 0,
          m: 0,
          width: '100%',
          maxWidth: '100vw',
          overflow: 'hidden',
        }}
      >
        {/* Pódio com Top 3 */}
        {rankingTop3 && rankingTop3.length > 0 && (
          <PodiumBase rankingTop3={rankingTop3} />
        )}
      </Box>
      </Box>
    </>
  );
};

export default PodiumWithConfetti;

