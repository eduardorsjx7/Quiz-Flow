import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Switch,
  InputAdornment,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Add as AddIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import FasesTabuleiro from '../../components/FasesTabuleiro';
import { useToast } from '../../contexts/ToastContext';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext';
import { LoadingScreen } from '../../components/LoadingScreen';

interface Fase {
  id: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  totalPerguntas?: number;
  ativo?: boolean;
  desbloqueada?: boolean;
  aguardandoDesbloqueio?: boolean;
  dataDesbloqueio?: string | Date | null;
  dataBloqueio?: string | Date | null;
  _count: {
    quizzes: number;
  };
}

interface Jornada {
  id: number;
  titulo: string;
  fases: Fase[];
}

interface NovaFase {
  titulo: string;
  dataDesbloqueio: Date | null;
  dataBloqueio: Date | null;
  pontuacao: number;
  faseAberta: boolean;
}

const FasesJornada: React.FC = () => {
  const { jornadaId } = useParams<{ jornadaId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmDialog();
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [novaFase, setNovaFase] = useState<NovaFase>({
    titulo: '',
    dataDesbloqueio: null,
    dataBloqueio: null,
    pontuacao: 100,
    faseAberta: true,
  });

  const carregarFasesJornada = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jornadas/${jornadaId}`);
      const dados = response.data.data || response.data;
      setJornada(dados);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar fases da jornada');
    } finally {
      setLoading(false);
    }
  }, [jornadaId]);

  useEffect(() => {
    if (jornadaId) {
      carregarFasesJornada();
    }
  }, [jornadaId, carregarFasesJornada]);

  // Funções auxiliares de formatação de data
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
      return new Date(`${dateStr}T00:00`);
    }
    return new Date(`${dateStr}T${timeStr}`);
  };

  const validarDatas = (dataDesbloqueio: Date | null, dataBloqueio: Date | null): boolean => {
    if (dataDesbloqueio && dataBloqueio) {
      if (dataDesbloqueio.getTime() > dataBloqueio.getTime()) {
        showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
        return false;
      }
    }
    return true;
  };

  // Funções do modal
  const handleAbrirModal = () => {
    setNovaFase({
      titulo: '',
      dataDesbloqueio: null,
      dataBloqueio: null,
      pontuacao: 100,
      faseAberta: true,
    });
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setNovaFase({
      titulo: '',
      dataDesbloqueio: null,
      dataBloqueio: null,
      pontuacao: 100,
      faseAberta: true,
    });
  };

  const handleSalvarNovaFase = async () => {
    if (!jornadaId) return;

    // Validações
    if (!novaFase.titulo.trim()) {
      showError('O nome da fase é obrigatório', 'Validação');
      return;
    }

    if (!novaFase.faseAberta) {
      if (!validarDatas(novaFase.dataDesbloqueio, novaFase.dataBloqueio)) {
        return;
      }
    }

    if (novaFase.pontuacao < 0) {
      showError('A pontuação deve ser um número positivo', 'Validação');
      return;
    }

    try {
      setSalvando(true);
      setErro('');

      // Calcular ordem (última ordem + 1)
      const ultimaOrdem = jornada && jornada.fases && jornada.fases.length > 0
        ? Math.max(...jornada.fases.map((f: Fase) => f.ordem))
        : 0;
      const novaOrdem = ultimaOrdem + 1;

      // Criar fase via API
      await api.post('/fases', {
        jornadaId: Number(jornadaId),
        titulo: novaFase.titulo.trim(),
        descricao: undefined,
        ordem: novaOrdem,
      });

      showSuccess('Fase criada com sucesso!', 'Sucesso');
      handleFecharModal();
      
      // Recarregar lista de fases
      await carregarFasesJornada();
    } catch (error: any) {
      const mensagemErro = error.response?.data?.error?.message 
        || error.response?.data?.error 
        || 'Erro ao criar fase';
      setErro(mensagemErro);
      showError(mensagemErro, 'Erro ao criar fase');
    } finally {
      setSalvando(false);
    }
  };

  const handleEditarFase = (faseId: number) => {
    navigate(`/admin/fases/${faseId}/perguntas`);
  };

  const handleExcluirFase = async (faseId: number) => {
    const fase = jornada?.fases.find((f) => f.id === faseId);
    if (!fase) return;

    const confirmed = await confirm({
      title: 'Excluir Fase',
      message: `Tem certeza que deseja excluir a fase "${fase.titulo}"? Esta ação não pode ser desfeita.`,
      type: 'delete',
    });

    if (!confirmed) return;

    try {
      setSalvando(true);
      await api.delete(`/fases/${faseId}`);
      showSuccess('Fase excluída com sucesso!', 'Sucesso');
      await carregarFasesJornada();
    } catch (error: any) {
      const mensagemErro = error.response?.data?.error?.message 
        || error.response?.data?.error 
        || 'Erro ao excluir fase';
      showError(mensagemErro, 'Erro ao excluir fase');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return <LoadingScreen message="Carregando fases..." />;
  }

  if (erro || !jornada) {
    return (
      <AdminLayout title="Fases da Jornada">
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro || 'Jornada não encontrada'}
          </Alert>
          <Button onClick={() => navigate('/admin/fases')} startIcon={<ArrowBackIcon />}>
            Voltar
          </Button>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <>
      <LoadingOverlay 
        open={salvando} 
        messages={['Criando fase', 'Salvando dados', 'Processando', 'Finalizando']}
        messageInterval={1000}
      />
      <AdminLayout title={`Fases - ${jornada.titulo}`}>
        <Container maxWidth="lg">
        <Box sx={{ position: 'relative', mb: 3 }}>
          <IconButton 
            onClick={() => navigate('/admin/fases')} 
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
              Fases das Jornadas
            </Link>
            <Typography 
              color="text.primary"
              sx={{
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
            >
              {jornada.titulo}
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
              {jornada.titulo}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.875rem',
                mt: 0.5,
              }}
            >
              Gerencie as fases desta jornada e cadastre as perguntas
            </Typography>
          </Box>

          {/* Botões de ação - posição absoluta à direita */}
          <Box sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={handleAbrirModal}
              sx={{
                width: 48,
                height: 48,
                bgcolor: '#ff2c19',
                color: '#ffffff',
                border: '2px solid #e62816',
                borderRadius: '50%',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: '#e62816',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(255, 44, 25, 0.4)',
                },
              }}
              title="Adicionar Fase"
            >
              <AddIcon />
            </IconButton>
            <IconButton
              onClick={() => navigate(`/admin/jornadas/${jornadaId}/configurar`)}
              sx={{
                width: 48,
                height: 48,
                bgcolor: '#ff2c19',
                color: '#ffffff',
                border: '2px solid #e62816',
                borderRadius: '50%',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: '#e62816',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(255, 44, 25, 0.4)',
                },
              }}
              title="Configurar Jornada"
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        {jornada.fases.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Nenhuma fase cadastrada nesta jornada ainda.
          </Alert>
        ) : (
          <Box sx={{ mb: 3 }}>
            <FasesTabuleiro
              fases={jornada.fases.map((fase: Fase) => ({
                id: fase.id,
                ordem: fase.ordem,
                titulo: fase.titulo,
                desbloqueada: fase.desbloqueada ?? true,
                finalizada: false, // Admin não precisa de finalizada
                aguardandoDesbloqueio: fase.aguardandoDesbloqueio ?? false,
                ativo: fase.ativo ?? true, // Default true se não vier do backend
              }))}
              onFaseClick={(faseId: number) => {
                navigate(`/admin/fases/${faseId}/perguntas`);
              }}
              isAdmin={true}
              showConnections={true}
              onEditFase={handleEditarFase}
              onDeleteFase={handleExcluirFase}
            />
          </Box>
        )}

        {/* Modal de Criação de Fase */}
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
            Criar Nova Fase
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                {/* Campo de Nome da Fase */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nome da Fase"
                    value={novaFase.titulo}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNovaFase({
                        ...novaFase,
                        titulo: e.target.value,
                      })
                    }
                    required
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
                      },
                    }}
                  />
                </Grid>

                {/* Campos de data/hora quando fase fechada */}
                {!novaFase.faseAberta && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Data de Desbloqueio"
                        type="date"
                        value={formatDateForInput(novaFase.dataDesbloqueio)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const newDate = combineDateAndTime(
                            e.target.value,
                            formatTimeForInput(novaFase.dataDesbloqueio)
                          );
                          
                          if (newDate && novaFase.dataBloqueio) {
                            if (newDate.getTime() > novaFase.dataBloqueio.getTime()) {
                              showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
                              return;
                            }
                          }
                          
                          setNovaFase({
                            ...novaFase,
                            dataDesbloqueio: newDate,
                            faseAberta: false,
                          });
                        }}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        InputProps={{
                          endAdornment: novaFase.dataDesbloqueio ? (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                onClick={() => {
                                  setNovaFase({
                                    ...novaFase,
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
                        value={formatTimeForInput(novaFase.dataDesbloqueio)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const currentDate = formatDateForInput(novaFase.dataDesbloqueio);
                          const newDate = combineDateAndTime(currentDate, e.target.value);
                          
                          if (newDate && novaFase.dataBloqueio) {
                            if (newDate.getTime() > novaFase.dataBloqueio.getTime()) {
                              showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
                              return;
                            }
                          }
                          
                          setNovaFase({
                            ...novaFase,
                            dataDesbloqueio: newDate,
                            faseAberta: false,
                          });
                        }}
                        disabled={!novaFase.dataDesbloqueio}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: novaFase.dataDesbloqueio ? '#ffffff' : '#f5f5f5',
                            transition: 'all 0.3s ease',
                            '& fieldset': {
                              borderColor: novaFase.dataDesbloqueio ? '#e0e0e0' : '#d0d0d0',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: novaFase.dataDesbloqueio ? '#ff2c19' : '#d0d0d0',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: novaFase.dataDesbloqueio ? '#ff2c19' : '#d0d0d0',
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
                            color: novaFase.dataDesbloqueio ? '#6b7280' : '#9e9e9e',
                            '&.Mui-focused': {
                              color: novaFase.dataDesbloqueio ? '#ff2c19' : '#9e9e9e',
                            },
                            '&.Mui-disabled': {
                              color: '#9e9e9e',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: novaFase.dataDesbloqueio ? '#011b49' : '#9e9e9e',
                            fontSize: '1rem',
                            padding: '14px',
                            cursor: novaFase.dataDesbloqueio ? 'pointer' : 'not-allowed',
                            '&::-webkit-calendar-picker-indicator': {
                              cursor: novaFase.dataDesbloqueio ? 'pointer' : 'not-allowed',
                              fontSize: '18px',
                              opacity: novaFase.dataDesbloqueio ? 0.7 : 0.3,
                              '&:hover': {
                                opacity: novaFase.dataDesbloqueio ? 1 : 0.3,
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
                        value={formatDateForInput(novaFase.dataBloqueio)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const dataDesbloqueioStr = formatDateForInput(novaFase.dataDesbloqueio);
                          const dataBloqueioStr = e.target.value;
                          const timeStr = (dataDesbloqueioStr === dataBloqueioStr) ? '00:00' : formatTimeForInput(novaFase.dataBloqueio);
                          
                          const newDate = combineDateAndTime(
                            e.target.value,
                            timeStr
                          );
                          
                          if (novaFase.dataDesbloqueio && newDate) {
                            if (novaFase.dataDesbloqueio.getTime() > newDate.getTime()) {
                              showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
                              return;
                            }
                          }
                          
                          setNovaFase({
                            ...novaFase,
                            dataBloqueio: newDate,
                            faseAberta: false,
                          });
                        }}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        InputProps={{
                          endAdornment: novaFase.dataBloqueio ? (
                            <InputAdornment position="end">
                              <IconButton
                                edge="end"
                                onClick={() => {
                                  setNovaFase({
                                    ...novaFase,
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
                        value={formatTimeForInput(novaFase.dataBloqueio)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const currentDate = formatDateForInput(novaFase.dataBloqueio);
                          const newDate = combineDateAndTime(currentDate, e.target.value);
                          
                          if (novaFase.dataDesbloqueio && newDate) {
                            if (novaFase.dataDesbloqueio.getTime() > newDate.getTime()) {
                              showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
                              return;
                            }
                          }
                          
                          setNovaFase({
                            ...novaFase,
                            dataBloqueio: newDate,
                            faseAberta: false,
                          });
                        }}
                        disabled={!novaFase.dataBloqueio}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: novaFase.dataBloqueio ? '#ffffff' : '#f5f5f5',
                            transition: 'all 0.3s ease',
                            '& fieldset': {
                              borderColor: novaFase.dataBloqueio ? '#e0e0e0' : '#d0d0d0',
                              borderWidth: 2,
                            },
                            '&:hover fieldset': {
                              borderColor: novaFase.dataBloqueio ? '#ff2c19' : '#d0d0d0',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: novaFase.dataBloqueio ? '#ff2c19' : '#d0d0d0',
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
                            color: novaFase.dataBloqueio ? '#6b7280' : '#9e9e9e',
                            '&.Mui-focused': {
                              color: novaFase.dataBloqueio ? '#ff2c19' : '#9e9e9e',
                            },
                            '&.Mui-disabled': {
                              color: '#9e9e9e',
                            },
                          },
                          '& .MuiInputBase-input': {
                            color: novaFase.dataBloqueio ? '#011b49' : '#9e9e9e',
                            fontSize: '1rem',
                            padding: '14px',
                            cursor: novaFase.dataBloqueio ? 'pointer' : 'not-allowed',
                            '&::-webkit-calendar-picker-indicator': {
                              cursor: novaFase.dataBloqueio ? 'pointer' : 'not-allowed',
                              fontSize: '18px',
                              opacity: novaFase.dataBloqueio ? 0.7 : 0.3,
                              '&:hover': {
                                opacity: novaFase.dataBloqueio ? 1 : 0.3,
                              },
                            },
                          },
                        }}
                      />
                    </Grid>
                  </>
                )}
                
                {/* Campo de Pontuação */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Pontuação da Fase"
                    type="number"
                    value={novaFase.pontuacao}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNovaFase({
                        ...novaFase,
                        pontuacao: parseInt(e.target.value) || 0,
                      })
                    }
                    inputProps={{ min: 0 }}
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
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 'auto' }}>
              <Switch
                checked={novaFase.faseAberta}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setNovaFase({
                    ...novaFase,
                    faseAberta: e.target.checked,
                  });
                }}
                color="primary"
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {novaFase.faseAberta ? (
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
                  {novaFase.faseAberta ? 'Fase Aberta' : 'Fase Fechada'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1 }} />
            <Button onClick={handleFecharModal} color="inherit" size="medium" disabled={salvando}>
              Cancelar
            </Button>
            <Button
              onClick={handleSalvarNovaFase}
              variant="contained"
              size="medium"
              disabled={salvando}
              sx={{
                bgcolor: '#ff2c19',
                '&:hover': {
                  bgcolor: '#e62816',
                },
              }}
            >
              {salvando ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
    </>
  );
};

export default FasesJornada;

