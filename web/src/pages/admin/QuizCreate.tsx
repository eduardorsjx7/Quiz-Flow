import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider
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
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [pontosBase, setPontosBase] = useState(100);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!titulo.trim()) {
      alert('Título é obrigatório');
      return;
    }

    for (let i = 0; i < perguntas.length; i++) {
      const p = perguntas[i];
      if (!p.texto.trim()) {
        alert(`Pergunta ${i + 1}: texto é obrigatório`);
        return;
      }
      if (p.alternativas.length < 2) {
        alert(`Pergunta ${i + 1}: é necessário pelo menos 2 alternativas`);
        return;
      }
      if (!p.alternativas.some(a => a.correta)) {
        alert(`Pergunta ${i + 1}: é necessário marcar uma alternativa como correta`);
        return;
      }
      if (p.alternativas.some(a => !a.texto.trim())) {
        alert(`Pergunta ${i + 1}: todas as alternativas devem ter texto`);
        return;
      }
    }

    try {
      await api.post('/quizzes', {
        titulo,
        descricao,
        pontosBase,
        perguntas
      });
      alert('Quiz criado com sucesso!');
      navigate('/admin/quizzes');
    } catch (error: any) {
      console.error('Erro ao criar quiz:', error);
      alert(error.response?.data?.error || 'Erro ao criar quiz');
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin/quizzes')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Criar Novo Quiz
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Informações do Quiz
            </Typography>
            <TextField
              fullWidth
              label="Título"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Descrição"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              margin="normal"
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              label="Pontos Base"
              type="number"
              value={pontosBase}
              onChange={(e) => setPontosBase(parseInt(e.target.value) || 100)}
              margin="normal"
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
              />
              <TextField
                fullWidth
                label="Tempo (segundos)"
                type="number"
                value={pergunta.tempoSegundos}
                onChange={(e) => atualizarPergunta(pIndex, 'tempoSegundos', parseInt(e.target.value) || 30)}
                margin="normal"
                required
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
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={alt.correta}
                        onChange={(e) => atualizarAlternativa(pIndex, aIndex, 'correta', e.target.checked)}
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
              >
                Adicionar Alternativa
              </Button>
            </Paper>
          ))}

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={adicionarPergunta}
            >
              Adicionar Pergunta
            </Button>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
            >
              Criar Quiz
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/admin/quizzes')}
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

