import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  ExitToApp as ExitIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Fase {
  id: number;
  titulo: string;
  descricao?: string;
  faseAtual: boolean;
  jornada: {
    id: number;
    titulo: string;
  };
  quizzes: Array<{
    id: number;
    titulo: string;
    descricao?: string;
    _count: {
      perguntas: number;
    };
  }>;
}

const FaseAtual: React.FC = () => {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [fase, setFase] = useState<Fase | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    carregarFaseAtual();
  }, []);

  const carregarFaseAtual = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fases/atual');
      const faseData = response.data.data || response.data;
      setFase(faseData);
    } catch (error: any) {
      if (error.response?.status === 404 || !error.response?.data?.data) {
        setErro('Você ainda não possui uma fase atribuída. Entre em contato com o administrador.');
      } else {
        setErro(error.response?.data?.error || 'Erro ao carregar fase atual');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarQuiz = async (quizId: number) => {
    try {
      const response = await api.post(`/tentativas/quiz/${quizId}/iniciar`);
      const tentativa = response.data.data;
      navigate(`/participante/quiz/${tentativa.id}`);
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao iniciar quiz');
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
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Quiz Flow - Minha Fase Atual
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {usuario?.nome}
          </Typography>
          <IconButton color="inherit" onClick={logout}>
            <ExitIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {erro ? (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {erro}
          </Alert>
        ) : fase ? (
          <>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h4" gutterBottom>
                {fase.titulo}
              </Typography>
              {fase.jornada && (
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Jornada: {fase.jornada.titulo}
                </Typography>
              )}
              {fase.descricao && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {fase.descricao}
                </Typography>
              )}
              <Chip
                label="Fase Atual"
                color="primary"
                sx={{ mt: 2 }}
              />
            </Paper>

            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
              Quizzes Disponíveis
            </Typography>

            {fase.quizzes.length === 0 ? (
              <Alert severity="info">
                Nenhum quiz disponível nesta fase no momento.
              </Alert>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                {fase.quizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {quiz.titulo}
                      </Typography>
                      {quiz.descricao && (
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {quiz.descricao}
                        </Typography>
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {quiz._count.perguntas} {quiz._count.perguntas === 1 ? 'pergunta' : 'perguntas'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button
                        variant="contained"
                        startIcon={<PlayIcon />}
                        onClick={() => handleIniciarQuiz(quiz.id)}
                        fullWidth
                      >
                        Iniciar Quiz
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </>
        ) : null}
      </Container>
    </>
  );
};

export default FaseAtual;

