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
  IconButton,
} from '@mui/material';
import {
  Route as RouteIcon,
  Home as HomeIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckCircleIcon,
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
          <Grid container spacing={3}>
            {jornadas.map((jornada: Jornada) => (
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
                      borderColor: '#ff2c19',
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
                  <CardActions sx={{ justifyContent: 'flex-end', p: 1.5, pt: 1, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'rgba(0, 0, 0, 0.01)', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/admin/jornadas/${jornada.id}/fases`)}
                      title="Ver Fases"
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
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </AdminLayout>
  );
};

export default AdminFases;

