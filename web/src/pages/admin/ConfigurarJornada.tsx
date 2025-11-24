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
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext';

interface FaseConfig {
  id: number;
  titulo: string;
  ordem: number;
  dataDesbloqueio: Date | null;
  pontuacao: number;
}

interface ConfiguracaoJornada {
  ativo: boolean;
  mostrarQuestaoCerta: boolean;
  mostrarTaxaErro: boolean;
  mostrarPodio: boolean;
  mostrarRanking: boolean;
  permitirTentativasIlimitadas: boolean;
  tempoLimitePorQuestao: number | null;
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

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jornadaId]);

  const carregarDados = async () => {
    if (!jornadaId) return;

    try {
      setLoading(true);
      setErro('');

      // Carregar dados da jornada e fases
      const response = await api.get(`/jornadas/${jornadaId}`);
      const dados = response.data.data || response.data;
      setJornada(dados);

      // Carregar configurações existentes (se houver)
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

        if (configData.fases) {
          setFases(
            configData.fases.map((fase: any) => ({
              id: fase.id,
              titulo: fase.titulo,
              ordem: fase.ordem,
              dataDesbloqueio: fase.dataDesbloqueio 
                ? new Date(fase.dataDesbloqueio) 
                : null,
              pontuacao: fase.pontuacao || 100,
            }))
          );
        } else {
          // Inicializar fases sem configuração
          setFases(
            dados.fases.map((fase: any) => ({
              id: fase.id,
              titulo: fase.titulo,
              ordem: fase.ordem,
              dataDesbloqueio: null,
              pontuacao: 100,
            }))
          );
        }
      } catch (error: any) {
        // Se não houver configuração, inicializar com valores padrão
        setFases(
          dados.fases.map((fase: any) => ({
            id: fase.id,
            titulo: fase.titulo,
            ordem: fase.ordem,
            dataDesbloqueio: null,
            pontuacao: 100,
          }))
        );
      }
    } catch (error: any) {
      setErro(error.response?.data?.error?.message || 'Erro ao carregar dados da jornada');
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

      const dadosEnvio = {
        fases: fases.map((fase) => ({
          faseId: fase.id,
          dataDesbloqueio: fase.dataDesbloqueio?.toISOString() || null,
          pontuacao: fase.pontuacao,
        })),
        configuracao,
      };

      await api.put(`/jornadas/${jornadaId}/configuracao`, dadosEnvio);
      setTemAlteracoes(false);
      showSuccess('Configurações salvas com sucesso!', 'Sucesso');
      // Redirecionar para a lista de jornadas após salvar
      setTimeout(() => {
        navigate('/admin/jornadas');
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
            {erro}
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

  const handleSalvarFase = () => {
    if (!faseEditando) return;
    const faseOriginal = fases.find(f => f.id === faseEditando.id);
    const temMudancas = faseOriginal && (
      faseOriginal.dataDesbloqueio?.getTime() !== faseEditando.dataDesbloqueio?.getTime() ||
      faseOriginal.pontuacao !== faseEditando.pontuacao
    );
    
    setFases(
      fases.map((fase) =>
        fase.id === faseEditando.id 
          ? { ...fase, dataDesbloqueio: faseEditando.dataDesbloqueio, pontuacao: faseEditando.pontuacao }
          : fase
      )
    );
    
    if (temMudancas) {
      setTemAlteracoes(true);
    }
    
    handleFecharModal();
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
    <AdminLayout title={`Configurar Jornada - ${jornada?.titulo || ''}`}>
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
              onClick={() => navigate('/admin/jornadas')}
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
              Configurar Jornada
            </Typography>
          </Breadcrumbs>

          {/* Cabeçalho */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <IconButton 
              onClick={() => navigate('/admin/jornadas')}
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
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
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  mt: 0.5,
                }}
              >
                {jornada?.titulo}
              </Typography>
            </Box>
          </Box>

          {erro && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErro('')}>
              {erro}
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
              <Alert severity="info">Nenhuma fase cadastrada nesta jornada.</Alert>
            ) : (
              <Box sx={{ position: 'relative' }}>
                <TableContainer
                  sx={{
                    maxHeight: '350px', // Altura para aproximadamente 5 linhas (53px cada + header ~57px)
                    overflowY: 'auto',
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
                  <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Ordem</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Título</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Data/Hora de Desbloqueio</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Pontuação</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fases
                      .sort((a, b) => a.ordem - b.ordem)
                      .map((fase) => (
                        <TableRow key={fase.id} hover>
                          <TableCell>
                            <Chip label={`${fase.ordem}ª`} color="primary" size="small" />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                              {fase.titulo}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {fase.dataDesbloqueio ? (
                              <Typography variant="body2" color="text.primary">
                                {formatDateTimeDisplay(fase.dataDesbloqueio)}
                              </Typography>
                            ) : (
                              <Chip
                                label="Aberta"
                                color="success"
                                size="small"
                                sx={{
                                  fontWeight: 500,
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {fase.pontuacao} pontos
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
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
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
              Editar Configurações da Fase
            </DialogTitle>
            <DialogContent>
              {faseEditando && (
                <Box sx={{ pt: 2 }}>
                  <Box sx={{ mb: 3 }}>
                    <Chip label={`${faseEditando.ordem}ª Fase`} color="primary" size="small" sx={{ mb: 1 }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#011b49' }}>
                      {faseEditando.titulo}
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
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
                          setFaseEditando({
                            ...faseEditando,
                            dataDesbloqueio: newDate,
                          });
                        }}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        helperText="Data em que a fase será desbloqueada"
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
                          setFaseEditando({
                            ...faseEditando,
                            dataDesbloqueio: newDate,
                          });
                        }}
                        disabled={!faseEditando.dataDesbloqueio}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        helperText={
                          faseEditando.dataDesbloqueio
                            ? "Hora em que a fase será desbloqueada"
                            : "Defina primeiro a data de desbloqueio"
                        }
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
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Pontuação da Fase"
                        type="number"
                        value={faseEditando.pontuacao}
                        onChange={(e) =>
                          setFaseEditando({
                            ...faseEditando,
                            pontuacao: parseInt(e.target.value) || 0,
                          })
                        }
                        inputProps={{ min: 0 }}
                        helperText="Pontos que os participantes ganharão ao completar esta fase"
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2.5, pt: 1 }}>
              <Button onClick={handleFecharModal} color="inherit">
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarFase}
                variant="contained"
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
                  helperText="Deixe em branco para não ter limite de tempo"
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
    );
};

export default ConfigurarJornada;

