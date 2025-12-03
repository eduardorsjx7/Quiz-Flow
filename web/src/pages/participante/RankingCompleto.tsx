import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Timer as TimerIcon,
  KeyboardArrowLeft as ArrowLeftIcon,
  ExitToApp as ExitIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import ParticipantLayout from '../../components/ParticipantLayout';
import { AnimatedBackground } from '../../components/AnimatedBackground';
import TituloRankingFinal from '../../components/TituloRankingFinal';
import { useAuth } from '../../contexts/AuthContext';

const getPosicaoColor = (posicao: number) => {
  if (posicao === 1) return '#FFD700'; // Ouro
  if (posicao === 2) return '#C0C0C0'; // Prata
  if (posicao === 3) return '#CD7F32'; // Bronze
  return '#011b49';
};

const RankingCompleto: React.FC = () => {
  const { tentativaId } = useParams<{ tentativaId: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregarRanking = useCallback(async () => {
    try {
      setLoading(true);
      // Buscar tentativa
      const tentativaRes = await api.get(`/tentativas/${tentativaId}`);
      const tentativa = tentativaRes.data.data || tentativaRes.data;

      // Buscar ranking completo do quiz (sem limite)
      const rankingRes = await api.get(`/tentativas/quiz/${tentativa.quizId}/ranking?limit=100`);
      const ranking = rankingRes?.data || [];

      const usuarioRanking = ranking.find((r: any) => r.usuario.id === tentativa.usuarioId);

      setDados({
        tentativa,
        ranking,
        posicaoUsuario: usuarioRanking?.posicao || ranking.length + 1,
      });
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar ranking');
    } finally {
      setLoading(false);
    }
  }, [tentativaId]);

  useEffect(() => {
    carregarRanking();
  }, [carregarRanking]);

  if (loading) {
    return (
      <ParticipantLayout title="Ranking">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </ParticipantLayout>
    );
  }

  if (erro) {
    return (
      <ParticipantLayout title="Ranking">
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
          <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
            Voltar ao Dashboard
          </Button>
        </Container>
      </ParticipantLayout>
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
      }}
    >
      <AnimatedBackground dark dimmed />

      {/* Seta Esquerda - Com margem do menu lateral */}
      <IconButton
        onClick={() => navigate(`/participante/resultado/${tentativaId}?fullscreen=false`)}
        sx={{
          position: 'fixed',
          left: { xs: 20, sm: 'calc(80px + 20px)' },
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1000,
          bgcolor: 'transparent',
          padding: 2,
          '&:hover': {
            bgcolor: 'transparent',
            transform: 'translateY(-50%) translateX(-5px)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <ArrowLeftIcon 
          sx={{ 
            color: '#fff', 
            fontSize: { xs: 48, md: 64 },
            filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5))',
          }} 
        />
      </IconButton>

      {/* Botão de Sair alinhado com o título */}
      <IconButton
        onClick={() => navigate('/dashboard')}
        sx={{
          position: 'fixed',
          top: { xs: 'calc(64px + 32px)', sm: 'calc(64px + 32px)', md: 'calc(64px + 32px)' },
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

      <ParticipantLayout title="Ranking Geral" noPadding={true}>
        <Box
          sx={{
            maxWidth: '1200px',
            mx: 'auto',
            px: { xs: 2, sm: 3 },
            py: 4,
            position: 'relative',
            zIndex: 1,
          }}
        >

        {/* Título */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <TituloRankingFinal texto="Ranking Geral" />
        </Box>

        {/* Tabela de Ranking */}
        <Paper
          sx={{
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            overflow: 'hidden',
            mb: 4,
            border: '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#011b49' }}>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem', width: 100, py: 2 }}
                  >
                    Posição
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem', py: 2 }}>
                    Participante
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem', width: 140, py: 2 }}
                  >
                    Pontuação
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem', width: 140, py: 2 }}
                  >
                    Acertos
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 700, color: '#fff', fontSize: '0.875rem', width: 140, py: 2 }}
                  >
                    Tempo Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dados.ranking.map((item: any) => {
                  const isUsuarioAtual = item.usuario.id === usuario?.id;
                  const corPosicao = getPosicaoColor(item.posicao);

                  return (
                    <TableRow
                      key={item.usuario.id}
                      sx={{
                        bgcolor: isUsuarioAtual 
                          ? 'rgba(255, 193, 7, 0.12)' 
                          : item.posicao <= 3 
                          ? `${corPosicao}08`
                          : 'transparent',
                        '&:hover': {
                          bgcolor: isUsuarioAtual 
                            ? 'rgba(255, 193, 7, 0.18)' 
                            : item.posicao <= 3
                            ? `${corPosicao}15`
                            : 'rgba(0, 0, 0, 0.03)',
                        },
                        transition: 'all 0.2s ease',
                        borderLeft: isUsuarioAtual ? '4px solid #FFC107' : item.posicao <= 3 ? `4px solid ${corPosicao}` : 'none',
                      }}
                    >
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: `${corPosicao}20`,
                            border: `3px solid ${corPosicao}`,
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            color: corPosicao,
                          }}
                        >
                          {item.posicao}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 44,
                              height: 44,
                              bgcolor: `${corPosicao}20`,
                              border: `3px solid ${corPosicao}`,
                              fontSize: '1.1rem',
                              fontWeight: 700,
                              color: corPosicao,
                            }}
                          >
                            {item.usuario.nome.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: isUsuarioAtual ? 700 : 500,
                                color: '#011b49',
                                fontSize: '1rem',
                              }}
                            >
                              {item.usuario.nome}
                              {isUsuarioAtual && (
                                <Chip
                                  label="Você"
                                  size="small"
                                  sx={{
                                    ml: 1,
                                    height: 22,
                                    fontSize: '0.7rem',
                                    bgcolor: '#FFC107',
                                    color: '#fff',
                                    fontWeight: 700,
                                  }}
                                />
                              )}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography
                            variant="body1"
                            sx={{
                              fontWeight: 700,
                              color: '#011b49',
                              fontSize: '1.1rem',
                            }}
                          >
                            {item.pontuacaoTotal}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            pontos
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <CheckIcon sx={{ fontSize: 18, color: '#4CAF50' }} />
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 700,
                                color: '#4CAF50',
                                fontSize: '1rem',
                              }}
                            >
                              {item.acertos}/{item.totalPerguntas}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            {item.percentualAcertos}% de acerto
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <TimerIcon sx={{ fontSize: 18, color: '#FF9800' }} />
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 700,
                                color: '#FF9800',
                                fontSize: '1rem',
                              }}
                            >
                              {item.tempoTotal}s
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                            tempo total
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        </Box>
      </ParticipantLayout>
    </Box>
  );
};

export default RankingCompleto;

