import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import ParticipantLayout from '../../components/ParticipantLayout';
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext';
import { useToast } from '../../contexts/ToastContext';
import FasesTabuleiro from '../../components/FasesTabuleiro';
import { LoadingScreen } from '../../components/LoadingScreen';

interface Fase {
  id: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  desbloqueada: boolean;
  faseAtual?: boolean;
  totalPerguntas?: number;
  finalizada?: boolean;
  ativo?: boolean;
  aguardandoDesbloqueio?: boolean;
  dataDesbloqueio?: string | Date | null;
  dataBloqueio?: string | Date | null;
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
  const [mostrarLoadingFase, setMostrarLoadingFase] = useState(false);
  const [tentativaIdParaNavegar, setTentativaIdParaNavegar] = useState<string | null>(null);

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
      
      // Guardar ID da tentativa e mostrar loading com mensagens
      setTentativaIdParaNavegar(tentativa.id);
      setMostrarLoadingFase(true);
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

  // Função chamada quando o loading termina
  const handleLoadingFaseComplete = () => {
    if (tentativaIdParaNavegar) {
      navigate(`/participante/quiz/${tentativaIdParaNavegar}`);
    }
  };

  // Mostrar loading com mensagens divertidas ao iniciar fase
  if (mostrarLoadingFase) {
    return (
      <LoadingScreen 
        messages={[
          'Preparando as perguntas',
          'Você está pronto?',
          'Lembre-se: não há resposta errada... só perguntas difíceis!',
          'Concentre-se e boa sorte!',
          'Vamos começar!',
        ]}
        messageInterval={1000}
        onComplete={handleLoadingFaseComplete}
      />
    );
  }

  if (loading) {
    return (
      <LoadingScreen 
        messages={[
          'Carregando as fases',
          'Preparando os desafios',
          'Vamos ver o que você sabe!'
        ]}
        messageInterval={1500}
      />
    );
  }

  return (
      <ParticipantLayout title="Fases da Jornada">
      <Container maxWidth="lg">
        <Box sx={{ position: 'relative', mb: 3 }}>
          <IconButton 
            onClick={() => navigate('/participante/jornadas')} 
            size="small"
            sx={{
              position: 'absolute',
              left: -56,
              top: '50%',
              transform: 'translateY(-50%)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
            title="Voltar"
          >
            <ArrowBackIcon />
          </IconButton>
          <Breadcrumbs 
            sx={{ 
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
            <Link
              component="button"
              onClick={() => navigate('/participante/jornadas')}
              sx={{ 
                cursor: 'pointer',
                textDecoration: 'none',
                color: 'text.secondary',
                transition: 'all 0.2s ease',
                borderRadius: 1,
                px: 0.75,
                py: 0.5,
                fontWeight: 400,
                '&:hover': { 
                  color: 'primary.main',
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                  textDecoration: 'none',
                },
              }}
            >
              Jornadas
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
        </Box>

        <Box sx={{ position: 'relative', mb: 4 }}>
          {/* Título e descrição centralizados */}
          <Box sx={{ textAlign: 'center' }}>
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
          <Alert severity="info" sx={{ mb: 3 }}>
            Nenhuma fase disponível nesta jornada no momento.
          </Alert>
        ) : (
          <Box sx={{ mb: 3 }}>
            <FasesTabuleiro
              fases={fases.map((fase) => ({
                id: fase.id,
                ordem: fase.ordem,
                titulo: fase.titulo,
                desbloqueada: fase.desbloqueada ?? false,
                finalizada: fase.finalizada ?? false,
                aguardandoDesbloqueio: fase.aguardandoDesbloqueio ?? false,
                ativo: fase.ativo ?? true, // Default true se não vier do backend
              }))}
              onFaseClick={(faseId) => {
                const fase = fases.find((f) => f.id === faseId);
                // O backend já calcula tudo: se desbloqueada é true, a fase está ativa e desbloqueada
                if (fase && fase.desbloqueada && !fase.finalizada) {
                  handleAbrirFase(faseId);
                }
              }}
              isAdmin={false}
              showConnections={true}
            />
          </Box>
        )}
      </Container>
    </ParticipantLayout>
  );
};

export default FasesJornada;

