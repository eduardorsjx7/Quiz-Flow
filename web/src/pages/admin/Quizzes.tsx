import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import api from '../../services/api';

interface Quiz {
  id: number;
  titulo: string;
  descricao: string | null;
  ativo: boolean;
  pontosBase: number;
  fase?: {
    id: number;
    titulo: string;
  };
  _count: {
    tentativas: number;
  };
}

const AdminQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    carregarQuizzes();
  }, []);

  const carregarQuizzes = async () => {
    try {
      const response = await api.get('/quizzes');
      const dados = response.data.data || response.data;
      // Garantir que sempre seja um array
      setQuizzes(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar quizzes:', error);
      setQuizzes([]); // Garantir que seja um array mesmo em caso de erro
    }
  };

  const handleDeletar = async (id: number) => {
    if (window.confirm('Tem certeza que deseja deletar este quiz?')) {
      try {
        await api.delete(`/quizzes/${id}`);
        carregarQuizzes();
      } catch (error) {
        console.error('Erro ao deletar quiz:', error);
        alert('Erro ao deletar quiz');
      }
    }
  };

  const handleAtribuirQuiz = (quizId: number) => {
    navigate(`/admin/quizzes/${quizId}/atribuir`);
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gerenciar Quizzes
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Quizzes</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/quizzes/novo')}
          >
            Novo Quiz
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Título</TableCell>
                <TableCell>Fase</TableCell>
                <TableCell>Pontos Base</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Tentativas</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quizzes.map((quiz: Quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell>{quiz.titulo}</TableCell>
                  <TableCell>{quiz.fase?.titulo || '-'}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </>
  );
};

export default AdminQuizzes;

