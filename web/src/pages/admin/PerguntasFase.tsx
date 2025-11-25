import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  DragIndicator as DragIndicatorIcon,
} from '@mui/icons-material';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
} from '@hello-pangea/dnd';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import { LoadingScreen } from '../../components/LoadingScreen';
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext';
import { useNavigation } from '../../contexts/NavigationContext';
import { useToast } from '../../contexts/ToastContext';

interface Alternativa {
  id?: number;
  texto: string;
  correta: boolean;
  ordem?: number;
}

interface Pergunta {
  id?: number;
  texto: string;
  tempoSegundos: number;
  ordem?: number;
  alternativas: Alternativa[];
}

interface Quiz {
  id: number;
  titulo: string;
  descricao?: string;
  pontosBase: number;
  perguntas: Pergunta[];
}

interface Fase {
  id: number;
  titulo: string;
  descricao?: string;
  jornada?: {
    id: number;
    titulo: string;
  };
}

const AdminPerguntasFase: React.FC = () => {
  const navigate = useNavigate();
  const { faseId } = useParams<{ faseId: string }>();
  const { confirm } = useConfirmDialog();
  const { registerInterceptor } = useNavigation();
  const { showError } = useToast();
  const [fase, setFase] = useState<Fase | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [perguntasIniciais, setPerguntasIniciais] = useState<Pergunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [errosCampos, setErrosCampos] = useState<{ perguntas?: string }>({});
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [perguntaTemporaria, setPerguntaTemporaria] = useState<Pergunta>({
    texto: '',
    tempoSegundos: 30,
    alternativas: [
      { texto: '', correta: false },
      { texto: '', correta: false },
    ],
  });

  const carregarDados = useCallback(async () => {
    if (!faseId) return;

    try {
      setLoading(true);

      const [faseRes, quizRes] = await Promise.all([
        api.get(`/fases/${faseId}`),
        api.get(`/quizzes/fase/${faseId}`).catch(() => null), // Quiz pode não existir ainda
      ]);

      const faseData = faseRes.data.data || faseRes.data;
      setFase(faseData);

      if (quizRes && quizRes.data.success) {
        const quizData = quizRes.data.data;
        setQuiz(quizData);
        const perguntasCarregadas = quizData.perguntas.map((p: any) => ({
          id: p.id,
          texto: p.texto,
          tempoSegundos: p.tempoSegundos,
          ordem: p.ordem,
          alternativas: p.alternativas.map((a: any) => ({
            id: a.id,
            texto: a.texto,
            correta: a.correta,
            ordem: a.ordem,
          })),
        }));
        setPerguntas(perguntasCarregadas);
        setPerguntasIniciais(JSON.parse(JSON.stringify(perguntasCarregadas))); // Deep copy
      } else {
        // Quiz ainda não existe, começar com array vazio
        setPerguntas([]);
        setPerguntasIniciais([]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      const mensagemErro = error.response?.data?.error || 'Erro ao carregar dados';
      showError(mensagemErro, 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [faseId, showError]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Registrar interceptor de navegação
  useEffect(() => {
    const interceptor = async (path: string): Promise<boolean> => {
      // Se está tentando navegar para a mesma página, permitir
      if (path.includes(`/admin/fases/${faseId}/perguntas`)) {
        return true;
      }

      // Se há alterações, mostrar confirmação
      if (houveAlteracoes()) {
        const confirmado = await confirm({
          title: 'Alterações não salvas',
          message: 'Você tem alterações não salvas. Se sair agora, todas as informações preenchidas serão perdidas. Deseja realmente sair?',
          confirmText: 'Sair sem salvar',
          cancelText: 'Cancelar',
          type: 'warning',
        });
        return confirmado;
      }
      return true;
    };

    registerInterceptor(interceptor);

    // Limpar interceptor ao desmontar
    return () => {
      registerInterceptor(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faseId, confirm, registerInterceptor, perguntas, perguntasIniciais]);

  const abrirModalAdicionarPergunta = () => {
    setEditandoIndex(null);
    setPerguntaTemporaria({
      texto: '',
      tempoSegundos: 30,
      alternativas: [
        { texto: '', correta: false },
        { texto: '', correta: false },
      ],
    });
    setModalAberto(true);
  };

  const abrirModalEditarPergunta = (index: number) => {
    setEditandoIndex(index);
    setPerguntaTemporaria({
      ...perguntas[index],
      alternativas: [...perguntas[index].alternativas],
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
  };

  const adicionarAlternativaNoModal = () => {
    setPerguntaTemporaria({
      ...perguntaTemporaria,
      alternativas: [
        ...perguntaTemporaria.alternativas,
        { texto: '', correta: false },
      ],
    });
  };

  const removerAlternativaNoModal = (index: number) => {
    if (perguntaTemporaria.alternativas.length > 2) {
      setPerguntaTemporaria({
        ...perguntaTemporaria,
        alternativas: perguntaTemporaria.alternativas.filter((_: Alternativa, i: number) => i !== index),
      });
    }
  };

  const atualizarAlternativaNoModal = (index: number, campo: keyof Alternativa, valor: any) => {
    const novasAlternativas = [...perguntaTemporaria.alternativas];
    novasAlternativas[index] = {
      ...novasAlternativas[index],
      [campo]: valor,
    };

    // Se está marcando uma alternativa como correta, desmarcar todas as outras
    if (campo === 'correta' && valor === true) {
      novasAlternativas.forEach((alt: Alternativa, i: number) => {
        if (i !== index) {
          alt.correta = false;
        }
      });
    }

    setPerguntaTemporaria({
      ...perguntaTemporaria,
      alternativas: novasAlternativas,
    });
  };

  const validarPerguntaModal = (): boolean => {
    if (!perguntaTemporaria.texto.trim()) {
      showError('O texto da pergunta é obrigatório', 'Erro de validação');
      return false;
    }
    if (perguntaTemporaria.alternativas.length < 2) {
      showError('É necessário pelo menos 2 alternativas', 'Erro de validação');
      return false;
    }
    const alternativasCorretas = perguntaTemporaria.alternativas.filter((a: Alternativa) => a.correta).length;
    if (alternativasCorretas === 0) {
      showError('É necessário marcar uma alternativa como correta', 'Erro de validação');
      return false;
    }
    if (alternativasCorretas > 1) {
      showError('Apenas uma alternativa pode ser marcada como correta', 'Erro de validação');
      return false;
    }
    if (perguntaTemporaria.alternativas.some((a: Alternativa) => !a.texto.trim())) {
      showError('Todas as alternativas devem ter texto', 'Erro de validação');
      return false;
    }
    return true;
  };

  const confirmarAdicionarPergunta = () => {
    if (!validarPerguntaModal()) {
      return;
    }

    if (editandoIndex !== null) {
      // Editar pergunta existente
      const novasPerguntas = [...perguntas];
      novasPerguntas[editandoIndex] = perguntaTemporaria;
      setPerguntas(novasPerguntas);
    } else {
      // Adicionar nova pergunta
      setPerguntas([...perguntas, perguntaTemporaria]);
    }
    setErrosCampos({ ...errosCampos, perguntas: undefined });
    fecharModal();
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const reordered = Array.from(perguntas);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setPerguntas(reordered);
  };

  const getPerguntaKey = (pergunta: Pergunta, index: number) =>
    pergunta.id ? `pergunta-${pergunta.id}` : `pergunta-temp-${index}`;

  const removerPergunta = (index: number) => {
    setPerguntas(perguntas.filter((_: Pergunta, i: number) => i !== index));
  };

  // Função para verificar se houve alterações
  const houveAlteracoes = (): boolean => {
    if (perguntas.length !== perguntasIniciais.length) {
      return true;
    }

    // Comparar cada pergunta
    for (let i = 0; i < perguntas.length; i++) {
      const atual = perguntas[i];
      const inicial = perguntasIniciais[i];

      // Se não existe pergunta inicial correspondente, houve alteração
      if (!inicial) {
        return true;
      }

      // Comparar texto
      if (atual.texto.trim() !== inicial.texto.trim()) {
        return true;
      }

      // Comparar tempo
      if (atual.tempoSegundos !== inicial.tempoSegundos) {
        return true;
      }

      // Comparar alternativas
      if (atual.alternativas.length !== inicial.alternativas.length) {
        return true;
      }

      for (let j = 0; j < atual.alternativas.length; j++) {
        const altAtual = atual.alternativas[j];
        const altInicial = inicial.alternativas[j];

        if (!altInicial) {
          return true;
        }

        if (altAtual.texto.trim() !== altInicial.texto.trim() || 
            altAtual.correta !== altInicial.correta) {
          return true;
        }
      }
    }

    return false;
  };

  // Função para interceptar navegação
  const handleNavegacao = async (destino: () => void) => {
    if (houveAlteracoes()) {
      const confirmado = await confirm({
        title: 'Alterações não salvas',
        message: 'Você tem alterações não salvas. Se sair agora, todas as informações preenchidas serão perdidas. Deseja realmente sair?',
        confirmText: 'Sair sem salvar',
        cancelText: 'Cancelar',
        type: 'warning',
      });

      if (confirmado) {
        destino();
      }
    } else {
      destino();
    }
  };


  const validarFormulario = (): boolean => {
    const novosErros: { perguntas?: string } = {};

    if (perguntas.length === 0) {
      novosErros.perguntas = 'Adicione pelo menos uma pergunta';
    }

    for (let i = 0; i < perguntas.length; i++) {
      const p = perguntas[i];
      if (!p.texto.trim()) {
        novosErros.perguntas = `Pergunta ${i + 1}: texto é obrigatório`;
        break;
      }
      if (p.alternativas.length < 2) {
        novosErros.perguntas = `Pergunta ${i + 1}: é necessário pelo menos 2 alternativas`;
        break;
      }
      if (!p.alternativas.some((a: Alternativa) => a.correta)) {
        novosErros.perguntas = `Pergunta ${i + 1}: é necessário marcar uma alternativa como correta`;
        break;
      }
      if (p.alternativas.some((a: Alternativa) => !a.texto.trim())) {
        novosErros.perguntas = `Pergunta ${i + 1}: todas as alternativas devem ter texto`;
        break;
      }
    }

    if (Object.keys(novosErros).length > 0 && novosErros.perguntas) {
      showError(novosErros.perguntas, 'Erro de validação');
    }

    setErrosCampos(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = async () => {
    setErrosCampos({});

    if (!validarFormulario()) {
      return;
    }

    if (!faseId) {
      showError('ID da fase não encontrado', 'Erro');
      return;
    }

    try {
      setSalvando(true);

      if (quiz) {
        // Quiz já existe, adicionar novas perguntas
        for (const pergunta of perguntas) {
          if (!pergunta.id) {
            // Nova pergunta, adicionar
            await api.post(`/quizzes/${quiz.id}/perguntas`, {
              texto: pergunta.texto.trim(),
              tempoSegundos: pergunta.tempoSegundos,
              alternativas: pergunta.alternativas.map((a: Alternativa) => ({
                texto: a.texto.trim(),
                correta: a.correta,
              })),
            });
          }
        }
      } else {
        // Quiz não existe, criar com todas as perguntas
        await api.post('/quizzes', {
          titulo: fase?.titulo || 'Quiz',
          descricao: fase?.descricao,
          faseId: Number(faseId),
          pontosBase: 100,
          perguntas: perguntas.map((p: Pergunta) => ({
            texto: p.texto.trim(),
            tempoSegundos: p.tempoSegundos,
            alternativas: p.alternativas.map((a: Alternativa) => ({
              texto: a.texto.trim(),
              correta: a.correta,
            })),
          })),
        });
      }

      // Recarregar dados para atualizar
      await carregarDados();

      setRedirecting(true);
      setTimeout(() => {
        if (fase?.jornada) {
          navigate(`/admin/jornadas/${fase.jornada.id}/fases`);
        } else {
          navigate('/admin/fases');
        }
      }, 1200);
    } catch (error: any) {
      console.error('Erro ao salvar perguntas:', error);
      const mensagemErro = error.response?.data?.error || 'Erro ao salvar perguntas';
      showError(mensagemErro, 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (redirecting) {
    return <LoadingScreen message="Salvando perguntas e retornando..." />;
  }

  return (
    <AdminLayout title={`Gerenciar Perguntas - ${fase?.titulo || 'Fase'}`}>
      <Container maxWidth="md">
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
            onClick={() => handleNavegacao(() => navigate('/admin'))}
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
            onClick={() => handleNavegacao(() => navigate('/admin/jornadas'))}
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
          {fase?.jornada && (
            <Link
              component="button"
              onClick={() => {
                if (fase?.jornada?.id) {
                  const jornadaId = fase.jornada.id;
                  handleNavegacao(() => navigate(`/admin/jornadas/${jornadaId}/fases`));
                }
              }}
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
              {fase.jornada.titulo}
            </Link>
          )}
          <Typography 
            color="text.primary"
            sx={{
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            Gerenciar Perguntas
          </Typography>
        </Breadcrumbs>


        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton 
            onClick={() => {
              if (fase?.jornada) {
                const jornadaId = fase.jornada.id;
                handleNavegacao(() => navigate(`/admin/jornadas/${jornadaId}/fases`));
              } else {
                handleNavegacao(() => navigate('/admin/fases'));
              }
            }} 
            sx={{
              color: '#011b49',
              '&:hover': {
                bgcolor: 'rgba(1, 27, 73, 0.05)',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
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
            Gerenciar Perguntas
          </Typography>
        </Box>

        {perguntas.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Nenhuma pergunta cadastrada. Adicione a primeira pergunta abaixo.
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ mb: 3, borderRadius: 2 }}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="perguntas">
                {(provided: DroppableProvided) => (
                  <Table ref={provided.innerRef} {...provided.droppableProps}>
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: 'rgba(1, 27, 73, 0.05)',
                          '& .MuiTableCell-root': {
                            textAlign: 'center',
                          },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 600, color: '#011b49' }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#011b49' }}>Pergunta</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#011b49' }}>Alternativas</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#011b49' }}>Ações</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {perguntas.map((pergunta: Pergunta, pIndex: number) => (
                        <Draggable key={getPerguntaKey(pergunta, pIndex)} draggableId={getPerguntaKey(pergunta, pIndex)} index={pIndex}>
                          {(dragProvided: DraggableProvided) => (
                            <TableRow
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              sx={{
                                '&:hover': {
                                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                                },
                              }}
                            >
                              <TableCell sx={{ fontWeight: 500, textAlign: 'center' }}>{pIndex + 1}</TableCell>
                              <TableCell sx={{ textAlign: 'justify' }}>
                                <Typography
                                  sx={{
                                    maxWidth: 500,
                                    whiteSpace: 'normal',
                                    wordBreak: 'break-word',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                  title={pergunta.texto}
                                >
                                  {pergunta.texto || '(Sem texto)'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                  {pergunta.alternativas.length} alternativa{pergunta.alternativas.length !== 1 ? 's' : ''}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                  <IconButton
                                    {...dragProvided.dragHandleProps}
                                    sx={{
                                      cursor: 'grab',
                                      '&:hover': {
                                        bgcolor: 'rgba(1, 27, 73, 0.08)',
                                      },
                                    }}
                                  >
                                    <DragIndicatorIcon />
                                  </IconButton>
                                  <IconButton
                                    color="primary"
                                    onClick={() => abrirModalEditarPergunta(pIndex)}
                                    disabled={salvando}
                                    sx={{
                                      '&:hover': {
                                        bgcolor: 'rgba(1, 27, 73, 0.1)',
                                      },
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton
                                    color="error"
                                    onClick={() => removerPergunta(pIndex)}
                                    disabled={salvando}
                                    sx={{
                                      '&:hover': {
                                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                                      },
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
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
          </TableContainer>
        )}


        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={abrirModalAdicionarPergunta}
            disabled={salvando}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            Adicionar Pergunta
          </Button>
        </Box>

        {/* Modal para adicionar pergunta */}
        <Dialog
          open={modalAberto}
          onClose={fecharModal}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 600,
              color: '#011b49',
              fontSize: '1.5rem',
              pb: 1,
            }}
          >
            {editandoIndex !== null ? 'Editar Pergunta' : 'Adicionar Nova Pergunta'}
          </DialogTitle>
          <DialogContent>

            <TextField
              fullWidth
              label="Texto da Pergunta"
              value={perguntaTemporaria.texto}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPerguntaTemporaria({ ...perguntaTemporaria, texto: e.target.value })
              }
              margin="normal"
              required
              multiline
              rows={3}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#ffffff',
                  borderRadius: 1,
                },
              }}
            />

            <Divider sx={{ my: 3 }} />

            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 600,
                color: '#011b49',
                mb: 2,
                fontSize: '1rem',
              }}
            >
              Alternativas
            </Typography>

            {perguntaTemporaria.alternativas.map((alt: Alternativa, aIndex: number) => (
              <Box
                key={aIndex}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mb: 1.5,
                  gap: 1,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.04)',
                  },
                  transition: 'background-color 0.2s ease',
                }}
              >
                <TextField
                  fullWidth
                  label={`Alternativa ${aIndex + 1}`}
                  value={alt.texto}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    atualizarAlternativaNoModal(aIndex, 'texto', e.target.value)
                  }
                  margin="normal"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: '#ffffff',
                    },
                  }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={alt.correta}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        atualizarAlternativaNoModal(aIndex, 'correta', e.target.checked)
                      }
                      sx={{
                        color: alt.correta ? '#4caf50' : 'inherit',
                        '&.Mui-checked': {
                          color: '#4caf50',
                        },
                      }}
                    />
                  }
                  label="Correta"
                  sx={{
                    ml: 1,
                    minWidth: 100,
                  }}
                />
                {perguntaTemporaria.alternativas.length > 2 && (
                  <IconButton
                    color="error"
                    onClick={() => removerAlternativaNoModal(aIndex)}
                    sx={{
                      ml: 'auto',
                      '&:hover': {
                        bgcolor: 'rgba(244, 67, 54, 0.1)',
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={adicionarAlternativaNoModal}
              sx={{
                mt: 2,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              Adicionar Alternativa
            </Button>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={fecharModal}
              variant="outlined"
              color="inherit"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
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
              onClick={confirmarAdicionarPergunta}
              variant="contained"
              sx={{
                bgcolor: '#ff2c19',
                '&:hover': {
                  bgcolor: '#e62816',
                },
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
              }}
            >
              {editandoIndex !== null ? 'Salvar Alterações' : 'Adicionar Pergunta'}
            </Button>
          </DialogActions>
        </Dialog>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            variant="outlined"
            color="inherit"
            onClick={() => {
              if (fase?.jornada) {
                const jornadaId = fase.jornada.id;
                handleNavegacao(() => navigate(`/admin/jornadas/${jornadaId}/fases`));
              } else {
                handleNavegacao(() => navigate('/admin/fases'));
              }
            }} 
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
            size="large"
            startIcon={salvando ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSalvar}
            disabled={salvando || perguntas.length === 0}
            sx={{
              bgcolor: '#ff2c19',
              '&:hover': {
                bgcolor: '#e62816',
              },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 500,
            }}
          >
            {salvando ? 'Salvando...' : 'Salvar Perguntas'}
          </Button>
        </Box>
      </Container>
    </AdminLayout>
  );
};

export default AdminPerguntasFase;

