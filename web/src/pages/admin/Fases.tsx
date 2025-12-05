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
  Breadcrumbs,
  Link,
  Stack,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Route as RouteIcon,
  Home as HomeIcon,
  School as SchoolIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Search as SearchIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

interface Jornada {
  id: number;
  titulo: string;
  imagemCapa?: string;
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
          <Alert severity="info" sx={{ mb: 3 }}>
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
                        height: 157,
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
                        height: 157,
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
                  <CardContent sx={{ p: 1, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden', justifyContent: 'center' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600, 
                          color: '#011b49', 
                          textAlign: 'center',
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
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center', p: 1, pt: 0.75, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0, 0, 0, 0.01)', gap: 0.75, flexShrink: 0 }}>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/admin/jornadas/${jornada.id}/fases`)}
                      sx={{
                        backgroundColor: '#011b49e0',
                        color: '#fff3e0',
                        '&:hover': {
                          backgroundColor: '#ff2c19',
                        },
                      }}
                      title="Ver Fases"
                    >
                      <SchoolIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/admin/jornadas/${jornada.id}/avaliacao`)}
                      sx={{
                        backgroundColor: '#011b49e0',
                        color: '#fff3e0',
                        '&:hover': {
                          backgroundColor: '#ff2c19',
                        },
                      }}
                      title="Avaliação"
                    >
                      <AssessmentIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/admin/jornadas/${jornada.id}/configurar`)}
                      sx={{
                        backgroundColor: '#011b49e0',
                        color: '#fff3e0',
                        '&:hover': {
                          backgroundColor: '#ff2c19',
                        },
                      }}
                      title="Configurar"
                    >
                      <SettingsIcon />
                    </IconButton>
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

