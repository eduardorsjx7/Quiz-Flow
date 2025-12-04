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
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import ParticipantLayout from '../../components/ParticipantLayout';
import AlertFixed from '../../components/AlertFixed';
import { LoadingScreen } from '../../components/LoadingScreen';

interface Fase {
  id: number;
  titulo: string;
  descricao?: string;
  faseAtual: boolean;
  jornada: {
    id: number;
    titulo: string;
  };
  quizzes?: Array<{
    id: number;
    titulo: string;
    descricao?: string;
    _count: {
      perguntas: number;
    };
  }>;
}

const FaseAtual: React.FC = () => {
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
      // Garantir que quizzes seja sempre um array
      if (faseData && !faseData.quizzes) {
        faseData.quizzes = [];
      }
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
    return <LoadingScreen message="Carregando sua fase atual..." />;
  }

  return (
    <ParticipantLayout title="Fase Atual">
      <Container maxWidth="lg">
        {erro ? (
          <AlertFixed 
            severity="warning"
            message={erro}
            onClose={() => setErro('')}
          />
        ) : null}
        {fase ? (
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

            {(!fase.quizzes || fase.quizzes.length === 0) ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                Nenhum quiz disponível nesta fase no momento.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {fase.quizzes.map((quiz) => (
                  <Grid item xs={12} sm={6} md={4} key={quiz.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
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
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        ) : null}
      </Container>
    </ParticipantLayout>
  );
};

export default FaseAtual;

