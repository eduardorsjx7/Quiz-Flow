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
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  DragIndicator as DragIndicatorIcon,
  NavigateNext as NavigateNextIcon,
  Cancel as CancelIcon,
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
      const response = await api.post('/jornadas', {
        titulo: titulo.trim(),
        fases: fases.map((f) => ({
          titulo: f.titulo,
          ordem: f.ordem,
        })),
      });

      navigate('/admin/fases');
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar jornada');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <AdminLayout title="Criar Jornada">
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography 
          variant="h4" 
          gutterBottom 
          sx={{ 
            mb: 3, 
            fontWeight: 600, 
            textAlign: 'center',
            color: '#e62816'
          }}
        >
          Cadastrar Jornada
        </Typography>

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
 