import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  CircularProgress,
  Alert,
  Chip,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import {
  Home as HomeIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  ArrowBack as ArrowBackIcon,
  Quiz as QuizIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import ParticipantLayout from '../../components/ParticipantLayout';
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext';
import { useToast } from '../../contexts/ToastContext';

interface Fase {
  id: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  desbloqueada: boolean;
  faseAtual?: boolean;
  totalPerguntas?: number;
  finalizada?: boolean;
}

interface Jornada {
  id: number;
  titulo: string;
  imagemCapa?: string;
  tempoLimitePorQuestao?: number | null;
}

const FasesJornada: React.FC = () => {
  const { jornadaId } = useParams<{ jornadaId: string }>();
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const { showError } = useToast();
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [fases, setFases] = useState<Fase[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarFases = useCallback(async () => {
    if (!jornadaId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/jornadas/${jornadaId}/fases`);
      const dados = response.data.data || response.data;
      setJornada(dados.jornada);
      setFases(dados.fases || []);
    } catch (error: any) {
      let mensagemErro = 'Erro ao carregar fases da jornada';
      
      if (error.response?.data?.error) {
        if (typeof error.response.data.error === 'string') {
          mensagemErro = error.response.data.error;
        } else if (error.response.data.error?.message) {
          mensagemErro = error.response.data.error.message;
        }
      } else if (error.message) {
        mensagemErro = error.message;
      }
      
      showError(mensagemErro);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jornadaId]);

  useEffect(() => {
    carregarFases();
  }, [carregarFases]);

  const handleAbrirFase = async (faseId: number) => {
    const tempoLimite = jornada?.tempoLimitePorQuestao;
    
    let mensagem = 'Tem certeza que deseja começar esta fase?';
    if (tempoLimite && tempoLimite > 0) {
      mensagem = `Esta fase possui um tempo limite de ${tempoLimite} segundo${tempoLimite > 1 ? 's' : ''} por pergunta. Tem certeza que deseja começar?`;
    }

    const confirmado = await confirm({
      title: 'Confirmar Início da Fase',
      message: mensagem,
      confirmText: 'Sim, começar',
      cancelText: 'Cancelar',
      type: 'info',
    });

    if (!confirmado) {
      return;
    }

    try {
      // Buscar os quizzes da fase
      const quizzesResponse = await api.get(`/quizzes?faseId=${faseId}`);
      const quizzes = quizzesResponse.data.data || quizzesResponse.data;
      
      if (!quizzes || quizzes.length === 0) {
        showError('Nenhum quiz disponível nesta fase.');
        return;
      }

      // Pegar o primeiro quiz da fase
      const primeiroQuiz = quizzes[0];
      
      // Verificar se o quiz tem perguntas
      const totalPerguntas = primeiroQuiz._count?.perguntas || primeiroQuiz.perguntas?.length || 0;
      
      if (totalPerguntas === 0) {
        showError('Não há nenhuma pergunta cadastrada nesta fase. Entre em contato com o administrador.');
        return;
      }
      
      // Iniciar a tentativa do quiz
      const tentativaResponse = await api.post(`/tentativas/quiz/${primeiroQuiz.id}/iniciar`);
      const tentativa = tentativaResponse.data.data;
      
      // Navegar direto para as perguntas
      navigate(`/participante/quiz/${tentativa.id}`);
    } catch (error: any) {
      let mensagemErro = 'Erro ao iniciar fase';
      
      if (error.response?.data?.error) {
        // Se for uma string, usar diretamente
        if (typeof error.response.data.error === 'string') {
          mensagemErro = error.response.data.error;
        } 
        // Se for um objeto com message, usar a message
        else if (error.response.data.error?.message) {
          mensagemErro = error.response.data.error.message;
        }
        // Se for um objeto, tentar converter para string
        else {
          mensagemErro = JSON.stringify(error.response.data.error);
        }
      } else if (error.message) {
        mensagemErro = error.message;
      }
      
      showError(mensagemErro);
    }
  };

  if (loading) {
    return (
      <ParticipantLayout title="Fases da Jornada">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </ParticipantLayout>
    );
  }

  return (
    <ParticipantLayout title="Fases da Jornada">
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
          <Typography 
            color="text.primary"
            sx={{
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            {jornada?.titulo || 'Jornada'}
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton 
            onClick={() => navigate('/dashboard')} 
            size="small"
            sx={{
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                fontSize: '2rem',
                background: 'linear-gradient(135deg, #011b49 0%, #1a3a6b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 0.5,
                letterSpacing: '-0.02em',
              }}
            >
              {jornada?.titulo || 'Fases da Jornada'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.875rem',
                mt: 0.5,
              }}
            >
              Acesse as fases desbloqueadas e inicie seus quizzes
            </Typography>
          </Box>
        </Box>

        {fases.length === 0 ? (
          <Alert severity="info">
            Nenhuma fase desbloqueada disponível nesta jornada no momento.
          </Alert>
        ) : (
          <Grid container spacing={3}>
            {fases.map((fase) => (
              <Grid item xs={12} md={6} lg={4} key={fase.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: fase.finalizada ? 0.6 : fase.desbloqueada ? 1 : 0.6,
                    backgroundColor: fase.finalizada ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': fase.desbloqueada && !fase.finalizada ? {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    } : {},
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Chip 
                        label={`${fase.ordem}º`} 
                        size="small" 
                        color={fase.finalizada ? 'default' : 'primary'}
                        sx={{
                          backgroundColor: fase.finalizada ? 'rgba(0, 0, 0, 0.2)' : undefined,
                        }}
                      />
                      {fase.finalizada ? (
                        <LockIcon color="disabled" />
                      ) : fase.desbloqueada ? (
                        <LockOpenIcon color="success" />
                      ) : (
                        <LockIcon color="disabled" />
                      )}
                    </Box>
                    <Typography 
                      variant="h6" 
                      component="h2" 
                      gutterBottom
                      sx={{
                        color: fase.finalizada ? 'text.disabled' : 'text.primary',
                      }}
                    >
                      {fase.titulo}
                    </Typography>
                    {fase.descricao && (
                      <Typography 
                        variant="body2" 
                        color={fase.finalizada ? 'text.disabled' : 'text.secondary'} 
                        paragraph
                      >
                        {fase.descricao}
                      </Typography>
                    )}
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <QuizIcon fontSize="small" color={fase.finalizada ? 'disabled' : 'action'} />
                      <Typography 
                        variant="body2" 
                        color={fase.finalizada ? 'text.disabled' : 'text.secondary'}
                      >
                        {(fase.totalPerguntas || 0) > 0 
                          ? `${fase.totalPerguntas} ${fase.totalPerguntas === 1 ? 'Pergunta' : 'Perguntas'}` 
                          : 'Sem perguntas'}
                      </Typography>
                    </Box>
                    {fase.finalizada && (
                      <Chip
                        label="Finalizada"
                        size="small"
                        sx={{
                          mt: 2,
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                          color: 'text.secondary',
                        }}
                      />
                    )}
                  </CardContent>
                  <CardActions sx={{ flexDirection: 'column', gap: 1, p: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AccessTimeIcon />}
                      disabled={!fase.desbloqueada || fase.finalizada}
                      onClick={() => fase.desbloqueada && !fase.finalizada && handleAbrirFase(fase.id)}
                      fullWidth
                      sx={{
                        bgcolor: fase.finalizada ? 'rgba(0, 0, 0, 0.12)' : '#e62816',
                        color: fase.finalizada ? 'rgba(0, 0, 0, 0.26)' : '#fff',
                        '&:hover': {
                          bgcolor: fase.finalizada ? 'rgba(0, 0, 0, 0.12)' : '#c52214',
                        },
                        '&:disabled': {
                          bgcolor: 'rgba(0, 0, 0, 0.12)',
                          color: 'rgba(0, 0, 0, 0.26)',
                        },
                      }}
                    >
                      {fase.finalizada 
                        ? 'Fase Finalizada' 
                        : fase.desbloqueada 
                        ? 'Começar Fase' 
                        : 'Bloqueada'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </ParticipantLayout>
  );
};

export default FasesJornada;

