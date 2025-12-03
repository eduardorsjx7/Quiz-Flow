import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Chip,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  CalendarToday as CalendarIcon,
  Edit as EditIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Cancel as CancelIcon,
  Home as HomeIcon,
  DragIndicator as DragIndicatorIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext';
import { LoadingOverlay } from '../../components/LoadingOverlay';

interface FaseConfig {
  id: number;
  titulo: string;
  ordem: number;
  dataDesbloqueio: Date | null;
  dataBloqueio: Date | null;
  pontuacao: number;
  faseAberta: boolean;
  ativo?: boolean;
}

interface ConfiguracaoJornada {
  ativo: boolean;
  mostrarQuestaoCerta: boolean;
  mostrarTaxaErro: boolean;
  mostrarPodio: boolean;
  mostrarRanking: boolean;
  permitirTentativasIlimitadas: boolean;
  tempoLimitePorQuestao: number | null;
  status?: string; // Status da jornada: 'Ativa', 'Inativa', 'Fechada', 'Bloqueada'
}

const ConfigurarJornada: React.FC = () => {
  const { jornadaId } = useParams<{ jornadaId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmDialog();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [jornada, setJornada] = useState<any>(null);
  const [fases, setFases] = useState<FaseConfig[]>([]);
  const [faseEditando, setFaseEditando] = useState<FaseConfig | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [mostrarSeta, setMostrarSeta] = useState(false);
  const [temAlteracoes, setTemAlteracoes] = useState(false);
  const [configuracao, setConfiguracao] = useState<ConfiguracaoJornada>({
    ativo: true,
    mostrarQuestaoCerta: true,
    mostrarTaxaErro: true,
    mostrarPodio: true,
    mostrarRanking: true,
    permitirTentativasIlimitadas: false,
    tempoLimitePorQuestao: null,
  });

  const ordenarFasesPorDataDesbloqueio = (fasesArray: FaseConfig[]): FaseConfig[] => {
    return [...fasesArray].sort((a, b) => {
      // Fases sem data de desbloqueio vão para o final
      if (!a.dataDesbloqueio && !b.dataDesbloqueio) return a.ordem - b.ordem;
      if (!a.dataDesbloqueio) return 1;
      if (!b.dataDesbloqueio) return -1;
      
      // Ordenar por data de desbloqueio
      const timeA = a.dataDesbloqueio.getTime();
      const timeB = b.dataDesbloqueio.getTime();
      
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      
      // Se as datas forem iguais, manter a ordem original
      return a.ordem - b.ordem;
    }).map((fase, index) => ({
      ...fase,
      ordem: index + 1
    }));
  };

  const getStatusInfo = (fase: FaseConfig) => {
    const agora = new Date();

    if (fase.faseAberta) {
      return {
        label: 'Aberta',
        color: 'success' as const,
      };
    }

    if (fase.dataBloqueio && fase.dataBloqueio.getTime() <= agora.getTime()) {
      return {
        label: 'Bloqueada',
        color: 'error' as const,
      };
    }

    if (fase.dataDesbloqueio && fase.dataDesbloqueio.getTime() > agora.getTime()) {
      return {
        label: 'Aguardando desbloqueio',
        color: 'warning' as const,
      };
    }

    return {
      label: 'Bloqueada',
      color: 'error' as const,
    };
  };

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jornadaId]);

  const carregarDados = async () => {
    if (!jornadaId) return;

    try {
      setLoading(true);
      setErro('');

      // Carregar dados da jornada
      const response = await api.get(`/jornadas/${jornadaId}`);
      const dados = response.data.data || response.data;
      setJornada(dados);

      // Carregar configurações existentes (sempre retorna fases)
      let fasesCarregadas: FaseConfig[] = [];
      
      try {
        const configResponse = await api.get(`/jornadas/${jornadaId}/configuracao`);
        const configData = configResponse.data.data || configResponse.data;
        
        if (configData.configuracao) {
          setConfiguracao({
            ativo: configData.configuracao.ativo ?? dados.ativo ?? true,
            ...configData.configuracao,
          });
        } else {
          setConfiguracao({
            ativo: dados.ativo ?? true,
            mostrarQuestaoCerta: true,
            mostrarTaxaErro: true,
            mostrarPodio: true,
            mostrarRanking: true,
            permitirTentativasIlimitadas: false,
            tempoLimitePorQuestao: null,
          });
        }

        // Sempre usar as fases da resposta de configuração
        if (configData.fases && Array.isArray(configData.fases) && configData.fases.length > 0) {
          fasesCarregadas = configData.fases.map((fase: any) => ({
            id: fase.id,
            titulo: fase.titulo,
            ordem: fase.ordem,
            dataDesbloqueio: fase.dataDesbloqueio 
              ? new Date(fase.dataDesbloqueio) 
              : null,
            dataBloqueio: fase.dataBloqueio 
              ? new Date(fase.dataBloqueio) 
              : null,
            pontuacao: fase.pontuacao || 100,
            faseAberta: !fase.dataDesbloqueio,
            ativo: fase.ativo !== undefined ? fase.ativo : true,
          }));
        }
      } catch (configError: any) {
        // Se houver erro ao buscar configuração, logar mas continuar
        console.warn('Erro ao carregar configuração, usando dados da jornada:', configError);
        // Inicializar configuração com valores padrão
        setConfiguracao({
          ativo: dados.ativo ?? true,
          mostrarQuestaoCerta: true,
          mostrarTaxaErro: true,
          mostrarPodio: true,
          mostrarRanking: true,
          permitirTentativasIlimitadas: false,
          tempoLimitePorQuestao: null,
        });
      }

      // Se não conseguiu carregar fases da configuração, usar as fases da jornada
      if (fasesCarregadas.length === 0) {
        const fasesDaJornada = dados.fases || [];
        if (fasesDaJornada.length > 0) {
          fasesCarregadas = fasesDaJornada.map((fase: any) => ({
            id: fase.id,
            titulo: fase.titulo,
            ordem: fase.ordem,
            dataDesbloqueio: null,
            dataBloqueio: null,
            pontuacao: 100,
            faseAberta: true,
            ativo: fase.ativo !== undefined ? fase.ativo : true,
          }));
        }
      }

      // Definir as fases (manter a ordem exata do backend ao carregar)
      if (fasesCarregadas.length > 0) {
        // Manter a ordem exata que vem do backend, apenas ordenar numericamente
        const fasesOrdenadasPorBackend = [...fasesCarregadas].sort((a, b) => a.ordem - b.ordem);
        
        // Manter todas as fases na ordem do backend (não ordenar por data ao carregar)
        // A ordenação por data só acontece quando o usuário define/altera uma data
        setFases(fasesOrdenadasPorBackend);
      } else {
        setFases([]);
        showError('Esta jornada não possui fases cadastradas');
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados da jornada:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      let errorMessage = 'Erro ao carregar dados da jornada';
      
      if (error.response) {
        // Erro com resposta do servidor
        if (error.response.status === 401) {
          errorMessage = 'Não autorizado. Faça login novamente.';
        } else if (error.response.status === 403) {
          errorMessage = 'Acesso negado. Você não tem permissão para acessar esta jornada.';
        } else if (error.response.status === 404) {
          errorMessage = 'Jornada não encontrada.';
        } else {
          errorMessage = error.response?.data?.error?.message 
            || error.response?.data?.error 
            || error.response?.data?.message
            || `Erro do servidor (${error.response.status})`;
        }
      } else if (error.request) {
        // Erro de rede (sem resposta)
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else {
        // Outro tipo de erro
        errorMessage = error.message || 'Erro desconhecido ao carregar dados da jornada';
      }
      
      setErro(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
      setTemAlteracoes(false); // Resetar alterações ao carregar
    }
  };

  const handleConfiguracaoChange = (field: keyof ConfiguracaoJornada, value: any) => {
    setConfiguracao({ ...configuracao, [field]: value });
    setTemAlteracoes(true);
  };

  const handleSalvar = async () => {
    if (!jornadaId) return;

    try {
      setSaving(true);
      setErro('');

      // Calcular status da jornada
      const temSequenciaDesbloqueio = fases.some(f => f.dataDesbloqueio !== null);
      const estaBloqueada = !configuracao.ativo && temSequenciaDesbloqueio && fases.length > 0;
      const status = estaBloqueada ? 'Bloqueada' : configuracao.ativo ? 'Ativa' : 'Inativa';

      const dadosEnvio = {
        fases: fases.map((fase) => ({
          faseId: fase.id,
          ordem: fase.ordem,
          // Se fase está aberta e não tem datas, enviar null; se tem datas, preservar as datas
          dataDesbloqueio: fase.faseAberta && !fase.dataDesbloqueio ? null : (fase.dataDesbloqueio?.toISOString() || null),
          dataBloqueio: fase.faseAberta && !fase.dataBloqueio ? null : (fase.dataBloqueio?.toISOString() || null),
          pontuacao: fase.pontuacao,
          ativo: fase.ativo !== undefined ? fase.ativo : true,
        })),
        configuracao: {
          ...configuracao,
          status, // Enviar status para o backend
        },
      };

      await api.put(`/jornadas/${jornadaId}/configuracao`, dadosEnvio);
      setTemAlteracoes(false);
      showSuccess('Configurações salvas com sucesso!', 'Sucesso');
      // Redirecionar para a tela anterior após salvar
      setTimeout(() => {
        navigate(-1);
      }, 1000);
    } catch (error: any) {
      const mensagemErro = error.response?.data?.error?.message || 'Erro ao salvar configurações';
      setErro(mensagemErro);
      showError(mensagemErro, 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Configurar Jornada">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (erro && !jornada) {
    return (
      <AdminLayout title="Configurar Jornada">
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 2 }}>
            {typeof erro === 'string' ? erro : JSON.stringify(erro)}
          </Alert>
          <Button onClick={() => navigate(`/admin/jornadas/${jornadaId}/fases`)} startIcon={<ArrowBackIcon />}>
            Voltar
          </Button>
        </Container>
      </AdminLayout>
    );
  }

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date: Date | null): string => {
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const combineDateAndTime = (dateStr: string, timeStr: string): Date | null => {
    if (!dateStr) return null;
    if (!timeStr) {
      // Se não tem hora, usar meia-noite
      return new Date(`${dateStr}T00:00`);
    }
    return new Date(`${dateStr}T${timeStr}`);
  };

  const formatDateTimeDisplay = (date: Date | null): string => {
    if (!date) return 'Não definida';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleAbrirModal = (fase: FaseConfig) => {
    setFaseEditando({ ...fase });
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setFaseEditando(null);
  };

  const validarDatas = (dataDesbloqueio: Date | null, dataBloqueio: Date | null): boolean => {
    if (dataDesbloqueio && dataBloqueio) {
      // Permitir que sejam iguais, mas não permitir que bloqueio seja anterior a desbloqueio
      if (dataDesbloqueio.getTime() > dataBloqueio.getTime()) {
        showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
        return false;
      }
    }
    return true;
  };

  const handleSalvarFase = () => {
    if (!faseEditando) return;
    
    // Se a fase está fechada, validar datas
    if (!faseEditando.faseAberta) {
      // Validar se dataDesbloqueio < dataBloqueio
      if (!validarDatas(faseEditando.dataDesbloqueio, faseEditando.dataBloqueio)) {
        return;
      }
    }
    
    const faseOriginal = fases.find(f => f.id === faseEditando.id);
    const temMudancas = faseOriginal && (
      faseOriginal.dataDesbloqueio?.getTime() !== faseEditando.dataDesbloqueio?.getTime() ||
      faseOriginal.dataBloqueio?.getTime() !== faseEditando.dataBloqueio?.getTime() ||
      faseOriginal.pontuacao !== faseEditando.pontuacao ||
      faseOriginal.faseAberta !== faseEditando.faseAberta
    );
    
    // Se a fase está fechada, calcular o status ativo baseado nas datas
    let ativoCalculado = faseEditando.ativo;
    if (!faseEditando.faseAberta) {
      const agora = new Date();
      if (faseEditando.dataDesbloqueio) {
        const desbloqueada = faseEditando.dataDesbloqueio.getTime() <= agora.getTime();
        const bloqueada = faseEditando.dataBloqueio 
          ? faseEditando.dataBloqueio.getTime() <= agora.getTime() 
          : false;
        // Fase está ativa se foi desbloqueada e não foi bloqueada
        ativoCalculado = desbloqueada && !bloqueada;
      } else {
        // Se não tem data de desbloqueio, fase está inativa
        ativoCalculado = false;
      }
    } else {
      // Se a fase está aberta, sempre ativa
      ativoCalculado = true;
    }
    
    // Atualizar a fase editada
    let fasesAtualizadas = fases.map((fase) =>
      fase.id === faseEditando.id 
        ? { 
            ...fase, 
            dataDesbloqueio: faseEditando.dataDesbloqueio, 
            dataBloqueio: faseEditando.dataBloqueio,
            pontuacao: faseEditando.pontuacao,
            faseAberta: faseEditando.faseAberta,
            ativo: ativoCalculado,
          }
        : fase
    );
    
    // Se a data de desbloqueio foi definida ou alterada, ordenar automaticamente as fases
    const dataDesbloqueioMudou = faseOriginal?.dataDesbloqueio?.getTime() !== faseEditando.dataDesbloqueio?.getTime();
    const dataFoiDefinida = !faseOriginal?.dataDesbloqueio && faseEditando.dataDesbloqueio;
    const dataFoiRemovida = faseOriginal?.dataDesbloqueio && !faseEditando.dataDesbloqueio;
    
    if (dataDesbloqueioMudou && (dataFoiDefinida || faseEditando.dataDesbloqueio)) {
      // Ordenar apenas se uma data foi definida ou alterada (não ordenar se foi removida)
      if (!dataFoiRemovida) {
        fasesAtualizadas = ordenarFasesPorDataDesbloqueio(fasesAtualizadas);
        showSuccess('Fases reordenadas automaticamente pela data de desbloqueio', 'Ordem atualizada');
      }
    }
    
    setFases(fasesAtualizadas);
    
    if (temMudancas) {
      setTemAlteracoes(true);
    }
    
    handleFecharModal();
  };

  const handleExcluirFase = async (fase: FaseConfig) => {
    const resultado = await confirm({
      title: 'Excluir fase?',
      message: `Tem certeza que deseja excluir a fase "${fase.titulo}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Sim, excluir',
      cancelText: 'Cancelar',
      type: 'delete',
    });

    if (!resultado) return;

    try {
      await api.delete(`/v1/fases/${fase.id}`);
      
      // Remover a fase da lista local
      const fasesAtualizadas = fases
        .filter(f => f.id !== fase.id)
        .map((f, index) => ({
          ...f,
          ordem: index + 1,
        }));
      
      setFases(fasesAtualizadas);
      setTemAlteracoes(true);
      showSuccess(`Fase "${fase.titulo}" excluída com sucesso`, 'Fase excluída');
    } catch (error: any) {
      console.error('Erro ao excluir fase:', error);
      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.error 
        || error.response?.data?.message
        || 'Erro ao excluir fase';
      showError(errorMessage, 'Erro ao excluir');
    }
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const origemIndex = result.source.index;
    const destinoIndex = result.destination.index;

    if (origemIndex === destinoIndex) return;

    // Verificar se a fase que está sendo arrastada está aberta
    const fasesOrdenadas = [...fases].sort((a, b) => a.ordem - b.ordem);
    const faseArrastada = fasesOrdenadas[origemIndex];
    if (!faseArrastada.faseAberta) {
      showError('Apenas fases abertas podem ser reordenadas manualmente', 'Reordenação não permitida');
      return; // Não permite arrastar se a fase não estiver aberta
    }

    const novasFases = Array.from(fasesOrdenadas);
    const [removida] = novasFases.splice(origemIndex, 1);
    novasFases.splice(destinoIndex, 0, removida);

    const fasesReordenadas = novasFases.map((fase, index) => ({
      ...fase,
      ordem: index + 1,
    }));

    setFases(fasesReordenadas);
    setTemAlteracoes(true);
  };

  const handleCancelar = async () => {
    if (temAlteracoes) {
      const resultado = await confirm({
        title: 'Cancelar alterações?',
        message: 'Você tem alterações não salvas. Deseja realmente cancelar? Todas as alterações serão perdidas.',
        confirmText: 'Sim, cancelar',
        cancelText: 'Não',
        type: 'warning',
      });
      
      if (resultado) {
        navigate(`/admin/jornadas/${jornadaId}/fases`);
      }
    } else {
      navigate(`/admin/jornadas/${jornadaId}/fases`);
    }
  };

  return (
    <>
      <LoadingOverlay 
        open={saving} 
        messages={['Salvando configurações', 'Atualizando fases', 'Processando dados', 'Finalizando']}
      />
      <AdminLayout title={`Configurar Jornada - ${jornada?.titulo || ''}`}>
        <Container maxWidth="lg">
          <Box sx={{ position: 'relative', mb: 3 }}>
            <IconButton 
              onClick={() => navigate(`/admin/jornadas/${jornadaId}/fases`)}
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
                onClick={() => navigate('/admin')}
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
                onClick={() => navigate('/admin/fases')}
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
                Fases
              </Link>
              <Link
                component="button"
                onClick={() => navigate(`/admin/jornadas/${jornadaId}/fases`)}
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
                {jornada?.titulo || 'Jornada'}
              </Link>
              <Typography 
                color="text.primary"
                sx={{
                  fontWeight: 500,
                  fontSize: '0.95rem',
                }}
              >
                Configuração Jornada
              </Typography>
            </Breadcrumbs>
          </Box>
          {/* Cabeçalho */}
          <Box sx={{ mb: 4 }}>
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
                Configurar Jornada
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 0.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                  }}
                >
                  {jornada?.titulo}
                </Typography>
                {(() => {
                  // Calcular status baseado nas configurações atuais
                  const temSequenciaDesbloqueio = fases.some(f => f.dataDesbloqueio !== null);
                  const estaFechada = !configuracao.ativo && (fases.every(f => !f.dataDesbloqueio) || fases.length === 0);
                  const estaBloqueada = !configuracao.ativo && temSequenciaDesbloqueio && fases.length > 0;
                  
                  let label = 'Ativa';
                  let color: 'success' | 'default' | 'warning' | 'error' = 'success';
                  
                  if (estaFechada) {
                    label = 'Fechada';
                    color = 'default';
                  } else if (estaBloqueada) {
                    label = 'Bloqueada';
                    color = 'error';
                  } else if (configuracao.ativo) {
                    label = 'Ativa';
                    color = 'success';
                  } else {
                    label = 'Inativa';
                    color = 'default';
                  }
                  
                  return (
                    <Chip
                      label={label}
                      color={color}
                      size="small"
                      sx={{
                        fontWeight: 500,
                        fontSize: '0.75rem',
                      }}
                    />
                  );
                })()}
              </Box>
            </Box>
          </Box>

          {erro && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErro('')}>
              {typeof erro === 'string' ? erro : JSON.stringify(erro)}
            </Alert>
          )}

          {/* Configurações das Fases */}
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 3, 
                fontWeight: 600, 
                fontSize: '1.5rem',
                color: '#011b49',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <CalendarIcon sx={{ fontSize: 24 }} />
              Configurações das Fases
            </Typography>

            {fases.length === 0 ? (
              <Alert severity="info" sx={{ mb: 3 }}>
                Nenhuma fase cadastrada nesta jornada.
              </Alert>
            ) : (
              <Box sx={{ position: 'relative' }}>
                <DragDropContext onDragEnd={onDragEnd}>
                  <TableContainer
                    sx={{
                      maxHeight: '350px', // Altura para aproximadamente 5 linhas (53px cada + header ~57px)
                      overflowY: 'auto',
                      overflowX: 'hidden', // Remove rolagem lateral
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: '#f1f1f1',
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: '#c1c1c1',
                        borderRadius: '4px',
                        '&:hover': {
                          backgroundColor: '#a8a8a8',
                        },
                      },
                    }}
                    onScroll={(e) => {
                      const target = e.target as HTMLElement;
                      const hasScroll = target.scrollHeight > target.clientHeight;
                      const isScrolledToBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 10;
                      setMostrarSeta(hasScroll && !isScrolledToBottom);
                    }}
                  >
                    <Table stickyHeader sx={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ fontWeight: 600, width: 30 }}></TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: 70 }}>Ordem</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: 120 }}>Título</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: 130 }}>Desbloqueio</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: 130 }}>Bloqueio</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: 160 }}>Status</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: 100 }}>Pontuação</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, width: 100 }}>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <Droppable droppableId="fases">
                      {(provided) => (
                        <TableBody {...provided.droppableProps} ref={provided.innerRef}>
                          {fases
                            .sort((a, b) => a.ordem - b.ordem)
                            .map((fase, index) => (
                              <Draggable
                                key={fase.id}
                                draggableId={String(fase.id)}
                                index={index}
                                isDragDisabled={!fase.faseAberta}
                              >
                                {(provided, snapshot) => (
                                  <TableRow
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    hover
                                    sx={{
                                      backgroundColor: snapshot.isDragging ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
                                      opacity: snapshot.isDragging ? 0.8 : 1,
                                      '& .drag-handle': {
                                        cursor: fase.faseAberta ? 'grab' : 'not-allowed',
                                        opacity: fase.faseAberta ? 1 : 0.3,
                                      },
                                    }}
                                  >
                                    <TableCell {...provided.dragHandleProps} align="center" sx={{ width: 30 }}>
                                      {fase.faseAberta && (
                                        <DragIndicatorIcon
                                          className="drag-handle"
                                          sx={{
                                            color: 'text.secondary',
                                            fontSize: 20,
                                          }}
                                        />
                                      )}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip label={`${fase.ordem}ª`} color="primary" size="small" />
                                    </TableCell>
                                    <TableCell sx={{ width: 120 }}>
                                      <Typography 
                                        variant="body1" 
                                        title={fase.titulo}
                                        sx={{ 
                                          fontWeight: 500,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          maxWidth: '120px',
                                        }}
                                      >
                                        {fase.titulo}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      {fase.dataDesbloqueio ? (
                                        <Typography variant="body2" color="text.primary">
                                          {formatDateTimeDisplay(fase.dataDesbloqueio)}
                                        </Typography>
                                      ) : (
                                        <Typography variant="body2" color="text.secondary">
                                          Não definida
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="center">
                                      {fase.dataBloqueio ? (
                                        <Typography variant="body2" color="error">
                                          {formatDateTimeDisplay(fase.dataBloqueio)}
                                        </Typography>
                                      ) : (
                                        <Typography variant="body2" color="text.secondary">
                                          Não definida
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="center">
                                      {(() => {
                                        const status = getStatusInfo(fase);
                                        return (
                                          <Chip
                                            label={status.label}
                                            color={status.color}
                                            size="small"
                                            sx={{ fontWeight: 500 }}
                                          />
                                        );
                                      })()}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {fase.pontuacao} pontos
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center" sx={{ width: 100 }}>
                                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleAbrirModal(fase)}
                                          sx={{
                                            color: '#2196F3',
                                            '&:hover': {
                                              backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                            },
                                          }}
                                          title="Editar configurações da fase"
                                        >
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleExcluirFase(fase)}
                                          sx={{
                                            color: '#f44336',
                                            '&:hover': {
                                              backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                            },
                                          }}
                                          title="Excluir fase"
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </TableBody>
                      )}
                    </Droppable>
                  </Table>
                </TableContainer>
                </DragDropContext>
              {mostrarSeta && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    animation: 'bounce 2s infinite',
                    '@keyframes bounce': {
                      '0%, 100%': {
                        transform: 'translateX(-50%) translateY(0)',
                      },
                      '50%': {
                        transform: 'translateX(-50%) translateY(-10px)',
                      },
                    },
                    zIndex: 1,
                  }}
                >
                  <KeyboardArrowDownIcon sx={{ fontSize: 32, color: '#ff2c19', opacity: 0.7 }} />
                </Box>
              )}
              </Box>
            )}
          </Paper>

          {/* Modal de Edição de Fase */}
          <Dialog
            open={modalAberto}
            onClose={handleFecharModal}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: 2,
              },
            }}
          >
            <DialogTitle sx={{ fontWeight: 600, color: '#011b49', pb: 2 }}>
              Configurações da Fase
            </DialogTitle>
            <DialogContent>
              {faseEditando && (
                <Box sx={{ pt: 2 }}>
                  <Box sx={{ mb: 4, textAlign: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 300, color: '#011b49', mb: 2 }}>
                      {faseEditando.titulo}
                    </Typography>
                    <Chip label={`${faseEditando.ordem}ª Fase`} color="primary" size="small" />
                  </Box>

                  <Grid container spacing={3}>
                    {!faseEditando.faseAberta && (
                      <>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Data de Desbloqueio"
                            type="date"
                            value={formatDateForInput(faseEditando.dataDesbloqueio)}
                        onChange={(e) => {
                          const newDate = combineDateAndTime(
                            e.target.value,
                            formatTimeForInput(faseEditando.dataDesbloqueio)
                          );
                          
                          // Validar se dataBloqueio não é anterior a dataDesbloqueio (pode ser igual)
                          if (newDate && faseEditando.dataBloqueio) {
                            if (newDate.getTime() > faseEditando.dataBloqueio.getTime()) {
                              showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
                              return;
                            }
                          }
                          
                          setFaseEditando({
                            ...faseEditando,
                            dataDesbloqueio: newDate,
                            faseAberta: false,
                          });
                        }}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        InputProps={{
                          endAdornment: faseEditando.dataDesbloqueio ? (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                onClick={() => {
                                  setFaseEditando({
                                    ...faseEditando,
                                    dataDesbloqueio: null,
                                  });
                                }}
                                sx={{ color: 'error.main' }}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ) : null,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#ffffff',
                            '& fieldset': {
                              borderColor: '#e0e0e0',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: '#ff2c19',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#ff2c19',
                              borderWidth: 2,
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#6b7280',
                            '&.Mui-focused': {
                              color: '#ff2c19',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: '#011b49',
                            fontSize: '1rem',
                            padding: '14px',
                            cursor: 'pointer',
                            '&::-webkit-calendar-picker-indicator': {
                              cursor: 'pointer',
                              fontSize: '18px',
                              opacity: 0.7,
                              '&:hover': {
                                opacity: 1,
                              },
                            },
                          },
                        }}
                      />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Hora de Desbloqueio"
                            type="time"
                            value={formatTimeForInput(faseEditando.dataDesbloqueio)}
                            onChange={(e) => {
                              const currentDate = formatDateForInput(faseEditando.dataDesbloqueio);
                              const newDate = combineDateAndTime(currentDate, e.target.value);
                              
                              // Validar se dataBloqueio não é anterior a dataDesbloqueio (pode ser igual)
                              if (newDate && faseEditando.dataBloqueio) {
                                if (newDate.getTime() > faseEditando.dataBloqueio.getTime()) {
                                  showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
                                  return;
                                }
                              }
                              
                              setFaseEditando({
                                ...faseEditando,
                                dataDesbloqueio: newDate,
                                faseAberta: false,
                              });
                            }}
                            disabled={!faseEditando.dataDesbloqueio}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: faseEditando.dataDesbloqueio ? '#ffffff' : '#f5f5f5',
                            transition: 'all 0.3s ease',
                            '& fieldset': {
                              borderColor: faseEditando.dataDesbloqueio ? '#e0e0e0' : '#d0d0d0',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: faseEditando.dataDesbloqueio ? '#ff2c19' : '#d0d0d0',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: faseEditando.dataDesbloqueio ? '#ff2c19' : '#d0d0d0',
                              borderWidth: 2,
                            },
                            '&.Mui-disabled': {
                              backgroundColor: '#f5f5f5',
                              '& fieldset': {
                                borderColor: '#e0e0e0',
                              },
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: faseEditando.dataDesbloqueio ? '#6b7280' : '#9e9e9e',
                            '&.Mui-focused': {
                              color: faseEditando.dataDesbloqueio ? '#ff2c19' : '#9e9e9e',
                            },
                            '&.Mui-disabled': {
                              color: '#9e9e9e',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: faseEditando.dataDesbloqueio ? '#011b49' : '#9e9e9e',
                            fontSize: '1rem',
                            padding: '14px',
                            cursor: faseEditando.dataDesbloqueio ? 'pointer' : 'not-allowed',
                            '&::-webkit-calendar-picker-indicator': {
                              cursor: faseEditando.dataDesbloqueio ? 'pointer' : 'not-allowed',
                              fontSize: '18px',
                              opacity: faseEditando.dataDesbloqueio ? 0.7 : 0.3,
                              '&:hover': {
                                opacity: faseEditando.dataDesbloqueio ? 1 : 0.3,
                              },
                            },
                          },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Data de Bloqueio"
                        type="date"
                        value={formatDateForInput(faseEditando.dataBloqueio)}
                        onChange={(e) => {
                          // Se a data inserida for igual à data de desbloqueio, zerar o horário
                          const dataDesbloqueioStr = formatDateForInput(faseEditando.dataDesbloqueio);
                          const dataBloqueioStr = e.target.value;
                          const timeStr = (dataDesbloqueioStr === dataBloqueioStr) ? '00:00' : formatTimeForInput(faseEditando.dataBloqueio);
                          
                          const newDate = combineDateAndTime(
                            e.target.value,
                            timeStr
                          );
                          
                          // Validar se dataBloqueio não é anterior a dataDesbloqueio (pode ser igual)
                          if (faseEditando.dataDesbloqueio && newDate) {
                            if (faseEditando.dataDesbloqueio.getTime() > newDate.getTime()) {
                              showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
                              return;
                            }
                          }
                          
                          setFaseEditando({
                            ...faseEditando,
                            dataBloqueio: newDate,
                            faseAberta: false,
                          });
                        }}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        InputProps={{
                          endAdornment: faseEditando.dataBloqueio ? (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                onClick={() => {
                                  setFaseEditando({
                                    ...faseEditando,
                                    dataBloqueio: null,
                                  });
                                }}
                                sx={{ color: 'error.main' }}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </InputAdornment>
                          ) : null,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#ffffff',
                            '& fieldset': {
                              borderColor: '#e0e0e0',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: '#ff2c19',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#ff2c19',
                              borderWidth: 2,
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#6b7280',
                            '&.Mui-focused': {
                              color: '#ff2c19',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: '#011b49',
                            fontSize: '1rem',
                            padding: '14px',
                            cursor: 'pointer',
                            '&::-webkit-calendar-picker-indicator': {
                              cursor: 'pointer',
                              fontSize: '18px',
                              opacity: 0.7,
                              '&:hover': {
                                opacity: 1,
                              },
                            },
                          },
                        }}
                      />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Hora de Bloqueio"
                            type="time"
                            value={formatTimeForInput(faseEditando.dataBloqueio)}
                            onChange={(e) => {
                              const currentDate = formatDateForInput(faseEditando.dataBloqueio);
                              const newDate = combineDateAndTime(currentDate, e.target.value);
                              
                              // Validar se dataBloqueio não é anterior a dataDesbloqueio (pode ser igual)
                              if (faseEditando.dataDesbloqueio && newDate) {
                                if (faseEditando.dataDesbloqueio.getTime() > newDate.getTime()) {
                                  showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
                                  return;
                                }
                              }
                              
                              setFaseEditando({
                                ...faseEditando,
                                dataBloqueio: newDate,
                                faseAberta: false,
                              });
                            }}
                            disabled={!faseEditando.dataBloqueio}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: faseEditando.dataBloqueio ? '#ffffff' : '#f5f5f5',
                            transition: 'all 0.3s ease',
                            '& fieldset': {
                              borderColor: faseEditando.dataBloqueio ? '#e0e0e0' : '#d0d0d0',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: faseEditando.dataBloqueio ? '#ff2c19' : '#d0d0d0',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: faseEditando.dataBloqueio ? '#ff2c19' : '#d0d0d0',
                              borderWidth: 2,
                            },
                            '&.Mui-disabled': {
                              backgroundColor: '#f5f5f5',
                              '& fieldset': {
                                borderColor: '#e0e0e0',
                              },
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: faseEditando.dataBloqueio ? '#6b7280' : '#9e9e9e',
                            '&.Mui-focused': {
                              color: faseEditando.dataBloqueio ? '#ff2c19' : '#9e9e9e',
                            },
                            '&.Mui-disabled': {
                              color: '#9e9e9e',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: faseEditando.dataBloqueio ? '#011b49' : '#9e9e9e',
                            fontSize: '1rem',
                            padding: '14px',
                            cursor: faseEditando.dataBloqueio ? 'pointer' : 'not-allowed',
                            '&::-webkit-calendar-picker-indicator': {
                              cursor: faseEditando.dataBloqueio ? 'pointer' : 'not-allowed',
                              fontSize: '18px',
                              opacity: faseEditando.dataBloqueio ? 0.7 : 0.3,
                              '&:hover': {
                                opacity: faseEditando.dataBloqueio ? 1 : 0.3,
                              },
                            },
                          },
                        }}
                      />
                        </Grid>
                      </>
                    )}
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Pontuação da Fase"
                        type="number"
                        value={faseEditando.pontuacao}
                        onChange={(e) => {
                          const valor = parseInt(e.target.value) || 0;
                          if (valor > 100) {
                            showError('A pontuação máxima permitida é 100', 'Valor inválido');
                            return;
                          }
                          setFaseEditando({
                            ...faseEditando,
                            pontuacao: valor,
                          });
                        }}
                        inputProps={{ min: 0, max: 100 }}
                        helperText="Valor máximo: 100 pontos"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 'auto' }}>
                <Switch
                  checked={faseEditando?.faseAberta !== false}
                  onChange={(e) => {
                    if (faseEditando) {
                      setFaseEditando({
                        ...faseEditando,
                        faseAberta: e.target.checked,
                      });
                    }
                  }}
                  color="primary"
                />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {faseEditando?.faseAberta !== false ? (
                    <LockOpenIcon 
                      sx={{ 
                        fontSize: 20, 
                        color: '#4caf50',
                      }} 
                    />
                  ) : (
                    <LockIcon 
                      sx={{ 
                        fontSize: 20, 
                        color: '#f44336',
                      }} 
                    />
                  )}
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 300,
                      color: '#011b49',
                    }}
                  >
                    {faseEditando?.faseAberta !== false ? 'Fase Aberta' : 'Fase Fechada'}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ flex: 1 }} />
              <Button onClick={handleFecharModal} color="inherit" size="medium">
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarFase}
                variant="contained"
                size="medium"
                sx={{
                  bgcolor: '#ff2c19',
                  '&:hover': {
                    bgcolor: '#e62816',
                  },
                }}
              >
                Salvar
              </Button>
            </DialogActions>
          </Dialog>

          {/* Configurações Gerais */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 3, 
                fontWeight: 600, 
                fontSize: '1.5rem',
                color: '#011b49',
              }}
            >
              Configurações Gerais
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracao.ativo}
                      onChange={(e) =>
                        handleConfiguracaoChange('ativo', e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Jornada Ativa
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ative ou desative esta jornada. Jornadas inativas não serão exibidas para os participantes.
                      </Typography>
                    </Box>
                  }
                  sx={{ alignItems: 'flex-start' }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracao.mostrarQuestaoCerta}
                      onChange={(e) =>
                        handleConfiguracaoChange('mostrarQuestaoCerta', e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Mostrar Questão Correta
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Exibe a resposta correta após o participante responder
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracao.mostrarTaxaErro}
                      onChange={(e) =>
                        handleConfiguracaoChange('mostrarTaxaErro', e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Mostrar Taxa de Erro
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Exibe a porcentagem de erros de cada questão
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracao.mostrarPodio}
                      onChange={(e) =>
                        handleConfiguracaoChange('mostrarPodio', e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Mostrar Pódio
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Exibe o ranking dos 3 primeiros colocados
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracao.mostrarRanking}
                      onChange={(e) =>
                        handleConfiguracaoChange('mostrarRanking', e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Mostrar Ranking Completo
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Exibe o ranking completo de todos os participantes
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={configuracao.permitirTentativasIlimitadas}
                      onChange={(e) =>
                        handleConfiguracaoChange('permitirTentativasIlimitadas', e.target.checked)
                      }
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        Permitir Tentativas Ilimitadas
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Permite que os participantes refaçam os quizzes quantas vezes quiserem
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tempo Limite por Questão (segundos)"
                  type="number"
                  value={configuracao.tempoLimitePorQuestao || ''}
                  onChange={(e) =>
                    handleConfiguracaoChange(
                      'tempoLimitePorQuestao',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  inputProps={{ min: 0 }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Botões de ação centralizados */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4, mb: 3 }}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={handleCancelar}
              disabled={saving || !temAlteracoes}
              startIcon={<CancelIcon />}
              sx={{
                minWidth: 140,
                py: 1.2,
                borderColor: 'grey.300',
                opacity: temAlteracoes ? 1 : 0.5,
                '&:hover': {
                  borderColor: temAlteracoes ? 'grey.400' : 'grey.300',
                  bgcolor: temAlteracoes ? 'grey.50' : 'transparent',
                },
                '&:disabled': {
                  opacity: 0.5,
                  borderColor: 'grey.300',
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSalvar}
              disabled={saving}
              sx={{
                minWidth: 150,
                bgcolor: '#ff2c19',
                '&:hover': {
                  bgcolor: '#e62816',
                },
              }}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </Box>
        </Container>
      </AdminLayout>
    </>
  );
};

export default ConfigurarJornada;
