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
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface Quiz {
  id: number;
  titulo: string;
  descricao: string | null;
  codigoAcesso: string;
  ativo: boolean;
  pontosBase: number;
  _count: {
    sessoes: number;
  };
}

const AdminQuizzes: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  useEffect(() => {
    carregarQuizzes();
  }, []);

  const carregarQuizzes = async () => {
    try {
      const response = await api.get('/quizzes');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Erro ao carregar quizzes:', error);
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

  const handleCriarSessao = async (quizId: number) => {
    try {
      const response = await api.post('/sessoes', { quizId });
      const codigoSessao = response.data.codigoSessao;
      alert(`Sessão criada! Código: ${codigoSessao}\n\nCompartilhe este código com os participantes.`);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      alert('Erro ao criar sessão');
    }
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
                <TableCell>Código de Acesso</TableCell>
                <TableCell>Pontos Base</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sessões</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {quizzes.map((quiz) => (
                <TableRow key={quiz.id}>
                  <TableCell>{quiz.titulo}</TableCell>
                  <TableCell>
                    <code>{quiz.codigoAcesso}</code>
                  </TableCell>
                  <TableCell>{quiz.pontosBase}</TableCell>
                  <TableCell>
                    <Chip
                      label={quiz.ativo ? 'Ativo' : 'Inativo'}
                      color={quiz.ativo ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{quiz._count.sessoes}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleCriarSessao(quiz.id)}
                      title="Criar Sessão"
                    >
                      <PlayIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeletar(quiz.id)}
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

