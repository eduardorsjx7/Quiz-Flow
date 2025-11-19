import React, { useState, useEffect } from 'react';
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
  AppBar,
  Toolbar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import api from '../../services/api';

const CriarFase: React.FC = () => {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ordem, setOrdem] = useState(0);
  const [jornadaId, setJornadaId] = useState<number | ''>('');
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [errosCampos, setErrosCampos] = useState<{ titulo?: string; jornadaId?: string }>({});

  useEffect(() => {
    carregarJornadas();
  }, []);

  const carregarJornadas = async () => {
    try {
      const response = await api.get('/jornadas');
      setJornadas(response.data.data || response.data || []);
    } catch (error) {
      console.error('Erro ao carregar jornadas:', error);
    }
  };

  const validarFormulario = (): boolean => {
    const novosErros: { titulo?: string; jornadaId?: string } = {};

    if (!titulo.trim()) {
      novosErros.titulo = 'Título é obrigatório';
    } else if (titulo.trim().length < 3) {
      novosErros.titulo = 'Título deve ter pelo menos 3 caracteres';
    }

    if (!jornadaId) {
      novosErros.jornadaId = 'Jornada é obrigatória';
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

    try {
      setSalvando(true);
      await api.post('/fases', {
        jornadaId: Number(jornadaId),
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        ordem: ordem || 0,
      });

      navigate('/admin/jornadas');
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar fase');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin/jornadas')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Criar Nova Fase
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Informações da Fase
          </Typography>

          <FormControl fullWidth margin="normal" error={!!errosCampos.jornadaId} required>
            <InputLabel>Jornada</InputLabel>
            <Select
              value={jornadaId}
              onChange={(e) => {
                setJornadaId(e.target.value as number);
                if (errosCampos.jornadaId) {
                  setErrosCampos({ ...errosCampos, jornadaId: undefined });
                }
              }}
              label="Jornada"
              disabled={salvando}
            >
              {jornadas.map((jornada) => (
                <MenuItem key={jornada.id} value={jornada.id}>
                  {jornada.titulo}
                </MenuItem>
              ))}
            </Select>
            {errosCampos.jornadaId && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                {errosCampos.jornadaId}
              </Typography>
            )}
          </FormControl>

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
            label="Ordem"
            type="number"
            value={ordem}
            onChange={(e) => setOrdem(parseInt(e.target.value) || 0)}
            margin="normal"
            inputProps={{ min: 0 }}
            disabled={salvando}
          />

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => navigate('/admin/jornadas')} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={salvando ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSalvar}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Criar Fase'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default CriarFase;

