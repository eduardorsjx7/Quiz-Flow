import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  Breadcrumbs,
  Link,
  Chip,
} from '@mui/material';
import {
  Home as HomeIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import ParticipantLayout from '../../components/ParticipantLayout';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface Pergunta {
  id: number;
  texto: string;
  tempoSegundos?: number;
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
    fase?: {
      jornada?: {
        id: number;
        titulo: string;
        tempoLimitePorQuestao?: number | null;
      };
    };
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
  const [mostrarDialogoTempoEsgotado, setMostrarDialogoTempoEsgotado] = useState(false);
  const carregandoRef = useRef(false);
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);

  const finalizarPerguntas = useCallback(async () => {
    try {
      await api.post(`/tentativas/${tentativaId}/finalizar`);
      navigate(`/participante/resultado/${tentativaId}`);
    } catch (error: any) {
      console.error('Erro ao finalizar perguntas:', error);
      // Mesmo com erro, navegar para resultado
      navigate(`/participante/resultado/${tentativaId}`);
    }
  }, [tentativaId, navigate]);

  const carregarTentativa = useCallback(async () => {
    if (!tentativaId || carregandoRef.current) return;
    
    try {
      carregandoRef.current = true;
      setLoading(true);
      const response = await api.get(`/tentativas/${tentativaId}`);
      const tentativaData = response.data.data || response.data;
      setTentativa(tentativaData);
      const perguntasData = tentativaData.quiz.perguntas;
      setPerguntas(perguntasData);
      
      // Verificar se já existem respostas e avançar para a próxima pergunta não respondida
      if (tentativaData.respostas && tentativaData.respostas.length > 0) {
        const perguntasRespondidas = tentativaData.respostas.map((r: any) => r.perguntaId);
        const proximaPerguntaIndex = perguntasData.findIndex(
          (p: Pergunta) => !perguntasRespondidas.includes(p.id)
        );
        if (proximaPerguntaIndex !== -1) {
          setPerguntaAtualIndex(proximaPerguntaIndex);
        } else {
          // Todas as perguntas foram respondidas, finalizar
          // Usar setTimeout para evitar chamar durante o carregamento
          setTimeout(() => {
            finalizarPerguntas();
          }, 100);
        }
      }
    } catch (error: any) {
      if (error.response?.status === 429) {
        setErro('Muitas requisições. Aguarde alguns instantes.');
        carregandoRef.current = false;
        return;
      }
      setErro(error.response?.data?.error || 'Erro ao carregar tentativa');
    } finally {
      setLoading(false);
      carregandoRef.current = false;
    }
  }, [tentativaId, finalizarPerguntas]);

  const enviarResposta = useCallback(async (alternativaId: number | null, tempoEsgotado: boolean = false) => {
    if (respondida || !tentativaId) return;

    const pergunta = perguntas[perguntaAtualIndex];
    // Usar tempoSegundos da pergunta individual, ou tempoLimitePorQuestao da jornada como fallback
    const tempoLimitePergunta = pergunta?.tempoSegundos;
    const tempoLimiteJornada = tentativa?.quiz?.fase?.jornada?.tempoLimitePorQuestao;
    const tempoLimite = tempoLimitePergunta || tempoLimiteJornada || 0;
    const tempoGasto = tempoLimite > 0 ? Math.max(0, tempoLimite - tempoRestante) : 0;

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
      
      // Se o tempo esgotou, não mostrar feedback, ir direto para próxima pergunta
      if (tempoEsgotado || (!alternativaId && tempoLimite > 0)) {
        // Aguardar 1 segundo antes de passar para próxima pergunta quando tempo esgotar
        setTimeout(() => {
          if (perguntaAtualIndex < perguntas.length - 1) {
            setPerguntaAtualIndex(perguntaAtualIndex + 1);
            setRespondida(false);
            setFeedback(null);
            setAlternativaSelecionada(null);
          } else {
            // Perguntas finalizadas
            finalizarPerguntas();
          }
        }, 1000);
      } else {
        // Mostrar feedback quando resposta foi enviada manualmente
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
            setFeedback(null);
            setAlternativaSelecionada(null);
          } else {
            // Perguntas finalizadas
            finalizarPerguntas();
          }
        }, 3000);
      }
    } catch (error: any) {
      console.error('Erro ao enviar resposta:', error);
      setErro(error.response?.data?.error || 'Erro ao enviar resposta');
      setRespondida(false);
    }
  }, [respondida, tentativaId, perguntas, perguntaAtualIndex, tempoRestante, finalizarPerguntas, tentativa]);

  useEffect(() => {
    if (tentativaId && !carregandoRef.current) {
      carregarTentativa();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tentativaId]);

  useEffect(() => {
    // Limpar intervalo anterior se existir
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }

    // Resetar quando mudar de pergunta ou quando não há mais perguntas
    if (perguntas.length === 0 || perguntaAtualIndex >= perguntas.length) {
      return;
    }

    // Usar tempoSegundos da pergunta atual, ou tempoLimitePorQuestao da jornada como fallback
    const perguntaAtual = perguntas[perguntaAtualIndex];
    const tempoLimitePergunta = perguntaAtual?.tempoSegundos;
    const tempoLimiteJornada = tentativa?.quiz?.fase?.jornada?.tempoLimitePorQuestao;
    const tempoLimite = tempoLimitePergunta || tempoLimiteJornada;
    
    if (tempoLimite && tempoLimite > 0 && !respondida) {
      setTempoRestante(tempoLimite);
      setAlternativaSelecionada(null);
      setFeedback(null);

      intervaloRef.current = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            if (intervaloRef.current) {
              clearInterval(intervaloRef.current);
              intervaloRef.current = null;
            }
            // Tempo esgotou - mostrar diálogo
            if (!respondida) {
              setMostrarDialogoTempoEsgotado(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (intervaloRef.current) {
          clearInterval(intervaloRef.current);
          intervaloRef.current = null;
        }
      };
    } else {
      // Sem tempo limite, não iniciar timer
      setTempoRestante(0);
      if (!respondida) {
        setAlternativaSelecionada(null);
        setFeedback(null);
      }
    }
  }, [perguntaAtualIndex, perguntas.length, respondida, enviarResposta, tentativa]);

  const handleResponder = () => {
    if (alternativaSelecionada !== null) {
      enviarResposta(alternativaSelecionada, false);
    }
  };

  const handleConfirmarTempoEsgotado = () => {
    setMostrarDialogoTempoEsgotado(false);
    // Enviar resposta em branco (null) quando tempo esgotar
    enviarResposta(null, true);
  };

  // Calcular tempo limite e progresso antes dos early returns (regra dos hooks)
  const pergunta = perguntas[perguntaAtualIndex] || null;
  const tempoLimitePergunta = pergunta?.tempoSegundos;
  const tempoLimiteJornada = tentativa?.quiz?.fase?.jornada?.tempoLimitePorQuestao;
  const tempoLimite = tempoLimitePergunta || tempoLimiteJornada || 0;
  
  // Calcular porcentagem de tempo decorrido (0% no início, 100% no final)
  // tempoRestante começa em tempoLimite e vai até 0
  // tempoDecorrido = (tempoLimite - tempoRestante) / tempoLimite * 100
  const tempoDecorrido = React.useMemo(() => {
    if (!tempoLimite || tempoLimite <= 0) return 0;
    if (tempoRestante <= 0) return 100;
    const decorrido = ((tempoLimite - tempoRestante) / tempoLimite) * 100;
    return Math.min(100, Math.max(0, decorrido)); // Garantir que está entre 0 e 100
  }, [tempoLimite, tempoRestante]);
  
  const jornadaId = tentativa?.quiz?.fase?.jornada?.id;

  if (loading) {
    return (
      <ParticipantLayout>
        <Container>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <CircularProgress />
          </Box>
        </Container>
      </ParticipantLayout>
    );
  }

  if (erro || !tentativa || perguntas.length === 0) {
    return (
      <ParticipantLayout>
        <Container>
          <Alert severity="error">{erro || 'Erro ao carregar perguntas'}</Alert>
          <Button onClick={() => navigate('/dashboard')} sx={{ mt: 2 }}>
            Voltar ao Dashboard
          </Button>
        </Container>
      </ParticipantLayout>
    );
  }

  return (
    <>
      {/* Barra de Carregamento - Cresce conforme o tempo passa */}
      {tempoLimite > 0 && (
        <Box
          sx={{
            position: 'fixed',
            top: 64, // Altura do AppBar
            left: { xs: 0, sm: '80px' }, // Sidebar colapsado por padrão (80px)
            right: 0,
            zIndex: (theme) => theme.zIndex.appBar - 1,
          }}
        >
          <LinearProgress
            variant="determinate"
            value={tempoDecorrido} // Mostra tempo decorrido (cresce de 0% para 100%)
            sx={{
              height: 4,
              backgroundColor: 'rgba(255, 44, 25, 0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#ff2c19',
                transition: 'transform 0.1s linear',
              },
            }}
          />
        </Box>
      )}

      <ParticipantLayout>
        <Container maxWidth="lg" sx={{ pt: tempoLimite > 0 ? 2 : 0 }}>

        {/* Breadcrumbs */}
        <Breadcrumbs 
          sx={{ 
            mb: 3,
            '& .MuiBreadcrumbs-separator': {
              mx: 1.5,
              color: 'text.disabled',
            },
          }}
        >
          <Link
            component="button"
            onClick={() => navigate('/dashboard')}
            sx={{ 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center',
              color: 'text.secondary',
              transition: 'all 0.2s ease',
              borderRadius: 1,
              p: 0.5,
              '&:hover': { 
                color: 'primary.main',
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
            title="Dashboard"
          >
            <HomeIcon sx={{ fontSize: 20 }} />
          </Link>
          {jornadaId && (
            <Link
              component="button"
              onClick={() => navigate(`/participante/jornadas/${jornadaId}/fases`)}
              sx={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center',
                color: 'text.secondary',
                transition: 'all 0.2s ease',
                borderRadius: 1,
                p: 0.5,
                '&:hover': { 
                  color: 'primary.main',
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <Typography 
                sx={{
                  fontWeight: 500,
                  fontSize: '0.95rem',
                }}
              >
                {tentativa?.quiz?.fase?.jornada?.titulo || 'Jornada'}
              </Typography>
            </Link>
          )}
          <Typography 
            color="text.primary"
            sx={{
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            Responder Perguntas
          </Typography>
        </Breadcrumbs>

        {/* Título da Jornada com quantidade de perguntas */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              fontSize: '2rem',
              background: 'linear-gradient(135deg, #011b49 0%, #1a3a6b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            {tentativa?.quiz?.fase?.jornada?.titulo || 'Jornada'}
          </Typography>
          <Chip
            label={`${perguntaAtualIndex + 1}/${perguntas.length}`}
            sx={{
              fontWeight: 600,
              fontSize: '1rem',
              height: 36,
              backgroundColor: '#011b49',
              color: '#fff',
            }}
          />
        </Box>

        {/* Card com a pergunta */}
        <Paper
          sx={{
            p: 5,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'box-shadow 0.2s ease',
            mb: 3,
          }}
        >
          {/* Texto da Pergunta */}
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              mb: 5,
              fontSize: '1.75rem',
              lineHeight: 1.5,
            }}
          >
            {pergunta.texto}
          </Typography>

          {/* Feedback quando resposta foi enviada */}
          {feedback && (
            <Alert
              severity={feedback.acertou ? 'success' : 'error'}
              sx={{
                mb: 3,
                fontSize: '1rem',
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                },
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                {feedback.tempoEsgotado
                  ? '⏱ Tempo Esgotado!'
                  : feedback.acertou
                  ? '✓ Resposta Correta!'
                  : '✗ Resposta Incorreta'}
              </Typography>
              <Typography variant="body1">
                Pontuação: <strong>{feedback.pontuacao} pontos</strong>
              </Typography>
              {feedback.tempoEsgotado && (
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                  A pergunta foi marcada como não respondida por falta de tempo.
                </Typography>
              )}
            </Alert>
          )}

          {/* Alternativas em duas colunas */}
          {!feedback && (
            <FormControl component="fieldset" sx={{ width: '100%', mb: 3 }}>
              <RadioGroup
                value={alternativaSelecionada || ''}
                onChange={(e) => setAlternativaSelecionada(parseInt(e.target.value))}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: 2,
                }}
              >
                {pergunta.alternativas.map((alt) => (
                  <FormControlLabel
                    key={alt.id}
                    value={alt.id}
                    control={
                      <Radio
                        sx={{
                          color: '#011b49',
                          '&.Mui-checked': {
                            color: '#ff2c19',
                          },
                          '&:hover': {
                            backgroundColor: 'rgba(1, 27, 73, 0.04)',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: alternativaSelecionada === alt.id ? 600 : 400,
                          color: alternativaSelecionada === alt.id ? '#011b49' : 'text.primary',
                          fontSize: '1.1rem',
                        }}
                      >
                        {alt.texto}
                      </Typography>
                    }
                    disabled={respondida}
                    sx={{
                      p: 2.5,
                      borderRadius: 2,
                      border: alternativaSelecionada === alt.id ? '2px solid #ff2c19' : '2px solid rgba(0, 0, 0, 0.1)',
                      backgroundColor: alternativaSelecionada === alt.id ? 'rgba(255, 44, 25, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                      '&:hover': {
                        backgroundColor: alternativaSelecionada === alt.id ? 'rgba(255, 44, 25, 0.1)' : 'rgba(1, 27, 73, 0.04)',
                        border: alternativaSelecionada === alt.id ? '2px solid #ff2c19' : '2px solid rgba(1, 27, 73, 0.2)',
                      },
                      transition: 'all 0.2s ease-in-out',
                      cursor: respondida ? 'not-allowed' : 'pointer',
                      m: 0,
                      width: '100%',
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}
        </Paper>

        {/* Botões Cancelar e Responder */}
        {!feedback && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={() => navigate('/dashboard')}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderColor: '#011b49',
                color: '#011b49',
                '&:hover': {
                  borderColor: '#011b49',
                  backgroundColor: 'rgba(1, 27, 73, 0.04)',
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              fullWidth
              size="large"
              onClick={handleResponder}
              disabled={alternativaSelecionada === null || respondida}
              sx={{
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                bgcolor: '#e62816',
                '&:hover': {
                  bgcolor: '#c52214',
                },
                '&:disabled': {
                  bgcolor: 'rgba(0, 0, 0, 0.12)',
                  color: 'rgba(0, 0, 0, 0.26)',
                },
              }}
            >
              Responder
            </Button>
          </Box>
        )}
        </Container>
      </ParticipantLayout>

      {/* Diálogo de Tempo Esgotado */}
      <ConfirmDialog
        open={mostrarDialogoTempoEsgotado}
        title="Tempo Limite Excedido"
        message="O tempo limite para responder esta pergunta foi excedido. A pergunta será marcada como não respondida e você será direcionado para a próxima pergunta."
        confirmText="Entendi"
        type="warning"
        onConfirm={handleConfirmarTempoEsgotado}
        onCancel={handleConfirmarTempoEsgotado}
      />
    </>
  );
};

export default ParticipanteQuiz;
