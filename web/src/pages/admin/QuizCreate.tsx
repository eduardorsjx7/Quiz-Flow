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
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import api from '../../services/api';

interface Alternativa {
  texto: string;
  correta: boolean;
}

interface Pergunta {
  texto: string;
  tempoSegundos: number;
  alternativas: Alternativa[];
}

const AdminQuizCreate: React.FC = () => {
  const navigate = useNavigate();
  const { faseId: faseIdParam } = useParams<{ faseId: string }>();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [pontosBase, setPontosBase] = useState(100);
  const [faseId, setFaseId] = useState<number | ''>(faseIdParam ? Number(faseIdParam) : '');
  const [fase, setFase] = useState<any>(null);
  const [erro, setErro] = useState('');
  const [errosCampos, setErrosCampos] = useState<{ titulo?: string; perguntas?: string }>({});
  const [salvando, setSalvando] = useState(false);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([
    {
      texto: '',
      tempoSegundos: 30,
      alternativas: [
        { texto: '', correta: false },
        { texto: '', correta: false }
      ]
    }
  ]);

  const carregarFase = useCallback(async () => {
    if (!faseIdParam) return;
    
    try {
      const response = await api.get(`/fases/${faseIdParam}`);
      const faseData = response.data.data || response.data;
      setFase(faseData);
      setFaseId(faseData.id);
    } catch (error) {
      console.error('Erro ao carregar fase:', error);
      setErro('Erro ao carregar fase');
    }
  }, [faseIdParam]);

  useEffect(() => {
    carregarFase();
  }, [carregarFase]);

  const adicionarPergunta = () => {
    setPerguntas([
      ...perguntas,
      {
        texto: '',
        tempoSegundos: 30,
        alternativas: [
          { texto: '', correta: false },
          { texto: '', correta: false }
        ]
      }
    ]);
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
      [campo]: valor
    };
    setPerguntas(novasPerguntas);
  };

  const validarFormulario = (): boolean => {
    const novosErros: { titulo?: string; faseId?: string; perguntas?: string } = {};

    if (!titulo.trim()) {
      novosErros.titulo = 'Título é obrigatório';
    } else if (titulo.trim().length < 3) {
      novosErros.titulo = 'Título deve ter pelo menos 3 caracteres';
    }

    if (!faseId) {
      setErro('Fase não selecionada');
      return false;
    }

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
      if (!p.alternativas.some(a => a.correta)) {
        novosErros.perguntas = `Pergunta ${i + 1}: é necessário marcar uma alternativa como correta`;
        break;
      }
      if (p.alternativas.some(a => !a.texto.trim())) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setErrosCampos({});

    if (!validarFormulario()) {
      return;
    }

    try {
      setSalvando(true);
      await api.post('/quizzes', {
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        faseId: Number(faseId),
        pontosBase: pontosBase > 0 ? pontosBase : 100,
        perguntas: perguntas.map(p => ({
          ...p,
          texto: p.texto.trim(),
          alternativas: p.alternativas.map(a => ({
            ...a,
            texto: a.texto.trim()
          }))
        }))
      });
      navigate('/admin/fases');
    } catch (error: any) {
      console.error('Erro ao criar quiz:', error);
      setErro(error.response?.data?.error || 'Erro ao criar quiz');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin/fases')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Criar Quiz - {fase?.titulo || 'Fase'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informações do Quiz
            </Typography>
            <TextField
              fullWidth
              label="Título"
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
              helperText={errosCampos.titulo}
              disabled={salvando}
            />
            {fase && (
              <Box sx={{ p: 2, bgcolor: 'primary.light', borderRadius: 1, mb: 2 }}>
                <Typography variant="subtitle2" color="primary.contrastText">
                  Fase: {fase.titulo}
                </Typography>
                {fase.jornada && (
                  <Typography variant="body2" color="primary.contrastText">
                    Jornada: {fase.jornada.titulo}
                  </Typography>
                )}
              </Box>
            )}
            <TextField
              fullWidth
              label="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              margin="normal"
              multiline
              rows={3}
              disabled={salvando}
            />
            <TextField
              fullWidth
              label="Pontos Base"
              type="number"
              value={pontosBase}
              onChange={(e) => {
                const valor = parseInt(e.target.value) || 100;
                setPontosBase(valor > 0 ? valor : 100);
              }}
              margin="normal"
              inputProps={{ min: 1, max: 1000 }}
              disabled={salvando}
            />
          </Paper>

          {perguntas.map((pergunta, pIndex) => (
            <Paper key={pIndex} sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Pergunta {pIndex + 1}</Typography>
                {perguntas.length > 1 && (
                  <IconButton color="error" onClick={() => removerPergunta(pIndex)}>
                    <DeleteIcon />
                  </IconButton>
                )}
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
              type="submit"
              variant="contained"
              size="large"
              disabled={salvando}
              startIcon={salvando ? <CircularProgress size={20} /> : undefined}
            >
              {salvando ? 'Salvando...' : 'Criar Quiz'}
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/fases')}
              disabled={salvando}
            >
              Cancelar
            </Button>
          </Box>
        </form>
      </Container>
    </>
  );
};

export default AdminQuizCreate;

