import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Breadcrumbs,
  Link,
  Button,
  Stack,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Route as RouteIcon,
  Home as HomeIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

interface Jornada {
  id: number;
  titulo: string;
  imagemCapa?: string;
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

const AdminFases: React.FC = () => {
  const navigate = useNavigate();
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [pesquisa, setPesquisa] = useState('');
  const itensPorPagina = 6;

  useEffect(() => {
    carregarJornadas();
  }, []);

  const carregarJornadas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jornadas');
      const dados = response.data.data || response.data;
      setJornadas(Array.isArray(dados) ? dados : []);
      setPaginaAtual(1); // Resetar para primeira página ao carregar
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar jornadas');
      setJornadas([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar jornadas por pesquisa
  const jornadasFiltradas = jornadas.filter((jornada: Jornada) =>
    jornada.titulo.toLowerCase().includes(pesquisa.toLowerCase())
  );

  // Calcular jornadas paginadas - sempre no máximo 6 cards por página
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const jornadasPaginadas = jornadasFiltradas.slice(indiceInicio, Math.min(indiceFim, jornadasFiltradas.length));
  const totalPaginas = Math.ceil(jornadasFiltradas.length / itensPorPagina);

  // Resetar página quando pesquisa mudar
  React.useEffect(() => {
    setPaginaAtual(1);
  }, [pesquisa]);

  const handleMudarPagina = (event: React.ChangeEvent<unknown>, value: number) => {
    setPaginaAtual(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  if (loading) {
    return (
      <AdminLayout title="Fases das Jornadas">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Fases das Jornadas">
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
            Fases das Jornadas
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 4 }}>
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
              Fases das Jornadas
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.875rem',
                mt: 0.5,
              }}
            >
              Visualize e gerencie todas as fases
            </Typography>
          </Box>
        </Box>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        {jornadas.length === 0 ? (
          <Alert severity="info">
            Nenhuma jornada cadastrada. Crie uma jornada primeiro para cadastrar fases e perguntas.
          </Alert>
        ) : (
          <>
          {/* Barra de pesquisa */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              mb: 2,
            }}
          >
            <TextField
              placeholder="Pesquisar jornadas..."
              value={pesquisa}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPesquisa(e.target.value)}
              size="small"
              sx={{
                width: { xs: '100%', sm: '300px' },
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#fff',
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
          </Box>
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
              {jornadasPaginadas.map((jornada: Jornada) => (
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
                        height: 135,
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
                      onClick={() => navigate(`/admin/jornadas/${jornada.id}/fases`)}
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
                      Ver Fases
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
              {jornadas.length > itensPorPagina && totalPaginas > 1 ? (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <IconButton
                    onClick={() => handleMudarPagina({} as React.ChangeEvent<unknown>, paginaAtual - 1)}
                    disabled={paginaAtual === 1}
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
                    Página {paginaAtual} de {totalPaginas}
                  </Typography>
                  <IconButton
                    onClick={() => handleMudarPagina({} as React.ChangeEvent<unknown>, paginaAtual + 1)}
                    disabled={paginaAtual === totalPaginas}
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
              ) : totalPaginas === 1 && jornadas.length > 0 ? (
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
          </>
        )}
      </Container>
    </AdminLayout>
  );
};

export default AdminFases;

