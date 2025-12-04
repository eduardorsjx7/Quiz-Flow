import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
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
  Alert,
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
  Stack,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  Search as SearchIcon,
  TableChart as TableChartIcon,
  ViewModule as ViewModuleIcon,
  Route as RouteIcon,
  CheckCircle as CheckCircleIcon,
  Home as HomeIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext';

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
}

const AdminJornadas: React.FC = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [pesquisa, setPesquisa] = useState('');
  const [visualizacao, setVisualizacao] = useState<'tabela' | 'cards'>('tabela');
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
      const jornadasArray = Array.isArray(dados) ? dados : [];
      
      // Ordenar por data de criação (mais recentes primeiro)
      const jornadasOrdenadas = jornadasArray.sort((a: Jornada, b: Jornada) => {
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

  const handleDeletar = async (id: number) => {
    const jornada = jornadas.find(j => j.id === id);
    const resultado = await confirm({
      title: 'Excluir jornada?',
      message: `Tem certeza que deseja excluir a jornada "${jornada?.titulo}"? Todas as fases e quizzes serão excluídos também. Esta ação não pode ser desfeita.`,
      confirmText: 'Sim, excluir',
      cancelText: 'Cancelar',
      type: 'delete',
    });

    if (resultado) {
      try {
        await api.delete(`/jornadas/${id}`);
        carregarJornadas();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Erro ao deletar jornada');
      }
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
    return <LoadingScreen message="Carregando jornadas..." />;
  }

  return (
    <AdminLayout title="Jornadas">
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
            onClick={() => navigate('/admin')}
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
              Gerencie suas jornadas e fases
            </Typography>
          </Box>
          <IconButton
            onClick={() => navigate('/admin/jornadas/novo')}
            sx={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 48,
              height: 48,
              bgcolor: '#ff2c19',
              color: '#ffffff',
              border: '2px solid #e62816',
              borderRadius: '50%',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                bgcolor: '#e62816',
                transform: 'translateY(-50%) scale(1.1)',
                boxShadow: '0 4px 12px rgba(255, 44, 25, 0.4)',
              },
            }}
            title="Criar Nova Jornada"
          >
            <AddIcon />
          </IconButton>
        </Box>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
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
          <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell align="center">Fase Atual</TableCell>
                <TableCell align="center">Total de Fases</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {jornadasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {pesquisa ? 'Nenhuma jornada encontrada' : 'Nenhuma jornada cadastrada'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                jornadasPaginadasTabela.map((jornada) => (
                  <TableRow key={jornada.id}>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
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
                        />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Sem fase
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={jornada._count.fases} size="small" color="default" />
                    </TableCell>
                    <TableCell align="center">
                      {(() => {
                        // Se está inativa e não tem sequência de desbloqueio (todasFasesAbertas = true ou sem fases), está "Fechada"
                        const estaFechada = !jornada.ativo && (jornada.todasFasesAbertas || jornada._count.fases === 0);
                        // Se está inativa e tem sequência de desbloqueio (todasFasesAbertas = false), está "Bloqueada"
                        const estaBloqueada = !jornada.ativo && !jornada.todasFasesAbertas && jornada._count.fases > 0;
                        
                        let label = 'Ativa';
                        let color: 'success' | 'default' | 'warning' | 'error' = 'success';
                        
                        if (estaFechada) {
                          label = 'Fechada';
                          color = 'default';
                        } else if (estaBloqueada) {
                          label = 'Bloqueada';
                          color = 'error';
                        } else if (jornada.ativo) {
                          label = 'Ativa';
                          color = 'success';
                        } else {
                          label = 'Inativa';
                          color = 'default';
                        }
                        
                        return (
                          <Chip
                            label={label}
                            color={color}
                            size="small"
                          />
                        );
                      })()}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/jornadas/${jornada.id}`)}
                          title="Detalhes"
                          sx={{
                            color: '#2196F3',
                            '&:hover': {
                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            },
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/jornadas/${jornada.id}/configurar`)}
                          title="Configurar Jornada"
                          sx={{
                            color: '#FF9800',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            },
                          }}
                        >
                          <SettingsIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeletar(jornada.id)}
                          title="Deletar Jornada"
                          sx={{
                            color: '#f44336',
                            '&:hover': {
                              backgroundColor: 'rgba(244, 67, 54, 0.1)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
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
                {pesquisa ? 'Nenhuma jornada encontrada' : 'Nenhuma jornada cadastrada'}
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
                      height: 250,
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
                      '&:hover': {
                        transform: jornada.ativo ? 'translateY(-4px)' : 'none',
                        boxShadow: jornada.ativo 
                          ? '0 6px 20px rgba(0,0,0,0.15)' 
                          : '0 2px 8px rgba(0,0,0,0.1)',
                        borderColor: jornada.ativo ? '#ff2c19' : 'divider',
                      },
                    }}
                  >
                    {jornada.imagemCapa ? (
                      <Box
                        component="img"
                        src={jornada.imagemCapa}
                        alt={jornada.titulo}
                        sx={{
                          width: '100%',
                          height: 90,
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease',
                          flexShrink: 0,
                          '&:hover': {
                            transform: jornada.ativo ? 'scale(1.03)' : 'none',
                          },
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 90,
                          background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          flexShrink: 0,
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
                        <RouteIcon sx={{ color: '#ff2c19', fontSize: 32, position: 'relative', zIndex: 1 }} />
                      </Box>
                    )}
                    <CardContent sx={{ p: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1, minHeight: 0 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#011b49', 
                            flex: 1,
                            fontSize: '0.875rem',
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {jornada.titulo}
                        </Typography>
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 0.5, 
                          mb: 0.5,
                          p: 0.75,
                          borderRadius: 2,
                          bgcolor: 'rgba(0, 0, 0, 0.02)',
                          flexShrink: 0,
                        }}
                      >
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: 1,
                          }}
                        >
                          {(() => {
                            // Se está inativa e não tem sequência de desbloqueio (todasFasesAbertas = true ou sem fases), está "Fechada"
                            const estaFechada = !jornada.ativo && (jornada.todasFasesAbertas || jornada._count.fases === 0);
                            // Se está inativa e tem sequência de desbloqueio (todasFasesAbertas = false), está "Bloqueada"
                            const estaBloqueada = !jornada.ativo && !jornada.todasFasesAbertas && jornada._count.fases > 0;
                            
                            let label = 'Ativa';
                            let color: 'success' | 'default' | 'warning' | 'error' = 'success';
                            const temIcone = jornada.ativo && !estaFechada && !estaBloqueada;
                            
                            if (estaFechada) {
                              label = 'Fechada';
                              color = 'default';
                            } else if (estaBloqueada) {
                              label = 'Bloqueada';
                              color = 'error';
                            } else if (jornada.ativo) {
                              label = 'Ativa';
                              color = 'success';
                            } else {
                              label = 'Inativa';
                              color = 'default';
                            }
                            
                            return (
                              <>
                                <CheckCircleIcon sx={{ color: temIcone ? '#4caf50' : '#6b7280', fontSize: 16 }} />
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                  Status:
                                </Typography>
                                <Chip
                                  {...(temIcone && { icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> })}
                                  label={label}
                                  color={color}
                                  size="small"
                                  sx={{ fontWeight: 600 }}
                                />
                              </>
                            );
                          })()}
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'center', p: 1, pt: 0.75, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0, 0, 0, 0.01)', gap: 0.75, flexShrink: 0 }}>
                      <Button
                        size="small"
                        onClick={() => navigate(`/admin/jornadas/${jornada.id}`)}
                        startIcon={<ViewIcon />}
                        sx={{
                          color: '#2196F3',
                          bgcolor: 'rgba(33, 150, 243, 0.08)',
                          border: '1px solid',
                          borderColor: 'rgba(33, 150, 243, 0.2)',
                          borderRadius: 1.5,
                          px: 1.25,
                          py: 0.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '& .MuiSvgIcon-root': {
                            fontSize: 18,
                          },
                          '&:hover': {
                            backgroundColor: '#2196F3',
                            color: '#fff',
                            borderColor: '#2196F3',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                          },
                        }}
                      >
                        Detalhes
                      </Button>
                      <Button
                        size="small"
                        onClick={() => navigate(`/admin/jornadas/${jornada.id}/configurar`)}
                        startIcon={<SettingsIcon />}
                        sx={{
                          color: '#FF9800',
                          bgcolor: 'rgba(255, 152, 0, 0.08)',
                          border: '1px solid',
                          borderColor: 'rgba(255, 152, 0, 0.2)',
                          borderRadius: 1.5,
                          px: 1.25,
                          py: 0.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '& .MuiSvgIcon-root': {
                            fontSize: 18,
                          },
                          '&:hover': {
                            backgroundColor: '#FF9800',
                            color: '#fff',
                            borderColor: '#FF9800',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                          },
                        }}
                      >
                        Configurar
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleDeletar(jornada.id)}
                        startIcon={<DeleteIcon />}
                        sx={{
                          color: '#f44336',
                          bgcolor: 'rgba(244, 67, 54, 0.08)',
                          border: '1px solid',
                          borderColor: 'rgba(244, 67, 54, 0.2)',
                          borderRadius: 1.5,
                          px: 1.25,
                          py: 0.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '& .MuiSvgIcon-root': {
                            fontSize: 18,
                          },
                          '&:hover': {
                            backgroundColor: '#f44336',
                            color: '#fff',
                            borderColor: '#f44336',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                          },
                        }}
                      >
                        Deletar
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
              <Stack spacing={2.5} alignItems="center" sx={{ width: '100%' }}>
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
                ) : totalPaginasCards === 1 && jornadasFiltradas.length > 0 ? (
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
              </Stack>
            </Box>
          </Box>
          )
        )}
      </Container>
    </AdminLayout>
  );
};

export default AdminJornadas;

