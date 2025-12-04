import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { PieChart, Pie, Cell, BarChart, Bar, YAxis, ResponsiveContainer } from 'recharts';
import {
  Container,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Route as RouteIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  LockOpen as LockOpenIcon,
  EmojiEvents as TrophyIcon,
  Timer as TimerIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import ParticipantLayout from '../../components/ParticipantLayout';
import AlertFixed from '../../components/AlertFixed';
import { LoadingScreen } from '../../components/LoadingScreen';

interface Jornada {
  id: number;
  titulo: string;
  imagemCapa?: string;
  ativo?: boolean;
  createdAt?: string;
  faseAtual?: {
    id: number;
    titulo: string;
  } | null;
  todasFasesAbertas?: boolean;
  _count: {
    fases: number;
  };
}

interface EstatisticasUsuario {
  pontuacaoTotal: number;
  tempoMedio: number;
  taxaAcertos: number;
  taxaErros: number;
  totalQuizzes: number;
  quizzesConcluidos: number;
  totalPerguntas: number;
  totalAcertos: number;
  totalErros: number;
}

const DashboardColaborador: React.FC = () => {
  const navigate = useNavigate();
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEstatisticas, setLoadingEstatisticas] = useState(true);
  const [erro, setErro] = useState('');
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [estatisticas, setEstatisticas] = useState<EstatisticasUsuario | null>(null);

  useEffect(() => {
    carregarJornadas();
    carregarEstatisticas();
  }, []);

  const carregarJornadas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jornadas');
      const dados = response.data.data || response.data;
      const jornadasArray = Array.isArray(dados) ? dados : [];
      
      // Remover duplicatas baseado no ID
      const jornadasUnicas = jornadasArray.filter((jornada: Jornada, index: number, self: Jornada[]) =>
        index === self.findIndex((j: Jornada) => j.id === jornada.id)
      );
      
      // Ordenar por data de criação (mais recentes primeiro)
      const jornadasOrdenadas = jornadasUnicas.sort((a: Jornada, b: Jornada) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Se não tiver data, ordenar por ID (mais recente = maior ID)
        return b.id - a.id;
      });
      
      setJornadas(jornadasOrdenadas);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar jornadas');
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    try {
      setLoadingEstatisticas(true);
      const response = await api.get('/tentativas/usuario/minhas');
      const tentativas = response.data.data || response.data || [];
      
      const tentativasConcluidas = tentativas.filter((t: any) => 
        t.status === 'CONCLUIDA' || t.status === 'FINALIZADA'
      );

      // Calcular estatísticas
      const pontuacaoTotal = tentativasConcluidas.reduce(
        (sum: number, t: any) => sum + (t.pontuacaoTotal || 0), 
        0
      );

      const todasRespostas = tentativasConcluidas.flatMap((t: any) => t.respostas || []);
      const totalPerguntas = todasRespostas.length;
      const totalAcertos = todasRespostas.filter((r: any) => r.acertou).length;
      const totalErros = totalPerguntas - totalAcertos;
      
      const temposResposta = todasRespostas
        .map((r: any) => r.tempoResposta || 0)
        .filter((t: number) => t > 0);
      const tempoMedio = temposResposta.length > 0
        ? Math.round(temposResposta.reduce((sum: number, t: number) => sum + t, 0) / temposResposta.length)
        : 0;

      const taxaAcertos = totalPerguntas > 0 
        ? Math.round((totalAcertos / totalPerguntas) * 100) 
        : 0;
      const taxaErros = totalPerguntas > 0 
        ? Math.round((totalErros / totalPerguntas) * 100) 
        : 0;

      setEstatisticas({
        pontuacaoTotal,
        tempoMedio,
        taxaAcertos,
        taxaErros,
        totalQuizzes: tentativas.length,
        quizzesConcluidos: tentativasConcluidas.length,
        totalPerguntas,
        totalAcertos,
        totalErros,
      });
    } catch (error: any) {
      console.error('Erro ao carregar estatísticas:', error);
      // Não mostrar erro para estatísticas, apenas deixar vazio
    } finally {
      setLoadingEstatisticas(false);
    }
  };

  const jornadasFiltradas = useMemo(() => {
    if (!termoPesquisa.trim()) {
      return jornadas;
    }
    const termo = termoPesquisa.toLowerCase();
    return jornadas.filter((jornada) =>
      jornada.titulo.toLowerCase().includes(termo)
    );
  }, [jornadas, termoPesquisa]);

  const handleAbrirJornada = (jornadaId: number) => {
    navigate(`/participante/jornadas/${jornadaId}/fases`);
  };

  if (loading) {
    return <LoadingScreen message="Carregando seu dashboard..." />;
  }

  return (
    <ParticipantLayout title="Dashboard">
      <Container maxWidth="lg" sx={{ overflow: 'visible' }}>
        {/* Banner de boas-vindas */}
        <Box
          sx={{
            position: 'relative',
            p: { xs: 2.5, md: 3 },
            mb: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 50%, #fff3e0 100%)',
            borderRadius: 4,
            flexWrap: 'wrap',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(255, 44, 25, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(255, 44, 25, 0.1)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 12px 40px rgba(255, 44, 25, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -100,
              right: -100,
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, rgba(255, 44, 25, 0.08) 0%, transparent 70%)',
              borderRadius: '50%',
              animation: 'pulse 4s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': {
                  transform: 'scale(1)',
                  opacity: 0.8,
                },
                '50%': {
                  transform: 'scale(1.1)',
                  opacity: 0.6,
                },
              },
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 300,
              height: 300,
              background: 'radial-gradient(circle, rgba(1, 27, 73, 0.05) 0%, transparent 70%)',
              borderRadius: '50%',
            },
          }}
        >
          {/* Conteúdo principal */}
          <Box sx={{ flex: 1, minWidth: { xs: '100%', md: 300 }, position: 'relative', zIndex: 1 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: '#011b49', 
                mb: 1,
                fontSize: { xs: '1.5rem', md: '1.875rem' },
                lineHeight: 1.2,
              }}
            >
              👋 Bem-vindo!
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#6b7280', 
                fontSize: { xs: '0.95rem', md: '1rem' },
                lineHeight: 1.6,
                maxWidth: '600px',
              }}
            >
              Explore as jornadas disponíveis e comece suas avaliações. 
              Acompanhe seu progresso e pontuações em tempo real.
            </Typography>
          </Box>
          
          {/* Logo */}
          <Box 
            sx={{ 
              maxWidth: { xs: 100, md: 140 }, 
              mt: { xs: 2, md: 0 }, 
              position: 'relative', 
              zIndex: 1,
            }}
          >
            <img
              src="/logo/logo1.svg"
              alt="Logo da Plataforma"
              style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))' }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <RouteIcon sx={{ fontSize: 32, color: '#e62816' }} />
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                fontSize: '2rem',
                background: 'linear-gradient(135deg, #011b49 0%, #1a3a6b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em',
              }}
            >
              Jornadas
            </Typography>
          </Box>
          
          {jornadas.length > 0 && (
            <TextField
              placeholder="Pesquisar jornadas..."
              value={termoPesquisa}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTermoPesquisa(e.target.value)}
              size="small"
              sx={{
                minWidth: 300,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 2px 8px rgba(230, 40, 22, 0.2)',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#e62816' }} />
                  </InputAdornment>
                ),
                endAdornment: termoPesquisa && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setTermoPesquisa('')}
                      aria-label="limpar pesquisa"
                      sx={{ color: '#e62816' }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        </Box>

        {erro && (
          <AlertFixed 
            severity="error"
            message={erro}
            onClose={() => setErro('')}
          />
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress sx={{ color: '#ff2c19' }} />
          </Box>
        ) : jornadas.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma jornada disponível
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Entre em contato com o administrador para mais informações.
            </Typography>
          </Paper>
        ) : jornadasFiltradas.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma jornada encontrada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Tente pesquisar com outros termos
            </Typography>
          </Paper>
        ) : (
          <Box 
            sx={{ 
              position: 'relative', 
              width: '100%', 
              mb: 6,
              px: { xs: 0, md: 4 },
              '& .slick-dots': {
                bottom: '-45px',
                '& li button:before': {
                  color: '#e62816',
                  fontSize: '12px',
                },
                '& li.slick-active button:before': {
                  color: '#e62816',
                },
              },
              '& .slick-slider': {
                overflow: 'visible',
              },
              '& .slick-prev, & .slick-next': {
                zIndex: 30,
                width: '40px',
                height: '40px',
                display: 'flex !important',
                alignItems: 'center',
                justifyContent: 'center',
                '&:before': {
                  color: '#e62816',
                  fontSize: '30px',
                  opacity: 1,
                },
                '&:hover:before': {
                  color: '#c52214',
                },
              },
              '& .slick-prev': {
                left: { xs: '15px', md: '-60px' },
                zIndex: 30,
              },
              '& .slick-next': {
                right: { xs: '15px', md: '-60px' },
                zIndex: 30,
              },
            }}
          >
            <Box
              sx={{
                overflow: 'visible',
                padding: '20px 0',
                margin: '0 -10px',
                '& .slick-list': {
                  overflow: 'hidden',
                  padding: '0 20px !important',
                },
                '& .slick-track': {
                  display: 'flex',
                  alignItems: 'stretch',
                },
              }}
            >
              <Slider
                dots={true}
                infinite={false}
                speed={600}
                slidesToShow={3.3}
                slidesToScroll={1}
                autoplay={false}
                pauseOnHover={true}
                cssEase="ease-in-out"
                arrows={true}
                responsive={[
                  {
                    breakpoint: 1200,
                    settings: {
                      slidesToShow: 2.3,
                      arrows: true,
                      infinite: false,
                    },
                  },
                  {
                    breakpoint: 900,
                    settings: {
                      slidesToShow: 1.3,
                      arrows: false,
                      infinite: false,
                    },
                  },
                ]}
              >
                {jornadasFiltradas.map((jornada: Jornada, index: number) => (
                  <Box 
                    key={jornada.id} 
                    px={1}
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      '&:hover': {
                        zIndex: 2,
                      },
                    }}
                  >
                    <Paper
                      elevation={3}
                      sx={{
                        minHeight: 270,
                        height: 'auto',
                        p: 2.5,
                        borderRadius: 3,
                        transition: 'all 0.3s ease-in-out',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        backgroundColor: jornada.ativo === false 
                          ? '#f5f5f5' 
                          : index % 2 === 0 ? '#fff' : '#fff9f5',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        filter: jornada.ativo === false ? 'grayscale(0.8)' : 'none',
                        opacity: jornada.ativo === false ? 0.75 : 1,
                        '&:hover': {
                          transform: jornada.ativo !== false ? 'translateY(-3px) scale(1.01)' : 'none',
                          boxShadow: jornada.ativo !== false 
                            ? '0 12px 30px rgba(255, 44, 25, 0.2)' 
                            : '0 2px 8px rgba(0,0,0,0.1)',
                        },
                      }}
                      onClick={() => handleAbrirJornada(jornada.id)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Acessar jornada ${jornada.titulo}`}
                      onKeyPress={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleAbrirJornada(jornada.id);
                        }
                      }}
                    >
                      {/* Imagem ou Ícone no topo */}
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
                        {jornada.imagemCapa ? (
                          <Box
                            component="img"
                            src={jornada.imagemCapa}
                            alt={`Imagem da jornada ${jornada.titulo}`}
                            sx={{
                              width: '100%',
                              height: 100,
                              objectFit: 'cover',
                              borderRadius: 2,
                              backgroundColor: '#f5f5f5',
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: 100,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f5f5f5',
                              borderRadius: 2,
                            }}
                          >
                            <RouteIcon sx={{ fontSize: 40, color: '#ff2c19' }} />
                          </Box>
                        )}
                      </Box>

                      {/* Título e Status */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 'bold', 
                            color: jornada.ativo === false ? '#9e9e9e' : '#011b49',
                            flex: 1,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            '&:hover': {
                              color: jornada.ativo !== false ? '#e62816' : '#9e9e9e',
                            },
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {jornada.titulo}
                        </Typography>
                      </Box>

                      {/* Chips de Status */}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                        {jornada.todasFasesAbertas ? (
                          <Chip
                            icon={<LockOpenIcon />}
                            label="Fases Abertas"
                            color="success"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        ) : jornada.faseAtual ? (
                          <Chip
                            label={jornada.faseAtual.titulo}
                            color="primary"
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        ) : null}
                      </Box>

                      {/* Botão de ação */}
                      <Box sx={{ mt: 'auto', pt: 1.5 }}>
                        <Box
                          component="button"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleAbrirJornada(jornada.id);
                          }}
                          sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            color: '#fff',
                            backgroundColor: jornada.ativo === false ? '#9e9e9e' : '#e62816',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            padding: '10px 16px',
                            borderRadius: 2,
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease-in-out',
                            background: jornada.ativo === false
                              ? 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)'
                              : 'linear-gradient(135deg, #ff2c19 0%, #e62816 100%)',
                            boxShadow: jornada.ativo === false 
                              ? '0 2px 4px rgba(0, 0, 0, 0.2)' 
                              : '0 2px 8px rgba(230, 40, 22, 0.2)',
                            '&:hover': {
                              background: jornada.ativo === false
                                ? 'linear-gradient(135deg, #757575 0%, #9e9e9e 100%)'
                                : 'linear-gradient(135deg, #e62816 0%, #ff2c19 100%)',
                              transform: jornada.ativo !== false ? 'translateY(-2px)' : 'none',
                              boxShadow: jornada.ativo !== false 
                                ? '0 6px 16px rgba(255, 44, 25, 0.3)' 
                                : '0 2px 4px rgba(0, 0, 0, 0.2)',
                            },
                          }}
                        >
                          <Typography sx={{ fontWeight: 600, color: '#fff' }}>Acessar Jornada</Typography>
                          <RouteIcon sx={{ fontSize: 18, color: '#fff' }} />
                        </Box>
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </Slider>
            </Box>
          </Box>
        )}

        {/* Seção de Estatísticas Pessoais */}
        {!loadingEstatisticas && estatisticas && (
          <Box sx={{ mb: 4, mt: 6 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                fontSize: '1.5rem',
                background: 'linear-gradient(135deg, #011b49 0%, #1a3a6b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Minhas Estatísticas
            </Typography>
            <Grid container spacing={3}>
              {/* Pontuação Total - Sem gráfico */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <TrophyIcon sx={{ color: '#e62816', fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#011b49' }}>
                        Pontuação Total
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#e62816' }}>
                      {estatisticas.pontuacaoTotal}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {estatisticas.quizzesConcluidos} {estatisticas.quizzesConcluidos === 1 ? 'quiz concluído' : 'quizzes concluídos'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Tempo Médio - Com gráfico de barra */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <TimerIcon sx={{ color: '#1976d2', fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#011b49' }}>
                        Tempo Médio
                      </Typography>
                    </Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2', mb: 1 }}>
                      {estatisticas.tempoMedio}s
                    </Typography>
                    {estatisticas.tempoMedio > 0 && (
                      <Box sx={{ height: 80, mt: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[{ name: 'Tempo', value: estatisticas.tempoMedio }]}>
                            <Bar dataKey="value" fill="#1976d2" radius={[8, 8, 0, 0]} />
                            <YAxis hide domain={[0, Math.max(estatisticas.tempoMedio * 1.5, 30)]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Por pergunta
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Taxa de Acertos - Com gráfico de pizza */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <CheckIcon sx={{ color: '#388e3c', fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#011b49' }}>
                        Taxa de Acertos
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#388e3c' }}>
                        {estatisticas.taxaAcertos}%
                      </Typography>
                      {estatisticas.totalPerguntas > 0 && (
                        <Box sx={{ width: 80, height: 80 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Acertos', value: estatisticas.taxaAcertos },
                                  { name: 'Erros', value: estatisticas.taxaErros },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={40}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                              >
                                <Cell fill="#388e3c" />
                                <Cell fill="#d32f2f" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {estatisticas.totalAcertos} de {estatisticas.totalPerguntas} perguntas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Taxa de Erros - Com gráfico de pizza */}
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <ErrorIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#011b49' }}>
                        Taxa de Erros
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                        {estatisticas.taxaErros}%
                      </Typography>
                      {estatisticas.totalPerguntas > 0 && (
                        <Box sx={{ width: 80, height: 80 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Erros', value: estatisticas.taxaErros },
                                  { name: 'Acertos', value: estatisticas.taxaAcertos },
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={25}
                                outerRadius={40}
                                dataKey="value"
                                startAngle={90}
                                endAngle={-270}
                              >
                                <Cell fill="#d32f2f" />
                                <Cell fill="#388e3c" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </Box>
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {estatisticas.totalErros} de {estatisticas.totalPerguntas} perguntas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

            </Grid>
          </Box>
        )}
      </Container>
    </ParticipantLayout>
  );
};

export default DashboardColaborador;

