import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Link,
  IconButton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import api from '../../services/api';
import AdminLayout from '../../components/AdminLayout';
import FasesTabuleiro from '../../components/FasesTabuleiro';

interface Fase {
  id: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  totalPerguntas?: number;
  _count: {
    quizzes: number;
  };
}

interface Jornada {
  id: number;
  titulo: string;
  fases: Fase[];
}

const FasesJornada: React.FC = () => {
  const { jornadaId } = useParams<{ jornadaId: string }>();
  const navigate = useNavigate();
  const [jornada, setJornada] = useState<Jornada | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregarFasesJornada = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/jornadas/${jornadaId}`);
      const dados = response.data.data || response.data;
      setJornada(dados);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar fases da jornada');
    } finally {
      setLoading(false);
    }
  }, [jornadaId]);

  useEffect(() => {
    if (jornadaId) {
      carregarFasesJornada();
    }
  }, [jornadaId, carregarFasesJornada]);

  if (loading) {
    return (
      <AdminLayout title="Fases da Jornada">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (erro || !jornada) {
    return (
      <AdminLayout title="Fases da Jornada">
        <Container maxWidth="lg">
          <Alert severity="error" sx={{ mb: 2 }}>
            {erro || 'Jornada não encontrada'}
          </Alert>
          <Button onClick={() => navigate('/admin/fases')} startIcon={<ArrowBackIcon />}>
            Voltar
          </Button>
        </Container>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Fases - ${jornada.titulo}`}>
      <Container maxWidth="lg">
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
            onClick={() => navigate('/admin/fases')}
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
            Fases das Jornadas
          </Link>
          <Typography 
            color="text.primary"
            sx={{
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            {jornada.titulo}
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton 
              onClick={() => navigate('/admin/fases')} 
              size="small"
              sx={{
                '&:hover': {
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
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
                {jornada.titulo}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: '0.875rem',
                  mt: 0.5,
                }}
              >
                Gerencie as fases desta jornada e cadastre as perguntas
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate(`/admin/jornadas/${jornadaId}/configurar?adicionarFase=true`)}
              sx={{
                width: 48,
                height: 48,
                bgcolor: '#ff2c19',
                color: '#ffffff',
                border: '2px solid #e62816',
                borderRadius: '50%',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: '#e62816',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(255, 44, 25, 0.4)',
                },
              }}
              title="Adicionar Fase"
            >
              <AddIcon />
            </IconButton>
            <IconButton
              onClick={() => navigate(`/admin/jornadas/${jornadaId}/configurar`)}
              sx={{
                width: 48,
                height: 48,
                bgcolor: '#ff2c19',
                color: '#ffffff',
                border: '2px solid #e62816',
                borderRadius: '50%',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: '#e62816',
                  transform: 'scale(1.1)',
                  boxShadow: '0 4px 12px rgba(255, 44, 25, 0.4)',
                },
              }}
              title="Configurar Jornada"
            >
              <SettingsIcon />
            </IconButton>
          </Box>
        </Box>

        {erro && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErro('')}>
            {erro}
          </Alert>
        )}

        {jornada.fases.length === 0 ? (
          <Alert severity="info">
            Nenhuma fase cadastrada nesta jornada ainda.
          </Alert>
        ) : (
          <Box sx={{ mb: 3 }}>
            <FasesTabuleiro
              fases={jornada.fases.map((fase) => ({
                id: fase.id,
                ordem: fase.ordem,
                titulo: fase.titulo,
                desbloqueada: true,
                bloqueada: false,
                faseAberta: true,
                ativo: true,
              }))}
              onFaseClick={(faseId) => {
                navigate(`/admin/fases/${faseId}/perguntas`);
              }}
              isAdmin={true}
              showConnections={true}
            />
          </Box>
        )}
      </Container>
    </AdminLayout>
  );
};

export default FasesJornada;

