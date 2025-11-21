import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import api from '../../services/api';

const ParticipanteResultado: React.FC = () => {
  const { tentativaId } = useParams<{ tentativaId: string }>();
  const navigate = useNavigate();
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregarResultado = useCallback(async () => {
    try {
      setLoading(true);
      // Buscar tentativa com respostas
      const tentativaRes = await api.get(`/tentativas/${tentativaId}`);
      const tentativa = tentativaRes.data.data || tentativaRes.data;

      // Buscar ranking do quiz
      const rankingRes = await api.get(`/tentativas/quiz/${tentativa.quizId}/ranking`).catch(() => null);
      const ranking = rankingRes?.data || rankingRes || [];

      const respostas = tentativa.respostas || [];
      const usuarioRanking = ranking.find((r: any) => r.usuario.id === tentativa.usuarioId);

      const acertos = respostas.filter((r: any) => r.acertou).length;
      const tempoTotal = respostas.reduce((sum: number, r: any) => sum + r.tempoResposta, 0);
      const tempoMedio = respostas.length > 0 ? Math.round(tempoTotal / respostas.length) : 0;
      const percentualAcertos = respostas.length > 0
        ? Math.round((acertos / respostas.length) * 100)
        : 0;

      setDados({
        tentativa,
        respostas,
        ranking: usuarioRanking,
        estatisticas: {
          pontuacaoTotal: tentativa.pontuacaoTotal || 0,
          acertos,
          totalPerguntas: respostas.length,
          percentualAcertos,
          tempoTotal,
          tempoMedio,
          posicaoRanking: usuarioRanking?.posicaoRanking || tentativa.posicaoRanking || 0,
        },
      });
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar resultado');
    } finally {
      setLoading(false);
    }
  }, [tentativaId]);

  useEffect(() => {
    if (tentativaId) {
      carregarResultado();
    }
  }, [tentativaId, carregarResultado]);

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (erro || !dados) {
    return (
      <Container>
        <Alert severity="error">{erro || 'Erro ao carregar resultado'}</Alert>
        <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
          Voltar ao Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Quiz Finalizado!
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" gutterBottom>
          {dados.tentativa.quiz.titulo}
        </Typography>

        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h5" align="center" color="primary">
            {dados.estatisticas.pontuacaoTotal} pontos
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary">
            Posição no Ranking: {dados.estatisticas.posicaoRanking}º
          </Typography>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{dados.estatisticas.acertos}/{dados.estatisticas.totalPerguntas}</Typography>
            <Typography variant="body2" color="text.secondary">Acertos</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{dados.estatisticas.percentualAcertos}%</Typography>
            <Typography variant="body2" color="text.secondary">Taxa de Acerto</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{dados.estatisticas.tempoTotal}s</Typography>
            <Typography variant="body2" color="text.secondary">Tempo Total</Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h6">{dados.estatisticas.tempoMedio}s</Typography>
            <Typography variant="body2" color="text.secondary">Tempo Médio</Typography>
          </Paper>
        </Box>

        <Typography variant="h6" gutterBottom>
          Detalhamento das Respostas
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pergunta</TableCell>
                <TableCell>Resultado</TableCell>
                <TableCell>Tempo</TableCell>
                <TableCell>Pontuação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dados.respostas.map((resposta: any, index: number) => (
                <TableRow key={resposta.id}>
                  <TableCell>{resposta.pergunta.texto}</TableCell>
                  <TableCell>
                    {resposta.tempoEsgotado
                      ? '⏱ Tempo Esgotado'
                      : resposta.acertou
                      ? '✓ Correto'
                      : '✗ Incorreto'}
                  </TableCell>
                  <TableCell>{resposta.tempoResposta}s</TableCell>
                  <TableCell>{resposta.pontuacao} pts</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="contained" onClick={() => navigate('/dashboard')}>
            Voltar ao Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ParticipanteResultado;
