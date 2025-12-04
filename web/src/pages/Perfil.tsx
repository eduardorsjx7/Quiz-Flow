import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Grid,
  Divider,
  Alert,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Save as SaveIcon,
  Lock as LockIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirmDialog } from '../contexts/ConfirmDialogContext';
import { useNavigation } from '../contexts/NavigationContext';
import AdminLayout from '../components/AdminLayout';
import ParticipantLayout from '../components/ParticipantLayout';
import api from '../services/api';

const Perfil: React.FC = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const { showSuccess, showError } = useToast();
  const { confirm } = useConfirmDialog();
  const { registerInterceptor } = useNavigation();
  
  const [salvando, setSalvando] = useState(false);
  const [temAlteracoes, setTemAlteracoes] = useState(false);
  
  const [nome, setNome] = useState(usuario?.nome || '');
  const [email, setEmail] = useState(usuario?.email || '');
  const [nomeExibicao, setNomeExibicao] = useState(usuario?.nomeExibicao || '');
  
  const [nomeOriginal, setNomeOriginal] = useState(usuario?.nome || '');
  const [emailOriginal, setEmailOriginal] = useState(usuario?.email || '');
  const [nomeExibicaoOriginal, setNomeExibicaoOriginal] = useState(usuario?.nomeExibicao || '');
  
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const isAdmin = usuario?.tipo === 'ADMINISTRADOR';
  const Layout = isAdmin ? AdminLayout : ParticipantLayout;

  useEffect(() => {
    if (usuario) {
      const nomeUser = usuario.nome || '';
      const emailUser = usuario.email || '';
      const nomeExibicaoUser = usuario.nomeExibicao || '';
      
      setNome(nomeUser);
      setEmail(emailUser);
      setNomeExibicao(nomeExibicaoUser);
      setNomeOriginal(nomeUser);
      setEmailOriginal(emailUser);
      setNomeExibicaoOriginal(nomeExibicaoUser);
    }
  }, [usuario]);

  // Verificar se há alterações
  useEffect(() => {
    const houveAlteracao = 
      nome !== nomeOriginal ||
      email !== emailOriginal ||
      nomeExibicao !== nomeExibicaoOriginal ||
      senhaAtual !== '' ||
      novaSenha !== '' ||
      confirmarSenha !== '';
    
    setTemAlteracoes(houveAlteracao);
  }, [nome, email, nomeExibicao, senhaAtual, novaSenha, confirmarSenha, nomeOriginal, emailOriginal, nomeExibicaoOriginal]);

  // Registrar interceptor de navegação
  useEffect(() => {
    if (temAlteracoes) {
      registerInterceptor(async () => {
        const resultado = await confirm({
          title: 'Sair sem salvar?',
          message: 'Você tem alterações não salvas. Se sair agora, todas as alterações serão perdidas. Deseja continuar?',
          confirmText: 'Sim, sair',
          cancelText: 'Não',
          type: 'warning',
        });

        if (resultado) {
          setTemAlteracoes(false);
          return true;
        }
        return false;
      });
    } else {
      registerInterceptor(null);
    }

    return () => {
      registerInterceptor(null);
    };
  }, [temAlteracoes, registerInterceptor, confirm]);

  // Aviso ao fechar/recarregar a página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (temAlteracoes) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [temAlteracoes]);

  // Proteção contra botão voltar do navegador
  useEffect(() => {
    if (!temAlteracoes) return;

    window.history.pushState(null, '', window.location.pathname);

    const handlePopState = async () => {
      if (temAlteracoes) {
        window.history.pushState(null, '', window.location.pathname);

        const resultado = await confirm({
          title: 'Sair sem salvar?',
          message: 'Você tem alterações não salvas. Se sair agora, todas as alterações serão perdidas. Deseja continuar?',
          confirmText: 'Sim, sair',
          cancelText: 'Não',
          type: 'warning',
        });

        if (resultado) {
          setTemAlteracoes(false);
          window.removeEventListener('popstate', handlePopState);
          window.history.back();
        }
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [temAlteracoes, confirm]);

  const handleSalvar = async () => {
    // Validar nome
    if (!nome.trim()) {
      showError('O nome é obrigatório');
      return;
    }

    // Verificar se quer alterar senha também
    const alterandoSenhaJunto = senhaAtual !== '' || novaSenha !== '' || confirmarSenha !== '';

    if (alterandoSenhaJunto) {
      // Validar campos de senha
      if (!senhaAtual || !novaSenha || !confirmarSenha) {
        showError('Preencha todos os campos de senha ou deixe todos vazios');
        return;
      }

      if (novaSenha.length < 6) {
        showError('A nova senha deve ter pelo menos 6 caracteres');
        return;
      }

      if (novaSenha !== confirmarSenha) {
        showError('As senhas não coincidem');
        return;
      }
    }

    try {
      setSalvando(true);
      
      // Atualizar perfil
      await api.put(`/auth/usuarios/${usuario?.id}`, {
        nome: nome.trim(),
        email: email.trim() || undefined,
        nomeExibicao: nomeExibicao.trim() || undefined,
      });

      // Atualizar senha se preenchida
      if (alterandoSenhaJunto) {
        await api.put(`/auth/usuarios/${usuario?.id}/senha`, {
          senhaAtual,
          novaSenha,
        });
      }

      showSuccess(
        alterandoSenhaJunto 
          ? 'Perfil e senha atualizados com sucesso!' 
          : 'Perfil atualizado com sucesso!'
      );
      
      setTemAlteracoes(false);
      
      // Atualizar dados originais
      setNomeOriginal(nome.trim());
      setEmailOriginal(email.trim());
      setNomeExibicaoOriginal(nomeExibicao.trim());
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');
      
      // Atualizar dados no localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.nome = nome.trim();
      userData.email = email.trim();
      userData.nomeExibicao = nomeExibicao.trim();
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirecionar após salvar
      setTimeout(() => {
        navigate(-1);
      }, 1000);
    } catch (error: any) {
      showError(error.response?.data?.error || 'Erro ao salvar alterações');
    } finally {
      setSalvando(false);
    }
  };

  const handleCancelar = async () => {
    if (temAlteracoes) {
      const resultado = await confirm({
        title: 'Cancelar alterações?',
        message: 'Você tem alterações não salvas. Deseja realmente cancelar? Todas as alterações serão perdidas.',
        confirmText: 'Sim, cancelar',
        cancelText: 'Não',
        type: 'warning',
      });
      
      if (resultado) {
        setTemAlteracoes(false);
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <Layout title="Configurações do Perfil">
      <Container maxWidth="md">
        {/* Breadcrumbs */}
        <Box sx={{ mb: 3 }}>
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
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
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
            <Typography 
              color="text.primary"
              sx={{
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
            >
              Configurações
            </Typography>
          </Breadcrumbs>

          {/* Título Centralizado */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mb: 1 }}>
              <PersonIcon sx={{ fontSize: 32, color: '#e62816' }} />
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '2rem',
                  background: 'linear-gradient(135deg, #011b49 0%, #1a3a6b 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em',
                }}
              >
                Configurações do Perfil
              </Typography>
            </Box>
            <Typography 
              variant="body2" 
              sx={{ 
                color: 'text.secondary',
                fontSize: '0.875rem',
              }}
            >
              Gerencie suas informações pessoais e configurações de conta
            </Typography>
          </Box>
        </Box>

        {/* Informações do Perfil */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: '#ff2c19',
                fontSize: '2rem',
                fontWeight: 'bold',
              }}
            >
              {usuario?.nome?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ ml: 3, flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {usuario?.nome}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isAdmin ? 'Administrador' : 'Participante'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={salvando}
                required
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={salvando}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome de Exibição"
                value={nomeExibicao}
                onChange={(e) => setNomeExibicao(e.target.value)}
                disabled={salvando}
                helperText="Nome que aparecerá nos rankings (opcional)"
              />
            </Grid>
          </Grid>

        </Paper>

        {/* Alterar Senha */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <LockIcon /> Segurança
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Altere sua senha de acesso (opcional)
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            Deixe os campos de senha vazios se não quiser alterá-la
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Senha Atual"
                type="password"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                disabled={salvando}
                placeholder="Digite sua senha atual"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nova Senha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                disabled={salvando}
                placeholder="Mínimo 6 caracteres"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirmar Nova Senha"
                type="password"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                disabled={salvando}
                placeholder="Repita a nova senha"
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Botões de ação centralizados */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCancelar}
            disabled={salvando || !temAlteracoes}
            startIcon={<CancelIcon />}
            sx={{
              minWidth: 140,
              py: 1.2,
              borderColor: 'grey.300',
              opacity: temAlteracoes ? 1 : 0.5,
              '&:hover': {
                borderColor: temAlteracoes ? 'grey.400' : 'grey.300',
                bgcolor: temAlteracoes ? 'grey.50' : 'transparent',
              },
              '&:disabled': {
                opacity: 0.5,
                borderColor: 'grey.300',
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSalvar}
            disabled={salvando || !temAlteracoes}
            sx={{
              minWidth: 150,
              py: 1.2,
              bgcolor: '#ff2c19',
              opacity: temAlteracoes ? 1 : 0.5,
              '&:hover': {
                bgcolor: '#e62816',
              },
              '&:disabled': {
                bgcolor: '#ff2c19',
                opacity: 0.5,
              },
            }}
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </Box>
      </Container>
    </Layout>
  );
};

export default Perfil;

