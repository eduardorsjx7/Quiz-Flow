import React, { useEffect, useState, useCallback } from 'react';
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
  Flag as FlagIcon,
  Add as AddIcon,
  PlayArrow as PlayArrowIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

interface Jornada {
  id: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
  imagemCapa?: string;
  createdAt?: string;
  faseAtual?: {
    id: number;
    titulo: string;
    ordem: number;
  } | null;
  todasFasesAbertas?: boolean;
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

  const carregarTodosDados = useCallback(async () => {
    try {
      setLoading(true);
      // Fazer uma única chamada para /jornadas
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
      setJornadasFiltradas(jornadasOrdenadas);
      
      // Filtrar apenas jornadas ativas para ranking e métricas
      const jornadasAtivas = jornadasArray.filter((j: Jornada) => j.ativo);
      
      // Carregar ranking e métricas usando apenas jornadas ativas
      await Promise.all([
        carregarRankingGeral(jornadasAtivas),
        carregarMetricasGerais(jornadasAtivas),
      ]);
    } catch (error: any) {
      // Tratar erro 429 (Too Many Requests)
      if (error.response?.status === 429) {
        setErro('Muitas requisições. Aguarde alguns instantes e recarregue a página.');
        // Não tentar novamente automaticamente
        return;
      }
      setErro(error.response?.data?.error?.message || 'Erro ao carregar dados');
      setJornadas([]);
      setJornadasFiltradas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarTodosDados();
  }, [carregarTodosDados]);

  useEffect(() => {
    if (termoPesquisa.trim() === '') {
      // Jornadas já estão ordenadas por data de criação no carregarTodosDados
      setJornadasFiltradas(jornadas);
    } else {
      const filtradas = jornadas.filter((jornada: Jornada) =>
        jornada.titulo.toLowerCase().includes(termoPesquisa.toLowerCase()) ||
        jornada.descricao?.toLowerCase().includes(termoPesquisa.toLowerCase())
      );
      setJornadasFiltradas(filtradas);
    }
  }, [termoPesquisa, jornadas]);

  const carregarRankingGeral = async (jornadasArray: Jornada[]) => {
    try {
      setLoadingRanking(true);
      
      // Buscar estatísticas de cada jornada e consolidar
      const rankingsConsolidados: Map<number, UsuarioRanking> = new Map();
      
      // Adicionar delay entre requisições para evitar rate limiting
      for (let i = 0; i < jornadasArray.length; i++) {
        const jornada = jornadasArray[i];
        
        // Delay de 100ms entre requisições (exceto a primeira)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
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
        } catch (err: any) {
          // Tratar erro 429 especificamente
          if (err.response?.status === 429) {
            console.warn(`Rate limit atingido para jornada ${jornada.id}. Parando requisições.`);
            break; // Parar o loop se atingir rate limit
          }
          // Ignorar outros erros de jornadas individuais
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
      
      // Se não houver dados, deixar vazio
      setRanking(rankingFinal.length > 0 ? rankingFinal : []);
    } catch (error: any) {
      // Tratar erro 429
      if (error.response?.status === 429) {
        console.warn('Rate limit atingido ao carregar ranking');
      } else {
        console.error('Erro ao carregar ranking:', error);
      }
      // Em caso de erro, deixar vazio
      setRanking([]);
    } finally {
      setLoadingRanking(false);
    }
  };

  const carregarMetricasGerais = async (jornadasArray: Jornada[]) => {
    try {
      let totalAcertos = 0;
      let totalPerguntas = 0;
      let totalTempoResposta = 0;
      let totalRespostas = 0;
      
      // Adicionar delay entre requisições para evitar rate limiting
      for (let i = 0; i < jornadasArray.length; i++) {
        const jornada = jornadasArray[i];
        
        // Delay de 100ms entre requisições (exceto a primeira)
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        try {
          const statsResponse = await api.get(`/jornadas/${jornada.id}/estatisticas`);
          const stats = statsResponse.data.data;
          
          if (stats?.estatisticasGerais) {
            totalAcertos += stats.estatisticasGerais.totalAcertos || 0;
            totalPerguntas += stats.estatisticasGerais.totalPerguntas || 0;
          }

          // Calcular tempo médio real das respostas
          if (stats?.ranking) {
            // Processar ranking fora do loop
            const rankingData = stats.ranking;
            for (const item of rankingData) {
              if (item.tempoMedio && item.totalPerguntas) {
                totalTempoResposta += item.tempoMedio * item.totalPerguntas;
                totalRespostas += item.totalPerguntas;
              }
            }
          }
        } catch (err: any) {
          // Tratar erro 429 especificamente
          if (err.response?.status === 429) {
            console.warn(`Rate limit atingido para jornada ${jornada.id}. Parando requisições.`);
            break; // Parar o loop se atingir rate limit
          }
          // Ignorar outros erros
        }
      }
      
      const acertividade = totalPerguntas > 0 ? Math.round((totalAcertos / totalPerguntas) * 100) : 0;
      const erro = totalPerguntas > 0 ? Math.round(((totalPerguntas - totalAcertos) / totalPerguntas) * 100) : 0;
      const tempoMedio = totalRespostas > 0 ? Math.round((totalTempoResposta / totalRespostas) * 10) / 10 : 0;
      
      setAcertividadeGeral(acertividade);
      setNivelErro(erro);
      setTempoMedioResposta(tempoMedio);
    } catch (error: any) {
      // Tratar erro 429
      if (error.response?.status === 429) {
        console.warn('Rate limit atingido ao carregar métricas');
      }
      // Se houver erro, deixar em 0 ao invés de valores mockados
      setAcertividadeGeral(0);
      setNivelErro(0);
      setTempoMedioResposta(0);
    }
  };

  return (
    <AdminLayout title="Painel Administrativo">
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
              👋 Bem-vindo à Plataforma Administrativa
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
              Gerencie jornadas, usuários e relatórios com facilidade e eficiência. 
              Tudo em um só lugar para você administrar sua plataforma de forma completa.
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

        <Box sx={{ position: 'relative', mb: 4, mt: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
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
          </Box>
          
          {jornadas.length > 0 && (
            <TextField
              placeholder="Pesquisar jornadas..."
              value={termoPesquisa}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTermoPesquisa(e.target.value)}
              size="small"
              sx={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
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
                      backgroundColor: !jornada.ativo 
                        ? '#f5f5f5' 
                        : index % 2 === 0 ? '#fff' : '#fff9f5',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      filter: !jornada.ativo ? 'grayscale(0.8)' : 'none',
                      opacity: !jornada.ativo ? 0.75 : 1,
                      '&:hover': {
                        transform: jornada.ativo ? 'translateY(-3px) scale(1.01)' : 'none',
                        boxShadow: jornada.ativo 
                          ? '0 12px 30px rgba(255, 44, 25, 0.2)' 
                          : '0 2px 8px rgba(0,0,0,0.1)',
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
                          color: !jornada.ativo ? '#9e9e9e' : '#011b49',
                          flex: 1,
                          fontSize: '1rem',
                          cursor: 'pointer',
                          '&:hover': {
                            color: jornada.ativo ? '#e62816' : '#9e9e9e',
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

                    {/* Descrição */}
                    {jornada.descricao && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: '0.875rem',
                          }}
                        >
                          {jornada.descricao}
                        </Typography>
                      </Box>
                    )}

                    {/* Chip - Fase atual */}
                    <Box sx={{ mb: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                      {jornada.todasFasesAbertas ? (
                        <Chip
                          icon={<LockOpenIcon sx={{ fontSize: 16 }} />}
                          label="Fases Abertas"
                          color="success"
                          size="small"
                          sx={{
                            fontWeight: 600,
                          }}
                        />
                      ) : jornada.faseAtual ? (
                        <Chip
                          icon={<PlayArrowIcon sx={{ fontSize: 16 }} />}
                          label={`${jornada.faseAtual.ordem}ª - ${jornada.faseAtual.titulo}`}
                          color="primary"
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 600,
                          }}
                        />
                      ) : (
                        <Chip
                          icon={<FlagIcon sx={{ fontSize: 16 }} />}
                          label="Sem fase"
                          size="small"
                          sx={{
                            backgroundColor: '#fff3e0',
                            color: '#e62816',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>

                    {/* Botão na parte inferior */}
                    <Box sx={{ mt: 'auto', pt: 1 }}>
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
                        background: !jornada.ativo 
                          ? 'linear-gradient(135deg, #9e9e9e 0%, #757575 100%)'
                          : 'linear-gradient(135deg, #ff2c19 0%, #e62816 100%)',
                        '&:hover': {
                          background: !jornada.ativo
                            ? 'linear-gradient(135deg, #757575 0%, #9e9e9e 100%)'
                            : 'linear-gradient(135deg, #e62816 0%, #ff2c19 100%)',
                          transform: jornada.ativo ? 'translateY(-2px)' : 'none',
                          boxShadow: jornada.ativo 
                            ? '0 6px 16px rgba(255, 44, 25, 0.3)' 
                            : '0 2px 4px rgba(0, 0, 0, 0.2)',
                        },
                        transition: 'all 0.3s ease-in-out',
                      }}
                      aria-label={`Ver detalhes da jornada ${jornada.titulo}`}
                    >
                      Ver Jornada
                    </Button>
                    </Box>
                  </Paper>
                </Box>
              ))}
              
              {/* Card de Criar Nova Jornada */}
              <Box px={1}>
                <Paper
                  elevation={0}
                  sx={{
                    minHeight: 270,
                    height: 'auto',
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
                    overflow: 'hidden',
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
                </Paper>
              </Box>
              </Slider>
            </Box>
          </Box>
        )}

        {/* Ranking Geral e Métricas */}
        {!loading && jornadas.length > 0 && (
          <>
            {/* Ranking Geral */}
            <Box sx={{ mt: 10, mb: 4 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '1.5rem',
                  color: '#011b49', 
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <TrophyIcon sx={{ fontSize: 24, color: '#ffd700' }} />
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
                                    {(usuario as any).nomeExibicao || usuario.nome}
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
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 600, 
                  fontSize: '1.5rem',
                  color: '#011b49', 
                  mb: 3,
                }}
              >
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
