import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
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
  Quiz as QuizIcon,
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

interface Fase {
  id: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  totalPerguntas?: number;
  _count: {
    quizzes: number;
  };
}

interface Jornada {
  id: number;
  titulo: string;
  fases: Fase[];
}

const FasesJornada: React.FC = () => {
  const { jornadaId } = useParams<{ jornadaId: string }>();
  const navigate = useNavigate();
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregarFasesJornada = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jornadas/${jornadaId}`);
      const dados = response.data.data || response.data;
      setJornada(dados);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar fases da jornada');
    } finally {
      setLoading(false);
    }
  }, [jornadaId]);

  useEffect(() => {
    if (jornadaId) {
      carregarFasesJornada();
    }
  }, [jornadaId, carregarFasesJornada]);

  if (loading) {
    return (
      <AdminLayout title="Fases da Jornada">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (erro || !jornada) {
    return (
      <AdminLayout title="Fases da Jornada">
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro || 'Jornada não encontrada'}
          </Alert>
          <Button onClick={() => navigate('/admin/fases')} startIcon={<ArrowBackIcon />}>
            Voltar
          </Button>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Fases - ${jornada.titulo}`}>
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
          <Link
            component="button"
            onClick={() => navigate('/admin/fases')}
            sx={{ 
              cursor: 'pointer', 
              textDecoration: 'none',
              color: 'text.secondary',
              transition: 'all 0.2s ease',
              borderRadius: 1,
              px: 0.75,
              py: 0.5,
              fontWeight: 400,
              '&:hover': { 
                color: 'primary.main',
                bgcolor: 'rgba(0, 0, 0, 0.04)',
                textDecoration: 'none',
              },
            }}
          >
            Fases das Jornadas
          </Link>
          <Typography 
            color="text.primary"
            sx={{
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            {jornada.titulo}
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => navigate('/admin/fases')} 
              size="small"
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
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
                {jornada.titulo}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  mt: 0.5,
                }}
              >
                Gerencie as fases desta jornada e cadastre as perguntas
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<SettingsIcon />}
            onClick={() => navigate(`/admin/jornadas/${jornadaId}/configurar`)}
            sx={{
              bgcolor: '#ff2c19',
              '&:hover': {
                bgcolor: '#e62816',
              },
            }}
          >
            Configurar Jornada
          </Button>
        </Box>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        {jornada.fases.length === 0 ? (
          <Alert severity="info">
            Nenhuma fase cadastrada nesta jornada ainda.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {jornada.fases.map((fase) => (
              <Grid item xs={12} md={6} lg={4} key={fase.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Chip label={`${fase.ordem}º`} size="small" color="primary" />
                    </Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {fase.titulo}
                    </Typography>
                    {fase.descricao && (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {fase.descricao}
                      </Typography>
                    )}
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <QuizIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {(fase.totalPerguntas || 0) > 0 
                          ? `${fase.totalPerguntas} ${fase.totalPerguntas === 1 ? 'Pergunta' : 'Perguntas'}` 
                          : 'Sem perguntas'}
                      </Typography>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<QuizIcon />}
                      onClick={() => navigate(`/admin/fases/${fase.id}/perguntas`)}
                      fullWidth
                      sx={{
                        bgcolor: '#e62816',
                        '&:hover': {
                          bgcolor: '#c52214',
                        },
                      }}
                    >
                      Gerenciar Perguntas
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

export default FasesJornada;

