import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  matricula?: string;
  faseAtual?: {
    id: number;
    titulo: string;
  };
}

interface Fase {
  id: number;
  titulo: string;
  jornada: {
    id: number;
    titulo: string;
  };
}

const DefinirFaseAtual: React.FC = () => {
  const { usuarioId } = useParams<{ usuarioId: string }>();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [fases, setFases] = useState<Fase[]>([]);
  const [faseSelecionada, setFaseSelecionada] = useState<number | ''>('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [usuarioId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [usuarioRes, fasesRes] = await Promise.all([
        api.get(`/auth/usuarios`).then((res) => {
          const usuarios = res.data.data || res.data;
          return usuarios.find((u: Usuario) => u.id === Number(usuarioId));
        }),
        api.get('/fases'),
      ]);

      setUsuario(usuarioRes);
      const fasesData = fasesRes.data.data || fasesRes.data;
      setFases(Array.isArray(fasesData) ? fasesData : []);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!faseSelecionada || !usuarioId) {
      setErro('Selecione uma fase');
      return;
    }

    try {
      setSalvando(true);
      setErro('');
      setSucesso('');

      await api.post(`/fases/${faseSelecionada}/desbloquear/usuario/${usuarioId}`, {
        definirComoAtual: true,
      });

      setSucesso('Fase atual definida com sucesso!');
      setTimeout(() => {
        navigate('/admin/usuarios');
      }, 1500);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao definir fase atual');
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
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin/usuarios')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Definir Fase Atual: {usuario?.nome}
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        {sucesso && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {sucesso}
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Informações do Usuário
          </Typography>
          <Typography variant="body1">
            <strong>Nome:</strong> {usuario?.nome}
          </Typography>
          <Typography variant="body1">
            <strong>E-mail:</strong> {usuario?.email}
          </Typography>
          {usuario?.matricula && (
            <Typography variant="body1">
              <strong>Matrícula:</strong> {usuario.matricula}
            </Typography>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Selecionar Fase Atual do PDC
          </Typography>

          <FormControl fullWidth margin="normal">
            <InputLabel>Fase</InputLabel>
            <Select
              value={faseSelecionada}
              onChange={(e) => setFaseSelecionada(e.target.value as number)}
              label="Fase"
              disabled={salvando}
            >
              {fases.map((fase) => (
                <MenuItem key={fase.id} value={fase.id}>
                  {fase.titulo} {fase.jornada && `- ${fase.jornada.titulo}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mt: 2 }}>
            Ao definir uma fase como atual, ela será automaticamente desbloqueada para o usuário e outras fases serão marcadas como não atuais.
          </Alert>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => navigate('/admin/usuarios')} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={salvando ? <CircularProgress size={20} /> : <CheckIcon />}
              onClick={handleSalvar}
              disabled={salvando || !faseSelecionada}
            >
              {salvando ? 'Salvando...' : 'Definir como Fase Atual'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default DefinirFaseAtual;

