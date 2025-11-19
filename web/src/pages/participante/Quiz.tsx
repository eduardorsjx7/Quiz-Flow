import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  LinearProgress,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Alert
} from '@mui/material';
import { io, Socket } from 'socket.io-client';
import api from '../../services/api';

interface Pergunta {
  id: number;
  texto: string;
  tempoSegundos: number;
  alternativas: {
    id: number;
    texto: string;
    ordem: number;
  }[];
}

interface RankingItem {
  posicao: number;
  nome: string;
  pontuacao: number;
}

const ParticipanteQuiz: React.FC = () => {
  const { codigoSessao } = useParams<{ codigoSessao: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sessao, setSessao] = useState<any>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [perguntaAtualIndex, setPerguntaAtualIndex] = useState(0);
  const [alternativaSelecionada, setAlternativaSelecionada] = useState<number | null>(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [respondida, setRespondida] = useState(false);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [participanteId, setParticipanteId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ acertou: boolean; pontuacao: number } | null>(null);

  useEffect(() => {
    if (!codigoSessao) return;

    const participanteIdFromState = location.state?.participanteId;
    if (!participanteIdFromState) {
      navigate('/participante/entrada');
      return;
    }

    setParticipanteId(participanteIdFromState);
    carregarSessao();
  }, [codigoSessao]);

  useEffect(() => {
    if (sessao && participanteId) {
      const newSocket = io(process.env.REACT_APP_WS_URL || 'http://localhost:3001');
      newSocket.emit('join-session', sessao.id);
      newSocket.on('ranking-update', (data: RankingItem[]) => {
        setRanking(data);
      });
      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [sessao, participanteId]);

  useEffect(() => {
    if (perguntas.length > 0 && perguntaAtualIndex < perguntas.length && !respondida) {
      const pergunta = perguntas[perguntaAtualIndex];
      setTempoRestante(pergunta.tempoSegundos);
      setAlternativaSelecionada(null);
      setFeedback(null);

      const intervalo = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(intervalo);
            if (!respondida && alternativaSelecionada !== null) {
              enviarResposta(alternativaSelecionada);
            } else if (!respondida) {
              // Se não escolheu nenhuma alternativa, marca a primeira por padrão
              if (pergunta.alternativas.length > 0) {
                enviarResposta(pergunta.alternativas[0].id);
              }
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(intervalo);
    }
  }, [perguntaAtualIndex, perguntas]);

  const carregarSessao = async () => {
    try {
      const response = await api.get(`/sessoes/codigo/${codigoSessao}`);
      setSessao(response.data);
      setPerguntas(response.data.quiz.perguntas);
      setRanking(response.data.participantes || []);
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
    }
  };

  const enviarResposta = async (alternativaId: number) => {
    if (respondida || !participanteId) return;

    const pergunta = perguntas[perguntaAtualIndex];
    const tempoGasto = Math.max(0, pergunta.tempoSegundos - tempoRestante);

    setRespondida(true);

    try {
      const resposta = await api.post('/respostas', {
        sessaoParticipanteId: participanteId,
        perguntaId: pergunta.id,
        alternativaId: alternativaId,
        tempoResposta: tempoGasto
      });

      setFeedback({
        acertou: resposta.data.acertou,
        pontuacao: resposta.data.pontuacao
      });

      // Aguardar 3 segundos antes de passar para próxima pergunta
      setTimeout(() => {
        if (perguntaAtualIndex < perguntas.length - 1) {
          setPerguntaAtualIndex(perguntaAtualIndex + 1);
          setRespondida(false);
        } else {
          // Quiz finalizado
          navigate(`/participante/resultado/${participanteId}`);
        }
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar resposta:', error);
      setRespondida(false);
    }
  };

  const handleResponder = () => {
    if (alternativaSelecionada !== null) {
      enviarResposta(alternativaSelecionada);
    }
  };

  if (!sessao || perguntas.length === 0) {
    return (
      <Container>
        <Typography>Carregando...</Typography>
      </Container>
    );
  }

  const pergunta = perguntas[perguntaAtualIndex];
  const progresso = (tempoRestante / pergunta.tempoSegundos) * 100;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">
          Pergunta {perguntaAtualIndex + 1} de {perguntas.length}
        </Typography>
        <Typography variant="h6" color={tempoRestante <= 10 ? 'error' : 'text.primary'}>
          {tempoRestante}s
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progresso}
        sx={{ height: 10, borderRadius: 5, mb: 3 }}
        color={tempoRestante <= 10 ? 'error' : 'primary'}
      />

      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {pergunta.texto}
        </Typography>

        {feedback ? (
          <Alert
            severity={feedback.acertou ? 'success' : 'error'}
            sx={{ mt: 2 }}
          >
            {feedback.acertou ? '✓ Resposta Correta!' : '✗ Resposta Incorreta'}
            <br />
            Pontuação: {feedback.pontuacao} pontos
          </Alert>
        ) : (
          <>
            <FormControl component="fieldset" sx={{ mt: 3, width: '100%' }}>
              <RadioGroup
                value={alternativaSelecionada}
                onChange={(e) => setAlternativaSelecionada(parseInt(e.target.value))}
              >
                {pergunta.alternativas.map((alt) => (
                  <FormControlLabel
                    key={alt.id}
                    value={alt.id}
                    control={<Radio />}
                    label={alt.texto}
                    disabled={respondida}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleResponder}
              disabled={alternativaSelecionada === null || respondida}
              sx={{ mt: 3 }}
            >
              Responder
            </Button>
          </>
        )}
      </Paper>

      {ranking.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Ranking Parcial
          </Typography>
          {ranking.slice(0, 5).map((item) => (
            <Box key={item.posicao} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
              <Typography>
                {item.posicao}. {item.nome}
              </Typography>
              <Typography fontWeight="bold">{item.pontuacao} pts</Typography>
            </Box>
          ))}
        </Paper>
      )}
    </Container>
  );
};

export default ParticipanteQuiz;

