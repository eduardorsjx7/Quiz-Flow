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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';

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
        tempoSegundos: 30, // Valor padrão, será definido pela jornada
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
          {fase?.jornada && (
            <Link
              component="button"
              onClick={() => {
                if (fase?.jornada?.id) {
                  navigate(`/admin/jornadas/${fase.jornada.id}/fases`);
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

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <IconButton 
            onClick={() => {
              if (fase?.jornada) {
                navigate(`/admin/jornadas/${fase.jornada.id}/fases`);
              } else {
                navigate('/admin/fases');
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
        ) : null}

        {perguntas.map((pergunta, pIndex) => (
          <Paper 
            key={pIndex} 
            sx={{ 
              p: 3, 
              mb: 3,
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 600,
                  color: '#011b49',
                  fontSize: '1.25rem',
                }}
              >
                Pergunta {pIndex + 1}
              </Typography>
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

            {pergunta.alternativas.map((alt, aIndex) => (
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
                  onChange={(e) => atualizarAlternativa(pIndex, aIndex, 'texto', e.target.value)}
                  margin="normal"
                  required
                  disabled={salvando}
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
                      onChange={(e) => atualizarAlternativa(pIndex, aIndex, 'correta', e.target.checked)}
                      disabled={salvando}
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
                {pergunta.alternativas.length > 2 && (
                  <IconButton
                    color="error"
                    onClick={() => removerAlternativa(pIndex, aIndex)}
                    disabled={salvando}
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
              onClick={() => adicionarAlternativa(pIndex)}
              sx={{ 
                mt: 2,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 500,
              }}
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

        <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={adicionarPergunta}
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

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            variant="outlined"
            color="inherit"
            onClick={() => {
              if (fase?.jornada) {
                navigate(`/admin/jornadas/${fase.jornada.id}/fases`);
              } else {
                navigate('/admin/fases');
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

