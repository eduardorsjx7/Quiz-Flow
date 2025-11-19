import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Alert,
  CircularProgress,
} from '@mui/material';
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

interface Tentativa {
  id: number;
  quiz: {
    id: number;
    titulo: string;
    perguntas: Pergunta[];
  };
  status: string;
}

const ParticipanteQuiz: React.FC = () => {
  const { tentativaId } = useParams<{ tentativaId: string }>();
  const navigate = useNavigate();
  const [tentativa, setTentativa] = useState<Tentativa | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [perguntaAtualIndex, setPerguntaAtualIndex] = useState(0);
  const [alternativaSelecionada, setAlternativaSelecionada] = useState<number | null>(null);
  const [tempoRestante, setTempoRestante] = useState(0);
  const [respondida, setRespondida] = useState(false);
  const [feedback, setFeedback] = useState<{ acertou: boolean; pontuacao: number; tempoEsgotado: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (tentativaId) {
      carregarTentativa();
    }
  }, [tentativaId]);

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
            // Tempo esgotou - enviar resposta sem alternativa (ou com a primeira se selecionada)
            if (!respondida) {
              enviarResposta(alternativaSelecionada, true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(intervalo);
    }
  }, [perguntaAtualIndex, perguntas, respondida, alternativaSelecionada]);

  const carregarTentativa = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/tentativas/${tentativaId}`);
      const tentativaData = response.data.data || response.data;
      setTentativa(tentativaData);
      setPerguntas(tentativaData.quiz.perguntas);
      
      // Verificar se já existem respostas e avançar para a próxima pergunta não respondida
      if (tentativaData.respostas && tentativaData.respostas.length > 0) {
        const perguntasRespondidas = tentativaData.respostas.map((r: any) => r.perguntaId);
        const proximaPerguntaIndex = perguntas.findIndex(
          (p) => !perguntasRespondidas.includes(p.id)
        );
        if (proximaPerguntaIndex !== -1) {
          setPerguntaAtualIndex(proximaPerguntaIndex);
        } else {
          // Todas as perguntas foram respondidas, finalizar quiz
          finalizarQuiz();
        }
      }
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar tentativa');
    } finally {
      setLoading(false);
    }
  };

  const enviarResposta = async (alternativaId: number | null, tempoEsgotado: boolean = false) => {
    if (respondida || !tentativaId) return;

    const pergunta = perguntas[perguntaAtualIndex];
    const tempoGasto = Math.max(0, pergunta.tempoSegundos - tempoRestante);

    setRespondida(true);

    try {
      const resposta = await api.post('/respostas', {
        tentativaId: parseInt(tentativaId!),
        perguntaId: pergunta.id,
        alternativaId: alternativaId,
        tempoResposta: tempoGasto,
        tempoEsgotado: tempoEsgotado || !alternativaId,
      });

      const resultado = resposta.data.data || resposta.data;
      setFeedback({
        acertou: resultado.acertou,
        pontuacao: resultado.pontuacao,
        tempoEsgotado: resultado.tempoEsgotado || tempoEsgotado,
      });

      // Aguardar 3 segundos antes de passar para próxima pergunta
      setTimeout(() => {
        if (perguntaAtualIndex < perguntas.length - 1) {
          setPerguntaAtualIndex(perguntaAtualIndex + 1);
          setRespondida(false);
        } else {
          // Quiz finalizado
          finalizarQuiz();
        }
      }, 3000);
    } catch (error: any) {
      console.error('Erro ao enviar resposta:', error);
      setErro(error.response?.data?.error || 'Erro ao enviar resposta');
      setRespondida(false);
    }
  };

  const finalizarQuiz = async () => {
    try {
      await api.post(`/tentativas/${tentativaId}/finalizar`);
      navigate(`/participante/resultado/${tentativaId}`);
    } catch (error: any) {
      console.error('Erro ao finalizar quiz:', error);
      // Mesmo com erro, navegar para resultado
      navigate(`/participante/resultado/${tentativaId}`);
    }
  };

  const handleResponder = () => {
    if (alternativaSelecionada !== null) {
      enviarResposta(alternativaSelecionada, false);
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

  if (erro || !tentativa || perguntas.length === 0) {
    return (
      <Container>
        <Alert severity="error">{erro || 'Erro ao carregar quiz'}</Alert>
        <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
          Voltar ao Dashboard
        </Button>
      </Container>
    );
  }

  const pergunta = perguntas[perguntaAtualIndex];
  const progresso = (tempoRestante / pergunta.tempoSegundos) * 100;

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">
          {tentativa.quiz.titulo}
        </Typography>
        <Typography variant="h6">
          Pergunta {perguntaAtualIndex + 1} de {perguntas.length}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body1" color={tempoRestante <= 10 ? 'error' : 'text.primary'}>
          Tempo restante: {tempoRestante}s
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
            {feedback.tempoEsgotado
              ? '⏱ Tempo esgotado!'
              : feedback.acertou
              ? '✓ Resposta Correta!'
              : '✗ Resposta Incorreta'}
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
    </Container>
  );
};

export default ParticipanteQuiz;
