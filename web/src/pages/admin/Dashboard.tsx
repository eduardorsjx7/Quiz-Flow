import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Box,
  IconButton
} from '@mui/material';
import {
  Quiz as QuizIcon,
  Assessment as AssessmentIcon,
  ExitToApp as ExitToAppIcon,
  People as PeopleIcon,
  Route as RouteIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { usuario, logout } = useAuth();
  const [estatisticas, setEstatisticas] = useState({
    totalQuizzes: 0,
    totalTentativas: 0,
    totalUsuarios: 0
  });

  useEffect(() => {
    carregarEstatisticas();
  }, []);

  const carregarEstatisticas = async () => {
    try {
      const [quizzesRes] = await Promise.all([
        api.get('/quizzes')
      ]);

      const quizzesData = quizzesRes.data.data || quizzesRes.data;
      setEstatisticas({
        totalQuizzes: Array.isArray(quizzesData) ? quizzesData.length : 0,
        totalTentativas: 0, // Implementar quando necessário
        totalUsuarios: 0 // Implementar quando necessário
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Quiz Flow - Painel Administrativo
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {usuario?.nome}
          </Typography>
          <IconButton color="inherit" onClick={logout}>
            <ExitToAppIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <QuizIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                  <Typography variant="h4">{estatisticas.totalQuizzes}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Quizzes Cadastrados
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AssessmentIcon sx={{ fontSize: 40, color: 'secondary.main', mr: 2 }} />
                  <Typography variant="h4">{estatisticas.totalTentativas}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Tentativas Realizadas
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<RouteIcon />}
                onClick={() => navigate('/admin/jornadas')}
                sx={{ py: 2 }}
              >
                Jornadas
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<QuizIcon />}
                onClick={() => navigate('/admin/fases')}
                sx={{ py: 2 }}
              >
                Fases
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<PeopleIcon />}
                onClick={() => navigate('/admin/usuarios')}
                sx={{ py: 2 }}
              >
                Usuários
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<AssessmentIcon />}
                onClick={() => navigate('/admin/relatorios')}
                sx={{ py: 2 }}
              >
                Relatórios
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
};

export default AdminDashboard;

