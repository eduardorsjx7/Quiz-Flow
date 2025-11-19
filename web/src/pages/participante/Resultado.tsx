import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  TableRow
} from '@mui/material';
import api from '../../services/api';

const ParticipanteResultado: React.FC = () => {
  const { sessaoParticipanteId } = useParams<{ sessaoParticipanteId: string }>();
  const [dados, setDados] = useState<any>(null);

  useEffect(() => {
    carregarResultado();
  }, []);

  const carregarResultado = async () => {
    try {
      // Buscar informações do participante (inclui sessão e respostas)
      const participanteRes = await api.get(`/sessoes/participante/${sessaoParticipanteId}`);
      const participante = participanteRes.data;
      
      // Buscar ranking da sessão
      const rankingRes = await api.get(`/sessoes/${participante.sessao.codigoSessao}/ranking`).catch(() => null);

      const respostas = participante.respostas || [];
      const ranking = rankingRes?.data || [];

      const participanteRanking = ranking.find((p: any) => p.id === parseInt(sessaoParticipanteId || '0'));

      const acertos = respostas.filter((r: any) => r.acertou).length;
      const tempoTotal = respostas.reduce((sum: number, r: any) => sum + r.tempoResposta, 0);
      const tempoMedio = respostas.length > 0 ? Math.round(tempoTotal / respostas.length) : 0;
      const percentualAcertos = respostas.length > 0
        ? Math.round((acertos / respostas.length) * 100)
        : 0;

      setDados({
        respostas,
        participante: participanteRanking,
        estatisticas: {
          pontuacaoTotal: participante.pontuacaoTotal || 0,
          acertos,
          totalPerguntas: respostas.length,
          percentualAcertos,
          tempoTotal,
          tempoMedio,
          posicaoRanking: participanteRanking?.posicao || participante.posicaoRanking || 0
        }
      });
    } catch (error) {
      console.error('Erro ao carregar resultado:', error);
    }
  };

  if (!dados) {
    return (
      <Container>
        <Typography>Carregando...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Quiz Finalizado!
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
                    {resposta.acertou ? '✓ Correto' : '✗ Incorreto'}
                  </TableCell>
                  <TableCell>{resposta.tempoResposta}s</TableCell>
                  <TableCell>{resposta.pontuacao} pts</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
};

export default ParticipanteResultado;

