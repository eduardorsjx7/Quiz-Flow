import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Alert,
  IconButton,
} from '@mui/material';
import {
  KeyboardArrowRight as ArrowRightIcon,
  ExitToApp as ExitIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import ParticipantLayout from '../../components/ParticipantLayout';
import { AnimatedBackground } from '../../components/AnimatedBackground';
import PodiumWithConfetti from '../../components/PodiumWithConfetti';
import { LoadingScreen } from '../../components/LoadingScreen';

const ParticipanteResultado: React.FC = () => {
  const { tentativaId } = useParams<{ tentativaId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const telaCheia = searchParams.get('fullscreen') !== 'false'; // Por padrão é tela cheia
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [mostrarBotaoSair, setMostrarBotaoSair] = useState(false);

  const carregarResultado = useCallback(async () => {
    try {
      setLoading(true);
      const tentativaRes = await api.get(`/tentativas/${tentativaId}`);
      const tentativa = tentativaRes.data.data || tentativaRes.data;

      const rankingRes = await api.get(`/tentativas/quiz/${tentativa.quizId}/ranking?limit=3`);
      const ranking = rankingRes?.data || [];

      // Buscar informações do quiz e fase
      const quizRes = await api.get(`/quizzes/${tentativa.quizId}`);
      const quiz = quizRes.data.data || quizRes.data;
      
      const faseRes = await api.get(`/fases/${quiz.faseId}`);
      const fase = faseRes.data.data || faseRes.data;

      setDados({
        tentativa,
        rankingTop3: ranking,
        nomeFase: fase.nome,
      });
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar resultado');
    } finally {
      setLoading(false);
    }
  }, [tentativaId]);

  useEffect(() => {
    carregarResultado();
  }, [carregarResultado]);

  // Auto-navegar para ranking board após 5 segundos (apenas em tela cheia)
  useEffect(() => {
    if (dados && !loading && !erro && telaCheia) {
      const timer = setTimeout(() => {
        navigate(`/participante/ranking/${tentativaId}`);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [dados, loading, erro, tentativaId, navigate, telaCheia]);

  // Mostrar botão de sair após a animação (5 segundos)
  useEffect(() => {
    if (dados && !loading && !erro && telaCheia) {
      const timer = setTimeout(() => {
        setMostrarBotaoSair(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [dados, loading, erro, telaCheia]);

  if (loading) {
    return (
      <LoadingScreen 
        messages={[
          'Corrigindo suas respostas',
          'Calculando sua pontuação',
          'Preparando a surpresa... 🎉'
        ]}
        messageInterval={1500}
      />
    );
  }

  if (erro) {
    return (
      <Box sx={{ minHeight: '100vh', position: 'relative', m: 0, p: 0 }}>
        <AnimatedBackground dark dimmed />
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', px: 2 }}>
          <Alert severity="error" sx={{ mb: 2, maxWidth: '600px' }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        </Box>
      </Box>
    );
  }

  if (!dados) {
    return null;
  }

  // Conteúdo do Podium com Confetes
  const PodiumContent = (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        p: 0,
        m: 0,
      }}
    >
      <PodiumWithConfetti
        rankingTop3={dados.rankingTop3}
        nomeFase={dados.nomeFase}
        showRedirectMessage={telaCheia}
        confettiDuration={5000}
        confettiIntensity="heavy"
      />
    </Box>
  );

  // Renderizar com ou sem tela cheia
  if (telaCheia) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          height: '100vh',
          width: '100vw',
          maxWidth: '100vw',
          position: 'relative',
          overflow: 'hidden',
          overflowX: 'hidden',
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          m: 0,
          p: 0,
        }}
      >
        <AnimatedBackground dark dimmed />
        
        {/* Botão de Sair no canto superior direito - Aparece após a animação */}
        {mostrarBotaoSair && (
          <IconButton
            onClick={() => navigate('/dashboard')}
            sx={{
              position: 'fixed',
              top: { xs: 80, sm: 90, md: 100 },
              right: 20,
              zIndex: 10002,
              bgcolor: '#fff',
              width: { xs: 48, md: 56 },
              height: { xs: 48, md: 56 },
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
              '&:hover': {
                bgcolor: '#fff',
                transform: 'scale(1.1)',
                boxShadow: '0 6px 30px rgba(0, 0, 0, 0.4)',
              },
              transition: 'all 0.3s ease',
              animation: 'fadeIn 0.5s ease-in',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'scale(0.8)' },
                '100%': { opacity: 1, transform: 'scale(1)' },
              },
            }}
          >
            <ExitIcon sx={{ color: '#E62816', fontSize: { xs: 28, md: 32 } }} />
          </IconButton>
        )}
        
        {PodiumContent}
      </Box>
    );
  }

  // Com layout normal (quando volta do Ranking Board)
  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <AnimatedBackground dark dimmed />
      
      {/* Botão de Sair alinhado com o título */}
      <IconButton
        onClick={() => navigate('/dashboard')}
        sx={{
          position: 'fixed',
          top: { xs: 'calc(64px + 80px)', sm: 'calc(64px + 90px)', md: 'calc(64px + 100px)' },
          right: { xs: 20, sm: 'calc(80px + 20px)' },
          zIndex: 10002,
          bgcolor: '#fff',
          width: { xs: 48, md: 56 },
          height: { xs: 48, md: 56 },
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            bgcolor: '#fff',
            transform: 'scale(1.1)',
            boxShadow: '0 6px 30px rgba(0, 0, 0, 0.4)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <ExitIcon sx={{ color: '#E62816', fontSize: { xs: 28, md: 32 } }} />
      </IconButton>
      
      {/* Seta Direita para ir ao Ranking Board */}
      <IconButton
        onClick={() => navigate(`/participante/ranking/${tentativaId}`)}
        sx={{
          position: 'fixed',
          right: { xs: 20, sm: 'calc(80px + 20px)' },
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          bgcolor: 'transparent',
          padding: 2,
          '&:hover': {
            bgcolor: 'transparent',
            transform: 'translateY(-50%) translateX(5px)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <ArrowRightIcon 
          sx={{ 
            color: '#fff', 
            fontSize: { xs: 48, md: 64 },
            filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))',
          }} 
        />
      </IconButton>

      <ParticipantLayout title={dados.nomeFase || 'Resultado'} noPadding={true}>
        {PodiumContent}
      </ParticipantLayout>
    </Box>
  );
};

export default ParticipanteResultado;
