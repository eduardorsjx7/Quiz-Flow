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

const CriarUsuario: React.FC = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [matricula, setMatricula] = useState('');
  const [tipo, setTipo] = useState<'COLABORADOR' | 'ADMINISTRADOR'>('COLABORADOR');
  const [grupoId, setGrupoId] = useState<number | ''>('');
  const [grupos, setGrupos] = useState<any[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [errosCampos, setErrosCampos] = useState<{
    nome?: string;
    email?: string;
    senha?: string;
  }>({});

  React.useEffect(() => {
    carregarGrupos();
  }, []);

  const carregarGrupos = async () => {
    try {
      const response = await api.get('/grupos');
      setGrupos(response.data.data || response.data || []);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
    }
  };

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarFormulario = (): boolean => {
    const novosErros: { nome?: string; email?: string; senha?: string } = {};

    if (!nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
    } else if (nome.trim().length < 3) {
      novosErros.nome = 'Nome deve ter pelo menos 3 caracteres';
    }

    if (!email.trim()) {
      novosErros.email = 'E-mail é obrigatório';
    } else if (!validarEmail(email)) {
      novosErros.email = 'E-mail inválido';
    }

    if (!senha.trim()) {
      novosErros.senha = 'Senha é obrigatória';
    } else if (senha.length < 6) {
      novosErros.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrosCampos(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSalvar = async () => {
    setErro('');
    setSucesso('');
    setErrosCampos({});

    if (!validarFormulario()) {
      return;
    }

    try {
      setSalvando(true);
      await api.post('/auth/criar-usuario', {
        nome: nome.trim(),
        email: email.trim(),
        senha,
        matricula: matricula.trim() || undefined,
        tipo,
        grupoId: grupoId || undefined,
      });

      setSucesso('Usuário criado com sucesso!');
      setTimeout(() => {
        navigate('/admin/usuarios');
      }, 1500);
    } catch (error: any) {
      setErro(error.response?.data?.error || error.response?.data?.message || 'Erro ao criar usuário');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={() => navigate('/admin/usuarios')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Criar Novo Usuário
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
            Informações do Usuário
          </Typography>

          <TextField
            fullWidth
            label="Nome"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              if (errosCampos.nome) {
                setErrosCampos({ ...errosCampos, nome: undefined });
              }
            }}
            margin="normal"
            required
            error={!!errosCampos.nome}
            helperText={errosCampos.nome}
            disabled={salvando}
          />

          <TextField
            fullWidth
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errosCampos.email) {
                setErrosCampos({ ...errosCampos, email: undefined });
              }
            }}
            margin="normal"
            required
            error={!!errosCampos.email}
            helperText={errosCampos.email}
            disabled={salvando}
          />

          <TextField
            fullWidth
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => {
              setSenha(e.target.value);
              if (errosCampos.senha) {
                setErrosCampos({ ...errosCampos, senha: undefined });
              }
            }}
            margin="normal"
            required
            error={!!errosCampos.senha}
            helperText={errosCampos.senha}
            disabled={salvando}
          />

          <TextField
            fullWidth
            label="Matrícula"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            margin="normal"
            disabled={salvando}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Tipo de Usuário</InputLabel>
            <Select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as 'COLABORADOR' | 'ADMINISTRADOR')}
              label="Tipo de Usuário"
              disabled={salvando}
            >
              <MenuItem value="COLABORADOR">Colaborador</MenuItem>
              <MenuItem value="ADMINISTRADOR">Administrador</MenuItem>
            </Select>
          </FormControl>

          {tipo === 'COLABORADOR' && (
            <FormControl fullWidth margin="normal">
              <InputLabel>Grupo/Departamento</InputLabel>
              <Select
                value={grupoId}
                onChange={(e) => setGrupoId(e.target.value as number | '')}
                label="Grupo/Departamento"
                disabled={salvando}
              >
                <MenuItem value="">Nenhum</MenuItem>
                {grupos.map((grupo) => (
                  <MenuItem key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="outlined" onClick={() => navigate('/admin/usuarios')} disabled={salvando}>
              Cancelar
            </Button>
            <Button
              variant="contained"
              startIcon={salvando ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSalvar}
              disabled={salvando}
            >
              {salvando ? 'Salvando...' : 'Criar Usuário'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
};

export default CriarUsuario;

