import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  TextField,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import api from '../../services/api';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  matricula?: string;
}

interface Grupo {
  id: number;
  nome: string;
  descricao?: string;
  _count?: {
    usuarios: number;
  };
}

interface Quiz {
  id: number;
  titulo: string;
}

const AtribuirQuiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [usuariosSelecionados, setUsuariosSelecionados] = useState<number[]>([]);
  const [gruposSelecionados, setGruposSelecionados] = useState<number[]>([]);
  const [abaAtiva, setAbaAtiva] = useState(0);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');

  const carregarDados = useCallback(async () => {
    if (!quizId) return;
    
    try {
      setLoading(true);
      setErro('');

      const [quizRes, usuariosRes, gruposRes] = await Promise.all([
        api.get(`/quizzes/${quizId}`),
        api.get('/auth/usuarios'),
        api.get('/grupos'),
      ]);

      setQuiz(quizRes.data.data || quizRes.data);
      setUsuarios(usuariosRes.data.data || usuariosRes.data);

      setGrupos(gruposRes.data.data || gruposRes.data);

      // Carregar atribuições existentes
      try {
        const atribuicoesRes = await api.get(`/atribuicoes/quiz/${quizId}`);
        const atribuicoes = atribuicoesRes.data;
        const usuariosAtribuidos = atribuicoes
          .filter((a: any) => a.usuarioId)
          .map((a: any) => a.usuarioId);
        const gruposAtribuidos = atribuicoes
          .filter((a: any) => a.grupoId)
          .map((a: any) => a.grupoId);
        setUsuariosSelecionados(usuariosAtribuidos);
        setGruposSelecionados(gruposAtribuidos);
      } catch (error) {
        console.error('Erro ao carregar atribuições:', error);
      }
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleSalvar = async () => {
    if (usuariosSelecionados.length === 0 && gruposSelecionados.length === 0) {
      setErro('Selecione pelo menos um usuário ou grupo');
      return;
    }

    try {
      setSalvando(true);
      setErro('');
      setSucesso('');

      await api.post(`/atribuicoes/quiz/${quizId}`, {
        usuarioIds: usuariosSelecionados,
        grupoIds: gruposSelecionados,
      });

      setSucesso('Quiz atribuído com sucesso!');
      setTimeout(() => {
        navigate('/admin/fases');
      }, 1500);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao atribuir quiz');
    } finally {
      setSalvando(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.nome.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
      u.email?.toLowerCase().includes(filtroUsuario.toLowerCase()) ||
      u.matricula?.toLowerCase().includes(filtroUsuario.toLowerCase())
  );

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
            Atribuir Quiz: {quiz?.titulo}
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

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Selecione usuários e/ou grupos para atribuir este quiz
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={abaAtiva} onChange={(_, novoValor) => setAbaAtiva(novoValor)}>
              <Tab label={`Usuários (${usuariosSelecionados.length} selecionados)`} />
              <Tab label={`Grupos (${gruposSelecionados.length} selecionados)`} />
            </Tabs>
          </Box>

          {abaAtiva === 0 && (
            <Box>
              <TextField
                fullWidth
                label="Buscar usuário"
                variant="outlined"
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Nome, e-mail ou matrícula"
              />
              <FormControl fullWidth>
                <InputLabel>Usuários</InputLabel>
                <Select
                  multiple
                  value={usuariosSelecionados}
                  onChange={(e) => setUsuariosSelecionados(e.target.value as number[])}
                  input={<OutlinedInput label="Usuários" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const usuario = usuarios.find((u) => u.id === id);
                        return (
                          <Chip
                            key={id}
                            label={usuario ? `${usuario.nome} (${usuario.email})` : id}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {usuariosFiltrados.map((usuario) => (
                    <MenuItem key={usuario.id} value={usuario.id}>
                      <Checkbox checked={usuariosSelecionados.indexOf(usuario.id) > -1} />
                      <ListItemText
                        primary={usuario.nome}
                        secondary={`${usuario.email}${usuario.matricula ? ` • ${usuario.matricula}` : ''}`}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {usuariosFiltrados.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Nenhum usuário encontrado. Certifique-se de que existem usuários cadastrados no sistema.
                </Alert>
              )}
            </Box>
          )}

          {abaAtiva === 1 && (
            <Box>
              <FormControl fullWidth>
                <InputLabel>Grupos/Departamentos</InputLabel>
                <Select
                  multiple
                  value={gruposSelecionados}
                  onChange={(e) => setGruposSelecionados(e.target.value as number[])}
                  input={<OutlinedInput label="Grupos/Departamentos" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((id) => {
                        const grupo = grupos.find((g) => g.id === id);
                        return (
                          <Chip
                            key={id}
                            label={grupo ? `${grupo.nome} (${grupo._count?.usuarios || 0} usuários)` : id}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {grupos.map((grupo) => (
                    <MenuItem key={grupo.id} value={grupo.id}>
                      <Checkbox checked={gruposSelecionados.indexOf(grupo.id) > -1} />
                      <ListItemText
                        primary={grupo.nome}
                        secondary={`${grupo._count?.usuarios || 0} usuários${grupo.descricao ? ` • ${grupo.descricao}` : ''}`}
                      />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {grupos.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Nenhum grupo cadastrado. Crie grupos primeiro para atribuir quizzes a departamentos inteiros.
                </Alert>
              )}
            </Box>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => navigate('/admin/fases')}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={salvando ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSalvar}
              disabled={salvando || (usuariosSelecionados.length === 0 && gruposSelecionados.length === 0)}
            >
              {salvando ? 'Salvando...' : 'Salvar Atribuições'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default AtribuirQuiz;

