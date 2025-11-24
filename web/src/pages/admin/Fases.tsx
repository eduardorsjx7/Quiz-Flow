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
} from '@mui/material';
import {
  Route as RouteIcon,
  PlayArrow as PlayArrowIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

interface Jornada {
  id: number;
  titulo: string;
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
            {jornadas.map((jornada) => (
              <Grid item xs={12} md={6} lg={4} key={jornada.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(`/admin/jornadas/${jornada.id}/fases`)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <RouteIcon color="primary" />
                      <Typography variant="h6" component="h2">
                        {jornada.titulo}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        label={`${jornada._count?.fases || 0} ${(jornada._count?.fases || 0) === 1 ? 'Fase' : 'Fases'}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                  <CardActions sx={{ p: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/jornadas/${jornada.id}/fases`);
                      }}
                      fullWidth
                      sx={{
                        bgcolor: '#e62816',
                        '&:hover': {
                          bgcolor: '#c52214',
                        },
                      }}
                    >
                      Ver Fases
                    </Button>
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

