import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  KeyboardArrowRight as ArrowRightIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { AnimatedBackground } from '../../components/AnimatedBackground';

const ParticipanteResultado: React.FC = () => {
  const { tentativaId } = useParams<{ tentativaId: string }>();
  const navigate = useNavigate();
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregarResultado = useCallback(async () => {
    try {
      setLoading(true);
      const tentativaRes = await api.get(`/tentativas/${tentativaId}`);
      const tentativa = tentativaRes.data.data || tentativaRes.data;

      const rankingRes = await api.get(`/tentativas/quiz/${tentativa.quizId}/ranking?limit=3`);
      const ranking = rankingRes?.data || [];

      setDados({
        tentativa,
        rankingTop3: ranking,
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

  // Auto-navegar para ranking board após 5 segundos
  useEffect(() => {
    if (dados && !loading && !erro) {
      const timer = setTimeout(() => {
        navigate(`/participante/ranking/${tentativaId}`);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [dados, loading, erro, tentativaId, navigate]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <AnimatedBackground dark />
        <CircularProgress sx={{ position: 'relative', zIndex: 1, color: '#fff' }} />
      </Box>
    );
  }

  if (erro) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <AnimatedBackground dark />
        <Alert severity="error" sx={{ position: 'relative', zIndex: 1, maxWidth: 500 }}>{erro}</Alert>
      </Box>
    );
  }

  if (!dados) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AnimatedBackground dark />

      {/* Conteúdo Principal */}
      <Box 
        sx={{ 
          position: 'relative', 
          zIndex: 1, 
          textAlign: 'center', 
          px: 2,
          maxWidth: '1200px',
          mx: 'auto',
        }}
      >
        {/* Seta Direita - Alinhada com o conteúdo */}
        <IconButton
          onClick={() => navigate(`/participante/ranking/${tentativaId}`)}
          sx={{
            position: 'absolute',
            right: { xs: -60, md: -90 },
            top: '50%',
            transform: 'translateY(-50%)',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            width: { xs: 50, md: 70 },
            height: { xs: 50, md: 70 },
            animation: 'pulse 2s ease-in-out 2s infinite',
            '@keyframes pulse': {
              '0%, 100%': { transform: 'translateY(-50%) scale(1)' },
              '50%': { transform: 'translateY(-50%) scale(1.1)' },
            },
            '&:hover': {
              bgcolor: '#fff',
              transform: 'translateY(-50%) scale(1.15)',
            },
            transition: 'all 0.3s ease',
            boxShadow: '0 6px 25px rgba(0, 0, 0, 0.3)',
          }}
        >
          <ArrowRightIcon sx={{ color: '#011b49', fontSize: { xs: 32, md: 44 } }} />
        </IconButton>
        {/* Título */}
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            color: '#fff',
            mb: 8,
            textShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            fontSize: { xs: '2.5rem', md: '4rem' },
            animation: 'fadeIn 0.8s ease-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0, transform: 'translateY(-20px)' },
              '100%': { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          🏆 Top 3
        </Typography>

        {/* Pódio com Top 3 */}
        {dados.rankingTop3 && dados.rankingTop3.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-end',
              gap: { xs: 3, md: 6 },
            }}
          >
            {/* 2º Lugar */}
            {dados.rankingTop3[1] && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: 'slideUp 0.6s ease-out 0.8s both',
                  '@keyframes slideUp': {
                    '0%': { opacity: 0, transform: 'translateY(50px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                  },
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: '#C0C0C0',
                    fontWeight: 900,
                    mb: 2,
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  2
                </Typography>
                <Avatar
                  sx={{
                    width: { xs: 80, md: 100 },
                    height: { xs: 80, md: 100 },
                    bgcolor: 'rgba(192, 192, 192, 0.3)',
                    border: '4px solid #C0C0C0',
                    boxShadow: '0 6px 20px rgba(192, 192, 192, 0.5)',
                    mb: 2,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    fontWeight: 700,
                    color: '#C0C0C0',
                  }}
                >
                  {dados.rankingTop3[1].usuario.nome.charAt(0).toUpperCase()}
                </Avatar>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#fff',
                    fontWeight: 600,
                    mb: 1,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                  }}
                >
                  {dados.rankingTop3[1].usuario.nome}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#FFD700',
                    fontWeight: 800,
                    fontSize: { xs: '1.2rem', md: '1.5rem' },
                  }}
                >
                  {dados.rankingTop3[1].pontuacaoTotal}
                </Typography>
              </Box>
            )}

            {/* 1º Lugar */}
            {dados.rankingTop3[0] && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: 'slideUp 0.6s ease-out 0.4s both',
                }}
              >
                <TrophyIcon
                  sx={{
                    fontSize: { xs: 50, md: 70 },
                    color: '#FFD700',
                    mb: 2,
                    filter: 'drop-shadow(0 4px 12px rgba(255, 215, 0, 0.7))',
                    animation: 'float 3s ease-in-out infinite',
                    '@keyframes float': {
                      '0%, 100%': { transform: 'translateY(0px)' },
                      '50%': { transform: 'translateY(-10px)' },
                    },
                  }}
                />
                <Typography
                  variant="h3"
                  sx={{
                    color: '#FFD700',
                    fontWeight: 900,
                    mb: 2,
                    textShadow: '0 3px 12px rgba(255, 215, 0, 0.7)',
                    fontSize: { xs: '2.5rem', md: '3rem' },
                  }}
                >
                  1
                </Typography>
                <Avatar
                  sx={{
                    width: { xs: 100, md: 130 },
                    height: { xs: 100, md: 130 },
                    bgcolor: 'rgba(255, 215, 0, 0.3)',
                    border: '5px solid #FFD700',
                    boxShadow: '0 8px 30px rgba(255, 215, 0, 0.7)',
                    mb: 2,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    fontWeight: 700,
                    color: '#FFD700',
                  }}
                >
                  {dados.rankingTop3[0].usuario.nome.charAt(0).toUpperCase()}
                </Avatar>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    mb: 1,
                    fontSize: { xs: '1rem', md: '1.2rem' },
                  }}
                >
                  {dados.rankingTop3[0].usuario.nome}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: '#FFD700',
                    fontWeight: 900,
                    fontSize: { xs: '1.8rem', md: '2.5rem' },
                  }}
                >
                  {dados.rankingTop3[0].pontuacaoTotal}
                </Typography>
              </Box>
            )}

            {/* 3º Lugar */}
            {dados.rankingTop3[2] && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  animation: 'slideUp 0.6s ease-out 1.2s both',
                }}
              >
                <Typography
                  variant="h4"
                  sx={{
                    color: '#CD7F32',
                    fontWeight: 900,
                    mb: 2,
                    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  }}
                >
                  3
                </Typography>
                <Avatar
                  sx={{
                    width: { xs: 80, md: 100 },
                    height: { xs: 80, md: 100 },
                    bgcolor: 'rgba(205, 127, 50, 0.3)',
                    border: '4px solid #CD7F32',
                    boxShadow: '0 6px 20px rgba(205, 127, 50, 0.5)',
                    mb: 2,
                    fontSize: { xs: '2rem', md: '2.5rem' },
                    fontWeight: 700,
                    color: '#CD7F32',
                  }}
                >
                  {dados.rankingTop3[2].usuario.nome.charAt(0).toUpperCase()}
                </Avatar>
                <Typography
                  variant="body1"
                  sx={{
                    color: '#fff',
                    fontWeight: 600,
                    mb: 1,
                    fontSize: { xs: '0.9rem', md: '1rem' },
                  }}
                >
                  {dados.rankingTop3[2].usuario.nome}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#FFD700',
                    fontWeight: 800,
                    fontSize: { xs: '1.2rem', md: '1.5rem' },
                  }}
                >
                  {dados.rankingTop3[2].pontuacaoTotal}
                </Typography>
              </Box>
            )}
          </Box>
        )}

        {/* Texto de redirecionamento */}
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255, 255, 255, 0.6)',
            mt: 6,
            fontSize: '0.9rem',
            animation: 'fadeIn 1s ease-out 2s both',
            '@keyframes fadeIn': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 },
            },
          }}
        >
          Próxima tela em 5 segundos...
        </Typography>
      </Box>
    </Box>
  );
};

export default ParticipanteResultado;
