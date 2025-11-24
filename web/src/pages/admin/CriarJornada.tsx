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
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

interface Fase {
  id: string;      // id interno só para o DnD
  titulo: string;
  ordem: number;
}

interface AddPhaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (titulo: string) => void;
}

const AddPhaseDialog: React.FC<AddPhaseDialogProps> = ({ open, onClose, onSave }) => {
  const [titulo, setTitulo] = useState('');
  const [erro, setErro] = useState('');

  const handleConfirmar = () => {
    if (!titulo.trim()) {
      setErro('Informe o nome da fase');
      return;
    }
    onSave(titulo.trim());
    setTitulo('');
    setErro('');
    onClose();
  };

  const handleClose = () => {
    setTitulo('');
    setErro('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Adicionar fase da jornada</DialogTitle>
      <DialogContent dividers>
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}
        <TextField
          fullWidth
          label="Nome da fase"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          margin="normal"
          required
          placeholder="Ex: Setor Fiscal, Setor Comercial, Sucesso do Cliente"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleConfirmar}>
          Adicionar
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

  const handleAddFase = (tituloFase: string) => {
    const novaFase: Fase = {
      id: `${Date.now()}-${Math.random()}`,
      titulo: tituloFase,
      ordem: fases.length + 1,
    };
    setFases((prev) => [...prev, novaFase]);
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

    const novasFases = Array.from(fases);
    const [removida] = novasFases.splice(origemIndex, 1);
    novasFases.splice(destinoIndex, 0, removida);

    const fasesReordenadas = novasFases.map((fase, index) => ({
      ...fase,
      ordem: index + 1,
    }));

    setFases(fasesReordenadas);
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
      formData.append('fases', JSON.stringify(
        fases.map((f) => ({
          titulo: f.titulo,
          ordem: f.ordem,
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
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, gap: 1 }}>
                <IconButton onClick={handleBackStep} size="small">
                  <ArrowBackIcon fontSize="small" />
                </IconButton>
                <Typography variant="h6">Fases da Jornada</Typography>
              </Box>

              {errosCampos.fases && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {errosCampos.fases}
                </Alert>
              )}

              <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAbrirModalFase(true)}
                  disabled={salvando}
                >
                  Adicionar fase
                </Button>
              </Box>

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
                              <TableCell align="right">Ações</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {fases.map((fase, index) => (
                              <Draggable
                                key={fase.id}
                                draggableId={fase.id}
                                index={index}
                              >
                                {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                  <TableRow
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    sx={{
                                      bgcolor: snapshot.isDragging
                                        ? 'grey.100'
                                        : 'background.paper',
                                    }}
                                  >
                                    <TableCell
                                      {...dragProvided.dragHandleProps}
                                      sx={{ cursor: 'grab' }}
                                    >
                                      <DragIndicatorIcon fontSize="small" color="disabled" />
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
 