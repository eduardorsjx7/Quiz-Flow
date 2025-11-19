import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  AppBar,
  Toolbar,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface Quiz {
  id: number;
  titulo: string;
  descricao: string | null;
  ativo: boolean;
  pontosBase: number;
  _count: {
    tentativas: number;
  };
}

const AdminQuizzesFase: React.FC = () => {
  const navigate = useNavigate();
  const { faseId } = useParams<{ faseId: string }>();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [fase, setFase] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregarDados = useCallback(async () => {
    if (!faseId) return;
    
    try {
      setLoading(true);
      const [faseRes, quizzesRes] = await Promise.all([
        api.get(`/fases/${faseId}`),
        api.get(`/quizzes?faseId=${faseId}`),
      ]);

      setFase(faseRes.data.data || faseRes.data);
      const dados = quizzesRes.data.data || quizzesRes.data;
      setQuizzes(Array.isArray(dados) ? dados : []);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [faseId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleDeletar = async (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar este quiz?')) {
      try {
        await api.delete(`/quizzes/${id}`);
        carregarDados();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Erro ao deletar quiz');
      }
    }
  };

  const handleAtribuirQuiz = (quizId: number) => {
    navigate(`/admin/quizzes/${quizId}/atribuir`);
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
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin/fases')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Quizzes - {fase?.titulo || 'Fase'}
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
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/admin/fases')}
            sx={{ cursor: 'pointer' }}
          >
            Fases
          </Link>
          <Typography color="text.primary">{fase?.titulo || 'Fase'}</Typography>
        </Breadcrumbs>

        {fase && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="h6" color="primary.contrastText">
              {fase.titulo}
            </Typography>
            {fase.jornada && (
              <Typography variant="body2" color="primary.contrastText">
                Jornada: {fase.jornada.titulo}
              </Typography>
            )}
            {fase.descricao && (
              <Typography variant="body2" color="primary.contrastText" sx={{ mt: 1 }}>
                {fase.descricao}
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Quizzes</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/admin/fases/${faseId}/quiz/novo`)}
          >
            Novo Quiz
          </Button>
        </Box>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Pontos Base</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tentativas</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quizzes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                      Nenhum quiz cadastrado nesta fase.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => navigate(`/admin/fases/${faseId}/quiz/novo`)}
                      >
                        Criar Primeiro Quiz
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                quizzes.map((quiz: Quiz) => (
                  <TableRow key={quiz.id}>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {quiz.titulo}
                      </Typography>
                      {quiz.descricao && (
                        <Typography variant="body2" color="text.secondary">
                          {quiz.descricao}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{quiz.pontosBase}</TableCell>
                    <TableCell>
                      <Chip
                        label={quiz.ativo ? 'Ativo' : 'Inativo'}
                        color={quiz.ativo ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{quiz._count.tentativas}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleAtribuirQuiz(quiz.id)}
                        title="Atribuir Quiz"
                      >
                        <AssignmentIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeletar(quiz.id)}
                        title="Deletar Quiz"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </>
  );
};

export default AdminQuizzesFase;

