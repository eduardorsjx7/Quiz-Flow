import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  AppBar,
  Toolbar,
  IconButton,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface Fase {
  id: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  jornada: {
    id: number;
    titulo: string;
  };
  _count: {
    quizzes: number;
  };
}

const AdminFases: React.FC = () => {
  const navigate = useNavigate();
  const [fases, setFases] = useState<Fase[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarFases();
  }, []);

  const carregarFases = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fases');
      const dados = response.data.data || response.data;
      setFases(Array.isArray(dados) ? dados : []);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar fases');
      setFases([]);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gerenciar Fases do PDC
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/admin')}
            sx={{ cursor: 'pointer' }}
          >
            Dashboard
          </Link>
          <Typography color="text.primary">Fases</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Fases do PDC</Typography>
        </Box>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        {fases.length === 0 ? (
          <Alert severity="info">
            Nenhuma fase cadastrada. Crie uma jornada primeiro para cadastrar fases.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {fases.map((fase) => (
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
                      {fase.jornada && (
                        <Chip
                          label={fase.jornada.titulo}
                          size="small"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
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
                        {(fase._count?.quizzes || 0) > 0 ? 'Quiz criado' : 'Sem perguntas'}
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
    </>
  );
};

export default AdminFases;

