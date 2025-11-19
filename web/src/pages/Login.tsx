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
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Quiz as QuizIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [errosCampos, setErrosCampos] = useState<{ email?: string; senha?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const { login, usuario, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && usuario) {
      if (usuario.tipo === 'ADMINISTRADOR') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/fase-atual', { replace: true });
      }
    }
  }, [isAuthenticated, usuario, navigate]);

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validarFormulario = (): boolean => {
    const novosErros: { email?: string; senha?: string } = {};

    if (!email.trim()) {
      novosErros.email = 'E-mail é obrigatório';
    } else if (!validarEmail(email)) {
      novosErros.email = 'E-mail inválido';
    }

    if (!senha.trim()) {
      novosErros.senha = 'Senha é obrigatória';
    } else if (senha.length < 3) {
      novosErros.senha = 'Senha deve ter pelo menos 3 caracteres';
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
      setEnviando(true);
      await login(email, senha);
      // O redirecionamento será feito pelo useEffect quando o contexto atualizar
    } catch (error: any) {
      const mensagemErro = error.response?.data?.error || error.response?.data?.message || error.message || 'Erro ao fazer login. Verifique suas credenciais.';
      setErro(mensagemErro);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={10}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.98)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                mb: 2,
              }}
            >
              <QuizIcon sx={{ fontSize: 50, color: 'white' }} />
            </Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
              Quiz Flow
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Sistema de Avaliação e Capacitação Corporativa
            </Typography>
          </Box>

          {erro && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErro('')}>
              {erro}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
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
                if (erro) setErro('');
              }}
              margin="normal"
              required
              error={!!errosCampos.email}
              helperText={errosCampos.email}
              disabled={enviando}
              autoComplete="email"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            <TextField
              fullWidth
              label="Senha"
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                if (errosCampos.senha) {
                  setErrosCampos({ ...errosCampos, senha: undefined });
                }
                if (erro) setErro('');
              }}
              margin="normal"
              required
              error={!!errosCampos.senha}
              helperText={errosCampos.senha}
              disabled={enviando}
              autoComplete="current-password"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      edge="end"
                      disabled={enviando}
                    >
                      {mostrarSenha ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              startIcon={enviando ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5568d3 0%, #6a3d8f 100%)',
                },
                fontWeight: 600,
              }}
              disabled={enviando}
            >
              {enviando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Entre com suas credenciais para acessar o sistema
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;

