import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  CheckCircle as CheckIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import ParticipantLayout from '../../components/ParticipantLayout';

interface Quiz {
  id: number;
  titulo: string;
  descricao?: string;
  status: 'pendente' | 'em_andamento' | 'concluido';
  tentativa?: {
    id: number;
    status: string;
    pontuacaoTotal: number;
    finalizadaEm?: string;
  };
  fase: {
    id: number;
    titulo: string;
  };
  _count: {
    perguntas: number;
  };
}

const DashboardColaborador: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [abaAtiva, setAbaAtiva] = useState(0);

  useEffect(() => {
    carregarQuizzes();
  }, []);

  const carregarQuizzes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/quizzes/disponiveis');
      setQuizzes(response.data.data || response.data);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar quizzes');
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

  const handleContinuarQuiz = (tentativaId: number) => {
    navigate(`/participante/quiz/${tentativaId}`);
  };

  const handleVerResultado = (tentativaId: number) => {
    navigate(`/participante/resultado/${tentativaId}`);
  };

  const quizzesPendentes = quizzes.filter((q) => q.status === 'pendente');
  const quizzesEmAndamento = quizzes.filter((q) => q.status === 'em_andamento');
  const quizzesConcluidos = quizzes.filter((q) => q.status === 'concluido');

  const quizzesExibidos =
    abaAtiva === 0
      ? quizzesPendentes
      : abaAtiva === 1
      ? quizzesEmAndamento
      : quizzesConcluidos;

  if (loading) {
    return (
      <ParticipantLayout title="Dashboard">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout title="Dashboard">
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom>
          Meus Quizzes
        </Typography>

        {erro && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {erro}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={abaAtiva} onChange={(_, novoValor) => setAbaAtiva(novoValor)}>
            <Tab
              label={`Pendentes (${quizzesPendentes.length})`}
              icon={<TimeIcon />}
              iconPosition="start"
            />
            <Tab
              label={`Em Andamento (${quizzesEmAndamento.length})`}
              icon={<PlayIcon />}
              iconPosition="start"
            />
            <Tab
              label={`Concluídos (${quizzesConcluidos.length})`}
              icon={<CheckIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Box>

        {quizzesExibidos.length === 0 ? (
          <Alert severity="info">
            {abaAtiva === 0
              ? 'Nenhum quiz pendente no momento.'
              : abaAtiva === 1
              ? 'Nenhum quiz em andamento.'
              : 'Nenhum quiz concluído ainda.'}
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {quizzesExibidos.map((quiz) => (
              <Grid item xs={12} md={6} lg={4} key={quiz.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                      <Typography variant="h6" component="h2">
                        {quiz.titulo}
                      </Typography>
                      <Chip
                        label={
                          quiz.status === 'pendente'
                            ? 'Pendente'
                            : quiz.status === 'em_andamento'
                            ? 'Em Andamento'
                            : 'Concluído'
                        }
                        color={
                          quiz.status === 'pendente'
                            ? 'default'
                            : quiz.status === 'em_andamento'
                            ? 'warning'
                            : 'success'
                        }
                        size="small"
                      />
                    </Box>
                    {quiz.descricao && (
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {quiz.descricao}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      Fase: {quiz.fase.titulo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {quiz._count.perguntas} {quiz._count.perguntas === 1 ? 'pergunta' : 'perguntas'}
                    </Typography>
                    {quiz.tentativa && quiz.status === 'concluido' && (
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                        Pontuação: {quiz.tentativa.pontuacaoTotal} pontos
                      </Typography>
                    )}
                  </CardContent>
                  <CardActions>
                    {quiz.status === 'pendente' && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PlayIcon />}
                        onClick={() => handleIniciarQuiz(quiz.id)}
                        fullWidth
                      >
                        Iniciar Quiz
                      </Button>
                    )}
                    {quiz.status === 'em_andamento' && quiz.tentativa && (
                      <Button
                        size="small"
                        variant="contained"
                        color="warning"
                        startIcon={<PlayIcon />}
                        onClick={() => handleContinuarQuiz(quiz.tentativa!.id)}
                        fullWidth
                      >
                        Continuar Quiz
                      </Button>
                    )}
                    {quiz.status === 'concluido' && quiz.tentativa && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CheckIcon />}
                        onClick={() => handleVerResultado(quiz.tentativa!.id)}
                        fullWidth
                      >
                        Ver Resultado
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </ParticipantLayout>
  );
};

export default DashboardColaborador;

