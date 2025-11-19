import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const AdminRelatorios: React.FC = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizSelecionado, setQuizSelecionado] = useState<number | ''>('');
  const [relatorio, setRelatorio] = useState<any>(null);

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

  const carregarRelatorio = async () => {
    if (!quizSelecionado) return;

    try {
      const response = await api.get(`/relatorios/quiz/${quizSelecionado}`);
      setRelatorio(response.data);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    }
  };

  useEffect(() => {
    if (quizSelecionado) {
      carregarRelatorio();
    }
  }, [quizSelecionado]);

  const exportarCSV = async () => {
    if (!quizSelecionado) return;

    try {
      const response = await api.get(`/relatorios/quiz/${quizSelecionado}/export/csv`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'relatorio-quiz.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
    }
  };

  const exportarPDF = async () => {
    if (!quizSelecionado) return;

    try {
      const response = await api.get(`/relatorios/quiz/${quizSelecionado}/export/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'relatorio-quiz.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
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
            Relatórios
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 3 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Selecione um Quiz</InputLabel>
            <Select
              value={quizSelecionado}
              onChange={(e) => setQuizSelecionado(e.target.value as number)}
              label="Selecione um Quiz"
            >
              {quizzes.map((quiz) => (
                <MenuItem key={quiz.id} value={quiz.id}>
                  {quiz.titulo}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {quizSelecionado && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={exportarCSV}
              >
                Exportar CSV
              </Button>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={exportarPDF}
              >
                Exportar PDF
              </Button>
            </Box>
          )}
        </Box>

        {relatorio && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {relatorio.quiz.titulo}
            </Typography>

            {relatorio.sessoes.map((sessao: any) => (
              <Box key={sessao.id} sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Sessão: {sessao.codigo}
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Posição</TableCell>
                        <TableCell>Nome</TableCell>
                        <TableCell>Matrícula</TableCell>
                        <TableCell>Pontuação</TableCell>
                        <TableCell>Tempo Total</TableCell>
                        <TableCell>Acertos</TableCell>
                        <TableCell>% Acertos</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sessao.participantes.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.posicao}</TableCell>
                          <TableCell>{p.nome}</TableCell>
                          <TableCell>{p.matricula || '-'}</TableCell>
                          <TableCell>{p.pontuacao}</TableCell>
                          <TableCell>{p.tempoTotal}s</TableCell>
                          <TableCell>{p.acertos}/{p.totalPerguntas}</TableCell>
                          <TableCell>{p.percentualAcertos}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Paper>
        )}
      </Container>
    </>
  );
};

export default AdminRelatorios;

