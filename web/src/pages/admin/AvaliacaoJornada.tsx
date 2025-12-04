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
  Card,
  CardContent,
  CardActions,
  Divider,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
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

  const handleDeletarAvaliacao = async (avaliacaoId: number) => {
    const resultado = await confirm({
      title: 'Excluir Avaliação?',
      message: 'Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.',
      confirmText: 'Sim, excluir',
      cancelText: 'Cancelar',
      type: 'delete',
    });

    if (!resultado) return;

    try {
      await api.delete(`/avaliacoes/${avaliacaoId}`);
      showSuccess('Avaliação excluída com sucesso!');
      carregarDados();
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao excluir avaliação');
    }
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
      <AdminLayout title="Avaliação da Jornada">
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <Typography>Carregando...</Typography>
          </Box>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Avaliação da Jornada - ${jornada?.titulo || ''}`}>
      <Container maxWidth="lg">
        {/* Cabeçalho */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(`/admin/jornadas/${jornadaId}/fases`)}>
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#011b49' }}>
              Avaliação da Jornada
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {jornada?.titulo}
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCriarNova}
            sx={{
              bgcolor: '#ff2c19',
              '&:hover': { bgcolor: '#e62816' },
            }}
          >
            Nova Avaliação
          </Button>
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
          <Grid container spacing={3}>
            {avaliacoes.map((avaliacao) => (
              <Grid item xs={12} md={6} key={avaliacao.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {avaliacao.titulo}
                        </Typography>
                        {avaliacao.descricao && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {avaliacao.descricao}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Chip
                          label={avaliacao.ativo ? 'Ativa' : 'Inativa'}
                          color={avaliacao.ativo ? 'success' : 'default'}
                          size="small"
                        />
                        {avaliacao.obrigatorio && (
                          <Chip label="Obrigatória" color="warning" size="small" />
                        )}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        {avaliacao.perguntas?.length || 0} pergunta(s)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        •
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {avaliacao._count?.respostas || 0} resposta(s)
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      startIcon={<VisibilityIcon />}
                      onClick={() =>
                        navigate(`/admin/avaliacoes/${avaliacao.id}/respostas`)
                      }
                    >
                      Ver Respostas
                    </Button>
                    <Button
                      size="small"
                      startIcon={<AssessmentIcon />}
                      onClick={() =>
                        navigate(`/admin/avaliacoes/${avaliacao.id}/relatorio`)
                      }
                    >
                      Relatório
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeletarAvaliacao(avaliacao.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
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

