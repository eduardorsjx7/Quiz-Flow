import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  Home as HomeIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import { useConfirmDialog } from '../../contexts/ConfirmDialogContext';

interface Alternativa {
  texto: string;
  valor: number;
  ordem: number;
}

interface Pergunta {
  texto: string;
  tipo: 'MULTIPLA_ESCOLHA' | 'TEXTO_LIVRE' | 'NOTA' | 'SIM_NAO';
  ordem: number;
  obrigatoria: boolean;
  alternativas?: Alternativa[];
}

interface AvaliacaoData {
  titulo: string;
  descricao: string;
  ativo: boolean;
  obrigatorio: boolean;
  perguntas: Pergunta[];
}

const AvaliacaoJornada: React.FC = () => {
  const { jornadaId } = useParams<{ jornadaId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmDialog();

  const [jornada, setJornada] = useState<any>(null);
  const [avaliacoes, setAvaliacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [avaliacaoEditando, setAvaliacaoEditando] = useState<AvaliacaoData>({
    titulo: '',
    descricao: '',
    ativo: true,
    obrigatorio: false,
    perguntas: [],
  });
  const [novaPergunta, setNovaPergunta] = useState<Pergunta>({
    texto: '',
    tipo: 'MULTIPLA_ESCOLHA',
    ordem: 0,
    obrigatoria: true,
    alternativas: [],
  });
  const [dialogPerguntaAberto, setDialogPerguntaAberto] = useState(false);

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jornadaId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      // Carregar jornada
      const jornadaRes = await api.get(`/jornadas/${jornadaId}`);
      setJornada(jornadaRes.data.data || jornadaRes.data);

      // Carregar avaliações
      const avaliacoesRes = await api.get(`/avaliacoes/jornada/${jornadaId}`);
      setAvaliacoes(avaliacoesRes.data.data || avaliacoesRes.data || []);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCriarNova = () => {
    setAvaliacaoEditando({
      titulo: '',
      descricao: '',
      ativo: true,
      obrigatorio: false,
      perguntas: [],
    });
    setModalAberto(true);
  };

  const handleSalvarAvaliacao = async () => {
    if (!avaliacaoEditando.titulo.trim()) {
      showError('O título é obrigatório');
      return;
    }

    if (avaliacaoEditando.perguntas.length === 0) {
      showError('Adicione pelo menos uma pergunta');
      return;
    }

    try {
      setSalvando(true);
      await api.post('/avaliacoes', {
        jornadaId: Number(jornadaId),
        ...avaliacaoEditando,
      });

      showSuccess('Avaliação criada com sucesso!');
      setModalAberto(false);
      carregarDados();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao salvar avaliação');
    } finally {
      setSalvando(false);
    }
  };

  const handleAdicionarPergunta = () => {
    if (!novaPergunta.texto.trim()) {
      showError('O texto da pergunta é obrigatório');
      return;
    }

    if (
      (novaPergunta.tipo === 'MULTIPLA_ESCOLHA' || novaPergunta.tipo === 'SIM_NAO') &&
      (!novaPergunta.alternativas || novaPergunta.alternativas.length === 0)
    ) {
      showError('Adicione pelo menos uma alternativa');
      return;
    }

    const perguntaComOrdem = {
      ...novaPergunta,
      ordem: avaliacaoEditando.perguntas.length,
    };

    setAvaliacaoEditando({
      ...avaliacaoEditando,
      perguntas: [...avaliacaoEditando.perguntas, perguntaComOrdem],
    });

    setNovaPergunta({
      texto: '',
      tipo: 'MULTIPLA_ESCOLHA',
      ordem: 0,
      obrigatoria: true,
      alternativas: [],
    });

    setDialogPerguntaAberto(false);
    showSuccess('Pergunta adicionada!');
  };

  const handleRemoverPergunta = (index: number) => {
    const novasPerguntas = avaliacaoEditando.perguntas.filter((_, i) => i !== index);
    // Reordenar
    const perguntasReordenadas = novasPerguntas.map((p, i) => ({ ...p, ordem: i }));

    setAvaliacaoEditando({
      ...avaliacaoEditando,
      perguntas: perguntasReordenadas,
    });
  };

  const handleAdicionarAlternativa = () => {
    const novaAlternativa: Alternativa = {
      texto: '',
      valor: (novaPergunta.alternativas?.length || 0) + 1,
      ordem: novaPergunta.alternativas?.length || 0,
    };

    setNovaPergunta({
      ...novaPergunta,
      alternativas: [...(novaPergunta.alternativas || []), novaAlternativa],
    });
  };

  const handleAtualizarAlternativa = (index: number, campo: string, valor: any) => {
    const alternativasAtualizadas = [...(novaPergunta.alternativas || [])];
    alternativasAtualizadas[index] = {
      ...alternativasAtualizadas[index],
      [campo]: valor,
    };

    setNovaPergunta({
      ...novaPergunta,
      alternativas: alternativasAtualizadas,
    });
  };

  const handleRemoverAlternativa = (index: number) => {
    const alternativasAtualizadas = novaPergunta.alternativas?.filter((_, i) => i !== index);
    setNovaPergunta({
      ...novaPergunta,
      alternativas: alternativasAtualizadas,
    });
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      MULTIPLA_ESCOLHA: 'Múltipla Escolha',
      TEXTO_LIVRE: 'Texto Livre',
      NOTA: 'Nota (0-10)',
      SIM_NAO: 'Sim/Não',
    };
    return tipos[tipo] || tipo;
  };

  if (loading) {
    return (
      <AdminLayout title="Avaliação de Fases">
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <Typography>Carregando...</Typography>
          </Box>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Avaliação da Jornada">
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate(`/admin/jornadas/${jornadaId}/fases`)}
              sx={{
                color: 'text.secondary',
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
                Avaliação de Fases
              </Typography>
            </Breadcrumbs>
          </Box>
          {/* Cabeçalho */}
          <Box sx={{ mb: 4, mt: 3 }}>
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
                }}
              >
                Avaliação de Fases
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  fontSize: '1rem',
                  fontWeight: 400,
                }}
              >
                {jornada?.titulo || 'Jornada'}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Lista de Avaliações */}
        {avaliacoes.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Nenhuma avaliação criada ainda
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Crie uma avaliação para coletar feedback dos participantes sobre esta jornada
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCriarNova}
              sx={{
                bgcolor: '#ff2c19',
                '&:hover': { bgcolor: '#e62816' },
              }}
            >
              Criar Primeira Avaliação
            </Button>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {avaliacoes.map((avaliacao) => (
              <Paper key={avaliacao.id} sx={{ p: 3, borderRadius: 2 }}>
                {/* Cabeçalho da Avaliação */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={handleCriarNova}
                      sx={{
                        backgroundColor: '#011b49e0',
                        color: '#fff3e0',
                        '&:hover': {
                          backgroundColor: '#ff2c19',
                        },
                      }}
                      title="Nova Avaliação"
                    >
                      <AddIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() =>
                        navigate(`/admin/avaliacoes/${avaliacao.id}/relatorio`)
                      }
                      sx={{
                        backgroundColor: '#011b49e0',
                        color: '#fff3e0',
                        '&:hover': {
                          backgroundColor: '#ff2c19',
                        },
                      }}
                      title="Relatório"
                    >
                      <AssessmentIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Lista de Perguntas */}
                {avaliacao.perguntas && avaliacao.perguntas.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {avaliacao.perguntas.map((pergunta: any, index: number) => (
                      <Box 
                        key={pergunta.id} 
                        sx={{ 
                          p: 2, 
                          bgcolor: '#f9f9f9',
                          borderRadius: 1,
                          border: '1px solid #e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            bgcolor: '#f0f0f0',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          },
                        }}
                      >
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            minWidth: '24px',
                            fontWeight: 600,
                            color: 'text.secondary'
                          }}
                        >
                          {index + 1}.
                        </Typography>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {pergunta.texto}
                        </Typography>
                        <Chip 
                          label={`${pergunta.peso || 0}%`} 
                          size="small" 
                          sx={{ 
                            bgcolor: '#e3f2fd',
                            color: '#1976d2',
                            fontWeight: 600,
                            minWidth: '50px'
                          }} 
                        />
                        <Chip 
                          label={getTipoLabel(pergunta.tipo)} 
                          size="small" 
                          sx={{ 
                            bgcolor: '#f5f5f5',
                            color: '#666',
                            fontWeight: 500,
                          }} 
                        />
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (index === 0) return;
                              // TODO: Implementar mover pergunta para cima
                            }}
                            disabled={index === 0}
                            sx={{
                              color: 'action.active',
                              '&:hover': { bgcolor: 'action.hover' },
                              '&:disabled': { color: 'action.disabled' }
                            }}
                            title="Mover para cima"
                          >
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (index === (avaliacao.perguntas?.length || 0) - 1) return;
                              // TODO: Implementar mover pergunta para baixo
                            }}
                            disabled={index === (avaliacao.perguntas?.length || 0) - 1}
                            sx={{
                              color: 'action.active',
                              '&:hover': { bgcolor: 'action.hover' },
                              '&:disabled': { color: 'action.disabled' }
                            }}
                            title="Mover para baixo"
                          >
                            <ArrowDownwardIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              // TODO: Implementar editar pergunta
                            }}
                            sx={{ 
                              color: 'info.main',
                              '&:hover': { bgcolor: 'rgba(33, 150, 243, 0.1)' }
                            }}
                            title="Editar pergunta"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={async () => {
                              const resultado = await confirm({
                                title: 'Excluir Pergunta?',
                                message: `Tem certeza que deseja excluir a pergunta "${pergunta.texto}"?`,
                                confirmText: 'Sim, excluir',
                                cancelText: 'Cancelar',
                                type: 'delete',
                              });

                              if (!resultado) return;

                              try {
                                // TODO: Implementar exclusão de pergunta
                                showSuccess('Pergunta excluída com sucesso!');
                                carregarDados();
                              } catch (error: any) {
                                showError(error.response?.data?.error || 'Erro ao excluir pergunta');
                              }
                            }}
                            sx={{
                              color: 'error.main',
                              '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' }
                            }}
                            title="Excluir pergunta"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">
                    Nenhuma pergunta configurada nesta avaliação
                  </Alert>
                )}
              </Paper>
            ))}
          </Box>
        )}

        {/* Modal de Criar/Editar Avaliação */}
        <Dialog
          open={modalAberto}
          onClose={() => setModalAberto(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ fontWeight: 600, color: '#011b49' }}>
            Nova Avaliação
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Título da Avaliação"
                value={avaliacaoEditando.titulo}
                onChange={(e) =>
                  setAvaliacaoEditando({ ...avaliacaoEditando, titulo: e.target.value })
                }
                margin="normal"
                required
              />

              <TextField
                fullWidth
                label="Descrição"
                value={avaliacaoEditando.descricao}
                onChange={(e) =>
                  setAvaliacaoEditando({ ...avaliacaoEditando, descricao: e.target.value })
                }
                margin="normal"
                multiline
                rows={3}
              />

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={avaliacaoEditando.ativo}
                      onChange={(e) =>
                        setAvaliacaoEditando({
                          ...avaliacaoEditando,
                          ativo: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Ativa"
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={avaliacaoEditando.obrigatorio}
                      onChange={(e) =>
                        setAvaliacaoEditando({
                          ...avaliacaoEditando,
                          obrigatorio: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Obrigatória"
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Perguntas ({avaliacaoEditando.perguntas.length})
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => setDialogPerguntaAberto(true)}
                >
                  Adicionar Pergunta
                </Button>
              </Box>

              {avaliacaoEditando.perguntas.length === 0 ? (
                <Alert severity="info">
                  Adicione perguntas para sua avaliação
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {avaliacaoEditando.perguntas.map((pergunta, index) => (
                    <Paper key={index} sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {index + 1}. {pergunta.texto}
                        </Typography>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoverPergunta(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip label={getTipoLabel(pergunta.tipo)} size="small" />
                        {pergunta.obrigatoria && (
                          <Chip label="Obrigatória" size="small" color="warning" />
                        )}
                      </Box>
                      {pergunta.alternativas && pergunta.alternativas.length > 0 && (
                        <Box sx={{ mt: 1, pl: 2 }}>
                          {pergunta.alternativas.map((alt, i) => (
                            <Typography key={i} variant="body2" color="text.secondary">
                              • {alt.texto} (valor: {alt.valor})
                            </Typography>
                          ))}
                        </Box>
                      )}
                      {pergunta.tipo === 'TEXTO_LIVRE' && (
                        <Box sx={{ mt: 1, pl: 2 }}>
                          <Chip 
                            label="Não contabilizada" 
                            size="small" 
                            color="default"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setModalAberto(false)} color="inherit">
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleSalvarAvaliacao}
              disabled={salvando}
              startIcon={<SaveIcon />}
              sx={{
                bgcolor: '#ff2c19',
                '&:hover': { bgcolor: '#e62816' },
              }}
            >
              {salvando ? 'Salvando...' : 'Salvar Avaliação'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog Adicionar Pergunta */}
        <Dialog
          open={dialogPerguntaAberto}
          onClose={() => setDialogPerguntaAberto(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Adicionar Pergunta</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Texto da Pergunta"
                value={novaPergunta.texto}
                onChange={(e) =>
                  setNovaPergunta({ ...novaPergunta, texto: e.target.value })
                }
                margin="normal"
                required
                multiline
                rows={2}
              />

              <FormControl fullWidth margin="normal">
                <InputLabel>Tipo de Pergunta</InputLabel>
                <Select
                  value={novaPergunta.tipo}
                  onChange={(e: any) => {
                    const novoTipo = e.target.value;
                    setNovaPergunta({
                      ...novaPergunta,
                      tipo: novoTipo,
                      alternativas: novoTipo === 'TEXTO_LIVRE' || novoTipo === 'NOTA' ? [] : novaPergunta.alternativas,
                    });
                  }}
                  label="Tipo de Pergunta"
                >
                  <MenuItem value="MULTIPLA_ESCOLHA">Múltipla Escolha</MenuItem>
                  <MenuItem value="TEXTO_LIVRE">Texto Livre</MenuItem>
                  <MenuItem value="NOTA">Nota (0-10)</MenuItem>
                  <MenuItem value="SIM_NAO">Sim/Não</MenuItem>
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={novaPergunta.obrigatoria}
                    onChange={(e) =>
                      setNovaPergunta({ ...novaPergunta, obrigatoria: e.target.checked })
                    }
                  />
                }
                label="Pergunta Obrigatória"
                sx={{ mt: 2 }}
              />

              {(novaPergunta.tipo === 'MULTIPLA_ESCOLHA' || novaPergunta.tipo === 'SIM_NAO') && (
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Alternativas
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={handleAdicionarAlternativa}
                    >
                      Adicionar
                    </Button>
                  </Box>

                  {novaPergunta.alternativas?.map((alt, index) => (
                    <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <TextField
                        size="small"
                        label="Texto"
                        value={alt.texto}
                        onChange={(e) =>
                          handleAtualizarAlternativa(index, 'texto', e.target.value)
                        }
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        label="Valor"
                        type="number"
                        value={alt.valor}
                        onChange={(e) =>
                          handleAtualizarAlternativa(index, 'valor', Number(e.target.value))
                        }
                        sx={{ width: 80 }}
                      />
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoverAlternativa(index)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setDialogPerguntaAberto(false)} color="inherit">
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleAdicionarPergunta}
              sx={{
                bgcolor: '#ff2c19',
                '&:hover': { bgcolor: '#e62816' },
              }}
            >
              Adicionar
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AdminLayout>
  );
};

export default AvaliacaoJornada;

