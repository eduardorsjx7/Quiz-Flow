import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  IconButton,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import ParticipantLayout from '../../components/ParticipantLayout';
import { useAuth } from '../../contexts/AuthContext';
import { construirUrlFotoPerfil } from '../../utils/fotoPerfil';

const getPosicaoColor = (posicao: number) => {
  if (posicao === 1) return '#FFD700'; // Ouro
  if (posicao === 2) return '#C0C0C0'; // Prata
  if (posicao === 3) return '#CD7F32'; // Bronze
  return '#011b49';
};

const getMedalEmoji = (posicao: number) => {
  if (posicao === 1) return '🥇';
  if (posicao === 2) return '🥈';
  if (posicao === 3) return '🥉';
  return '';
};

const RankingQuiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [ranking, setRanking] = useState<any[]>([]);
  const [quizTitulo, setQuizTitulo] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregarRanking = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar informações do quiz
      const quizRes = await api.get(`/quizzes/${quizId}`);
      const quiz = quizRes.data.data || quizRes.data;
      setQuizTitulo(quiz.titulo);

      // Buscar ranking completo
      const rankingRes = await api.get(`/tentativas/quiz/${quizId}/ranking?limit=100`);
      const rankingData = rankingRes?.data || [];
      setRanking(rankingData);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar ranking');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

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
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
          <IconButton onClick={() => navigate(-1)} sx={{ mt: 2 }}>
            <ArrowBackIcon />
          </IconButton>
        </Container>
      </ParticipantLayout>
    );
  }

  const maiorPontuacao = ranking[0]?.pontuacaoTotal || 0;

  return (
    <ParticipantLayout title="Ranking do Quiz">
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Box sx={{ position: 'relative', mb: 3 }}>
          <IconButton
            onClick={() => navigate(-1)}
            size="small"
            sx={{
              position: 'absolute',
              left: -56,
              top: '50%',
              transform: 'translateY(-50%)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
            title="Voltar"
          >
            <ArrowBackIcon />
          </IconButton>
          <Breadcrumbs
            sx={{
              '& .MuiBreadcrumbs-separator': {
                mx: 1.5,
                color: 'text.disabled',
              },
            }}
          >
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'text.secondary',
                transition: 'all 0.2s ease',
                borderRadius: 1,
                p: 0.5,
                '&:hover': {
                  color: 'primary.main',
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
              title="Dashboard"
            >
              <HomeIcon sx={{ fontSize: 20 }} />
            </Link>
            <Typography
              color="text.primary"
              sx={{
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
            >
              Ranking
            </Typography>
          </Breadcrumbs>
        </Box>

        {/* Título */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              fontSize: '2rem',
              background: 'linear-gradient(135deg, #011b49 0%, #1a3a6b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 0.5,
              letterSpacing: '-0.02em',
            }}
          >
            📊 Ranking Completo
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'text.secondary',
              fontSize: '0.95rem',
            }}
          >
            {quizTitulo}
          </Typography>
        </Box>

        {/* Tabela de Ranking */}
        <Paper
          sx={{
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
          }}
        >
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#011b49', bgcolor: '#f5f5f5' }}
                  >
                    Posição
                  </TableCell>
                  <TableCell
                    sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#011b49', bgcolor: '#f5f5f5' }}
                  >
                    Participante
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#011b49', bgcolor: '#f5f5f5' }}
                  >
                    Pontuação
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#011b49', bgcolor: '#f5f5f5' }}
                  >
                    Acertos
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#011b49', bgcolor: '#f5f5f5' }}
                  >
                    Tempo Total
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ranking.map((item: any) => {
                  const isUsuarioAtual = item.usuario.id === usuario?.id;
                  const corPosicao = getPosicaoColor(item.posicao);

                  return (
                    <TableRow
                      key={item.usuario.id}
                      sx={{
                        bgcolor: isUsuarioAtual ? 'rgba(255, 193, 7, 0.1)' : 'transparent',
                        '&:hover': {
                          bgcolor: isUsuarioAtual
                            ? 'rgba(255, 193, 7, 0.15)'
                            : 'rgba(0, 0, 0, 0.02)',
                        },
                        transition: 'background-color 0.2s ease',
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
                            border: `2px solid ${corPosicao}`,
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: corPosicao,
                          }}
                        >
                          {getMedalEmoji(item.posicao) || item.posicao}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={construirUrlFotoPerfil((item.usuario as any).fotoPerfil) || undefined}
                            sx={{
                              width: 40,
                              height: 40,
                              bgcolor: `${corPosicao}20`,
                              border: `2px solid ${corPosicao}`,
                              fontSize: '1rem',
                              fontWeight: 700,
                              color: corPosicao,
                            }}
                          >
                            {!((item.usuario as any).fotoPerfil) && ((item.usuario as any).nomeExibicao || item.usuario.nome).charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: isUsuarioAtual ? 700 : 500,
                                color: '#011b49',
                              }}
                            >
                              {(item.usuario as any).nomeExibicao || item.usuario.nome}
                              {isUsuarioAtual && (
                                <Chip
                                  label="Você"
                                  size="small"
                                  sx={{
                                    ml: 1,
                                    height: 20,
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
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            pontos
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            {item.percentualAcertos}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </ParticipantLayout>
  );
};

export default RankingQuiz;

