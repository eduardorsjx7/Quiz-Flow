import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Lock as LockIconMUI, LockOpen as LockOpenIconMUI } from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ParticipantLayout from '../components/ParticipantLayout';
import { LoadingScreen } from '../components/LoadingScreen';

interface Fase {
  id: number;
  titulo: string;
  descricao?: string;
  ordem: number;
  desbloqueada: boolean;
  faseAtual?: boolean;
  jornada?: {
    id: number;
    titulo: string;
  };
  quizzes: Array<{
    id: number;
    titulo: string;
    _count: {
      perguntas: number;
    };
  }>;
}

const Fases: React.FC = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [fases, setFases] = useState<Fase[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregarFases = useCallback(async () => {
    try {
      setLoading(true);
      // Se for colaborador, mostrar apenas a fase atual
      const url = isAdmin ? '/fases' : '/fases?apenasFaseAtual=true';
      const response = await api.get(url);
      const dados = response.data.data || response.data;
      setFases(Array.isArray(dados) ? dados : []);
    } catch (error: any) {
      setErro(error.response?.data?.error || 'Erro ao carregar fases');
      setFases([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    carregarFases();
  }, [carregarFases]);

  const handleAbrirFase = (faseId: number) => {
    if (isAdmin) {
      navigate(`/admin/fases/${faseId}`);
    } else {
      navigate(`/fases/${faseId}/quizzes`);
    }
  };

  if (loading) {
    return <LoadingScreen message="Carregando fases..." />;
  }

  return (
    <ParticipantLayout title="Fases">
      <Container maxWidth="lg">
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Fases de Avaliação
        </Typography>

      {erro && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {erro}
        </Alert>
      )}

      {fases.length === 0 ? (
        <Alert severity="info">
          Nenhuma fase disponível no momento.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {fases.map((fase) => (
            <Grid item xs={12} md={6} lg={4} key={fase.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  opacity: fase.desbloqueada ? 1 : 0.6,
                  cursor: fase.desbloqueada ? 'pointer' : 'not-allowed',
                }}
                onClick={() => fase.desbloqueada && handleAbrirFase(fase.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Typography variant="h5" component="h2">
                      {fase.titulo}
                    </Typography>
                    {fase.desbloqueada ? (
                      <LockOpenIconMUI color="success" />
                    ) : (
                      <LockIconMUI color="disabled" />
                    )}
                  </Box>
                  {fase.jornada && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Jornada: {fase.jornada.titulo}
                    </Typography>
                  )}
                  {fase.faseAtual && (
                    <Chip
                      label="Fase Atual"
                      color="primary"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  )}
                  {fase.descricao && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {fase.descricao}
                    </Typography>
                  )}
                  <Chip
                    label={`${fase.quizzes.length} ${fase.quizzes.length === 1 ? 'Quiz' : 'Quizzes'}`}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    disabled={!fase.desbloqueada}
                    onClick={() => fase.desbloqueada && handleAbrirFase(fase.id)}
                  >
                    {fase.desbloqueada ? 'Acessar' : 'Bloqueada'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      </Container>
    </ParticipantLayout>
  );
};

export default Fases;

