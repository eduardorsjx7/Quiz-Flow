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
  AppBar,
  Toolbar,
  FormControlLabel,
  Checkbox,
  Divider,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import api from '../../services/api';

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
  const [fase, setFase] = useState<Fase | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [errosCampos, setErrosCampos] = useState<{ perguntas?: string }>({});

  const carregarDados = useCallback(async () => {
    if (!faseId) return;

    try {
      setLoading(true);
      setErro('');

      const [faseRes, quizRes] = await Promise.all([
        api.get(`/fases/${faseId}`),
        api.get(`/quizzes/fase/${faseId}`).catch(() => null), // Quiz pode não existir ainda
      ]);

      const faseData = faseRes.data.data || faseRes.data;
      setFase(faseData);

      if (quizRes && quizRes.data.success) {
        const quizData = quizRes.data.data;
        setQuiz(quizData);
        setPerguntas(
          quizData.perguntas.map((p: any) => ({
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
          }))
        );
      } else {
        // Quiz ainda não existe, começar com array vazio
        setPerguntas([]);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      setErro(error.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [faseId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const adicionarPergunta = () => {
    setPerguntas([
      ...perguntas,
      {
        texto: '',
        tempoSegundos: 30,
        alternativas: [
          { texto: '', correta: false },
          { texto: '', correta: false },
        ],
      },
    ]);
    setErrosCampos({ ...errosCampos, perguntas: undefined });
  };

  const removerPergunta = (index: number) => {
    setPerguntas(perguntas.filter((_, i) => i !== index));
  };

  const atualizarPergunta = (index: number, campo: keyof Pergunta, valor: any) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[index] = { ...novasPerguntas[index], [campo]: valor };
    setPerguntas(novasPerguntas);
  };

  const adicionarAlternativa = (perguntaIndex: number) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[perguntaIndex].alternativas.push({ texto: '', correta: false });
    setPerguntas(novasPerguntas);
  };

  const removerAlternativa = (perguntaIndex: number, altIndex: number) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[perguntaIndex].alternativas = novasPerguntas[perguntaIndex].alternativas.filter(
      (_, i) => i !== altIndex
    );
    setPerguntas(novasPerguntas);
  };

  const atualizarAlternativa = (
    perguntaIndex: number,
    altIndex: number,
    campo: keyof Alternativa,
    valor: any
  ) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[perguntaIndex].alternativas[altIndex] = {
      ...novasPerguntas[perguntaIndex].alternativas[altIndex],
      [campo]: valor,
    };
    setPerguntas(novasPerguntas);
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
      if (!p.alternativas.some((a) => a.correta)) {
        novosErros.perguntas = `Pergunta ${i + 1}: é necessário marcar uma alternativa como correta`;
        break;
      }
      if (p.alternativas.some((a) => !a.texto.trim())) {
        novosErros.perguntas = `Pergunta ${i + 1}: todas as alternativas devem ter texto`;
        break;
      }
      if (p.tempoSegundos < 5 || p.tempoSegundos > 300) {
        novosErros.perguntas = `Pergunta ${i + 1}: tempo deve estar entre 5 e 300 segundos`;
        break;
      }
    }

    setErrosCampos(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = async () => {
    setErro('');
    setErrosCampos({});

    if (!validarFormulario()) {
      return;
    }

    if (!faseId) {
      setErro('ID da fase não encontrado');
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
              alternativas: pergunta.alternativas.map((a) => ({
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
          perguntas: perguntas.map((p) => ({
            texto: p.texto.trim(),
            tempoSegundos: p.tempoSegundos,
            alternativas: p.alternativas.map((a) => ({
              texto: a.texto.trim(),
              correta: a.correta,
            })),
          })),
        });
      }

      // Recarregar dados para atualizar
      await carregarDados();
    } catch (error: any) {
      console.error('Erro ao salvar perguntas:', error);
      setErro(error.response?.data?.error || 'Erro ao salvar perguntas');
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

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin/fases')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Gerenciar Perguntas - {fase?.titulo || 'Fase'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/admin')}
            sx={{ cursor: 'pointer' }}
          >
            Dashboard
          </Link>
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/admin/fases')}
            sx={{ cursor: 'pointer' }}
          >
            Fases
          </Link>
          <Typography color="text.primary">{fase?.titulo || 'Fase'}</Typography>
        </Breadcrumbs>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        {fase && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light' }}>
            <Typography variant="h6" color="primary.contrastText">
              {fase.titulo}
            </Typography>
            {fase.jornada && (
              <Typography variant="body2" color="primary.contrastText">
                Jornada: {fase.jornada.titulo}
              </Typography>
            )}
            {fase.descricao && (
              <Typography variant="body2" color="primary.contrastText" sx={{ mt: 1 }}>
                {fase.descricao}
              </Typography>
            )}
          </Paper>
        )}

        {perguntas.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Nenhuma pergunta cadastrada. Adicione a primeira pergunta abaixo.
          </Alert>
        ) : null}

        {perguntas.map((pergunta, pIndex) => (
          <Paper key={pIndex} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Pergunta {pIndex + 1}</Typography>
              <IconButton color="error" onClick={() => removerPergunta(pIndex)} disabled={salvando}>
                <DeleteIcon />
              </IconButton>
            </Box>

            <TextField
              fullWidth
              label="Texto da Pergunta"
              value={pergunta.texto}
              onChange={(e) => atualizarPergunta(pIndex, 'texto', e.target.value)}
              margin="normal"
              required
              multiline
              rows={2}
              disabled={salvando}
            />
            <TextField
              fullWidth
              label="Tempo (segundos)"
              type="number"
              value={pergunta.tempoSegundos}
              onChange={(e) => atualizarPergunta(pIndex, 'tempoSegundos', parseInt(e.target.value) || 30)}
              margin="normal"
              required
              inputProps={{ min: 5, max: 300 }}
              disabled={salvando}
            />

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" gutterBottom>
              Alternativas
            </Typography>

            {pergunta.alternativas.map((alt, aIndex) => (
              <Box key={aIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TextField
                  fullWidth
                  label={`Alternativa ${aIndex + 1}`}
                  value={alt.texto}
                  onChange={(e) => atualizarAlternativa(pIndex, aIndex, 'texto', e.target.value)}
                  margin="normal"
                  required
                  disabled={salvando}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={alt.correta}
                      onChange={(e) => atualizarAlternativa(pIndex, aIndex, 'correta', e.target.checked)}
                      disabled={salvando}
                    />
                  }
                  label="Correta"
                  sx={{ ml: 2 }}
                />
                {pergunta.alternativas.length > 2 && (
                  <IconButton
                    color="error"
                    onClick={() => removerAlternativa(pIndex, aIndex)}
                    sx={{ ml: 1 }}
                    disabled={salvando}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => adicionarAlternativa(pIndex)}
              sx={{ mt: 1 }}
              disabled={salvando}
            >
              Adicionar Alternativa
            </Button>
          </Paper>
        ))}

        {errosCampos.perguntas && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errosCampos.perguntas}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={adicionarPergunta}
            disabled={salvando}
          >
            Adicionar Pergunta
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={salvando ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSalvar}
            disabled={salvando || perguntas.length === 0}
          >
            {salvando ? 'Salvando...' : 'Salvar Perguntas'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/admin/fases')} disabled={salvando}>
            Voltar
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default AdminPerguntasFase;

