import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Chip,
  Breadcrumbs,
  Link,
  InputAdornment,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  DragIndicator as DragIndicatorIcon,
  NavigateNext as NavigateNextIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  Home as HomeIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from '@mui/icons-material';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from '@hello-pangea/dnd';
import { FormControlLabel, Switch, Grid } from '@mui/material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import { useToast } from '../../contexts/ToastContext';

interface Fase {
  id: string;      // id interno só para o DnD
  titulo: string;
  ordem: number;
  faseAberta: boolean;
  dataDesbloqueio: Date | null;
  dataBloqueio: Date | null;
  pontuacao?: number;
}

interface AddPhaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (fase: Omit<Fase, 'id' | 'ordem'>) => void;
}

const AddPhaseDialog: React.FC<AddPhaseDialogProps> = ({ open, onClose, onSave }) => {
  const { showError } = useToast();
  const [titulo, setTitulo] = useState('');
  const [faseAberta, setFaseAberta] = useState(true);
  const [dataDesbloqueio, setDataDesbloqueio] = useState<Date | null>(null);
  const [dataBloqueio, setDataBloqueio] = useState<Date | null>(null);
  const [pontuacao, setPontuacao] = useState(100);
  const [salvando, setSalvando] = useState(false);

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

  const handleConfirmar = () => {
    if (!titulo.trim()) {
      showError('O nome da fase é obrigatório', 'Validação');
      return;
    }

    if (!faseAberta) {
      if (!validarDatas(dataDesbloqueio, dataBloqueio)) {
        return;
      }
    }

    if (pontuacao < 0) {
      showError('A pontuação deve ser um número positivo', 'Validação');
      return;
    }

    onSave({
      titulo: titulo.trim(),
      faseAberta,
      dataDesbloqueio: faseAberta ? null : dataDesbloqueio,
      dataBloqueio: faseAberta ? null : dataBloqueio,
      pontuacao,
    });
    
    // Resetar campos
    setTitulo('');
    setFaseAberta(true);
    setDataDesbloqueio(null);
    setDataBloqueio(null);
    setPontuacao(100);
    onClose();
  };

  const handleClose = () => {
    setTitulo('');
    setFaseAberta(true);
    setDataDesbloqueio(null);
    setDataBloqueio(null);
    setPontuacao(100);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
                value={titulo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTitulo(e.target.value)
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
            {!faseAberta && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Data de Desbloqueio"
                    type="date"
                    value={formatDateForInput(dataDesbloqueio)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newDate = combineDateAndTime(
                        e.target.value,
                        formatTimeForInput(dataDesbloqueio)
                      );
                      
                      if (newDate && dataBloqueio) {
                        if (newDate.getTime() > dataBloqueio.getTime()) {
                          showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
                          return;
                        }
                      }
                      
                      setDataDesbloqueio(newDate);
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: dataDesbloqueio ? (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            onClick={() => {
                              setDataDesbloqueio(null);
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
                    value={formatTimeForInput(dataDesbloqueio)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const currentDate = formatDateForInput(dataDesbloqueio);
                      const newDate = combineDateAndTime(currentDate, e.target.value);
                      
                      if (newDate && dataBloqueio) {
                        if (newDate.getTime() > dataBloqueio.getTime()) {
                          showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
                          return;
                        }
                      }
                      
                      setDataDesbloqueio(newDate);
                    }}
                    disabled={!dataDesbloqueio}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: dataDesbloqueio ? '#ffffff' : '#f5f5f5',
                        transition: 'all 0.3s ease',
                        '& fieldset': {
                          borderColor: dataDesbloqueio ? '#e0e0e0' : '#d0d0d0',
                          borderWidth: 2,
                        },
                        '&:hover fieldset': {
                          borderColor: dataDesbloqueio ? '#ff2c19' : '#d0d0d0',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: dataDesbloqueio ? '#ff2c19' : '#d0d0d0',
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
                        color: dataDesbloqueio ? '#6b7280' : '#9e9e9e',
                        '&.Mui-focused': {
                          color: dataDesbloqueio ? '#ff2c19' : '#9e9e9e',
                        },
                        '&.Mui-disabled': {
                          color: '#9e9e9e',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: dataDesbloqueio ? '#011b49' : '#9e9e9e',
                        fontSize: '1rem',
                        padding: '14px',
                        cursor: dataDesbloqueio ? 'pointer' : 'not-allowed',
                        '&::-webkit-calendar-picker-indicator': {
                          cursor: dataDesbloqueio ? 'pointer' : 'not-allowed',
                          fontSize: '18px',
                          opacity: dataDesbloqueio ? 0.7 : 0.3,
                          '&:hover': {
                            opacity: dataDesbloqueio ? 1 : 0.3,
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
                    value={formatDateForInput(dataBloqueio)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const dataDesbloqueioStr = formatDateForInput(dataDesbloqueio);
                      const dataBloqueioStr = e.target.value;
                      const timeStr = (dataDesbloqueioStr === dataBloqueioStr) ? '00:00' : formatTimeForInput(dataBloqueio);
                      
                      const newDate = combineDateAndTime(
                        e.target.value,
                        timeStr
                      );
                      
                      if (dataDesbloqueio && newDate) {
                        if (dataDesbloqueio.getTime() > newDate.getTime()) {
                          showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
                          return;
                        }
                      }
                      
                      setDataBloqueio(newDate);
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    InputProps={{
                      endAdornment: dataBloqueio ? (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            onClick={() => {
                              setDataBloqueio(null);
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
                    value={formatTimeForInput(dataBloqueio)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const currentDate = formatDateForInput(dataBloqueio);
                      const newDate = combineDateAndTime(currentDate, e.target.value);
                      
                      if (dataDesbloqueio && newDate) {
                        if (dataDesbloqueio.getTime() > newDate.getTime()) {
                          showError('A data de bloqueio não pode ser anterior à data de desbloqueio', 'Data inválida');
                          return;
                        }
                      }
                      
                      setDataBloqueio(newDate);
                    }}
                    disabled={!dataBloqueio}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: dataBloqueio ? '#ffffff' : '#f5f5f5',
                        transition: 'all 0.3s ease',
                        '& fieldset': {
                          borderColor: dataBloqueio ? '#e0e0e0' : '#d0d0d0',
                          borderWidth: 2,
                        },
                        '&:hover fieldset': {
                          borderColor: dataBloqueio ? '#ff2c19' : '#d0d0d0',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: dataBloqueio ? '#ff2c19' : '#d0d0d0',
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
                        color: dataBloqueio ? '#6b7280' : '#9e9e9e',
                        '&.Mui-focused': {
                          color: dataBloqueio ? '#ff2c19' : '#9e9e9e',
                        },
                        '&.Mui-disabled': {
                          color: '#9e9e9e',
                        },
                      },
                      '& .MuiInputBase-input': {
                        color: dataBloqueio ? '#011b49' : '#9e9e9e',
                        fontSize: '1rem',
                        padding: '14px',
                        cursor: dataBloqueio ? 'pointer' : 'not-allowed',
                        '&::-webkit-calendar-picker-indicator': {
                          cursor: dataBloqueio ? 'pointer' : 'not-allowed',
                          fontSize: '18px',
                          opacity: dataBloqueio ? 0.7 : 0.3,
                          '&:hover': {
                            opacity: dataBloqueio ? 1 : 0.3,
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
                value={pontuacao}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPontuacao(parseInt(e.target.value) || 0)
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
            checked={faseAberta}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setFaseAberta(e.target.checked);
              if (e.target.checked) {
                setDataDesbloqueio(null);
                setDataBloqueio(null);
              }
            }}
            color="primary"
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {faseAberta ? (
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
              {faseAberta ? 'Fase Aberta' : 'Fase Fechada'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Button onClick={handleClose} color="inherit" size="medium" disabled={salvando}>
          Cancelar
        </Button>
        <Button
          onClick={handleConfirmar}
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
  );
};

const CriarJornada: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);

  const [titulo, setTitulo] = useState('');
  const [imagemCapa, setImagemCapa] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState<string | null>(null);
  const [fases, setFases] = useState<Fase[]>([]);

  const [abrirModalFase, setAbrirModalFase] = useState(false);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [errosCampos, setErrosCampos] = useState<{
    titulo?: string;
    fases?: string;
  }>({});

  const validarTitulo = (): boolean => {
    const novosErros: { titulo?: string } = {};

    if (!titulo.trim()) {
      novosErros.titulo = 'Título é obrigatório';
    } else if (titulo.trim().length < 3) {
      novosErros.titulo = 'Título deve ter pelo menos 3 caracteres';
    }

    setErrosCampos((prev) => ({ ...prev, ...novosErros }));
    return Object.keys(novosErros).length === 0;
  };

  const validarFases = (): boolean => {
    const novosErros: { fases?: string } = {};

    if (fases.length === 0) {
      novosErros.fases = 'É necessário cadastrar pelo menos uma fase';
    }

    setErrosCampos((prev) => ({ ...prev, ...novosErros }));
    return Object.keys(novosErros).length === 0;
  };

  const handleNextStep = () => {
    setErro('');
    if (!validarTitulo()) return;
    setStep(2);
  };

  const handleBackStep = () => {
    setErro('');
    setErrosCampos((prev) => ({ ...prev, fases: undefined }));
    setStep(1);
  };

  const ordenarFasesPorDataDesbloqueio = (fasesArray: Fase[]): Fase[] => {
    return [...fasesArray].sort((a, b) => {
      // Fases abertas vão para o final
      if (a.faseAberta && b.faseAberta) return a.ordem - b.ordem;
      if (a.faseAberta) return 1;
      if (b.faseAberta) return -1;
      
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

  const handleAddFase = (faseData: Omit<Fase, 'id' | 'ordem'>) => {
    const novaFase: Fase = {
      id: `${Date.now()}-${Math.random()}`,
      ...faseData,
      ordem: fases.length + 1,
    };
    
    const novasFases = [...fases, novaFase];
    
    // Se a fase não está aberta, ordenar automaticamente por data de desbloqueio
    if (!faseData.faseAberta) {
      const fasesOrdenadas = ordenarFasesPorDataDesbloqueio(novasFases);
      setFases(fasesOrdenadas);
    } else {
      setFases(novasFases);
    }
    
    setErrosCampos((prev) => ({ ...prev, fases: undefined }));
  };

  const handleRemoverFase = (id: string) => {
    const novasFases = fases.filter((fase) => fase.id !== id);
    const fasesReordenadas = novasFases.map((fase, index) => ({
      ...fase,
      ordem: index + 1,
    }));
    setFases(fasesReordenadas);
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const origemIndex = result.source.index;
    const destinoIndex = result.destination.index;

    if (origemIndex === destinoIndex) return;

    // Ordenar fases antes de processar o drag
    const fasesOrdenadas = [...fases].sort((a, b) => a.ordem - b.ordem);
    
    // Verificar se a fase que está sendo arrastada está aberta
    const faseArrastada = fasesOrdenadas[origemIndex];
    if (!faseArrastada.faseAberta) {
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

  const handleImagemChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setErro('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErro('A imagem deve ter no máximo 5MB');
        return;
      }
      setImagemCapa(file);
      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImagem(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErro('');
    }
  };

  const handleRemoverImagem = () => {
    setImagemCapa(null);
    setPreviewImagem(null);
  };

  const handleSalvar = async () => {
    setErro('');
    setErrosCampos({});

    if (!validarTitulo()) {
      setStep(1);
      return;
    }

    if (!validarFases()) {
      setStep(2);
      return;
    }

    try {
      setSalvando(true);
      const formData = new FormData();
      formData.append('titulo', titulo.trim());
      if (imagemCapa) {
        formData.append('imagemCapa', imagemCapa);
      }
      // Ordenar fases por ordem antes de enviar
      const fasesOrdenadas = [...fases].sort((a, b) => a.ordem - b.ordem);
      formData.append('fases', JSON.stringify(
        fasesOrdenadas.map((f) => ({
          titulo: f.titulo,
          ordem: f.ordem,
          dataDesbloqueio: f.dataDesbloqueio?.toISOString() || null,
          dataBloqueio: f.dataBloqueio?.toISOString() || null,
        }))
      ));

      const response = await api.post('/jornadas', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Obter o ID da jornada criada
      const jornadaId = response.data.data?.id || response.data.id;
      
      if (jornadaId) {
        // Redirecionar para a tela de configurações da jornada
        navigate(`/admin/jornadas/${jornadaId}/configurar`);
      } else {
        // Fallback: se não conseguir obter o ID, vai para a lista de jornadas
        navigate('/admin/jornadas');
      }
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar jornada');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AdminLayout title="Criar Jornada">
      <Container maxWidth="md" sx={{ py: 4 }}>
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
            Criar Jornada
          </Typography>
        </Breadcrumbs>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              fontSize: '2rem',
              background: 'linear-gradient(135deg, #ff2c19 0%, #e62816 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              mb: 0.5,
              letterSpacing: '-0.02em',
            }}
          >
            Cadastrar Jornada
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.875rem',
              mt: 0.5,
            }}
          >
            Crie uma nova jornada e defina suas fases
          </Typography>
        </Box>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 3 }}>
          {step === 1 && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                Nome da Jornada
              </Typography>
              <TextField
                fullWidth
                label="Título da jornada"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  if (errosCampos.titulo) {
                    setErrosCampos({ ...errosCampos, titulo: undefined });
                  }
                }}
                margin="normal"
                required
                error={!!errosCampos.titulo}
                helperText={errosCampos.titulo || `${titulo.length}/80`}
                disabled={salvando}
                placeholder="Ex: Jornada de Capacitação 2024"
                inputProps={{ maxLength: 80 }}
              />

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ mb: 1.5, color: '#6b7280', fontWeight: 500 }}>
                  Logo/Imagem de Capa da Jornada
                </Typography>
                {previewImagem ? (
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Box
                      component="img"
                      src={previewImagem}
                      alt="Preview"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 300,
                        borderRadius: 2,
                        border: '2px solid #e0e0e0',
                        objectFit: 'cover',
                      }}
                    />
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleRemoverImagem}
                      disabled={salvando}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        minWidth: 'auto',
                        p: 0.5,
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </Button>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '2px dashed #e0e0e0',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: '#ff2c19',
                        bgcolor: 'rgba(255, 44, 25, 0.02)',
                      },
                    }}
                  >
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="upload-imagem-capa"
                      type="file"
                      onChange={handleImagemChange}
                      disabled={salvando}
                    />
                    <label htmlFor="upload-imagem-capa">
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <CloudUploadIcon sx={{ fontSize: 48, color: '#6b7280', mb: 1 }} />
                        <Typography variant="body2" sx={{ color: '#6b7280', mb: 0.5 }}>
                          Clique para fazer upload ou arraste a imagem aqui
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9e9e9e' }}>
                          PNG, JPG ou GIF (máx. 5MB)
                        </Typography>
                      </Box>
                    </label>
                  </Box>
                )}
              </Box>

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={() => navigate('/admin/jornadas')}
                  disabled={salvando}
                  startIcon={<CancelIcon />}
                  sx={{
                    minWidth: 140,
                    py: 1.2,
                    borderColor: 'grey.300',
                    '&:hover': {
                      borderColor: 'grey.400',
                      bgcolor: 'grey.50',
                    },
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNextStep}
                  disabled={salvando}
                  endIcon={<NavigateNextIcon />}
                  sx={{
                    minWidth: 140,
                    py: 1.2,
                    bgcolor: '#e62816',
                    '&:hover': {
                      bgcolor: '#c52214',
                    },
                    '&:disabled': {
                      bgcolor: 'grey.300',
                    },
                  }}
                >
                  Próximo
                </Button>
              </Box>
            </>
          )}

          {step === 2 && (
            <>
              <Box sx={{ position: 'relative', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton onClick={handleBackStep} size="small">
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="h6">Fases da Jornada</Typography>
                </Box>
                
                {/* Botão de adicionar fase - posição absoluta à direita */}
                <Box sx={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)' }}>
                  <IconButton
                    onClick={() => setAbrirModalFase(true)}
                    disabled={salvando}
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
                      '&:disabled': {
                        bgcolor: 'grey.300',
                        borderColor: 'grey.300',
                        opacity: 0.6,
                      },
                    }}
                    title="Adicionar Fase"
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>

              {errosCampos.fases && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errosCampos.fases}
                </Alert>
              )}

              {fases.length === 0 && (
                <Box
                  sx={{
                    mt: 3,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                    border: '1px dashed',
                    borderColor: 'grey.300',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Nenhuma fase cadastrada ainda. Clique em "Adicionar fase" para criar a primeira.
                  </Typography>
                </Box>
              )}

              {fases.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="tabela-fases">
                      {(provided: DroppableProvided) => (
                        <Table
                          size="small"
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                        >
                          <TableHead>
                            <TableRow>
                              <TableCell width={40} />
                              <TableCell>Ordem</TableCell>
                              <TableCell>Nome da fase</TableCell>
                              <TableCell align="center">Desbloqueio</TableCell>
                              <TableCell align="center">Bloqueio</TableCell>
                              <TableCell align="right">Ações</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[...fases].sort((a, b) => a.ordem - b.ordem).map((fase, index) => (
                              <Draggable
                                key={fase.id}
                                draggableId={fase.id}
                                index={index}
                                isDragDisabled={!fase.faseAberta}
                              >
                                {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                  <TableRow
                                    ref={dragProvided.innerRef}
                                    {...(fase.faseAberta ? dragProvided.draggableProps : {})}
                                    sx={{
                                      bgcolor: snapshot.isDragging
                                        ? 'grey.100'
                                        : 'background.paper',
                                    }}
                                  >
                                    <TableCell
                                      {...(fase.faseAberta ? dragProvided.dragHandleProps : {})}
                                      sx={{ cursor: fase.faseAberta ? 'grab' : 'default' }}
                                    >
                                      {fase.faseAberta && (
                                        <DragIndicatorIcon fontSize="small" color="disabled" />
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Chip
                                        label={`${fase.ordem}ª`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Typography variant="body2" fontWeight={600}>
                                        {fase.titulo}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                      {fase.faseAberta ? (
                                        <Chip
                                          label="Aberta"
                                          color="success"
                                          size="small"
                                        />
                                      ) : fase.dataDesbloqueio ? (
                                        <Typography variant="body2">
                                          {formatDateTimeDisplay(fase.dataDesbloqueio)}
                                        </Typography>
                                      ) : (
                                        <Typography variant="body2" color="text.secondary">
                                          Não definida
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="center">
                                      {fase.faseAberta ? (
                                        <Typography variant="body2" color="text.secondary">
                                          -
                                        </Typography>
                                      ) : fase.dataBloqueio ? (
                                        <Typography variant="body2" color="error">
                                          {formatDateTimeDisplay(fase.dataBloqueio)}
                                        </Typography>
                                      ) : (
                                        <Typography variant="body2" color="text.secondary">
                                          Não definida
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="right">
                                      <IconButton
                                        onClick={() => handleRemoverFase(fase.id)}
                                        disabled={salvando}
                                        size="small"
                                        sx={{
                                          color: 'error.main',
                                          '&:hover': {
                                            bgcolor: 'error.light',
                                            color: 'white',
                                          },
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </TableBody>
                        </Table>
                      )}
                    </Droppable>
                  </DragDropContext>
                </Box>
              )}

              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  onClick={handleBackStep}
                  disabled={salvando}
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    minWidth: 140,
                    py: 1.2,
                    borderColor: 'grey.300',
                    '&:hover': {
                      borderColor: 'grey.400',
                      bgcolor: 'grey.50',
                    },
                  }}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  startIcon={salvando ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSalvar}
                  disabled={salvando || fases.length === 0}
                  sx={{
                    minWidth: 180,
                    py: 1.2,
                    bgcolor: '#e62816',
                    '&:hover': {
                      bgcolor: '#c52214',
                    },
                    '&:disabled': {
                      bgcolor: 'grey.300',
                    },
                  }}
                >
                  {salvando ? 'Salvando...' : 'Criar jornada'}
                </Button>
              </Box>
            </>
          )}
        </Paper>

        <AddPhaseDialog
          open={abrirModalFase}
          onClose={() => setAbrirModalFase(false)}
          onSave={handleAddFase}
        />
      </Container>
    </AdminLayout>
  );
};

export default CriarJornada;
 