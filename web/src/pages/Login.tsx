import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
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
import { useToast } from '../contexts/ToastContext';
import { LoadingScreen } from '../components/LoadingScreen';
import { AnimatedBackground } from '../components/AnimatedBackground';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [errosCampos, setErrosCampos] = useState<{ email?: string; senha?: string }>({});
  const [enviando, setEnviando] = useState(false);
  const { login, usuario, isAuthenticated, isLoading } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();

  // Redirecionar se já estiver autenticado
  useEffect(() => {
    if (isAuthenticated && usuario) {
      if (usuario.tipo === 'ADMINISTRADOR') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
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
    setErrosCampos({});

    if (!validarFormulario()) {
      return;
    }

    try {
      setEnviando(true);
      await login(email, senha);
      // O redirecionamento será feito pelo useEffect quando o contexto atualizar
    } catch (error: any) {
      // Verificar se é erro de rede primeiro
      if (error.isNetworkError || !error.response) {
        showError('Erro de conexão. Verifique sua internet e tente novamente.', 'Erro de conexão');
        return;
      }

      // Extrair mensagem de erro da resposta da API
      let mensagemErro = 'Erro ao fazer login. Verifique suas credenciais e tente novamente.';
      const statusCode = error.response?.status;
      
      if (error.response?.data) {
        const data = error.response.data;
        // A API retorna: { success: false, error: { message: "..." } }
        if (data.error) {
          if (typeof data.error === 'string') {
            mensagemErro = data.error;
          } else if (data.error.message) {
            mensagemErro = data.error.message;
          }
        } else if (data.message) {
          mensagemErro = typeof data.message === 'string' ? data.message : String(data.message);
        }
      } else if (error.message) {
        mensagemErro = typeof error.message === 'string' ? error.message : String(error.message);
      }
      
      // Limpar mensagem se for um objeto serializado
      if (mensagemErro.startsWith('{') || mensagemErro === '[object Object]') {
        mensagemErro = 'Erro ao fazer login. Verifique suas credenciais e tente novamente.';
      }
      
      // Determinar o tipo de erro baseado no status code e mensagem
      const mensagemLower = mensagemErro.toLowerCase();
      
      // Erro 401 = Credenciais inválidas
      if (statusCode === 401 || mensagemLower.includes('credenciais inválidas') || mensagemLower.includes('credencial') || mensagemLower.includes('senha') || mensagemLower.includes('password') || mensagemLower.includes('incorreta') || mensagemLower.includes('inválida')) {
        showError('Credenciais inválidas. Verifique seu e-mail e senha.', 'Credenciais inválidas');
      } else if (statusCode === 404 || mensagemLower.includes('email') || mensagemLower.includes('usuário') || mensagemLower.includes('user') || mensagemLower.includes('não encontrado') || mensagemLower.includes('not found') || mensagemLower.includes('inexistente')) {
        showError('E-mail não encontrado. Verifique se o e-mail está correto.', 'E-mail não encontrado');
      } else if (statusCode === 500 || statusCode === 503 || mensagemLower.includes('servidor') || mensagemLower.includes('server')) {
        showError('Erro no servidor. Tente novamente em alguns instantes.', 'Erro no servidor');
      } else {
        // Mostrar mensagem amigável mesmo se não reconhecer o tipo
        showError('Não foi possível fazer login. Verifique suas credenciais e tente novamente.', 'Erro ao fazer login');
      }
    } finally {
      setEnviando(false);
    }
  };

  // Mostrar tela de loading durante o processo de login ou verificação inicial
  if (enviando || isLoading) {
    return <LoadingScreen message={enviando ? "Entrando..." : "Verificando autenticação..."} />;
  }

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        padding: 2,
        overflow: 'hidden',
      }}
    >
      {/* Fundo animado com interrogações, formas e partículas */}
      <AnimatedBackground />
      
      <Container 
        maxWidth="sm"
        sx={{
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 3,
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
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
              }}
              margin="normal"
              required
              error={!!errosCampos.email}
              helperText={errosCampos.email}
              disabled={enviando}
              autoComplete="email"
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                    borderWidth: 2,
                  },
                  '&:hover fieldset': {
                    borderColor: '#ff2c19',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ff2c19',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#6b7280',
                  transform: 'translate(14px, -9px) scale(0.75)',
                  '&.Mui-focused': {
                    color: '#ff2c19',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: '#011b49',
                  fontSize: '1rem',
                  padding: '14px',
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
              }}
              margin="normal"
              required
              error={!!errosCampos.senha}
              helperText={errosCampos.senha}
              disabled={enviando}
              autoComplete="current-password"
              InputLabelProps={{
                shrink: true,
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: '#ffffff',
                  '& fieldset': {
                    borderColor: '#e0e0e0',
                    borderWidth: 2,
                  },
                  '&:hover fieldset': {
                    borderColor: '#ff2c19',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#ff2c19',
                    borderWidth: 2,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#6b7280',
                  transform: 'translate(14px, -9px) scale(0.75)',
                  '&.Mui-focused': {
                    color: '#ff2c19',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: '#011b49',
                  fontSize: '1rem',
                  padding: '14px',
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
                      sx={{
                        color: '#6b7280',
                        '&:hover': {
                          color: '#ff2c19',
                        },
                      }}
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

