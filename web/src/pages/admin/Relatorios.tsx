import React, { useEffect, useState, useCallback } from 'react';
import {
  Container,
  Typography,
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
  Download as DownloadIcon
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

const AdminRelatorios: React.FC = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [quizSelecionado, setQuizSelecionado] = useState<number | ''>('');
  const [relatorio, setRelatorio] = useState<any>(null);

  const carregarQuizzes = useCallback(async () => {
    try {
      const response = await api.get('/quizzes');
      const dados = response.data.data || response.data;
      setQuizzes(Array.isArray(dados) ? dados : []);
    } catch (error) {
      console.error('Erro ao carregar quizzes:', error);
      setQuizzes([]);
    }
  }, []);

  const carregarRelatorio = useCallback(async () => {
    if (!quizSelecionado) return;

    try {
      const response = await api.get(`/relatorios/quiz/${quizSelecionado}`);
      const dados = response.data.data || response.data;
      setRelatorio(dados || null);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      setRelatorio(null);
    }
  }, [quizSelecionado]);

  useEffect(() => {
    carregarQuizzes();
  }, [carregarQuizzes]);

  useEffect(() => {
    if (quizSelecionado) {
      carregarRelatorio();
    }
  }, [quizSelecionado, carregarRelatorio]);

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
    <AdminLayout title="Relatórios">
      <Container maxWidth="lg">
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

        {relatorio && relatorio.quiz && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              {relatorio.quiz.titulo || 'Relatório'}
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
                  {(Array.isArray(relatorio?.tentativas) ? relatorio.tentativas : []).map((tentativa: any) => (
                    <TableRow key={tentativa.id}>
                      <TableCell>{tentativa.posicao || '-'}</TableCell>
                      <TableCell>{tentativa.usuario?.nome || '-'}</TableCell>
                      <TableCell>{tentativa.usuario?.matricula || '-'}</TableCell>
                      <TableCell>{tentativa.pontuacao || 0}</TableCell>
                      <TableCell>{tentativa.tempoTotal || 0}s</TableCell>
                      <TableCell>{tentativa.acertos || 0}/{tentativa.totalPerguntas || 0}</TableCell>
                      <TableCell>{tentativa.percentualAcertos || 0}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Container>
    </AdminLayout>
  );
};

export default AdminRelatorios;

