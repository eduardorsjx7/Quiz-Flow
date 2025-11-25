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
  LockOpen as LockOpenIcon,
  PlayArrow as PlayArrowIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext';

interface Jornada {
  id: number;
  titulo: string;
  imagemCapa?: string;
  ordem: number;
  ativo: boolean;
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

  useEffect(() => {
    carregarJornadas();
  }, []);

  const carregarJornadas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jornadas');
      const dados = response.data.data || response.data;
      setJornadas(Array.isArray(dados) ? dados : []);
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

  if (loading) {
    return (
      <AdminLayout title="Jornadas">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
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
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/jornadas/novo')}
            sx={{
              bgcolor: '#ff2c19',
              '&:hover': {
                bgcolor: '#e62816',
              },
            }}
          >
            Nova Jornada
          </Button>
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
                jornadasFiltradas.map((jornada) => (
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
                          title="Ver Detalhes"
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
        )}

        {/* Visualização em Cards */}
        {visualizacao === 'cards' && (
          <Grid container spacing={3}>
            {jornadasFiltradas.length === 0 ? (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {pesquisa ? 'Nenhuma jornada encontrada' : 'Nenhuma jornada cadastrada'}
                  </Typography>
                </Paper>
              </Grid>
            ) : (
              jornadasFiltradas.map((jornada) => (
                <Grid item xs={12} sm={6} md={4} key={jornada.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        borderColor: jornada.ativo ? '#ff2c19' : '#e0e0e0',
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
                          height: 140,
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: '100%',
                          height: 140,
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
                    <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#011b49', 
                            flex: 1,
                            fontSize: '1rem',
                            lineHeight: 1.3,
                          }}
                        >
                          {jornada.titulo}
                        </Typography>
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
                            <Chip
                              {...(temIcone && { icon: <CheckCircleIcon /> })}
                              label={label}
                              color={color}
                              size="small"
                              sx={{
                                fontWeight: 500,
                                ml: 1,
                                fontSize: '0.7rem',
                                height: 24,
                              }}
                            />
                          );
                        })()}
                      </Box>
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: 1, 
                          mb: 0.5,
                          p: 1,
                          borderRadius: 2,
                          bgcolor: 'rgba(0, 0, 0, 0.02)',
                        }}
                      >
                        {jornada.todasFasesAbertas ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                            <LockOpenIcon sx={{ color: '#4caf50', fontSize: 18 }} />
                            <Chip
                              label="Fases Abertas"
                              size="small"
                              color="success"
                              sx={{ fontWeight: 600 }}
                            />
                          </Box>
                        ) : jornada.faseAtual ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <PlayArrowIcon sx={{ color: '#2196F3', fontSize: 18 }} />
                            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                              Fase Atual:
                            </Typography>
                            <Chip
                              label={`${jornada.faseAtual.ordem}ª - ${jornada.faseAtual.titulo}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontWeight: 500 }}
                            />
                          </Box>
                        ) : null}
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: 1,
                            pt: jornada.todasFasesAbertas || jornada.faseAtual ? 0.5 : 0,
                            borderTop: jornada.todasFasesAbertas || jornada.faseAtual ? '1px solid' : 'none',
                            borderColor: 'divider',
                          }}
                        >
                          <RouteIcon sx={{ color: '#6b7280', fontSize: 16 }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                            Total de Fases:
                          </Typography>
                          <Chip 
                            label={jornada._count.fases} 
                            size="small" 
                            color="default"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'flex-end', p: 1.5, pt: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0, 0, 0, 0.01)', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/jornadas/${jornada.id}`)}
                        title="Ver Detalhes"
                        sx={{
                          color: '#2196F3',
                          bgcolor: 'rgba(33, 150, 243, 0.08)',
                          border: '1px solid',
                          borderColor: 'rgba(33, 150, 243, 0.2)',
                          borderRadius: 1.5,
                          width: 36,
                          height: 36,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            backgroundColor: '#2196F3',
                            color: '#fff',
                            borderColor: '#2196F3',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                          },
                        }}
                      >
                        <ViewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/jornadas/${jornada.id}/configurar`)}
                        title="Configurar Jornada"
                        sx={{
                          color: '#FF9800',
                          bgcolor: 'rgba(255, 152, 0, 0.08)',
                          border: '1px solid',
                          borderColor: 'rgba(255, 152, 0, 0.2)',
                          borderRadius: 1.5,
                          width: 36,
                          height: 36,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            backgroundColor: '#FF9800',
                            color: '#fff',
                            borderColor: '#FF9800',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(255, 152, 0, 0.3)',
                          },
                        }}
                      >
                        <SettingsIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeletar(jornada.id)}
                        title="Deletar Jornada"
                        sx={{
                          color: '#f44336',
                          bgcolor: 'rgba(244, 67, 54, 0.08)',
                          border: '1px solid',
                          borderColor: 'rgba(244, 67, 54, 0.2)',
                          borderRadius: 1.5,
                          width: 36,
                          height: 36,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          '&:hover': {
                            backgroundColor: '#f44336',
                            color: '#fff',
                            borderColor: '#f44336',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                          },
                        }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}
      </Container>
    </AdminLayout>
  );
};

export default AdminJornadas;

