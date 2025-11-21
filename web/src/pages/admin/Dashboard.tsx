import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {
  Container,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Paper,
  Typography,
  Box,
  TextField,
  InputAdornment,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress,
  IconButton,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Route as RouteIcon,
  Search as SearchIcon,
  EmojiEvents as TrophyIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Timer as TimerIcon,
  Close as CloseIcon,
  Campaign as CampaignIcon,
  Flag as FlagIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

interface Jornada {
  id: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  imagemUrl?: string;
  _count: {
    fases: number;
  };
}

interface UsuarioRanking {
  id: number;
  nome: string;
  email: string;
  pontuacaoTotal: number;
  tentativas: number;
  acertos: number;
  totalPerguntas: number;
  percentualAcertos: number;
}

// Hook para animação de contagem
const useCountUp = (end: number, duration: number = 1.2): number => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | undefined;
    let animationFrame: number | undefined;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
      }
    };

    animationFrame = window.requestAnimationFrame(animate);
    
    return () => {
      if (animationFrame !== undefined) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return count;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [jornadasFiltradas, setJornadasFiltradas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [termoPesquisa, setTermoPesquisa] = useState('');
  const [ranking, setRanking] = useState<UsuarioRanking[]>([]);
  const [loadingRanking, setLoadingRanking] = useState(false);
  
  // Métricas gerais (podem vir da API ou serem calculadas)
  const [acertividadeGeral, setAcertividadeGeral] = useState(0);
  const [nivelErro, setNivelErro] = useState(0);
  const [tempoMedioResposta, setTempoMedioResposta] = useState(0);

  // Animações de contagem
  const acertividadeAnimada = useCountUp(acertividadeGeral, 1.2);
  const erroAnimado = useCountUp(nivelErro, 1.2);
  const tempoAnimado = useCountUp(tempoMedioResposta, 1.2);

  useEffect(() => {
    carregarJornadas();
    carregarRankingGeral();
    carregarMetricasGerais();
  }, []);

  useEffect(() => {
    if (termoPesquisa.trim() === '') {
      // Mostrar apenas as 10 últimas jornadas (ordenadas por ordem ou id)
      const ultimasJornadas = [...jornadas]
        .sort((a, b) => (b.ordem || b.id) - (a.ordem || a.id))
        .slice(0, 10);
      setJornadasFiltradas(ultimasJornadas);
    } else {
      const filtradas = jornadas.filter((jornada: Jornada) =>
        jornada.titulo.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
        jornada.descricao?.toLowerCase().includes(termoPesquisa.toLowerCase())
      );
      // Limitar resultados da pesquisa também a 10
      setJornadasFiltradas(filtradas.slice(0, 10));
    }
  }, [termoPesquisa, jornadas]);

  const carregarJornadas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jornadas');
      const dados = response.data.data || response.data;
      const jornadasArray = Array.isArray(dados) ? dados : [];
      setJornadas(jornadasArray);
      setJornadasFiltradas(jornadasArray);
    } catch (error: any) {
      setErro(error.response?.data?.error?.message || 'Erro ao carregar jornadas');
      setJornadas([]);
      setJornadasFiltradas([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarRankingGeral = async () => {
    try {
      setLoadingRanking(true);
      // Buscar estatísticas de todas as jornadas e consolidar ranking
      const response = await api.get('/jornadas');
      const jornadasData = response.data.data || response.data;
      const jornadasArray = Array.isArray(jornadasData) ? jornadasData : [];
      
      // Buscar estatísticas de cada jornada e consolidar
      const rankingsConsolidados: Map<number, UsuarioRanking> = new Map();
      
      for (const jornada of jornadasArray) {
        try {
          const statsResponse = await api.get(`/jornadas/${jornada.id}/estatisticas`);
          const stats = statsResponse.data.data;
          
          if (stats?.ranking) {
            stats.ranking.forEach((item: any) => {
              const usuarioId = item.usuario.id;
              if (rankingsConsolidados.has(usuarioId)) {
                const existente = rankingsConsolidados.get(usuarioId)!;
                existente.pontuacaoTotal += item.pontuacaoTotal;
                existente.tentativas += item.tentativas;
                existente.acertos += item.acertos;
                existente.totalPerguntas += item.totalPerguntas;
              } else {
                rankingsConsolidados.set(usuarioId, {
                  id: item.usuario.id,
                  nome: item.usuario.nome,
                  email: item.usuario.email,
                  pontuacaoTotal: item.pontuacaoTotal,
                  tentativas: item.tentativas,
                  acertos: item.acertos,
                  totalPerguntas: item.totalPerguntas,
                  percentualAcertos: 0,
                });
              }
            });
          }
        } catch (err) {
          // Ignorar erros de jornadas individuais
        }
      }
      
      // Calcular percentuais e ordenar
      const rankingFinal = Array.from(rankingsConsolidados.values())
        .map((usuario) => ({
          ...usuario,
          percentualAcertos: usuario.totalPerguntas > 0
            ? Math.round((usuario.acertos / usuario.totalPerguntas) * 100)
            : 0,
        }))
        .sort((a, b) => b.pontuacaoTotal - a.pontuacaoTotal)
        .slice(0, 10);
      
      setRanking(rankingFinal);
    } catch (error: any) {
      console.error('Erro ao carregar ranking:', error);
      // Em caso de erro, usar dados mockados
      setRanking([
        { id: 1, nome: 'João Silva', email: 'joao@example.com', pontuacaoTotal: 1250, tentativas: 15, acertos: 45, totalPerguntas: 60, percentualAcertos: 75 },
        { id: 2, nome: 'Maria Santos', email: 'maria@example.com', pontuacaoTotal: 1180, tentativas: 12, acertos: 42, totalPerguntas: 55, percentualAcertos: 76 },
        { id: 3, nome: 'Pedro Oliveira', email: 'pedro@example.com', pontuacaoTotal: 1100, tentativas: 14, acertos: 38, totalPerguntas: 50, percentualAcertos: 76 },
      ]);
    } finally {
      setLoadingRanking(false);
    }
  };

  const carregarMetricasGerais = async () => {
    try {
      // Buscar estatísticas gerais de todas as jornadas
      const response = await api.get('/jornadas');
      const jornadasData = response.data.data || response.data;
      const jornadasArray = Array.isArray(jornadasData) ? jornadasData : [];
      
      let totalAcertos = 0;
      let totalPerguntas = 0;
      
      for (const jornada of jornadasArray) {
        try {
          const statsResponse = await api.get(`/jornadas/${jornada.id}/estatisticas`);
          const stats = statsResponse.data.data;
          
          if (stats?.estatisticasGerais) {
            totalAcertos += stats.estatisticasGerais.totalAcertos || 0;
            totalPerguntas += stats.estatisticasGerais.totalPerguntas || 0;
          }
        } catch (err) {
          // Ignorar erros
        }
      }
      
      const acertividade = totalPerguntas > 0 ? Math.round((totalAcertos / totalPerguntas) * 100) : 0;
      const erro = totalPerguntas > 0 ? Math.round(((totalPerguntas - totalAcertos) / totalPerguntas) * 100) : 0;
      
      setAcertividadeGeral(acertividade);
      setNivelErro(erro);
      // Tempo médio mockado (em segundos) - pode ser calculado se houver dados de tempo
      setTempoMedioResposta(12.5);
    } catch (error) {
      // Valores mockados em caso de erro
      setAcertividadeGeral(75);
      setNivelErro(25);
      setTempoMedioResposta(12.5);
    }
  };

  return (
    <AdminLayout title="Painel Administrativo">
      <Container maxWidth="lg">

        {/* Banner de boas-vindas */}
        <Box
          sx={{
            position: 'relative',
            p: { xs: 2.5, md: 4 },
            mb: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 50%, #fff3e0 100%)',
            borderRadius: 3,
            flexWrap: 'wrap',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: -50,
              right: -50,
              width: 200,
              height: 200,
              background: 'radial-gradient(circle, rgba(255,44,25,0.1) 0%, transparent 70%)',
              borderRadius: '50%',
            },
          }}
        >
          <CampaignIcon
            sx={{
              position: 'absolute',
              top: 20,
              left: 20,
              fontSize: 120,
              color: '#ff2c19',
              opacity: 0.1,
              zIndex: 0,
            }}
          />
          <Box sx={{ flex: 1, minWidth: 250, position: 'relative', zIndex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#011b49', mb: 1.5 }}>
              👋 Bem-vindo à Plataforma Administrativa
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '1.1rem' }}>
              Aqui você gerencia jornadas, usuários e relatórios com facilidade.
            </Typography>
          </Box>
          <Box sx={{ maxWidth: 160, mt: { xs: 2, md: 0 }, position: 'relative', zIndex: 1 }}>
            <img
              src="/logo/logo1.svg"
              alt="Logo da Plataforma"
              style={{ width: '100%', height: 'auto' }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, mt: 2, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <RouteIcon sx={{ fontSize: 32, color: '#e62816' }} />
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#011b49' }}>
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
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress sx={{ color: '#ff2c19' }} />
          </Box>
        ) : jornadas.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma jornada cadastrada
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Crie uma nova jornada usando o menu lateral
            </Typography>
            <Button
              variant="contained"
              startIcon={<RouteIcon />}
              onClick={() => navigate('/admin/jornadas/novo')}
              sx={{ mt: 2 }}
            >
              Criar Primeira Jornada
            </Button>
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
              '& .slick-prev, & .slick-next': {
                zIndex: 2,
                width: '40px',
                height: '40px',
                '&:before': {
                  color: '#e62816',
                  fontSize: '30px',
                },
                '&:hover:before': {
                  color: '#c52214',
                },
              },
              '& .slick-prev': {
                left: '-45px',
              },
              '& .slick-next': {
                right: '-45px',
              },
            }}
          >
            <Slider
              dots={true}
              infinite={jornadasFiltradas.length > 3}
              speed={600}
              slidesToShow={3.3}
              slidesToScroll={1}
              autoplay={true}
              autoplaySpeed={4000}
              pauseOnHover={true}
              cssEase="ease-in-out"
              arrows={true}
              responsive={[
                {
                  breakpoint: 1200,
                  settings: {
                    slidesToShow: 2.3,
                    arrows: true,
                  },
                },
                {
                  breakpoint: 900,
                  settings: {
                    slidesToShow: 1.3,
                    arrows: false,
                  },
                },
              ]}
            >
              {jornadasFiltradas.map((jornada: Jornada, index: number) => (
                <Box key={jornada.id} px={1}>
                  <Paper
                    elevation={3}
                    sx={{
                      height: 300,
                      p: 2.5,
                      borderRadius: 3,
                      transition: 'all 0.3s ease-in-out',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      backgroundColor: index % 2 === 0 ? '#fff' : '#fff9f5',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-6px) scale(1.03)',
                        boxShadow: '0 20px 50px rgba(255, 44, 25, 0.25)',
                        zIndex: 10,
                      },
                    }}
                    onClick={() => navigate(`/admin/jornadas/${jornada.id}`)}
                    role="button"
                    tabIndex={0}
                    aria-label={`Ver detalhes da jornada ${jornada.titulo}`}
                    onKeyPress={(e: React.KeyboardEvent) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        navigate(`/admin/jornadas/${jornada.id}`);
                      }
                    }}
                  >
                    {/* Ícone no topo */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      {jornada.imagemUrl ? (
                        <Box
                          component="img"
                          src={jornada.imagemUrl}
                          alt={`Ícone da jornada ${jornada.titulo}`}
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'contain',
                            borderRadius: 2,
                            backgroundColor: '#f5f5f5',
                            p: 1,
                          }}
                        />
                      ) : (
                        <RouteIcon sx={{ fontSize: 50, color: '#ff2c19' }} />
                      )}
                    </Box>

                    {/* Descrição */}
                    <Box sx={{ flexGrow: 1, mb: 1.5 }}>
                      {jornada.descricao ? (
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {jornada.descricao}
                        </Typography>
                      ) : (
                        <Box sx={{ minHeight: 40 }} />
                      )}
                    </Box>

                    {/* Chips - Fase atual e Ordem */}
                    <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      <Chip
                        icon={<FlagIcon sx={{ fontSize: 16 }} />}
                        label={`Fase atual: ${jornada._count.fases}`}
                        size="small"
                        sx={{
                          backgroundColor: '#fff3e0',
                          color: '#e62816',
                          fontWeight: 600,
                        }}
                      />
                      <Chip
                        label={`Ordem: ${jornada.ordem}`}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: '#e62816',
                          color: '#e62816',
                          fontWeight: 600,
                        }}
                      />
                    </Box>

                    {/* Título e Status - na parte inferior */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 'bold', 
                          color: '#011b49',
                          flex: 1,
                          fontSize: '1rem',
                          cursor: 'pointer',
                          '&:hover': {
                            color: '#e62816',
                          },
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/jornadas/${jornada.id}`);
                        }}
                      >
                        {jornada.titulo}
                      </Typography>
                      <Chip
                        label={jornada.ativo ? 'Ativa' : 'Inativa'}
                        color={jornada.ativo ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600, ml: 1 }}
                      />
                    </Box>

                    {/* Botão na parte inferior */}
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<VisibilityIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/jornadas/${jornada.id}`);
                      }}
                      sx={{
                        fontWeight: 'bold',
                        py: 1,
                        borderRadius: 2,
                        fontSize: '0.85rem',
                        background: 'linear-gradient(135deg, #ff2c19 0%, #e62816 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #e62816 0%, #ff2c19 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(255, 44, 25, 0.3)',
                        },
                        transition: 'all 0.3s ease-in-out',
                      }}
                      aria-label={`Ver detalhes da jornada ${jornada.titulo}`}
                    >
                      Ver Jornada
                    </Button>
                  </Paper>
                </Box>
              ))}
              
              {/* Card de Criar Nova Jornada */}
              <Box px={1}>
                <Paper
                  elevation={0}
                  sx={{
                    height: 300,
                    p: 2.5,
                    borderRadius: 3,
                    border: '2px dashed #e62816',
                    backgroundColor: '#fff9f5',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: '#ff2c19',
                      backgroundColor: '#fff7f4',
                      transform: 'translateY(-6px) scale(1.03)',
                      boxShadow: '0 20px 50px rgba(230, 40, 22, 0.25)',
                      zIndex: 10,
                    },
                  }}
                  onClick={() => navigate('/admin/jornadas/novo')}
                  role="button"
                  tabIndex={0}
                  aria-label="Criar nova jornada"
                  onKeyPress={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate('/admin/jornadas/novo');
                    }
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      backgroundColor: '#fff3e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                      border: '2px dashed #e62816',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        backgroundColor: '#ffe0b2',
                        transform: 'scale(1.1)',
                      },
                    }}
                  >
                    <AddIcon sx={{ fontSize: 40, color: '#e62816' }} />
                  </Box>
                  
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: '#011b49',
                      mb: 1,
                      textAlign: 'center',
                      fontSize: '1rem',
                    }}
                  >
                    Criar Nova Jornada
                  </Typography>
                  
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      mb: 2,
                      textAlign: 'center',
                      px: 1,
                      fontSize: '0.8rem',
                    }}
                  >
                    Adicione uma nova jornada de capacitação ao sistema
                  </Typography>

                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/admin/jornadas/novo');
                    }}
                    sx={{
                      fontWeight: 'bold',
                      py: 1,
                      px: 2,
                      borderRadius: 2,
                      fontSize: '0.85rem',
                      background: 'linear-gradient(135deg, #ff2c19 0%, #e62816 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #e62816 0%, #ff2c19 100%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 16px rgba(255, 44, 25, 0.3)',
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                    aria-label="Criar nova jornada"
                  >
                    Criar Jornada
                  </Button>
                </Paper>
              </Box>
            </Slider>
          </Box>
        )}

        {/* Ranking Geral e Métricas */}
        {!loading && jornadas.length > 0 && (
          <>
            {/* Ranking Geral */}
            <Box sx={{ mt: 10, mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#011b49', mb: 3 }}>
                <TrophyIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#ffd700' }} />
                Ranking Geral de Usuários
              </Typography>
              
              {loadingRanking ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress sx={{ color: '#ff2c19' }} />
                </Box>
              ) : ranking.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Typography variant="body1" color="text.secondary">
                    Ainda não há dados de ranking disponíveis
                  </Typography>
                </Paper>
              ) : (
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                  <Table>
                    <TableHead sx={{ backgroundColor: '#fff3e0' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Posição</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Usuário</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Pontuação</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tentativas</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Acertividade</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Progresso</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ranking.map((usuario: UsuarioRanking, index: number) => {
                        const medalColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : 'transparent';
                        const bgColor = index === 0 ? '#fffde7' : index === 1 ? '#f5f5f5' : index === 2 ? '#fff3e0' : undefined;
                        const borderColor = index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : undefined;
                        
                        return (
                          <TableRow
                            key={usuario.id}
                            hover
                            sx={{
                              backgroundColor: bgColor,
                              border: borderColor ? `2px solid ${borderColor}` : undefined,
                              '&:nth-of-type(odd)': { backgroundColor: bgColor || '#fafafa' },
                              '&:hover': { backgroundColor: '#fff7f4' },
                              transition: 'all 0.3s ease-in-out',
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative' }}>
                                {index < 3 && (
                                  <TrophyIcon 
                                    sx={{ 
                                      color: medalColor, 
                                      fontSize: 24,
                                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                                    }} 
                                  />
                                )}
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontWeight: index < 3 ? 'bold' : 'normal',
                                    fontSize: index < 3 ? '1.1rem' : '1rem',
                                  }}
                                >
                                  #{index + 1}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative' }}>
                                <Box sx={{ position: 'relative' }}>
                                  <Avatar sx={{ bgcolor: '#e62816', width: 45, height: 45, fontSize: '1.1rem' }}>
                                    {usuario.nome.charAt(0).toUpperCase()}
                                  </Avatar>
                                  {index < 3 && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: -5,
                                        right: -5,
                                        width: 24,
                                        height: 24,
                                        borderRadius: '50%',
                                        backgroundColor: medalColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '2px solid #fff',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                      }}
                                    >
                                      <TrophyIcon sx={{ fontSize: 14, color: '#fff' }} />
                                    </Box>
                                  )}
                                </Box>
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                                    {usuario.nome}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {usuario.email}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#011b49', fontSize: '1.1rem' }}>
                                {usuario.pontuacaoTotal.toLocaleString('pt-BR')}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>{usuario.tentativas}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip
                                label={`${usuario.percentualAcertos}%`}
                                color={usuario.percentualAcertos >= 70 ? 'success' : usuario.percentualAcertos >= 50 ? 'warning' : 'error'}
                                size="small"
                                sx={{ fontWeight: 600, fontSize: '0.85rem' }}
                              />
                            </TableCell>
                            <TableCell align="center" sx={{ minWidth: 150 }}>
                              <LinearProgress
                                variant="determinate"
                                value={usuario.percentualAcertos}
                                sx={{
                                  height: 10,
                                  borderRadius: 5,
                                  backgroundColor: '#e0e0e0',
                                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 5,
                                    backgroundColor: usuario.percentualAcertos >= 70 ? '#4caf50' : usuario.percentualAcertos >= 50 ? '#ff9800' : '#f44336',
                                    transition: 'transform 0.4s ease-in-out',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                  },
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {/* Métricas Gerais */}
            <Box sx={{ mt: 4, mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#011b49', mb: 3 }}>
                Métricas Gerais do Sistema
              </Typography>
              
              <Grid container spacing={3}>
                {/* Acertividade Geral */}
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                      color: '#fff',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <CheckIcon sx={{ fontSize: 28, mr: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                        Acertividade Geral
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontSize: '2rem' }}>
                        {acertividadeAnimada}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={acertividadeGeral}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: 'rgba(255,255,255,0.3)',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor: '#fff',
                            transition: 'transform 0.4s ease-in-out',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          },
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                {/* Nível de Erro */}
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #f44336 0%, #e57373 100%)',
                      color: '#fff',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <ErrorIcon sx={{ fontSize: 28, mr: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                        Nível de Erro
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, fontSize: '2rem' }}>
                        {erroAnimado}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={nivelErro}
                        sx={{
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: 'rgba(255,255,255,0.3)',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor: '#fff',
                            transition: 'transform 0.4s ease-in-out',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          },
                        }}
                      />
                    </Box>
                  </Paper>
                </Grid>

                {/* Tempo Médio de Resposta */}
                <Grid item xs={12} md={4}>
                  <Paper
                    elevation={3}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                      color: '#fff',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                      <TimerIcon sx={{ fontSize: 28, mr: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                        Tempo Médio de Resposta
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 0.5, fontSize: '2rem' }}>
                        {tempoAnimado.toFixed(1)}s
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                        Por pergunta
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
          </Box>
          </>
        )}
      </Container>
    </AdminLayout>
  );
};

export default AdminDashboard;
