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
import { useNavigation } from '../../contexts/NavigationContext';
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext';
import { LoadingScreen } from '../../components/LoadingScreen';

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
  const { registerInterceptor, checkNavigation } = useNavigation();
  const { confirm } = useConfirmDialog();
  const [tentativa, setTentativa] = useState<Tentativa | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [perguntaAtualIndex, setPerguntaAtualIndex] = useState(0);
  const [alternativaSelecionada, setAlternativaSelecionada] = useState<number | null>(null);
  const [tempoRestante, setTempoRestante] = useState(0); // em segundos (lógica)
  const [tempoDecorrido, setTempoDecorrido] = useState(0); // em % (animação)
  const [timerIniciado, setTimerIniciado] = useState(false);
  const [respondida, setRespondida] = useState(false);
  const [feedback, setFeedback] = useState<{ acertou: boolean; pontuacao: number; tempoEsgotado: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [mostrarDialogoTempoEsgotado, setMostrarDialogoTempoEsgotado] = useState(false);
  const [permitirNavegacao, setPermitirNavegacao] = useState(false);

  const carregandoRef = useRef(false);
  const intervaloRef = useRef<NodeJS.Timeout | null>(null);            // timer de segundos
  const progressoIntervaloRef = useRef<NodeJS.Timeout | null>(null);   // timer da animação da barra
  const inicioTimerRef = useRef<number | null>(null);                  // timestamp de início da pergunta

  const salvarRespostaNaoRespondida = useCallback(async () => {
    if (!respondida && !loading && perguntas.length > 0 && perguntaAtualIndex < perguntas.length) {
      const pergunta = perguntas[perguntaAtualIndex];
      const tempoLimite = tentativa?.quiz?.fase?.jornada?.tempoLimitePorQuestao || 0;
      const tempoGasto = tempoLimite > 0 ? Math.max(0, tempoLimite - tempoRestante) : 0;

      try {
        await api.post('/respostas', {
          tentativaId: parseInt(tentativaId!),
          perguntaId: pergunta.id,
          alternativaId: null,
          tempoResposta: tempoGasto,
          tempoEsgotado: true,
        });
      } catch (error) {
        console.error('Erro ao salvar resposta não respondida:', error);
      }
    }
  }, [respondida, loading, perguntas, perguntaAtualIndex, tentativa, tempoRestante, tentativaId]);

  const finalizarPerguntas = useCallback(async () => {
    try {
      setPermitirNavegacao(true);
      await api.post(`/tentativas/${tentativaId}/finalizar`);
      navigate(`/participante/resultado/${tentativaId}`);
    } catch (error: any) {
      console.error('Erro ao finalizar perguntas:', error);
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
      
      if (tentativaData.respostas && tentativaData.respostas.length > 0) {
        const perguntasRespondidas = tentativaData.respostas.map((r: any) => r.perguntaId);
        const proximaPerguntaIndex = perguntasData.findIndex(
          (p: Pergunta) => !perguntasRespondidas.includes(p.id)
        );
        if (proximaPerguntaIndex !== -1) {
          setPerguntaAtualIndex(proximaPerguntaIndex);
        } else {
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

  const enviarResposta = useCallback(
    async (alternativaId: number | null, tempoEsgotado: boolean = false) => {
      if (respondida || !tentativaId) return;

      const pergunta = perguntas[perguntaAtualIndex];
      const tempoLimite = tentativa?.quiz?.fase?.jornada?.tempoLimitePorQuestao || 0;
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
        
        if (tempoEsgotado || (!alternativaId && tempoLimite > 0)) {
          setTimeout(() => {
            if (perguntaAtualIndex < perguntas.length - 1) {
              setPerguntaAtualIndex(perguntaAtualIndex + 1);
              setRespondida(false);
              setFeedback(null);
              setAlternativaSelecionada(null);
            } else {
              finalizarPerguntas();
            }
          }, 1000);
        } else {
          setFeedback({
            acertou: resultado.acertou,
            pontuacao: resultado.pontuacao,
            tempoEsgotado: resultado.tempoEsgotado || tempoEsgotado,
          });

          setTimeout(() => {
            if (perguntaAtualIndex < perguntas.length - 1) {
              setPerguntaAtualIndex(perguntaAtualIndex + 1);
              setRespondida(false);
              setFeedback(null);
              setAlternativaSelecionada(null);
            } else {
              finalizarPerguntas();
            }
          }, 3000);
        }
      } catch (error: any) {
        console.error('Erro ao enviar resposta:', error);
        setErro(error.response?.data?.error || 'Erro ao enviar resposta');
        setRespondida(false);
      }
    },
    [respondida, tentativaId, perguntas, perguntaAtualIndex, tempoRestante, finalizarPerguntas, tentativa]
  );

  useEffect(() => {
    if (tentativaId && !carregandoRef.current) {
      carregarTentativa();
    }
  }, [tentativaId, carregarTentativa]);

  // Interceptador de navegação
  useEffect(() => {
    const handleNavigation = async (path: string) => {
      // Se já permitiu navegação ou está indo para a página de resultado, permitir
      if (permitirNavegacao || path.includes(`/participante/resultado/${tentativaId}`)) {
        return true;
      }

      // Mostrar diálogo de confirmação
      const confirmarSaida = await confirm({
        title: 'Deseja sair da avaliação?',
        message: 'Seu progresso será salvo. Se você não respondeu a pergunta atual, ela será marcada como não respondida.',
        confirmText: 'Sim, sair',
        cancelText: 'Continuar respondendo',
        type: 'warning',
      });

      if (confirmarSaida) {
        // Salvar a resposta não respondida se necessário
        await salvarRespostaNaoRespondida();
        setPermitirNavegacao(true);
        return true;
      }

      return false;
    };

    registerInterceptor(handleNavigation);

    // Cleanup: remover interceptador ao desmontar
    return () => {
      registerInterceptor(null);
    };
  }, [permitirNavegacao, tentativaId, confirm, salvarRespostaNaoRespondida, registerInterceptor]);

  // Prevenir fechamento/recarregamento da página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!permitirNavegacao) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [permitirNavegacao]);

  // Interceptar botão de voltar do navegador
  useEffect(() => {
    if (permitirNavegacao) return;

    // Adicionar uma entrada no histórico
    window.history.pushState(null, '', window.location.href);

    const handlePopState = async (event: PopStateEvent) => {
      if (!permitirNavegacao) {
        // Adicionar novamente a entrada no histórico para manter o usuário na página
        window.history.pushState(null, '', window.location.href);

        // Mostrar diálogo de confirmação
        const confirmarSaida = await confirm({
          title: 'Deseja sair da avaliação?',
          message: 'Seu progresso será salvo. Se você não respondeu a pergunta atual, ela será marcada como não respondida.',
          confirmText: 'Sim, sair',
          cancelText: 'Continuar respondendo',
          type: 'warning',
        });

        if (confirmarSaida) {
          // Salvar a resposta não respondida se necessário
          await salvarRespostaNaoRespondida();
          setPermitirNavegacao(true);
          // Navegar de volta
          window.history.back();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [permitirNavegacao, confirm, salvarRespostaNaoRespondida]);

  useEffect(() => {
    // Limpar todos os intervalos anteriores
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
    if (progressoIntervaloRef.current) {
      clearInterval(progressoIntervaloRef.current);
      progressoIntervaloRef.current = null;
    }
    inicioTimerRef.current = null;

    // Se não há perguntas válidas, não inicia timer
    if (perguntas.length === 0 || perguntaAtualIndex >= perguntas.length) {
      setTimerIniciado(false);
      setTempoDecorrido(0);
      return;
    }

    const tempoLimiteQuestao = tentativa?.quiz?.fase?.jornada?.tempoLimitePorQuestao;

    if (tempoLimiteQuestao && tempoLimiteQuestao > 0 && !respondida) {
      // Configura estados iniciais
      setTempoRestante(tempoLimiteQuestao);
      setTempoDecorrido(0);
      setTimerIniciado(true);
      setFeedback(null);
      inicioTimerRef.current = Date.now();

      // Intervalo "lógico" em segundos
      intervaloRef.current = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            if (intervaloRef.current) {
              clearInterval(intervaloRef.current);
              intervaloRef.current = null;
            }
            if (progressoIntervaloRef.current) {
              clearInterval(progressoIntervaloRef.current);
              progressoIntervaloRef.current = null;
            }
            setTempoDecorrido(100);
            if (!respondida) {
              setMostrarDialogoTempoEsgotado(true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Intervalo da animação da barra (mais suave, ~10 FPS)
      progressoIntervaloRef.current = setInterval(() => {
        if (!inicioTimerRef.current) return;
        const elapsedMs = Date.now() - inicioTimerRef.current;
        const totalMs = tempoLimiteQuestao * 1000;
        const perc = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
        setTempoDecorrido(perc);
      }, 100);

      // Cleanup quando índice de pergunta / tentativa / respondida mudar ou componente desmontar
      return () => {
        if (intervaloRef.current) {
          clearInterval(intervaloRef.current);
          intervaloRef.current = null;
        }
        if (progressoIntervaloRef.current) {
          clearInterval(progressoIntervaloRef.current);
          progressoIntervaloRef.current = null;
        }
        inicioTimerRef.current = null;
      };
    } else {
      // Sem tempo limite, não inicia timer
      setTempoRestante(0);
      setTempoDecorrido(0);
      setTimerIniciado(false);
      setFeedback(null);
    }
  }, [perguntaAtualIndex, perguntas, respondida, tentativa]);

  const handleResponder = () => {
    if (alternativaSelecionada !== null) {
      enviarResposta(alternativaSelecionada, false);
    }
  };

  const handleConfirmarTempoEsgotado = () => {
    setMostrarDialogoTempoEsgotado(false);
    enviarResposta(null, true);
  };

  const handleNavigateTo = async (path: string) => {
    const canNavigate = await checkNavigation(path);
    if (canNavigate) {
      navigate(path);
    }
  };

  const pergunta = perguntas[perguntaAtualIndex] || null;
  const tempoLimite = tentativa?.quiz?.fase?.jornada?.tempoLimitePorQuestao || 0;
  const jornadaId = tentativa?.quiz?.fase?.jornada?.id;

  if (loading) {
    return (
      <LoadingScreen 
        messages={[
          'Preparando as perguntas',
          'Misturando as alternativas',
          'Você consegue acertar todas?'
        ]}
        messageInterval={1500}
      />
    );
  }

  if (erro || !tentativa || perguntas.length === 0) {
    return (
      <ParticipantLayout>
        <Container>
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro || 'Erro ao carregar perguntas'}
          </Alert>
          <Button onClick={() => handleNavigateTo('/dashboard')} sx={{ mt: 2 }}>
            Voltar ao Dashboard
          </Button>
        </Container>
      </ParticipantLayout>
    );
  }

  return (
    <>
      {tempoLimite > 0 && !respondida && timerIniciado && (
        <Box
          sx={{
            position: 'fixed',
            top: 64,
            left: { xs: 0, sm: '80px' },
            right: 0,
            zIndex: 1200,
          }}
        >
          <LinearProgress
            variant="determinate"
            value={tempoDecorrido}
            sx={{
              height: 6,
              backgroundColor: 'rgba(255, 44, 25, 0.15)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: tempoRestante <= 10 ? '#ff2c19' : '#FFC107',
                // transição curta, mas com updates a cada 100ms fica bem suave
                transition: 'transform 0.2s linear, background-color 0.3s ease',
              },
            }}
          />
        </Box>
      )}

      <ParticipantLayout>
        <Container maxWidth="lg">
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
              onClick={() => handleNavigateTo('/dashboard')}
              sx={{ 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center',
                color: 'text.secondary',
                textDecoration: 'none',
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
                onClick={() => handleNavigateTo(`/participante/jornadas/${jornadaId}/fases`)}
                sx={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center',
                  color: 'text.secondary',
                  textDecoration: 'none',
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

          <Paper
            sx={{
              p: 5,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'box-shadow 0.2s ease',
              mb: 3,
            }}
          >
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

      <ConfirmDialog
        open={mostrarDialogoTempoEsgotado}
        title="Tempo Limite Excedido"
        message="O tempo limite para responder esta pergunta foi excedido. A pergunta será marcada como não respondida e você será direcionado para a próxima pergunta."
        type="warning"
        onConfirm={handleConfirmarTempoEsgotado}
        onCancel={handleConfirmarTempoEsgotado}
        hideButtons={true}
      />
    </>
  );
};

export default ParticipanteQuiz;
