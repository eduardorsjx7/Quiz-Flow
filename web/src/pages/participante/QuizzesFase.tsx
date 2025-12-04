import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Breadcrumbs,
  Link,
} from '@mui/material';
import { Home as HomeIcon, Quiz as QuizIcon } from '@mui/icons-material';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext';
import AlertFixed from '../../components/AlertFixed';

interface Quiz {
  id: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  pontosBase: number;
  _count?: {
    perguntas: number;
  };
}

interface Fase {
  id: number;
  titulo: string;
  descricao?: string;
  desbloqueada: boolean;
  jornada?: {
    id: number;
    titulo: string;
    tempoLimitePorQuestao?: number | null;
  };
}

const QuizzesFase: React.FC = () => {
  const { faseId } = useParams<{ faseId: string }>();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const [fase, setFase] = useState<Fase | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (faseId) {
      carregarFaseEQuizzes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faseId]);

  const carregarFaseEQuizzes = async () => {
    try {
      setLoading(true);
      const [faseResponse, quizzesResponse] = await Promise.all([
        api.get(`/fases/${faseId}`),
        api.get(`/quizzes?faseId=${faseId}`),
      ]);

      const faseData = faseResponse.data.data || faseResponse.data;
      setFase(faseData);
      setQuizzes(quizzesResponse.data.data || quizzesResponse.data);

      if (!faseData.desbloqueada) {
        setErro('Esta fase não está desbloqueada para você.');
      }
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleIniciarQuiz = async (quizId: number) => {
    const tempoLimite = fase?.jornada?.tempoLimitePorQuestao;
    
    let mensagem = 'Tem certeza que deseja iniciar este quiz?';
    if (tempoLimite && tempoLimite > 0) {
      mensagem = `Este quiz possui um tempo limite de ${tempoLimite} segundo${tempoLimite > 1 ? 's' : ''} por pergunta. Tem certeza que deseja iniciar?`;
    }

    const confirmado = await confirm({
      title: 'Confirmar Início do Quiz',
      message: mensagem,
      confirmText: 'Sim, iniciar',
      cancelText: 'Cancelar',
      type: 'info',
    });

    if (!confirmado) {
      return;
    }

    try {
      const response = await api.post(`/tentativas/quiz/${quizId}/iniciar`);
      const tentativa = response.data.data;
      navigate(`/participante/quiz/${tentativa.id}`);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao iniciar quiz');
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

  if (!fase || !fase.desbloqueada) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Esta fase não está disponível para você.
        </Alert>
        <Button onClick={() => navigate('/fases')} sx={{ mt: 2 }}>
          Voltar para Fases
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/fases')}
          sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Fases
        </Link>
        <Typography color="text.primary">{fase.titulo}</Typography>
      </Breadcrumbs>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" component="h1">
            {fase.titulo}
          </Typography>
          {fase.descricao && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {fase.descricao}
            </Typography>
          )}
        </Box>
        <Button variant="outlined" onClick={logout}>
          Sair
        </Button>
      </Box>

      {erro && (
        <AlertFixed 
          severity="error"
          message={erro}
          onClose={() => setErro('')}
        />
      )}

      {quizzes.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Nenhum quiz disponível nesta fase.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {quizzes.map((quiz) => (
            <Grid item xs={12} md={6} lg={4} key={quiz.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <QuizIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant="h6" component="h2">
                      {quiz.titulo}
                    </Typography>
                  </Box>
                  {quiz.descricao && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {quiz.descricao}
                    </Typography>
                  )}
                  <Box display="flex" gap={1} mt={2}>
                    <Chip
                      label={`${quiz._count?.perguntas || 0} ${(quiz._count?.perguntas || 0) === 1 ? 'Pergunta' : 'Perguntas'}`}
                      size="small"
                    />
                    <Chip
                      label={`${quiz.pontosBase} pontos base`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    variant="contained"
                    fullWidth
                    onClick={() => handleIniciarQuiz(quiz.id)}
                  >
                    Iniciar Quiz
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default QuizzesFase;

