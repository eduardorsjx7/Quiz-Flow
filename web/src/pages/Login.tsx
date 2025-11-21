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
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { QuestionIconBackground } from '../components/QuestionIconBackground';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [errosCampos, setErrosCampos] = useState<{ email?: string; senha?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const { login, usuario, isAuthenticated, isLoading } = useAuth();
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

  // Mostrar tela de loading durante o processo de login ou verificação inicial
  if (enviando || isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        padding: 2,
        overflow: 'hidden',
      }}
    >
      {/* Fundo animado com caixinhas de ícone flutuantes */}
      <QuestionIconBackground />
      
      <Container 
        maxWidth="sm"
        sx={{
          position: 'relative',
          zIndex: 1,
        }}
      >
      
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img 
              src="/logo/logo1.svg" 
              alt="Quiz Flow Logo" 
              style={{ height: '100px', width: 'auto', marginBottom: '16px' }}
            />
            <Typography variant="subtitle1" color="text.secondary" sx={{ color: '#6b7280' }}>
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
                background: 'linear-gradient(135deg, #ff2c19 0%, #e62816 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #e62816 0%, #ff2c19 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(255, 44, 25, 0.3)',
                },
                fontWeight: 600,
                transition: 'all 0.3s ease-in-out',
              }}
              disabled={enviando}
            >
              {enviando ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Entre com suas credenciais para acessar.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;

