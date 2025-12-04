import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
  CardActions,
  Grid,
  Breadcrumbs,
  Link,
  Button,
} from '@mui/material';
import {
  Search as SearchIcon,
  TableChart as TableChartIcon,
  ViewModule as ViewModuleIcon,
  Route as RouteIcon,
  Home as HomeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  PlayArrow as PlayArrowIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import ParticipantLayout from '../../components/ParticipantLayout';
import AlertFixed from '../../components/AlertFixed';
import { LoadingScreen } from '../../components/LoadingScreen';

interface Jornada {
  id: number;
  titulo: string;
  imagemCapa?: string;
  ordem: number;
  ativo: boolean;
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
  pontuacaoTotal?: number;
  pontuacaoObtida?: number;
}

const Jornadas: React.FC = () => {
  const navigate = useNavigate();
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [visualizacao, setVisualizacao] = useState<'tabela' | 'cards'>('cards');
  const [paginaAtualTabela, setPaginaAtualTabela] = useState(1);
  const [paginaAtualCards, setPaginaAtualCards] = useState(1);
  const itensPorPaginaTabela = 8;
  const itensPorPaginaCards = 6;

  useEffect(() => {
    carregarJornadas();
  }, []);

  const carregarJornadas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jornadas');
      const dados = response.data.data || response.data;
      // Filtrar apenas jornadas ativas para participantes
      const jornadasAtivas = Array.isArray(dados) 
        ? dados.filter((j: Jornada) => j.ativo) 
        : [];
      
      // Ordenar por data de criação (mais recentes primeiro)
      const jornadasOrdenadas = jornadasAtivas.sort((a: Jornada, b: Jornada) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Se não tiver data, ordenar por ID (mais recente = maior ID)
        return b.id - a.id;
      });
      
      setJornadas(jornadasOrdenadas);
      setPaginaAtualTabela(1);
      setPaginaAtualCards(1);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar jornadas');
      setJornadas([]);
    } finally {
      setLoading(false);
    }
  };

  const jornadasFiltradas = useMemo(() => {
    if (!pesquisa.trim()) {
      return jornadas;
    }
    const termoPesquisa = pesquisa.toLowerCase();
    return jornadas.filter((jornada) =>
      jornada.titulo.toLowerCase().includes(termoPesquisa)
    );
  }, [jornadas, pesquisa]);

  // Paginação para tabela
  const indiceInicioTabela = (paginaAtualTabela - 1) * itensPorPaginaTabela;
  const indiceFimTabela = indiceInicioTabela + itensPorPaginaTabela;
  const jornadasPaginadasTabela = jornadasFiltradas.slice(indiceInicioTabela, Math.min(indiceFimTabela, jornadasFiltradas.length));
  const totalPaginasTabela = Math.ceil(jornadasFiltradas.length / itensPorPaginaTabela);

  // Paginação para cards
  const indiceInicioCards = (paginaAtualCards - 1) * itensPorPaginaCards;
  const indiceFimCards = indiceInicioCards + itensPorPaginaCards;
  const jornadasPaginadasCards = jornadasFiltradas.slice(indiceInicioCards, Math.min(indiceFimCards, jornadasFiltradas.length));
  const totalPaginasCards = Math.ceil(jornadasFiltradas.length / itensPorPaginaCards);

  const handleMudarPaginaTabela = (event: React.ChangeEvent<unknown>, value: number) => {
    setPaginaAtualTabela(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMudarPaginaCards = (event: React.ChangeEvent<unknown>, value: number) => {
    setPaginaAtualCards(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Resetar página quando pesquisa ou visualização mudar
  useEffect(() => {
    setPaginaAtualTabela(1);
    setPaginaAtualCards(1);
  }, [pesquisa, visualizacao]);

  if (loading) {
    return (
      <LoadingScreen 
        messages={[
          'Buscando suas jornadas',
          'Preparando os desafios',
          'Você está pronto para começar?'
        ]}
        messageInterval={1500}
      />
    );
  }

  return (
    <ParticipantLayout title="Jornadas">
      <Container maxWidth="lg">
        <Breadcrumbs 
          sx={{ 
            mb: 3,
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
            Jornadas
          </Typography>
        </Breadcrumbs>

        <Box sx={{ position: 'relative', mb: 4 }}>
          <Box sx={{ textAlign: 'center' }}>
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
              Jornadas
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.875rem',
                mt: 0.5,
              }}
            >
              Explore e acesse suas jornadas disponíveis
            </Typography>
          </Box>
        </Box>

        {erro && (
          <AlertFixed 
            severity="error"
            message={erro}
            onClose={() => setErro('')}
          />
        )}

        {/* Barra de pesquisa e visualização */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              placeholder="Pesquisar jornadas..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              size="small"
              sx={{
                flex: 1,
                minWidth: 250,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#ff2c19',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ff2c19',
                  },
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#6b7280' }} />
                  </InputAdornment>
                ),
              }}
            />
            <ToggleButtonGroup
              value={visualizacao}
              exclusive
              onChange={(_, newValue) => {
                if (newValue !== null) {
                  setVisualizacao(newValue);
                }
              }}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  borderColor: '#e0e0e0',
                  color: '#6b7280',
                  '&.Mui-selected': {
                    backgroundColor: '#ff2c19',
                    color: '#ffffff',
                    borderColor: '#ff2c19',
                    '&:hover': {
                      backgroundColor: '#e62816',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 44, 25, 0.08)',
                  },
                },
              }}
            >
              <ToggleButton value="tabela" aria-label="visualização em tabela">
                <TableChartIcon sx={{ mr: 1 }} />
                Tabela
              </ToggleButton>
              <ToggleButton value="cards" aria-label="visualização em cards">
                <ViewModuleIcon sx={{ mr: 1 }} />
                Cards
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Paper>

        {/* Visualização em Tabela */}
        {visualizacao === 'tabela' && (
          <>
          <TableContainer 
            component={Paper}
            sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden',
            }}
          >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#011b49' }}>
                  Título
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#011b49' }}>
                  Fase Atual
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#011b49' }}>
                  Total de Fases
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#011b49' }}>
                  Ações
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jornadasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                      {pesquisa ? 'Nenhuma jornada encontrada' : 'Nenhuma jornada disponível'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                jornadasPaginadasTabela.map((jornada) => (
                  <TableRow 
                    key={jornada.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#011b49' }}>
                        {jornada.titulo}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {jornada.todasFasesAbertas ? (
                        <Chip
                          label="Fases Abertas"
                          color="success"
                          size="small"
                          sx={{ fontWeight: 500 }}
                        />
                      ) : jornada.faseAtual ? (
                        <Chip
                          label={`${jornada.faseAtual.ordem}ª - ${jornada.faseAtual.titulo}`}
                          color="primary"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sem fase
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={jornada._count.fases} 
                        size="small" 
                        color="default"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/participante/jornadas/${jornada.id}/fases`)}
                          title="Acessar Jornada"
                          sx={{
                            color: '#2196F3',
                            '&:hover': {
                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                              transform: 'scale(1.1)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <PlayArrowIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Paginação da tabela */}
        {jornadasFiltradas.length > itensPorPaginaTabela && totalPaginasTabela > 1 && (
          <Box
            sx={{
              mt: 3,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <IconButton
              onClick={() => handleMudarPaginaTabela({} as React.ChangeEvent<unknown>, paginaAtualTabela - 1)}
              disabled={paginaAtualTabela === 1}
              sx={{
                color: '#011b49',
                '&:hover': {
                  backgroundColor: 'rgba(1, 27, 73, 0.08)',
                },
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              }}
            >
              <ChevronLeftIcon sx={{ fontSize: '1.5rem' }} />
            </IconButton>
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 400,
                color: '#6b7280',
                fontSize: '0.875rem',
                minWidth: '80px',
                textAlign: 'center',
              }}
            >
              Página {paginaAtualTabela} de {totalPaginasTabela}
            </Typography>
            <IconButton
              onClick={() => handleMudarPaginaTabela({} as React.ChangeEvent<unknown>, paginaAtualTabela + 1)}
              disabled={paginaAtualTabela === totalPaginasTabela}
              sx={{
                color: '#011b49',
                '&:hover': {
                  backgroundColor: 'rgba(1, 27, 73, 0.08)',
                },
                '&.Mui-disabled': {
                  opacity: 0.3,
                },
              }}
            >
              <ChevronRightIcon sx={{ fontSize: '1.5rem' }} />
            </IconButton>
          </Box>
        )}
        {totalPaginasTabela === 1 && jornadasFiltradas.length > 0 && (
          <Box
            sx={{
              mt: 3,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 400,
                color: '#6b7280',
                fontSize: '0.875rem',
              }}
            >
              Página 1 de 1
            </Typography>
          </Box>
        )}
        </>
        )}

        {/* Visualização em Cards */}
        {visualizacao === 'cards' && (
          jornadasFiltradas.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {pesquisa ? 'Nenhuma jornada encontrada' : 'Nenhuma jornada disponível'}
              </Typography>
            </Paper>
          ) : (
          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 4,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
              bgcolor: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid',
              borderColor: 'rgba(0, 0, 0, 0.08)',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              overflow: 'hidden',
              height: 'calc(100vh - 240px)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Grid 
              container 
              spacing={2}
              sx={{
                width: '100%',
                margin: 0,
                boxSizing: 'border-box',
                flex: 1,
                overflowY: 'auto',
                overflowX: 'hidden',
                pb: 2,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '4px',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.3)',
                  },
                },
              }}
            >
              {jornadasPaginadasCards.map((jornada) => (
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={4} 
                  key={jornada.id}
                  sx={{
                    display: 'flex',
                  }}
                >
                  <Card
                    sx={{
                      width: '100%',
                      height: 280,
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                      filter: !jornada.ativo ? 'grayscale(0.8)' : 'none',
                      opacity: !jornada.ativo ? 0.7 : 1,
                      position: 'relative',
                      '&:hover': {
                        transform: jornada.ativo ? 'translateY(-4px)' : 'none',
                        boxShadow: jornada.ativo 
                          ? '0 6px 20px rgba(0,0,0,0.15)' 
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        borderColor: jornada.ativo ? '#ff2c19' : 'divider',
                      },
                    }}
                  >
                    {/* Container com título e imagem sobrepostos */}
                    <Box sx={{ position: 'relative', flexShrink: 0 }}>
                      {/* Imagem de fundo */}
                      {jornada.imagemCapa ? (
                        <Box
                          component="img"
                          src={jornada.imagemCapa}
                          alt={jornada.titulo}
                          sx={{
                            width: '100%',
                            height: 170,
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease',
                            display: 'block',
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            height: 170,
                            background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: 'linear-gradient(135deg, rgba(255, 44, 25, 0.05) 0%, rgba(255, 44, 25, 0.1) 100%)',
                            },
                          }}
                        >
                          <RouteIcon sx={{ color: '#ff2c19', fontSize: 48, position: 'relative', zIndex: 1 }} />
                        </Box>
                      )}
                      
                      {/* Título sobreposto com gradiente */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          p: 2,
                          pb: 4,
                          background: 'linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 60%, rgba(255, 255, 255, 0) 100%)',
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700, 
                            color: '#011b49', 
                            fontSize: '1rem',
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            textAlign: 'center',
                          }}
                        >
                          {jornada.titulo}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <CardContent sx={{ p: 2, pt: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: { xs: 'flex-start', sm: 'center' }, 
                          justifyContent: 'space-between',
                          gap: { xs: 1, sm: 1.5 },
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'rgba(0, 0, 0, 0.02)',
                          flexShrink: 0,
                        }}
                      >
                        {/* Fase Atual */}
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            flex: 1,
                            minWidth: 0,
                            width: { xs: '100%', sm: 'auto' },
                          }}
                        >
                          {jornada.todasFasesAbertas ? (
                            <Chip
                              label="Fases Abertas"
                              color="success"
                              size="small"
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          ) : jornada.faseAtual ? (
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontWeight: 500, 
                                color: '#011b49', 
                                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Fase {jornada.faseAtual.ordem}
                            </Typography>
                          ) : (
                            <Typography 
                              variant="body2" 
                              color="text.secondary" 
                              sx={{ 
                                fontWeight: 500, 
                                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                              }}
                            >
                              {jornada._count.fases} fase{jornada._count.fases !== 1 ? 's' : ''}
                            </Typography>
                          )}
                        </Box>

                        {/* Pontuação */}
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            flexShrink: 0,
                            alignSelf: { xs: 'flex-end', sm: 'auto' },
                          }}
                        >
                          <TrophyIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: '#FFC107' }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 700, 
                              color: '#011b49', 
                              fontSize: { xs: '0.8rem', sm: '0.85rem' }, 
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {jornada.pontuacaoObtida || 0}/{jornada.pontuacaoTotal || 0}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', p: 1.5, pt: 0, borderTop: 'none', gap: 0.75, flexShrink: 0 }}>
                      <Button
                        fullWidth
                        size="medium"
                        onClick={() => navigate(`/participante/jornadas/${jornada.id}/fases`)}
                        startIcon={<PlayArrowIcon />}
                        sx={{
                          color: '#fff',
                          bgcolor: '#2196F3',
                          border: 'none',
                          borderRadius: 2,
                          px: 2,
                          py: 1,
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          boxShadow: '0 2px 8px rgba(33, 150, 243, 0.25)',
                          '& .MuiSvgIcon-root': {
                            fontSize: 20,
                          },
                          '&:hover': {
                            backgroundColor: '#1976D2',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 16px rgba(33, 150, 243, 0.4)',
                          },
                        }}
                      >
                        Acessar Jornada
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Barra de paginação tipo footer - sempre visível */}
            <Box
              sx={{
                mt: 'auto',
                paddingTop: '11px',
                borderTop: '1px solid',
                borderColor: 'rgba(0, 0, 0, 0.12)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              {jornadasFiltradas.length > itensPorPaginaCards && totalPaginasCards > 1 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <IconButton
                    onClick={() => handleMudarPaginaCards({} as React.ChangeEvent<unknown>, paginaAtualCards - 1)}
                    disabled={paginaAtualCards === 1}
                    sx={{
                      color: '#011b49',
                      '&:hover': {
                        backgroundColor: 'rgba(1, 27, 73, 0.08)',
                      },
                      '&.Mui-disabled': {
                        opacity: 0.3,
                      },
                    }}
                  >
                    <ChevronLeftIcon sx={{ fontSize: '1.5rem' }} />
                  </IconButton>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 400,
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      minWidth: '80px',
                      textAlign: 'center',
                    }}
                  >
                    Página {paginaAtualCards} de {totalPaginasCards}
                  </Typography>
                  <IconButton
                    onClick={() => handleMudarPaginaCards({} as React.ChangeEvent<unknown>, paginaAtualCards + 1)}
                    disabled={paginaAtualCards === totalPaginasCards}
                    sx={{
                      color: '#011b49',
                      '&:hover': {
                        backgroundColor: 'rgba(1, 27, 73, 0.08)',
                      },
                      '&.Mui-disabled': {
                        opacity: 0.3,
                      },
                    }}
                  >
                    <ChevronRightIcon sx={{ fontSize: '1.5rem' }} />
                  </IconButton>
                </Box>
              ) : jornadasFiltradas.length > 0 ? (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 400,
                    color: '#6b7280',
                    fontSize: '0.875rem',
                  }}
                >
                  Página 1 de 1
                </Typography>
              ) : null}
            </Box>
          </Box>
          )
        )}
      </Container>
    </ParticipantLayout>
  );
};

export default Jornadas;

