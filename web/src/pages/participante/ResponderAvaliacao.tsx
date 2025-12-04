import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Rating,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import ParticipantLayout from '../../components/ParticipantLayout';
import { AnimatedBackground } from '../../components/AnimatedBackground';
import api from '../../services/api';

interface Resposta {
  perguntaId: number;
  alternativaId?: number;
  textoResposta?: string;
  valorNota?: number;
}

const ResponderAvaliacao: React.FC = () => {
  const { avaliacaoId } = useParams<{ avaliacaoId: string; jornadaId: string }>();
  const navigate = useNavigate();
  const [avaliacao, setAvaliacao] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [respostas, setRespostas] = useState<Record<number, Resposta>>({});
  const [usuario] = useState<any>(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  });

  useEffect(() => {
    carregarAvaliacao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avaliacaoId]);

  const carregarAvaliacao = async () => {
    try {
      setLoading(true);
      setErro('');

      // Verificar se já respondeu
      if (usuario) {
        const verificarRes = await api.get(
          `/avaliacoes/${avaliacaoId}/verificar/${usuario.id}`
        );
        if (verificarRes.data.data.respondeu) {
          setErro('Você já respondeu esta avaliação');
          setLoading(false);
          return;
        }
      }

      // Carregar avaliação
      const res = await api.get(`/avaliacoes/${avaliacaoId}`);
      const data = res.data.data || res.data;
      setAvaliacao(data);

      // Inicializar respostas
      const respostasIniciais: Record<number, Resposta> = {};
      data.perguntas.forEach((pergunta: any) => {
        respostasIniciais[pergunta.id] = {
          perguntaId: pergunta.id,
        };
      });
      setRespostas(respostasIniciais);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar avaliação');
    } finally {
      setLoading(false);
    }
  };

  const handleResposta = (perguntaId: number, campo: string, valor: any) => {
    setRespostas({
      ...respostas,
      [perguntaId]: {
        ...respostas[perguntaId],
        [campo]: valor,
      },
    });
  };

  const validarRespostas = (): boolean => {
    for (const pergunta of avaliacao.perguntas) {
      if (pergunta.obrigatoria) {
        const resposta = respostas[pergunta.id];

        if (pergunta.tipo === 'MULTIPLA_ESCOLHA' || pergunta.tipo === 'SIM_NAO') {
          if (!resposta.alternativaId) {
            setErro(`Por favor, responda a pergunta: "${pergunta.texto}"`);
            return false;
          }
        } else if (pergunta.tipo === 'TEXTO_LIVRE') {
          if (!resposta.textoResposta || !resposta.textoResposta.trim()) {
            setErro(`Por favor, responda a pergunta: "${pergunta.texto}"`);
            return false;
          }
        } else if (pergunta.tipo === 'NOTA') {
          if (resposta.valorNota === undefined || resposta.valorNota === null) {
            setErro(`Por favor, responda a pergunta: "${pergunta.texto}"`);
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleEnviar = async () => {
    if (!validarRespostas()) {
      return;
    }

    try {
      setEnviando(true);
      setErro('');

      const respostasArray = Object.values(respostas).filter((r) => {
        return r.alternativaId || r.textoResposta || r.valorNota !== undefined;
      });

      await api.post('/avaliacoes/responder', {
        avaliacaoId: Number(avaliacaoId),
        usuarioId: usuario.id,
        respostas: respostasArray,
      });

      setSucesso(true);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao enviar respostas');
    } finally {
      setEnviando(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', position: 'relative' }}>
        <AnimatedBackground dark dimmed />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <LinearProgress sx={{ width: '300px', mb: 2 }} />
          <Typography color="white">Carregando avaliação...</Typography>
        </Box>
      </Box>
    );
  }

  if (sucesso) {
    return (
      <Box sx={{ minHeight: '100vh', position: 'relative' }}>
        <AnimatedBackground dark dimmed />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            px: 2,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 80, color: '#4caf50', mb: 3 }} />
          <Typography
            variant="h4"
            sx={{
              color: 'white',
              fontWeight: 700,
              mb: 2,
              textAlign: 'center',
            }}
          >
            Avaliação Enviada!
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: 'white',
              mb: 4,
              textAlign: 'center',
            }}
          >
            Obrigado por avaliar esta jornada. Seu feedback é muito importante!
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/dashboard')}
            sx={{
              bgcolor: '#ff2c19',
              '&:hover': { bgcolor: '#e62816' },
            }}
          >
            Voltar ao Dashboard
          </Button>
        </Box>
      </Box>
    );
  }

  if (erro && !avaliacao) {
    return (
      <Box sx={{ minHeight: '100vh', position: 'relative' }}>
        <AnimatedBackground dark dimmed />
        <ParticipantLayout title="Avaliação" noPadding={false}>
          <Container maxWidth="md">
            <Alert severity="error" sx={{ mb: 2 }}>
              {erro}
            </Alert>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/dashboard')}
            >
              Voltar
            </Button>
          </Container>
        </ParticipantLayout>
      </Box>
    );
  }

  if (!avaliacao) return null;

  const progresso = (Object.values(respostas).filter((r) => {
    return r.alternativaId || r.textoResposta || r.valorNota !== undefined;
  }).length / avaliacao.perguntas.length) * 100;

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative' }}>
      <AnimatedBackground dark dimmed />
      <ParticipantLayout title={avaliacao.titulo} noPadding={false}>
        <Container maxWidth="md">
          {/* Descrição */}
          {avaliacao.descricao && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="body1" color="text.secondary">
                {avaliacao.descricao}
              </Typography>
            </Paper>
          )}

          {/* Barra de Progresso */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={progresso}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#ff2c19',
                    },
                  }}
                />
              </Box>
              <Typography variant="body2" sx={{ minWidth: 60, textAlign: 'right' }}>
                {Math.round(progresso)}%
              </Typography>
            </Box>
          </Paper>

          {erro && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErro('')}>
              {erro}
            </Alert>
          )}

          {/* Perguntas */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
            {avaliacao.perguntas.map((pergunta: any, index: number) => (
              <Paper key={pergunta.id} sx={{ p: 3 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, mb: 2, color: '#011b49' }}
                >
                  {index + 1}. {pergunta.texto}
                  {pergunta.obrigatoria && (
                    <Typography component="span" color="error" sx={{ ml: 0.5 }}>
                      *
                    </Typography>
                  )}
                </Typography>

                {/* Múltipla Escolha */}
                {pergunta.tipo === 'MULTIPLA_ESCOLHA' && (
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={respostas[pergunta.id]?.alternativaId || ''}
                      onChange={(e) =>
                        handleResposta(pergunta.id, 'alternativaId', Number(e.target.value))
                      }
                    >
                      {pergunta.alternativas.map((alt: any) => (
                        <FormControlLabel
                          key={alt.id}
                          value={alt.id}
                          control={<Radio />}
                          label={alt.texto}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {/* Sim/Não */}
                {pergunta.tipo === 'SIM_NAO' && (
                  <FormControl component="fieldset">
                    <RadioGroup
                      value={respostas[pergunta.id]?.alternativaId || ''}
                      onChange={(e) =>
                        handleResposta(pergunta.id, 'alternativaId', Number(e.target.value))
                      }
                    >
                      {pergunta.alternativas.map((alt: any) => (
                        <FormControlLabel
                          key={alt.id}
                          value={alt.id}
                          control={<Radio />}
                          label={alt.texto}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                )}

                {/* Texto Livre */}
                {pergunta.tipo === 'TEXTO_LIVRE' && (
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder="Digite sua resposta..."
                    value={respostas[pergunta.id]?.textoResposta || ''}
                    onChange={(e) =>
                      handleResposta(pergunta.id, 'textoResposta', e.target.value)
                    }
                  />
                )}

                {/* Nota */}
                {pergunta.tipo === 'NOTA' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Rating
                      max={10}
                      size="large"
                      value={respostas[pergunta.id]?.valorNota || 0}
                      onChange={(e, newValue) =>
                        handleResposta(pergunta.id, 'valorNota', newValue)
                      }
                    />
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {respostas[pergunta.id]?.valorNota || 0}/10
                    </Typography>
                  </Box>
                )}
              </Paper>
            ))}
          </Box>

          {/* Botão Enviar */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<SendIcon />}
              onClick={handleEnviar}
              disabled={enviando}
              sx={{
                bgcolor: '#ff2c19',
                '&:hover': { bgcolor: '#e62816' },
                px: 6,
                py: 1.5,
              }}
            >
              {enviando ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </Box>
        </Container>
      </ParticipantLayout>
    </Box>
  );
};

export default ResponderAvaliacao;

