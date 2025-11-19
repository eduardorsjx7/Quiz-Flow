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
  AppBar,
  Toolbar,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface Fase {
  titulo: string;
  descricao?: string;
  ordem: number;
}

const CriarJornada: React.FC = () => {
  const navigate = useNavigate();
  const [titulo, setTitulo] = useState('');
  const [faseTitulo, setFaseTitulo] = useState('');
  const [faseDescricao, setFaseDescricao] = useState('');
  const [fases, setFases] = useState<Fase[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [errosCampos, setErrosCampos] = useState<{ titulo?: string; fases?: string }>({});

  const validarFormulario = (): boolean => {
    const novosErros: { titulo?: string; fases?: string } = {};

    if (!titulo.trim()) {
      novosErros.titulo = 'Título é obrigatório';
    } else if (titulo.trim().length < 3) {
      novosErros.titulo = 'Título deve ter pelo menos 3 caracteres';
    }

    if (fases.length === 0) {
      novosErros.fases = 'É necessário cadastrar pelo menos uma fase';
    }

    setErrosCampos(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const adicionarFase = () => {
    if (!faseTitulo.trim()) {
      setErro('Informe o título da fase');
      return;
    }

    const novaFase: Fase = {
      titulo: faseTitulo.trim(),
      descricao: faseDescricao.trim() || undefined,
      ordem: fases.length + 1,
    };

    setFases([...fases, novaFase]);
    setFaseTitulo('');
    setFaseDescricao('');
    setErro('');
    if (errosCampos.fases) {
      setErrosCampos({ ...errosCampos, fases: undefined });
    }
  };

  const removerFase = (index: number) => {
    const novasFases = fases.filter((_, i) => i !== index);
    // Reordenar
    const fasesReordenadas = novasFases.map((fase, i) => ({
      ...fase,
      ordem: i + 1,
    }));
    setFases(fasesReordenadas);
  };

  const handleSalvar = async () => {
    setErro('');
    setErrosCampos({});

    if (!validarFormulario()) {
      return;
    }

    try {
      setSalvando(true);
      await api.post('/jornadas', {
        titulo: titulo.trim(),
        fases: fases.map((f) => ({
          titulo: f.titulo,
          descricao: f.descricao,
          ordem: f.ordem,
        })),
      });

      navigate('/admin/jornadas');
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao criar jornada');
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
            Criar Nova Jornada
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
            Informações da Jornada
          </Typography>

          <TextField
            fullWidth
            label="Título da Jornada"
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
            placeholder="Ex: Capacitação 2024"
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Fases do PDC (Setores)
          </Typography>

          {errosCampos.fases && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errosCampos.fases}
            </Alert>
          )}

          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <TextField
              fullWidth
              label="Nome da Fase (Setor)"
              value={faseTitulo}
              onChange={(e) => setFaseTitulo(e.target.value)}
              margin="normal"
              size="small"
              disabled={salvando}
              placeholder="Ex: Setor Fiscal, Setor Comercial, etc."
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  adicionarFase();
                }
              }}
            />
            <TextField
              fullWidth
              label="Descrição (Opcional)"
              value={faseDescricao}
              onChange={(e) => setFaseDescricao(e.target.value)}
              margin="normal"
              size="small"
              multiline
              rows={2}
              disabled={salvando}
            />
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={adicionarFase}
              disabled={salvando || !faseTitulo.trim()}
              sx={{ mt: 1 }}
            >
              Adicionar Fase
            </Button>
          </Box>

          {fases.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Fases Cadastradas ({fases.length})
              </Typography>
              <List>
                {fases.map((fase, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      bgcolor: 'background.paper',
                      mb: 1,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label={`${fase.ordem}º`} size="small" color="primary" />
                          <Typography variant="body1" fontWeight="medium">
                            {fase.titulo}
                          </Typography>
                        </Box>
                      }
                      secondary={fase.descricao}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => removerFase(index)}
                        disabled={salvando}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => navigate('/admin/jornadas')} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={salvando ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSalvar}
              disabled={salvando || fases.length === 0}
            >
              {salvando ? 'Salvando...' : 'Criar Jornada'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default CriarJornada;

